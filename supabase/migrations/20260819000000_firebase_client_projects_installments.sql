/*
  Firebase Auth + client projects + installment billing

  - profiles keyed by Firebase UID (text)
  - admin_users / job_applications / orders.user_id become text (no auth.users FK)
  - client_projects for user-owned work
  - payment_installments for admin-prompted (or pay-in-full) DPO charges
*/

CREATE OR REPLACE FUNCTION public.firebase_uid()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() ->> 'sub', NULLIF(auth.uid()::text, ''));
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_idx
  ON public.profiles (lower(email))
  WHERE email IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = public.firebase_uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = public.firebase_uid())
  WITH CHECK (id = public.firebase_uid());

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ---------------------------------------------------------------------------
-- admin_users: Firebase UID as text PK
-- Postgres cannot ALTER a column used by ANY policy (including other tables).
-- Drop those policies, change the type, then recreate them with firebase_uid().
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._policy_restore_tmp (
  seq serial PRIMARY KEY,
  sql text NOT NULL
);
TRUNCATE public._policy_restore_tmp;

DO $$
DECLARE
  rec record;
  using_expr text;
  check_expr text;
  cmd text;
  to_clause text;
  restore_sql text;
BEGIN
  FOR rec IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      p.polname AS policy_name,
      p.polcmd,
      p.polpermissive,
      pg_get_expr(p.polqual, p.polrelid) AS using_expr,
      pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr,
      (
        SELECT string_agg(quote_ident(r.rolname), ', ' ORDER BY r.rolname)
        FROM pg_roles r
        WHERE r.oid = ANY (p.polroles)
      ) AS roles
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND (
        c.oid = 'public.admin_users'::regclass
        OR COALESCE(pg_get_expr(p.polqual, p.polrelid), '') ILIKE '%admin_users%'
        OR COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') ILIKE '%admin_users%'
      )
  LOOP
    using_expr := rec.using_expr;
    check_expr := rec.check_expr;
    IF using_expr IS NOT NULL THEN
      using_expr := replace(using_expr, 'auth.uid()', 'public.firebase_uid()');
    END IF;
    IF check_expr IS NOT NULL THEN
      check_expr := replace(check_expr, 'auth.uid()', 'public.firebase_uid()');
    END IF;

    cmd := CASE rec.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      ELSE 'ALL'
    END;

    to_clause := CASE
      WHEN rec.roles IS NULL OR rec.roles = '' THEN ''
      ELSE ' TO ' || rec.roles
    END;

    restore_sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s%s%s%s',
      rec.policy_name,
      rec.schema_name,
      rec.table_name,
      CASE WHEN rec.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      cmd,
      to_clause,
      CASE WHEN using_expr IS NOT NULL THEN ' USING (' || using_expr || ')' ELSE '' END,
      CASE WHEN check_expr IS NOT NULL THEN ' WITH CHECK (' || check_expr || ')' ELSE '' END
    );

    INSERT INTO public._policy_restore_tmp(sql) VALUES (restore_sql);
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      rec.policy_name,
      rec.schema_name,
      rec.table_name
    );
  END LOOP;
END $$;

ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_id_fkey;
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_pkey;

ALTER TABLE public.admin_users
  ALTER COLUMN id TYPE text USING id::text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_users_pkey' AND conrelid = 'public.admin_users'::regclass
  ) THEN
    ALTER TABLE public.admin_users ADD PRIMARY KEY (id);
  END IF;
END $$;

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN SELECT sql FROM public._policy_restore_tmp ORDER BY seq LOOP
    BEGIN
      EXECUTE rec.sql;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END $$;

DROP TABLE IF EXISTS public._policy_restore_tmp;

DROP POLICY IF EXISTS "Users can view their own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin users" ON public.admin_users;

CREATE POLICY "Users can view their own admin status"
  ON public.admin_users FOR SELECT TO authenticated
  USING (id = public.firebase_uid());

CREATE POLICY "Admins can manage admin users"
  ON public.admin_users FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = public.firebase_uid() AND au.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.id = public.firebase_uid() AND au.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- job_applications.user_id
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT c.relname AS table_name, p.polname AS policy_name
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'job_applications'
      AND (
        COALESCE(pg_get_expr(p.polqual, p.polrelid), '') ILIKE '%user_id%'
        OR COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') ILIKE '%user_id%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.policy_name, rec.table_name);
  END LOOP;
END $$;

ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_user_id_fkey;

ALTER TABLE public.job_applications
  ALTER COLUMN user_id TYPE text USING user_id::text;

DROP POLICY IF EXISTS "Applicants can insert own job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Applicants can view own job applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admins can manage job applications" ON public.job_applications;

CREATE POLICY "Applicants can insert own job applications"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = public.firebase_uid());

CREATE POLICY "Applicants can view own job applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (user_id = public.firebase_uid());

CREATE POLICY "Admins can manage job applications"
  ON public.job_applications FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = public.firebase_uid() AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = public.firebase_uid() AND admin_users.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- orders.user_id
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT c.relname AS table_name, p.polname AS policy_name
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'orders'
      AND (
        COALESCE(pg_get_expr(p.polqual, p.polrelid), '') ILIKE '%user_id%'
        OR COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') ILIKE '%user_id%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.policy_name, rec.table_name);
  END LOOP;
END $$;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

ALTER TABLE public.orders
  ALTER COLUMN user_id TYPE text USING user_id::text;

DROP POLICY IF EXISTS "Users can view own orders (by user_id)" ON public.orders;

CREATE POLICY "Users can view own orders (by user_id)"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = public.firebase_uid());

-- ---------------------------------------------------------------------------
-- client_projects
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  service_id uuid,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'in_review', 'active', 'paused', 'completed', 'cancelled')),
  agreed_total numeric,
  amount_paid numeric NOT NULL DEFAULT 0,
  admin_notes text,
  progress_note text,
  customer_name text,
  customer_email text,
  customer_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_projects_user_id ON public.client_projects (user_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_status ON public.client_projects (status);
CREATE INDEX IF NOT EXISTS idx_client_projects_created_at ON public.client_projects (created_at DESC);

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own client projects" ON public.client_projects;
DROP POLICY IF EXISTS "Users can view own client projects" ON public.client_projects;
DROP POLICY IF EXISTS "Users can update own client projects" ON public.client_projects;
DROP POLICY IF EXISTS "Admins can manage client projects" ON public.client_projects;

CREATE POLICY "Users can insert own client projects"
  ON public.client_projects FOR INSERT TO authenticated
  WITH CHECK (user_id = public.firebase_uid());

CREATE POLICY "Users can view own client projects"
  ON public.client_projects FOR SELECT TO authenticated
  USING (user_id = public.firebase_uid());

CREATE POLICY "Users can update own client projects"
  ON public.client_projects FOR UPDATE TO authenticated
  USING (user_id = public.firebase_uid())
  WITH CHECK (user_id = public.firebase_uid());

CREATE POLICY "Admins can manage client projects"
  ON public.client_projects FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = public.firebase_uid() AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = public.firebase_uid() AND admin_users.is_active = true
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.client_projects TO authenticated;
GRANT ALL ON public.client_projects TO service_role;

-- ---------------------------------------------------------------------------
-- payment_installments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_project_id uuid NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  kind text NOT NULL DEFAULT 'installment'
    CHECK (kind IN ('installment', 'balance')),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'paid', 'cancelled')),
  trans_token text,
  status_token uuid NOT NULL DEFAULT gen_random_uuid(),
  note text,
  payment_reference text,
  requested_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_installments_project
  ON public.payment_installments (client_project_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_trans_token
  ON public.payment_installments (trans_token)
  WHERE trans_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_installments_status_token
  ON public.payment_installments (status_token);

ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own installments" ON public.payment_installments;
DROP POLICY IF EXISTS "Admins can manage installments" ON public.payment_installments;

CREATE POLICY "Users can view own installments"
  ON public.payment_installments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_projects
      WHERE client_projects.id = payment_installments.client_project_id
        AND client_projects.user_id = public.firebase_uid()
    )
  );

CREATE POLICY "Admins can manage installments"
  ON public.payment_installments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = public.firebase_uid() AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = public.firebase_uid() AND admin_users.is_active = true
    )
  );

GRANT SELECT ON public.payment_installments TO authenticated;
GRANT ALL ON public.payment_installments TO service_role;
