import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Crown, CheckCircle, Lock, Shield,
  ChevronDown, ChevronRight, Star, Zap, BookOpen,
  Brain, BarChart3, TrendingUp, Award, Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PaymentModal from '../components/payment/PaymentModal';

const PLAN_ID = 'premium-modules';
const PLAN_NAME = 'Formation Complète';
const AMOUNT = '15000';
const COUNTDOWN_KEY = 'formation_countdown_end';
const COUNTDOWN_DURATION = 23 * 60 * 60 + 47 * 60 + 13; // seconds

const OPERATORS = [
  { id: 'wave',         label: 'Wave',            emoji: '🌊', bg: '#1A7BE5' },
  { id: 'orange-money', label: 'Orange Money',     emoji: '🟠', bg: '#E55A00' },
  { id: 'mtn-momo',    label: 'MTN MoMo',         emoji: '🟡', bg: '#D4A200' },
  { id: 'moov-money',  label: 'Moov Money',       emoji: '🟢', bg: '#007A5E' },
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
  { n: 'M15', title: 'Stratégie d\'Investissement Intégrée', sub: 'Construire votre approche personnelle' },
  { n: 'M16', title: 'Préparation & Infrastructure', sub: 'Outils, plateformes, workflow professionnel' },
  { n: 'M17', title: 'Psychologie Avancée du Trading', sub: 'Discipline, routine, gestion des émotions' },
  { n: 'M18', title: 'Portefeuille Modèle BRVM', sub: 'Étude de cas avec allocation réelle' },
  { n: 'M19', title: 'Certification & Plan d\'Action', sub: 'Valider et déployer vos compétences' },
];

const BENEFITS = [
  { icon: <Brain className="w-6 h-6" />, title: '13 modules avancés', desc: 'Du fondamental au technique, en passant par la psychologie' },
  { icon: <CheckCircle className="w-6 h-6" />, title: 'Quiz inclus', desc: 'Validez vos connaissances après chaque module' },
  { icon: <Award className="w-6 h-6" />, title: 'Certificat AfriBourse', desc: 'Attestation numérique à partager sur LinkedIn' },
  { icon: <Clock className="w-6 h-6" />, title: 'Accès à vie', desc: 'Paiement unique, sans abonnement, sans expiration' },
  { icon: <BarChart3 className="w-6 h-6" />, title: 'Études de cas BRVM', desc: 'Exemples réels tirés des marchés d\'Afrique de l\'Ouest' },
  { icon: <Shield className="w-6 h-6" />, title: 'Mises à jour incluses', desc: 'Contenu mis à jour quand les marchés évoluent' },
];

const TESTIMONIALS = [
  {
    text: "Avant cette formation, je regardais les cours sans comprendre pourquoi ils bougeaient. Maintenant je sais lire un bilan, analyser un secteur et surtout — ne pas paniquer. C'est transformateur.",
    initials: 'KD', name: 'Kofi Danso', title: 'Investisseur particulier, Accra', color: '#C9A84C',
  },
  {
    text: 'Le module sur la psychologie des biais m\'a sauvé de plusieurs mauvaises décisions. J\'aurais payé 10x le prix pour ça. La clarté des explications sur la BRVM spécifiquement, c\'est introuvable ailleurs.',
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
    q: 'Quand mon accès est-il activé ?',
    a: 'Dès que votre paiement mobile money est confirmé — généralement en moins de 2 minutes. Les modules s\'affichent immédiatement dans votre espace d\'apprentissage.',
  },
  {
    q: 'Quels opérateurs sont acceptés ?',
    a: 'Wave, Orange Money, MTN Mobile Money et Moov Money. Disponibles dans tous les pays UEMOA (Sénégal, Côte d\'Ivoire, Burkina Faso, Mali, Niger, Bénin, Togo, Guinée-Bissau).',
  },
  {
    q: 'Que se passe-t-il si mon paiement échoue ?',
    a: "Aucun montant n'est prélevé en cas d'échec. Vérifiez votre solde et réessayez. Si le problème persiste, contactez-nous à support@africbourse.com.",
  },
  {
    q: 'Puis-je accéder aux modules sur mobile ?',
    a: 'Oui, la plateforme est entièrement responsive. Apprenez depuis votre téléphone, tablette ou ordinateur, à votre rythme, n\'importe où.',
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

export default function FormationPremiumPage() {
  const navigate = useNavigate();
  const { userProfile, isLoggedIn } = useAuth();
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [countdown, setCountdown] = useState({ h: 23, m: 47, s: 13 });
  const pricingRef = useRef<HTMLDivElement>(null);

  const userTier = userProfile?.subscriptionTier ?? '';
  const isAlreadyUnlocked = ['premium', 'max', 'pro', 'formation'].includes(userTier);

  // Countdown — persisted in sessionStorage so it doesn't reset on scroll
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

  // Scroll-reveal with IntersectionObserver
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.transform = 'translateY(0)'; } });
    }, { threshold: 0.12 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleSuccess = () => { setTimeout(() => navigate('/learn'), 2500); };
  const scrollToPricing = () => { pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div style={{ background: '#0A0C10', color: '#E8EAF0', fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' }}>
      <style>{`
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .ticker-track { display:flex; animation: ticker 28s linear infinite; width:max-content; }
        .ticker-track:hover { animation-play-state:paused; }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.7} }
        .shimmer { animation: shimmer 2s ease-in-out infinite; }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,.4)} 50%{box-shadow:0 0 0 10px rgba(201,168,76,0)} }
        .cta-pulse { animation: pulse-glow 2.4s ease-in-out infinite; }
        @keyframes dot-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
        .dot-live { animation: dot-pulse 1.4s ease-in-out infinite; }
        .reveal { opacity:0; transform:translateY(28px); transition:opacity .6s ease,transform .6s ease; }
        .op-btn:hover { filter:brightness(1.12); transform:translateY(-1px); }
        .op-btn { transition:all .18s ease; }
        .faq-item summary::-webkit-details-marker { display:none; }
      `}</style>

      {/* ── Sticky progress banner ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'linear-gradient(90deg,#1A1200,#2A1E00,#1A1200)', borderBottom: '1px solid rgba(201,168,76,.25)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Crown style={{ width: 16, height: 16, color: '#C9A84C' }} />
          <span style={{ fontSize: 13, color: '#C9A84C', fontWeight: 600 }}>Formation Complète — 15 000 FCFA · Accès à vie</span>
        </div>
        <button onClick={scrollToPricing} style={{ background: '#C9A84C', color: '#0A0C10', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Débloquer →
        </button>
      </div>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px 0' }}>
        <button onClick={() => navigate('/learn')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8892A4', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 28 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} /> Retour à l'académie
        </button>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <Crown style={{ width: 13, height: 13, color: '#C9A84C' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Accès à vie · Paiement unique</span>
        </div>

        <h1 style={{ fontSize: 'clamp(26px,5vw,44px)', fontWeight: 800, lineHeight: 1.18, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Devenez un investisseur<br />
          <span style={{ color: '#C9A84C' }}>qui comprend vraiment</span> ce qu'il fait
        </h1>

        <p style={{ fontSize: 17, color: '#8892A4', lineHeight: 1.65, marginBottom: 28, maxWidth: 580 }}>
          13 modules avancés conçus pour les marchés africains. Analyse fondamentale, technique, gestion du risque, psychologie — tout ce que les 7 modules gratuits ne couvrent pas.
        </p>

        {/* Danger box */}
        <div style={{ background: 'rgba(220,60,60,.08)', border: '1px solid rgba(220,60,60,.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, color: '#F87171', fontSize: 14, marginBottom: 4 }}>Ce que coûte vraiment de ne pas savoir</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>
              Un investisseur non formé perd en moyenne 30–50% de son capital lors des 2 premières années. 15 000 FCFA de formation vs des dizaines de milliers perdus par ignorance — le calcul est simple.
            </p>
          </div>
        </div>

        {/* Social proof ticker */}
        <div style={{ background: '#12161E', border: '1px solid #1C2230', borderRadius: 10, padding: '10px 0', overflow: 'hidden', marginBottom: 32 }}>
          <div className="ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 28px', whiteSpace: 'nowrap', borderRight: '1px solid #1C2230' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${i * 37 % 360},55%,42%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {item.initials}
                </div>
                <span style={{ fontSize: 12, color: '#CBD5E1' }}>
                  <strong style={{ color: '#E2E8F0' }}>{item.name}</strong> ({item.city}) a débloqué la formation · <span style={{ color: '#64748B' }}>{item.time}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA hero */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
          <button onClick={scrollToPricing} className="cta-pulse" style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C86A)', color: '#0A0C10', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap style={{ width: 18, height: 18 }} /> Débloquer pour 15 000 FCFA
          </button>
          <button onClick={() => navigate('/learn')} style={{ background: 'transparent', color: '#8892A4', border: '1px solid #1C2230', borderRadius: 12, padding: '14px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Voir les modules gratuits
          </button>
        </div>
      </section>

      {/* ── Already unlocked banner ── */}
      {isAlreadyUnlocked && (
        <section style={{ maxWidth: 760, margin: '0 auto 32px', padding: '0 20px' }}>
          <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, background: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle style={{ width: 22, height: 22, color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: '#4ADE80', marginBottom: 2 }}>Formation déjà débloquée !</p>
              <p style={{ fontSize: 13, color: '#86EFAC' }}>Vous avez accès à tous les modules premium. Bonne formation !</p>
            </div>
            <button onClick={() => navigate('/learn')} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
              Continuer <ChevronRight style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </section>
      )}

      {/* ── Anchor / Value comparison ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 12 }}>Comparez les alternatives</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28 }}>15 000 FCFA — l'investissement le plus rentable que vous ferez</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {[
            { icon: '📉', label: 'Investir sans formation', price: '50 000+ FCFA', desc: 'Pertes moyennes sur les 2 premières années', color: '#EF4444', bg: 'rgba(239,68,68,.06)' },
            { icon: '🎓', label: 'Cette formation', price: '15 000 FCFA', desc: 'Accès à vie, 13 modules, quiz, certificat', color: '#C9A84C', bg: 'rgba(201,168,76,.08)', highlight: true },
            { icon: '🏫', label: 'École de finance', price: '500 000+ FCFA', desc: 'Frais de scolarité par semestre, sans pratique BRVM', color: '#8892A4', bg: 'rgba(255,255,255,.03)' },
          ].map((item) => (
            <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.highlight ? 'rgba(201,168,76,.4)' : '#1C2230'}`, borderRadius: 14, padding: '20px 18px', textAlign: 'center', position: 'relative' }}>
              {item.highlight && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#C9A84C', color: '#0A0C10', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 10, whiteSpace: 'nowrap' }}>MEILLEUR CHOIX</div>
              )}
              <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
              <p style={{ fontSize: 12, color: '#8892A4', marginBottom: 6 }}>{item.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: item.color, marginBottom: 8 }}>{item.price}</p>
              <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Module list ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 12 }}>Programme complet</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28 }}>20 modules · du débutant à l'expert</h2>

        {/* Free modules */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: '#1C2230' }} />
            <span style={{ fontSize: 11, color: '#4ADE80', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 6, padding: '3px 10px' }}>✓ Inclus gratuitement</span>
            <div style={{ flex: 1, height: 1, background: '#1C2230' }} />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {FREE_MODULES.map((m) => (
              <div key={m.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#12161E', borderRadius: 10, border: '1px solid #1C2230', opacity: 0.75 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4ADE80', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>{m.n}</span>
                <span style={{ fontSize: 13, color: '#CBD5E1' }}>{m.title}</span>
                <CheckCircle style={{ width: 14, height: 14, color: '#4ADE80', marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Premium modules */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#1C2230' }} />
            <span style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.35)', borderRadius: 6, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Crown style={{ width: 10, height: 10 }} /> Formation Complète — 15 000 FCFA
            </span>
            <div style={{ flex: 1, height: 1, background: '#1C2230' }} />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {PREMIUM_MODULES.map((m) => (
              <div key={m.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#12161E', borderRadius: 10, border: '1px solid rgba(201,168,76,.2)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#C9A84C', background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>{m.n}</span>
                <div>
                  <p style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600, marginBottom: 1 }}>{m.title}</p>
                  <p style={{ fontSize: 11, color: '#64748B' }}>{m.sub}</p>
                </div>
                {isAlreadyUnlocked
                  ? <CheckCircle style={{ width: 14, height: 14, color: '#C9A84C', marginLeft: 'auto', flexShrink: 0 }} />
                  : <Lock style={{ width: 13, height: 13, color: '#C9A84C', marginLeft: 'auto', flexShrink: 0, opacity: 0.7 }} />
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 12 }}>Ce que vous obtenez</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28 }}>Tout pour devenir autonome sur la BRVM</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
          {BENEFITS.map((b) => (
            <div key={b.title} style={{ background: '#12161E', border: '1px solid #1C2230', borderRadius: 14, padding: '20px 18px' }}>
              <div style={{ color: '#C9A84C', marginBottom: 10 }}>{b.icon}</div>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 5, color: '#E2E8F0' }}>{b.title}</p>
              <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Certification ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <div style={{ background: 'linear-gradient(135deg,#12161E,#1C2230)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 18, padding: '32px 28px', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#C9A84C,#E8C86A)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 32px rgba(201,168,76,.3)' }}>
            <Award style={{ width: 40, height: 40, color: '#0A0C10' }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 6 }}>Certificat AfriBourse</p>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Validez vos compétences officiellement</h3>
            <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.6 }}>
              Après avoir complété tous les modules et réussi les quiz, recevez votre certificat numérique personnel. Partagez-le sur LinkedIn, WhatsApp, ou imprimez-le.
            </p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 12 }}>Ils ont fait le saut</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28 }}>Ce que disent ceux qui ont appris</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{ background: '#12161E', border: '1px solid #1C2230', borderRadius: 16, padding: '22px 20px' }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                {[...Array(5)].map((_, i) => <Star key={i} style={{ width: 13, height: 13, color: '#C9A84C', fill: '#C9A84C' }} />)}
              </div>
              <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.65, marginBottom: 18, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.initials}</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#E2E8F0' }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: '#64748B' }}>{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Urgency countdown ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 16, padding: '24px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#C9A84C', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="dot-live" style={{ width: 8, height: 8, borderRadius: '50%', background: '#C9A84C', display: 'inline-block' }} />
            Offre de lancement — expire dans
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            {[
              { v: pad(countdown.h), l: 'heures' },
              { v: pad(countdown.m), l: 'minutes' },
              { v: pad(countdown.s), l: 'secondes' },
            ].map((c, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="shimmer" style={{ fontSize: 36, fontWeight: 900, color: '#C9A84C', lineHeight: 1, fontVariantNumeric: 'tabular-nums', minWidth: 52 }}>{c.v}</div>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{c.l}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#64748B', marginTop: 12 }}>Prix susceptible d'augmenter à 20 000 FCFA après cette période</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section ref={pricingRef} className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 12 }}>Choisissez votre accès</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28 }}>Simple. Une fois. Pour toujours.</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 20 }}>
          {/* Free card */}
          <div style={{ background: '#12161E', border: '1px solid #1C2230', borderRadius: 18, padding: '24px 22px' }}>
            <p style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Gratuit</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 900 }}>0</span>
              <span style={{ color: '#64748B', fontSize: 14 }}>FCFA</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['M0 à M6 accessibles', '7 modules · quiz inclus', 'Accès immédiat sans paiement'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8892A4' }}>
                  <CheckCircle style={{ width: 14, height: 14, color: '#4ADE80', flexShrink: 0 }} /> {f}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/learn')} style={{ width: '100%', background: 'transparent', border: '1px solid #1C2230', color: '#8892A4', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Continuer gratuitement
            </button>
          </div>

          {/* Premium card */}
          <div style={{ background: 'linear-gradient(160deg,#1A1600,#1C1A00,#121000)', border: '2px solid rgba(201,168,76,.5)', borderRadius: 18, padding: '24px 22px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#C9A84C,#E8C86A)', color: '#0A0C10', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 10, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
              RECOMMANDÉ
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Crown style={{ width: 16, height: 16, color: '#C9A84C' }} />
              <p style={{ fontSize: 12, color: '#C9A84C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Formation Complète</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#C9A84C' }}>15 000</span>
              <span style={{ color: '#8892A4', fontSize: 14 }}>FCFA</span>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Paiement unique · accès à vie</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['M7 à M19 débloqués', '13 modules avancés + quiz', 'Certificat numérique', 'Mises à jour incluses à vie', 'Études de cas BRVM réels'].map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#CBD5E1' }}>
                  <CheckCircle style={{ width: 14, height: 14, color: '#C9A84C', flexShrink: 0 }} /> {f}
                </li>
              ))}
            </ul>

            {!isLoggedIn ? (
              <button onClick={() => navigate('/login', { state: { from: '/formation' } })} className="cta-pulse" style={{ width: '100%', background: 'linear-gradient(135deg,#C9A84C,#E8C86A)', color: '#0A0C10', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                Se connecter pour payer
              </button>
            ) : isAlreadyUnlocked ? (
              <button onClick={() => navigate('/learn')} style={{ width: '100%', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle style={{ width: 17, height: 17 }} /> Accéder aux modules
              </button>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: '#8892A4', marginBottom: 12, textAlign: 'center' }}>Choisissez votre opérateur</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {OPERATORS.map((op) => (
                    <button key={op.id} className="op-btn" onClick={() => setSelectedOperator(op.id)} style={{ background: op.bg, border: 'none', borderRadius: 10, padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      <span style={{ fontSize: 18 }}>{op.emoji}</span> {op.label}
                    </button>
                  ))}
                </div>
                <p style={{ textAlign: 'center', fontSize: 11, color: '#64748B', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <Shield style={{ width: 11, height: 11 }} /> Paiement sécurisé via PawaPay
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bundle box */}
        <div style={{ background: '#12161E', border: '1px solid rgba(201,168,76,.2)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <BookOpen style={{ width: 20, height: 20, color: '#C9A84C', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#E2E8F0', marginBottom: 2 }}>Accès complet dès M0</p>
            <p style={{ fontSize: 12, color: '#64748B' }}>M0–M6 restent toujours gratuits. Vous payez une fois pour débloquer M7–M19 en plus.</p>
          </div>
        </div>
      </section>

      {/* ── Guarantee ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <div style={{ background: '#12161E', border: '1px solid #1C2230', borderRadius: 18, padding: '28px 24px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield style={{ width: 26, height: 26, color: '#C9A84C' }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#E2E8F0' }}>Satisfait ou remboursé — 7 jours</h3>
            <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.65 }}>
              Si vous estimez que la formation ne correspond pas à vos attentes dans les 7 jours suivant le paiement, contactez-nous à <span style={{ color: '#C9A84C' }}>support@africbourse.com</span> pour un remboursement complet. Sans conditions, sans questions.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 56px', padding: '0 20px' }}>
        <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 12 }}>Questions fréquentes</p>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 800, marginBottom: 28 }}>Tout ce que vous voulez savoir</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ background: '#12161E', border: `1px solid ${openFaq === i ? 'rgba(201,168,76,.35)' : '#1C2230'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{item.q}</span>
                <ChevronDown style={{ width: 16, height: 16, color: '#C9A84C', flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s' }} />
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#8892A4', lineHeight: 1.7 }}>{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="reveal" style={{ maxWidth: 760, margin: '0 auto 80px', padding: '0 20px' }}>
        <div style={{ background: 'linear-gradient(135deg,#1A1600,#12161E)', border: '1px solid rgba(201,168,76,.3)', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
          <Crown style={{ width: 36, height: 36, color: '#C9A84C', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, marginBottom: 12 }}>
            Prenez votre avenir financier en main
          </h2>
          <p style={{ fontSize: 15, color: '#8892A4', marginBottom: 28, maxWidth: 460, margin: '0 auto 28px' }}>
            15 000 FCFA. Une fois. Pour toujours. Des milliers d'investisseurs africains ont déjà commencé.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={scrollToPricing} className="cta-pulse" style={{ background: 'linear-gradient(135deg,#C9A84C,#E8C86A)', color: '#0A0C10', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap style={{ width: 18, height: 18 }} /> Débloquer maintenant
            </button>
            <button onClick={() => navigate('/learn')} style={{ background: 'transparent', color: '#8892A4', border: '1px solid #1C2230', borderRadius: 12, padding: '14px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Voir les modules gratuits
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#4B5563', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
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
