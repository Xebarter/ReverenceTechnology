/*
  # Allow public (anon) read access to hero_images and testimonials

  The website front-end is served to unauthenticated visitors.
  Without these policies Supabase RLS silently returns 0 rows for the
  anon role, so the hero carousel and testimonials strip show nothing.

  We only grant SELECT; write operations still require authentication.
*/

-- hero_images: allow anyone to read active images
DROP POLICY IF EXISTS "Public can view active hero images" ON hero_images;
CREATE POLICY "Public can view active hero images"
  ON hero_images
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- testimonials: allow anyone to read active testimonials
DROP POLICY IF EXISTS "Public can view active testimonials" ON testimonials;
CREATE POLICY "Public can view active testimonials"
  ON testimonials
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
