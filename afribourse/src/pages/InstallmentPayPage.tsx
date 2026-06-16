import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { PAWAPAY_CORRESPONDENTS, getCurrency } from '../hooks/usePawaPayment';

interface InstallmentLine { index: number; amount: number; status: string; dueAt: string }
interface PlanData {
  planName: string;
  currency: string;
  totalAmount: number;
  installmentsTotal: number;
  installmentsPaid: number;
  amountPaid: number;
  status: string;
  nextInstallment: { index: number; amount: number; dueAt: string } | null;
  schedule: InstallmentLine[];
}

const DIAL_CODES = [
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+256', flag: '🇺🇬', name: 'Ouganda' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
];

const OPERATORS = [
  { id: 'wave',         label: 'Wave',         emoji: '🌊' },
  { id: 'orange-money', label: 'Orange Money', emoji: '🟠' },
  { id: 'mtn-momo',     label: 'MTN MoMo',     emoji: '🟡' },
  { id: 'moov-money',   label: 'Moov Money',   emoji: '🔵' },
  { id: 'free-money',   label: 'Free Money',   emoji: '🟢' },
];

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR') + ' XOF';
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function getCorrespondent(operator: string, dialCode: string) {
  return PAWAPAY_CORRESPONDENTS[operator]?.[dialCode] ?? null;
}

export default function InstallmentPayPage() {
  const { token } = useParams<{ token: string }>();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [dialCode, setDialCode] = useState('+225');
  const [operator, setOperator] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  const [step, setStep] = useState<'form' | 'paying' | 'success' | 'error'>('form');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/installments/by-token/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setLoadError(data.error);
        else setPlan(data.plan);
      })
      .catch(() => setLoadError('Impossible de charger ce plan de paiement.'))
      .finally(() => setLoading(false));
  }, [token]);

  const next = plan?.nextInstallment ?? null;

  const handlePay = async () => {
    if (!operator || !phone.trim() || !next) return;
    const correspondent = getCorrespondent(operator, dialCode);
    if (!correspondent) { setErrorMsg('Opérateur non disponible dans ce pays.'); return; }

    const msisdn = dialCode.replace('+', '') + phone.replace(/\D/g, '');
    setStep('paying');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/installments/by-token/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correspondent, phone: msisdn, currency: getCurrency(dialCode) }),
      });
      const data = await res.json();
      if (res.ok && data.depositId) {
        setStep('success');
      } else {
        setErrorMsg(data.error ?? 'Paiement refusé. Réessayez.');
        setStep('error');
      }
    } catch {
      setErrorMsg('Erreur réseau. Réessayez.');
      setStep('error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h2>
        <p className="text-gray-600">{loadError}</p>
      </div>
    </div>
  );

  if (plan && (plan.status === 'completed' || !next)) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Parcours déjà réglé 🎉</h2>
        <p className="text-gray-600">Toutes vos mensualités ont été payées. Merci !</p>
      </div>
    </div>
  );

  if (step === 'success') return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement initié !</h2>
        <p className="text-gray-600 mb-1">Vous allez recevoir une demande de confirmation sur votre téléphone.</p>
        <p className="text-gray-500 text-sm">Entrez votre PIN Mobile Money pour finaliser la mensualité.</p>
        <div className="mt-6 bg-green-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-800">{plan?.planName}</p>
          <p className="text-2xl font-extrabold text-green-700">{formatPrice(next?.amount ?? 0)}</p>
        </div>
      </div>
    </div>
  );

  const availableOps = OPERATORS.filter(op => getCorrespondent(op.id, dialCode) !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-6 text-white">
          <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Paiement échelonné · Mensualité {(plan?.installmentsPaid ?? 0) + 1}/{plan?.installmentsTotal}</p>
          <h1 className="text-2xl font-extrabold leading-snug">{plan?.planName}</h1>
          <div className="mt-3 inline-block bg-white/15 rounded-xl px-4 py-2">
            <p className="text-3xl font-extrabold">{formatPrice(next?.amount ?? 0)}</p>
          </div>
          {next && <p className="text-blue-200 text-xs mt-2">À régler avant le {formatDate(next.dueAt)}</p>}
          <p className="text-blue-200 text-xs mt-1">Déjà payé : {formatPrice(plan?.amountPaid ?? 0)} / {formatPrice(plan?.totalAmount ?? 0)}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Pays */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pays</label>
            <select
              value={dialCode}
              onChange={e => { setDialCode(e.target.value); setOperator(null); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {DIAL_CODES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {/* Opérateur */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Opérateur Mobile Money</label>
            {availableOps.length === 0 ? (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">Aucun opérateur disponible dans ce pays.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableOps.map(op => (
                  <button
                    key={op.id}
                    onClick={() => setOperator(op.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all
                      ${operator === op.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  >
                    <span>{op.emoji}</span> {op.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Numéro */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro Mobile Money</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600">
                {dialCode}
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                placeholder="07 00 00 00 00"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Erreur */}
          {step === 'error' && errorMsg && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handlePay}
            disabled={!operator || !phone.trim() || step === 'paying'}
            className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all
              ${!operator || !phone.trim() || step === 'paying'
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg'}`}
          >
            {step === 'paying' ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Traitement en cours...
              </span>
            ) : (
              `Payer ${formatPrice(next?.amount ?? 0)}`
            )}
          </button>

          <p className="text-center text-xs text-gray-400">🔒 Paiement 100% sécurisé via PawaPay</p>
        </div>
      </div>
    </div>
  );
}
