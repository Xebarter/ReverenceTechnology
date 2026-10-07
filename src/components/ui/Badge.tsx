import type { ReactNode } from 'react';

export default function Badge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-rule bg-surface/95 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink backdrop-blur-sm ${className}`}
    >
      {children}
    </span>
  );
}
