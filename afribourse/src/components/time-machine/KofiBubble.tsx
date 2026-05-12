import { Brain, Loader2, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  message: string | null;
  loading: boolean;
  mode?: 'intro' | 'feedback' | 'recap';
  onRequest?: () => void;
  buttonLabel?: string;
}

const MODE_CONFIG = {
  intro:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/25',    text: 'text-blue-300',    muted: 'text-blue-400/70',   btn: 'bg-blue-500 hover:bg-blue-400',     avatar: 'bg-blue-500/20 border-blue-500/30',    icon: 'text-blue-300' },
  feedback: { bg: 'bg-violet-500/10',  border: 'border-violet-500/25',  text: 'text-violet-200',  muted: 'text-violet-400/70', btn: 'bg-violet-600 hover:bg-violet-500',  avatar: 'bg-violet-500/20 border-violet-500/30', icon: 'text-violet-300' },
  recap:    { bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   text: 'text-amber-200',   muted: 'text-amber-400/70',  btn: 'bg-amber-500 hover:bg-amber-400',   avatar: 'bg-amber-500/20 border-amber-500/30',   icon: 'text-amber-300' },
};

export default function KofiBubble({ message, loading, mode = 'feedback', onRequest, buttonLabel }: Props) {
  const cfg = MODE_CONFIG[mode];

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 space-y-3 backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${cfg.avatar} border flex items-center justify-center shrink-0`}>
          <Brain className={`w-4.5 h-4.5 ${cfg.icon}`} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>Simba</p>
            <Sparkles className={`w-3 h-3 ${cfg.muted}`} />
          </div>
          <p className="text-[10px] text-slate-500">Analyste IA BRVM</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2.5 py-1">
          <Loader2 className={`w-4 h-4 animate-spin ${cfg.icon}`} />
          <span className={`text-sm ${cfg.muted}`}>Analyse en cours…</span>
        </div>
      ) : message ? (
        <div
          className={`text-sm ${cfg.text} leading-relaxed whitespace-pre-line`}
          dangerouslySetInnerHTML={{ __html: message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
        />
      ) : null}

      {/* Request button */}
      {onRequest && !loading && (
        <button
          onClick={onRequest}
          className={`flex items-center gap-2 text-xs font-bold text-slate-900 px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg cursor-pointer ${cfg.btn}`}
        >
          {message ? <RefreshCw className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
          {buttonLabel ?? "Demander l'analyse Simba"}
        </button>
      )}
    </div>
  );
}
