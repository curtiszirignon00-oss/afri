import { GoogleGenerativeAI } from "@google/generative-ai";
import { Stock } from "../types";

// Initialiser le client Gemini avec la clé API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

/**
 * Fonction pour demander au tuteur IA Gemini (Learning Academy)
 * @param question - Question de l'étudiant
 * @param context - Contexte du module en cours
 * @returns Réponse du tuteur IA
 */
export const askGeminiTutor = async (
  question: string,
  context: string
): Promise<string> => {
  try {
    // Vérifier si la clé API est configurée
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return "⚠️ Clé API Gemini non configurée. Veuillez ajouter votre clé dans les variables d'environnement.";
    }

    // Construction du prompt système
    const systemPrompt = `
      Tu es un expert financier pédagogique spécialisé dans la Bourse Régionale des Valeurs Mobilières (BRVM) et l'investissement en Afrique de l'Ouest.
      Ton rôle est d'aider un étudiant qui apprend les bases de la bourse.

      Contexte actuel de la leçon :
      "${context}"

      Règles :
      1. Réponds de manière concise, encourageante et simple (max 150 mots).
      2. Utilise des analogies locales (marché, agriculture, commerce) si possible pour expliquer les concepts.
      3. Si la question porte sur la leçon, utilise le contexte fourni.
      4. Si la question est hors sujet, ramène poliment l'utilisateur vers l'investissement.
      5. Ne donne pas de conseils d'investissement spécifiques (ex: "achète Sonatel"), mais explique les mécanismes.
      6. Formate ta réponse de manière claire et lisible.

      Question de l'étudiant : "${question}"
    `;

    // Appel à l'API Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    return text || "Désolé, je n'ai pas pu générer de réponse pour le moment.";
  } catch (error) {
    console.error("Erreur Gemini Tutor:", error);

    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        return "⚠️ Clé API Gemini invalide ou non configurée.";
      }
      if (error.message.includes('quota') || error.message.includes('rate')) {
        return "⚠️ Quota API dépassé. Veuillez réessayer plus tard.";
      }
    }

    return "Une erreur est survenue. Vérifiez votre connexion ou réessayez plus tard.";
  }
};

/**
 * Génère une analyse IA personnalisée pour une action donnée
 * @param stock - Objet contenant les données de l'action
 * @returns Analyse formatée en Markdown
 */
export const getAIStockAnalysis = async (stock: Stock): Promise<string> => {
  try {
    // Vérifier si la clé API est configurée
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return "⚠️ Clé API Gemini non configurée. Veuillez ajouter votre clé dans les variables d'environnement (VITE_GEMINI_API_KEY).";
    }

    // Construction du prompt structuré
    const prompt = `
      Agis comme un expert financier senior spécialisé dans la Bourse Régionale des Valeurs Mobilières (BRVM).

      Analyse brièvement l'entreprise suivante pour un investisseur débutant :
      Nom: ${stock.company_name} (${stock.symbol})
      Secteur: ${stock.sector || 'Non spécifié'}
      Prix Actuel: ${stock.current_price} FCFA
      Variation: ${stock.daily_change_percent?.toFixed(2) || '0'}%
      Capitalisation: ${stock.market_cap ? (stock.market_cap / 1_000_000_000).toFixed(2) + ' Mds FCFA' : 'Non disponible'}
      Volume: ${stock.volume?.toLocaleString() || 'Non disponible'}
      Description: ${stock.description || 'Non disponible'}

      Fournis une "Note d'Analyse Rapide" (max 150 mots) structurée ainsi :
      1. **Contexte**: Qu'est-ce qui pourrait influencer ce secteur actuellement ?
      2. **Point de Vigilance**: Un risque potentiel.
      3. **Conseil Éducatif**: Un concept clé à surveiller pour cette action spécifique.

      Reste neutre, professionnel, mais encourageant pour l'apprentissage. Formate la réponse en Markdown.
    `;

    // Appel à l'API Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text || "L'analyse n'est pas disponible pour le moment.";
  } catch (error) {
    console.error("Erreur lors de l'appel à l'API Gemini:", error);

    // Gestion d'erreurs spécifiques
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('API_KEY')) {
        return "⚠️ Clé API Gemini invalide ou non configurée. Veuillez vérifier votre clé dans les variables d'environnement.";
      }
      if (error.message.includes('quota') || error.message.includes('rate')) {
        return "⚠️ Quota API dépassé. Veuillez réessayer plus tard.";
      }
      return `⚠️ Erreur lors de la génération de l'analyse: ${error.message}`;
    }

    return "⚠️ Impossible de générer l'analyse IA pour le moment. Veuillez réessayer plus tard.";
  }
};
