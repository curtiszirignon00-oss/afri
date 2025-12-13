import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Mail, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const ResendConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Veuillez entrer une adresse email valide.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/resend-confirmation`,
        { email }
      );

      setStatus('success');
      setMessage(response.data.message);
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.error ||
        'Une erreur est survenue lors de l\'envoi de l\'email.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Renvoyer l'email de confirmation
          </h2>
          <p className="text-gray-600 mt-2">
            Entrez votre adresse email pour recevoir un nouveau lien de confirmation
          </p>
        </div>

        {/* Success State */}
        {status === 'success' ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4 animate-bounce">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Email envoyé !
            </h3>
            <p className="text-gray-700 mb-6">{message}</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                📧 Vérifiez votre boîte de réception
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Si vous ne voyez pas l'email, vérifiez votre dossier spam.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Retour à la connexion
              </button>

              <button
                onClick={() => {
                  setStatus('idle');
                  setMessage('');
                }}
                className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Renvoyer à nouveau
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={status === 'loading'}
              />
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{message}</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Note :</strong> Le nouveau lien de confirmation sera valide pendant 24 heures.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                'Renvoyer l\'email de confirmation'
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour à la connexion</span>
            </button>
          </form>
        )}

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Besoin d'aide ?{' '}
            <a
              href="mailto:support@africbourse.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResendConfirmationPage;
