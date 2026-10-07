import { Award, Users, TrendingUp, CreditCard, Landmark, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container } from './ui';

export default function About() {
  const stats = [
    { icon: Award, value: '5+', label: 'Years Experience' },
    { icon: Users, value: '75+', label: 'Satisfied Clients' },
    { icon: TrendingUp, value: '50+', label: 'Projects Completed' },
  ];

  const reasons = [
    {
      icon: CreditCard,
      title: 'Pay the way you already pay',
      desc: 'MTN, Airtel, or card. No wire instructions, no waiting on a bank slip.',
    },
    {
      icon: Landmark,
      title: 'A total, then installments',
      desc: 'We agree one number. You pay as we request work, or settle the remainder whenever you choose.',
    },
    {
      icon: FileCheck,
      title: 'You own the code',
      desc: 'Kampala-based. When the project is done, the source, assets, and documentation are yours.',
    },
  ];

  return (
    <section id="about" className="bg-paper-2 py-24 md:py-32">
      <Container>
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold"
          >
            Why us
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl font-medium tracking-tight text-ink-deep md:text-5xl"
          >
            Built here. Paid here. Yours when it ships.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted"
          >
            We work in Kampala. The product is designed for East African payments, phones, and
            operators — not a template sold from another timezone.
          </motion.p>
        </div>

        <div className="mb-16 overflow-hidden rounded-2xl border border-rule bg-surface shadow-[0_1px_2px_rgb(14_36_54/0.04)] sm:mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className={`px-6 py-10 text-center ${index < 2 ? 'sm:border-r sm:border-rule' : ''} ${index < 2 ? 'border-b border-rule sm:border-b-0' : ''}`}
            >
              <stat.icon className="mx-auto mb-4 text-gold" size={22} />
              <p className="font-serif text-4xl text-ink-deep">{stat.value}</p>
              <p className="mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
                {stat.label}
              </p>
            </motion.div>
          ))}
          </div>
        </div>

        <div className="panel-dark px-8 py-14 text-paper md:px-16 md:py-20">
          <p className="mb-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
            The deal
          </p>
          <h3 className="mx-auto mb-14 max-w-3xl text-center font-serif text-2xl font-medium leading-snug md:text-3xl">
            How money and ownership work
          </h3>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {reasons.map((reason) => (
              <div key={reason.title} className="text-center">
                <reason.icon size={22} className="mx-auto mb-4 text-gold" />
                <h4 className="mb-2 font-serif text-xl">{reason.title}</h4>
                <p className="text-sm leading-relaxed text-paper/70">{reason.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
