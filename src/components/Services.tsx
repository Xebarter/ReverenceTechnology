'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useUser } from '../UserContext';

interface Service {
  id: string;
  package_name: string;
  description: string;
  key_features: { feature: string }[];
  target_audience: { audience: string }[];
  suggested_pricing: string;
  display_order: number;
  created_at: string;
}

export default function Services() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllServices, setShowAllServices] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('Service fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = (service: Service) => {
    const next = `/dashboard/projects/new?service=${encodeURIComponent(service.id)}`;
    if (authLoading) return;
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(next)}`);
      return;
    }
    router.push(next);
  };

  if (loading) {
    return (
      <section className="flex items-center justify-center bg-paper py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-rule border-t-ink" />
          <p className="font-medium text-muted">Loading service offerings…</p>
        </div>
      </section>
    );
  }

  const servicesToShow = showAllServices ? services : services.slice(0, 6);

  return (
    <section id="services" className="relative bg-paper px-4 py-24">
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-6 inline-flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold"
          >
            <ShieldCheck size={15} />
            Packages
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-6 font-serif text-4xl font-medium tracking-tight text-ink-deep md:text-5xl"
          >
            Pick a package. We quote a total. You pay as work lands.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg text-muted"
          >
            No retainer surprise. You start a project from the package, we agree a number, then you
            pay by mobile money or card when we request an installment.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="mt-6"
          >
            <Link
              href="/services"
              className="text-sm font-medium text-ink underline decoration-gold underline-offset-4 hover:text-ink-deep"
            >
              Explore software, web, and app services
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {servicesToShow.map((service, index) => {
            const featured = index === 1;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={`relative flex flex-col rounded-md border border-rule bg-surface p-8 ${
                  featured ? 'border-l-[3px] border-l-gold' : ''
                }`}
              >
                {featured && (
                  <span className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">
                    Most selected
                  </span>
                )}

                <div className="mb-8">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-md bg-paper p-3 text-ink">
                      {index % 3 === 0 ? (
                        <Zap size={24} />
                      ) : index % 3 === 1 ? (
                        <ShieldCheck size={24} />
                      ) : (
                        <Sparkles size={24} />
                      )}
                    </div>
                    <span className="text-xl font-medium text-ink-deep">{service.suggested_pricing}</span>
                  </div>

                  <h3 className="mb-3 font-serif text-2xl font-medium text-ink-deep">{service.package_name}</h3>
                  <p className="text-sm text-muted">{service.description}</p>
                </div>

                <ul className="mb-8 flex-grow space-y-3">
                  {service.key_features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check size={16} className="text-gold" />
                      <span className="text-muted">{f.feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleGetStarted(service)}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-ink py-3.5 font-medium text-paper transition hover:bg-ink-deep"
                >
                  Start this package <ChevronRight size={18} />
                </button>
              </motion.div>
            );
          })}
        </div>

        {services.length > 6 && (
          <div className="mt-16 text-center">
            <button
              onClick={() => setShowAllServices(!showAllServices)}
              className="rounded-md border border-rule bg-surface px-8 py-3 font-medium text-ink hover:border-ink"
            >
              {showAllServices ? 'Show Featured Services' : `View All ${services.length} Services`}
            </button>
          </div>
        )}

        <div className="mt-20 overflow-hidden rounded-md border border-rule">
          <div className="border-b border-rule bg-surface px-5 py-4 sm:px-6">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">How it works</p>
            <h3 className="mt-1 font-serif text-2xl text-ink-deep">What happens after you start a package</h3>
          </div>
          <div className="grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'You pick a package',
                desc: 'Opens a project in your account.',
              },
              {
                step: '02',
                title: 'We send a total',
                desc: 'One number for the agreed scope. Work does not start until you accept it.',
              },
              {
                step: '03',
                title: 'You pay as work lands',
                desc: 'MTN or Airtel on your phone, or card. Installment or remaining balance.',
              },
              {
                step: '04',
                title: 'You own the code',
                desc: 'Source, assets, and documentation when it ships.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-surface px-5 py-6 sm:px-6">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">{item.step}</p>
                <h4 className="mt-2 font-serif text-lg text-ink-deep">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
