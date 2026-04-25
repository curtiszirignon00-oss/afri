// src/components/SignupPage.tsx - VERSION MIGRÉE
import { useState } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle, User as UserIcon } from 'lucide-react';
import { Button, Input, Card } from './ui';
import { API_BASE_URL, authFetch } from '../config/api';
import { useNavigate } from 'react-router-dom';
import OAuthButtons from './auth/OAuthButtons';
import { trackSignUp } from '../lib/amplitude';

const passwordRules = [
  { label: '8 caractères minimum', test: (p: string) => p.length >= 8 },
  { label: 'Une majuscule minimum', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Un caractère spécial minimum (!@#$%...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {passwordRules.map((rule) => {
        const valid = rule.test(password);
        return (
          <li key={rule.label} className={`flex items-center gap-2 text-xs font-medium transition-colors ${valid ? 'text-green-600' : 'text-red-500'}`}>
            <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${valid ? 'bg-green-500' : 'bg-red-400'}`} />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordValid = passwordRules.every((r) => r.test(password));

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

    if (!passwordValid) {
      setError('Le mot de passe ne respecte pas les conditions requises.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lastname, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Erreur lors de l'inscription");
      }

      setSuccess(true);
      trackSignUp('email');

      setTimeout(() => {
        navigate('/verifier-email', { state: { email } });
      }, 1000);
    } catch (err: any) {
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-md">
            <img
              src="/images/logo_afribourse.png"
              alt="AfriBourse Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Commencez votre aventure d'investissement</p>
        </div>

        <Card>
          <form onSubmit={handleSignup} className="space-y-6" translate="no">
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

            <div>
              <Input
                type="password"
                label="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                disabled={loading}
                required
              />
              <PasswordStrengthIndicator password={password} />
            </div>

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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={loading || !passwordValid}
              className="w-full"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
          </form>

          {/* OAuth Social Login */}
          <div className="mt-2">
            <OAuthButtons mode="register" />
          </div>

          {/* Lien vers connexion */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Déjà un compte ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-600 font-semibold hover:underline"
              disabled={loading}
            >
              Se connecter
            </button>
          </div>
        </Card>

        {/* Retour à l'accueil */}
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate('/')} disabled={loading}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
