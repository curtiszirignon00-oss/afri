import { useEffect, useState } from 'react';
import { Copy, Check, Users, Gift, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authFetch, API_BASE_URL } from '../../config/api';

interface AmbassadorStats {
  hasCode: boolean;
  isPackParticipant: boolean;
  code?: string;
  link?: string;
  status?: string;
  expiresAt?: string;
  totalClicks?: number;
  totalPurchases?: number;
  bonusMonthsEarned?: number;
  bonusAccompagnementMonths?: number;
  referrals?: { refereeEmail: string; status: string; purchasedAt: string | null }[];
}

export default function AmbassadorSection() {
  const { isLoggedIn } = useAuth();
  const [stats, setStats] = useState<AmbassadorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    authFetch(`${API_BASE_URL}/pack-referral/my-stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn || loading) return null;
  if (!stats?.isPackParticipant) return null;

  const copyLink = () => {
    if (!stats?.link) return;
    navigator.clipboard.writeText(stats.link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const whatsappMsg = stats?.link
    ? encodeURIComponent(`🎓 Rejoins-moi sur le Pack Parcours Investisseur BRVM d'Afribourse — j'ai adoré la formation ! Avec mon lien tu bénéficies de 30% de réduction :\n${stats.link}`)
    : '';

  return (
    <div className="mt-8 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base leading-tight">Espace Ambassadeur</h3>
          <p className="text-blue-200 text-xs">Partagez votre lien · +1 mois d'accompagnement par vente</p>
        </div>
      </div>

      <div className="p-6">
        {!stats.hasCode ? (
          /* Pas encore de code attribué par l'admin */
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700 text-sm mb-1">Votre lien ambassadeur arrive bientôt</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Votre lien de parrainage sera disponible sous peu. Vous recevrez un email dès qu'il sera activé.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 text-center border border-blue-100">
                <p className="text-2xl font-extrabold text-blue-700">{stats.totalClicks ?? 0}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">clics sur le lien</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-blue-100">
                <p className="text-2xl font-extrabold text-emerald-600">{stats.totalPurchases ?? 0}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">ventes générées</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center border border-indigo-100">
                <p className="text-2xl font-extrabold text-indigo-600">{stats.bonusAccompagnementMonths ?? 0}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">mois bonus cumulés</p>
              </div>
            </div>

            {/* Lien */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Votre lien de parrainage (-30% pour vos filés)</p>
              <div className="flex items-stretch gap-2">
                <div className="flex-1 bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 font-mono truncate flex items-center">
                  {stats.link}
                </div>
                <button
                  onClick={copyLink}
                  className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-2.5 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                Code : <strong className="text-gray-600 font-mono">{stats.code}</strong>
                {stats.expiresAt && ` · Expire le ${new Date(stats.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </p>
            </div>

            {/* WhatsApp share */}
            <a
              href={`https://wa.me/?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-colors"
            >
              <span className="text-lg">📱</span>
              Partager sur WhatsApp
              <ChevronRight className="w-4 h-4" />
            </a>

            {/* Liste parrainages */}
            {stats.referrals && stats.referrals.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Vos parrainages ({stats.referrals.length})</p>
                <div className="space-y-1.5">
                  {stats.referrals.map((r, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                      <span className="text-xs text-gray-600 font-medium">{r.refereeEmail}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'purchased' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.status === 'purchased' ? '✓ Acheté' : 'En attente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
