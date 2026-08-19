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
    <Tag className={`rounded-md border border-rule bg-surface ${className}`}>
      {children}
    </Tag>
  );
}
