// src/components/real-portfolio/PortfolioSurfaceSwitch.tsx
// Bascule Simulateur ↔ Portefeuille réel, en tête des deux dashboards.
// Sur téléphone c'est le point d'entrée principal du réel : le header est plein,
// et l'onglet central de la barre du bas mène aux deux surfaces.

import { Link } from 'react-router-dom';
import { Gamepad2, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealPortfolioDiscovery } from '../../hooks/useRealPortfolio';

interface Props {
  active: 'sim' | 'real';
  /** glass = sur le fond sombre du portefeuille réel. */
  variant?: 'light' | 'glass';
  className?: string;
}

export function useRealPortfolioIsNew() {
  const { isLoggedIn } = useAuth();
  const { data } = useRealPortfolioDiscovery(isLoggedIn);
  return !!data && !data.hasPortfolio && !data.bannerDismissed && !data.guideCompleted;
}

export default function PortfolioSurfaceSwitch({ active, variant = 'light', className = '' }: Props) {
  const isNew = useRealPortfolioIsNew();
  const glass = variant === 'glass';

  const wrap = glass ? 'glass-pill' : 'bg-gray-100 border border-gray-200';
  const tab = (on: boolean) => on
    ? (glass ? 'bg-white text-stone-900 shadow' : 'bg-white text-gray-900 shadow-sm')
    : (glass ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900');

  return (
    <nav aria-label="Choix du portefeuille" className={`inline-flex w-full sm:w-auto rounded-full p-1 ${wrap} ${className}`}>
      <Link
        to="/dashboard"
        aria-current={active === 'sim' ? 'page' : undefined}
        className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab(active === 'sim')}`}
      >
        <Gamepad2 className="w-4 h-4" /> Simulateur
      </Link>
      <Link
        to="/portefeuille-reel"
        aria-current={active === 'real' ? 'page' : undefined}
        className={`relative flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${tab(active === 'real')}`}
      >
        <Wallet className="w-4 h-4" /> Portefeuille réel
        {isNew && active !== 'real' && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase leading-none">Nouveau</span>
        )}
      </Link>
    </nav>
  );
}
