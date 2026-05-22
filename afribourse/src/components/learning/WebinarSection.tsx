// src/components/learning/WebinarSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Users, Zap, ChevronRight, CheckCircle,
  Flame, Video, Tag, X, Loader2, Star, TrendingUp, Gift, Award,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, authFetch } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePawaPayment, getCorrespondent, getAvailableCountries, getCurrency } from '../../hooks/usePawaPayment';

// ─── Indicatifs pays ──────────────────────────────────────────────────────────

const DIAL_CODES = [
  // UEMOA en premier
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: '+245', flag: '🇬🇼', name: 'Guinée-Bissau' },
  // Autres pays africains courants
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+234', flag: '🇳🇬', name: 'Nigéria' },
  { code: '+243', flag: '🇨🇩', name: 'RD Congo' },
  { code: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+20',  flag: '🇪🇬', name: 'Égypte' },
  // International
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgique' },
  { code: '+41',  flag: '🇨🇭', name: 'Suisse' },
  { code: '+1',   flag: '🇺🇸', name: 'États-Unis / Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'Royaume-Uni' },
];

// ─── PhoneInput — sélecteur d'indicatif + numéro ──────────────────────────────

interface PhoneInputProps {
  dialCode: string;
  number: string;
  onDialChange: (code: string) => void;
  onNumberChange: (n: string) => void;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ dialCode, number, onDialChange, onNumberChange }) => {
  const selected = DIAL_CODES.find((c) => c.code === dialCode) ?? DIAL_CODES[0];
  return (
    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
      <select
        value={dialCode}
        onChange={(e) => onDialChange(e.target.value)}
        className="bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-700 pl-2 pr-1 py-2.5 focus:outline-none cursor-pointer"
        style={{ minWidth: '90px' }}
        aria-label="Indicatif pays"
      >
        {DIAL_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={number}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s\-]/g, ''))}
        placeholder={selected.name === "Côte d'Ivoire" ? '07 00 00 00 00' : 'Numéro'}
        className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white placeholder:text-gray-400"
      />
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Webinar {
  id: string;
  title: string;
  tagline: string;
  theme: string;
  date: string;
  endDate: string;
  earlyBirdDeadline: string;
  registrationClose?: boolean;
  earlyBirdTaken?: number;
  hideEarlyBirdIndicator?: boolean;
  price: number;
  discountPercent: number;
  duration: string;
  speakers: string;
  badge?: string;
  gradient: string;
  accentColor: string;
  icon: React.ReactNode;
  investisseurPlusBonus?: boolean;
}

// ─── Données webinaires ────────────────────────────────────────────────────────

const WEBINARS: Webinar[] = [
  {
    id: 'w1-fondamentaux',
    title: 'Maîtriser les fondamentaux de la bourse',
    tagline: 'Passez de zéro à investisseur en une session',
    theme: 'Initiation • Stratégie • BRVM',
    date: '2026-05-23T09:00:00Z',
    endDate: '2026-05-23T12:00:00Z',
    earlyBirdDeadline: '2026-05-22T20:00:00Z',
    registrationClose: true,
    price: 5000,
    discountPercent: 50,
    duration: '3H',
    speakers: 'Experts marchés & Analystes Afribourse',
    badge: 'NOUVEAU',
    gradient: 'from-blue-600 to-indigo-700',
    accentColor: '#3B82F6',
    icon: <Star className="w-5 h-5" />,
  },
  {
    id: 'w2-fondamentale',
    hideEarlyBirdIndicator: true,
    title: 'Analyse fondamentale : lire les données comme un pro',
    tagline: 'Décryptez bilans, ratios et rapports annuels BRVM',
    theme: 'Analyse • Valorisation • Données financières',
    date: '2026-05-30T09:00:00Z',
    endDate: '2026-05-31T13:00:00Z',
    earlyBirdDeadline: '2026-05-14T23:59:59Z',
    price: 10000,
    discountPercent: 50,
    duration: '4H',
    speakers: 'Analystes financiers Afribourse',
    badge: undefined,
    gradient: 'from-emerald-600 to-teal-700',
    accentColor: '#10B981',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: 'w3-technique',
    title: 'Analyse technique : repérez les signaux avant la foule',
    tagline: 'Maîtrisez les graphiques, patterns et timing d\'entrée sur la BRVM',
    theme: 'Graphiques • Patterns • Timing',
    date: '2026-06-06T09:00:00Z',
    endDate: '2026-06-07T13:00:00Z',
    earlyBirdDeadline: '2026-05-22T14:32:00Z',
    earlyBirdTaken: 15,
    price: 10000,
    discountPercent: 50,
    duration: '4H',
    speakers: 'Analystes techniques Afribourse',
    badge: 'BIENTÔT',
    gradient: 'from-orange-500 to-rose-600',
    accentColor: '#F97316',
    icon: <Flame className="w-5 h-5" />,
  },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

const EARLY_BIRD_SEATS = 20;
const MAX_SEATS = 50;

// ─── Pack Parcours Investisseur ───────────────────────────────────────────────

const PACK = {
  id: 'pack-parcours-investisseur',
  title: 'Pack Parcours Investisseur BRVM',
  tagline: '3 sessions intensives · Experts BRVM · Certification officielle',
  earlyBirdDeadline: '2026-05-22T20:00:00Z',
  price: 35000,
  gradient: 'from-blue-700 to-indigo-800',
  inclusions: [
    '3 webinaires live (Fondamentaux · Fondamentale · Technique)',
    "Communauté Afribourse — 3 mois d'accès",
    '3 Plans d\'action personnalisés (1 par session)',
    'Deal Flow hebdomadaire — 12 éditions exclusives',
    'Certificat "Investisseur BRVM — Niveau 1"',
  ],
  deliveryCalendar: [
    { when: 'Avant le 23 mai', what: 'Email de confirmation + lien Zoom' },
    { when: '26 mai (J+1 S1)', what: "Plan d'action Fondamentaux — livré par email" },
    { when: '30-31 mai', what: 'Session 2 — Analyse fondamentale' },
    { when: '1 juin', what: "Plan d'action Analyse fondamentale" },
    { when: '6-7 juin', what: 'Session 3 — Analyse technique' },
    { when: '8 juin', what: "Plan d'action Analyse technique" },
    { when: '9 juin', what: 'Accès Communauté activé + 1ère édition Deal Flow' },
    { when: '20 juin*', what: 'Certificat "Investisseur BRVM Niveau 1" (si quiz complété)' },
  ],
};

// ─── Countdown helpers (time-based, pour le pack) ────────────────────────────

function getPackCountdown(targetIso: string) {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: diff === 0,
  };
}
function pad2(n: number) { return String(n).padStart(2, '0'); }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(xof: number): string {
  return xof.toLocaleString('fr-FR') + ' XOF';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isDeadlinePassed(deadline: string): boolean {
  return new Date() >= new Date(deadline);
}

// Compte effectif : si le deadline est passé, on considère toutes les places prises
function effectiveCount(count: number, deadline: string): number {
  return isDeadlinePassed(deadline) ? EARLY_BIRD_SEATS : count;
}

// ─── EarlyBirdSeatsIndicator ──────────────────────────────────────────────────

const EarlyBirdSeatsIndicator: React.FC<{ count: number; fullPrice: number; deadline: string }> = ({ count, fullPrice, deadline }) => {
  const resolved = effectiveCount(count, deadline);
  const taken = Math.min(resolved, EARLY_BIRD_SEATS);
  const remaining = Math.max(0, EARLY_BIRD_SEATS - resolved);
  const earlyBirdActive = resolved < EARLY_BIRD_SEATS;
  const pct = Math.min(100, Math.round((taken / EARLY_BIRD_SEATS) * 100));
  const critical = remaining <= 5 && earlyBirdActive;

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${earlyBirdActive ? (critical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200') : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`flex items-center gap-1.5 text-xs font-bold ${earlyBirdActive ? (critical ? 'text-red-700' : 'text-amber-800') : 'text-gray-500'}`}>
          <Flame className={`w-3.5 h-3.5 ${earlyBirdActive ? 'animate-pulse' : ''}`} />
          {earlyBirdActive
            ? critical
              ? `⚠ Plus que ${remaining} place${remaining > 1 ? 's' : ''} à tarif réduit !`
              : `Il reste ${remaining} places à tarif réduit`
            : 'Places à tarif réduit épuisées'}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${earlyBirdActive ? (critical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800') : 'bg-gray-100 text-gray-500'}`}>
          {taken}/{EARLY_BIRD_SEATS}
        </span>
      </div>
      <div className={`w-full rounded-full h-1.5 overflow-hidden ${earlyBirdActive ? (critical ? 'bg-red-100' : 'bg-amber-100') : 'bg-gray-200'}`}>
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${earlyBirdActive ? (critical ? 'bg-red-500' : 'bg-amber-500') : 'bg-gray-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {earlyBirdActive && (
        <p className="text-[10px] text-amber-600 mt-1">Ensuite : tarif plein · {formatPrice(fullPrice)}</p>
      )}
    </div>
  );
};

// ─── Modal de pré-inscription ─────────────────────────────────────────────────

const MOBILE_OPERATORS = [
  { id: 'orange-money', label: 'Orange Money',     emoji: '🟠' },
  { id: 'mtn-momo',     label: 'MTN MoMo',         emoji: '🟡' },
  { id: 'moov-money',   label: 'Moov Money',        emoji: '🔵' },
  { id: 'free-money',   label: 'Free Money',        emoji: '🟢' },
];

const PAYMENT_DIAL_CODES = [
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+256', flag: '🇺🇬', name: 'Ouganda' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
];

const RegistrationModal: React.FC<{ webinar: Webinar; count: number; onClose: (registered?: boolean) => void }> = ({ webinar, count, onClose }) => {
  const { userProfile } = useAuth();
  const displayCount = Math.max(count, webinar.earlyBirdTaken ?? 0);
  const resolved = effectiveCount(displayCount, webinar.earlyBirdDeadline);
  const earlyBird = resolved < EARLY_BIRD_SEATS;
  const earlyBirdRemaining = Math.max(0, EARLY_BIRD_SEATS - resolved);
  const effectivePrice = earlyBird ? webinar.price * (1 - webinar.discountPercent / 100) : webinar.price;

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [payOperator, setPayOperator] = useState<string | null>(null);
  const [payDialCode, setPayDialCode] = useState('+225');
  const [payPhone, setPayPhone] = useState('');

  const [form, setForm] = useState({
    name: (userProfile as any)?.profile?.full_name || (userProfile as any)?.profile?.username || '',
    email: (userProfile as any)?.email || '',
    dialCode: '+225',
    phoneNumber: '',
  });

  const { status: payStatus, errorMessage: payError, initiate: initiatePayment, reset: resetPayment } = usePawaPayment(() => {
    setStep('success');
  });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Veuillez renseigner votre nom et email');
      return;
    }
    if (!form.phoneNumber.trim()) {
      toast.error('Le numéro WhatsApp est requis pour recevoir le lien de connexion');
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/webinars/preregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: webinar.id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: `${form.dialCode} ${form.phoneNumber.trim()}`,
          earlyBird,
          effectivePrice,
        }),
      });
      if (!res.ok && res.status !== 200) throw new Error();
      // Pré-remplir le téléphone de paiement depuis le formulaire
      setPayDialCode(form.dialCode);
      setPayPhone(form.phoneNumber);
      setStep('payment');
    } catch {
      toast.error('Erreur lors de l\'inscription. Réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (!payOperator) return;
    const correspondent = getCorrespondent(payOperator, payDialCode);
    if (!correspondent) { toast.error('Opérateur non disponible dans ce pays'); return; }
    const msisdn = payDialCode.replace('+', '') + payPhone.replace(/\D/g, '');
    initiatePayment({
      planId: webinar.id,
      planName: webinar.title,
      amount: String(effectivePrice),
      currency: getCurrency(form.dialCode),
      correspondent,
      phone: msisdn,
      registrationEmail: form.email.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onClose()} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${webinar.gradient} px-6 py-5`}>
          <button
            onClick={() => onClose()}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
            Pré-inscription webinaire
          </p>
          <h3 className="text-white font-bold text-lg leading-snug pr-6">{webinar.title}</h3>
          <p className="text-white/70 text-sm mt-1">
            {formatDate(webinar.date)} • {formatTime(webinar.date)}
          </p>
        </div>

        {/* ── Étape 1 : Formulaire ── */}
        {step === 'form' && (
          <div className="p-6 space-y-4">
            {earlyBird ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-500 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Tarif early bird : {formatPrice(effectivePrice)}
                    <span className="ml-2 text-xs font-normal line-through text-amber-400">{formatPrice(webinar.price)}</span>
                  </p>
                  <p className="text-xs text-amber-600">
                    Il ne reste que <strong>{earlyBirdRemaining}</strong> place{earlyBirdRemaining > 1 ? 's' : ''} à ce tarif
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600">Tarif plein : {formatPrice(webinar.price)}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex : Kofi Mensah" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="votre@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro WhatsApp <span className="text-red-500">*</span></label>
                <PhoneInput dialCode={form.dialCode} number={form.phoneNumber}
                  onDialChange={(code) => setForm(f => ({ ...f, dialCode: code }))}
                  onNumberChange={(n) => setForm(f => ({ ...f, phoneNumber: n }))} />
                <p className="text-xs text-gray-400 mt-1">Le lien de connexion vous sera envoyé sur WhatsApp</p>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all bg-gradient-to-r ${webinar.gradient} hover:opacity-90 active:scale-95 disabled:opacity-60`}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Continuer vers le paiement</>}
            </button>
          </div>
        )}

        {/* ── Étape 2 : Paiement Mobile Money ── */}
        {step === 'payment' && (
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
              ✅ Inscription enregistrée · Payez maintenant pour confirmer votre place
              <span className="block font-bold mt-0.5">{formatPrice(effectivePrice)}</span>
            </div>

            {/* Sélection opérateur */}
            {(payStatus === 'idle' || payStatus === 'initiating') && (
              <>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Choisissez votre opérateur Mobile Money</p>
                  <div className="grid grid-cols-2 gap-2">
                    {MOBILE_OPERATORS.map(op => {
                      const available = getAvailableCountries(op.id).includes(payDialCode);
                      return (
                        <button key={op.id} onClick={() => available && setPayOperator(op.id)} disabled={!available}
                          className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left
                            ${payOperator === op.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700 hover:border-blue-300'}
                            ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                          {op.emoji} {op.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pays</label>
                  <select value={payDialCode} onChange={e => { setPayDialCode(e.target.value); setPayOperator(null); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {PAYMENT_DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro Mobile Money</label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <span className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 flex items-center">{payDialCode}</span>
                    <input type="tel" value={payPhone} onChange={e => setPayPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                      placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                  </div>
                </div>

                {payError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{payError}</p>}

                <button onClick={handlePay} disabled={!payOperator || !payPhone.trim() || payStatus === 'initiating'}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {payStatus === 'initiating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : `Payer ${formatPrice(effectivePrice)}`}
                </button>
              </>
            )}

            {/* En attente du PIN */}
            {payStatus === 'pending' && (
              <div className="text-center py-4 space-y-3">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                <p className="font-bold text-gray-900">Vérifiez votre téléphone</p>
                <p className="text-sm text-gray-600">Entrez votre PIN Mobile Money pour confirmer le paiement de {formatPrice(effectivePrice)}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">⏱ Vous avez environ 1 à 2 minutes</div>
              </div>
            )}

            {/* Échec */}
            {payStatus === 'failed' && (
              <div className="text-center py-2 space-y-3">
                <p className="text-red-600 font-semibold">{payError}</p>
                <button onClick={resetPayment} className="text-sm font-semibold text-blue-600 hover:underline">Réessayer</button>
              </div>
            )}
          </div>
        )}

        {/* ── Étape 3 : Succès ── */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <h4 className="text-xl font-bold text-gray-900">Place confirmée 🎉</h4>
            <p className="text-sm text-gray-600">Votre paiement pour <strong>{webinar.title}</strong> est confirmé.</p>
            <p className="text-xs text-gray-500">Vous recevrez le lien de connexion par email et WhatsApp avant le début du webinaire.</p>
            <button onClick={() => onClose(true)} className="w-full py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── WebinarCard ──────────────────────────────────────────────────────────────

const WebinarCard: React.FC<{ webinar: Webinar; onRegister: (w: Webinar) => void; isFirst: boolean; count: number }> = ({
  webinar, onRegister, isFirst, count,
}) => {
  const displayCount = Math.max(count, webinar.earlyBirdTaken ?? 0);
  const earlyBird = effectiveCount(displayCount, webinar.earlyBirdDeadline) < EARLY_BIRD_SEATS;
  const discountedPrice = webinar.price * (1 - webinar.discountPercent / 100);
  const isMultiDay = new Date(webinar.date).toDateString() !== new Date(webinar.endDate).toDateString();
  const [countdown, setCountdown] = useState(getPackCountdown(webinar.earlyBirdDeadline));

  useEffect(() => {
    const t = setInterval(() => setCountdown(getPackCountdown(webinar.earlyBirdDeadline)), 1000);
    return () => clearInterval(t);
  }, [webinar.earlyBirdDeadline]);

  return (
    <div className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
      isFirst ? 'border-blue-200 shadow-md' : 'border-gray-200 shadow-sm'
    }`}>
      {webinar.badge && (
        <div className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${webinar.gradient}`}>
          {webinar.badge}
        </div>
      )}

      <div className={`h-1.5 w-full bg-gradient-to-r ${webinar.gradient}`} />

      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {webinar.theme.split('•').map(t => (
            <span key={t} className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {t.trim()}
            </span>
          ))}
        </div>

        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{webinar.title}</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{webinar.tagline}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {isMultiDay ? (
              <span>{formatDateShort(webinar.date)} & {formatDateShort(webinar.endDate)}</span>
            ) : (
              <span>{formatDate(webinar.date)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{formatTime(webinar.date)} — {webinar.duration} de formation live</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{webinar.speakers}</span>
          </div>
        </div>

        {webinar.investisseurPlusBonus && (
          <div className="mb-3 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
            <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
            <span className="text-xs font-bold text-yellow-800">🎁 Bonus : 1 semaine Investisseur+ offerte</span>
          </div>
        )}

        {/* Décompte early bird si pas encore expiré */}
        {earlyBird && !countdown.expired && !webinar.hideEarlyBirdIndicator && (
          <div className="mb-3 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2.5">
            <p className="text-[10px] font-bold text-amber-700 mb-2 flex items-center gap-1">
              <Flame className="w-3 h-3 animate-pulse" /> {webinar.registrationClose ? 'Inscriptions ferment dans' : 'Tarif réduit expire dans'}
            </p>
            <div className="flex gap-1.5">
              {countdown.days > 0 && (
                <div className="flex-1 bg-amber-400/20 rounded-lg py-1.5 text-center">
                  <p className="text-sm font-extrabold text-amber-800 leading-none">{pad2(countdown.days)}</p>
                  <p className="text-[9px] text-amber-600 mt-0.5">j</p>
                </div>
              )}
              <div className="flex-1 bg-amber-400/20 rounded-lg py-1.5 text-center">
                <p className="text-sm font-extrabold text-amber-800 leading-none">{pad2(countdown.hours)}</p>
                <p className="text-[9px] text-amber-600 mt-0.5">h</p>
              </div>
              <div className="flex-1 bg-amber-400/20 rounded-lg py-1.5 text-center">
                <p className="text-sm font-extrabold text-amber-800 leading-none">{pad2(countdown.minutes)}</p>
                <p className="text-[9px] text-amber-600 mt-0.5">min</p>
              </div>
              <div className="flex-1 bg-amber-400/20 rounded-lg py-1.5 text-center">
                <p className="text-sm font-extrabold text-amber-800 leading-none">{pad2(countdown.seconds)}</p>
                <p className="text-[9px] text-amber-600 mt-0.5">sec</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4">
          {!webinar.hideEarlyBirdIndicator && (
            <EarlyBirdSeatsIndicator count={displayCount} fullPrice={webinar.price} deadline={webinar.earlyBirdDeadline} />
          )}
        </div>

        {(() => {
          const remaining = MAX_SEATS - count;
          const pct = Math.min(100, Math.round((count / MAX_SEATS) * 100));
          const urgent = remaining <= 15;
          return (
            <div className={`mb-3 rounded-xl border px-3 py-2 ${urgent ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${urgent ? 'text-red-700' : 'text-emerald-700'}`}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{count} / {MAX_SEATS} places réservées</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgent ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {urgent ? `⚠ ${remaining} restantes` : `${remaining} disponibles`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${urgent ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}

        <div className="flex items-center justify-between gap-3">
          <div>
            {earlyBird ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-gray-900">{formatPrice(discountedPrice)}</span>
                  <span className="text-xs font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">-50%</span>
                </div>
                <span className="text-xs text-gray-400 line-through">{formatPrice(webinar.price)}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900">{formatPrice(webinar.price)}</span>
            )}
          </div>

          <button
            onClick={() => onRegister(webinar)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${webinar.gradient} hover:opacity-90 active:scale-95 transition-all flex-shrink-0`}
          >
            Je m'inscris
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── PackCard ─────────────────────────────────────────────────────────────────

const PackCard: React.FC<{ onRegister: () => void }> = ({ onRegister }) => {
  const currentPrice = PACK.price;

  return (
    <div className="relative bg-gradient-to-br from-blue-700 to-indigo-900 rounded-2xl overflow-hidden shadow-xl mb-6 border border-blue-600/30">
      {/* Badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className="bg-amber-400 text-amber-900 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide shadow">
          ⭐ Meilleure offre
        </span>
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Colonne gauche — présentation & inclusions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/15 border border-white/20 text-blue-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Pack complet · 3 sessions
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white leading-snug mb-1">{PACK.title}</h3>
            <p className="text-blue-200 text-sm mb-5">{PACK.tagline}</p>

            <div className="mb-4 flex items-center gap-2 bg-yellow-400/15 border border-yellow-300/30 rounded-xl px-3 py-2">
              <Zap className="w-3.5 h-3.5 text-yellow-300 flex-shrink-0" />
              <span className="text-xs font-bold text-yellow-200">🎁 Bonus : 1 semaine Investisseur+ offerte</span>
            </div>

            <ul className="space-y-2.5">
              {PACK.inclusions.map((item, i) => {
                const icons = [Video, Users, Calendar, TrendingUp, Award];
                const Icon = icons[i] ?? CheckCircle;
                return (
                  <li key={item} className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center mt-0.5">
                      <Icon className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-white text-sm leading-snug">{item}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Colonne droite — prix + CTA */}
          <div className="md:w-60 flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-2xl p-5 flex flex-col gap-3 border border-white/10">
            <div>
              <p className="text-blue-200 text-xs font-semibold mb-0.5 uppercase tracking-wide">Tarif</p>
              <p className="text-3xl font-extrabold text-white">{formatPrice(currentPrice)}</p>
            </div>

            <button
              onClick={onRegister}
              className="w-full py-3 bg-white text-blue-800 font-extrabold text-sm rounded-xl hover:bg-blue-50 active:scale-95 transition-all shadow-lg"
            >
              Rejoindre le parcours complet →
            </button>
            <p className="text-blue-300 text-[10px] text-center leading-relaxed">
              Satisfait ou remboursé · Paiement Mobile Money sécurisé
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PackRegistrationModal ────────────────────────────────────────────────────

const PackRegistrationModal: React.FC<{ onClose: (registered?: boolean) => void }> = ({ onClose }) => {
  const { userProfile } = useAuth();
  const currentPrice = PACK.price;

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [payOperator, setPayOperator] = useState<string | null>(null);
  const [payDialCode, setPayDialCode] = useState('+225');
  const [payPhone, setPayPhone] = useState('');
  const [form, setForm] = useState({
    name: (userProfile as any)?.profile?.full_name || (userProfile as any)?.profile?.username || '',
    email: (userProfile as any)?.email || '',
    dialCode: '+225',
    phoneNumber: '',
  });

  const { status: payStatus, errorMessage: payError, initiate: initiatePayment, reset: resetPayment } = usePawaPayment(() => {
    setStep('success');
  });

  const handlePay = () => {
    if (!payOperator) return;
    const correspondent = getCorrespondent(payOperator, payDialCode);
    if (!correspondent) { toast.error('Opérateur non disponible dans ce pays'); return; }
    const msisdn = payDialCode.replace('+', '') + payPhone.replace(/\D/g, '');
    initiatePayment({ planId: PACK.id, planName: PACK.title, amount: String(currentPrice), currency: getCurrency(payDialCode), correspondent, phone: msisdn, registrationEmail: form.email.trim() });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Veuillez renseigner votre nom et email');
      return;
    }
    if (!form.phoneNumber.trim()) {
      toast.error('Le numéro WhatsApp est requis pour recevoir le lien de connexion');
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/webinars/preregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: PACK.id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: `${form.dialCode} ${form.phoneNumber.trim()}`,
          type: 'pack',
          earlyBird: false,
          effectivePrice: currentPrice,
        }),
      });
      if (!res.ok && res.status !== 200) throw new Error();
      setPayDialCode(form.dialCode);
      setPayPhone(form.phoneNumber);
      setStep('payment');
    } catch {
      toast.error("Erreur lors de l'inscription. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onClose()} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[92vh] flex flex-col">
        {/* Zone 1 — Header gradient */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-5 flex-shrink-0">
          <button onClick={() => onClose()} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Pré-inscription · Pack complet</p>
          <h3 className="text-white font-bold text-lg leading-snug pr-6">{PACK.title}</h3>
          <p className="text-blue-200 text-sm mt-0.5">3 webinaires + communauté + certificat</p>
          {earlyBirdActive && (
            <span className="inline-block mt-2 bg-amber-400 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              ⭐ Offre early bird active
            </span>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {/* ── Étape 1 : Formulaire ── */}
          {step === 'form' && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Inclus dans le pack</p>
                  <ul className="space-y-1.5">
                    {PACK.inclusions.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`col-span-2 sm:col-span-1 rounded-xl p-3 border ${earlyBirdActive ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Votre tarif</p>
                  <p className="text-2xl font-extrabold text-gray-900">{formatPrice(currentPrice)}</p>
                  {earlyBirdActive && (
                    <>
                      <p className="text-xs text-gray-400 line-through mt-0.5">{formatPrice(PACK.price)}</p>
                      <p className="text-xs font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Vous économisez {formatPrice(savings)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex : Kofi Mensah" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="votre@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro WhatsApp <span className="text-red-500">*</span></label>
                  <PhoneInput dialCode={form.dialCode} number={form.phoneNumber}
                    onDialChange={(code) => setForm(f => ({ ...f, dialCode: code }))}
                    onNumberChange={(n) => setForm(f => ({ ...f, phoneNumber: n }))} />
                  <p className="text-xs text-gray-400 mt-1">Le lien de connexion vous sera envoyé sur WhatsApp</p>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-700 to-indigo-700 hover:opacity-90 active:scale-95 disabled:opacity-60 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Continuer vers le paiement</>}
              </button>
            </div>
          )}

          {/* ── Étape 2 : Paiement ── */}
          {step === 'payment' && (
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                ✅ Inscription enregistrée · Payez pour confirmer votre place
                <span className="block font-bold mt-0.5">{formatPrice(currentPrice)}</span>
              </div>

              {(payStatus === 'idle' || payStatus === 'initiating') && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Opérateur Mobile Money</p>
                    <div className="grid grid-cols-2 gap-2">
                      {MOBILE_OPERATORS.map(op => {
                        const available = getAvailableCountries(op.id).includes(payDialCode);
                        return (
                          <button key={op.id} onClick={() => available && setPayOperator(op.id)} disabled={!available}
                            className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all
                              ${payOperator === op.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700 hover:border-blue-300'}
                              ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                            {op.emoji} {op.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pays</label>
                    <select value={payDialCode} onChange={e => { setPayDialCode(e.target.value); setPayOperator(null); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      {PAYMENT_DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro Mobile Money</label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 flex items-center">{payDialCode}</span>
                      <input type="tel" value={payPhone} onChange={e => setPayPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                        placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                    </div>
                  </div>

                  {payError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{payError}</p>}

                  <button onClick={handlePay} disabled={!payOperator || !payPhone.trim() || payStatus === 'initiating'}
                    className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-700 to-indigo-700 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {payStatus === 'initiating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : `Payer ${formatPrice(currentPrice)}`}
                  </button>
                </>
              )}

              {payStatus === 'pending' && (
                <div className="text-center py-4 space-y-3">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                  <p className="font-bold text-gray-900">Vérifiez votre téléphone</p>
                  <p className="text-sm text-gray-600">Entrez votre PIN Mobile Money pour confirmer {formatPrice(currentPrice)}</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">⏱ Vous avez environ 1 à 2 minutes</div>
                </div>
              )}

              {payStatus === 'failed' && (
                <div className="text-center space-y-3">
                  <p className="text-red-600 font-semibold text-sm">{payError}</p>
                  <button onClick={resetPayment} className="text-sm font-semibold text-blue-600 hover:underline">Réessayer</button>
                </div>
              )}
            </div>
          )}

          {/* ── Étape 3 : Succès ── */}
          {step === 'success' && (
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <h4 className="text-xl font-bold text-gray-900">Vous êtes inscrit au Parcours Investisseur ! 🎓</h4>
              <p className="text-sm text-gray-500">Paiement confirmé · Vous recevrez tous les détails par email et WhatsApp.</p>
              <div className="mb-5 text-left">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">Ce que vous allez recevoir</p>
                <div className="space-y-2 border-l-2 border-blue-100 pl-4">
                  {PACK.deliveryCalendar.map((item, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-blue-600 font-semibold flex-shrink-0 w-32">{item.when}</span>
                      <span className="text-gray-600">{item.what}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => onClose(true)} className="w-full py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-colors">
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── WebinarSection — composant principal ─────────────────────────────────────

const WebinarSection: React.FC = () => {
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [showPackModal, setShowPackModal] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/webinars/counts`)
      .then((r) => r.json())
      .then((d) => { if (d?.data) setCounts(d.data); })
      .catch(() => {});
  }, []);

  const handleRegister = useCallback((w: Webinar) => setSelectedWebinar(w), []);
  const handleClose = useCallback((registered?: boolean) => {
    if (registered && selectedWebinar) {
      setCounts((prev) => ({ ...prev, [selectedWebinar.id]: (prev[selectedWebinar.id] ?? 0) + 1 }));
    }
    setSelectedWebinar(null);
  }, [selectedWebinar]);

  return (
    <>
      <section className="mt-12 mb-4">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Formation Live</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              Approfondissez avec nos webinaires d'experts
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sessions live animées par des analystes et experts de marché Afribourse.
              Places limitées — tarif préférentiel pour les 3 premiers jours.
            </p>
          </div>

          <div className="flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl px-4 py-3 text-center hidden sm:block">
            <div className="text-2xl font-black leading-none">50</div>
            <div className="text-xs font-semibold opacity-80 mt-0.5">places<br />par session</div>
          </div>
        </div>

        {/* Bandeau Investisseur+ */}
        <div className="mb-5 flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl px-4 py-3.5">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-2 rounded-xl flex-shrink-0">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-yellow-800">
              Abonnés Investisseur+ — 2 webinaires offerts 🎁
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Votre abonnement inclut l'accès gratuit à 2 sessions de votre choix. Mentionnez-le lors de votre pré-inscription.
            </p>
          </div>
          <a
            href="/subscriptions"
            className="flex-shrink-0 text-xs font-bold text-orange-600 hover:text-orange-800 underline underline-offset-2 transition-colors hidden sm:block"
          >
            Devenir Investisseur+
          </a>
        </div>

        {/* Pack Parcours Investisseur — carte dominante full-width */}
        <PackCard onRegister={() => setShowPackModal(true)} />

        {/* Webinaires individuels */}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Ou choisissez un webinaire individuel
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {WEBINARS.map((w, i) => (
            <WebinarCard key={w.id} webinar={w} onRegister={handleRegister} isFirst={i === 0} count={counts[w.id] ?? 0} />
          ))}
        </div>

      </section>

      {selectedWebinar && (
        <RegistrationModal webinar={selectedWebinar} count={counts[selectedWebinar.id] ?? 0} onClose={handleClose} />
      )}

      {showPackModal && (
        <PackRegistrationModal onClose={() => setShowPackModal(false)} />
      )}
    </>
  );
};

export default WebinarSection;
