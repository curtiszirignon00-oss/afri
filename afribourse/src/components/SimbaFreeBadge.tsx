// Offre de lancement : SIMBA gratuit et sans quota jusqu'au 1er novembre 2026.
// Le badge disparaît automatiquement à partir de cette date (aucun déploiement requis).
const SIMBA_FREE_UNTIL = new Date('2026-11-01T00:00:00Z');

export function isSimbaFreePeriod(now: Date = new Date()): boolean {
  return now < SIMBA_FREE_UNTIL;
}

export default function SimbaFreeBadge() {
  if (!isSimbaFreePeriod()) return null;
  return (
    <span
      className="text-[10px] leading-none bg-yellow-400 text-yellow-900 font-semibold px-2 py-1 rounded-full whitespace-nowrap"
      title="Toutes les fonctions SIMBA sont gratuites et illimitées jusqu'au 1er novembre"
    >
      Gratuit jusqu'au 1er nov.
    </span>
  );
}
