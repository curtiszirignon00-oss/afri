// src/components/Footer.tsx
import { Link } from 'react-router-dom';

// Les liens etaient repartis en deux colonnes de longueurs inegales (5 et 3),
// ce qui desequilibrait la grille. Ils forment maintenant une seule liste,
// ordonnee du plus consulte au plus institutionnel.
const FOOTER_LINKS = [
  { to: '/learn',      label: 'Apprendre' },
  { to: '/webinaires', label: 'Webinaires' },
  { to: '/markets',    label: 'Marchés' },
  { to: '/news',       label: 'Actualités' },
  { to: '/glossary',   label: 'Glossaire' },
  { to: '/about',      label: 'À propos' },
  { to: '/contact',    label: 'Contact' },
  { to: '/privacy',    label: 'Confidentialité' },
];

/**
 * Pied de page : composition centree sur un axe unique.
 *
 * L'ancienne version empilait une grille de trois colonnes heterogenes (bloc
 * de marque + deux listes de tailles differentes) au-dessus d'un bas de page
 * centre : deux logiques d'alignement pour un seul bloc. Tout est desormais
 * centre, du logo a l'avertissement.
 */
export default function Footer() {
  return (
    <footer className="bg-ink-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Marque — meme logo et meme logotype que le header, decline pour
            fond sombre : le navy y serait illisible, le blanc le remplace et
            l'orange passe a sa variante eclaircie. */}
        <div className="flex flex-col items-center text-center">
          <img
            src="/images/logo_afribourse.png"
            alt=""
            aria-hidden="true"
            className="w-12 h-12 object-contain"
          />
          <span className="mt-2 font-display text-2xl font-bold tracking-tight leading-none">
            Afri<span className="text-brand-orange-light">Bourse</span>
          </span>
          <p className="mt-3 text-sm text-ink-300">
            Apprenez, simulez et investissez en toute confiance.
          </p>
        </div>

        {/* Navigation — une seule rangee, qui se replie d'elle-meme en petit
            ecran sans casser la symetrie. */}
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          {FOOTER_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-ink-300 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mentions */}
        <div className="mt-8 border-t border-ink-800 pt-6 text-center">
          <p className="text-sm text-ink-300">
            &copy; {new Date().getFullYear()} AfriBourse. Tous droits réservés.
          </p>
        </div>

      </div>
    </footer>
  );
}
