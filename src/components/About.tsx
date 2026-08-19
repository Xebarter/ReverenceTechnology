import { Award, Users, TrendingUp, Heart, Lightbulb, Shield, Handshake } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container } from './ui';

export default function About() {
  const stats = [
    { icon: Award, value: '5+', label: 'Years Experience' },
    { icon: Users, value: '75+', label: 'Satisfied Clients' },
    { icon: TrendingUp, value: '50+', label: 'Projects Completed' },
    { icon: Heart, value: '98%', label: 'Client Retention' },
  ];

  const values = [
    { icon: Lightbulb, title: 'Innovation', desc: 'Cutting-edge solutions adapted for local needs' },
    { icon: Shield, title: 'Accessibility', desc: 'Technology within reach of every organization' },
    { icon: Handshake, title: 'Partnership', desc: 'Long-term relationships built on trust' },
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
            Why Reverence
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl font-medium tracking-tight text-ink-deep md:text-5xl"
          >
            Built for East Africa, trusted globally
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted"
          >
            We understand the unique challenges of the East African market. Our solutions are
            built for local context—from{' '}
            <span className="text-ink underline decoration-gold decoration-1 underline-offset-4">
              mobile money ecosystems
            </span>{' '}
            to resilient off-grid infrastructure.
          </motion.p>
        </div>

        <div className="mb-20 grid grid-cols-2 border-y border-rule lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className={`px-6 py-10 text-center ${index < 3 ? 'lg:border-r lg:border-rule' : ''} ${index % 2 === 0 ? 'border-r border-rule lg:border-r' : ''} ${index < 2 ? 'border-b border-rule lg:border-b-0' : ''}`}
            >
              <stat.icon className="mx-auto mb-4 text-gold" size={22} />
              <p className="font-serif text-4xl text-ink-deep">{stat.value}</p>
              <p className="mt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="border border-rule bg-ink-deep px-8 py-14 text-paper md:px-16 md:py-20">
          <p className="mb-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
            Our Mission
          </p>
          <h3 className="mx-auto mb-14 max-w-3xl text-center font-serif text-2xl font-medium leading-snug md:text-3xl">
            Bridging the digital divide across East Africa through innovative, accessible
            technology.
          </h3>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <value.icon size={22} className="mx-auto mb-4 text-gold" />
                <h4 className="mb-2 font-serif text-xl">{value.title}</h4>
                <p className="text-sm leading-relaxed text-paper/70">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
