'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Bookmark, Clock, ChevronRight, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { buttonClassName, Container } from './ui';

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`*, category:blog_categories(name, slug)`)
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error) throw error;
        setPost(data);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();

    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center bg-paper py-16">
        <div className="w-full max-w-3xl space-y-8 px-6">
          <div className="h-4 w-24 animate-pulse bg-paper-2" />
          <div className="h-12 w-full animate-pulse bg-paper-2" />
          <div className="h-96 w-full animate-pulse bg-paper-2" />
        </div>
      </div>
    );
  }

  if (!post) return (
    <div className="flex min-h-[60vh] items-center justify-center bg-paper">
      <div className="text-center">
        <h1 className="font-serif text-8xl font-medium text-paper-2">404</h1>
        <p className="mb-8 font-medium text-muted">Article vanished into the digital void.</p>
        <Link href="/blog" className={buttonClassName()}>Return to Blog</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-paper">
      <motion.div className="fixed left-0 right-0 top-0 z-[100] h-0.5 origin-left bg-gold" style={{ scaleX }} />

      <nav className="border-b border-rule bg-paper">
        <Container className="flex h-14 items-center justify-between">
          <Link href="/blog" className="flex items-center text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline hover:decoration-gold">
            <ArrowLeft size={16} className="mr-2" /> All Stories
          </Link>
          <div className="hidden items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted md:flex">
            Home <ChevronRight size={12} /> Blog <ChevronRight size={12} /> <span className="text-ink">{post.category?.name}</span>
          </div>
        </Container>
      </nav>

      <main className="py-16 md:py-20">
        <article>
          <header className="mb-12 text-center">
            <Container>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mb-6 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
                  {post.category?.name || 'Perspective'}
                </p>
                <h1 className="mb-8 font-serif text-4xl font-medium leading-[1.15] tracking-tight text-ink-deep md:text-5xl lg:text-6xl">
                  {post.title}
                </h1>

                <div className="flex items-center justify-center gap-6 font-medium text-muted">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-paper-2 font-medium text-ink">
                      {post.author[0]}
                    </div>
                    <span className="font-medium text-ink">{post.author}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-rule" />
                  <div className="flex items-center gap-1.5 text-sm">
                    <Calendar size={16} /> {format(new Date(post.published_at), 'MMM d, yyyy')}
                  </div>
                  <div className="hidden items-center gap-1.5 text-sm sm:flex">
                    <Clock size={16} /> 6 min read
                  </div>
                </div>
              </motion.div>
            </Container>
          </header>

          <Container>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="relative mb-16"
            >
              {post.cover_image_url ? (
                <img
                  src={post.cover_image_url}
                  className="hero-frame h-[420px] w-full border border-rule object-cover"
                  alt={post.title}
                />
              ) : (
                <div className="hero-frame flex h-[280px] w-full items-center justify-center border border-rule bg-paper-2 text-rule">
                  <Bookmark size={64} />
                </div>
              )}
            </motion.div>
          </Container>

          <Container>
            <div className="relative grid gap-12 lg:grid-cols-[auto_1fr]">
              <aside className="hidden h-fit lg:sticky lg:top-28 lg:block">
                <div className="flex flex-col gap-3">
                  <div className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">Share</div>
                  <ShareButton platform="linkedin" />
                  <ShareButton platform="twitter" />
                  <ShareButton platform="whatsapp" />
                </div>
              </aside>

              <div className="prose prose-editorial max-w-none">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
            </div>

            <footer className="mt-20 flex flex-col items-center gap-8 rounded-2xl border border-rule bg-surface p-8 shadow-[0_1px_2px_rgb(14_36_54/0.04)] md:flex-row md:p-12">
              <div className="shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-rule bg-paper-2 font-serif text-3xl text-ink-deep">
                  {post.author[0]}
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="mb-2 font-serif text-xl font-medium text-ink-deep">Written by {post.author}</h4>
                <p className="mb-4 leading-relaxed text-muted">
                  Sharing insights from the frontlines of Reverence Technology. Focused on building digital solutions that drive progress in East Africa.
                </p>
                <Link href="/blog" className="text-sm font-medium text-ink underline decoration-gold underline-offset-4">
                  More from this author
                </Link>
              </div>
            </footer>
          </Container>
        </article>
      </main>
    </div>
  );
}

function ShareButton({ platform }: { platform: string }) {
  const icons: any = {
    linkedin: <Linkedin size={18} />,
    twitter: <Twitter size={18} />,
    whatsapp: <MessageCircle size={18} />
  };

  const handleShare = () => {
    const url = window.location.href;
    const title = document.title.split(' | ')[0];

    switch (platform) {
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          '_blank',
          'width=600,height=400'
        );
        break;

      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank',
          'width=600,height=400'
        );
        break;

      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${title}: ${url}`)}`,
          '_blank'
        );
        break;

      default:
        if (navigator.share) {
          navigator.share({
            title: title,
            url: url
          }).catch(console.error);
        } else {
          navigator.clipboard.writeText(url).then(() => {
            alert('Link copied to clipboard!');
          }).catch(console.error);
        }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-surface text-muted transition-all duration-200 hover:border-ink hover:bg-ink hover:text-paper"
    >
      {icons[platform]}
    </button>
  );
}
