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
    <div className="glass-card glass-adapt rounded-3xl overflow-hidden">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-white hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/15 border border-white/15 p-1.5 rounded-full text-orange-200"><Bot className="w-5 h-5" /></div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">SIMBA — Reporting</span>
              <SimbaFreeBadge />
            </div>
            <p className="text-xs text-white/60 flex items-center gap-1 mt-0.5">
              <FileBarChart className="w-3 h-3" /> Analyse factuelle de ton portefeuille réel
            </p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-white/80" /> : <ChevronDown className="w-5 h-5 text-white/80" />}
      </button>

      {isOpen && (
        <>
          <div className="flex items-center justify-between gap-2 px-4 py-1.5 border-y border-white/10">
            <p className="text-[11px] text-white/50">
              Reporting factuel sur données déclarées — ni conseil en investissement, ni recommandation personnalisée.
            </p>
            {hasConversation && (
              <button onClick={resetConversation} className="flex items-center gap-1 text-[11px] text-orange-300 hover:text-orange-200 whitespace-nowrap">
                <RotateCcw className="w-3 h-3" /> Nouvelle conversation
              </button>
            )}
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-black/10">
            <SimbaMessageList messages={messages} accent="indigo" status={status} onRate={rate} paywallVerb="continuer" thinkingLabel="SIMBA calcule..." />
            <div ref={endRef} />
          </div>

          {!hasConversation && (
            <div className="px-3 pb-2 flex gap-2 flex-wrap border-t border-white/10 pt-2">
              {QUICK_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)} className="glass-pill text-xs px-3 py-1.5 text-white/85 rounded-full hover:bg-white/20">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-white/10">
            {paywallHit ? (
              <a href="/subscriptions" className="flex items-center justify-center gap-2 w-full bg-white text-stone-900 hover:bg-white/90 font-semibold text-sm py-3 rounded-full">
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
                  className="glass-input w-full pl-4 pr-12 py-3 rounded-full text-sm"
                />
                <button onClick={() => handleSend()} disabled={!input.trim() || isStreaming} className="absolute right-2 p-1.5 bg-white text-stone-900 rounded-full disabled:opacity-40" aria-label="Envoyer">
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
