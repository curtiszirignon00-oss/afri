// src/components/profile/ProfileSectionCard.tsx
//
// Chrome commun des blocs de la colonne laterale du profil.
//
// Chaque bloc (badges, activite, score, profils similaires, certificats...)
// repetait sa propre entete. Un seul composant fixe la charte : carte blanche,
// bord ink-100, titre ink-900, sous-titre ink-500. Les tuiles d'icone ont ete
// retirees : dix blocs empiles portaient dix pastilles, le titre suffit.
import type { ReactNode } from 'react';

interface ProfileSectionCardProps {
  title: string;
  subtitle?: string;
  /** Lien ou bouton aligne a droite de l'entete. */
  action?: ReactNode;
  children?: ReactNode;
  /** Ancre pour les liens internes (#score-investisseur...). */
  id?: string;
  className?: string;
  /** Remplace le padding du corps quand le contenu doit toucher les bords. */
  bodyClassName?: string;
}

export default function ProfileSectionCard({
  title,
  subtitle,
  action,
  children,
  id,
  className = '',
  bodyClassName,
}: ProfileSectionCardProps) {
  return (
    <section
      id={id}
      className={`bg-white rounded-2xl border border-ink-100 shadow-sm ${id ? 'scroll-mt-24' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-ink-500 mt-0.5 leading-snug">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children != null && <div className={bodyClassName ?? 'px-5 pb-5'}>{children}</div>}
    </section>
  );
}

/** Lien d'action discret des entetes de carte (« Voir tout », « Marche »...). */
export const SECTION_ACTION_CLASS =
  'text-sm font-medium text-brand-navy hover:text-brand-orange-dark transition-colors cursor-pointer ' +
  'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2';
