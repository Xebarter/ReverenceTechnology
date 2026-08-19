-- Add mobile_image_url column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS mobile_image_url text;

-- Add a comment to describe the new column
COMMENT ON COLUMN projects.mobile_image_url IS 'URL for mobile version of project image';