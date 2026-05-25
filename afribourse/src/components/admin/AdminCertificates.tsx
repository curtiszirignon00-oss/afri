// src/components/admin/AdminCertificates.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import { Award, Send, RotateCcw, XCircle, Search, ChevronDown, Loader2, CheckCircle2, Clock, Eye, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Module { id: string; moduleId: string; name: string; subtitle: string }
interface Certificate {
  id: string;
  participantName: string;
  email: string;
  status: string;
  webinarDate: string;
  issuedAt: string;
  internalNote?: string;
  module: { name: string };
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  pending: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: <Clock size={12} /> },
  viewed: { label: 'Consulté', color: 'bg-blue-100 text-blue-700', icon: <Eye size={12} /> },
  downloaded: { label: 'Téléchargé', color: 'bg-green-100 text-green-700', icon: <Download size={12} /> },
  shared: { label: 'Partagé', color: 'bg-purple-100 text-purple-700', icon: <Share2 size={12} /> },
  revoked: { label: 'Révoqué', color: 'bg-red-100 text-red-700', icon: <XCircle size={12} /> },
};

export default function AdminCertificates() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'issue' | 'list'>('list');

  // Formulaire
  const [form, setForm] = useState({
    email: '',
    participantName: '',
    moduleId: '',
    webinarDate: '',
    internalNote: '',
    sendEmailFlag: true,
  });
  const [duplicateWarning, setDuplicateWarning] = useState<{ message: string; existingId: string } | null>(null);
  const [forceIssue, setForceIssue] = useState(false);

  // Filtres liste
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterModule, setFilterModule] = useState('');

  // Modules
  const { data: modules = [] } = useQuery<Module[]>({
    queryKey: ['admin-webinar-modules'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/webinar-modules');
      return res.data.data;
    },
  });

  // Liste des certificats
  const { data: certData, isLoading: certsLoading } = useQuery({
    queryKey: ['admin-certificates', search, filterStatus, filterModule],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterModule) params.set('moduleId', filterModule);
      const res = await apiClient.get(`/admin/certificates?${params}`);
      return res.data;
    },
  });

  const certs: Certificate[] = certData?.data ?? [];

  // Décerner
  const issueMut = useMutation({
    mutationFn: async (payload: typeof form & { force?: boolean }) => {
      const res = await apiClient.post('/admin/certificates', payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.duplicate && !forceIssue) {
        setDuplicateWarning({ message: data.message, existingId: data.existingId });
        return;
      }
      toast.success(data.message || 'Certificat décerné !');
      setForm({ email: '', participantName: '', moduleId: '', webinarDate: '', internalNote: '', sendEmailFlag: true });
      setDuplicateWarning(null);
      setForceIssue(false);
      qc.invalidateQueries({ queryKey: ['admin-certificates'] });
      setActiveTab('list');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erreur lors du décernement');
    },
  });

  // Révoquer
  const revokeMut = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await apiClient.post(`/admin/certificates/${id}/revoke`, { reason });
    },
    onSuccess: () => {
      toast.success('Certificat révoqué');
      qc.invalidateQueries({ queryKey: ['admin-certificates'] });
    },
    onError: () => toast.error('Erreur lors de la révocation'),
  });

  // Renvoyer email
  const resendMut = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/certificates/${id}/resend-email`);
    },
    onSuccess: () => toast.success('Email renvoyé'),
    onError: () => toast.error('Erreur lors du renvoi'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    issueMut.mutate({ ...form, force: forceIssue });
  };

  const handleForceIssue = () => {
    setForceIssue(true);
    setDuplicateWarning(null);
    issueMut.mutate({ ...form, force: true });
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-amber-900" />
          <div>
            <h2 className="text-2xl font-bold text-amber-900">Certificats Académie</h2>
            <p className="text-amber-800 text-sm">Décerner et gérer les certificats de participation</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          Certificats décernés {certs.length > 0 && `(${certData?.total ?? certs.length})`}
        </button>
        <button
          onClick={() => setActiveTab('issue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'issue' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
        >
          🏅 Décerner un certificat
        </button>
      </div>

      {/* ─── FORMULAIRE DÉCERNEMENT ─── */}
      {activeTab === 'issue' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Décerner un certificat de participation</h3>

          {duplicateWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <p className="text-amber-800 text-sm font-medium mb-3">⚠️ {duplicateWarning.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDuplicateWarning(null)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleForceIssue}
                  className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                >
                  Décerner quand même (doublon)
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email du participant *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="mamadou@email.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={form.participantName}
                  onChange={(e) => setForm({ ...form, participantName: e.target.value })}
                  placeholder="Mamadou Koné"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module (webinaire) *</label>
                <div className="relative">
                  <select
                    required
                    value={form.moduleId}
                    onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Sélectionner un module...</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date du webinaire *</label>
                <input
                  type="date"
                  required
                  value={form.webinarDate}
                  onChange={(e) => setForm({ ...form, webinarDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note interne (optionnelle — jamais visible par l'apprenant)</label>
              <textarea
                rows={2}
                value={form.internalNote}
                onChange={(e) => setForm({ ...form, internalNote: e.target.value })}
                placeholder="Ex : Participant très actif, a posé d'excellentes questions..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sendEmailFlag}
                onChange={(e) => setForm({ ...form, sendEmailFlag: e.target.checked })}
                className="w-4 h-4 text-amber-500 rounded"
              />
              <span className="text-sm text-gray-700">Envoyer l'email de notification à l'apprenant</span>
            </label>

            <div className="pt-2">
              <button
                type="submit"
                disabled={issueMut.isPending}
                className="flex items-center gap-2 bg-amber-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {issueMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Award size={16} />}
                Décerner le certificat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── LISTE ─── */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Filtres */}
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="">Tous les modules</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Tableau */}
          {certsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : certs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Award size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Aucun certificat trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Participant', 'Email', 'Module', 'Date webinaire', 'Émis le', 'Statut', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {certs.map((c) => {
                    const s = STATUS_LABELS[c.status] ?? STATUS_LABELS.pending;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{c.participantName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{c.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{c.module?.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {new Intl.DateTimeFormat('fr-FR').format(new Date(c.webinarDate))}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {new Intl.DateTimeFormat('fr-FR').format(new Date(c.issuedAt))}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                            {s.icon}{s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`/certificat/${c.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir"
                            >
                              <Eye size={15} />
                            </a>
                            {c.status !== 'revoked' && (
                              <>
                                <button
                                  onClick={() => resendMut.mutate(c.id)}
                                  disabled={resendMut.isPending}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Renvoyer l'email"
                                >
                                  <Send size={15} />
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Raison de la révocation (optionnel) :');
                                    if (reason !== null) revokeMut.mutate({ id: c.id, reason: reason || undefined });
                                  }}
                                  disabled={revokeMut.isPending}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Révoquer"
                                >
                                  <XCircle size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
