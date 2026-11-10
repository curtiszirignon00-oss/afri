// Appel à rejoindre le groupe WhatsApp — encarts statiques (pas de popup).
// variant="card"   : encart complet (fin d'article, tableau de bord)
// variant="footer" : lien compact pour le pied de page sombre
import { WHATSAPP_GROUP_URL } from '../config/whatsapp';
import { metaPixel } from '../utils/metaPixel';

type Placement = 'article' | 'dashboard' | 'footer';

interface Props {
  placement: Placement;
  variant?: 'card' | 'footer';
  className?: string;
}

function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.3 11.3 0 0 0 12.05.7C5.79.7.7 5.79.7 12.04c0 2 .52 3.95 1.52 5.67L.6 23.3l5.72-1.5a11.3 11.3 0 0 0 5.72 1.46h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.31-8z" />
    </svg>
  );
}

export default function WhatsAppGroupCTA({ placement, variant = 'card', className = '' }: Props) {
  const onClick = () => {
    try { metaPixel.lead(`whatsapp_group_${placement}`); } catch { /* tracking non bloquant */ }
  };

  if (variant === 'footer') {
    return (
      <a
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={`inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 text-sm font-medium transition-colors ${className}`}
      >
        <WhatsAppIcon className="w-4 h-4" />
        Rejoindre le groupe WhatsApp
      </a>
    );
  }

  return (
    <div className={`rounded-2xl border border-[#25D366]/30 bg-gradient-to-br from-[#25D366]/10 to-emerald-50 p-5 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center">
            <WhatsAppIcon />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">Suivez la BRVM au quotidien sur WhatsApp</p>
            <p className="text-sm text-slate-600 mt-0.5">
              Clôture du jour, plus fortes hausses et baisses, nouveaux articles. Gratuit.
            </p>
          </div>
        </div>
        <a
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5a] text-white font-semibold text-sm shadow-sm transition-colors"
        >
          <WhatsAppIcon className="w-4 h-4" />
          Rejoindre le groupe
        </a>
      </div>
    </div>
  );
}
