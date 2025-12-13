import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Lock, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de réinitialisation manquant dans l\'URL.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!newPassword || !confirmPassword) {
      setStatus('error');
      setMessage('Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/reset-password`,
        { token, newPassword }
      );

      setStatus('success');
      setMessage(response.data.message);

      // Redirection vers login après 3 secondes
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.error ||
        'Une erreur est survenue lors de la réinitialisation du mot de passe.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
            <Lock className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Nouveau mot de passe
          </h2>
          <p className="text-gray-600 mt-2">
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        {/* Success State */}
        {status === 'success' ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4 animate-bounce">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Mot de passe réinitialisé !
            </h3>
            <p className="text-gray-700 mb-6">{message}</p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                ✅ Votre mot de passe a été modifié avec succès
              </p>
              <p className="text-sm text-green-600 mt-2">
                Redirection vers la page de connexion...
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-orange-600 text-white rounded-lg px-6 py-3 hover:bg-orange-700 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              Se connecter maintenant
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Minimum 8 caractères"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                  disabled={status === 'loading'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Retapez le mot de passe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                  disabled={status === 'loading'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-semibold mb-1">Erreur</p>
                  <p className="text-sm text-red-700">{message}</p>
                  {message.includes('expiré') && (
                    <button
                      onClick={() => navigate('/mot-de-passe-oublie')}
                      className="text-sm text-red-600 hover:text-red-700 underline mt-2"
                    >
                      Demander un nouveau lien
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Le mot de passe doit contenir :
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                  • Au moins 8 caractères
                </li>
                <li className={newPassword === confirmPassword && newPassword !== '' ? 'text-green-600' : ''}>
                  • Les deux mots de passe doivent correspondre
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading' || !token}
              className="w-full bg-orange-600 text-white rounded-lg px-6 py-3 hover:bg-orange-700 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </form>
        )}

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Besoin d'aide ?{' '}
            <a
              href="mailto:contact@africbourse.com"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
