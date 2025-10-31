// src/components/ui/Card.tsx
import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // Classes de base
    const baseClasses = 'bg-white rounded-xl';

    // Variantes
    const variantClasses = {
      default: 'shadow-sm border border-gray-200',
      bordered: 'border-2 border-gray-300',
      elevated: 'shadow-lg',
    };

    // Padding
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    // Effet hover
    const hoverClass = hoverable ? 'hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer' : '';

    const classes = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${paddingClasses[padding]}
      ${hoverClass}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;