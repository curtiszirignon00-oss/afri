import React, { useState } from 'react';
import { CheckCircle, Loader2, CalendarClock, Users } from 'lucide-react';
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

const CohortPreregister: React.FC = () => {
  const { userProfile } = useAuth();
  const [name, setName] = useState((userProfile as any)?.profile?.full_name || (userProfile as any)?.profile?.username || '');
  const [email, setEmail] = useState((userProfile as any)?.email || '');
  const [dialCode, setDialCode] = useState('+225');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
        }),
      });
      if (!res.ok && res.status !== 200) throw new Error();
      analytics.trackAction('cohort_preregistered', 'Cohorte Juillet 2026', {});
      setDone(true);
    } catch {
      toast.error("Erreur lors de la pré-inscription. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-4 sm:px-6 -mt-10 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Colonne gauche — pitch */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 p-6 sm:p-8 text-white">
              <span className="inline-block bg-amber-400 text-amber-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide mb-3">
                Pré-inscription gratuite
              </span>
              <h2 className="text-2xl font-extrabold leading-snug mb-2">Réservez votre place — Cohorte Juillet 2026</h2>
              <p className="text-blue-200 text-sm mb-4">
                Laissez vos coordonnées : on vous recontacte sur WhatsApp pour finaliser. Aucun paiement maintenant.
              </p>

              {/* Avantage préinscrit — 10% + date limite */}
              <div className="bg-amber-400/15 border border-amber-300/40 rounded-xl p-3 mb-4">
                <p className="text-amber-200 text-sm font-extrabold flex items-center gap-1.5">🎁 -10% pour tous les préinscrits</p>
                <p className="text-amber-100 text-xs mt-1">
                  <span className="line-through opacity-70">35 000</span> <strong className="text-white">31 500 XOF</strong> · paiement à finaliser <strong>avant le 3 juillet</strong>
                </p>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-blue-300 flex-shrink-0" /> 1ère session le samedi 4 juillet</div>
                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-300 flex-shrink-0" /> 5 sessions live · 15h de formation</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-300 flex-shrink-0" /> Places limitées à 50 par session</div>
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
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 font-semibold">
                    🎁 -10% réservé aux préinscrits : 31 500 XOF au lieu de 35 000 · à régler avant le 3 juillet
                  </div>
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
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 active:scale-95 disabled:opacity-60 transition-all shadow-md">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Je me pré-inscris gratuitement</>}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center mt-2">Sans engagement · aucun paiement requis</p>
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
