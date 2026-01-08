import { useState } from 'react';
import { Zap } from 'lucide-react';
import PremiumPaywall from './PremiumPaywall';

interface PremiumFeatureButtonProps {
  feature: string;
  plan?: 'investisseur-plus' | 'pro';
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'button' | 'badge';
}

export default function PremiumFeatureButton({
  feature,
  plan = 'investisseur-plus',
  children,
  className = '',
  icon,
  variant = 'button',
}: PremiumFeatureButtonProps) {
  const [showPaywall, setShowPaywall] = useState(false);

  if (variant === 'badge') {
    return (
      <>
        <button
          onClick={() => setShowPaywall(true)}
          className={`inline-flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold rounded-full hover:from-yellow-500 hover:to-orange-600 transition-all ${className}`}
        >
          <Zap className="w-3 h-3" />
          <span>Premium</span>
        </button>
        <PremiumPaywall
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature={feature}
          plan={plan}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowPaywall(true)}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg ${className}`}
      >
        {icon || <Zap className="w-4 h-4" />}
        <span>{children || 'Débloquer avec Premium'}</span>
      </button>
      <PremiumPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature={feature}
        plan={plan}
      />
    </>
  );
}
