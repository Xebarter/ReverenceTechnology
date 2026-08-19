import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Container } from './ui';

interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string | null;
  content: string;
  rating: number;
  avatar_url: string | null;
  created_at: string;
  is_active: boolean;
}

export default function Testimonials({
  onShowTestimonialForm
}: {
  onShowTestimonialForm: () => void;
}) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (testimonials.length > 1) startCarousel();
    return () => stopCarousel();
  }, [testimonials]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (err) {
      console.error('Failed to load testimonials', err);
    } finally {
      setLoading(false);
    }
  };

  const startCarousel = () => {
    stopCarousel();
    intervalRef.current = setInterval(() => {
      navigate(1);
    }, 9000);
  };

  const stopCarousel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const navigate = (dir: number) => {
    setDirection(dir);
    setCurrentIndex((prev) => {
      if (dir === 1) return (prev + 1) % testimonials.length;
      return prev === 0 ? testimonials.length - 1 : prev - 1;
    });
  };

  // Variants optimized for mobile (smaller x-offset to prevent horizontal scroll issues)
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  if (loading) {
    return (
      <section className="bg-paper py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-4xl animate-pulse">
            <div className="mx-auto mb-6 h-8 w-48 rounded-md bg-paper-2" />
            <div className="h-64 rounded-md border border-rule bg-surface" />
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-paper py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center md:mb-16">
            <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
              Client Testimonials
            </p>
            <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight text-ink-deep md:text-5xl">
              Trusted by organizations across East Africa
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted md:text-lg">
              Our clients trust us to deliver secure, reliable, and impactful digital solutions.
            </p>
          </div>

          {testimonials.length === 0 ? (
            <div className="rounded-md border border-dashed border-rule bg-surface py-12 text-center px-6 md:py-20">
              <User size={40} className="mx-auto mb-4 text-muted/40" />
              <h3 className="mb-2 font-serif text-lg text-ink-deep">No testimonials yet</h3>
              <Button onClick={onShowTestimonialForm} className="mt-4">
                <MessageSquarePlus size={18} />
                Submit Testimonial
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative flex min-h-[400px] items-center md:min-h-[320px]">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 100) navigate(-1);
                      else if (info.offset.x < -100) navigate(1);
                    }}
                    className="w-full cursor-grab active:cursor-grabbing"
                  >
                    <div className="relative rounded-md border border-rule bg-surface p-6 md:p-10">
                      <Quote className="absolute right-4 top-4 h-10 w-10 text-gold/20 md:right-6 md:top-6 md:h-12 md:w-12" />

                      <div className="mb-4 flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < testimonials[currentIndex].rating ? 'fill-gold text-gold' : 'text-rule'}
                          />
                        ))}
                      </div>

                      <p className="mb-8 font-serif text-2xl italic leading-relaxed text-ink-deep md:text-3xl">
                        “{testimonials[currentIndex].content}”
                      </p>

                      <div className="flex items-center gap-3 md:gap-4">
                        <img
                          src={testimonials[currentIndex].avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonials[currentIndex].name)}&background=1C3D5A&color=fff`}
                          alt={testimonials[currentIndex].name}
                          className="h-12 w-12 rounded-full border border-rule object-cover md:h-14 md:w-14"
                        />
                        <div className="overflow-hidden">
                          <p className="truncate font-sans text-sm font-medium text-ink">
                            {testimonials[currentIndex].name}
                          </p>
                          <p className="truncate font-sans text-xs text-muted md:text-sm">
                            {testimonials[currentIndex].role && `${testimonials[currentIndex].role}, `}
                            <span className="text-ink">
                              {testimonials[currentIndex].company}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-6 flex justify-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
                    className={`h-1 rounded-full transition-all ${i === currentIndex ? 'w-6 bg-ink' : 'w-1.5 bg-rule hover:bg-muted/40'}`}
                  />
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center justify-between gap-6 md:flex-row">
                <button
                  onClick={onShowTestimonialForm}
                  className="order-2 flex items-center gap-2 font-sans text-sm text-muted transition hover:text-ink md:order-1"
                >
                  <MessageSquarePlus size={18} />
                  Share your experience
                </button>

                <div className="order-1 flex items-center gap-3 md:order-2">
                  <button
                    onClick={() => navigate(-1)}
                    className="rounded-md border border-rule bg-surface p-2 text-ink transition hover:border-ink"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    onClick={() => navigate(1)}
                    className="rounded-md border border-rule bg-surface p-2 text-ink transition hover:border-ink"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
