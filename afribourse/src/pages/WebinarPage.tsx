import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, ChevronRight, TrendingUp, BookOpen,
  Users, BarChart3, Award, Zap, MessageSquare, Linkedin,
} from 'lucide-react';
import { Button } from '../components/ui';
import PricingPacks, { type PackId } from '../components/learning/PricingPacks';
import { HERO_BACKGROUNDS, HERO_GRID_STYLE } from '../utils/heroBackgrounds';

// ─── Données ──────────────────────────────────────────────────────────────────

const OUTCOMES = [
  'Comprendre la BRVM et les marchés africains comme un initié',
  "Lire un bilan et des ratios financiers pour évaluer une action",
  "Appliquer l'analyse technique sur les graphiques BRVM",
  "Construire un portefeuille modèle avec une allocation réelle",
  "Accéder au Deal Flow hebdomadaire et à une communauté active",
  'Décrocher votre certificat "Investisseur BRVM Niveau 1"',
];

// ATTENTION — PROGRAMME et INCLUSIONS ne sont rendus nulle part dans ce fichier.
// Ce sont des donnees mortes, conservees telles quelles (couleurs comprises) :
// les recolorer serait sans effet tant qu'aucune section ne les affiche.
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
    linkedin: 'https://www.linkedin.com/in/curtis-zirignon-097424202/',
  },
  {
    initials: 'IB',
    name: 'Ibrahima Bayo',
    title: 'Analyste Financier · Fondateur IB Formation',
    desc: 'Analyste financier certifié, investisseur BRVM, comptable expérimenté. Forme des investisseurs particuliers depuis plusieurs années.',
    linkedin: 'https://www.linkedin.com/in/ibrahima-bayo-0b8628161/',
  },
  {
    initials: 'EC',
    name: 'Emmanuel Coulibaly',
    title: 'Expert Consultant · Banque & Microfinance',
    desc: 'Consultant international en management bancaire et institutions de microfinance. Expertise pointue sur les marchés financiers africains.',
    linkedin: 'https://www.linkedin.com/in/emmanuel-coulibaly-49554a20a/',
  },
];

// Témoignages — remplir avec de vrais verbatims clients (prénom, ville, phrase courte).
// La section ne s'affiche que si ce tableau contient au moins une entrée.
const TESTIMONIALS: { name: string; location: string; quote: string; initials: string }[] = [
  // Exemple de format (à remplacer par de vrais avis) :
  // { name: 'Awa K.', location: 'Abidjan', quote: "J'ai enfin compris comment lire un bilan BRVM.", initials: 'AK' },
];

const FAQ = [
  {
    q: 'Comment ça marche après ma pré-inscription ?',
    a: "La pré-inscription est gratuite et sans engagement. Vous laissez votre nom, email et numéro WhatsApp — notre équipe vous recontacte sur WhatsApp pour finaliser votre place, et vous recevez un lien de paiement sécurisé (Mobile Money ou Wave).",
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

// ─── Gabarits repris de la page d'accueil ─────────────────────────────────────
// Memes conteneurs, meme rythme vertical, memes corps de texte : les deux pages
// doivent se lire comme un seul site.

/** Conteneur de section — identique aux AnimatedSection de HomePage. */
const SECTION = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

/** Rythme vertical — l'equivalent plein-cadre du mt-16 md:mt-24 de l'accueil. */
const SECTION_PAD = 'py-16 md:py-24';

/**
 * Pastille de surtitre — le point qui bat devant le libelle, comme en tete des
 * sections « En direct » et « Séance du jour » de l'accueil.
 */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <span className="w-2 h-2 rounded-full bg-brand-navy animate-pulse" />
      <span className="text-xs font-bold uppercase tracking-widest text-brand-navy">{children}</span>
    </div>
  );
}

/** Titre de section — text-3xl font-bold, comme tous les h2 de l'accueil. */
const H2 = 'text-3xl font-bold text-gray-900 text-center mb-3';

/** Sous-titre de section — corps de texte par defaut, comme a l'accueil. */
const LEAD = 'text-gray-600 text-center max-w-2xl mx-auto';

// ─── Composant principal ───────────────────────────────────────────────────────

export default function WebinarPage() {
  const registrationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Meme fond tournant que le hero de l'accueil, meme cadence.
  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBgIndex(i => (i + 1) % HERO_BACKGROUNDS.length), 6000);
    return () => clearInterval(id);
  }, []);

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

      {/* ── Section 1 — Hero ─────────────────────────────────────────────────
          Meme degrade et meme accent que le hero de l'accueil, pour que le
          passage de l'une a l'autre ne donne pas l'impression de changer de
          site. */}
      <section className="relative overflow-hidden bg-brand-navy text-white pt-10 pb-16 md:pt-14 md:pb-20">
        {/* Variantes en fondu croise : toutes montees en permanence, seule
            l'opacite change. Reconstruire le degrade a chaque rotation ferait
            clignoter le fond. */}
        {HERO_BACKGROUNDS.map((bg, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${i === bgIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `${bg.halo}, ${bg.gradient}` }}
          />
        ))}
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.07] pointer-events-none" style={HERO_GRID_STYLE} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/25 to-transparent pointer-events-none" />

        <div className={`${SECTION} relative`}>
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="bg-white/10 ring-1 ring-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">
                Cohorte Août 2026
              </span>
              <span className="text-ink-200 text-xs">· Places limitées à 50 par session</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.3] tracking-tight mb-4">
              <span className="block">Investissez sur la BRVM</span>
              {/* Accent en orange clair, comme les mots mis en avant sur les
                  fonds sombres de l'accueil. Le degrade bleu-cyan-turquoise
                  d'avant n'appartenait pas a la charte. */}
              <span className="block mt-2 sm:mt-3 text-brand-orange-light">
                avec méthode et confiance.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-ink-200 mb-7 max-w-xl leading-relaxed">
              Cinq sessions live pour passer de l'intuition à la méthode, sur les entreprises
              réellement cotées à la BRVM.
            </p>

            <div className="flex flex-row gap-3 items-center">
              <Button
                variant="orange"
                size="md"
                className="flex-1 sm:flex-none h-12 sm:h-14 gap-2 whitespace-nowrap"
                onClick={scrollToRegistration}
              >
                <BarChart3 className="w-5 h-5 shrink-0" />
                Choisir mon pack
              </Button>
            </div>

            <p className="mt-5 text-xs text-ink-300">
              Satisfait ou remboursé · 7 jours · Paiement Mobile Money sécurisé
            </p>
          </div>
        </div>
      </section>

      {/* ── Les 3 packs (good-better-best) ───────────────────────────────── */}
      <PricingPacks onChoose={handleChoosePack} />

      {/* ── Témoignages (affichés uniquement si renseignés) ──────────────── */}
      {TESTIMONIALS.length > 0 && (
        <section className={`bg-white ${SECTION_PAD}`}>
          <div className={SECTION}>
            <Eyebrow>Ils ont suivi le parcours</Eyebrow>
            <h2 className={`${H2} mb-12`}>Ce qu'en disent les participants</h2>
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-gray-600 leading-relaxed mb-4">“{t.quote}”</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-white text-xs font-bold">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-none">{t.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{t.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Section 2 — Le problème ──────────────────────────────────────── */}
      <section className={`bg-gray-50 ${SECTION_PAD}`}>
        <div className={SECTION}>
          <Eyebrow>Pourquoi ce programme existe</Eyebrow>
          <h2 className={`${H2} mb-8`}>Le problème n'est pas l'ambition, c'est la méthode</h2>
          <div className="max-w-2xl mx-auto space-y-4 text-center">
            <p className="text-gray-600 leading-relaxed">
              La plupart des investisseurs africains perdent de l'argent non pas par manque d'ambition, mais par manque de méthode. Ils regardent les cours sans savoir pourquoi ils bougent.
            </p>
            <p className="text-gray-600 leading-relaxed">
              L'information sur la BRVM est fragmentée. Les données financières sont difficiles à interpréter. Et les rares formations disponibles sont soit trop génériques, soit trop coûteuses pour être accessibles.
            </p>
            <p className="text-gray-900 font-medium leading-relaxed">
              Résultat : vous hésitez, vous agissez sur des rumeurs, ou vous n'agissez pas du tout. Ce programme existe pour changer ça — concrètement, en 5 sessions.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3 — Outcomes ─────────────────────────────────────────── */}
      <section className={`bg-white ${SECTION_PAD}`}>
        <div className={SECTION}>
          <Eyebrow>Ce que vous allez accomplir</Eyebrow>
          <h2 className={`${H2} mb-12`}>À la fin de ce parcours, vous aurez...</h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {OUTCOMES.map((o) => (
              <div
                key={o}
                className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-6 py-5 transition-all duration-300 hover:border-brand-navy/25 hover:shadow-sm"
              >
                <CheckCircle className="w-5 h-5 text-brand-navy flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-snug">{o}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7 — Speakers ─────────────────────────────────────────── */}
      <section className={`bg-gray-50 ${SECTION_PAD}`}>
        <div className={SECTION}>
          <Eyebrow>Vos formateurs</Eyebrow>
          <h2 className={`${H2} mb-12`}>Qui anime le programme</h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {SPEAKERS.map((s) => (
              <div key={s.name} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-brand-navy text-white text-xl font-bold">
                  {s.initials}
                </div>
                <p className="font-bold text-gray-900 mb-1">{s.name}</p>
                <p className="text-sm font-semibold text-brand-navy mb-3">{s.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{s.desc}</p>
                <a
                  href={s.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy hover:underline"
                >
                  <Linkedin className="w-4 h-4" /> Voir le profil LinkedIn
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 8 — FAQ ──────────────────────────────────────────────── */}
      <section className={`bg-white ${SECTION_PAD}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Questions Fréquentes</h2>
            <p className="text-gray-600">
              Ce qu'il faut savoir avant de réserver votre place : déroulé des sessions,
              modalités de paiement, replays et conditions de remboursement.
            </p>
          </div>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <FaqItem key={i} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────────── */}
      <section className={`${SECTION} ${SECTION_PAD}`}>
        {/* Meme bandeau que l'appel a l'action de l'accueil : degrade navy,
            halo, trame. L'aplat navy uni d'avant etait le seul de tout le site. */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-[#173F66] to-ink-950 text-white text-center px-6 py-12 md:px-12 md:py-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.18] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 88% 15%, #7C95AB 0%, transparent 55%)' }}
          />
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.07] pointer-events-none" style={HERO_GRID_STYLE} />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-sm mb-5">
              <Users className="w-3.5 h-3.5" />
              50 places par session
            </span>
            <h2 className="text-3xl font-bold mb-3">Prêt à investir avec méthode ?</h2>
            <p className="text-ink-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              La prochaine cohorte démarre le 8 août et les places sont limitées à 50 par session.
              Réservez la vôtre — pré-inscription gratuite, paiement Mobile Money ou Wave,
              et remboursement sous 7 jours si le parcours ne vous convient pas.
            </p>
            <Button
              variant="orange"
              size="md"
              className="h-12 sm:h-14 gap-2"
              onClick={scrollToRegistration}
            >
              Je réserve ma place
              <ChevronRight className="w-5 h-5 shrink-0" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Sticky CTA mobile ────────────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <Button
          variant="orange"
          size="md"
          className="w-full h-12 gap-2"
          onClick={scrollToRegistration}
        >
          Choisir mon pack — Cohorte 8 août
          <ChevronRight className="w-4 h-4 shrink-0" />
        </Button>
      </div>

    </div>
  );
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────
// Repris a l'identique de la FAQ d'accueil : meme carte, meme bordure navy a
// l'ouverture, meme chevron qui pivote d'un quart de tour.
//
// Seule difference, le depliement passe par grid-rows plutot que par un
// max-height fixe : les reponses sont ici bien plus longues qu'a l'accueil et
// un plafond en dur les aurait tronquees.

function FaqItem({ item }: { item: { q: string; a: string; highlight?: boolean } }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
        open
          ? 'border-brand-navy/40 shadow-md shadow-brand-navy/10'
          : 'border-gray-200 hover:border-brand-navy/25 hover:shadow-sm'
      }`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center px-6 py-5">
        <h3 className="font-bold text-gray-900 pr-4">{item.q}</h3>
        <ChevronRight
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
        />
      </div>

      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <p className="text-gray-600 leading-relaxed px-6 pb-5">{item.a}</p>
        </div>
      </div>
    </div>
  );
}