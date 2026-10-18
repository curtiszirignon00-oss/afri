import { API_BASE_URL, authFetch } from '../config/api';
import { Stock } from '../types';

// Les chats SIMBA (Analyste, Conseiller, Tuteur) passent par simbaChat.ts (streaming + mémoire).
// Ce fichier garde l'analyse rapide de la fiche titre et le feedback.

// ─── SIMBA — Feedback 👍 / 👎 sur une réponse ─────────────────────────────────

export const sendAnalystFeedback = async (
  messageId: string,
  rating: 'positive' | 'negative',
  endpoint: 'analyst' | 'tutor' | 'portfolio' | 'market-analysis' = 'analyst',
): Promise<void> => {
  try {
    await authFetch(`${API_BASE_URL}/ai/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, rating, endpoint }),
    });
  } catch {
    // fire-and-forget — ne jamais bloquer l'UX pour un feedback
  }
};

// ─── SIMBA — Analyse rapide de la fiche titre ────────────────────────────────

// L'analyse est mise en cache côté serveur (pré-calculée chaque soir) : generatedAt indique sa date
export const getSIMBAStockAnalysis = async (stock: Stock): Promise<{ text: string; generatedAt?: string; paywallHit?: boolean }> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/ai/market-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: { symbol: stock.symbol } }),
    });

    if (!response.ok) {
      if (response.status === 402) return { text: '', paywallHit: true };
      if (response.status === 429) return { text: '⚠️ Limite d\'appels IA atteinte. Réessayez dans une heure.' };
      if (response.status === 401) return { text: '⚠️ Vous devez être connecté pour utiliser l\'analyse IA.' };
      return { text: '⚠️ Impossible de générer l\'analyse IA pour le moment. Veuillez réessayer plus tard.' };
    }

    const data = await response.json();
    return { text: data?.data?.text || 'L\'analyse n\'est pas disponible pour le moment.', generatedAt: data?.data?.generatedAt };
  } catch {
    return { text: '⚠️ Impossible de générer l\'analyse IA pour le moment. Veuillez réessayer plus tard.' };
  }
};

// ─── SIMBA — Contexte du Tuteur (Learning Academy) ───────────────────────────

export interface TutorUserContext {
  level?: 'débutant' | 'intermédiaire' | 'avancé';
  currentModule?: string;
  currentLesson?: string;
  progress?: string;
  lastQuizScore?: number;
  motivationMode?: boolean;
}
