-- Add cover_image_url to blog_posts if missing and copy data from featured_image_url
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Copy data over from featured_image_url if that column exists and cover_image_url is null
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='blog_posts' AND column_name='featured_image_url'
  ) THEN
    UPDATE blog_posts
    SET cover_image_url = featured_image_url
    WHERE cover_image_url IS NULL AND featured_image_url IS NOT NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;
