// src/pages/PremiumWaitlistPage.tsx
// /subscriptions — l'abonnement Premium est momentanément indisponible.
// Tous les liens « Passer à Premium » (SIMBA, valorisation, nudges…) arrivent ici.
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Clock, Zap, Crown, ArrowRight } from 'lucide-react';
import PremiumWaitlist from '../components/PremiumWaitlist';

const FEATURES = [
  'SIMBA (Coach IA & Analyste) sans limite de questions',
  'Données en temps réel',
  'Alertes de prix personnalisées',
  'Screener avancé',
  'Certificats téléchargeables',
];

export default function PremiumWaitlistPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      <Helmet>
        <title>Abonnement Premium — bientôt de retour | AfriBourse</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
          <Clock className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
          L’abonnement Premium revient bientôt
        </h1>
        <p className="text-gray-600 mb-8">
          Nous préparons une nouvelle formule. Inscrivez-vous à la liste d’attente : vous serez prévenu(e) en priorité dès son retour.
        </p>

        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 mb-8 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h2 className="text-lg font-bold text-gray-900">Ce que comprendra Premium</h2>
          </div>
          <ul className="space-y-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center text-sm text-gray-700">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2 shrink-0"></div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <PremiumWaitlist feature="Page abonnement" />
      </div>

      {/* La Formation Complète, elle, reste disponible à l'achat */}
      <Link
        to="/formation"
        className="mt-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors"
      >
        <Crown className="w-6 h-6 text-amber-500 shrink-0" />
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900 text-sm">Formation Complète toujours disponible</p>
          <p className="text-gray-600 text-xs">Modules M7 à M19 débloqués à vie — paiement unique</p>
        </div>
        <ArrowRight className="w-5 h-5 text-amber-600" />
      </Link>
    </div>
  );
}
