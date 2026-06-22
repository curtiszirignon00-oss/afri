import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, CalendarClock, Users, Flame } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, authFetch } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { analytics } from '../../services/analytics';

// Indicatifs WhatsApp (Togo inclus — on prend l'inscription même si le paiement Mobile Money n'y est pas dispo)
const DIAL_CODES = [
  { code: '+225', flag: '🇨🇮' },
  { code: '+221', flag: '🇸🇳' },
  { code: '+226', flag: '🇧🇫' },
  { code: '+223', flag: '🇲🇱' },
  { code: '+228', flag: '🇹🇬' },
  { code: '+229', flag: '🇧🇯' },
  { code: '+227', flag: '🇳🇪' },
  { code: '+224', flag: '🇬🇳' },
  { code: '+237', flag: '🇨🇲' },
  { code: '+233', flag: '🇬🇭' },
  { code: '+234', flag: '🇳🇬' },
  { code: '+241', flag: '🇬🇦' },
  { code: '+33',  flag: '🇫🇷' },
];

const COHORT_ID = 'cohorte-juillet-2026';
const PREREGISTER_OFFSET = 30; // base sociale (cohérent avec WEBINAR_COUNT_OFFSET)

const PACK_LABELS: Record<string, string> = {
  starter: 'Starter (35 000 XOF)',
  parcours: 'Parcours (50 000 XOF)',
  investisseur: 'Investisseur (75 000 XOF)',
};
const PACK_PRICES: Record<string, { full: number; cohort: number; first: number }> = {
  starter:      { full: 35000, cohort: 31500, first: 15000 },
  parcours:     { full: 50000, cohort: 45000, first: 20000 },
  investisseur: { full: 75000, cohort: 67500, first: 25000 },
};
function fmt(n: number) { return n.toLocaleString('fr-FR'); }
const DISCOUNT_DEADLINE = new Date('2026-07-03T23:59:59Z').getTime();

function getCountdown() {
  const diff = Math.max(0, DISCOUNT_DEADLINE - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: diff === 0,
  };
}
function pad2(n: number) { return String(n).padStart(2, '0'); }

const CohortPreregister: React.FC<{ selectedPack?: string | null }> = ({ selectedPack }) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const packLabel = selectedPack ? PACK_LABELS[selectedPack] : null;
  const packPrices = selectedPack ? PACK_PRICES[selectedPack] : null;
  const [name, setName] = useState((userProfile as any)?.profile?.full_name || (userProfile as any)?.profile?.username || '');
  const [email, setEmail] = useState((userProfile as any)?.email || '');
  const [dialCode, setDialCode] = useState('+225');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [cd, setCd] = useState(getCountdown());
  const [preinscrits, setPreinscrits] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/webinars/counts`)
      .then((r) => r.json())
      .then((d) => {
        const n = d?.data?.[COHORT_ID] ?? 0;
        setPreinscrits(n + PREREGISTER_OFFSET);
      })
      .catch(() => setPreinscrits(PREREGISTER_OFFSET));
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) { toast.error('Renseignez votre nom et votre email'); return; }
    if (!phone.trim()) { toast.error('Votre numéro WhatsApp est requis'); return; }
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/webinars/cohort-preregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: `${dialCode} ${phone.trim()}`,
          ...(selectedPack ? { pack: selectedPack } : {}),
        }),
      });
      if (!res.ok && res.status !== 200) throw new Error();
      // Mémoriser les coordonnées pour pré-remplir la page de paiement (pas de ressaisie)
      try {
        localStorage.setItem('afb_cohort_lead', JSON.stringify({ name: name.trim(), email: email.trim(), dialCode, phone: phone.trim() }));
      } catch { /* ignore */ }
      analytics.trackAction('cohort_preregistered', 'Cohorte Juillet 2026', { pack: selectedPack ?? 'non_precise' });
      setPreinscrits((p) => (p === null ? null : p + 1));
      setDone(true);
    } catch {
      toast.error("Erreur lors de la pré-inscription. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="preinscription" className="px-4 sm:px-6 py-10 bg-gray-50 scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Colonne gauche — pitch */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-6 sm:p-8 text-white">
              <span className="inline-block bg-amber-400 text-amber-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide mb-3">
                Pré-inscription gratuite
              </span>
              {packLabel ? (
                <>
                  <h2 className="text-2xl font-extrabold leading-snug mb-2">Plus qu'une étape — Pack {packLabel.split(' (')[0]}</h2>
                  <div className="bg-white/15 border border-white/20 rounded-lg px-3 py-2 mb-3 text-sm">
                    🎟️ Pack choisi : <strong>{packLabel}</strong>
                  </div>
                  <p className="text-blue-200 text-sm mb-4">
                    Laissez vos coordonnées : on vous recontacte sur WhatsApp pour finaliser votre inscription. Aucun paiement maintenant.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-extrabold leading-snug mb-2">Pas sûr du pack ? On vous oriente</h2>
                  <p className="text-blue-200 text-sm mb-4">
                    Laissez vos coordonnées : notre équipe vous recontacte sur WhatsApp pour vous aider à choisir le bon pack et finaliser. Aucun paiement maintenant.
                  </p>
                </>
              )}

              {/* Avantage préinscrit — 10% + compte à rebours */}
              <div className="bg-amber-400/15 border border-amber-300/40 rounded-xl p-3 mb-4">
                <p className="text-amber-200 text-sm font-extrabold flex items-center gap-1.5">🎁 -10% pour tous les préinscrits</p>
                {packPrices ? (
                  <p className="text-amber-100 text-xs mt-1 mb-2">
                    À partir de <strong className="text-white">{fmt(packPrices.first)} XOF</strong> en 3 fois · <span className="line-through opacity-70">{fmt(packPrices.full)}</span> <strong className="text-white">{fmt(packPrices.cohort)} XOF</strong>
                  </p>
                ) : (
                  <p className="text-amber-100 text-xs mt-1 mb-2">
                    Paiement en 1 fois (-10%) ou en 3 fois · réduction réservée aux préinscrits
                  </p>
                )}
                {!cd.expired && (
                  <>
                    <p className="text-[10px] font-bold text-amber-200 mb-1.5 flex items-center gap-1">
                      <Flame className="w-3 h-3 animate-pulse" /> L'offre -10% se termine dans :
                    </p>
                    <div className="flex gap-1.5">
                      {cd.days > 0 && (
                        <div className="flex-1 bg-white/15 rounded-lg py-1.5 text-center">
                          <p className="text-base font-extrabold text-white leading-none">{pad2(cd.days)}</p>
                          <p className="text-[9px] text-amber-200 mt-0.5">j</p>
                        </div>
                      )}
                      <div className="flex-1 bg-white/15 rounded-lg py-1.5 text-center">
                        <p className="text-base font-extrabold text-white leading-none">{pad2(cd.hours)}</p>
                        <p className="text-[9px] text-amber-200 mt-0.5">h</p>
                      </div>
                      <div className="flex-1 bg-white/15 rounded-lg py-1.5 text-center">
                        <p className="text-base font-extrabold text-white leading-none">{pad2(cd.minutes)}</p>
                        <p className="text-[9px] text-amber-200 mt-0.5">min</p>
                      </div>
                      <div className="flex-1 bg-white/15 rounded-lg py-1.5 text-center">
                        <p className="text-base font-extrabold text-white leading-none">{pad2(cd.seconds)}</p>
                        <p className="text-[9px] text-amber-200 mt-0.5">sec</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2.5 text-sm">
                {preinscrits !== null && (
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-emerald-300 flex-shrink-0" /> <strong className="text-white">Déjà {preinscrits} préinscrits</strong> · places limitées</div>
                )}
                <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-blue-300 flex-shrink-0" /> 1ère session le samedi 4 juillet</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-300 flex-shrink-0" /> 50 places maximum par session</div>
              </div>
            </div>

            {/* Colonne droite — formulaire / succès */}
            <div className="p-6 sm:p-8">
              {done ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Pré-inscription confirmée 🎉</h3>
                  <p className="text-sm text-gray-600 mb-3">Notre équipe vous recontacte très vite sur WhatsApp pour finaliser votre place.</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 font-semibold mb-4">
                    {packPrices
                      ? `🎁 -10% préinscrit : ${fmt(packPrices.cohort)} XOF au lieu de ${fmt(packPrices.full)} · à régler avant le 3 juillet`
                      : '🎁 -10% réservé aux préinscrits · à régler avant le 3 juillet'}
                  </div>
                  <button
                    onClick={() => navigate(`/parcours/cohorte-juillet${selectedPack ? `?pack=${selectedPack}` : ''}`)}
                    className="w-full py-3 rounded-xl font-extrabold text-white text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 active:scale-95 transition-all shadow-md"
                  >
                    💳 Payer maintenant -10% →
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-gray-900 mb-4">Pré-inscrivez-vous en 30 secondes</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet *</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex : Kofi Mensah" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse email *</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="votre@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro WhatsApp *</label>
                      <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                        <select value={dialCode} onChange={e => setDialCode(e.target.value)}
                          className="bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-700 pl-2 pr-1 py-2.5 focus:outline-none cursor-pointer" style={{ minWidth: '85px' }}>
                          {DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                        </select>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                          placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSubmit} disabled={loading}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl font-extrabold text-white text-base bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 active:scale-95 disabled:opacity-60 transition-all shadow-md">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>🎟️ Je réserve ma place (gratuit) →</>}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-2">Sans engagement · aucun paiement requis · -10% réservé aux préinscrits</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CohortPreregister;
