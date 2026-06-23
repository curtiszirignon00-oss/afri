import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Sparkles, Check } from 'lucide-react';

interface Props {
  variant?: 'list' | 'article';
}

/**
 * Mur d'inscription gratuit pour les visiteurs non connectés.
 * - variant "list"   : bloc affiché en bas de la portion gratuite de /news
 * - variant "article": bloc de lecture verrouillée sur la page d'un article
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

      <div className="bg-gradient-to-br from-slate-900 to-[#0A1628] text-white rounded-2xl p-8 sm:p-10 text-center shadow-xl border border-slate-800">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#00D4A8]/15 flex items-center justify-center">
          <Lock className="w-6 h-6 text-[#00D4A8]" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold mb-2">
          {isArticle
            ? 'Lisez cet article gratuitement'
            : 'Accédez à toute l’actualité gratuitement'}
        </h3>
        <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto mb-6">
          {isArticle
            ? 'Créez un compte gratuit pour lire l’article complet, ses graphiques et toutes nos analyses de la BRVM.'
            : 'Inscrivez-vous gratuitement pour débloquer l’ensemble des actualités, analyses et résultats de la BRVM.'}
        </p>

        {/* Avantages */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-7 text-xs sm:text-sm text-slate-300">
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#00D4A8]" /> 100% gratuit</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#00D4A8]" /> Analyses & résultats</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#00D4A8]" /> Sans engagement</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(`/signup?redirect=${redirect}`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00D4A8] hover:bg-[#00bfa0] text-[#0A1628] font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            S'inscrire gratuitement
          </button>
          <button
            onClick={() => navigate(`/login?redirect=${redirect}`)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-xl border border-white/15 transition-colors"
          >
            J'ai déjà un compte
          </button>
        </div>
      </div>
    </div>
  );
}
