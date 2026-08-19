'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { buttonClassName, type ButtonVariant, type ButtonSize } from './buttonStyles';

export type { ButtonVariant, ButtonSize };
export { buttonClassName } from './buttonStyles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={buttonClassName(variant, size, className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
