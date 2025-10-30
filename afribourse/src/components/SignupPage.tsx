import { useState } from 'react';
import { Mail, Lock, TrendingUp, AlertCircle, CheckCircle, User as UserIcon } from 'lucide-react';

type SignupPageProps = {
  onNavigate: (page: string) => void;
};

// L'URL de base pour l'API
const API_BASE_URL = 'http://localhost:3000/api'; 

export default function SignupPage({ onNavigate }: SignupPageProps) {
  const [name, setName] = useState(''); 
  const [lastname, setLastname] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- UPDATED handleSignup function ---
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Basic frontend validation
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

    try {
      // CORRECTION CRITIQUE DE L'URL : Utilisation de la route correcte /api/register
      const response = await fetch(`${API_BASE_URL}/register`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Envoi des champs requis par le backend (name, lastname, email, password)
        body: JSON.stringify({ name, lastname, email, password }), 
      });

      const data = await response.json();

      if (!response.ok) {
        // Affiche l'erreur renvoyée par le backend (ex: email déjà utilisé, etc.)
        throw new Error(data.error || data.message || 'Erreur lors de l\'inscription');
      }

      // Si l'inscription est réussie
      setSuccess(true);
      setTimeout(() => {
        onNavigate('login'); // Navigue vers la page de connexion après le succès
      }, 2000);

    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || 'Une erreur est survenue lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  }
  // --- END UPDATED handleSignup function ---

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
            Créez votre compte
          </h2>
          <p className="text-gray-600">
            Rejoignez des milliers d'investisseurs et commencez votre voyage financier
          </p>
        </div>

        {/* --- Signup Form --- */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSignup} className="space-y-6">
            {/* Name Input */}
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Prénom
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name" name="name" type="text" autoComplete="given-name" required
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastname" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom
                  </label>
                  <div className="relative">
                    <input
                      id="lastname" name="lastname" type="text" autoComplete="family-name" required
                      value={lastname} onChange={(e) => setLastname(e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email" name="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password" name="password" type="password" autoComplete="new-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Minimum 6 caractères
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Display */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  Compte créé avec succès! Vous pouvez maintenant vous connecter. Redirection...
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success} // Disable if success message is showing
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Création en cours...</span>
                </div>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vous avez déjà un compte?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>

        {/* Terms */}
         <div className="text-center">
           <p className="text-xs text-gray-500">
             En créant un compte, vous acceptez nos{' '}
             <button className="text-blue-600 hover:underline">Conditions d'utilisation</button>{' '}
             et notre{' '}
             <button className="text-blue-600 hover:underline">Politique de confidentialité</button>
           </p>
         </div>

        {/* Removed "Why Create Account?" section for brevity, can be added back */}
         <div className="text-center mt-8"> {/* Added margin top */}
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