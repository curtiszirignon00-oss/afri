import { Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import config from '../config/environnement';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const MODEL = 'gemini-2.0-flash-exp';

export async function askTutor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { question, context } = req.body as { question?: string; context?: string };
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Le champ question est requis.' });
    }
    if (question.length > 1000) {
      return res.status(400).json({ success: false, message: 'La question est trop longue (max 1000 caractères).' });
    }

    const safeContext = typeof context === 'string' ? context.slice(0, 2000) : '';

    const prompt = `
      Tu es un expert financier pédagogique spécialisé dans la Bourse Régionale des Valeurs Mobilières (BRVM) et l'investissement en Afrique de l'Ouest.
      Ton rôle est d'aider un étudiant qui apprend les bases de la bourse.

      Contexte actuel de la leçon :
      "${safeContext}"

      Règles :
      1. Réponds de manière concise, encourageante et simple (max 150 mots).
      2. Utilise des analogies locales (marché, agriculture, commerce) si possible pour expliquer les concepts.
      3. Si la question porte sur la leçon, utilise le contexte fourni.
      4. Si la question est hors sujet, ramène poliment l'utilisateur vers l'investissement.
      5. Ne donne pas de conseils d'investissement spécifiques (ex: "achète Sonatel"), mais explique les mécanismes.
      6. Formate ta réponse de manière claire et lisible.

      Question de l'étudiant : "${question.trim()}"
    `;

    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ success: true, data: { text: text || 'Désolé, je n\'ai pas pu générer de réponse.' } });
  } catch (error) {
    next(error);
  }
}

export async function analyzeStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { stock } = req.body as { stock?: Record<string, unknown> };
    if (!stock || typeof stock !== 'object') {
      return res.status(400).json({ success: false, message: 'Les données de l\'action sont requises.' });
    }

    const { company_name, symbol, sector, current_price, daily_change_percent, market_cap, volume, description } = stock as any;

    if (!company_name || !symbol) {
      return res.status(400).json({ success: false, message: 'company_name et symbol sont requis.' });
    }

    const prompt = `
      Agis comme un expert financier senior spécialisé dans la Bourse Régionale des Valeurs Mobilières (BRVM).

      Analyse brièvement l'entreprise suivante pour un investisseur débutant :
      Nom: ${String(company_name).slice(0, 100)} (${String(symbol).slice(0, 20)})
      Secteur: ${sector ? String(sector).slice(0, 100) : 'Non spécifié'}
      Prix Actuel: ${Number(current_price) || 0} FCFA
      Variation: ${Number(daily_change_percent)?.toFixed(2) || '0'}%
      Capitalisation: ${market_cap ? (Number(market_cap) / 1_000_000_000).toFixed(2) + ' Mds FCFA' : 'Non disponible'}
      Volume: ${volume ? Number(volume).toLocaleString() : 'Non disponible'}
      Description: ${description ? String(description).slice(0, 500) : 'Non disponible'}

      Fournis une "Note d'Analyse Rapide" (max 150 mots) structurée ainsi :
      1. **Contexte**: Qu'est-ce qui pourrait influencer ce secteur actuellement ?
      2. **Point de Vigilance**: Un risque potentiel.
      3. **Conseil Éducatif**: Un concept clé à surveiller pour cette action spécifique.

      Reste neutre, professionnel, mais encourageant pour l'apprentissage. Formate la réponse en Markdown.
    `;

    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ success: true, data: { text: text || 'L\'analyse n\'est pas disponible pour le moment.' } });
  } catch (error) {
    next(error);
  }
}
