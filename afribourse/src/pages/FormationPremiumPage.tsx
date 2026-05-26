import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Crown, CheckCircle, Lock, Unlock,
  BookOpen, Brain, BarChart3, TrendingUp, Shield,
  Infinity, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PaymentModal from '../components/payment/PaymentModal';

const PLAN_ID = 'premium-modules';
const PLAN_NAME = 'Formation Complète';
const AMOUNT = '15000';

const OPERATORS = [
  { id: 'wave',         label: 'Wave',            color: 'from-blue-500 to-blue-600',   emoji: '🌊' },
  { id: 'orange-money', label: 'Orange Money',     color: 'from-orange-500 to-orange-600', emoji: '🟠' },
  { id: 'mtn-momo',    label: 'MTN Mobile Money', color: 'from-yellow-500 to-yellow-600', emoji: '🟡' },
  { id: 'moov-money',  label: 'Moov Money',       color: 'from-teal-500 to-teal-600',   emoji: '🟢' },
];

const MODULES = [
  { n: 7,  title: 'Psychologie & Biais – Le Mental du Gagnant' },
  { n: 8,  title: 'Analyse Fondamentale – Devenir un Analyste Éclairé' },
  { n: 9,  title: "L'Évaluation d'Entreprise – Projeter l'Avenir" },
  { n: 10, title: "L'Analyse Extra-Financière – Comprendre le Contexte" },
  { n: 11, title: "L'Art du Timing – Analyse Technique & Graphiques" },
  { n: 12, title: 'Maîtrise du Risque & Gestion de Portefeuille' },
  { n: 13, title: "L'Art de l'Architecte – Gestion Avancée du Risque" },
  { n: 14, title: 'Outils, Actualités & Fiscalité' },
  { n: 15, title: 'Contexte Économique – Sentir le Pouls du Marché' },
  { n: 16, title: 'La Stratégie d\'Investissement Intégrée' },
  { n: 17, title: 'Préparation & Infrastructure Financière' },
];

export default function FormationPremiumPage() {
  const navigate = useNavigate();
  const { userProfile, isLoggedIn } = useAuth();
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);

  const userTier = userProfile?.subscriptionTier ?? '';
  const isAlreadyUnlocked = ['premium', 'max', 'pro', 'formation'].includes(userTier);

  const handleSuccess = () => {
    setTimeout(() => navigate('/learn'), 2500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-16 sm:px-6">
          <button
            onClick={() => navigate('/learn')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'académie
          </button>

          <div className="flex items-center gap-2 mb-4">
            <span className="bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Accès à vie
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Formation Complète — Modules Avancés
          </h1>
          <p className="text-orange-100 text-lg max-w-2xl mb-8">
            Débloquez les modules M7 à M17 en une seule fois. Paiement unique, accès permanent, quiz inclus.
          </p>

          <div className="inline-flex items-baseline gap-2 bg-white/15 border border-white/25 rounded-2xl px-6 py-4">
            <span className="text-4xl font-extrabold">15 000</span>
            <span className="text-xl font-semibold text-white/80">FCFA</span>
            <span className="text-white/60 text-sm ml-1 flex items-center gap-1">
              <Infinity className="w-4 h-4" />
              accès à vie
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 pb-20">
        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Déjà débloqué */}
          {isAlreadyUnlocked && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 px-6 py-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Unlock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-green-800">Modules déjà débloqués !</p>
                <p className="text-green-700 text-sm">Vous avez accès à tous les modules premium.</p>
              </div>
              <button
                onClick={() => navigate('/learn')}
                className="ml-auto flex items-center gap-1.5 bg-green-600 text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-green-700 transition-colors"
              >
                Accéder <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Ce qui est inclus */}
          <div className="px-6 py-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              Ce que vous débloquez
            </h2>

            <div className="grid sm:grid-cols-2 gap-2">
              {MODULES.map((m) => (
                <div key={m.n} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {m.n}
                  </div>
                  <p className="text-sm text-gray-800 font-medium leading-snug">{m.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Avantages */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Brain className="w-5 h-5" />, label: 'Quiz inclus', sub: 'Pour chaque module' },
                { icon: <Infinity className="w-5 h-5" />, label: 'Accès à vie', sub: 'Paiement unique' },
                { icon: <BarChart3 className="w-5 h-5" />, label: '11 modules', sub: 'M7 → M17' },
                { icon: <Shield className="w-5 h-5" />, label: 'Sécurisé', sub: 'Via PawaPay' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                  <div className="text-amber-500 mb-1">{item.icon}</div>
                  <p className="text-xs font-bold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section paiement */}
          <div className="px-6 py-6">
            {!isLoggedIn ? (
              <div className="text-center py-4">
                <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-700 font-semibold mb-1">Connectez-vous pour payer</p>
                <p className="text-gray-500 text-sm mb-4">Un compte est requis pour activer votre accès.</p>
                <button
                  onClick={() => navigate('/login', { state: { from: '/formation' } })}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Se connecter
                </button>
              </div>
            ) : isAlreadyUnlocked ? null : (
              <div>
                <h2 className="font-bold text-gray-900 text-lg mb-1">Choisissez votre mode de paiement</h2>
                <p className="text-gray-500 text-sm mb-5">Mobile money disponible dans 10 pays d'Afrique de l'Ouest.</p>

                <div className="grid grid-cols-2 gap-3">
                  {OPERATORS.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => setSelectedOperator(op.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 border-transparent bg-gradient-to-r ${op.color} text-white font-semibold hover:opacity-90 active:scale-98 transition-all shadow-md`}
                    >
                      <span className="text-2xl">{op.emoji}</span>
                      <span className="text-sm leading-tight">{op.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  Paiement sécurisé via PawaPay · Vos données sont chiffrées
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section FAQ */}
        <div className="mt-8">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Questions fréquentes</h2>
          <div className="space-y-3">
            {[
              {
                q: 'Est-ce vraiment un paiement unique ?',
                a: 'Oui. Vous payez 15 000 FCFA une seule fois et accédez à vie aux modules M7–M17. Aucun abonnement, aucun renouvellement.',
              },
              {
                q: 'Quand les modules sont-ils débloqués ?',
                a: 'Dès que votre paiement mobile money est confirmé (généralement en moins de 2 minutes), les modules sont immédiatement accessibles.',
              },
              {
                q: 'Quels opérateurs sont acceptés ?',
                a: 'Wave, Orange Money, MTN Mobile Money et Moov Money — disponibles dans les pays UEMOA et au-delà.',
              },
              {
                q: 'Que se passe-t-il si mon paiement échoue ?',
                a: "Aucun montant n'est débité en cas d'échec. Vérifiez votre solde et réessayez, ou contactez-nous par email.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="bg-white rounded-xl border border-gray-200 p-5 group">
                <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between gap-2">
                  <span>{q}</span>
                  <TrendingUp className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Bannière retour */}
        <div className="mt-8 bg-gradient-to-r from-slate-800 to-indigo-900 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="text-white">
            <p className="font-bold">Modules gratuits déjà disponibles</p>
            <p className="text-slate-300 text-sm">M0 à M6 sont accessibles sans paiement.</p>
          </div>
          <button
            onClick={() => navigate('/learn')}
            className="flex-shrink-0 bg-white text-slate-800 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Continuer →
          </button>
        </div>
      </div>

      {/* Modal de paiement */}
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
