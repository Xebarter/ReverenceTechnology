'use client';

import {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  forwardRef,
  type ReactNode,
} from 'react';

const fieldClass =
  'w-full rounded-xl border border-rule bg-surface px-3.5 py-2.5 text-ink placeholder:text-muted/60 transition duration-200 focus:border-gold focus:ring-1 focus:ring-gold/40';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} className={`${fieldClass} ${className}`} {...props} />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea ref={ref} className={`${fieldClass} min-h-[120px] resize-vertical ${className}`} {...props} />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', ...props }, ref) => (
    <select ref={ref} className={`${fieldClass} ${className}`} {...props} />
  )
);
Select.displayName = 'Select';

export const FieldLabel = ({
  children,
  htmlFor,
  className = '',
}: {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) => (
  <label
    htmlFor={htmlFor}
    className={`mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted ${className}`}
  >
    {children}
  </label>
);

export default Input;
