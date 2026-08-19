-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  link text,
  technologies jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_featured boolean DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order);

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy for public to view featured projects
CREATE POLICY "Featured projects are publicly readable"
  ON projects
  FOR SELECT
  TO anon, authenticated
  USING (is_featured = true);

-- Policy for admins to manage projects
CREATE POLICY "Admins can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_projects_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at_column();

-- Insert sample data
INSERT INTO projects (title, description, image_url, link, technologies, is_featured, display_order)
VALUES 
  ('Digital Banking Platform', 'A secure mobile banking solution for rural communities in East Africa with offline capabilities.', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80', 'https://example.com/banking', '["React Native", "Node.js", "PostgreSQL", "Offline Sync"]'::jsonb, true, 1),
  ('Agricultural Marketplace', 'An e-commerce platform connecting farmers with buyers across Uganda and Kenya.', 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80', 'https://example.com/agriculture', '["React", "Firebase", "Stripe", "Twilio"]'::jsonb, true, 2),
  ('Health Records System', 'A HIPAA-compliant electronic health records system for clinics in rural areas.', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80', 'https://example.com/health', '["Vue.js", "Express", "MongoDB", "OCR"]'::jsonb, true, 3)
ON CONFLICT DO NOTHING;