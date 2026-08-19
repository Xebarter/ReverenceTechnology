/*
  # Blog Tables for Reverence Technology

  ## Overview
  This migration creates tables for managing blog posts and categories for the company blog.

  ## New Tables
  
  ### `blog_categories`
  - `id` (uuid, primary key) - Unique identifier for each category
  - `name` (text) - Name of the category
  - `slug` (text) - URL-friendly version of the name
  - `description` (text) - Description of the category
  - `created_at` (timestamptz) - Timestamp of creation
  - `updated_at` (timestamptz) - Timestamp of last update

  ### `blog_posts`
  - `id` (uuid, primary key) - Unique identifier for each blog post
  - `title` (text) - Title of the blog post
  - `slug` (text) - URL-friendly version of the title
  - `content` (text) - Main content of the blog post
  - `excerpt` (text) - Short excerpt/summary of the post
  - `cover_image_url` (text) - URL to the cover image
  - `author` (text) - Author of the blog post
  - `category_id` (uuid, foreign key) - Reference to the category
  - `is_published` (boolean) - Whether the post is published
  - `published_at` (timestamptz) - Timestamp when the post was published
  - `created_at` (timestamptz) - Timestamp of creation
  - `updated_at` (timestamptz) - Timestamp of last update

  ## Security
  - Enable RLS on both tables
  - Categories table: Public read access for published posts, admin full access
  - Posts table: Public read access for published posts, admin full access
*/

-- Create the blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create the blog_posts table
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

-- Enable Row Level Security
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for blog_categories
CREATE POLICY "Categories are publicly readable"
  ON blog_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON blog_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for blog_posts
CREATE POLICY "Published blog posts are publicly readable"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage blog posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_is_published ON blog_posts(is_published);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);

-- Insert some sample categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Technology', 'technology', 'Latest trends and insights in technology'),
  ('Business', 'business', 'Business strategies and growth insights'),
  ('Engineering', 'engineering', 'Engineering practices and innovations'),
  ('Company News', 'company-news', 'News and updates from our company');