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
    <header className="border-b border-rule bg-paper py-16 md:py-20">
      <Container>
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
