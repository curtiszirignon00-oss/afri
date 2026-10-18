// src/components/real-portfolio/share.ts
// Partage du portefeuille réel : uniquement des pourcentages, jamais de
// montants ni de quantités (patrimoine réel = donnée sensible).
import toast from 'react-hot-toast';

export async function sharePercentOnly(text: string): Promise<void> {
  const url = 'https://africbourse.com';
  try {
    if (navigator.share) {
      await navigator.share({ text, url });
      return;
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    toast.success('Texte copié (pourcentages uniquement).');
  } catch {
    // partage annulé par l'utilisateur
  }
}
