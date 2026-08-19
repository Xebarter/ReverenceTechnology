-- Comprehensive Database Setup for Reverence Technology Application (NO RLS VERSION)
-- This script creates all necessary tables, relationships, storage buckets, functions, and policies
-- WITHOUT ANY ROW LEVEL SECURITY (RLS) enabled

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
  created_at timestamptz DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  featured_image_url text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  author text NOT NULL,
  category_id uuid REFERENCES blog_categories(id),
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_users table for role-based access control
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_hero_images_is_active ON hero_images(is_active);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_is_published ON jobs(is_published);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('hero-images', 'hero-images', true),
  ('testimonials', 'testimonials', true),
  ('blog-images', 'blog-images', true),
  ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Create functions

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updating updated_at column in jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Trigger for updating updated_at column in job_applications table
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at 
    BEFORE UPDATE ON job_applications 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Trigger for updating updated_at column in blog_posts table
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically set published_at when is_published becomes true
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_published = true AND OLD.is_published = false THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for setting published_at in blog_posts table
DROP TRIGGER IF EXISTS set_blog_posts_published_at ON blog_posts;
CREATE TRIGGER set_blog_posts_published_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE PROCEDURE set_published_at();

-- Function to get user by email from auth.users table
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

-- Insert sample data

-- Insert sample services
INSERT INTO services (package_name, description, key_features, target_audience, suggested_pricing, display_order) VALUES
  ('Basic Package', 'Perfect for startups and small businesses looking to establish their online presence.', 
   '[{"feature": "Custom Website Design"}, {"feature": "Up to 5 Pages"}, {"feature": "Responsive Design"}, {"feature": "Contact Form"}]'::jsonb,
   '[{"audience": "Startups"}, {"audience": "Small Businesses"}, {"audience": "Non-profits"}]'::jsonb,
   'From $999', 1)
ON CONFLICT DO NOTHING;

INSERT INTO services (package_name, description, key_features, target_audience, suggested_pricing, display_order) VALUES
  ('Professional Package', 'Ideal for growing businesses that need a robust online platform with advanced features.', 
   '[{"feature": "Custom Website Design"}, {"feature": "Up to 10 Pages"}, {"feature": "Responsive Design"}, {"feature": "Contact Form"}, {"feature": "Blog Integration"}, {"feature": "SEO Optimization"}]'::jsonb,
   '[{"audience": "Growing Businesses"}, {"audience": "E-commerce Stores"}, {"audience": "Professional Services"}]'::jsonb,
   'From $2,499', 2)
ON CONFLICT DO NOTHING;

INSERT INTO services (package_name, description, key_features, target_audience, suggested_pricing, display_order) VALUES
  ('Enterprise Package', 'Comprehensive digital solution for large enterprises with complex requirements.', 
   '[{"feature": "Custom Website Design"}, {"feature": "Unlimited Pages"}, {"feature": "Responsive Design"}, {"feature": "Advanced E-commerce"}, {"feature": "CRM Integration"}, {"feature": "Analytics & Reporting"}, {"feature": "Priority Support"}]'::jsonb,
   '[{"audience": "Large Enterprises"}, {"audience": "Corporations"}, {"audience": "Government Agencies"}]'::jsonb,
   'From $5,999', 3)
ON CONFLICT DO NOTHING;

-- Insert sample blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Technology', 'technology', 'Latest trends and insights in technology')
ON CONFLICT DO NOTHING;

INSERT INTO blog_categories (name, slug, description) VALUES
  ('Business', 'business', 'Tips and strategies for business growth')
ON CONFLICT DO NOTHING;

INSERT INTO blog_categories (name, slug, description) VALUES
  ('Engineering', 'engineering', 'Technical articles and engineering insights')
ON CONFLICT DO NOTHING;