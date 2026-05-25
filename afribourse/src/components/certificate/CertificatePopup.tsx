// src/components/certificate/CertificatePopup.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api-client';

interface PendingCert {
  id: string;
  participantName: string;
  module: { name: string; subtitle: string };
  webinarDate: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function CertificatePopup() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [cert, setCert] = useState<PendingCert | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    apiClient.get('/certificates/pending').then((res) => {
      if (res.data.success && res.data.data.length > 0) {
        setCert(res.data.data[0]);
      }
    }).catch(() => {});
  }, [isLoggedIn]);

  const dismiss = async () => {
    if (cert) {
      await apiClient.post(`/certificates/${cert.id}/viewed`).catch(() => {});
    }
    setDismissed(true);
  };

  const handleView = async () => {
    if (cert) {
      await apiClient.post(`/certificates/${cert.id}/viewed`).catch(() => {});
      navigate(`/certificat/${cert.id}`);
    }
    setDismissed(true);
  };

  if (!cert || dismissed) return null;

  const firstName = cert.participantName.split(' ')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-amber-500/30 overflow-hidden">
        {/* Bordure dorée en haut */}
        <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          {/* Médaillon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center">
              <span className="text-3xl">🏅</span>
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-xl font-bold text-white text-center mb-1">
            Félicitations, {firstName} !
          </h2>
          <p className="text-slate-400 text-sm text-center mb-5">
            Votre certificat de participation est prêt
          </p>

          {/* Miniature */}
          <div className="rounded-xl overflow-hidden mb-4 border border-slate-700">
            <img
              src={`${API_BASE}/og/image/certificate/${cert.id}`}
              alt="Aperçu du certificat"
              className="w-full aspect-video object-cover bg-slate-800"
            />
          </div>

          {/* Module */}
          <div className="bg-slate-700/50 rounded-xl p-3 mb-5 flex items-center gap-3">
            <Award size={20} className="text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm">{cert.module.name}</p>
              <p className="text-slate-400 text-xs">{cert.module.subtitle}</p>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handleView}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-bold py-3 rounded-xl hover:from-amber-400 hover:to-yellow-300 transition-colors mb-2"
          >
            🎓 Voir et télécharger mon certificat
          </button>
          <button
            onClick={dismiss}
            className="w-full text-slate-400 text-sm py-2 hover:text-white transition-colors"
          >
            Fermer — je le retrouverai dans mon profil
          </button>
        </div>
      </div>
    </div>
  );
}
