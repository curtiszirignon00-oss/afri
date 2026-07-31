import { useEffect, useState } from 'react';
import { isPromoActive, promoRemainingMs, formatCountdown } from '../utils/promo';

/** Compte à rebours live de la promo. Retourne { active, ms, label }. */
export function usePromoCountdown() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isPromoActive(now)) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ms = promoRemainingMs(now);
  return { active: ms > 0, ms, label: formatCountdown(ms) };
}
