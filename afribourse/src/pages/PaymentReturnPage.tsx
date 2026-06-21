import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PaymentReturnPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci !</h1>
        <p className="text-sm text-gray-600 mb-1">
          Votre paiement est en cours de confirmation.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Dès qu'il est validé, vous recevrez la confirmation par <strong>email</strong> et <strong>WhatsApp</strong>.
          Aucune action supplémentaire n'est requise.
        </p>
        <button
          onClick={() => navigate('/webinaires')}
          className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Retour aux webinaires
        </button>
      </div>
    </div>
  );
}
