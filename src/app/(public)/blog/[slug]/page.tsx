import type { Metadata } from 'next';
import BlogPost from '../../../../components/BlogPost';
import JsonLd from '../../../../components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd, pageMetadata } from '../../../../lib/seo';
import { blogImage, fetchPublishedBlogPost } from '../../../../lib/seoQueries';

type Props = { params: Promise<{ slug: string }> };

function cleanTitle(value: string) {
  return value.replace(/\s*\|\s*Reverence Technology\s*$/i, '').trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublishedBlogPost(slug);
  if (!post) {
    return pageMetadata({
      title: 'Article',
      description: 'Insights from Reverence Technology.',
      path: `/blog/${slug}`,
    });
  }
  return pageMetadata({
    title: cleanTitle(post.meta_title || post.title),
    description: post.meta_description || post.excerpt || post.title,
    path: `/blog/${post.slug}`,
    image: blogImage(post),
    type: 'article',
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchPublishedBlogPost(slug);

  return (
    <>
      {post && (
        <JsonLd
          data={[
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Blog', path: '/blog' },
              { name: post.title, path: `/blog/${post.slug}` },
            ]),
            articleJsonLd({
              title: post.title,
              description: post.meta_description || post.excerpt || post.title,
              path: `/blog/${post.slug}`,
              image: blogImage(post),
              datePublished: post.published_at,
              dateModified: post.updated_at,
              author: post.author,
            }),
          ]}
        />
      )}
      <BlogPost />
    </>
  );
}
