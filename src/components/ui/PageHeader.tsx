import type { ReactNode } from 'react';
import Container from './Container';

export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-rule bg-paper py-16 md:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute right-0 top-6 h-56 w-56 rounded-full bg-ink/[0.04] blur-3xl" />
      </div>
      <Container className="relative">
        {eyebrow && (
          <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-4xl font-medium tracking-tight text-ink-deep md:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>
        )}
      </Container>
    </header>
  );
}
