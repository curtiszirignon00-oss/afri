// afribourse/src/components/pwa/OfflineBanner.tsx
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black px-4 py-2 flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">
        Mode hors ligne - Certaines fonctionnalites sont limitees
      </span>
    </div>
  );
}
