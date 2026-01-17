// src/components/share/ShareButton.tsx
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    className?: string;
}

export default function ShareButton({
    onClick,
    variant = 'ghost',
    size = 'sm',
    label = 'Partager',
    className = '',
}: ShareButtonProps) {
    const baseClasses = 'inline-flex items-center gap-2 rounded-lg font-medium transition-colors';

    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        ghost: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50',
    };

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            <Share2 className={iconSizes[size]} />
            {label}
        </button>
    );
}
