import { Brain, Loader2, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  message: string | null;
  loading: boolean;
  mode?: 'intro' | 'feedback' | 'recap';
  onRequest?: () => void;
  buttonLabel?: string;
}

const MODE_CONFIG = {
  intro:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    muted: 'text-blue-500',   btn: 'bg-blue-500 hover:bg-blue-400 text-white',    avatar: 'bg-blue-100 border-blue-200',    icon: 'text-blue-500' },
  feedback: { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-900',  muted: 'text-violet-500', btn: 'bg-violet-600 hover:bg-violet-500 text-white', avatar: 'bg-violet-100 border-violet-200', icon: 'text-violet-500' },
  recap:    { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-900',   muted: 'text-amber-600',  btn: 'bg-amber-500 hover:bg-amber-400 text-white',  avatar: 'bg-amber-100 border-amber-200',  icon: 'text-amber-500' },
};

export default function KofiBubble({ message, loading, mode = 'feedback', onRequest, buttonLabel }: Props) {
  const cfg = MODE_CONFIG[mode];

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${cfg.avatar} border flex items-center justify-center shrink-0`}>
          <Brain className={`w-4 h-4 ${cfg.icon}`} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>Simba</p>
            <Sparkles className={`w-3 h-3 ${cfg.muted}`} />
          </div>
          <p className="text-[10px] text-gray-400">Analyste IA BRVM</p>
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

      {/* Animated request button */}
      {onRequest && !loading && (
        <button
          onClick={onRequest}
          className={`group relative overflow-hidden flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:shadow-md cursor-pointer ${cfg.btn}`}
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-600 pointer-events-none" />
          {message ? <RefreshCw className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
          {buttonLabel ?? "Demander l'analyse Simba"}
        </button>
      )}
    </div>
  );
}
