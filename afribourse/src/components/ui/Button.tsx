// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { BTN_BASE, BTN_VARIANTS, type ButtonVariant } from './buttonStyles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Forme et habillages : voir ./buttonStyles, partage avec le header.
    const baseClasses = BTN_BASE;
    const variantClasses = BTN_VARIANTS;

    // Tailles
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    // Largeur complète
    const widthClass = fullWidth ? 'w-full' : '';

    // Combinaison des classes
    const classes = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${widthClass}
      ${disabled || isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;