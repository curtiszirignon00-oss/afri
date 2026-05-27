import { useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart2, RefreshCw, CheckCircle } from 'lucide-react';

// ── Data ─────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    number: 1,
    category: "L'horizon de temps",
    text: "Dans combien de temps avez-vous besoin de récupérer l'argent que vous allez investir ?",
    options: [
      { icon: '⚡', title: 'Moins de 2 ans', sub: "J'ai un projet à court terme (mariage, voiture, voyage) ou je ne suis pas sûr de ne pas en avoir besoin rapidement." },
      { icon: '🌱', title: '2 à 5 ans', sub: "J'ai un projet de moyen terme (achat immobilier, formation, création d'entreprise) et je peux me permettre d'attendre un peu." },
      { icon: '🌳', title: '5 à 10 ans', sub: "Je construis mon patrimoine progressivement. Je n'ai pas besoin de cet argent avant plusieurs années." },
      { icon: '🏔️', title: 'Plus de 10 ans', sub: "Je prépare ma retraite ou l'avenir de mes enfants. Le long terme est mon horizon naturel." },
    ],
  },
  {
    number: 2,
    category: 'La tolérance au risque',
    text: 'Vous investissez 500 000 FCFA. Trois mois plus tard, votre portefeuille affiche −15 % (−75 000 FCFA). Quelle est votre réaction spontanée ?',
    options: [
      { icon: '😰', title: 'Je vends immédiatement', sub: "Je ne supporte pas de voir mon argent fondre. Je préfère sortir et limiter les dégâts." },
      { icon: '😟', title: "Je suis inquiet mais j'attends", sub: "C'est stressant, mais je résiste à la tentation de vendre. J'espère que ça remonte." },
      { icon: '😊', title: "Je reste calme et j'analyse", sub: "Je vérifie si les fondamentaux ont changé. Si non, je tiens ma position sans panique." },
      { icon: '😎', title: "Je vois une opportunité d'acheter plus", sub: "Les bonnes actions à prix réduit, c'est exactement ce que je cherche. Je renforce ma position." },
    ],
  },
  {
    number: 3,
    category: "L'objectif principal",
    text: 'Quel est votre objectif principal en investissant sur la BRVM ?',
    options: [
      { icon: '🔒', title: "Protéger mon épargne de l'inflation", sub: "Je veux que mon argent ne perde pas de valeur avec le temps. La sécurité prime sur le rendement." },
      { icon: '💸', title: 'Recevoir des revenus réguliers', sub: "Je veux des dividendes qui complètent mes revenus ou que je réinvestis progressivement." },
      { icon: '📈', title: 'Faire croître mon capital', sub: "Je veux que mon argent travaille et grossisse sur le long terme, même si cela implique des fluctuations." },
      { icon: '🚀', title: 'Maximiser les gains, peu importe le risque', sub: "Je cherche la performance maximale. Je suis prêt à accepter de fortes variations pour des rendements élevés." },
    ],
  },
  {
    number: 4,
    category: 'Le capital disponible',
    text: "Quel capital initial pouvez-vous consacrer à votre portefeuille BRVM sans mettre en danger votre stabilité financière ?",
    options: [
      { icon: '🌱', title: 'Moins de 100 000 FCFA', sub: "Je commence petit. L'essentiel est de démarrer et de construire l'habitude d'investir." },
      { icon: '🌿', title: '100 000 à 500 000 FCFA', sub: "J'ai une épargne de départ solide qui me permet de commencer à diversifier." },
      { icon: '🌳', title: '500 000 à 2 000 000 FCFA', sub: "J'ai un capital significatif qui me permet de construire un portefeuille diversifié dès le départ." },
      { icon: '🏆', title: 'Plus de 2 000 000 FCFA', sub: "J'ai un capital important à faire fructifier avec une stratégie structurée." },
    ],
  },
  {
    number: 5,
    category: "La régularité d'épargne",
    text: "Pouvez-vous investir un montant fixe chaque mois en plus de votre capital initial ?",
    options: [
      { icon: '🚫', title: "Non, pas de capacité d'épargne mensuelle", sub: "Je vais uniquement gérer mon capital initial sans apports réguliers." },
      { icon: '🏹', title: 'Oui, moins de 25 000 FCFA par mois', sub: "Je peux épargner un petit montant régulier. Chaque FCFA compte sur le long terme." },
      { icon: '💰', title: 'Oui, entre 25 000 et 100 000 FCFA par mois', sub: "J'ai une capacité d'épargne régulière qui va accélérer la croissance de mon portefeuille." },
      { icon: '💎', title: 'Oui, plus de 100 000 FCFA par mois', sub: "Mon épargne mensuelle est un levier puissant pour construire un patrimoine significatif rapidement." },
    ],
  },
  {
    number: 6,
    category: "L'expérience financière",
    text: "Comment décririez-vous votre niveau d'expérience en investissement aujourd'hui ?",
    options: [
      { icon: '🐣', title: 'Débutant complet', sub: "Je n'ai jamais investi. J'apprends à lire les fiches valeur et je découvre comment fonctionne la BRVM." },
      { icon: '📊', title: 'Intermédiaire', sub: "J'ai quelques notions de base. J'ai peut-être déjà acheté une action ou suivi les marchés sans investir." },
      { icon: '💼', title: 'Confirmé', sub: "J'ai déjà un portefeuille ou une expérience concrète. Je cherche à structurer et améliorer ma méthode." },
    ],
  },
  {
    number: 7,
    category: 'La priorité absolue',
    text: "Si vous deviez choisir UNE seule priorité pour votre portefeuille BRVM, laquelle choisiriez-vous ?",
    options: [
      { icon: '🛡️', title: 'Sécurité maximale — ne pas perdre mon capital', sub: "Je veux dormir tranquille. La préservation du capital prime sur tout le reste." },
      { icon: '⚖️', title: 'Équilibre — croissance modérée avec risque maîtrisé', sub: "Je veux faire croître mon argent sans prendre de risques excessifs. Un bon compromis." },
      { icon: '🚀', title: 'Performance — maximiser le rendement sur le long terme', sub: "Je suis prêt à traverser des phases difficiles si le potentiel de gain est élevé." },
    ],
  },
];

type ProfileKey = 'prudent' | 'equilibre' | 'dynamique' | 'offensif';

interface AllocItem { label: string; pct: number; color: string }
interface RecoItem  { icon: string; head: string; body: string }

interface Profile {
  name: string;
  emoji: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  desc: string;
  horizon: string;
  risque: string;
  rendement: string;
  alloc: AllocItem[];
  recos: RecoItem[];
}

const PROFILES: Record<ProfileKey, Profile> = {
  prudent: {
    name: 'Investisseur Prudent',
    emoji: '🛡️',
    accentColor: '#185FA5',
    badgeBg: '#EFF6FF',
    badgeText: '#1D4ED8',
    desc: "Votre priorité est la préservation du capital. Vous privilégiez la sécurité sur le rendement et réagissez avec prudence face aux fluctuations du marché. Ce profil est solide et respectable — la régularité et la discipline sont vos meilleurs atouts.",
    horizon: "Court à moyen terme (2–5 ans recommandés)",
    risque: "Faible — vous préférez dormir tranquille",
    rendement: "4–7 % annuels visés",
    alloc: [
      { label: 'Obligations BRVM', pct: 50, color: '#185FA5' },
      { label: 'Blue Chips dividendes', pct: 35, color: '#00D4A8' },
      { label: 'Liquidités', pct: 15, color: '#CBD5E1' },
    ],
    recos: [
      { icon: '🏛️', head: "Commencer par les obligations d'État UEMOA", body: "Rendement de 5 à 7 %, risque très faible, remboursement garanti par les États membres. Votre ancre de portefeuille idéale." },
      { icon: '💰', head: "Ajouter des Blue Chips à dividendes réguliers", body: "SONATEL (dividende >20 ans consécutifs), SOLIBRA, ECOBANK CI. Des revenus stables qui compensent la volatilité de court terme." },
      { icon: '⏱️', head: "Ne jamais investir de l'argent dont vous pourriez avoir besoin", body: "Constituez votre fonds d'urgence (3–6 mois de dépenses) AVANT d'investir. La règle des 3 enveloppes est votre fondation." },
    ],
  },
  equilibre: {
    name: 'Investisseur Équilibré',
    emoji: '⚖️',
    accentColor: '#00D4A8',
    badgeBg: '#F0FDF4',
    badgeText: '#166534',
    desc: "Vous cherchez le meilleur rapport rendement/risque. Vous acceptez des fluctuations modérées si elles sont justifiées par un potentiel de gain réel. Ce profil est le plus courant parmi les investisseurs BRVM performants sur le long terme.",
    horizon: "Moyen à long terme (5–10 ans)",
    risque: "Modéré — vous analysez avant d'agir",
    rendement: "8–12 % annuels visés (dividendes + plus-values)",
    alloc: [
      { label: 'Actions croissance BRVM', pct: 45, color: '#00D4A8' },
      { label: 'Actions dividendes', pct: 30, color: '#185FA5' },
      { label: 'Obligations BRVM', pct: 15, color: '#C9A84C' },
      { label: 'Liquidités', pct: 10, color: '#CBD5E1' },
    ],
    recos: [
      { icon: '📈', head: 'Combiner croissance et revenus', body: "Un mix d'actions de croissance (secteur bancaire, télécoms) et d'actions à dividendes réguliers vous donne le meilleur des deux mondes." },
      { icon: '🔄', head: 'Appliquer le DCA mensuel systématiquement', body: "Investir un montant fixe chaque mois vous protège du risque de timing et construit votre patrimoine indépendamment des humeurs du marché." },
      { icon: '🎯', head: 'Rééquilibrer une fois par an', body: "Un rééquilibrage annuel maintient votre allocation cible et vous oblige à vendre ce qui est cher pour acheter ce qui est sous-valorisé — la discipline du professionnel." },
    ],
  },
  dynamique: {
    name: 'Investisseur Dynamique',
    emoji: '🚀',
    accentColor: '#C9A84C',
    badgeBg: '#FFFBEB',
    badgeText: '#92400E',
    desc: "Vous avez un appétit prononcé pour la performance. Vous acceptez la volatilité comme le prix à payer pour un rendement supérieur sur le long terme. Votre horizon long et votre sang-froid face aux baisses sont vos meilleurs atouts.",
    horizon: "Long terme (8–15 ans recommandés)",
    risque: "Élevé accepté — vous voyez les corrections comme des opportunités",
    rendement: "12–18 % annuels visés sur le long terme",
    alloc: [
      { label: 'Actions croissance BRVM', pct: 65, color: '#C9A84C' },
      { label: 'Actions dividendes (réinvestissement)', pct: 25, color: '#00D4A8' },
      { label: 'Liquidités (trésor de guerre)', pct: 10, color: '#CBD5E1' },
    ],
    recos: [
      { icon: '🔭', head: 'Cibler les secteurs à forte croissance UEMOA', body: "Banques (inclusion financière), télécoms (digitalisation), distribution (classe moyenne). Ces secteurs portent la croissance économique de la zone sur 10–15 ans." },
      { icon: '🔬', head: "Maîtriser l'analyse fondamentale", body: "À ce niveau de prise de risque, vous devez savoir analyser un bilan, calculer un DCF et identifier des valeurs sous-évaluées. Les modules M7 à M10 sont essentiels." },
      { icon: '♻️', head: '100 % des dividendes réinvestis', body: "En phase d'accumulation, chaque dividende réinvesti active l'effet boule de neige. Sur 15 ans avec réinvestissement, votre capital peut être multiplié par 4 à 6." },
    ],
  },
  offensif: {
    name: 'Investisseur Offensif',
    emoji: '⚡',
    accentColor: '#DC2626',
    badgeBg: '#FEF2F2',
    badgeText: '#991B1B',
    desc: "Vous cherchez la performance maximale et acceptez une volatilité importante. Votre horizon très long et votre tolérance au risque élevée vous positionnent comme un investisseur de conviction. Attention : ce profil demande une discipline de fer et une méthode rigoureuse.",
    horizon: "Très long terme (10 ans minimum)",
    risque: "Très élevé — vous pouvez perdre temporairement 30–40 %",
    rendement: "15–25 % annuels visés (avec années négatives possibles)",
    alloc: [
      { label: 'Actions conviction (5–8 titres max)', pct: 75, color: '#DC2626' },
      { label: 'Opportunités sectorielles', pct: 15, color: '#C9A84C' },
      { label: 'Liquidités (munitions)', pct: 10, color: '#CBD5E1' },
    ],
    recos: [
      { icon: '🧠', head: 'La méthode avant tout', body: "Un profil offensif sans méthode rigoureuse finit en catastrophe. Vous devez maîtriser l'analyse fondamentale complète (M7–M10) avant de prendre des positions concentrées." },
      { icon: '🛡️', head: "Gérer le risque malgré l'appétit de performance", body: "Même avec un profil offensif, les règles de position sizing sont non-négociables. La concentration n'exclut pas la discipline sur la taille des positions." },
      { icon: '👁️', head: 'Surveiller le marché macro UEMOA', body: "Un investisseur offensif doit comprendre les cycles économiques, les décisions de la BCEAO et les flux de capitaux régionaux. Le module macro est stratégique pour vous." },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcProfile(answers: Record<number, number>): ProfileKey {
  const score = (answers[0] ?? 0) + (answers[1] ?? 0) + (answers[2] ?? 0) + (answers[6] ?? 0);
  if (score <= 3)  return 'prudent';
  if (score <= 6)  return 'equilibre';
  if (score <= 9)  return 'dynamique';
  return 'offensif';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { onComplete?: () => void }

export default function InvestorProfileQuiz({ onComplete }: Props) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [done, setDone]       = useState(false);
  const [validated, setValidated] = useState(false);

  const total    = QUESTIONS.length;
  const question = QUESTIONS[step];
  const pct      = Math.round(((step) / total) * 100);

  function select(val: number) {
    setAnswers(prev => ({ ...prev, [step]: val }));
  }

  function goNext() {
    if (answers[step] === undefined) return;
    if (step === total - 1) { setDone(true); return; }
    setStep(s => s + 1);
  }

  function goPrev() { setStep(s => Math.max(0, s - 1)); }

  function restart() {
    setStep(0);
    setAnswers({});
    setDone(false);
    setValidated(false);
  }

  function handleValidate() {
    setValidated(true);
    onComplete?.();
  }

  // ── Result ───────────────────────────────────────────────────────────────
  if (done) {
    const profileKey = calcProfile(answers);
    const P = PROFILES[profileKey];
    const horizon  = answers[0];
    const capital  = answers[3];
    const dca      = answers[4];

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
               style={{ background: P.badgeBg }}>{P.emoji}</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Votre profil investisseur</p>
            <h3 className="text-lg font-bold text-slate-900">{P.name}</h3>
          </div>
        </div>

        {/* Profile card */}
        <div className="rounded-xl border border-slate-200 p-5 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: P.badgeBg, color: P.badgeText }}>
            {P.emoji} {P.name}
          </span>
          <p className="text-sm text-slate-600 leading-relaxed">{P.desc}</p>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Horizon recommandé', val: P.horizon },
              { label: 'Niveau de risque', val: P.risque },
              { label: 'Objectif de rendement', val: P.rendement },
            ].map(m => (
              <div key={m.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">{m.label}</p>
                <p className="text-xs font-medium text-slate-800 leading-snug">{m.val}</p>
              </div>
            ))}
          </div>

          {/* Allocation bar */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Allocation recommandée
            </p>
            <div className="h-4 rounded-full overflow-hidden flex">
              {P.alloc.map(a => (
                <div key={a.label} style={{ width: `${a.pct}%`, background: a.color }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
              {P.alloc.map(a => (
                <span key={a.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: a.color }} />
                  {a.label} {a.pct}%
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Recommandations pour votre profil
          </p>
          {P.recos.map(r => (
            <div key={r.head} className="flex gap-3 border border-slate-200 rounded-xl p-4">
              <span className="text-xl flex-shrink-0">{r.icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-0.5">{r.head}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Warnings */}
        {horizon === 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
            <strong>Attention horizon court :</strong> Vous avez indiqué avoir besoin de votre argent dans moins de 2 ans.
            La bourse n'est pas adaptée à cet horizon. Renforcez d'abord votre fonds d'urgence et considérez
            les Bons du Trésor UEMOA pour cet argent.
          </div>
        )}
        {capital === 0 && dca === 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
            <strong>Capital de départ faible :</strong> Avec moins de 100 000 FCFA et sans DCA mensuel, commencez
            par le simulateur AfriBourse pour vous entraîner le temps de constituer votre enveloppe d'investissement.
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-xl p-5 text-center space-y-3">
          {validated ? (
            <div className="flex items-center justify-center gap-2 text-[#00D4A8] font-semibold">
              <CheckCircle className="w-5 h-5" />
              <span>Module validé ! Vous pouvez passer au module suivant.</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-700 leading-relaxed">
                Votre profil <strong>{P.name}</strong> est identifié. Validez le module pour débloquer la suite
                de votre parcours d'investisseur.
              </p>
              <button
                onClick={handleValidate}
                className="inline-flex items-center gap-2 bg-[#00D4A8] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#00bfa0] transition-colors shadow-md"
              >
                <CheckCircle className="w-4 h-4" />
                Valider le module et continuer →
              </button>
            </>
          )}
          <button
            onClick={restart}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            Refaire le test
          </button>
        </div>
      </div>
    );
  }

  // ── Questions ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Question {step + 1} sur {total}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#00D4A8] rounded-full transition-all duration-300"
               style={{ width: `${pct + 100 / total}%` }} />
        </div>
      </div>

      {/* Question */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
          {question.category}
        </p>
        <p className="text-base font-medium text-slate-900 leading-snug">{question.text}</p>
      </div>

      {/* Options */}
      <div className="grid gap-2.5">
        {question.options.map((opt, i) => {
          const selected = answers[step] === i;
          return (
            <button
              key={i}
              onClick={() => select(i)}
              className={`w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-all ${
                selected
                  ? 'border-[#00D4A8] bg-[#00D4A8]/8 ring-1 ring-[#00D4A8]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{opt.icon}</span>
              <span className="flex-1">
                <span className={`block text-sm font-medium leading-snug ${selected ? 'text-[#00894F]' : 'text-slate-800'}`}>
                  {opt.title}
                </span>
                <span className="block text-xs text-slate-400 mt-0.5 leading-relaxed">{opt.sub}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-1">
        {step > 0 ? (
          <button
            onClick={goPrev}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-4 py-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>
        ) : <div />}

        {step < total - 1 ? (
          <button
            onClick={goNext}
            disabled={answers[step] === undefined}
            className={`flex items-center gap-1.5 text-sm font-medium px-5 py-2 rounded-lg transition-all ${
              answers[step] !== undefined
                ? 'bg-slate-900 text-white hover:bg-slate-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={answers[step] === undefined}
            className={`flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-lg transition-all ${
              answers[step] !== undefined
                ? 'bg-[#00D4A8] text-white hover:bg-[#00bfa0]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Voir mon profil
          </button>
        )}
      </div>
    </div>
  );
}
