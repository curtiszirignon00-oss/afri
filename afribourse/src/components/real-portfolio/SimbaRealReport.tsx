// src/components/real-portfolio/SimbaRealReport.tsx
// SIMBA en mode reporting factuel sur le portefeuille réel (contrainte CREPMG) :
// performance, allocation, exposition — jamais de recommandation d'achat/vente.

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, ChevronDown, ChevronUp, FileBarChart, Zap, RotateCcw } from 'lucide-react';
import SimbaFreeBadge from '../SimbaFreeBadge';
import SimbaMessageList from '../simba/SimbaMessageList';
import { useSimbaChat } from '../../hooks/useSimbaChat';

const QUICK_SUGGESTIONS = [
  'Résume ma performance',
  'Quelle est mon exposition sectorielle ?',
  'Quelles lignes pèsent le plus ?',
  "D'où vient ma plus-value latente ?",
];

export default function SimbaRealReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, status, paywallHit, hasConversation, send, resetConversation, rate } = useSimbaChat({
    kind: 'portfolio',
    contextKey: 'REAL',
    streamPath: '/ai/real-portfolio/stream',
    welcome: "Bonjour ! Je suis SIMBA. Sur ton portefeuille réel, je fais du reporting : performance, allocation, exposition et contribution de chaque ligne. Je ne formule pas de recommandation d'achat ou de vente.",
    enabled: isOpen,
    feedbackEndpoint: 'portfolio',
  });

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    setInput('');
    send(msg);
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-800 to-indigo-800 text-white hover:from-slate-700 hover:to-indigo-700 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/15 p-1.5 rounded-lg"><Bot className="w-5 h-5" /></div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">SIMBA — Reporting</span>
              <SimbaFreeBadge />
            </div>
            <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
              <FileBarChart className="w-3 h-3" /> Analyse factuelle de ton portefeuille réel
            </p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-white/80" /> : <ChevronDown className="w-5 h-5 text-white/80" />}
      </button>

      {isOpen && (
        <>
          <div className="flex items-center justify-between gap-2 px-4 py-1.5 bg-white border-b border-slate-100">
            <p className="text-[11px] text-slate-500">
              Reporting factuel sur données déclarées — ni conseil en investissement, ni recommandation personnalisée.
            </p>
            {hasConversation && (
              <button onClick={resetConversation} className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                <RotateCcw className="w-3 h-3" /> Nouvelle conversation
              </button>
            )}
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
            <SimbaMessageList messages={messages} accent="indigo" status={status} onRate={rate} paywallVerb="continuer" thinkingLabel="SIMBA calcule..." />
            <div ref={endRef} />
          </div>

          {!hasConversation && (
            <div className="px-3 pb-2 flex gap-2 flex-wrap bg-white border-t border-slate-100 pt-2">
              {QUICK_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)} className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 border border-slate-200">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 bg-white border-t border-slate-100">
            {paywallHit ? (
              <a href="/subscriptions" className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3 rounded-xl">
                <Zap className="w-4 h-4" /> Passer à Premium pour continuer
              </a>
            ) : (
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ex : quelle part de ma performance vient de SNTS ?"
                  maxLength={1000}
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm outline-none placeholder:text-slate-400"
                />
                <button onClick={() => handleSend()} disabled={!input.trim() || isStreaming} className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50" aria-label="Envoyer">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
