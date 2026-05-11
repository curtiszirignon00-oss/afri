import { Brain, Loader2, RefreshCw } from 'lucide-react';

interface Props {
  message: string | null;
  loading: boolean;
  mode?: 'intro' | 'feedback' | 'recap';
  onRequest?: () => void;
  buttonLabel?: string;
}

const MODE_CONFIG = {
  intro:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    btn: 'bg-blue-600 hover:bg-blue-700' },
  feedback: { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-800',  btn: 'bg-indigo-600 hover:bg-indigo-700' },
  recap:    { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-800',  btn: 'bg-purple-600 hover:bg-purple-700' },
};

export default function KofiBubble({ message, loading, mode = 'feedback', onRequest, buttonLabel }: Props) {
  const cfg = MODE_CONFIG[mode];

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white border-2 border-current flex items-center justify-center shadow-sm">
          <Brain className={`w-4 h-4 ${cfg.text}`} />
        </div>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${cfg.text}`}>KOFI</p>
          <p className="text-[10px] text-gray-400">Votre conseiller IA</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className={`w-4 h-4 animate-spin ${cfg.text}`} />
          <span className={`text-sm ${cfg.text}`}>Analyse en cours…</span>
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
          className={`flex items-center gap-2 text-xs font-semibold text-white px-4 py-2 rounded-lg transition-colors ${cfg.btn}`}
        >
          {message ? <RefreshCw className="w-3.5 h-3.5" /> : <Brain className="w-3.5 h-3.5" />}
          {buttonLabel ?? 'Demander l\'analyse KOFI'}
        </button>
      )}
    </div>
  );
}
