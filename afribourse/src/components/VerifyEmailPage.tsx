// src/components/VerifyEmailPage.tsx
//
// Confirmation d'inscription. Page sans en-tete applicatif : elle doit tenir
// dans une fenetre sans defilement, d'ou une carte large en deux colonnes
// plutot qu'une colonne etroite. Charte du site : navy, orange du logo, gris.
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';
import { Button } from './ui';

const STEPS = [
  { title: 'Ouvrez votre boîte de réception', text: "L'email arrive en général en moins d'une minute." },
  { title: 'Cliquez sur le lien', text: 'Le bouton « Confirmer mon email » se trouve au milieu du message.' },
  { title: 'Connectez-vous', text: 'Votre compte est actif dès la confirmation.' },
];

const TROUBLESHOOTING = [
  'Regardez dans les courriers indésirables.',
  "Vérifiez que l'adresse saisie est la bonne.",
  "L'envoi peut prendre jusqu'à 5 minutes.",
];

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  // Redirection declarative : appeler navigate() pendant le rendu provoquait
  // un avertissement React (mise a jour d'un composant en cours de rendu).
  if (!email) return <Navigate to="/signup" replace />;

  return (
    <div
      className="bg-ink-50 flex items-center justify-center p-4 sm:p-6"
      style={{ minHeight: 'calc(100vh - var(--app-top-h, 4rem))' }}
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-gray-200 shadow-2xl shadow-ink-900/10 p-6 sm:p-8">

        {/* En-tete : logo, titre et adresse sur une seule rangee */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-gray-100">
          <button
            onClick={() => navigate('/')}
            aria-label="Retour à l'accueil"
            className="shrink-0 cursor-pointer"
          >
            <img src="/images/logo_afribourse.png" alt="AfriBourse" className="w-12 h-12 object-contain" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vérifiez votre email</h1>
            <p className="text-sm text-gray-500 mt-1">
              Nous avons envoyé un lien de confirmation à{' '}
              <span className="font-mono font-semibold text-brand-navy break-all">{email}</span>
            </p>
          </div>

        </div>

        {/* Deux colonnes : la marche a suivre, puis les rappels */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 py-6">

          <ol className="space-y-4">
            {STEPS.map(({ title, text }, i) => (
              <li key={title} className="flex gap-3">
                <span className="w-7 h-7 shrink-0 rounded-lg bg-ink-50 border border-ink-100 text-brand-navy font-mono text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed mt-0.5">{text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="space-y-4">
            {/* Expiration : la carte d'avertissement du site */}
            <div className="flex items-start gap-3 rounded-xl border-2 border-brand-orange p-4">
              <Clock className="w-5 h-5 text-brand-orange-dark shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Le lien expire dans 24 heures</p>
                <p className="text-sm text-gray-600 mt-0.5">Confirmez votre adresse sans trop tarder.</p>
              </div>
            </div>

            {/* Depannage */}
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
                Vous ne voyez pas l'email ?
              </p>
              <ul className="space-y-1.5">
                {TROUBLESHOOTING.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-navy mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Reperer le message d'un coup d'oeil */}
            <p className="flex items-center gap-2 text-xs text-gray-400">
              De : <span className="font-semibold text-gray-600">AfriBourse</span> · Objet :{' '}
              <span className="font-semibold text-gray-600">Confirmez votre inscription</span>
            </p>
          </div>
        </div>

        {/* Actions sur une rangee */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-5 border-t border-gray-100">
          <Button
            type="button"
            variant="orange"
            size="lg"
            className="w-full sm:flex-1 uppercase tracking-widest"
            onClick={() => navigate('/renvoyer-confirmation', { state: { email } })}
          >
            Renvoyer l'email
          </Button>
          <Button
            type="button"
            variant="navyOutline"
            size="lg"
            className="w-full sm:flex-1"
            onClick={() => navigate('/login')}
          >
            Retour à la connexion
          </Button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Besoin d'aide ?{' '}
          <a
            href="mailto:support@africbourse.com"
            className="font-semibold text-brand-navy hover:underline transition-colors"
          >
            Contactez le support
          </a>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;