// src/pages/AchievementsPage.tsx
// Page complète des badges/achievements

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, BookOpen, TrendingUp, Users, Flame, Star,
  ArrowLeft, Lock, Zap, CheckCircle, X, Info,
  Target, Award, Gift, Clock, Sparkles
} from 'lucide-react';
import { useAllAchievements, useMyAchievements } from '../hooks/useGamification';
import { useCreatePost } from '../hooks/useSocial';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import type { Achievement, UserAchievement, AchievementCategory, AchievementRarity } from '../types';
import { RARITY_COLORS } from '../types';

// --- Helper: Critères -> texte humain ---
function getCriteriaDescription(criteria: any): string {
  if (!criteria) return '';
  switch (criteria.type) {
    case 'modules_completed':
      return criteria.target === 'all'
        ? 'Complétez TOUS les modules de formation'
        : `Complétez ${criteria.target} module${criteria.target > 1 ? 's' : ''} de formation`;
    case 'modules_level': {
      const levels: Record<string, string> = { debutant: 'débutant', intermediaire: 'intermédiaire', avance: 'avancé' };
      return `Complétez tous les modules niveau ${levels[criteria.level] || criteria.level}`;
    }
    case 'perfect_quizzes':
      return `Obtenez 100% à ${criteria.target} quiz`;
    case 'modules_in_day':
      return `Complétez ${criteria.target} modules en une seule journée`;
    case 'transactions':
      return criteria.target === 1
        ? 'Effectuez votre première transaction'
        : `Effectuez ${criteria.target} transactions`;
    case 'roi':
      return `Atteignez un ROI de plus de ${criteria.target}%`;
    case 'positions':
      return `Détenez ${criteria.target} positions différentes simultanément`;
    case 'position_held_days':
      return `Conservez une position pendant ${criteria.target} jours`;
    case 'dividends_companies':
      return `Recevez des dividendes de ${criteria.target} entreprises différentes`;
    case 'profile_complete':
      return 'Complétez votre profil à 100%';
    case 'communities_joined':
      return criteria.target === 1
        ? 'Rejoignez une communauté'
        : `Rejoignez ${criteria.target} communautés`;
    case 'followers':
      return `Atteignez ${criteria.target} abonnés`;
    case 'referrals':
      return `Invitez ${criteria.target} amis qui s'inscrivent`;
    case 'streak':
      return `Maintenez une série de ${criteria.target} jours consécutifs`;
    case 'login_before':
      return `Connectez-vous avant ${criteria.hour}h du matin ${criteria.target} fois`;
    case 'login_after':
      return `Connectez-vous après ${criteria.hour}h ${criteria.target} fois`;
    case 'weekend_activity':
      return `Soyez actif tous les weekends pendant ${criteria.weeks} semaines`;
    case 'account_age_days':
      return criteria.target >= 365
        ? `Soyez membre depuis ${Math.floor(criteria.target / 365)} an${Math.floor(criteria.target / 365) > 1 ? 's' : ''}`
        : `Soyez membre depuis ${criteria.target} jours`;
    case 'ranking_percentile':
      return `Faites partie du top ${criteria.target}% du classement`;
    case 'monthly_roi_rank':
      return 'Ayez le meilleur ROI du mois';
    case 'active_referrals':
      return `Ayez ${criteria.target}+ amis actifs invités`;
    case 'total_xp':
      return `Atteignez ${criteria.target.toLocaleString('fr-FR')} XP au total`;
    case 'early_adopter':
      return `Faites partie des ${criteria.target} premiers inscrits`;
    default:
      return '';
  }
}

// --- Helper: Conseil pour débloquer ---
function getUnlockTip(criteria: any, category: string): string {
  if (!criteria) return '';
  switch (criteria.type) {
    case 'modules_completed':
    case 'modules_level':
    case 'modules_in_day':
      return 'Accédez à la section Apprendre pour suivre les modules de formation.';
    case 'perfect_quizzes':
      return 'Révisez bien le contenu des modules avant de passer les quiz.';
    case 'transactions':
    case 'roi':
    case 'positions':
    case 'position_held_days':
    case 'dividends_companies':
      return 'Utilisez le simulateur de trading dans votre Dashboard.';
    case 'profile_complete':
      return 'Rendez-vous sur votre profil et remplissez toutes les informations.';
    case 'communities_joined':
      return 'Explorez et rejoignez les communautés disponibles.';
    case 'followers':
      return 'Partagez du contenu intéressant pour attirer des abonnés.';
    case 'referrals':
    case 'active_referrals':
      return 'Partagez votre lien de parrainage avec vos amis.';
    case 'streak':
      return 'Connectez-vous chaque jour pour maintenir votre série.';
    case 'login_before':
      return 'Connectez-vous tôt le matin pour gagner ce badge.';
    case 'login_after':
      return 'Connectez-vous tard le soir pour gagner ce badge.';
    case 'weekend_activity':
      return 'Restez actif les weekends en visitant la plateforme.';
    case 'account_age_days':
      return 'Ce badge se débloque automatiquement avec le temps.';
    case 'ranking_percentile':
    case 'monthly_roi_rank':
      return 'Accumulez de l\'XP et améliorez votre classement.';
    case 'total_xp':
      return 'Continuez à utiliser la plateforme pour gagner de l\'XP.';
    case 'early_adopter':
      return 'Badge réservé aux premiers inscrits de la plateforme.';
    default:
      return '';
  }
}

// --- Catégories ---
const CATEGORIES: { key: AchievementCategory | 'all'; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'all', label: 'Tous', icon: <Trophy className="w-4 h-4" />, description: 'Tous les badges' },
  { key: 'formation', label: 'Formation', icon: <BookOpen className="w-4 h-4" />, description: 'Progressez dans les modules de formation' },
  { key: 'trading', label: 'Trading', icon: <TrendingUp className="w-4 h-4" />, description: 'Excellez dans le simulateur de trading' },
  { key: 'social', label: 'Social', icon: <Users className="w-4 h-4" />, description: 'Développez votre réseau sur la plateforme' },
  { key: 'engagement', label: 'Engagement', icon: <Flame className="w-4 h-4" />, description: 'Montrez votre régularité et votre engagement' },
  { key: 'special', label: 'Spéciaux', icon: <Star className="w-4 h-4" />, description: 'Badges rares et accomplissements exceptionnels' }
];

const RARITY_ORDER: Record<string, number> = { legendary: 0, epic: 1, rare: 2, common: 3 };

const RARITY_LABELS: Record<string, string> = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire'
};

// --- Badge Detail Modal ---
function BadgeDetailModal({
  achievement,
  userAchievement,
  isUnlocked,
  onClose,
  onShare,
  isSharing
}: {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  isUnlocked: boolean;
  onClose: () => void;
  onShare?: (achievement: Achievement) => void;
  isSharing?: boolean;
}) {
  const rarityColors = RARITY_COLORS[achievement.rarity as AchievementRarity] || RARITY_COLORS.common;
  const isSecret = achievement.is_hidden || achievement.is_secret;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className={`relative p-8 ${rarityColors.bg} text-center`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/30 hover:bg-white/50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          <div className={`text-7xl mb-4 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
            {isSecret && !isUnlocked ? '?' : (achievement.icon || '🏆')}
          </div>

          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${rarityColors.text} bg-white/50 border ${rarityColors.border}`}>
            {RARITY_LABELS[achievement.rarity]}
          </span>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
            {isSecret && !isUnlocked ? '???' : achievement.name}
          </h2>
          <p className="text-gray-600 text-center mb-6">
            {isSecret && !isUnlocked ? 'Badge secret - continuez à explorer pour le découvrir !' : achievement.description}
          </p>

          {/* Status */}
          {isUnlocked ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Badge débloqué !</p>
                {userAchievement && (
                  <p className="text-sm text-green-600">Obtenu le {formatDate(userAchievement.unlocked_at)}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {/* Comment débloquer */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-800 text-sm">Comment débloquer</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {isSecret ? 'Continuez à explorer la plateforme...' : getCriteriaDescription(achievement.criteria)}
                  </p>
                </div>
              </div>

              {/* Conseil */}
              {!isSecret && getUnlockTip(achievement.criteria, achievement.category) && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Conseil</p>
                    <p className="text-sm text-amber-700 mt-1">
                      {getUnlockTip(achievement.criteria, achievement.category)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Récompense */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Récompense</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-600">
                {achievement.xp_reward > 0 ? `+${achievement.xp_reward} XP` : 'Prestige'}
              </span>
            </div>
          </div>

          {/* Bouton Partager */}
          {isUnlocked && onShare && (
            <button
              onClick={() => onShare(achievement)}
              disabled={isSharing}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSharing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Partage en cours...
                </>
              ) : (
                <>
                  <Award className="w-5 h-5" />
                  Partager dans la communaute
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Badge Card amélioré pour la page achievements ---
function AchievementPageCard({
  achievement,
  userAchievement,
  isUnlocked,
  onClick
}: {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  isUnlocked: boolean;
  onClick: () => void;
}) {
  const rarityColors = RARITY_COLORS[achievement.rarity as AchievementRarity] || RARITY_COLORS.common;
  const isSecret = achievement.is_hidden || achievement.is_secret;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl border-2 p-4 transition-all duration-300 cursor-pointer
        hover:shadow-lg hover:-translate-y-1
        ${isUnlocked
          ? `${rarityColors.bg} ${rarityColors.border}`
          : 'bg-gray-50 border-gray-200'
        }
      `}
    >
      {/* Rareté tag */}
      <span className={`absolute top-2.5 right-2.5 rounded-full text-xs font-semibold px-2 py-0.5 ${rarityColors.bg} ${rarityColors.text}`}>
        {RARITY_LABELS[achievement.rarity]}
      </span>

      {/* Icône */}
      <div className="flex flex-col items-center text-center">
        <div className={`relative text-4xl mb-3 ${isUnlocked ? '' : 'grayscale opacity-40'}`}>
          {isSecret && !isUnlocked ? '?' : (achievement.icon || '🏆')}
          {!isUnlocked && (
            <div className="absolute -bottom-1 -right-1 p-1 bg-gray-200 rounded-full">
              <Lock className="w-3 h-3 text-gray-500" />
            </div>
          )}
          {isUnlocked && (
            <div className="absolute -bottom-1 -right-1 p-1 bg-green-100 rounded-full">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            </div>
          )}
        </div>

        {/* Nom */}
        <h3 className={`font-bold text-sm text-gray-800 mb-1 line-clamp-1 ${isSecret && !isUnlocked ? 'blur-sm' : ''}`}>
          {isSecret && !isUnlocked ? '???' : achievement.name}
        </h3>

        {/* Description courte */}
        <p className={`text-xs text-gray-500 line-clamp-2 mb-2 min-h-[2rem] ${isSecret && !isUnlocked ? 'blur-sm' : ''}`}>
          {isSecret && !isUnlocked ? 'Badge secret' : achievement.description}
        </p>

        {/* XP */}
        <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
          <Zap className="w-3 h-3" />
          <span>{achievement.xp_reward > 0 ? `+${achievement.xp_reward} XP` : 'Prestige'}</span>
        </div>

        {/* Date débloquée ou hint */}
        {isUnlocked && userAchievement ? (
          <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Débloqué
          </p>
        ) : (
          !isSecret && (
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Verrouillé
            </p>
          )
        )}
      </div>
    </div>
  );
}

// --- Page principale ---
export default function AchievementsPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: allAchievements, isLoading: loadingAll } = useAllAchievements();
  const { data: myAchievements, isLoading: loadingMy } = useMyAchievements();

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);
  const [sharingBadgeId, setSharingBadgeId] = useState<string | null>(null);
  const createPost = useCreatePost();

  const handleShareBadge = (achievement: Achievement) => {
    setSharingBadgeId(achievement.id);

    const rarityLabels: Record<string, string> = {
      common: 'Commun', rare: 'Rare', epic: 'Epique', legendary: 'Legendaire'
    };

    createPost.mutate(
      {
        type: 'ACHIEVEMENT',
        content: `${achievement.icon || '🏆'} J'ai debloque le badge "${achievement.name}" (${rarityLabels[achievement.rarity] || achievement.rarity}) !\n\n${achievement.description}${achievement.xp_reward > 0 ? `\n\n⚡ +${achievement.xp_reward} XP gagnes !` : ''}`,
        tags: ['badge', achievement.category],
        metadata: {
          achievement: {
            id: achievement.id,
            code: achievement.code,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            rarity: achievement.rarity,
            category: achievement.category,
            xp_reward: achievement.xp_reward,
          }
        },
      },
      {
        onSuccess: () => {
          toast.success('Badge partage dans la communaute !');
          setSharingBadgeId(null);
        },
        onError: () => {
          toast.error('Erreur lors du partage');
          setSharingBadgeId(null);
        },
      }
    );
  };

  // Map des badges débloqués
  const unlockedMap = useMemo(() => {
    const map = new Map<string, UserAchievement>();
    (myAchievements || []).forEach(ua => {
      map.set(ua.achievement.code, ua);
    });
    return map;
  }, [myAchievements]);

  // Filtrage
  const filteredAchievements = useMemo(() => {
    if (!allAchievements) return [];
    const list = selectedCategory === 'all'
      ? allAchievements
      : allAchievements.filter(a => a.category === selectedCategory);

    return [...list].sort((a, b) => {
      const aUnlocked = unlockedMap.has(a.code) ? 0 : 1;
      const bUnlocked = unlockedMap.has(b.code) ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    });
  }, [allAchievements, selectedCategory, unlockedMap]);

  // Stats globales
  const stats = useMemo(() => {
    const total = allAchievements?.length || 0;
    const unlocked = myAchievements?.length || 0;
    const totalXP = (myAchievements || []).reduce((sum, ua) => sum + (ua.achievement.xp_reward || 0), 0);
    const categoryStats = CATEGORIES.slice(1).map(cat => ({
      key: cat.key,
      label: cat.label,
      total: (allAchievements || []).filter(a => a.category === cat.key).length,
      unlocked: (myAchievements || []).filter(ua => ua.achievement.category === cat.key).length
    }));
    return { total, unlocked, totalXP, categoryStats };
  }, [allAchievements, myAchievements]);

  const isLoading = loadingAll || loadingMy;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Retour</span>
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Mes Badges</h1>
                  <p className="text-white/80 text-sm md:text-base">
                    Collectez des badges en progressant sur AfriBourse
                  </p>
                </div>
              </div>
            </div>

            {/* Stats résumé */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{stats.unlocked}</div>
                <div className="text-xs text-white/70">Débloqués</div>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{stats.total}</div>
                <div className="text-xs text-white/70">Total</div>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">
                  {stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}%
                </div>
                <div className="text-xs text-white/70">Complété</div>
              </div>
            </div>
          </div>

          {/* Barre de progression globale */}
          <div className="mt-6">
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Progression par catégorie */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {stats.categoryStats.map(cat => {
            const catInfo = CATEGORIES.find(c => c.key === cat.key)!;
            const pct = cat.total > 0 ? Math.round((cat.unlocked / cat.total) * 100) : 0;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key as AchievementCategory)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedCategory === cat.key
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={selectedCategory === cat.key ? 'text-amber-600' : 'text-gray-400'}>
                    {catInfo.icon}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">{cat.label}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{cat.unlocked}/{cat.total}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Filtres catégorie (mobile-friendly tabs) */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key as AchievementCategory | 'all')}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg
                text-sm font-medium transition-all
                ${selectedCategory === cat.key
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}
              `}
            >
              {cat.icon}
              <span>{cat.label}</span>
              {cat.key !== 'all' && (
                <span className={`ml-1 text-xs ${selectedCategory === cat.key ? 'text-amber-200' : 'text-gray-400'}`}>
                  ({stats.categoryStats.find(s => s.key === cat.key)?.unlocked || 0}/
                  {stats.categoryStats.find(s => s.key === cat.key)?.total || 0})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Description de la catégorie */}
        {selectedCategory !== 'all' && (
          <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
              {CATEGORIES.find(c => c.key === selectedCategory)?.icon}
            </div>
            <p className="text-sm text-gray-600">
              {CATEGORIES.find(c => c.key === selectedCategory)?.description}
            </p>
          </div>
        )}

        {/* Message si non connecté */}
        {!isLoggedIn && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Connectez-vous pour suivre votre progression</p>
              <p className="text-xs text-blue-600 mt-0.5">Vos badges débloqués seront mis en évidence une fois connecté.</p>
            </div>
          </div>
        )}

        {/* Grille des badges */}
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAchievements.map(achievement => (
              <AchievementPageCard
                key={achievement.id}
                achievement={achievement}
                userAchievement={unlockedMap.get(achievement.code)}
                isUnlocked={unlockedMap.has(achievement.code)}
                onClick={() => setSelectedBadge(achievement)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">Aucun badge dans cette catégorie</p>
          </div>
        )}

        {/* Légende des raretés */}
        <div className="mt-10 p-6 bg-white rounded-2xl border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Niveaux de rareté
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['common', 'rare', 'epic', 'legendary'] as AchievementRarity[]).map(rarity => {
              const colors = RARITY_COLORS[rarity];
              const count = (allAchievements || []).filter(a => a.rarity === rarity).length;
              const unlocked = (myAchievements || []).filter(ua => ua.achievement.rarity === rarity).length;
              return (
                <div key={rarity} className={`p-3 rounded-xl border ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {RARITY_LABELS[rarity]}
                    </span>
                    <span className={`text-xs ${colors.text}`}>
                      {unlocked}/{count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {rarity === 'common' && 'Badges accessibles facilement'}
                    {rarity === 'rare' && 'Demandent un effort modéré'}
                    {rarity === 'epic' && 'Réservés aux plus déterminés'}
                    {rarity === 'legendary' && 'Les plus rares et prestigieux'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* XP total des badges */}
        {stats.totalXP > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">XP total gagné via les badges</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-amber-600">{stats.totalXP.toLocaleString('fr-FR')} XP</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détail */}
      {selectedBadge && (
        <BadgeDetailModal
          achievement={selectedBadge}
          userAchievement={unlockedMap.get(selectedBadge.code)}
          isUnlocked={unlockedMap.has(selectedBadge.code)}
          onClose={() => setSelectedBadge(null)}
          onShare={isLoggedIn ? handleShareBadge : undefined}
          isSharing={sharingBadgeId === selectedBadge.id}
        />
      )}
    </div>
  );
}
