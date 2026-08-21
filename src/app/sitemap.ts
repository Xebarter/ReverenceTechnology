import type { MetadataRoute } from 'next';
import { absoluteUrl } from '../lib/seo';
import { SERVICE_PAGES } from '../lib/seoPages';
import { fetchPublishedBlogPosts } from '../lib/seoQueries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await fetchPublishedBlogPosts();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/services'), lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/projects'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/blog'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/careers'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/shop'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/refund-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ...SERVICE_PAGES.map((page) => ({
      url: absoluteUrl(`/services/${page.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
  ];

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.updated_at || post.published_at ? new Date(post.updated_at || post.published_at || now) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
