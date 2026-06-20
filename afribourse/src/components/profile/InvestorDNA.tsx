// src/components/profile/InvestorDNA.tsx
import { Shield, Target, TrendingUp, Zap, PieChart, Sparkles, ArrowRight, Coins, Search, Compass, Hammer, Crosshair, Share2, Users, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackInvestorDnaStarted } from '../../lib/amplitude';

interface DnaMetrics {
    horizon: string;
    tolerance: string;
    style: string;
    biais: string;
    module: string;
}

interface DnaConfig {
    label: string;
    identity: string;       // phrase d'identité
    description: string;
    goal: string;
    gradient: string;
    headerGradient: string;
    icon: React.ElementType;
    metrics: DnaMetrics;
}

// 6 archétypes brandés (chantier 2.1) + 4 legacy KYC pour rétro-compat.
const PROFILE_CONFIG: Record<string, DnaConfig> = {
    // ===== 6 archétypes brandés =====
    chasseur_dividendes: {
        label: 'Chasseur de Dividendes',
        identity: 'Tu privilégies les entreprises solides, rentables, avec une politique de distribution régulière.',
        description: 'Recherche revenus réguliers, entreprises solides, rendement',
        goal: 'Générer des revenus réguliers via les dividendes BRVM',
        gradient: 'from-emerald-500 to-green-600',
        headerGradient: 'from-emerald-600 to-green-700',
        icon: Coins,
        metrics: { horizon: 'Long terme', tolerance: 'Modérée', style: 'Rendement', biais: 'Surpondération défensive', module: 'Analyse des dividendes & payout ratio' },
    },
    analyste_valeur: {
        label: 'Analyste Valeur',
        identity: 'Tu cherches les actions sous-évaluées avec une marge de sécurité.',
        description: 'Cherche les actions sous-évaluées avec marge de sécurité',
        goal: 'Acheter sous la valeur intrinsèque sur la BRVM',
        gradient: 'from-blue-500 to-cyan-600',
        headerGradient: 'from-blue-600 to-cyan-700',
        icon: Search,
        metrics: { horizon: 'Long terme', tolerance: 'Modérée', style: 'Valeur', biais: 'Value trap', module: 'Valorisation & ratios fondamentaux' },
    },
    explorateur_croissance: {
        label: 'Explorateur Croissance',
        identity: 'Tu privilégies les entreprises en expansion et le potentiel long terme.',
        description: 'Privilégie les entreprises en expansion et le potentiel long terme',
        goal: 'Capter la croissance des entreprises BRVM',
        gradient: 'from-amber-500 to-orange-600',
        headerGradient: 'from-amber-600 to-orange-700',
        icon: Compass,
        metrics: { horizon: 'Long terme', tolerance: 'Élevée', style: 'Croissance', biais: 'Surpayer la croissance', module: 'Analyse de la croissance' },
    },
    stratege_defensif: {
        label: 'Stratège Défensif',
        identity: 'Tu protèges ton capital et limites la volatilité.',
        description: 'Protège son capital, limite la volatilité',
        goal: 'Préserver le capital avec une faible volatilité',
        gradient: 'from-slate-500 to-gray-600',
        headerGradient: 'from-slate-600 to-gray-700',
        icon: Shield,
        metrics: { horizon: 'Moyen terme', tolerance: 'Faible', style: 'Défensif', biais: 'Excès de prudence', module: 'Gestion du risque' },
    },
    batisseur_long_terme: {
        label: 'Bâtisseur Long Terme',
        identity: 'Tu investis progressivement, réinvestis, et évites les décisions émotionnelles.',
        description: 'Investit progressivement, réinvestit, évite les décisions émotionnelles',
        goal: 'Construire un patrimoine sur le long terme',
        gradient: 'from-teal-500 to-emerald-600',
        headerGradient: 'from-teal-600 to-emerald-700',
        icon: Hammer,
        metrics: { horizon: 'Très long terme', tolerance: 'Modérée', style: 'Régularité', biais: 'Inertie', module: 'Investissement programmé (DCA)' },
    },
    opportuniste_controle: {
        label: 'Opportuniste Contrôlé',
        identity: 'Tu sais saisir les occasions, mais avec une gestion du risque.',
        description: 'Sait saisir les occasions, mais avec une gestion du risque',
        goal: 'Saisir les opportunités tout en maîtrisant le risque',
        gradient: 'from-violet-500 to-purple-600',
        headerGradient: 'from-violet-600 to-purple-700',
        icon: Crosshair,
        metrics: { horizon: 'Moyen terme', tolerance: 'Élevée', style: 'Opportuniste', biais: 'Surtrading', module: 'Timing & gestion de position' },
    },

    // ===== Legacy KYC (rétro-compatibilité) =====
    prudent: {
        label: "L'Investisseur Prudent",
        identity: 'Tu privilégies la stabilité et la sécurité de ton capital.',
        description: 'Préserver et faire croître son capital en sécurité',
        goal: 'Privilégier la stabilité et les placements sûrs sur la BRVM',
        gradient: 'from-blue-500 to-cyan-600',
        headerGradient: 'from-blue-600 to-cyan-700',
        icon: Shield,
        metrics: { horizon: 'Moyen terme', tolerance: 'Faible', style: 'Défensif', biais: 'Excès de prudence', module: 'Gestion du risque' },
    },
    equilibre: {
        label: "L'Investisseur Équilibré",
        identity: 'Tu allies performance et maîtrise du risque.',
        description: 'Allier performance et maîtrise du risque',
        goal: 'Construire un portefeuille diversifié avec un risque modéré',
        gradient: 'from-teal-500 to-emerald-600',
        headerGradient: 'from-teal-600 to-emerald-700',
        icon: Target,
        metrics: { horizon: 'Long terme', tolerance: 'Modérée', style: 'Équilibré', biais: 'Indécision', module: 'Diversification du portefeuille' },
    },
    dynamique: {
        label: "L'Investisseur Dynamique",
        identity: 'Tu vises une croissance forte avec une prise de risque maîtrisée.',
        description: 'Viser une croissance forte avec une prise de risque maîtrisée',
        goal: 'Saisir les opportunités de croissance sur les marchés africains',
        gradient: 'from-amber-500 to-orange-600',
        headerGradient: 'from-amber-600 to-orange-700',
        icon: TrendingUp,
        metrics: { horizon: 'Long terme', tolerance: 'Élevée', style: 'Croissance', biais: 'Surexposition', module: 'Analyse de la croissance' },
    },
    offensif: {
        label: "L'Investisseur Offensif",
        identity: 'Tu maximises les gains avec une forte tolérance au risque.',
        description: 'Maximiser les gains avec une forte tolérance au risque',
        goal: 'Capitaliser sur la volatilité pour des rendements élevés',
        gradient: 'from-violet-500 to-purple-600',
        headerGradient: 'from-violet-600 to-purple-700',
        icon: Zap,
        metrics: { horizon: 'Long terme', tolerance: 'Très élevée', style: 'Agressif', biais: 'Surtrading', module: 'Timing & gestion de position' },
    },
};

/** Label court de l'ADN (sans l'article), ex. "Chasseur de Dividendes" pour le titre auto du hero. */
export function getDnaShortLabel(profileType: string | null | undefined): string | null {
    if (!profileType) return null;
    const config = PROFILE_CONFIG[profileType];
    if (!config) return null;
    return config.label.replace(/^L['']/, '');
}

interface InvestorDNAProps {
    profileType: string | null;
    isOwnProfile?: boolean;
    /** Progression vers le déblocage de l'ADN (0-100). Affichée dans le teaser. */
    completionPercentage?: number | null;
    /** Ouvre la génération de la carte ADN partageable (chantier 2). */
    onShareCard?: () => void;
}

export default function InvestorDNA({ profileType, isOwnProfile = false, completionPercentage = null, onShareCard }: InvestorDNAProps) {
    const config = profileType ? PROFILE_CONFIG[profileType] ?? null : null;

    if (!config) {
        if (!isOwnProfile) return null;

        // Teaser ADN chaud : ne jamais afficher « Profil non encore déterminé ».
        const pct = Math.max(0, Math.min(100, Math.round(completionPercentage ?? 0)));
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header gradient */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">ADN Investisseur</h3>
                            <p className="text-white/70 text-sm">Encore incomplet</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Ton <span className="font-semibold">ADN Investisseur</span> est encore incomplet.
                        Es-tu plutôt <span className="font-medium text-indigo-700">Chasseur de Dividendes</span>,{' '}
                        <span className="font-medium text-indigo-700">Investisseur Valeur</span> ou{' '}
                        <span className="font-medium text-indigo-700">Explorateur Croissance</span> ?
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Termine le test de profil en 10 minutes pour découvrir ton ADN.
                    </p>

                    {/* Barre de progression vers le déblocage */}
                    {pct > 0 && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Progression</span>
                                <span className="font-medium text-gray-700">{pct}% complété</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <Link
                        to="/onboarding/kyc"
                        onClick={() => trackInvestorDnaStarted('profile_teaser')}
                        className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl hover:from-indigo-700 hover:to-purple-800 transition-colors font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                        Découvrir mon ADN Investisseur
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    const Icon = config.icon;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header gradient */}
            <div className={`bg-gradient-to-r ${config.headerGradient} px-6 py-4`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">ADN Investisseur</h3>
                        <p className="text-white/70 text-sm">Profil déterminé par le Module 3</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Profile type card */}
                <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-5 text-white`}>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-xs uppercase tracking-wide font-medium">Profil investisseur</p>
                            <p className="text-xl font-bold text-white">{config.label}</p>
                        </div>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">{config.goal}</p>
                </div>

                {/* Phrase d'identité */}
                <p className="mt-4 text-sm text-gray-700 leading-relaxed">{config.identity}</p>

                {/* Sous-métriques */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                        { label: 'Horizon', value: config.metrics.horizon },
                        { label: 'Tolérance au risque', value: config.metrics.tolerance },
                        { label: 'Style dominant', value: config.metrics.style },
                        { label: 'Biais à surveiller', value: config.metrics.biais },
                    ].map((m) => (
                        <div key={m.label} className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">{m.label}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">{m.value}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-2 p-3 bg-indigo-50 rounded-xl">
                    <p className="text-[11px] text-indigo-500 uppercase tracking-wide font-medium">Module recommandé</p>
                    <p className="text-sm font-semibold text-indigo-800 mt-0.5">{config.metrics.module}</p>
                </div>

                {/* Actions */}
                {isOwnProfile && (
                    <div className="mt-4 space-y-2">
                        <button
                            onClick={() => onShareCard?.()}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${config.headerGradient} text-white rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2`}
                        >
                            <Share2 className="w-4 h-4" />
                            Partager mon ADN
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            <a
                                href="#profils-similaires"
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                            >
                                <Users className="w-4 h-4" />
                                Profils similaires
                            </a>
                            <a
                                href="#score-investisseur"
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                            >
                                <Gauge className="w-4 h-4" />
                                Améliorer mon score
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
