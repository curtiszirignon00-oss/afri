import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button } from './ui';
import toast from 'react-hot-toast';
import { apiClient } from '../lib/api-client';
import { fetchCsrfToken, setAuthToken } from '../config/api';
import OAuthButtons from './auth/OAuthButtons';

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

  // <-- AJOUT : useEffect pour rediriger automatiquement si déjà connecté
  useEffect(() => {
    if (isLoggedIn) {
      navigate(redirectTo);
    }
  }, [isLoggedIn, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginResponse = await apiClient.post('/login', { email, password, rememberMe });

      const { user, token } = loginResponse.data;

      // Stocker le token en mémoire immédiatement (fallback Safari iOS ITP)
      if (token) {
        setAuthToken(token);
      }

      // Rafraîchir le token CSRF après login
      await fetchCsrfToken();

      // Alimenter l'état auth directement depuis la réponse — sans second appel réseau
      // Évite la race condition avec le checkAuth() initial du AuthContext
      initAuthFromLogin(user, token);

      toast.success('Connexion réussie !');
      navigate(redirectTo);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* --- Header --- */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <button onClick={() => navigate('/')} className="flex items-center space-x-2">
              <img
                src="/images/logo_afribourse.png"
                alt="AfriBourse Logo"
                className="w-16 h-16 object-contain"
              />
              <span className="text-3xl font-bold text-gray-900">AfriBourse</span>
            </button>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bon retour parmi nous
          </h2>
          <p className="text-gray-600">
            Connectez-vous pour accéder à votre compte
          </p>
        </div>

        {/* --- Login Form --- */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6" translate="no">
            {/* Email Input */}
            <Input
              id="email"
              name="email"
              type="email"
              label="Adresse e-mail"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              disabled={loading}
            />

            {/* Password Input */}
            <Input
              id="password"
              name="password"
              type="password"
              label="Mot de passe"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5 text-gray-400" />}
              disabled={loading}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>
              <button
                type="button"
                onClick={() => navigate('/mot-de-passe-oublie')}
                className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* OAuth Social Login */}
          <div className="mt-6">
            <OAuthButtons mode="login" />
          </div>

          {/* Link to Signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous n'avez pas de compte?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>

        {/* Link back to Home */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}