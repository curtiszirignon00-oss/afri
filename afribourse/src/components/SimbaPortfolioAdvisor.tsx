import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, ChevronDown, ChevronUp, Sparkles, Zap, RotateCcw } from 'lucide-react';
import SimbaFreeBadge from './SimbaFreeBadge';
import SimbaMessageList from './simba/SimbaMessageList';
import { useSimbaChat } from '../hooks/useSimbaChat';

interface SimbaPortfolioAdvisorProps {
  walletType: 'SANDBOX' | 'CONCOURS';
}

const QUICK_SUGGESTIONS = [
  'Fais le diagnostic complet de mon portefeuille',
  'Mon portefeuille correspond-il à mon profil ?',
  'Suis-je trop concentré sur un titre ou un secteur ?',
  'Analyse les fondamentaux de ma plus grosse position',
  'Que faire avec mes liquidités ?',
];

const SimbaPortfolioAdvisor: React.FC<SimbaPortfolioAdvisorProps> = ({ walletType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Une conversation mémorisée par type de portefeuille (apprentissage / Challenge)
  const { messages, isStreaming, status, paywallHit, hasConversation, send, resetConversation, rate } = useSimbaChat({
    kind: 'portfolio',
    contextKey: walletType,
    welcome: 'Bonjour ! Je suis SIMBA, ton conseiller portefeuille. Je vois tes positions, ta répartition par secteur, tes dernières transactions et ton profil investisseur, et je peux consulter les données BRVM de chaque titre. Pose-moi ta question !',
    enabled: isOpen,
    extraBody: { walletType },
    feedbackEndpoint: 'portfolio',
  });

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isStreaming) return;
    setInput('');
    send(messageText);
  };

  return (
    <div className="border border-indigo-100 rounded-2xl overflow-hidden shadow-sm bg-white">
      {/* Header — toujours visible, cliquable pour ouvrir/fermer */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">SIMBA — Conseiller Portefeuille</span>
              <SimbaFreeBadge />
            </div>
            <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" />
              Diagnostic personnalisé selon ton profil et les données BRVM
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-white/80" />
        ) : (
          <ChevronDown className="w-5 h-5 text-white/80" />
        )}
      </button>

      {isOpen && (
        <>
          {/* Mention légale discrète + nouvelle conversation */}
          <div className="flex items-center justify-between gap-2 px-4 py-1.5 bg-white border-b border-slate-100">
            <p className="text-[11px] text-slate-400">
              Analyse éducative sur portefeuille simulé, pas un conseil en investissement réglementé.
            </p>
            {hasConversation && (
              <button
                onClick={resetConversation}
                className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
              >
                <RotateCcw className="w-3 h-3" />
                Nouvelle conversation
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-50">
            <SimbaMessageList
              messages={messages}
              accent="indigo"
              status={status}
              onRate={rate}
              paywallVerb="continuer"
              thinkingLabel="SIMBA analyse..."
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {!hasConversation && (
            <div className="px-3 pb-2 flex gap-2 flex-wrap bg-white border-t border-slate-100 pt-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input / Paywall lock */}
          <div className="p-3 bg-white border-t border-slate-100">
            {paywallHit ? (
              <a
                href="/subscriptions"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm"
              >
                <Zap className="w-4 h-4" />
                Passer à Premium pour continuer
              </a>
            ) : (
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ex: Comment gérer ma perte sur ETIT ?"
                  maxLength={1000}
                  className="w-full pl-4 pr-12 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl text-sm transition-all outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SimbaPortfolioAdvisor;
