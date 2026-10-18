import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Lock, ThumbsDown, ThumbsUp, Zap } from 'lucide-react';
import type { SimbaUIMessage } from '../../hooks/useSimbaChat';

// Classes Tailwind écrites en entier (pas de concaténation) pour être conservées au build
const ACCENTS = {
  emerald: {
    user: 'bg-emerald-600 text-white',
    dot: 'bg-emerald-400',
    up: 'text-emerald-600 bg-emerald-50',
    upHover: 'hover:text-emerald-500 hover:bg-emerald-50',
    paywall: 'from-emerald-950 to-teal-900 border-emerald-800/50',
    paywallText: 'text-emerald-200',
    paywallFoot: 'text-emerald-400',
  },
  blue: {
    user: 'bg-blue-600 text-white',
    dot: 'bg-blue-400',
    up: 'text-blue-600 bg-blue-50',
    upHover: 'hover:text-blue-500 hover:bg-blue-50',
    paywall: 'from-blue-950 to-indigo-900 border-blue-800/50',
    paywallText: 'text-blue-200',
    paywallFoot: 'text-blue-400',
  },
  indigo: {
    user: 'bg-indigo-600 text-white',
    dot: 'bg-indigo-400',
    up: 'text-indigo-600 bg-indigo-50',
    upHover: 'hover:text-indigo-500 hover:bg-indigo-50',
    paywall: 'from-indigo-950 to-blue-900 border-indigo-800/50',
    paywallText: 'text-indigo-200',
    paywallFoot: 'text-indigo-400',
  },
} as const;

export type SimbaAccent = keyof typeof ACCENTS;

// Markdown complet (GFM : tableaux, listes, gras…) adapté à une bulle de chat étroite
const MARKDOWN_COMPONENTS = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2 -mx-1">
      <table className="min-w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold whitespace-nowrap">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-b border-slate-100 px-2 py-1 align-top">{children}</td>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline">{children}</a>
  ),
};

export function SimbaMarkdown({ text }: { text: string }) {
  return (
    <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-sm text-slate-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS as any}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

interface SimbaMessageListProps {
  messages: SimbaUIMessage[];
  accent: SimbaAccent;
  status: string | null;
  onRate: (id: string, rating: 'up' | 'down') => void;
  /** « analyser », « apprendre »… pour la carte de quota */
  paywallVerb: string;
  thinkingLabel?: string;
}

export default function SimbaMessageList({ messages, accent, status, onRate, paywallVerb, thinkingLabel = 'SIMBA réfléchit...' }: SimbaMessageListProps) {
  const a = ACCENTS[accent];

  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
          {msg.paywallHit ? (
            <div className={`w-full max-w-[92%] bg-gradient-to-br rounded-2xl p-4 shadow-lg border ${a.paywall}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-yellow-400/20 p-1.5 rounded-lg">
                  <Lock className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-white font-semibold text-sm">Quota journalier atteint</span>
              </div>
              <p className={`${a.paywallText} text-xs leading-relaxed mb-3`}>
                Tu as utilisé tes <strong className="text-white">4 questions gratuites</strong> aujourd'hui.<br />
                Pour continuer à {paywallVerb} avec SIMBA sans limite, passe à la formule <strong className="text-yellow-400">Premium</strong>.
              </p>
              <a
                href="/subscriptions"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 text-slate-900 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                Passer à Premium
              </a>
              <p className={`${a.paywallFoot} text-[10px] text-center mt-2`}>↻ Tes questions gratuites se réinitialisent demain</p>
            </div>
          ) : msg.role === 'user' ? (
            <div className={`max-w-[88%] p-3 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${a.user}`}>
              {msg.text}
            </div>
          ) : msg.streaming && !msg.text ? (
            // En attente du premier mot : statut de l'outil en cours ou indicateur de réflexion
            <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex gap-1 items-center">
                <span className={`w-2 h-2 rounded-full animate-bounce ${a.dot}`} />
                <span className={`w-2 h-2 rounded-full animate-bounce ${a.dot}`} style={{ animationDelay: '0.1s' }} />
                <span className={`w-2 h-2 rounded-full animate-bounce ${a.dot}`} style={{ animationDelay: '0.2s' }} />
                <span className="ml-1 text-xs text-slate-400">{status ?? thinkingLabel}</span>
              </div>
            </div>
          ) : (
            <div className="max-w-[92%] p-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed shadow-sm bg-white border border-slate-100">
              <SimbaMarkdown text={msg.text} />
              {msg.streaming && <span className={`inline-block w-1.5 h-3.5 ml-0.5 align-middle animate-pulse ${a.dot}`} />}
            </div>
          )}

          {msg.role === 'assistant' && msg.id !== 'welcome' && !msg.paywallHit && !msg.streaming && msg.messageId && (
            <div className="flex gap-1 mt-1 ml-1">
              <button
                onClick={() => onRate(msg.id, 'up')}
                title="Réponse utile"
                className={`p-1 rounded-full transition-colors ${msg.rating === 'up' ? a.up : `text-slate-300 ${a.upHover}`}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRate(msg.id, 'down')}
                title="Réponse insuffisante"
                className={`p-1 rounded-full transition-colors ${msg.rating === 'down' ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-400 hover:bg-red-50'}`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
