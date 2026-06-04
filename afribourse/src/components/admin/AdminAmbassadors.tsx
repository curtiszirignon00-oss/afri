import { useEffect, useState } from 'react';
import { Gift, Copy, Check, RefreshCw, Loader2, PauseCircle, PlayCircle } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface ReferralCode {
  id: string;
  code: string;
  link: string;
  referrerEmail: string;
  referrerName: string;
  status: string;
  expiresAt: string;
  totalClicks: number;
  totalPurchases: number;
  bonusMonthsEarned: number;
  createdAt: string;
  referrals: { refereeEmail: string; status: string; discountApplied: boolean; purchasedAt: string | null }[];
}

export default function AdminAmbassadors() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ link: string; code: string } | null>(null);
  const [createError, setCreateError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/referrals');
      setCodes(res.data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async () => {
    if (!email.trim()) return;
    setCreating(true);
    setCreateError('');
    setCreateResult(null);
    try {
      const res = await apiClient.post('/admin/referrals/create', { email: email.trim() });
      setCreateResult({ link: res.data.link, code: res.data.code });
      setEmail('');
      fetchCodes();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? 'Erreur lors de la création');
    } finally { setCreating(false); }
  };

  const toggleStatus = async (codeId: string, current: string) => {
    const next = current === 'active' ? 'paused' : 'active';
    try {
      await apiClient.patch(`/admin/referrals/${codeId}/status`, { status: next });
      fetchCodes();
    } catch { /* ignore */ }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="mt-8 mb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Gift className="w-6 h-6" />
              Programme Ambassadeur — Pack Parcours
            </h2>
            <p className="text-blue-100 text-sm">
              Créez et gérez les codes de parrainage pour les participants du pack.
              Le parrainé obtient -30% (24 500 XOF), le parrain gagne +1 mois d'accompagnement par vente.
            </p>
          </div>
          <button onClick={fetchCodes} className="text-blue-200 hover:text-white transition-colors ml-4 flex-shrink-0">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Créer un code */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-indigo-500" />
          Attribuer un lien ambassadeur
        </h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email du participant pack (ex : kofi@example.com)"
            className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !email.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            Générer le code
          </button>
        </div>

        {createError && (
          <p className="text-red-600 text-sm mt-2">{createError}</p>
        )}

        {createResult && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs font-bold text-emerald-700 mb-0.5">Code créé : <span className="font-mono">{createResult.code}</span></p>
              <p className="text-xs text-gray-600 font-mono break-all">{createResult.link}</p>
            </div>
            <button onClick={() => copy(createResult.link, 'new')} className="text-emerald-600 hover:text-emerald-800 flex-shrink-0">
              {copiedId === 'new' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>

      {/* Tableau des codes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Codes actifs ({codes.length})</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : codes.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">Aucun code ambassadeur créé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Parrain', 'Code', 'Statut', 'Clics', 'Ventes', 'Mois bonus', 'Expiration', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {codes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{c.referrerName}</p>
                      <p className="text-xs text-gray-400">{c.referrerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{c.code}</span>
                        <button onClick={() => copy(c.link, c.id)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                          {copiedId === c.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.status === 'active' ? '● Actif' : '⏸ Pausé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{c.totalClicks}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600">{c.totalPurchases}</td>
                    <td className="px-4 py-3 text-sm font-bold text-indigo-600">{c.bonusMonthsEarned}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(c.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(c.id, c.status)}
                        className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${c.status === 'active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                      >
                        {c.status === 'active'
                          ? <><PauseCircle className="w-3.5 h-3.5" /> Pause</>
                          : <><PlayCircle className="w-3.5 h-3.5" /> Réactiver</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tableau des parrainages */}
      {codes.some((c) => c.referrals.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Détail des parrainages</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Email parrainé', 'Code utilisé', 'Parrain', 'Statut', 'Date achat'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {codes.flatMap((c) =>
                  c.referrals.map((r, i) => (
                    <tr key={`${c.id}-${i}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{r.refereeEmail}</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-indigo-600">{c.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{c.referrerEmail}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'purchased' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.status === 'purchased' ? '✓ Acheté' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {r.purchasedAt ? new Date(r.purchasedAt).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
