// src/components/SignupPage.tsx - VERSION MIGRÉE
import { useState } from 'react';
import { Mail, Lock, TrendingUp, AlertCircle, CheckCircle, User as UserIcon } from 'lucide-react';
import { Button, Input, Card } from './ui';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

type SignupPageProps = {
  onNavigate: (page: string) => void;
};

export default function SignupPage({ onNavigate }: SignupPageProps) {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { setToken, checkAuth } = useAuth();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!name || !lastname) {
      setError('Veuillez entrer votre prénom et nom.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Tentative d\'inscription à:', `${API_BASE_URL}/register`);
      console.log('🌐 API_BASE_URL:', API_BASE_URL);

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lastname, email, password }),
        credentials: 'include',
      });

      console.log('📥 Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Erreur lors de l'inscription");
      }

      // Stocker le token et vérifier l'authentification
      if (data.token) {
        console.log('💾 [SIGNUP] Storing token and checking auth');
        setToken(data.token);
        // Passer le token directement à checkAuth pour éviter les problèmes de closure
        await checkAuth(data.token);
      } else {
        // Sur desktop, pas de token dans la réponse, utiliser les cookies
        await checkAuth();
      }

      setSuccess(true);
      setTimeout(() => {
        onNavigate('dashboard'); // Redirection directe vers le dashboard après l'inscription
      }, 2000);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Commencez votre aventure d'investissement</p>
        </div>

        {/* ✅ Card remplace div bg-white */}
        <Card>
          <form onSubmit={handleSignup} className="space-y-6">
            {/* ✅ Input remplace input manuel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                disabled={loading}
                required
              />

              <Input
                type="text"
                label="Nom"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                placeholder="Dupont"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                disabled={loading}
                required
              />
            </div>

            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              disabled={loading}
              required
            />

            <Input
              type="password"
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              helperText="Au moins 6 caractères"
              disabled={loading}
              required
            />

            <Input
              type="password"
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              helperText="Saisissez à nouveau votre mot de passe"
              disabled={loading}
              required
            />

            {/* Messages d'erreur et succès */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">Compte créé avec succès ! Redirection...</p>
              </div>
            )}

            {/* ✅ Button remplace button manuel */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
          </form>

          {/* Lien vers connexion */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-indigo-600 font-semibold hover:underline"
              disabled={loading}
            >
              Se connecter
            </button>
          </div>
        </Card>

        {/* Retour à l'accueil */}
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => onNavigate('home')} disabled={loading}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}