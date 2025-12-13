import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

type Status = 'loading' | 'success' | 'error' | 'already-verified';

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Token de confirmation manquant dans l\'URL.');
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/confirm-email`,
          { params: { token } }
        );

        if (response.data.alreadyVerified) {
          setStatus('already-verified');
          setMessage(response.data.message);
        } else {
          setStatus('success');
          setMessage(response.data.message);
          // Rediriger vers la page de connexion après 3 secondes
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.response?.data?.error ||
          'Une erreur est survenue lors de la confirmation de votre email.'
        );
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-8">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Confirmation en cours...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant que nous vérifions votre email.
            </p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4 animate-bounce">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email confirmé !
            </h2>
            <p className="text-gray-700 mb-4">{message}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                🎉 Votre compte est maintenant actif !
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Redirection vers la page de connexion dans 3 secondes...
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full animate-progress"></div>
              </div>
            </div>
          </div>
        )}

        {/* Already Verified State */}
        {status === 'already-verified' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <AlertCircle className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Déjà confirmé
            </h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Aller à la connexion
            </button>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Erreur de confirmation
            </h2>
            <p className="text-gray-700 mb-6">{message}</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/renvoyer-confirmation')}
                className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Renvoyer l'email de confirmation
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-white text-gray-700 border border-gray-300 rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Retour à la connexion
              </button>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Raisons possibles :</strong>
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1 text-left">
                <li>• Le lien a expiré (valide 24h)</li>
                <li>• Le lien a déjà été utilisé</li>
                <li>• Le lien est invalide</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default ConfirmEmailPage;
