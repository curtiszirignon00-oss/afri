import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement réussi !</h1>
        <p className="text-gray-600 mb-6">
          Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalités premium d'AfriBourse.
        </p>

        {sessionId && (
          <p className="text-xs text-gray-400 mb-6 font-mono break-all">
            Réf : {sessionId}
          </p>
        )}

        <div className="bg-green-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-700">
            Vous serez redirigé vers votre tableau de bord dans{' '}
            <span className="font-bold">{countdown}s</span>
          </p>
          <div className="mt-2 w-full bg-green-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
        >
          Aller au tableau de bord
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/subscriptions')}
          className="mt-3 w-full text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          Voir mes abonnements
        </button>
      </div>
    </div>
  );
}
