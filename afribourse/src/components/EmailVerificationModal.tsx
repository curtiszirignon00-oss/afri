import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onClose: () => void;
}

export default function EmailVerificationModal({ onClose }: Props) {
  const { userProfile } = useAuth();
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    if (!userProfile?.email || sending) return;
    setSending(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/resend-confirmation`,
        { email: userProfile.email },
        { withCredentials: true }
      );
      toast.success('Email de confirmation envoyé !');
      onClose();
    } catch {
      toast.error('Impossible d\'envoyer l\'email. Réessaye dans quelques instants.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-orange-100 mx-auto mb-4">
          <Mail className="h-7 w-7 text-orange-600" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Confirme ton adresse email
        </h2>
        <p className="text-gray-600 text-sm text-center mb-6">
          Pour continuer à utiliser le simulateur de portefeuille, tu dois confirmer ton adresse email.
        </p>

        <button
          onClick={handleResend}
          disabled={sending}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {sending ? 'Envoi en cours...' : 'Renvoyer l\'email de confirmation'}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
