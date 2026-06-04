import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const REFERRAL_LS_KEY = 'packReferralCode';
const TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 jours

export default function ParcoursPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem(
        REFERRAL_LS_KEY,
        JSON.stringify({ code: ref.toUpperCase(), capturedAt: Date.now(), ttlMs: TTL_MS })
      );
    }
    // Toujours rediriger vers la page webinaires
    navigate('/webinaires', { replace: true });
  }, []);

  return null;
}
