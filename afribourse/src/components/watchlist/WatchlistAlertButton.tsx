// src/components/watchlist/WatchlistAlertButton.tsx
import { useState, useRef, useEffect } from 'react';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, X, Loader2 } from 'lucide-react';
import { usePriceAlerts, useCreatePriceAlert, useDeletePriceAlert } from '../../hooks/usePriceAlerts';

interface Props {
  ticker: string;
  currentPrice: number | null;
  isDark?: boolean;
}

export default function WatchlistAlertButton({ ticker, currentPrice, isDark = true }: Props) {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Utilise le cache global des alertes (1 seule requête partagée entre toutes les cartes)
  // au lieu de useStockAlerts(ticker) qui ferait 1 requête par carte.
  const { data: allAlerts = [], isLoading } = usePriceAlerts();
  const alerts = allAlerts.filter(a => a.stock_ticker === ticker);
  const createMut = useCreatePriceAlert();
  const deleteMut = useDeletePriceAlert();

  const activeAlerts = alerts.filter(a => a.is_active);
  const hasAlerts = activeAlerts.length > 0;

  useEffect(() => {
    if (open && currentPrice && !targetPrice) {
      setTargetPrice(currentPrice.toFixed(0));
    }
  }, [open, currentPrice]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  function handleCreate() {
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) return;
    createMut.mutate(
      { stockTicker: ticker, alertType, targetPrice: price, notifyInApp: true, notifyEmail: true },
      { onSuccess: () => { setTargetPrice(''); setOpen(false); } }
    );
  }

  // Theme-aware classes for popover
  const pop = isDark ? {
    box:    'bg-slate-800 border-slate-700',
    title:  'text-slate-200',
    closeBtn: 'text-slate-500 hover:text-slate-300',
    alertRow: 'bg-slate-700/50',
    alertTxt: 'text-slate-200',
    delBtn:   'text-slate-500 hover:text-red-400',
    empty:    'text-slate-500',
    divider:  'border-slate-700',
    secTitle: 'text-slate-500',
    typeOff:  'bg-slate-700 text-slate-400 hover:bg-slate-600',
    border:   'border-slate-600',
    field:    'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-500 focus:border-cyan-500',
    addBtn:   'bg-cyan-500 hover:bg-cyan-400 text-white',
    priceHint:'text-slate-500',
  } : {
    box:    'bg-white border-gray-100',
    title:  'text-gray-900',
    closeBtn: 'text-gray-400 hover:text-gray-600',
    alertRow: 'bg-gray-50',
    alertTxt: 'text-gray-800',
    delBtn:   'text-gray-400 hover:text-red-500',
    empty:    'text-gray-400',
    divider:  'border-gray-100',
    secTitle: 'text-gray-500',
    typeOff:  'bg-white text-gray-500 hover:bg-gray-50',
    border:   'border-gray-200',
    field:    'bg-white border-gray-200 text-gray-800 placeholder-gray-300 focus:border-blue-400',
    addBtn:   'bg-blue-600 hover:bg-blue-700 text-white',
    priceHint:'text-gray-400',
  };

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative p-1.5 rounded-lg transition-colors cursor-pointer ${
          hasAlerts
            ? 'text-amber-500 hover:bg-amber-50'
            : isDark
              ? 'text-slate-600 hover:bg-slate-700 opacity-0 group-hover:opacity-100'
              : 'text-gray-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
        }`}
        title={hasAlerts ? `${activeAlerts.length} alerte(s) active(s)` : 'Créer une alerte'}
      >
        <Bell className={`w-4 h-4 ${hasAlerts ? 'fill-amber-200' : ''}`} />
        {hasAlerts && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className={`absolute right-0 top-8 z-50 w-64 rounded-2xl shadow-2xl border p-4 space-y-3 ${pop.box}`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-bold uppercase tracking-wide ${pop.title}`}>
              Alertes — {ticker}
            </p>
            <button onClick={() => setOpen(false)} className={`cursor-pointer ${pop.closeBtn}`}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Existing alerts */}
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : activeAlerts.length > 0 ? (
            <div className="space-y-1.5">
              {activeAlerts.map(alert => (
                <div key={alert.id} className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 ${pop.alertRow}`}>
                  <div className="flex items-center gap-1.5">
                    {alert.alert_type === 'ABOVE'
                      ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                    <span className={`text-xs font-semibold ${pop.alertTxt}`}>
                      {alert.alert_type === 'ABOVE' ? '≥' : '≤'}{' '}
                      {new Intl.NumberFormat('fr-FR').format(alert.target_price)} FCFA
                    </span>
                  </div>
                  <button
                    onClick={() => deleteMut.mutate(alert.id)}
                    disabled={deleteMut.isPending}
                    className={`p-0.5 cursor-pointer transition-colors ${pop.delBtn}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-xs text-center py-1 ${pop.empty}`}>Aucune alerte active</p>
          )}

          <div className={`border-t ${pop.divider}`} />

          {/* New alert */}
          <div className="space-y-2">
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${pop.secTitle}`}>Nouvelle alerte</p>

            <div className={`flex rounded-xl overflow-hidden border ${pop.border}`}>
              <button
                onClick={() => setAlertType('ABOVE')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  alertType === 'ABOVE' ? 'bg-emerald-500 text-white' : pop.typeOff
                }`}
              >
                <TrendingUp className="w-3 h-3" /> Au-dessus
              </button>
              <button
                onClick={() => setAlertType('BELOW')}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  alertType === 'BELOW' ? 'bg-red-500 text-white' : pop.typeOff
                }`}
              >
                <TrendingDown className="w-3 h-3" /> En-dessous
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Prix cible (FCFA)"
                className={`flex-1 border rounded-xl px-3 py-1.5 text-xs outline-none transition-colors ${pop.field}`}
              />
              <button
                onClick={handleCreate}
                disabled={createMut.isPending || !targetPrice}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1 cursor-pointer transition-colors ${pop.addBtn}`}
              >
                {createMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </button>
            </div>

            {currentPrice && (
              <p className={`text-[10px] ${pop.priceHint}`}>
                Prix actuel : {new Intl.NumberFormat('fr-FR').format(currentPrice)} FCFA
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
