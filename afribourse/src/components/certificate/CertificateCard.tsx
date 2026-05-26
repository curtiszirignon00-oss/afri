// src/components/certificate/CertificateCard.tsx
import { Download, Calendar, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import CertificateShareButtons from './CertificateShareButtons';
import toast from 'react-hot-toast';

interface Certificate {
  id: string;
  participantName: string;
  moduleName: string;
  moduleSubtitle: string;
  webinarDate: string;
  issuedAt: string;
  status: string;
  module: { name: string; subtitle: string };
}

interface Props {
  cert: Certificate;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SITE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://africbourse.com';

function isNew(cert: Certificate): boolean {
  if (cert.status === 'downloaded' || cert.status === 'shared') return false;
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  return new Date(cert.issuedAt).getTime() > sevenDaysAgo;
}

export default function CertificateCard({ cert }: Props) {
  const navigate = useNavigate();
  const certUrl = `${SITE_URL}/certificat/${cert.id}`;
  const ogImageUrl = `${API_BASE}/og/image/certificate/${cert.id}`;

  const handleDownload = async () => {
    try {
      const res = await fetch(`${API_BASE}/certificates/${cert.id}/download`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `certificat-afribourse-${cert.id}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Certificat téléchargé !');
      await apiClient.post(`/certificates/${cert.id}/downloaded`).catch(() => {});
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Miniature */}
      <div className="relative cursor-pointer" onClick={() => navigate(`/certificat/${cert.id}`)}>
        <img
          src={ogImageUrl}
          alt={`Certificat ${cert.module.name}`}
          className="w-full aspect-[16/9] object-cover bg-gray-100"
          loading="lazy"
        />
        {isNew(cert) && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            Nouveau
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Award size={18} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{cert.module.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{cert.module.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Calendar size={12} />
          {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(cert.webinarDate))}
        </div>

        {/* Actions */}
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors mb-3"
        >
          <Download size={15} />
          Télécharger PNG
        </button>

        <CertificateShareButtons
          certificateId={cert.id}
          moduleName={cert.module.name}
          certificateUrl={certUrl}
        />
      </div>
    </div>
  );
}
