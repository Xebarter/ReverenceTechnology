-- Create storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS for projects bucket
-- This allows public reads for project images
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/*'::text], 
    file_size_limit = 10485760 -- 10MB limit (increased from 2MB)
WHERE id = 'projects';