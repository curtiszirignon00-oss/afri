// src/components/ui/PageBanner.tsx
//
// Bandeau d'ouverture des pages editoriales (contact, a propos,
// confidentialite). Reprend exactement l'anatomie de l'en-tete de
// /communities : fond navy signature, tuile d'icone translucide, titre et
// chapeau a gauche, action facultative a droite. Un seul endroit a retoucher
// pour que toutes ces pages bougent ensemble.
import type { LucideIcon } from 'lucide-react';
import { HERO_BACKGROUNDS, HERO_GRID_STYLE } from '../../utils/heroBackgrounds';

interface PageBannerProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Ligne discrete sous le chapeau : date de mise a jour, compteur, etc. */
  meta?: string;
  /** Bouton ou lien aligne a droite. */
  action?: React.ReactNode;
  /** Largeur du contenu, a accorder avec celle de la page. */
  maxWidth?: string;
}

export default function PageBanner({
  icon: Icon,
  title,
  subtitle,
  meta,
  action,
  maxWidth = 'max-w-6xl',
}: PageBannerProps) {
  return (
    <div
      className="relative overflow-hidden text-white"
      style={{ backgroundImage: HERO_BACKGROUNDS[0].gradient }}
    >
      <div className="absolute inset-0" style={{ backgroundImage: HERO_BACKGROUNDS[0].halo }} />
      <div className="absolute inset-0 opacity-[0.07]" style={HERO_GRID_STYLE} />

      <div className={`relative ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-12`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <span className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Icon className="w-8 h-8" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
              <p className="text-ink-100 mt-1 leading-relaxed">{subtitle}</p>
              {meta && <p className="text-sm text-white/60 mt-2">{meta}</p>}
            </div>
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}
