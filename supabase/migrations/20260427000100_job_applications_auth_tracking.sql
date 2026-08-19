/*
  # Tie job applications to authenticated users

  ## Why
  Careers applications should require account creation so applicants can track their submissions.

  ## What
  - Add `user_id` to `job_applications` referencing `auth.users(id)`
  - Backfill `user_id` where possible using email match (best-effort)
  - Add RLS policies:
    - Applicants can insert/select their own applications
    - Admins (from `admin_users`) can manage all applications
*/

-- 1) Add column + FK (idempotent)
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'job_applications'
      AND tc.constraint_name = 'job_applications_user_id_fkey'
  ) THEN
    ALTER TABLE job_applications
      ADD CONSTRAINT job_applications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2) Best-effort backfill for existing rows (email match)
UPDATE job_applications ja
SET user_id = u.id
FROM auth.users u
WHERE ja.user_id IS NULL
  AND lower(ja.email) = lower(u.email);

-- 3) Index for faster per-user queries
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);

-- 4) RLS policies
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage job applications" ON job_applications;
DROP POLICY IF EXISTS "Applicants can insert own job applications" ON job_applications;
DROP POLICY IF EXISTS "Applicants can view own job applications" ON job_applications;

-- Applicants can submit applications for themselves
CREATE POLICY "Applicants can insert own job applications"
  ON job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Applicants can view only their own applications
CREATE POLICY "Applicants can view own job applications"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all applications
CREATE POLICY "Admins can manage job applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

