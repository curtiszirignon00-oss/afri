// src/pages/CertificatePage.tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Download, Award, Calendar, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import CertificateShareButtons from '../components/certificate/CertificateShareButtons';
import toast from 'react-hot-toast';

interface CertData {
  id: string;
  participantName: string;
  email: string;
  webinarDate: string;
  issuedAt: string;
  status: string;
  module: { name: string; subtitle: string };
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SITE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://africbourse.com';

export default function CertificatePage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { isLoggedIn } = useAuth();
  const [cert, setCert] = useState<CertData | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uuid) return;
    fetch(`${API_BASE}/certificates/${uuid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.revoked) {
          setRevoked(true);
        } else if (data.success) {
          setCert(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleDownload = async () => {
    if (!uuid) return;
    try {
      const res = await fetch(`${API_BASE}/certificates/${uuid}/download`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `certificat-afribourse.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Certificat téléchargé !');
      if (isLoggedIn) {
        await apiClient.post(`/certificates/${uuid}/downloaded`).catch(() => {});
      }
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const certUrl = uuid ? `${SITE_URL}/certificat/${uuid}` : '';
  const ogImageUrl = uuid ? `${API_BASE}/og/image/certificate/${uuid}` : '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (revoked || !cert) {
    return (
      <>
        <Helmet>
          <title>Certificat non disponible — Afribourse</title>
        </Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center max-w-md">
            <AlertTriangle size={40} className="text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Ce certificat n'est plus disponible</h1>
            <p className="text-gray-500 text-sm mb-6">Il a été révoqué ou n'existe pas.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </>
    );
  }

  const title = `Certificat ${cert.module.name} — ${cert.participantName} | Afribourse`;
  const description = `${cert.participantName} a participé au webinaire "${cert.module.name}" — ${cert.module.subtitle}. Académie Afribourse.`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={certUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-8">
            <span className="text-4xl">🏅</span>
            <p className="text-slate-400 text-xs tracking-widest mt-2 uppercase">Académie Afribourse</p>
          </div>

          {/* Image du certificat */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-amber-500/20 mb-6">
            <img
              src={ogImageUrl}
              alt={`Certificat ${cert.module.name}`}
              className="w-full bg-slate-800"
            />
          </div>

          {/* Infos */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Award size={20} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">{cert.module.name}</h1>
                <p className="text-slate-400 text-sm">{cert.module.subtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Participant</p>
                <p className="text-white font-semibold">{cert.participantName}</p>
              </div>
              <div className="flex items-start gap-1.5">
                <Calendar size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Date du webinaire</p>
                  <p className="text-white text-sm">
                    {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(cert.webinarDate))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {isLoggedIn && (
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-bold py-3.5 rounded-xl hover:from-amber-400 hover:to-yellow-300 transition-colors"
              >
                <Download size={18} />
                Télécharger mon certificat (PNG)
              </button>
            )}

            <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-5">
              <p className="text-slate-400 text-sm text-center mb-4">Partager ce certificat</p>
              <CertificateShareButtons
                certificateId={cert.id}
                moduleName={cert.module.name}
                certificateUrl={certUrl}
              />
            </div>

            {!isLoggedIn && (
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-2xl p-5 text-center">
                <p className="text-blue-200 text-sm mb-3">
                  Vous souhaitez investir en Bourse ? Rejoignez Afribourse gratuitement.
                </p>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  Créer un compte gratuit
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-slate-600 text-xs mt-8 tracking-widest uppercase">
            africbourse.com · BRVM
          </p>
        </div>
      </div>
    </>
  );
}
