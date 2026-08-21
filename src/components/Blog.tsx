'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, User, ArrowRight, BookOpen, Search, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Badge, Card, Container, PageHeader } from './ui';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  author: string;
  published_at: string;
  category: { name: string; slug: string } | null;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            id, title, slug, excerpt, cover_image_url, author, published_at,
            category:blog_categories(name, slug)
          `)
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (error) throw error;
        setPosts(data.map((p: any) => ({
          ...p,
          category: Array.isArray(p.category) ? p.category[0] : p.category
        })));
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const SkeletonCard = () => (
    <div className="animate-pulse border border-rule bg-surface p-4">
      <div className="mb-4 h-52 bg-paper-2" />
      <div className="mb-4 h-4 w-1/4 bg-paper-2" />
      <div className="mb-2 h-6 w-3/4 bg-paper-2" />
      <div className="h-4 w-full bg-paper-2" />
    </div>
  );

  return (
    <div className="bg-paper pb-24">
      <PageHeader
        eyebrow="The Reverence Blog"
        title="Insights for the digital frontier"
        description="Expert perspectives on technology, innovation, and business growth in the East African landscape."
      />

      <Container className="py-16">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-20 text-center">
            <Search className="mx-auto mb-6 text-rule" size={48} />
            <h3 className="font-serif text-2xl font-medium text-ink-deep">No stories found yet</h3>
            <p className="mt-2 text-muted">We&apos;re currently drafting some amazing content. Stay tuned!</p>
          </Card>
        ) : (
          <div className="space-y-12">
            {posts[0] && (
              <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex flex-col overflow-hidden border border-rule bg-surface lg:flex-row"
              >
                <div className="h-[320px] overflow-hidden border-b border-rule bg-paper-2 lg:h-auto lg:w-3/5 lg:border-b-0 lg:border-r">
                  {posts[0].cover_image_url ? (
                    <img src={posts[0].cover_image_url} alt={posts[0].title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-rule"><BookOpen size={48} /></div>
                  )}
                </div>
                <div className="flex flex-col justify-center p-8 lg:w-2/5 lg:p-12">
                  <div className="mb-6 flex items-center gap-4">
                    <Badge>{posts[0].category?.name || 'Featured'}</Badge>
                    <span className="flex items-center gap-1 text-xs font-medium text-muted">
                      <Calendar size={14} /> {format(new Date(posts[0].published_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <h2 className="mb-4 font-serif text-3xl font-medium leading-tight text-ink-deep">
                    <Link href={`/blog/${posts[0].slug}`} className="underline-offset-4 hover:underline hover:decoration-gold">
                      {posts[0].title}
                    </Link>
                  </h2>
                  <p className="mb-8 line-clamp-3 leading-relaxed text-muted">
                    {posts[0].excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-rule pt-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-paper-2 text-xs text-ink">
                        {posts[0].author[0]}
                      </div>
                      {posts[0].author}
                    </div>
                    <Link href={`/blog/${posts[0].slug}`} className="flex items-center gap-1 text-sm font-medium text-ink underline decoration-gold underline-offset-4">
                      Read Article <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </motion.article>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.slice(1).map((post, idx) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="group overflow-hidden border border-rule bg-surface"
                >
                  <div className="relative h-52 overflow-hidden bg-paper-2">
                    <div className="absolute left-4 top-4 z-10">
                      <Badge>{post.category?.name || 'Insight'}</Badge>
                    </div>
                    {post.cover_image_url ? (
                      <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-rule"><Tag size={32} /></div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
                      <Calendar size={12} /> {format(new Date(post.published_at), 'MMM d, yyyy')}
                    </div>
                    <h3 className="mb-3 font-serif text-xl font-medium leading-snug text-ink-deep line-clamp-2">
                      <Link href={`/blog/${post.slug}`} className="underline-offset-4 hover:underline hover:decoration-gold">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-muted">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between border-t border-rule pt-4">
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <User size={12} /> {post.author}
                      </span>
                      <Link href={`/blog/${post.slug}`} className="flex h-8 w-8 items-center justify-center border border-rule text-ink hover:bg-paper">
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
