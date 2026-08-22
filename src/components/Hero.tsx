'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const stats = [
    { value: '5+', label: 'Years in market' },
    { value: '75+', label: 'Clients served' },
    { value: '50+', label: 'Products shipped' },
  ];

  return (
    <section id="home" className="relative overflow-hidden bg-paper">
      <Container className="relative z-10 py-10 sm:py-16 md:py-28">
        <div className="grid grid-cols-1 items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="order-2 space-y-6 sm:space-y-8 lg:order-1">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold"
            >
              Kampala studio · East Africa delivery
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              <h1 className="font-serif text-[2rem] font-medium leading-[1.15] tracking-tight text-ink-deep sm:text-5xl xl:text-6xl">
                Software, sites, and apps that take payment and get used
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">
                We build the product, quote a total, and collect MTN, Airtel, or card as work lands.
                You own the code.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="flex flex-col gap-3 pt-1 sm:flex-row"
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="relative order-1 w-full lg:order-2 lg:mx-auto lg:max-w-none"
          >
            <div className="relative aspect-[16/10] overflow-hidden border border-rule bg-paper-2 sm:aspect-[4/3] lg:aspect-[4/5]">
              <AnimatePresence mode="wait">
                {heroImages.length > 0 && (
                  <motion.img
                    key={heroImages[currentImageIndex].id}
                    src={getOptimizedImageUrl(heroImages[currentImageIndex].image_url, 768)}
                    srcSet={getHeroSrcSet(heroImages[currentImageIndex].image_url)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1023px) 90vw, 42vw"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    alt={
                      heroImages[currentImageIndex].title?.trim() ||
                      'Web design and software development in Kampala Uganda – Reverence Technology'
                    }
                    width={768}
                    height={480}
                    decoding="async"
                    fetchPriority="high"
                    onError={(e) => {
                      const img = e.currentTarget;
                      const original = heroImages[currentImageIndex]?.image_url;
                      if (original && img.src !== original && img.src !== FALLBACK_IMAGE) {
                        img.src = original;
                        img.removeAttribute('srcset');
                      } else if (img.src !== FALLBACK_IMAGE) {
                        img.src = FALLBACK_IMAGE;
                        img.removeAttribute('srcset');
                      }
                    }}
                  />
                )}
              </AnimatePresence>
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-2 border-t border-rule bg-surface/95 px-3 py-2.5 sm:px-4 sm:py-3">
                <span className="flex min-w-0 items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-ink sm:text-[0.6875rem]">
                  <BadgeCheck size={14} className="flex-shrink-0 text-gold" />
                  <span className="truncate">Kampala studio</span>
                </span>
                <span className="flex-shrink-0 text-[0.625rem] uppercase tracking-[0.14em] text-muted sm:text-[0.6875rem]">
                  East Africa
                </span>
              </div>
            </div>
            {heroImages.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-1.5 lg:hidden">
                {heroImages.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-1 rounded-full transition-all ${
                      index === currentImageIndex ? 'w-6 bg-ink' : 'w-2 bg-rule'
                    }`}
                    aria-label={`Show image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </Container>

      <div className="relative z-10 border-t border-rule bg-surface">
        <Container className="py-6 sm:py-8">
          <div className="grid grid-cols-3 gap-4 border-b border-rule pb-6 sm:gap-8 sm:pb-8">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <div className="font-serif text-2xl text-ink-deep sm:text-3xl">{value}</div>
                <div className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted sm:text-[0.6875rem]">
                  {label}
                </div>
              </div>
            ))}
          </div>
          {quote && (
            <p className="mt-6 max-w-3xl font-serif text-base italic leading-relaxed text-ink-deep sm:text-lg">
              “{quote.content}”
              <span className="mt-2 block font-sans text-sm not-italic text-muted">
                {quote.name}
                {quote.company ? ` · ${quote.company}` : ''}
              </span>
            </p>
          )}
        </Container>
      </div>
    </section>
  );
}
