// src/components/profile/InvestorDNA.tsx
//
// Carte « ADN Investisseur ».
//
// Chaque archetype portait auparavant son propre degrade (emeraude, cyan, ambre,
// ardoise, teal, violet) : six familles de couleurs, aucune du logo, et une carte
// dont l'aspect changeait completement d'un utilisateur a l'autre. La carte est
// desormais toujours navy — la teinte du logo — et l'archetype se lit a son icone
// et a son nom. L'orange de marque reste l'unique accent.
import { Shield, Target, TrendingUp, Zap, ArrowRight, Coins, Search, Compass, Hammer, Crosshair, Share2, Users, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackInvestorDnaStarted } from '../../lib/amplitude';
import { HERO_BACKGROUNDS, HERO_GRID_STYLE } from '../../utils/heroBackgrounds';
import ProfileSectionCard from './ProfileSectionCard';

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
        icon: Coins,
        metrics: { horizon: 'Long terme', tolerance: 'Modérée', style: 'Rendement', biais: 'Surpondération défensive', module: 'Analyse des dividendes & payout ratio' },
    },
    analyste_valeur: {
        label: 'Analyste Valeur',
        identity: 'Tu cherches les actions sous-évaluées avec une marge de sécurité.',
        description: 'Cherche les actions sous-évaluées avec marge de sécurité',
        goal: 'Acheter sous la valeur intrinsèque sur la BRVM',
        icon: Search,
        metrics: { horizon: 'Long terme', tolerance: 'Modérée', style: 'Valeur', biais: 'Value trap', module: 'Valorisation & ratios fondamentaux' },
    },
    explorateur_croissance: {
        label: 'Explorateur Croissance',
        identity: 'Tu privilégies les entreprises en expansion et le potentiel long terme.',
        description: 'Privilégie les entreprises en expansion et le potentiel long terme',
        goal: 'Capter la croissance des entreprises BRVM',
        icon: Compass,
        metrics: { horizon: 'Long terme', tolerance: 'Élevée', style: 'Croissance', biais: 'Surpayer la croissance', module: 'Analyse de la croissance' },
    },
    stratege_defensif: {
        label: 'Stratège Défensif',
        identity: 'Tu protèges ton capital et limites la volatilité.',
        description: 'Protège son capital, limite la volatilité',
        goal: 'Préserver le capital avec une faible volatilité',
        icon: Shield,
        metrics: { horizon: 'Moyen terme', tolerance: 'Faible', style: 'Défensif', biais: 'Excès de prudence', module: 'Gestion du risque' },
    },
    batisseur_long_terme: {
        label: 'Bâtisseur Long Terme',
        identity: 'Tu investis progressivement, réinvestis, et évites les décisions émotionnelles.',
        description: 'Investit progressivement, réinvestit, évite les décisions émotionnelles',
        goal: 'Construire un patrimoine sur le long terme',
        icon: Hammer,
        metrics: { horizon: 'Très long terme', tolerance: 'Modérée', style: 'Régularité', biais: 'Inertie', module: 'Investissement programmé (DCA)' },
    },
    opportuniste_controle: {
        label: 'Opportuniste Contrôlé',
        identity: 'Tu sais saisir les occasions, mais avec une gestion du risque.',
        description: 'Sait saisir les occasions, mais avec une gestion du risque',
        goal: 'Saisir les opportunités tout en maîtrisant le risque',
        icon: Crosshair,
        metrics: { horizon: 'Moyen terme', tolerance: 'Élevée', style: 'Opportuniste', biais: 'Surtrading', module: 'Timing & gestion de position' },
    },

    // ===== Legacy KYC (rétro-compatibilité) =====
    prudent: {
        label: "L'Investisseur Prudent",
        identity: 'Tu privilégies la stabilité et la sécurité de ton capital.',
        description: 'Préserver et faire croître son capital en sécurité',
        goal: 'Privilégier la stabilité et les placements sûrs sur la BRVM',
        icon: Shield,
        metrics: { horizon: 'Moyen terme', tolerance: 'Faible', style: 'Défensif', biais: 'Excès de prudence', module: 'Gestion du risque' },
    },
    equilibre: {
        label: "L'Investisseur Équilibré",
        identity: 'Tu allies performance et maîtrise du risque.',
        description: 'Allier performance et maîtrise du risque',
        goal: 'Construire un portefeuille diversifié avec un risque modéré',
        icon: Target,
        metrics: { horizon: 'Long terme', tolerance: 'Modérée', style: 'Équilibré', biais: 'Indécision', module: 'Diversification du portefeuille' },
    },
    dynamique: {
        label: "L'Investisseur Dynamique",
        identity: 'Tu vises une croissance forte avec une prise de risque maîtrisée.',
        description: 'Viser une croissance forte avec une prise de risque maîtrisée',
        goal: 'Saisir les opportunités de croissance sur les marchés africains',
        icon: TrendingUp,
        metrics: { horizon: 'Long terme', tolerance: 'Élevée', style: 'Croissance', biais: 'Surexposition', module: 'Analyse de la croissance' },
    },
    offensif: {
        label: "L'Investisseur Offensif",
        identity: 'Tu maximises les gains avec une forte tolérance au risque.',
        description: 'Maximiser les gains avec une forte tolérance au risque',
        goal: 'Capitaliser sur la volatilité pour des rendements élevés',
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

/** Raccourcis sous la carte : profils similaires / score. */
const SUB_ACTION =
    'flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium ' +
    'bg-ink-50 text-brand-navy border border-ink-100 hover:bg-ink-100 transition-colors cursor-pointer ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2';

export default function InvestorDNA({ profileType, isOwnProfile = false, completionPercentage = null, onShareCard }: InvestorDNAProps) {
    const config = profileType ? PROFILE_CONFIG[profileType] ?? null : null;

    if (!config) {
        if (!isOwnProfile) return null;

        // Teaser ADN chaud : ne jamais afficher « Profil non encore déterminé ».
        const pct = Math.max(0, Math.min(100, Math.round(completionPercentage ?? 0)));
        return (
            <ProfileSectionCard
                title="ADN Investisseur"
                subtitle="Encore incomplet"
            >
                <p className="text-sm text-ink-700 leading-relaxed">
                    Ton <span className="font-semibold">ADN Investisseur</span> est encore incomplet.
                    Es-tu plutôt <span className="font-medium text-brand-navy">Chasseur de Dividendes</span>,{' '}
                    <span className="font-medium text-brand-navy">Analyste Valeur</span> ou{' '}
                    <span className="font-medium text-brand-navy">Explorateur Croissance</span> ?
                </p>
                <p className="text-sm text-ink-500 mt-2">
                    Termine le test de profil en 10 minutes pour découvrir ton ADN.
                </p>

                {/* Barre de progression vers le déblocage */}
                {pct > 0 && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
                            <span>Progression</span>
                            <span className="font-mono font-medium text-ink-700">{pct}% complété</span>
                        </div>
                        <div className="h-2 w-full bg-ink-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand-orange to-brand-orange-light rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                )}

                <Link
                    to="/onboarding/kyc"
                    onClick={() => trackInvestorDnaStarted('profile_teaser')}
                    className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-orange text-white rounded-xl font-semibold shadow-sm hover:bg-brand-orange-hover hover:shadow-md hover:shadow-brand-orange/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                >
                    Découvrir mon ADN Investisseur
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </ProfileSectionCard>
        );
    }

    const Icon = config.icon;

    return (
        <ProfileSectionCard
            title="ADN Investisseur"
            subtitle="Profil déterminé par le Module 3"
        >
            {/* Carte archetype : le navy signature, comme les hero du site. */}
            <div
                className="relative overflow-hidden rounded-2xl p-5 text-white"
                style={{ backgroundImage: HERO_BACKGROUNDS[0].gradient }}
            >
                <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: HERO_BACKGROUNDS[0].halo }} />
                <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={HERO_GRID_STYLE} />
                <div className="relative">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-orange/25">
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-ink-300 text-[11px] uppercase tracking-wide font-medium">Profil investisseur</p>
                            <p className="text-xl font-bold text-white leading-tight">{config.label}</p>
                        </div>
                    </div>
                    <p className="text-ink-100 text-sm leading-relaxed">{config.goal}</p>
                </div>
            </div>

            {/* Phrase d'identité */}
            <p className="mt-4 text-sm text-ink-700 leading-relaxed">{config.identity}</p>

            {/* Sous-métriques */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                    { label: 'Horizon', value: config.metrics.horizon },
                    { label: 'Tolérance au risque', value: config.metrics.tolerance },
                    { label: 'Style dominant', value: config.metrics.style },
                    { label: 'Biais à surveiller', value: config.metrics.biais },
                ].map((m) => (
                    <div key={m.label} className="p-3 bg-ink-50 rounded-xl border border-ink-100">
                        <p className="text-[11px] text-ink-500 uppercase tracking-wide font-medium">{m.label}</p>
                        <p className="text-sm font-semibold text-ink-800 mt-0.5">{m.value}</p>
                    </div>
                ))}
            </div>
            <div className="mt-2 p-3 rounded-xl bg-brand-orange/10 border border-brand-orange/20">
                <p className="text-[11px] text-brand-orange-dark uppercase tracking-wide font-medium">Module recommandé</p>
                <p className="text-sm font-semibold text-ink-800 mt-0.5">{config.metrics.module}</p>
            </div>

            {/* Actions */}
            {isOwnProfile && (
                <div className="mt-4 space-y-2">
                    <button
                        onClick={() => onShareCard?.()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-navy text-white rounded-xl font-semibold shadow-sm hover:bg-brand-navy-hover hover:shadow-md hover:shadow-brand-navy/30 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Partager mon ADN
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        <a href="#profils-similaires" className={SUB_ACTION}>
                            <Users className="w-4 h-4" />
                            Profils similaires
                        </a>
                        <a href="#score-investisseur" className={SUB_ACTION}>
                            <Gauge className="w-4 h-4" />
                            Améliorer mon score
                        </a>
                    </div>
                </div>
            )}
        </ProfileSectionCard>
    );
}
