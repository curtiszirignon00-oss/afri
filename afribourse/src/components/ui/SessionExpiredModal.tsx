import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function SessionExpiredModal() {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();

  if (!sessionExpired) return null;

  const handleReconnect = () => {
    dismissSessionExpired();
    navigate('/login');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 flex flex-col items-center gap-4 animate-fade-in">
        {/* Icône */}
        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        {/* Texte */}
        <div className="text-center">
          <h2
            id="session-expired-title"
            className="text-lg font-semibold text-gray-900 dark:text-white mb-1"
          >
            Session expirée
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Votre session a expiré après une période d'inactivité. Veuillez vous reconnecter pour continuer.
          </p>
        </div>

        {/* Boutons */}
        <div className="flex flex-col gap-2 w-full mt-1">
          <button
            onClick={handleReconnect}
            className="w-full py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
          >
            Se reconnecter
          </button>
          <button
            onClick={dismissSessionExpired}
            className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors"
          >
            Continuer en mode invité
          </button>
        </div>
      </div>
    </div>
  );
}
