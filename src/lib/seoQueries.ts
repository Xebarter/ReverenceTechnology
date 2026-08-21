import { supabase } from './supabase';

export type SeoBlogPost = {
  slug: string;
  title: string;
  excerpt: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  cover_image_url: string | null;
  author: string | null;
  published_at: string | null;
  updated_at: string | null;
};

const BLOG_SELECT_FULL =
  'slug, title, excerpt, cover_image_url, author, published_at, updated_at, meta_title, meta_description';
const BLOG_SELECT_BASE = 'slug, title, excerpt, cover_image_url, author, published_at, updated_at';

function isMissingColumn(error: { message?: string } | null) {
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('column') && (msg.includes('meta_title') || msg.includes('meta_description') || msg.includes('does not exist'));
}

export async function fetchPublishedBlogPosts(): Promise<SeoBlogPost[]> {
  const first = await supabase
    .from('blog_posts')
    .select(BLOG_SELECT_FULL)
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  const result = isMissingColumn(first.error)
    ? await supabase
        .from('blog_posts')
        .select(BLOG_SELECT_BASE)
        .eq('is_published', true)
        .order('published_at', { ascending: false })
    : first;

  if (result.error) {
    console.error('[seo] blog posts', result.error);
    return [];
  }
  return (result.data || []) as SeoBlogPost[];
}

export async function fetchPublishedBlogPost(slug: string): Promise<SeoBlogPost | null> {
  const first = await supabase
    .from('blog_posts')
    .select(BLOG_SELECT_FULL)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  const result = isMissingColumn(first.error)
    ? await supabase
        .from('blog_posts')
        .select(BLOG_SELECT_BASE)
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()
    : first;

  if (result.error) {
    console.error('[seo] blog post', result.error);
    return null;
  }
  return (result.data as SeoBlogPost | null) ?? null;
}

export async function fetchPublicProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, description, image_url')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[seo] project', error);
    return null;
  }
  return data as { id: string; title: string; description: string | null; image_url: string | null } | null;
}

export async function fetchPublishedJob(id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, description, location, employment_type, created_at')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    console.error('[seo] job', error);
    return null;
  }
  return data as {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    employment_type: string | null;
    created_at: string | null;
  } | null;
}

export function blogImage(post: Pick<SeoBlogPost, 'cover_image_url'>) {
  return post.cover_image_url || null;
}
