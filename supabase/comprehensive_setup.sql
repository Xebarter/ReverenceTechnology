-- Comprehensive Database Setup for Reverence Technology Application
-- This script creates all necessary tables, relationships, storage buckets, functions, and policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL,
  description text NOT NULL,
  key_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_audience jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_pricing text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  service_interest text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Create hero_images table
CREATE TABLE IF NOT EXISTS hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  role text,
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  avatar_url text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  employment_type text NOT NULL,
  salary_range text,
  responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean DEFAULT false,
  application_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cover_letter text,
  resume_url text,
  status text DEFAULT 'new',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  cover_image_url text,
  author text NOT NULL,
  category_id uuid REFERENCES blog_categories(id) ON DELETE SET NULL,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_users table for role-based access control
-- Using flexible version without foreign key constraint to auth.users
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY, -- Remove foreign key constraint temporarily
  email text NOT NULL UNIQUE,
  full_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON blog_categories;
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set published_at when a post is published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set published_at for blog posts
DROP TRIGGER IF EXISTS set_published_at_trigger ON blog_posts;
CREATE TRIGGER set_published_at_trigger
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();

-- Add function to get user by email from auth.users table
CREATE OR REPLACE FUNCTION get_user_by_email(email_address TEXT)
RETURNS TABLE (
  id uuid,
  email TEXT
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email
  FROM auth.users u
  WHERE u.email = email_address;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to reload the schema
CREATE OR REPLACE FUNCTION reload_schema()
RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for services
INSERT INTO services (package_name, description, key_features, target_audience, suggested_pricing, display_order)
VALUES
  ('Starter Web Package', 'A foundational online presence package for businesses taking their first digital steps.', '["5-page website", "Responsive design", "Mobile optimization", "Basic SEO", ".ug domain setup"]'::jsonb, '["Local shops", "Startups", "NGOs in Kampala or district towns"]'::jsonb, 'UGX 500,000 – 1,000,000', 1),
  ('E-Commerce Growth Kit', 'Custom online stores optimized for mobile money and regional delivery systems.', '["Product catalog", "Payment integration (MTN, Airtel, Pesapal)", "Stock management", "Delivery tracking"]'::jsonb, '["Fashion boutiques", "Food vendors", "Local supermarkets"]'::jsonb, 'UGX 1,500,000 – 3,000,000', 2),
  ('Custom Software Bundle', 'Tailored software solutions that streamline operations and fit local workflows.', '["Web/mobile app development", "USSD/SMS gateway", "Data dashboards", "Admin console"]'::jsonb, '["Agri-tech startups", "Health centers", "Logistics firms"]'::jsonb, 'UGX 2,000,000 – 4,000,000 (one-time + maintenance)', 3),
  ('Cloud Migration Pro', 'Hassle-free transition to the cloud with guaranteed data protection.', '["AWS/Azure setup", "Backup automation", "API integrations", "Compliance with local data policies"]'::jsonb, '["Fintechs", "NGOs", "Universities"]'::jsonb, 'UGX 3,000,000 – 5,000,000', 4),
  ('Cyber Security Shield', 'Robust protection from cyber threats increasingly targeting African enterprises.', '["Firewalls", "Anti-phishing protection", "Employee training", "24/7 threat monitoring"]'::jsonb, '["Banks", "Ministries", "Corporate firms"]'::jsonb, 'UGX 2,500,000+', 5)
ON CONFLICT DO NOTHING;

-- Insert sample data for blog categories
INSERT INTO blog_categories (name, slug, description)
VALUES 
  ('Technology', 'technology', 'Posts about technology trends and innovations'),
  ('Business', 'business', 'Business insights and strategies'),
  ('Engineering', 'engineering', 'Engineering practices and methodologies')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample job data
INSERT INTO jobs (title, description, location, employment_type, salary_range, responsibilities, requirements, benefits, is_published)
VALUES 
  ('Senior Frontend Developer', 'We are looking for an experienced frontend developer to join our team and help build cutting-edge web applications for our clients in East Africa.', 'Kampala, Uganda (Remote available)', 'Full-time', '$1,200 - $1,800', '["Develop responsive web applications using React and TypeScript", "Collaborate with UX/UI designers to implement pixel-perfect interfaces", "Optimize applications for maximum speed and scalability", "Participate in code reviews and contribute to team knowledge sharing"]'::jsonb, '["3+ years of experience with React and TypeScript", "Strong knowledge of modern CSS and responsive design", "Experience with state management libraries (Redux, Context API)", "Familiarity with testing frameworks like Jest and React Testing Library"]'::jsonb, '["Competitive salary", "Flexible working hours", "Health insurance", "Professional development opportunities"]'::jsonb, true),
  ('DevOps Engineer', 'Join our infrastructure team to design and maintain our cloud-based solutions that power businesses across East Africa.', 'Kampala, Uganda (Remote available)', 'Full-time', '$1,500 - $2,200', '["Design and implement CI/CD pipelines", "Manage cloud infrastructure on AWS/GCP", "Monitor and optimize system performance", "Ensure security and compliance of our infrastructure"]'::jsonb, '["3+ years of DevOps experience", "Strong knowledge of Docker and Kubernetes", "Experience with cloud platforms (AWS, GCP)", "Proficiency in Infrastructure as Code tools (Terraform)"]'::jsonb, '["Competitive salary", "Remote work options", "Learning budget for conferences and courses", "Stock options"]'::jsonb, true)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_hero_images_is_active ON hero_images(is_active);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_is_published ON jobs(is_published);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for services table
CREATE POLICY "Services are publicly readable"
  ON services
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage services"
  ON services
  FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policies for inquiries table
CREATE POLICY "Users can create inquiries"
  ON inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view and manage inquiries"
  ON inquiries
  FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policies for hero_images table
CREATE POLICY "Active hero images are publicly readable"
  ON hero_images
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage hero images"
  ON hero_images
  FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policies for testimonials table
CREATE POLICY "Active testimonials are publicly readable"
  ON testimonials
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage testimonials"
  ON testimonials
  FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy for public to view published jobs
CREATE POLICY "Published jobs are publicly readable"
  ON jobs
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Policy for admins to manage jobs
CREATE POLICY "Admins can manage jobs"
  ON jobs
  FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policy for admins to manage job applications
CREATE POLICY "Admins can manage job applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policies for blog_categories table
CREATE POLICY "Blog categories are publicly readable"
  ON blog_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage blog categories"
  ON blog_categories
  FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Policies for blog_posts table
CREATE POLICY "Published blog posts are publicly readable"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage blog posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (EXISTS(
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND admin_users.is_active = true
  ));

-- Create policies for admin_users table
-- Policy to allow users to read their own admin status
CREATE POLICY "Users can view their own admin status" 
ON admin_users FOR SELECT 
USING (auth.uid() = id);

-- Policy to allow admins to manage admin_users
CREATE POLICY "Admins can manage admin users" 
ON admin_users FOR ALL 
USING (EXISTS(
  SELECT 1 FROM admin_users 
  WHERE admin_users.id = auth.uid() 
  AND admin_users.is_active = true
));

-- Grant permissions
GRANT ALL ON TABLE services TO authenticated;
GRANT ALL ON TABLE inquiries TO authenticated;
GRANT ALL ON TABLE hero_images TO authenticated;
GRANT ALL ON TABLE testimonials TO authenticated;
GRANT ALL ON TABLE jobs TO authenticated;
GRANT ALL ON TABLE job_applications TO authenticated;
GRANT ALL ON TABLE blog_categories TO authenticated;
GRANT ALL ON TABLE blog_posts TO authenticated;
GRANT ALL ON TABLE admin_users TO authenticated;

-- Storage policies for hero-images bucket
CREATE POLICY "Hero images are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'hero-images');

CREATE POLICY "Admins can manage hero images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'hero-images')
  WITH CHECK (bucket_id = 'hero-images');

-- Storage policies for testimonials bucket
CREATE POLICY "Testimonial images are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'testimonials');

CREATE POLICY "Admins can manage testimonial images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'testimonials')
  WITH CHECK (bucket_id = 'testimonials');

-- Storage policies for blog-images bucket
CREATE POLICY "Blog images are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can manage blog images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'blog-images')
  WITH CHECK (bucket_id = 'blog-images');

-- Storage policies for resumes bucket
CREATE POLICY "Resumes are publicly readable"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can update their resumes"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can delete their resumes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes');

-- Refresh the schema cache
SELECT reload_schema();