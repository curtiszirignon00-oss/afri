// src/contexts/CelebrationContext.tsx
// Gestion centralisée des célébrations : badges débloqués + micro-victoires

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { useAuth } from './AuthContext';
import { MilestonePopup } from '../components/gamification/MilestonePopup';
import { AchievementUnlockModal } from '../components/gamification/AchievementUnlockModal';
import BadgeShareModal from '../components/share/BadgeShareModal';
import type { MilestoneType, MilestoneData } from '../components/gamification/MilestonePopup';
import type { Achievement, UserAchievement } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface QueuedMilestone {
  id: string;
  type: MilestoneType;
  data?: MilestoneData;
  onShare?: () => void;
}

interface QueuedBadge {
  id: string;
  achievement: Achievement;
  unlockedAt?: string;
}

interface CelebrationContextValue {
  /** Déclencher une micro-victoire manuellement */
  triggerMilestone: (type: MilestoneType, data?: MilestoneData) => void;
  /** Forcer un check immédiat des nouveaux badges (après une action importante) */
  checkNewAchievements: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CelebrationContext = createContext<CelebrationContextValue>({
  triggerMilestone: () => {},
  checkNewAchievements: async () => {},
});

export function useCelebration() {
  return useContext(CelebrationContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  // Queues
  const [milestoneQueue, setMilestoneQueue] = useState<QueuedMilestone[]>([]);
  const [badgeQueue, setBadgeQueue] = useState<QueuedBadge[]>([]);

  // Élément affiché
  const [currentMilestone, setCurrentMilestone] = useState<QueuedMilestone | null>(null);
  const [currentBadge, setCurrentBadge] = useState<QueuedBadge | null>(null);
  const [shareTarget, setShareTarget] = useState<Achievement | null>(null);

  // Éviter les doublons côté polling
  const shownBadgeIds = useRef<Set<string>>(new Set());

  // ── Polling des nouveaux badges ─────────────────────────────────────────

  const fetchNewAchievements = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await apiClient.get('/achievements/me/new');
      const items: UserAchievement[] = res.data;
      if (!Array.isArray(items) || items.length === 0) return;

      const fresh = items.filter(ua => {
        const key = ua.achievement?.id ?? ua.id;
        if (shownBadgeIds.current.has(key)) return false;
        shownBadgeIds.current.add(key);
        return true;
      });

      if (fresh.length === 0) return;

      const newBadges: QueuedBadge[] = fresh.map(ua => ({
        id: ua.achievement?.id ?? ua.id,
        achievement: ua.achievement,
        unlockedAt: ua.unlocked_at,
      }));

      setBadgeQueue(prev => [...prev, ...newBadges]);

      // Invalider le cache des achievements pour rafraîchir les compteurs
      queryClient.invalidateQueries({ queryKey: ['gamification', 'achievements'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'xp'] });
    } catch {
      // Silencieux — ce n'est pas bloquant
    }
  }, [isLoggedIn, queryClient]);

  // Poll toutes les 90 secondes (réduit la charge serveur)
  // Ne poll pas si l'onglet est en arrière-plan
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchNewAchievements(); // vérification immédiate à la connexion
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNewAchievements();
      }
    }, 90_000);
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchNewAchievements]);

  // ── Dépiler les milestones ──────────────────────────────────────────────

  useEffect(() => {
    // Ne rien démarrer si un badge ou une célébration est déjà visible
    if (currentMilestone || currentBadge) return;
    if (milestoneQueue.length === 0) return;
    const [next, ...rest] = milestoneQueue;
    setMilestoneQueue(rest);
    setCurrentMilestone(next);
  }, [milestoneQueue, currentMilestone, currentBadge]);

  // ── Dépiler les badges (après la fermeture des milestones) ───────────────

  useEffect(() => {
    if (currentMilestone || currentBadge) return;
    if (badgeQueue.length === 0) return;
    const [next, ...rest] = badgeQueue;
    setBadgeQueue(rest);
    setCurrentBadge(next);
  }, [badgeQueue, currentMilestone, currentBadge]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleMilestoneClose = useCallback(() => {
    setCurrentMilestone(null);
  }, []);

  const handleBadgeClose = useCallback(() => {
    setCurrentBadge(null);
  }, []);

  const handleBadgeShare = useCallback(() => {
    if (currentBadge) {
      setShareTarget(currentBadge.achievement);
    }
    setCurrentBadge(null);
  }, [currentBadge]);

  const handleShareModalClose = useCallback(() => {
    setShareTarget(null);
  }, []);

  // ── API publique ─────────────────────────────────────────────────────────

  const triggerMilestone = useCallback((type: MilestoneType, data?: MilestoneData) => {
    const id = `${type}-${Date.now()}`;
    setMilestoneQueue(prev => [...prev, { id, type, data }]);
  }, []);

  const checkNewAchievements = useCallback(async () => {
    await fetchNewAchievements();
  }, [fetchNewAchievements]);

  // ── Rendu ────────────────────────────────────────────────────────────────

  return (
    <CelebrationContext.Provider value={{ triggerMilestone, checkNewAchievements }}>
      {children}

      {/* Pop-up micro-victoire */}
      {currentMilestone && (
        <MilestonePopup
          type={currentMilestone.type}
          data={currentMilestone.data}
          isOpen={true}
          onClose={handleMilestoneClose}
        />
      )}

      {/* Modal badge débloqué */}
      {currentBadge && (
        <AchievementUnlockModal
          achievement={currentBadge.achievement}
          isOpen={true}
          onClose={handleBadgeClose}
          onShare={handleBadgeShare}
        />
      )}

      {/* Modal de partage badge (réseaux sociaux + communauté) */}
      <BadgeShareModal
        isOpen={!!shareTarget}
        onClose={handleShareModalClose}
        achievement={shareTarget}
        unlockedDate={
          badgeQueue.find(b => b.achievement?.id === shareTarget?.id)?.unlockedAt ??
          currentBadge?.unlockedAt
        }
      />
    </CelebrationContext.Provider>
  );
}
