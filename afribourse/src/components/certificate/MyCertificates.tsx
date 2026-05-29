// src/components/certificate/MyCertificates.tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import CertificateCard from './CertificateCard';
import { Award, Loader2 } from 'lucide-react';

export default function MyCertificates() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const res = await apiClient.get('/certificates/my');
      return res.data.data as any[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <Award size={22} className="text-amber-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Aucun certificat pour l'instant</h3>
        <p className="text-xs text-gray-500 max-w-xs">
          Vos certificats apparaîtront ici après chaque webinaire complété.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <Award size={16} className="text-amber-600" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Mes Certificats</h2>
        <span className="text-sm text-gray-500">({data.length})</span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {data.map((cert) => (
          <CertificateCard key={cert.id} cert={cert} />
        ))}
      </div>
    </div>
  );
}
