import type { ReactNode } from 'react';
import Container from './Container';

export default function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = '',
  band = false,
  align = 'center',
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  band?: boolean;
  align?: 'center' | 'left';
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <section
      id={id}
      className={`relative py-24 md:py-32 ${band ? 'bg-paper-2' : 'bg-paper'} ${className}`}
    >
      <Container>
        {(eyebrow || title || description) && (
          <div className={`mb-16 max-w-3xl ${alignClass}`}>
            {eyebrow && (
              <p className="mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-serif text-4xl font-medium tracking-tight text-ink-deep md:text-5xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-5 text-lg leading-relaxed text-muted">{description}</p>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
