import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Star, MessageSquarePlus, User } from 'lucide-react';
import { motion } from 'framer-motion';
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
  onShowTestimonialForm,
}: {
  onShowTestimonialForm: () => void;
}) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);
        if (error) throw error;
        setTestimonials(data || []);
      } catch (err) {
        console.error('Failed to load testimonials', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="bg-paper py-16 md:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse border border-rule bg-surface" />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative bg-paper py-20 md:py-28">
      <Container>
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
            Clients
          </p>
          <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight text-ink-deep md:text-5xl">
            What they got. In their words.
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted md:text-lg">
            Not a pitch. What shipped, and whether they would hire us again.
          </p>
        </div>

        {testimonials.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rule bg-surface px-6 py-12 text-center md:py-20">
            <User size={40} className="mx-auto mb-4 text-muted/40" />
            <h3 className="mb-2 font-serif text-lg text-ink-deep">No client notes yet</h3>
            <Button onClick={onShowTestimonialForm} className="mt-4">
              <MessageSquarePlus size={18} />
              Leave one
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 6).map((t, index) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full"
                >
                  <article className="lift-card flex h-full flex-col p-6 md:p-8">
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < t.rating ? 'fill-gold text-gold' : 'text-rule'}
                      />
                    ))}
                  </div>
                  <p className="mb-6 flex-1 font-serif text-lg italic leading-relaxed text-ink-deep">
                    “{t.content}”
                  </p>
                  <div>
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-sm text-muted">
                      {t.role ? `${t.role}, ` : ''}
                      {t.company}
                    </p>
                  </div>
                  </article>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <button
                onClick={onShowTestimonialForm}
                className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
              >
                <MessageSquarePlus size={16} />
                Share what you shipped with us
              </button>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
