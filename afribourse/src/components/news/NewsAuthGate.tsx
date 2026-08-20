import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Check, ArrowRight } from 'lucide-react';
import { HERO_GRID_STYLE } from '../../utils/heroBackgrounds';

interface Props {
  variant?: 'list' | 'article';
}

/**
 * Mur d'inscription gratuit pour les visiteurs non connectés.
 * - variant "list"   : bloc affiché en bas de la portion gratuite de /news
 * - variant "article": bloc de lecture verrouillée sur la page d'un article
 *
 * Habillage repris du bandeau « Prêt à commencer votre voyage d'investissement ? »
 * de l'accueil : degrade navy, halo en haut a droite, trame quadrillee.
 */
export default function NewsAuthGate({ variant = 'list' }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = encodeURIComponent(location.pathname + location.search);

  const isArticle = variant === 'article';

  return (
    <div className={isArticle ? 'relative' : ''}>
      {/* Dégradé de fondu (lecture article : laisse deviner la suite) */}
      {isArticle && (
        <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white pointer-events-none" />
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-[#173F66] to-ink-950 text-white text-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 88% 15%, #7C95AB 0%, transparent 55%)' }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={HERO_GRID_STYLE}
        />

        <div className="relative py-12 md:py-16 px-6">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-sm">
            <Lock className="w-6 h-6 text-brand-orange-light" />
          </div>

          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            {isArticle
              ? 'Lisez cet article gratuitement'
              : 'Accédez à toute l’actualité gratuitement'}
          </h3>
          <p className="text-ink-200 max-w-2xl mx-auto mb-6 leading-relaxed">
            {isArticle
              ? 'Créez un compte gratuit pour lire l’article complet, ses graphiques et toutes nos analyses de la BRVM.'
              : 'Inscrivez-vous gratuitement pour débloquer l’ensemble des actualités, analyses et résultats de la BRVM.'}
          </p>

          {/* Avantages */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 text-sm text-ink-200">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand-orange-light" /> 100% gratuit</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand-orange-light" /> Analyses &amp; résultats</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-brand-orange-light" /> Sans engagement</span>
          </div>

          {/* Meme paire de boutons que le bandeau de l'accueil : action
              principale en blanc, action secondaire en contour. */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/signup?redirect=${redirect}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-7 rounded-lg bg-white text-brand-navy font-semibold shadow-sm transition-colors duration-200 cursor-pointer hover:bg-ink-50"
            >
              Créer un compte gratuit
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>
            <button
              onClick={() => navigate(`/login?redirect=${redirect}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 sm:h-14 px-7 rounded-lg text-white font-semibold ring-1 ring-white/25 transition-colors duration-200 cursor-pointer hover:bg-white/10"
            >
              J'ai déjà un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
