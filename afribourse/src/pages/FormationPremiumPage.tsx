import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Crown, CheckCircle, Lock, Shield,
  ChevronDown, ChevronRight, Star, Zap, BookOpen,
  Brain, BarChart3, Award, Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PaymentModal from '../components/payment/PaymentModal';
import { analytics } from '../services/analytics';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = 'https://afribourse-api.onrender.com/api/og/image/page/formation';

const PLAN_ID = 'premium-modules';
const PLAN_NAME = 'Formation Complète';
const AMOUNT = '15000';
const COUNTDOWN_KEY = 'formation_countdown_end';
const COUNTDOWN_DURATION = 23 * 60 * 60 + 47 * 60 + 13;

const OPERATORS = [
  { id: 'orange-money', label: 'Orange Money', emoji: '🟠', bg: '#E55A00' },
  { id: 'mtn-momo',    label: 'MTN MoMo',     emoji: '🟡', bg: '#D4A200' },
  { id: 'moov-money',  label: 'Moov Money',   emoji: '🟢', bg: '#007A5E' },
];

const FREE_MODULES = [
  { n: 'M0', title: 'Introduction à la BRVM & aux marchés africains' },
  { n: 'M1', title: 'Comprendre les actions & obligations' },
  { n: 'M2', title: 'Ouvrir un compte et passer son premier ordre' },
  { n: 'M3', title: 'Les acteurs du marché : qui fait quoi ?' },
  { n: 'M4', title: 'Les instruments : actions, obligations & OPCVM' },
  { n: 'M5', title: 'Passer un ordre de bourse — délais & méthodes' },
  { n: 'M6', title: 'Psychologie & biais : le mental du gagnant' },
];

const PREMIUM_MODULES = [
  { n: 'M7',  title: 'Analyse Fondamentale', sub: 'Lire les états financiers comme un pro' },
  { n: 'M8',  title: "L'Évaluation d'Entreprise", sub: "DCF, PER, VCB — projeter l'avenir" },
  { n: 'M9',  title: "L'Analyse Extra-Financière", sub: 'ESG, gouvernance, contexte macro' },
  { n: 'M10', title: "L'Art du Timing", sub: 'Analyse technique & graphiques avancés' },
  { n: 'M11', title: 'Maîtrise du Risque', sub: 'Gestion de portefeuille & diversification' },
  { n: 'M12', title: "L'Architecte du Risque", sub: 'Stop-loss, position sizing avancé' },
  { n: 'M13', title: 'Outils, Actualités & Fiscalité', sub: 'Screener, news, implications fiscales' },
  { n: 'M14', title: 'Contexte Économique', sub: 'Sentir le pouls du marché UEMOA' },
  { n: 'M15', title: "Stratégie d'Investissement Intégrée", sub: 'Construire votre approche personnelle' },
  { n: 'M16', title: 'Préparation & Infrastructure', sub: 'Outils, plateformes, workflow professionnel' },
  { n: 'M17', title: 'Psychologie Avancée du Trading', sub: 'Discipline, routine, gestion des émotions' },
  { n: 'M18', title: 'Portefeuille Modèle BRVM', sub: 'Étude de cas avec allocation réelle' },
  { n: 'M19', title: "Certification & Plan d'Action", sub: 'Valider et déployer vos compétences' },
];

const BENEFITS = [
  { icon: () => <Brain className="w-6 h-6" />, title: '13 modules avancés', desc: 'Du fondamental au technique, en passant par la psychologie' },
  { icon: () => <CheckCircle className="w-6 h-6" />, title: 'Quiz inclus', desc: 'Validez vos connaissances après chaque module' },
  { icon: () => <Clock className="w-6 h-6" />, title: 'Accès à vie', desc: 'Paiement unique, sans abonnement, sans expiration' },
  { icon: () => <BarChart3 className="w-6 h-6" />, title: 'Études de cas BRVM', desc: "Exemples réels tirés des marchés d'Afrique de l'Ouest" },
  { icon: () => <Shield className="w-6 h-6" />, title: 'Mises à jour incluses', desc: 'Contenu mis à jour quand les marchés évoluent' },
  { icon: () => <BookOpen className="w-6 h-6" />, title: '20 modules au total', desc: 'M0–M6 gratuits + M7–M19 débloqués en un seul paiement' },
];

const TESTIMONIALS = [
  {
    text: "Avant cette formation, je regardais les cours sans comprendre pourquoi ils bougeaient. Maintenant je sais lire un bilan, analyser un secteur et surtout — ne pas paniquer. C'est transformateur.",
    initials: 'KD', name: 'Kofi Danso', title: 'Investisseur particulier, Accra', color: '#C9A84C',
  },
  {
    text: "Le module sur la psychologie des biais m'a sauvé de plusieurs mauvaises décisions. J'aurais payé 10x le prix pour ça. La clarté des explications sur la BRVM spécifiquement, c'est introuvable ailleurs.",
    initials: 'AF', name: 'Aminata Fofana', title: 'Étudiante en finance, Dakar', color: '#4CAF96',
  },
  {
    text: "J'ai terminé les 13 modules en 3 semaines. Maintenant je passe mes ordres avec conviction. Mon portefeuille a progressé de 18% en 6 mois — pas de chance, de méthode.",
    initials: 'MB', name: 'Marc Bello', title: 'Entrepreneur, Abidjan', color: '#7C6AF8',
  },
];

const FAQ = [
  {
    q: 'Est-ce vraiment un paiement unique ?',
    a: 'Oui, sans exception. Vous payez 15 000 FCFA une seule fois et accédez aux modules M7–M19 à vie. Aucun abonnement, aucun renouvellement automatique.',
  },
  {
    q: 'Le certificat est-il inclus dans les 15 000 FCFA ?',
    a: "Non, le certificat AfriBourse est une option séparée à 15 000 FCFA supplémentaires. Il est disponible après avoir complété tous les modules et réussi les quiz. Les 15 000 FCFA de la formation donnent accès uniquement aux modules M7–M19.",
  },
  {
    q: 'Quand mon accès est-il activé ?',
    a: "Dès que votre paiement mobile money est confirmé — généralement en moins de 2 minutes. Les modules s'affichent immédiatement dans votre espace d'apprentissage.",
  },
  {
    q: 'Quels opérateurs sont acceptés ?',
    a: "Orange Money, MTN Mobile Money et Moov Money. Disponibles dans tous les pays UEMOA (Sénégal, Côte d'Ivoire, Burkina Faso, Mali, Niger, Bénin, Togo, Guinée-Bissau).",
  },
  {
    q: 'Que se passe-t-il si mon paiement échoue ?',
    a: "Aucun montant n'est prélevé en cas d'échec. Vérifiez votre solde et réessayez. Si le problème persiste, contactez-nous à support@africbourse.com.",
  },
];

const TICKER_ITEMS = [
  { initials: 'KD', name: 'Kofi D.', city: 'Accra', time: 'il y a 4 min' },
  { initials: 'AF', name: 'Aminata F.', city: 'Dakar', time: 'il y a 11 min' },
  { initials: 'MB', name: 'Marc B.', city: 'Abidjan', time: 'il y a 18 min' },
  { initials: 'YT', name: 'Yemi T.', city: 'Lagos', time: 'il y a 27 min' },
  { initials: 'SC', name: 'Seydou C.', city: 'Bamako', time: 'il y a 35 min' },
  { initials: 'FR', name: 'Fatou R.', city: 'Lomé', time: 'il y a 42 min' },
];

function pad(n: number) { return String(n).padStart(2, '0'); }

// ─── Color tokens (light theme) ──────────────────────────────────────────────
const C = {
  bg:        '#FFFFFF',
  bgSub:     '#F8FAFC',
  bgCard:    '#F1F5F9',
  border:    '#E2E8F0',
  borderMid: '#CBD5E1',
  text:      '#0F172A',
  textSub:   '#475569',
  textMuted: '#94A3B8',
  gold:      '#B8922A',
  goldLight: '#C9A84C',
  goldBg:    'rgba(201,168,76,.08)',
  goldBorder:'rgba(201,168,76,.35)',
  green:     '#16A34A',
  greenBg:   'rgba(22,163,74,.08)',
  greenBorder:'rgba(22,163,74,.25)',
  red:       '#DC2626',
  redBg:     'rgba(220,38,38,.06)',
  redBorder: 'rgba(220,38,38,.25)',
};

export default function FormationPremiumPage() {
  const navigate = useNavigate();
  const { userProfile, isLoggedIn } = useAuth();
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [countdown, setCountdown] = useState({ h: 23, m: 47, s: 13 });
  const pricingRef = useRef<HTMLDivElement>(null);

  const userTier = userProfile?.subscriptionTier ?? '';
  const isAlreadyUnlocked = ['premium', 'max', 'pro', 'formation'].includes(userTier);

  useEffect(() => {
    let endTs = Number(sessionStorage.getItem(COUNTDOWN_KEY));
    if (!endTs || endTs < Date.now()) {
      endTs = Date.now() + COUNTDOWN_DURATION * 1000;
      sessionStorage.setItem(COUNTDOWN_KEY, String(endTs));
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((endTs - Date.now()) / 1000));
      setCountdown({ h: Math.floor(diff / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).style.opacity = '1';
          (e.target as HTMLElement).style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleSuccess = () => {
    analytics.trackAction('formation_payment_success', PLAN_NAME, { planId: PLAN_ID, amount: AMOUNT });
    setTimeout(() => navigate('/learn'), 2500);
  };
  const scrollToPricing = () => { pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' }}>
      <Helmet>
        <title>Formation Premium BRVM — Modules Avancés d'Investissement | AfriBourse</title>
        <meta name="description" content="Accédez aux modules avancés de la formation AfriBourse : analyse technique, analyse fondamentale, stratégies de portefeuille sur la BRVM. Formation complète pour investir sur les marchés africains." />
        <meta name="keywords" content="formation premium BRVM, modules avancés investissement, analyse technique BRVM, formation complète bourse Afrique, investissement UEMOA" />
        <link rel="canonical" href={`${SITE_URL}/formation`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content="Formation Premium BRVM — Modules Avancés | AfriBourse" />
        <meta property="og:description" content="Analyse technique, fondamentale et stratégies de portefeuille BRVM. Formation complète." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${SITE_URL}/formation`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AfriBourse" />
        <meta name="twitter:title" content="Formation Premium BRVM | AfriBourse" />
        <meta name="twitter:description" content="Modules avancés : analyse technique, fondamentale et stratégies BRVM." />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>
      <style>{`
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .ticker-track { display:flex; animation:ticker 28s linear infinite; width:max-content; }
        .ticker-track:hover { animation-play-state:paused; }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.6} }
        .shimmer { animation:shimmer 2s ease-in-out infinite; }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.45)} 50%{box-shadow:0 0 0 10px rgba(201,168,76,0)} }
        .cta-pulse { animation:pulse-glow 2.4s ease-in-out infinite; }
        @keyframes dot-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.65)} }
        .dot-live { animation:dot-pulse 1.4s ease-in-out infinite; }
        .reveal { opacity:0; transform:translateY(24px); transition:opacity .55s ease,transform .55s ease; }
        .op-btn:hover { filter:brightness(1.1); transform:translateY(-1px); }
        .op-btn { transition:all .15s ease; }
        .divider-line { flex:1; height:1px; background:${C.border}; }
      `}</style>

      {/* ── Sticky banner ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#FFFBF0', borderBottom: `1px solid ${C.goldBorder}`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Crown style={{ width: 15, height: 15, color: C.goldLight }} />
          <span style={{ fontSize: 13, color: C.gold, fontWeight: 700 }}>Formation Complète — 15 000 FCFA · Accès à vie</span>
        </div>
        <button onClick={scrollToPricing} style={{ background: C.goldLight, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Débloquer →
        </button>
      </div>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '36px 20px 0' }}>
        <button onClick={() => navigate('/learn')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à l'académie
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 20, padding: '5px 14px', marginBottom: 18 }}>
          <Crown style={{ width: 12, height: 12, color: C.goldLight }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Accès à vie · Paiement unique</span>
        </div>

        <h1 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 800, lineHeight: 1.18, marginBottom: 14, letterSpacing: '-0.02em', color: C.text }}>
          Devenez un investisseur<br />
          <span style={{ color: C.goldLight }}>qui comprend vraiment</span> ce qu'il fait
        </h1>

        <p style={{ fontSize: 17, color: C.textSub, lineHeight: 1.65, marginBottom: 24, maxWidth: 580 }}>
          13 modules avancés conçus pour les marchés africains. Analyse fondamentale, technique, gestion du risque, psychologie — tout ce que les 7 modules gratuits ne couvrent pas.
        </p>

        {/* Danger box */}
        <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, color: C.red, fontSize: 14, marginBottom: 4 }}>Ce que coûte vraiment de ne pas savoir</p>
            <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>
              Un investisseur non formé perd en moyenne 30–50% de son capital lors des 2 premières années. <strong>500 000 FCFA de pertes évitables</strong> contre 15 000 FCFA de formation — le calcul est brutal.
            </p>
          </div>
        </div>

        {/* Ticker */}
        <div style={{ background: C.bgSub, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 0', overflow: 'hidden', marginBottom: 28 }}>
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 28px', whiteSpace: 'nowrap', borderRight: `1px solid ${C.border}` }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: `hsl(${i * 37 % 360},55%,48%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {item.initials}
                </div>
                <span style={{ fontSize: 12, color: C.textSub }}>
                  <strong style={{ color: C.text }}>{item.name}</strong> ({item.city}) a débloqué la formation ·{' '}
                  <span style={{ color: C.textMuted }}>{item.time}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
          <button onClick={scrollToPricing} className="cta-pulse" style={{ background: `linear-gradient(135deg,${C.goldLight},#E8C86A)`, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap style={{ width: 18, height: 18 }} /> Débloquer pour 15 000 FCFA
          </button>
          <button onClick={() => navigate('/learn')} style={{ background: 'transparent', color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Voir les modules gratuits
          </button>
        </div>
      </section>

      {/* ── Already unlocked ── */}
      {isAlreadyUnlocked && (
        <section style={{ maxWidth: 760, margin: '0 auto 32px', padding: '0 20px' }}>
          <div style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, background: C.green, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: C.green, marginBottom: 2 }}>Formation déjà débloquée !</p>
              <p style={{ fontSize: 13, color: C.textSub }}>Vous avez accès à tous les modules premium. Bonne formation !</p>
            </div>
            <button onClick={() => navigate('/learn')} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: C.green, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
              Continuer <ChevronRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </section>
      )}

      {/* ── Value comparison ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.goldLight, marginBottom: 10 }}>Comparez les alternatives</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28, color: C.text }}>15 000 FCFA — l'investissement le plus rentable que vous ferez</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {[
            { icon: '📉', label: 'Investir sans formation', price: '500 000+ FCFA', desc: 'Pertes moyennes évitables sur les 2 premières années', textColor: C.red, bg: C.redBg, borderColor: C.redBorder },
            { icon: '🎓', label: 'Cette formation', price: '15 000 FCFA', desc: 'Accès à vie, 13 modules, quiz inclus', textColor: C.gold, bg: C.goldBg, borderColor: C.goldBorder, highlight: true },
            { icon: '🏫', label: 'École de finance', price: '500 000+ FCFA', desc: 'Frais de scolarité par semestre, sans pratique BRVM', textColor: C.textSub, bg: C.bgSub, borderColor: C.border },
          ].map((item) => (
            <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.borderColor}`, borderRadius: 14, padding: '22px 18px', textAlign: 'center', position: 'relative' }}>
              {item.highlight && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: C.goldLight, color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 10, whiteSpace: 'nowrap' }}>MEILLEUR CHOIX</div>
              )}
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <p style={{ fontSize: 12, color: C.textSub, marginBottom: 6, fontWeight: 600 }}>{item.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: item.textColor, marginBottom: 8 }}>{item.price}</p>
              <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Module list ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.goldLight, marginBottom: 10 }}>Programme complet</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28, color: C.text }}>20 modules · du débutant à l'expert</h2>

        {/* Free */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div className="divider-line" />
            <span style={{ fontSize: 11, color: C.green, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 6, padding: '3px 10px', whiteSpace: 'nowrap' }}>✓ Inclus gratuitement</span>
            <div className="divider-line" />
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            {FREE_MODULES.map((m) => (
              <div key={m.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.bgSub, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.green, background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>{m.n}</span>
                <span style={{ fontSize: 13, color: C.textSub }}>{m.title}</span>
                <CheckCircle style={{ width: 14, height: 14, color: C.green, marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Premium */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 20 }}>
            <div className="divider-line" />
            <span style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 6, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
              <Crown style={{ width: 10, height: 10 }} /> Formation Complète — 15 000 FCFA
            </span>
            <div className="divider-line" />
          </div>
          <div style={{ display: 'grid', gap: 5 }}>
            {PREMIUM_MODULES.map((m) => (
              <div key={m.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#FFFBF0', borderRadius: 10, border: `1px solid rgba(201,168,76,.22)` }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>{m.n}</span>
                <div>
                  <p style={{ fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 1 }}>{m.title}</p>
                  <p style={{ fontSize: 11, color: C.textMuted }}>{m.sub}</p>
                </div>
                {isAlreadyUnlocked
                  ? <CheckCircle style={{ width: 14, height: 14, color: C.goldLight, marginLeft: 'auto', flexShrink: 0 }} />
                  : <Lock style={{ width: 13, height: 13, color: C.goldLight, marginLeft: 'auto', flexShrink: 0, opacity: 0.65 }} />
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.goldLight, marginBottom: 10 }}>Ce que vous obtenez</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28, color: C.text }}>Tout pour devenir autonome sur la BRVM</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
          {BENEFITS.map((b) => (
            <div key={b.title} style={{ background: C.bgSub, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ color: C.goldLight, marginBottom: 10 }}>{b.icon()}</div>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 5, color: C.text }}>{b.title}</p>
              <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.55 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Certification (add-on) ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <div style={{ background: '#FFFBF0', border: `1px solid rgba(201,168,76,.35)`, borderRadius: 18, padding: '28px 28px', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, background: `linear-gradient(135deg,${C.goldLight},#E8C86A)`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 24px rgba(201,168,76,.25)' }}>
            <Award style={{ width: 36, height: 36, color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.gold }}>Certificat AfriBourse</p>
              <span style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.red, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>NON INCLUS — option séparée</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: C.text }}>Validez vos compétences officiellement</h3>
            <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, marginBottom: 10 }}>
              Après avoir complété tous les modules et réussi les quiz, obtenez votre certificat numérique AfriBourse — partageable sur LinkedIn, WhatsApp, ou à imprimer.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 8, padding: '5px 12px' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>+ 15 000 FCFA</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>en option, après la formation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.goldLight, marginBottom: 10 }}>Ils ont fait le saut</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28, color: C.text }}>Ce que disent ceux qui ont appris</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{ background: C.bgSub, border: `1px solid ${C.border}`, borderRadius: 16, padding: '22px 20px' }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {[...Array(5)].map((_, i) => <Star key={i} style={{ width: 13, height: 13, color: C.goldLight, fill: C.goldLight }} />)}
              </div>
              <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.65, marginBottom: 16, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: C.textMuted }}>{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Countdown ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <div style={{ background: '#FFFBF0', border: `1px solid rgba(201,168,76,.3)`, borderRadius: 16, padding: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: C.gold, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="dot-live" style={{ width: 8, height: 8, borderRadius: '50%', background: C.goldLight, display: 'inline-block' }} />
            Offre de lancement — expire dans
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            {[{ v: pad(countdown.h), l: 'heures' }, { v: pad(countdown.m), l: 'minutes' }, { v: pad(countdown.s), l: 'secondes' }].map((c, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="shimmer" style={{ fontSize: 38, fontWeight: 900, color: C.gold, lineHeight: 1, fontVariantNumeric: 'tabular-nums', minWidth: 52 }}>{c.v}</div>
                <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{c.l}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 12 }}>Prix susceptible d'augmenter à 20 000 FCFA après cette période</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section ref={pricingRef} className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.goldLight, marginBottom: 10 }}>Choisissez votre accès</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28, color: C.text }}>Simple. Une fois. Pour toujours.</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 16 }}>
          {/* Free card */}
          <div style={{ background: C.bgSub, border: `1px solid ${C.border}`, borderRadius: 18, padding: '24px 22px' }}>
            <p style={{ fontSize: 12, color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Gratuit</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: C.text }}>0</span>
              <span style={{ color: C.textMuted, fontSize: 14 }}>FCFA</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['M0 à M6 accessibles', '7 modules · quiz inclus', 'Accès immédiat sans paiement'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textSub }}>
                  <CheckCircle style={{ width: 14, height: 14, color: C.green, flexShrink: 0 }} /> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/learn')} style={{ width: '100%', background: 'transparent', border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Continuer gratuitement
            </button>
          </div>

          {/* Premium card */}
          <div style={{ background: '#FFFBF0', border: `2px solid ${C.goldLight}`, borderRadius: 18, padding: '24px 22px', position: 'relative', boxShadow: '0 4px 24px rgba(201,168,76,.12)' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(90deg,${C.goldLight},#E8C86A)`, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 10, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
              RECOMMANDÉ
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Crown style={{ width: 15, height: 15, color: C.goldLight }} />
              <p style={{ fontSize: 12, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Formation Complète</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: C.gold }}>15 000</span>
              <span style={{ color: C.textMuted, fontSize: 14 }}>FCFA</span>
            </div>
            <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Paiement unique · accès à vie</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['M7 à M19 débloqués', '13 modules avancés + quiz', 'Mises à jour incluses à vie', 'Études de cas BRVM réels'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textSub }}>
                  <CheckCircle style={{ width: 14, height: 14, color: C.goldLight, flexShrink: 0 }} /> {f}
                </li>
              ))}
              <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.textMuted }}>
                <Award style={{ width: 14, height: 14, color: C.textMuted, flexShrink: 0 }} />
                <span>Certificat <span style={{ fontSize: 11, background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}`, borderRadius: 4, padding: '1px 5px', marginLeft: 3 }}>+15 000 FCFA option</span></span>
              </li>
            </ul>

            {!isLoggedIn ? (
              <button onClick={() => navigate('/login', { state: { from: '/formation' } })} className="cta-pulse" style={{ width: '100%', background: `linear-gradient(135deg,${C.goldLight},#E8C86A)`, color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                Se connecter pour payer
              </button>
            ) : isAlreadyUnlocked ? (
              <button onClick={() => navigate('/learn')} style={{ width: '100%', background: C.green, color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle style={{ width: 17, height: 17 }} /> Accéder aux modules
              </button>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: C.textSub, marginBottom: 12, textAlign: 'center', fontWeight: 600 }}>Choisissez votre opérateur</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {OPERATORS.map((op) => (
                    <button key={op.id} className="op-btn" onClick={() => { setSelectedOperator(op.id); analytics.trackAction('formation_operator_selected', op.label, { planId: PLAN_ID }); }} style={{ background: op.bg, border: 'none', borderRadius: 10, padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      <span style={{ fontSize: 18 }}>{op.emoji}</span> {op.label}
                    </button>
                  ))}
                </div>
                <p style={{ textAlign: 'center', fontSize: 11, color: C.textMuted, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Shield style={{ width: 11, height: 11 }} /> Paiement sécurisé via PawaPay
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bundle note */}
        <div style={{ background: C.bgSub, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOpen style={{ width: 18, height: 18, color: C.goldLight, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: C.textSub }}>M0–M6 restent toujours <strong>gratuits</strong>. Vous payez une fois pour débloquer M7–M19 en plus.</p>
        </div>
      </section>

      {/* ── Guarantee ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <div style={{ background: C.bgSub, border: `1px solid ${C.border}`, borderRadius: 18, padding: '28px 24px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 54, height: 54, background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield style={{ width: 24, height: 24, color: C.goldLight }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: C.text }}>Satisfait ou remboursé — 7 jours</h3>
            <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>
              Si la formation ne correspond pas à vos attentes dans les 7 jours suivant le paiement, contactez-nous à <span style={{ color: C.goldLight, fontWeight: 600 }}>support@africbourse.com</span> pour un remboursement complet. Sans conditions, sans questions.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.goldLight, marginBottom: 10 }}>Questions fréquentes</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28, color: C.text }}>Tout ce que vous voulez savoir</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ background: C.bgSub, border: `1px solid ${openFaq === i ? C.goldBorder : C.border}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.q}</span>
                <ChevronDown style={{ width: 16, height: 16, color: C.goldLight, flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }} />
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 20px 16px', fontSize: 13, color: C.textSub, lineHeight: 1.7 }}>{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{ background: '#FFFBF0', border: `1px solid rgba(201,168,76,.3)`, borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
          <Crown style={{ width: 34, height: 34, color: C.goldLight, margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, marginBottom: 12, color: C.text }}>
            Prenez votre avenir financier en main
          </h2>
          <p style={{ fontSize: 15, color: C.textSub, maxWidth: 460, margin: '0 auto 28px', lineHeight: 1.65 }}>
            15 000 FCFA. Une fois. Pour toujours. Des milliers d'investisseurs africains ont déjà commencé.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={scrollToPricing} className="cta-pulse" style={{ background: `linear-gradient(135deg,${C.goldLight},#E8C86A)`, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap style={{ width: 18, height: 18 }} /> Débloquer maintenant
            </button>
            <button onClick={() => navigate('/learn')} style={{ background: 'transparent', color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Voir les modules gratuits
            </button>
          </div>
          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Shield style={{ width: 12, height: 12 }} /> Satisfait ou remboursé 7 jours · Paiement sécurisé PawaPay
          </p>
        </div>
      </section>

      {/* ── Payment Modal ── */}
      {selectedOperator && (
        <PaymentModal
          isOpen={!!selectedOperator}
          onClose={() => setSelectedOperator(null)}
          onSuccess={handleSuccess}
          planId={PLAN_ID}
          planName={PLAN_NAME}
          amount={AMOUNT}
          currency="XOF"
          paymentMethod={selectedOperator}
        />
      )}
    </div>
  );
}
