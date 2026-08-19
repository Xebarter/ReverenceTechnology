export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink-deep border border-ink',
  secondary: 'bg-transparent text-ink border border-rule hover:border-ink hover:bg-surface',
  ghost:
    'bg-transparent text-ink border border-transparent hover:text-ink-deep underline decoration-gold underline-offset-4',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = ''
) {
  return `inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`;
}
