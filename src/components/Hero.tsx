'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Star, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react';
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
  rating: number;
  avatar_url?: string | null;
  role?: string | null;
  company?: string | null;
  created_at?: string;
};

export default function Hero() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHeroImages = async () => {
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

      setHeroImages([
        {
          id: 'fallback',
          image_url: FALLBACK_IMAGE,
          title: 'Default',
        },
      ]);
    } catch {
      setHeroImages([
        {
          id: 'fallback',
          image_url: FALLBACK_IMAGE,
          title: 'Default',
        },
      ]);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTestimonials(data || []);
    } catch {
      setTestimonials([]);
    }
  };

  const startTestimonialCarousel = () => {
    stopTestimonialCarousel();
    intervalRef.current = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000);
  };

  const stopTestimonialCarousel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleTestimonialNavigate = (direction: number) => {
    stopTestimonialCarousel();
    if (direction === 1) {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    } else {
      setCurrentTestimonialIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    }
    startTestimonialCarousel();
  };

  useEffect(() => {
    fetchHeroImages();
    fetchTestimonials();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (heroImages.length > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }
    }, 6500);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    if (testimonials.length > 1) startTestimonialCarousel();
    return () => stopTestimonialCarousel();
  }, [testimonials]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting, {
      threshold: 0.15,
    });
    if (testimonialsRef.current) observer.observe(testimonialsRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const stats = [
    { value: '5+', label: 'Years Experience' },
    { value: '75+', label: 'Happy Clients' },
    { value: '50+', label: 'Projects Delivered' },
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
              Kampala, Uganda · Serving East Africa
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              <h1 className="font-serif text-[2rem] font-medium leading-[1.15] tracking-tight text-ink-deep sm:text-5xl xl:text-6xl">
                Build your digital future with Uganda&apos;s leading tech partner
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:mt-5 sm:text-lg">
                We craft high-performance websites, mobile apps, and custom software that help
                businesses across East Africa grow faster and compete smarter.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
              className="flex flex-wrap gap-x-8 gap-y-4 border-y border-rule py-5"
            >
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <div className="font-serif text-2xl text-ink-deep">{value}</div>
                  <div className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.22 }}
              className="flex flex-col gap-3 pt-2 sm:flex-row"
            >
              <Button size="lg" onClick={() => scrollToSection('services')}>
                Get a Free Quote
                <ArrowRight size={16} />
              </Button>
              <Button size="lg" variant="secondary" onClick={() => scrollToSection('contact')}>
                Talk to Us
              </Button>
            </motion.div>
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
                  <span className="truncate">Verified Partner</span>
                </span>
                <span className="flex-shrink-0 text-[0.625rem] uppercase tracking-[0.14em] text-muted sm:text-[0.6875rem]">
                  Kampala
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

      <div className="relative z-10 border-t border-rule bg-surface" ref={testimonialsRef}>
        {testimonials.length > 0 && (
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
            <p className="mb-8 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
              What our clients say
            </p>
            <div className="relative">
              <div className="relative min-h-[8.5rem] sm:h-[140px] sm:min-h-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTestimonialIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center"
                  >
                    <div className="flex w-full items-start gap-3 sm:gap-5">
                      <img
                        src={
                          testimonials[currentTestimonialIndex].avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            testimonials[currentTestimonialIndex].name
                          )}&background=1C3D5A&color=fff&size=96`
                        }
                        className="h-10 w-10 flex-shrink-0 object-cover sm:h-12 sm:w-12"
                        alt={testimonials[currentTestimonialIndex].name}
                        width={48}
                        height={48}
                        decoding="async"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < testimonials[currentTestimonialIndex].rating
                                  ? 'fill-gold text-gold'
                                  : 'fill-rule text-rule'
                              }
                            />
                          ))}
                        </div>
                        <p className="mb-3 line-clamp-3 font-serif text-base italic leading-relaxed text-ink-deep sm:line-clamp-2 sm:text-lg">
                          &ldquo;{testimonials[currentTestimonialIndex].content}&rdquo;
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <p className="font-medium text-ink">{testimonials[currentTestimonialIndex].name}</p>
                          {(testimonials[currentTestimonialIndex].role ||
                            testimonials[currentTestimonialIndex].company) && (
                            <>
                              <span className="text-rule">·</span>
                              <p className="truncate text-muted">
                                {testimonials[currentTestimonialIndex].role}
                                {testimonials[currentTestimonialIndex].role &&
                                  testimonials[currentTestimonialIndex].company &&
                                  ', '}
                                {testimonials[currentTestimonialIndex].company}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        stopTestimonialCarousel();
                        setCurrentTestimonialIndex(index);
                        startTestimonialCarousel();
                      }}
                      className={`h-px transition-all duration-300 ${
                        index === currentTestimonialIndex ? 'w-8 bg-ink' : 'w-4 bg-rule'
                      }`}
                      aria-label={`Testimonial ${index + 1}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestimonialNavigate(-1)}
                    className="border border-rule p-2 text-ink hover:bg-paper-2"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => handleTestimonialNavigate(1)}
                    className="border border-rule p-2 text-ink hover:bg-paper-2"
                    aria-label="Next"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
