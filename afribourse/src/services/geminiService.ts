import { API_BASE_URL, authFetch } from '../config/api';
import { Stock } from '../types';

// ─── Types SIMBA ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── SIMBA — Coach IA (Groq) ──────────────────────────────────────────────────

export const askSIMBA = async (
  message: string,
  conversationHistory: ChatMessage[] = [],
): Promise<{ reply: string; provider: string }> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/ai/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory }),
    });

    if (!response.ok) {
      if (response.status === 429) return { reply: '⚠️ Limite d\'appels IA atteinte. Réessayez dans une heure.', provider: 'fallback' };
      if (response.status === 401) return { reply: '⚠️ Vous devez être connecté pour utiliser SIMBA.', provider: 'fallback' };
      return { reply: '⚠️ Une erreur est survenue. Réessayez plus tard.', provider: 'fallback' };
    }

    const data = await response.json();
    return {
      reply: data?.data?.reply || 'Désolé, je n\'ai pas pu générer de réponse.',
      provider: data?.data?.provider || 'groq',
    };
  } catch {
    return { reply: 'Une erreur est survenue. Vérifiez votre connexion ou réessayez plus tard.', provider: 'fallback' };
  }
};

// ─── SIMBA — Chat Analyste de marché (Groq + tool-calling) ───────────────────

export const askSIMBAAnalyst = async (
  message: string,
  conversationHistory: ChatMessage[] = [],
  symbol: string = '',
): Promise<{ reply: string; provider: string; messageId?: string }> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/ai/analyst`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory, symbol }),
    });

    if (!response.ok) {
      if (response.status === 429) return { reply: '⚠️ Limite d\'appels IA atteinte. Réessayez dans une heure.', provider: 'fallback' };
      if (response.status === 401) return { reply: '⚠️ Vous devez être connecté pour utiliser SIMBA.', provider: 'fallback' };
      return { reply: '⚠️ Une erreur est survenue. Réessayez plus tard.', provider: 'fallback' };
    }

    const data = await response.json();
    return {
      reply: data?.data?.reply || 'Désolé, je n\'ai pas pu générer de réponse.',
      provider: data?.data?.provider || 'groq',
      messageId: data?.data?.messageId,
    };
  } catch {
    return { reply: 'Une erreur est survenue. Vérifiez votre connexion ou réessayez plus tard.', provider: 'fallback' };
  }
};

// ─── SIMBA — Feedback 👍 / 👎 sur une réponse analyste ───────────────────────

export const sendAnalystFeedback = async (
  messageId: string,
  rating: 'positive' | 'negative',
): Promise<void> => {
  try {
    await authFetch(`${API_BASE_URL}/ai/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, rating, endpoint: 'analyst' }),
    });
  } catch {
    // fire-and-forget — ne jamais bloquer l'UX pour un feedback
  }
};

// ─── SIMBA — Analyse de marché statique (Groq) ───────────────────────────────

export const getSIMBAStockAnalysis = async (stock: Stock): Promise<string> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/ai/market-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    });

    if (!response.ok) {
      if (response.status === 429) return '⚠️ Limite d\'appels IA atteinte. Réessayez dans une heure.';
      if (response.status === 401) return '⚠️ Vous devez être connecté pour utiliser l\'analyse IA.';
      return '⚠️ Impossible de générer l\'analyse IA pour le moment. Veuillez réessayer plus tard.';
    }

    const data = await response.json();
    return data?.data?.text || 'L\'analyse n\'est pas disponible pour le moment.';
  } catch {
    return '⚠️ Impossible de générer l\'analyse IA pour le moment. Veuillez réessayer plus tard.';
  }
};

/**
 * Fonction pour demander au tuteur IA Gemini (Learning Academy)
 * La clé API Gemini est stockée uniquement côté serveur.
 */
export const askGeminiTutor = async (
  question: string,
  context: string
): Promise<string> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/ai/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      if (response.status === 429) return '⚠️ Limite d\'appels IA atteinte. Réessayez dans une heure.';
      if (response.status === 401) return '⚠️ Vous devez être connecté pour utiliser le tuteur IA.';
      return '⚠️ Une erreur est survenue. Réessayez plus tard.';
    }

    const data = await response.json();
    return data?.data?.text || 'Désolé, je n\'ai pas pu générer de réponse pour le moment.';
  } catch (error) {
    console.error('Erreur Gemini Tutor:', error);
    return 'Une erreur est survenue. Vérifiez votre connexion ou réessayez plus tard.';
  }
};

/**
 * Génère une analyse IA personnalisée pour une action donnée
 * La clé API Gemini est stockée uniquement côté serveur.
 */
export const getAIStockAnalysis = async (stock: Stock): Promise<string> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/ai/stock-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
    });

    if (!response.ok) {
      if (response.status === 429) return '⚠️ Limite d\'appels IA atteinte. Réessayez dans une heure.';
      if (response.status === 401) return '⚠️ Vous devez être connecté pour utiliser l\'analyse IA.';
      return '⚠️ Impossible de générer l\'analyse IA pour le moment. Veuillez réessayer plus tard.';
    }

    const data = await response.json();
    return data?.data?.text || 'L\'analyse n\'est pas disponible pour le moment.';
  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API IA:', error);
    return '⚠️ Impossible de générer l\'analyse IA pour le moment. Veuillez réessayer plus tard.';
  }
};
