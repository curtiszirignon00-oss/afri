import { useState, useEffect } from 'react';
import { Mail, Lock, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button } from './ui';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

type LoginPageProps = {
  onNavigate: (page: string) => void;
};

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { checkAuth, isLoggedIn, setToken } = useAuth(); // <-- AJOUT : récupération de setToken

  // <-- AJOUT : useEffect pour rediriger automatiquement si déjà connecté
  useEffect(() => {
    if (isLoggedIn) {
      console.log('✅ Utilisateur déjà connecté, redirection vers dashboard');
      onNavigate('dashboard');
    }
  }, [isLoggedIn, onNavigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔑 Tentative de connexion à:', `${API_BASE_URL}/login`);
      console.log('🌐 API_BASE_URL:', API_BASE_URL);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Identifiants incorrects');
      }

      // ✅ Connexion réussie
      toast.success('Connexion réussie !');

      // Stocker le token et vérifier l'authentification
      if (data.token) {
        console.log('💾 [LOGIN] Storing token and checking auth');
        setToken(data.token);
        // Passer le token directement à checkAuth pour éviter les problèmes de closure
        await checkAuth(data.token);
      } else {
        // Sur desktop, pas de token dans la réponse, utiliser les cookies
        await checkAuth();
      }

      // Redirection vers le dashboard
      onNavigate('dashboard');

    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
      toast.error(err.message || 'Erreur de connexion');
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
            <button onClick={() => onNavigate('home')} className="flex items-center space-x-2">
              <TrendingUp className="w-12 h-12 text-blue-600" />
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
          <form onSubmit={handleLogin} className="space-y-6">
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Se souvenir de moi
                </label>
              </div>
              <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Mot de passe oublié?
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

          {/* Link to Signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous n'avez pas de compte?{' '}
              <button
                onClick={() => onNavigate('signup')}
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
            onClick={() => onNavigate('home')}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}