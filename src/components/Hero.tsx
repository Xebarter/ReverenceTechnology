'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Button, Container } from './ui';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80';

const getOptimizedImageUrl = (url: string, width: number): string => {
  if (!url) return url;
  const quality = width < 700 ? 68 : 78;

  if (url.includes('unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(quality));
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('fm', 'webp');
      return parsed.toString();
    } catch {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=${width}&q=${quality}&auto=format&fit=crop&fm=webp`;
    }
  }

  return url;
};

const getHeroSrcSet = (url: string) => {
  if (!url?.includes('unsplash.com')) return undefined;
  return [480, 768, 1024, 1400]
    .map((width) => `${getOptimizedImageUrl(url, width)} ${width}w`)
    .join(', ');
};

type HeroImage = {
  id: string;
  image_url: string;
  title?: string | null;
  created_at?: string;
};

type Testimonial = {
  id: string;
  name: string;
  content: string;
  company?: string | null;
};

export default function Hero() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quote, setQuote] = useState<Testimonial | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_images')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const cleaned = (data as HeroImage[] | null | undefined)?.filter((d) => d.image_url?.trim()) ?? [];
        if (cleaned.length) {
          setHeroImages(cleaned);
          return;
        }
        setHeroImages([{ id: 'fallback', image_url: FALLBACK_IMAGE, title: 'Default' }]);
      } catch {
        setHeroImages([{ id: 'fallback', image_url: FALLBACK_IMAGE, title: 'Default' }]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('id,name,content,company')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (data) setQuote(data as Testimonial);
      } catch {
        setQuote(null);
      }
    };
    loadQuote();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (heroImages.length > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }
    }, 6500);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const stats = [
    { value: '5+', label: 'Years in market' },
    { value: '75+', label: 'Clients served' },
    { value: '50+', label: 'Products shipped' },
  ];

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <section id="home" className="relative overflow-hidden bg-paper">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-[26rem] w-[26rem] rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -right-16 top-24 h-[22rem] w-[22rem] rounded-full bg-ink/[0.05] blur-3xl" />
      </div>

      <Container className="relative z-10 py-12 sm:py-16 md:py-24">
        <div className="grid grid-cols-1 items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-6 sm:space-y-8">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold"
            >
              Kampala studio · East Africa delivery
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease }}
            >
              <h1 className="font-serif text-[2.15rem] font-medium leading-[1.12] tracking-tight text-ink-deep sm:text-5xl xl:text-[3.5rem]">
                Software, sites, and apps that take payment and get used
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                We build the product, quote a total, and collect MTN, Airtel, or card as work lands.
                You own the code.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease }}
              className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center"
            >
              <Button size="lg" onClick={() => scrollToSection('services')}>
                Start a project
                <ArrowRight size={16} />
              </Button>
              <Button size="lg" variant="ghost" onClick={() => scrollToSection('projects')}>
                See the work
              </Button>
            </motion.div>
            <p className="text-sm text-muted">
              Quote first. Pay as we request work. You own what we ship.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease }}
            className="relative w-full"
          >
            <div className="hero-frame relative aspect-[16/10] overflow-hidden border border-rule bg-ink-deep sm:aspect-[4/3] lg:aspect-[4/5]">
              {heroImages.length === 0 && <div className="absolute inset-0 animate-pulse bg-paper-2" />}
              {heroImages.map((image, index) => {
                const active = index === currentImageIndex;
                return (
                  <motion.img
                    key={image.id}
                    src={getOptimizedImageUrl(image.image_url, 768)}
                    srcSet={getHeroSrcSet(image.image_url)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1023px) 90vw, 42vw"
                    initial={false}
                    animate={{ opacity: active ? 1 : 0, scale: active ? 1.06 : 1 }}
                    transition={{
                      opacity: { duration: 1.05, ease },
                      scale: { duration: 6.5, ease: 'linear' },
                    }}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    style={{ zIndex: active ? 1 : 0 }}
                    alt={
                      image.title?.trim() ||
                      'Web design and software development in Kampala Uganda – Reverence Technology'
                    }
                    width={768}
                    height={480}
                    decoding="async"
                    fetchPriority={index === 0 ? 'high' : 'low'}
                    aria-hidden={!active}
                    onError={(e) => {
                      const img = e.currentTarget;
                      const original = image.image_url;
                      if (original && img.src !== original && img.src !== FALLBACK_IMAGE) {
                        img.src = original;
                        img.removeAttribute('srcset');
                      } else if (img.src !== FALLBACK_IMAGE) {
                        img.src = FALLBACK_IMAGE;
                        img.removeAttribute('srcset');
                      }
                    }}
                  />
                );
              })}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink-deep/80 via-ink-deep/30 to-transparent px-4 pb-4 pt-16">
                <div className="flex items-center justify-between gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-paper sm:text-[0.6875rem]">
                  <span className="flex min-w-0 items-center gap-2">
                    <BadgeCheck size={14} className="flex-shrink-0 text-gold" />
                    <span className="truncate">Kampala studio</span>
                  </span>
                  <span className="flex-shrink-0 text-paper/75">East Africa</span>
                </div>
              </div>
            </div>
            {heroImages.length > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {heroImages.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        index === currentImageIndex ? 'w-7 bg-ink' : 'w-2 bg-rule hover:bg-gold'
                      }`}
                      aria-label={`Show image ${index + 1}`}
                    />
                  ))}
                </div>
                <span className="text-[0.6875rem] tabular-nums tracking-[0.16em] text-muted">
                  {String(currentImageIndex + 1).padStart(2, '0')} / {String(heroImages.length).padStart(2, '0')}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </Container>

      <div className="relative z-10 border-t border-rule bg-surface/80">
        <Container>
          <div className="grid grid-cols-3 divide-x divide-rule">
            {stats.map(({ value, label }) => (
              <div key={label} className="px-3 py-7 sm:px-8 sm:py-9">
                <div className="font-serif text-2xl text-ink-deep sm:text-3xl">{value}</div>
                <div className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted sm:text-[0.6875rem]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>
      {quote && (
        <Container className="relative z-10 py-10 sm:py-12">
          <blockquote className="max-w-3xl border-l-2 border-gold pl-5 sm:pl-6">
            <p className="line-clamp-4 font-serif text-lg italic leading-relaxed text-ink-deep sm:text-xl">
              “{quote.content}”
            </p>
            <footer className="mt-3 text-sm text-muted">
              {quote.name}
              {quote.company ? ` · ${quote.company}` : ''}
            </footer>
          </blockquote>
        </Container>
      )}
    </section>
  );
}
