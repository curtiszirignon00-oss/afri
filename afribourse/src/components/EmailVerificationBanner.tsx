import { useState } from 'react';
import { X, Mail, AlertTriangle } from 'lucide-react';
import { useEmailVerificationPhase } from '../hooks/useEmailVerificationPhase';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function EmailVerificationBanner() {
  const { phase, daysUntilSuspension } = useEmailVerificationPhase();
  const { userProfile } = useAuth();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('email_banner_dismissed') === 'true'
  );
  const [sending, setSending] = useState(false);

  // Ne rien afficher si vérifié, suspendu, ou réduit par l'utilisateur
  if (phase === 0 || phase === 3 || dismissed) return null;

  const isUrgent = phase === 2;

  const handleResend = async () => {
    if (!userProfile?.email || sending) return;
    setSending(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/resend-confirmation`,
        { email: userProfile.email },
        { withCredentials: true }
      );
      toast.success('Email de confirmation renvoyé !');
    } catch {
      toast.error('Impossible d\'envoyer l\'email. Réessaye dans quelques instants.');
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('email_banner_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div
      className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm ${
        isUrgent
          ? 'bg-orange-600 text-white'
          : 'bg-amber-50 border-b border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isUrgent
          ? <AlertTriangle className="h-4 w-4 shrink-0" />
          : <Mail className="h-4 w-4 shrink-0 text-amber-600" />
        }
        <span className="truncate">
          {isUrgent
            ? `Accès limité dans ${daysUntilSuspension} jour${daysUntilSuspension > 1 ? 's' : ''} — confirme ton adresse email`
            : 'Confirme ton email pour sécuriser ton compte'
          }
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleResend}
          disabled={sending}
          className={`text-xs font-semibold underline underline-offset-2 hover:no-underline transition-all ${
            isUrgent ? 'text-white' : 'text-amber-700'
          } disabled:opacity-50`}
        >
          {sending ? 'Envoi...' : 'Renvoyer'}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Fermer"
          className={`p-0.5 rounded hover:opacity-70 transition-opacity ${
            isUrgent ? 'text-white' : 'text-amber-600'
          }`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
