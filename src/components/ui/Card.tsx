import type { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'li';
}) {
  return (
    <Tag className={`rounded-2xl border border-rule bg-surface shadow-[0_1px_2px_rgb(14_36_54/0.04)] ${className}`}>
      {children}
    </Tag>
  );
}
