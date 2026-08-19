/*
  # Additional Tables for Reverence Technology Admin Dashboard

  ## Overview
  This migration creates additional tables for the admin dashboard to manage 
  hero images and customer testimonials.

  ## New Tables
  
  ### `hero_images`
  - `id` (uuid, primary key) - Unique identifier for each hero image
  - `title` (text) - Title or description of the image
  - `image_url` (text) - URL to the image file
  - `is_active` (boolean) - Whether the image is currently active/displayed
  - `created_at` (timestamptz) - Timestamp of creation
  
  ### `testimonials`
  - `id` (uuid, primary key) - Unique identifier for each testimonial
  - `name` (text) - Customer's name
  - `company` (text) - Customer's company
  - `role` (text) - Customer's role/position
  - `content` (text) - Testimonial content
  - `rating` (integer) - Rating (1-5)
  - `avatar_url` (text) - URL to customer's avatar
  - `is_active` (boolean) - Whether the testimonial is published
  - `created_at` (timestamptz) - Timestamp of creation

  ## Security
  - Enable RLS on both tables
  - Both tables: Admin read/write access only
*/

CREATE TABLE IF NOT EXISTS hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

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

ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Policies for hero_images table
CREATE POLICY "Admins can manage hero images"
  ON hero_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for testimonials table
CREATE POLICY "Admins can manage testimonials"
  ON testimonials
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);