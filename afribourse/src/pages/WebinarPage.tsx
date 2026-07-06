import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, ChevronDown, TrendingUp, BookOpen,
  Users, BarChart3, Award, Zap, MessageSquare, Calendar, Linkedin,
} from 'lucide-react';
import PricingPacks, { type PackId } from '../components/learning/PricingPacks';

// ─── Données ──────────────────────────────────────────────────────────────────

const OUTCOMES = [
  'Comprendre la BRVM et les marchés africains comme un initié',
  "Lire un bilan et des ratios financiers pour évaluer une action",
  "Appliquer l'analyse technique sur les graphiques BRVM",
  "Construire un portefeuille modèle avec une allocation réelle",
  "Accéder au Deal Flow hebdomadaire et à une communauté active",
  'Décrocher votre certificat "Investisseur BRVM Niveau 1"',
];

const PROGRAMME = [
  {
    phase: 'Avant le 4 juillet',
    label: 'Confirmation',
    items: ['Email de confirmation reçu', 'Lien Zoom envoyé par email et WhatsApp'],
    textColor: 'text-slate-600',
    dot: 'bg-slate-400',
    bg: 'bg-white border-gray-100',
  },
  {
    phase: '4 juillet — Session 1',
    label: 'Fondamentaux · 3h live',
    items: [
      'La BRVM — fonctionnement, acteurs, instruments',
      "Lire les cours, volumes et carnets d'ordres",
      "Ouvrir un compte et passer son premier ordre",
    ],
    textColor: 'text-blue-700',
    dot: 'bg-blue-600',
    bg: 'bg-blue-50 border-blue-100',
  },
  {
    phase: '5 juillet — J+1',
    label: "Plan d'action Fondamentaux",
    items: ["PDF livré par email avec les 5 décisions concrètes à prendre cette semaine"],
    textColor: 'text-slate-600',
    dot: 'bg-slate-400',
    bg: 'bg-white border-gray-100',
  },
  {
    phase: '18 juillet — Session 2',
    label: 'Analyse fondamentale Partie 1 · 3h live',
    items: [
      'Lire un bilan et un compte de résultat',
      'Comprendre les ratios financiers clés',
      'Identifier les entreprises BRVM sous-évaluées',
    ],
    textColor: 'text-emerald-700',
    dot: 'bg-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
  },
  {
    phase: '19 juillet — Session 3',
    label: 'Analyse fondamentale Partie 2 · 3h live',
    items: [
      'Valoriser une action BRVM avec DCF, PER, VCB',
      'Cas pratiques sur des entreprises cotées réelles',
      'Construire sa thèse d\'investissement',
    ],
    textColor: 'text-emerald-700',
    dot: 'bg-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
  },
  {
    phase: '20 juillet — J+1',
    label: "Plan d'action Analyse fondamentale",
    items: ["PDF avec 3 entreprises à analyser selon la méthode apprise"],
    textColor: 'text-slate-600',
    dot: 'bg-slate-400',
    bg: 'bg-white border-gray-100',
  },
  {
    phase: '1 août — Session 4',
    label: 'Analyse technique Partie 1 · 3h live',
    items: [
      'Lire les graphiques, repérer les patterns clés',
      'Supports, résistances et tendances sur la BRVM',
      'Timing d\'entrée et de sortie',
    ],
    textColor: 'text-orange-700',
    dot: 'bg-orange-500',
    bg: 'bg-orange-50 border-orange-100',
  },
  {
    phase: '2 août — Session 5',
    label: 'Analyse technique Partie 2 · 3h live',
    items: [
      'Indicateurs : RSI, MACD, moyennes mobiles',
      'Signaux d\'achat et de vente sur actions BRVM',
      'Cas pratiques sur graphiques réels',
    ],
    textColor: 'text-orange-700',
    dot: 'bg-orange-500',
    bg: 'bg-orange-50 border-orange-100',
  },
  {
    phase: '3 août — J+1',
    label: "Plan d'action Analyse technique",
    items: ["PDF avec 5 configurations graphiques à surveiller sur la BRVM"],
    textColor: 'text-slate-600',
    dot: 'bg-slate-400',
    bg: 'bg-white border-gray-100',
  },
  {
    phase: '4 août — Semaines suivantes',
    label: 'Communauté + Deal Flow',
    items: [
      'Accès à la communauté Afribourse activé (3 mois)',
      'Deal Flow hebdomadaire — 12 éditions exclusives',
      'Suivi de portefeuille en groupe',
    ],
    textColor: 'text-indigo-700',
    dot: 'bg-indigo-600',
    bg: 'bg-indigo-50 border-indigo-100',
  },
  {
    phase: '18 août*',
    label: 'Certificat',
    items: ['Certificat "Investisseur BRVM Niveau 1" — si quiz complété'],
    textColor: 'text-amber-700',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 border-amber-100',
  },
];

const INCLUSIONS = [
  { icon: <Users className="w-5 h-5" />, title: '5 sessions live · 15h', desc: 'S1 Fondamentaux (3h) · S2+S3 Fondamentale (2×3h) · S4+S5 Technique (2×3h)' },
  { icon: <MessageSquare className="w-5 h-5" />, title: 'Communauté 3 mois', desc: "Groupe d'investisseurs BRVM actifs avec suivi hebdomadaire" },
  { icon: <BookOpen className="w-5 h-5" />, title: "3 plans d'action", desc: 'Un PDF livré le lendemain de chaque session avec des exercices concrets' },
  { icon: <TrendingUp className="w-5 h-5" />, title: 'Deal Flow — 12 éditions', desc: 'Chaque semaine : les opportunités repérées par nos analystes' },
  { icon: <Award className="w-5 h-5" />, title: 'Certificat officiel', desc: '"Investisseur BRVM Niveau 1" — partageable LinkedIn/WhatsApp' },
  { icon: <Zap className="w-5 h-5" />, title: 'Replay 30 jours', desc: 'Accès aux enregistrements de chaque session pendant 30 jours' },
];

const SPEAKERS = [
  {
    initials: 'CZ',
    name: 'Curtis Zirignon',
    title: 'Fondateur · Afribourse',
    desc: 'Entrepreneur tech et finance, spécialiste des marchés UEMOA. Accompagne les investisseurs africains depuis 2022.',
    color: '#1D4ED8',
    linkedin: 'https://www.linkedin.com/in/curtis-zirignon-097424202/',
  },
  {
    initials: 'IB',
    name: 'Ibrahima Bayo',
    title: 'Analyste Financier · Fondateur IB Formation',
    desc: 'Analyste financier certifié, investisseur BRVM, comptable expérimenté. Forme des investisseurs particuliers depuis plusieurs années.',
    color: '#059669',
    linkedin: 'https://www.linkedin.com/in/ibrahima-bayo-0b8628161/',
  },
  {
    initials: 'EC',
    name: 'Emmanuel Coulibaly',
    title: 'Expert Consultant · Banque & Microfinance',
    desc: 'Consultant international en management bancaire et institutions de microfinance. Expertise pointue sur les marchés financiers africains.',
    color: '#EA580C',
    linkedin: 'https://www.linkedin.com/in/emmanuel-coulibaly-49554a20a/',
  },
];

// Témoignages — remplir avec de vrais verbatims clients (prénom, ville, phrase courte).
// La section ne s'affiche que si ce tableau contient au moins une entrée.
const TESTIMONIALS: { name: string; location: string; quote: string; initials: string; color: string }[] = [
  // Exemple de format (à remplacer par de vrais avis) :
  // { name: 'Awa K.', location: 'Abidjan', quote: "J'ai enfin compris comment lire un bilan BRVM.", initials: 'AK', color: '#1D4ED8' },
];

const FAQ = [
  {
    q: 'Comment ça marche après ma pré-inscription ?',
    a: "La pré-inscription est gratuite et sans engagement. Vous laissez votre nom, email et numéro WhatsApp — notre équipe vous recontacte sur WhatsApp pour finaliser votre place. Vous recevez aussi un lien de paiement avec votre réduction préinscrit de -10% (31 500 XOF au lieu de 35 000).",
    highlight: true,
  },
  {
    q: 'Puis-je rattraper si je manque une session ?',
    a: "Oui. Chaque session live est enregistrée et le replay vous est partagé. Vous pouvez donc rattraper à votre rythme si vous manquez une date, et garder accès aux rediffusions.",
  },
  {
    q: "C'est quoi la facilité de paiement en 3 fois ?",
    a: "Vous pouvez régler le parcours en 3 versements : 15 000 XOF aujourd'hui, puis 10 000 XOF et 10 000 XOF. Vous accédez au parcours dès le 1er paiement, et nous vous relançons pour les échéances suivantes (par email et WhatsApp).",
  },
  {
    q: 'Le pack est-il remboursable ?',
    a: 'Oui — satisfait ou remboursé. Si la formation ne correspond pas à vos attentes, envoyez-nous un email dans les 7 jours suivant votre paiement pour un remboursement complet, sans condition.',
  },
  {
    q: "Dois-je avoir un compte Afribourse pour me pré-inscrire ?",
    a: "Non. La pré-inscription se fait avec juste votre nom, email et numéro WhatsApp. Un compte n'est nécessaire que pour le paiement en 3 fois.",
  },
  {
    q: 'Comment reçois-je le lien de connexion Zoom ?',
    a: 'Le lien Zoom est envoyé par email ET par WhatsApp avant chaque session. Vous recevrez également un rappel 24h avant.',
  },
  {
    q: "Comment fonctionne le parcours ?",
    a: "Le parcours se suit en cohorte complète : 5 sessions live (Fondamentaux, Analyse fondamentale, Analyse technique) sur 3 semaines. Le Pack Parcours inclut aussi la communauté, les plans d'action et le Deal Flow.",
  },
  {
    q: 'Quel niveau est requis ?',
    a: "La session 1 (Fondamentaux) est conçue pour les débutants complets. Les sessions 2 et 3 demandent des bases — idéalement suivies dans l'ordre. Le pack est prévu pour être suivi en séquence.",
  },
  {
    q: 'Le contenu est-il spécifique à la BRVM ?',
    a: "Oui. Tous les exemples, cas pratiques et données utilisés lors des sessions sont tirés d'entreprises cotées sur la BRVM. Pas de contenu générique.",
  },
];

// ─── Composant principal ───────────────────────────────────────────────────────

export default function WebinarPage() {
  const registrationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else registrationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // CTA généraux → présentation des packs (l'offre)
  const scrollToRegistration = () => scrollToId('packs');

  // Choix d'un pack → page de paiement (le lead est capturé à l'étape contact du paiement)
  const handleChoosePack = (id: PackId) => {
    navigate(`/parcours/cohorte-juillet?pack=${id}`);
  };

  return (
    <div className="min-h-screen bg-white pb-20 sm:pb-0">

      {/* ── Section 1 — Hero ─────────────────────────────────────────────── */}
      <section
        style={{ background: 'linear-gradient(135deg, #0D2B4E 0%, #1a3a6b 50%, #0f1f3d 100%)' }}
        className="text-white px-4 pt-10 pb-20 sm:px-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Cohorte Juillet 2026
            </span>
            <span className="text-blue-400 text-xs">· Places limitées à 50 par session</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
            Investissez sur la BRVM<br />
            <span className="text-blue-400">avec méthode et confiance.</span>
          </h1>

          <p className="mt-2 text-xs text-blue-400 flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Satisfait ou remboursé · 7 jours · Paiement Mobile Money sécurisé
          </p>
        </div>
      </section>

      {/* ── Les 3 packs (good-better-best) ───────────────────────────────── */}
      <PricingPacks onChoose={handleChoosePack} />


      {/* ── Témoignages (affichés uniquement si renseignés) ──────────────── */}
      {TESTIMONIALS.length > 0 && (
        <section className="bg-white px-4 py-12 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 text-center mb-3">Ils ont suivi le parcours</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">“{t.quote}”</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-extrabold" style={{ background: t.color }}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 leading-none">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 2 — Le problème ──────────────────────────────────────── */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">Pourquoi ce programme existe</p>
          <p className="text-gray-700 text-lg leading-relaxed">
            La plupart des investisseurs africains perdent de l'argent non pas par manque d'ambition, mais par manque de méthode. Ils regardent les cours sans savoir pourquoi ils bougent.
          </p>
          <p className="text-gray-600 text-base leading-relaxed">
            L'information sur la BRVM est fragmentée. Les données financières sont difficiles à interpréter. Et les rares formations disponibles sont soit trop génériques, soit trop coûteuses pour être accessibles.
          </p>
          <p className="text-gray-700 text-base leading-relaxed font-medium">
            Résultat : vous hésitez, vous agissez sur des rumeurs, ou vous n'agissez pas du tout. Ce programme existe pour changer ça — concrètement, en 5 sessions.
          </p>
        </div>
      </section>

      {/* ── Section 3 — Outcomes ─────────────────────────────────────────── */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 text-center mb-3">Ce que vous allez accomplir</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-10" style={{ letterSpacing: '-0.01em' }}>
            À la fin de ce parcours, vous aurez...
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {OUTCOMES.map((o) => (
              <div key={o} className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800 text-sm font-medium leading-snug">{o}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7 — Speakers ─────────────────────────────────────────── */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 text-center mb-3">Vos formateurs</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-10" style={{ letterSpacing: '-0.01em' }}>
            Qui anime le programme
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {SPEAKERS.map((s) => (
              <div key={s.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-extrabold"
                  style={{ background: s.color }}
                >
                  {s.initials}
                </div>
                <p className="font-bold text-gray-900 text-base mb-0.5">{s.name}</p>
                <p className="text-xs font-semibold text-blue-600 mb-3">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{s.desc}</p>
                <a
                  href={s.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A66C2] hover:underline"
                >
                  <Linkedin className="w-4 h-4" /> Voir le profil LinkedIn
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 8 — FAQ ──────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-16 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 text-center mb-3">FAQ</p>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">
            Vos questions — nos réponses directes
          </h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <FaqItem key={i} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section
        style={{ background: 'linear-gradient(135deg, #0D2B4E 0%, #1a3a6b 100%)' }}
        className="px-4 py-16 sm:px-6 text-white text-center"
      >
        <div className="max-w-xl mx-auto">
          <BarChart3 className="w-10 h-10 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Prêt à investir avec méthode ?</h2>
          <p className="text-blue-200 mb-8 text-base leading-relaxed">
            La prochaine cohorte démarre le 18 juillet. Les places sont limitées à 50 par session.
          </p>
          <button
            onClick={scrollToRegistration}
            className="bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-base px-10 py-4 rounded-xl transition-all active:scale-95 shadow-lg"
          >
            🎟️ Je réserve ma place gratuitement →
          </button>
          <p className="mt-4 text-xs text-blue-400">Pré-inscription gratuite · -10% réservé aux préinscrits · sans engagement</p>
        </div>
      </section>

      {/* ── Sticky CTA mobile ────────────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3" style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.08)' }}>
        <button
          onClick={scrollToRegistration}
          className="w-full py-3 rounded-xl font-extrabold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-700 active:scale-95 transition-transform"
        >
          🎟️ Choisir mon pack — Cohorte 18 juillet →
        </button>
      </div>

    </div>
  );
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────

function FaqItem({ item }: { item: { q: string; a: string; highlight?: boolean } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${item.highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          {item.highlight && <span className="text-emerald-500">✓</span>}
          {item.q}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-200">
          <p className="pt-3">{item.a}</p>
        </div>
      )}
    </div>
  );
}
