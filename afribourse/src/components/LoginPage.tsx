import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button } from './ui';
import toast from 'react-hot-toast';
import { apiClient } from '../lib/api-client';
import { fetchCsrfToken, setAuthToken } from '../config/api';
import OAuthButtons from './auth/OAuthButtons';
import { trackLogin } from '../lib/amplitude';
import { HERO_GRID_STYLE } from '../utils/heroBackgrounds';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { initAuthFromLogin, isLoggedIn } = useAuth();

  // Rediriger si déjà connecté AU MONTAGE uniquement (pas pendant le flow de login)
  const wasAlreadyLoggedIn = useRef(isLoggedIn);
  useEffect(() => {
    if (wasAlreadyLoggedIn.current) {
      navigate(redirectTo);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginResponse = await apiClient.post('/login', { email, password, rememberMe });

      const { user, token, refreshToken } = loginResponse.data;

      // Stocker le token en mémoire immédiatement (fallback Safari iOS ITP)
      if (token) {
        setAuthToken(token);
      }

      // Rafraîchir le token CSRF après login
      await fetchCsrfToken();

      // Alimenter l'état auth directement depuis la réponse — sans second appel réseau
      // Évite la race condition avec le checkAuth() initial du AuthContext
      initAuthFromLogin(user, token, refreshToken);
      trackLogin('email');

      toast.success('Connexion réussie !');

      // Si le sondage de découverte n'est pas complété → onboarding 3 questions
      const surveyCompleted = loginResponse.data.gamification?.survey_completed ?? false;
      navigate(surveyCompleted ? redirectTo : '/survey');

    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Une erreur est survenue lors de la connexion.';

      // Vérifier si l'erreur est due à un email non vérifié
      if (errorMessage.includes('confirmer votre adresse email') ||
          errorMessage.includes('email non vérifié') ||
          errorMessage.includes('Veuillez confirmer')) {
        toast.error('Votre email n\'est pas encore vérifié');
        // Rediriger vers la page de renvoi de confirmation avec l'email
        navigate('/renvoyer-confirmation', { state: { email } });
        return;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    // Hauteur bornee a la fenetre moins la barre applicative : la page tenait
    // sur toute la hauteur d'ecran PLUS le padding haut du layout, ce qui
    // forcait un defilement pour atteindre le bouton de connexion.
    <div
      className="bg-ink-50 flex items-center justify-center p-4 sm:p-6"
      style={{ minHeight: 'calc(100vh - var(--app-top-h, 4rem))' }}
    >
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-gray-200 shadow-2xl shadow-ink-900/10 overflow-hidden grid md:grid-cols-2">

        {/* --- Panneau d'accueil ---
            Coins arrondis sur les quatre angles : l'overflow de la carte masque
            les deux exterieurs, seuls les deux interieurs se voient, comme sur
            le modele. */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#173F66] to-ink-950 text-white flex flex-col items-center justify-center text-center px-8 py-12 md:py-16 order-1">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.18] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 85% 12%, rgba(124,149,171,0.34) 0%, transparent 55%)' }}
          />
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.07] pointer-events-none" style={HERO_GRID_STYLE} />

          {/* Le volet ne porte que le logo, cliquable vers l'accueil. */}
          <button
            onClick={() => navigate('/')}
            aria-label="Retour à l'accueil"
            className="relative inline-flex cursor-pointer"
          >
            <img src="/images/logo_afribourse.png" alt="AfriBourse" className="w-44 h-44 md:w-56 md:h-56 object-contain" />
          </button>
        </div>

        {/* --- Formulaire --- */}
        <div className="px-6 py-10 sm:px-10 flex flex-col justify-center order-2">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-6">Se connecter</h2>

          <OAuthButtons mode="login" compact />

          <p className="text-center text-sm text-gray-500 my-5">Ou avec votre e-mail</p>

          <form onSubmit={handleLogin} className="space-y-4" translate="no">
            <Input
              id="email"
              name="email"
              type="email"
              aria-label="Adresse e-mail"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              placeholder="Adresse e-mail"
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              disabled={loading}
            />

            <Input
              id="password"
              name="password"
              type="password"
              aria-label="Mot de passe"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
              placeholder="Mot de passe"
              icon={<Lock className="h-5 w-5 text-gray-400" />}
              disabled={loading}
            />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 accent-brand-navy border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Se souvenir de moi
                </label>
              </div>
              <button
                type="button"
                onClick={() => navigate('/mot-de-passe-oublie')}
                className="text-sm font-semibold text-brand-navy hover:underline transition-colors cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="orange"
              size="lg"
              isLoading={loading}
              disabled={loading}
              className="w-full uppercase tracking-widest"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Seule sortie vers l'inscription depuis cette page — le logo du
              volet gauche reste le chemin vers l'accueil. */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="font-semibold text-brand-navy hover:underline transition-colors cursor-pointer"
            >
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}