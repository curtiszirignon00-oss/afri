// src/components/real-portfolio/discovery/RealPortfolioDiscovery.tsx
// Découverte du portefeuille réel, montée sur le dashboard :
//  - nouveaux inscrits : guide lancé automatiquement une fois tous les popups
//    d'arrivée fermés (bienvenue, annonces, vérification e-mail…) ;
//  - comptes existants : encart « Nouveau » + même lancement automatique.
// Un seul lancement automatique ; l'encart permet de relancer le guide.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, X, Sparkles, Upload } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useOnboardingGuideContext } from '../../../context/OnboardingGuideContext';
import { useRealPortfolioDiscovery, useRecordDiscovery } from '../../../hooks/useRealPortfolio';
import { useQuietScreen } from '../../../hooks/useQuietScreen';
import { trackRealPortfolioBanner, trackRealPortfolioGuide } from '../../../lib/amplitude';
import RealPortfolioGuide from './RealPortfolioGuide';
import { GUIDE_ROOT_SELECTOR, GUIDE_SESSION_KEY } from './constants';

function sessionFlag(): boolean {
  try { return sessionStorage.getItem(GUIDE_SESSION_KEY) === '1'; } catch { return false; }
}
function setSessionFlag() {
  try { sessionStorage.setItem(GUIDE_SESSION_KEY, '1'); } catch { /* navigation privée */ }
}

export default function RealPortfolioDiscovery() {
  const { isLoggedIn } = useAuth();
  const onboarding = useOnboardingGuideContext();
  const navigate = useNavigate();
  const { data } = useRealPortfolioDiscovery(isLoggedIn);
  const record = useRecordDiscovery();
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<'auto' | 'banner'>('auto');
  const [autoShown] = useState(sessionFlag);

  const audience = data?.audience;
  const autoEligible = !!data && !data.hasPortfolio && !data.guideSeen && !autoShown && !onboarding.showWelcome;
  // Délai + écran sans modale : le guide passe après tout ce qui s'affiche à l'arrivée.
  const quiet = useQuietScreen(autoEligible, { minDelayMs: 4000, quietMs: 2000, ignoreSelector: GUIDE_ROOT_SELECTOR });

  useEffect(() => {
    if (!quiet || !autoEligible) return;
    setSessionFlag();
    setTrigger('auto');
    setOpen(true);
    trackRealPortfolioGuide('shown', { audience, trigger: 'auto' });
  }, [quiet]); // eslint-disable-line react-hooks/exhaustive-deps

  const showBanner = !!data && audience === 'existing' && !data.hasPortfolio && !data.bannerDismissed;
  useEffect(() => {
    if (showBanner) trackRealPortfolioBanner('shown');
  }, [showBanner]);

  const close = useCallback((reason: 'later' | 'closed') => {
    setOpen(false);
    record.mutate('guide_seen');
    trackRealPortfolioGuide(reason, { audience, trigger });
  }, [record, audience, trigger]);

  const goImport = useCallback(() => {
    setOpen(false);
    record.mutate('guide_completed');
    trackRealPortfolioGuide('import_clicked', { audience, trigger });
    navigate('/portefeuille-reel/import');
  }, [record, audience, trigger, navigate]);

  if (!data || data.hasPortfolio) return null;

  return (
    <>
      {showBanner && (
        <div className="mb-6 relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-indigo-50 p-4 sm:p-5">
          <button
            onClick={() => { record.mutate('banner_dismissed'); trackRealPortfolioBanner('dismissed'); }}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white"
            aria-label="Masquer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-6">
            <span className="shrink-0 inline-flex w-11 h-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Wallet className="w-6 h-6" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide">
                  <Sparkles className="w-3 h-3" /> Nouveau
                </span>
                <h3 className="font-bold text-gray-900">Suivez votre vrai portefeuille BRVM</h3>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Importez les lignes détenues chez votre SGI : contrôle automatique, valorisation au dernier cours, performance et allocation. Votre simulateur reste inchangé.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => { setTrigger('banner'); setOpen(true); trackRealPortfolioBanner('discover_clicked'); trackRealPortfolioGuide('shown', { audience, trigger: 'banner' }); }}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Découvrir
              </button>
              <button
                onClick={() => { trackRealPortfolioBanner('import_clicked'); navigate('/portefeuille-reel/import'); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Upload className="w-4 h-4" /> Importer
              </button>
            </div>
          </div>
        </div>
      )}

      <RealPortfolioGuide
        open={open}
        onStep={step => step > 0 && trackRealPortfolioGuide('step', { audience, trigger, step })}
        onImport={goImport}
        onClose={close}
      />
    </>
  );
}
