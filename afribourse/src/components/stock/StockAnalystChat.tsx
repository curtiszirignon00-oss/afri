import React, { useState, useRef, useEffect } from 'react';
import { BarChart2, Send, TrendingUp, X, Zap, RotateCcw } from 'lucide-react';
import { Stock } from '../../types';
import SimbaFreeBadge from '../SimbaFreeBadge';
import SimbaMessageList from '../simba/SimbaMessageList';
import { useSimbaChat } from '../../hooks/useSimbaChat';

interface StockAnalystChatProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
  scoreContext?: string;
  initialQuestion?: string;
}

const ANALYST_SUGGESTIONS = [
  'Cette action est-elle bien valorisée ?',
  'Comparer le PER avec le secteur',
  'Quels risques surveiller ?',
  'Analyser le dividende',
];

export const StockAnalystChat: React.FC<StockAnalystChatProps> = ({ stock, isOpen, onClose, scoreContext, initialQuestion }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Une conversation mémorisée par titre ; l'historique est conservé côté serveur
  const { messages, isStreaming, status, paywallHit, hasConversation, send, resetConversation, rate } = useSimbaChat({
    kind: 'analyst',
    contextKey: stock.symbol,
    welcome: `Je suis SIMBA, votre analyste IA. Je connais les données de **${stock.company_name}** (${stock.symbol}) et votre position éventuelle sur ce titre. Posez-moi vos questions sur la valorisation, les ratios, les risques ou la stratégie.`,
    enabled: isOpen,
    extraBody: { symbol: stock.symbol, scoreContext },
    feedbackEndpoint: 'analyst',
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-envoyer la question initiale quand le chat s'ouvre
  const sentInitialRef = useRef<string | null>(null);
  useEffect(() => {
    if (isOpen && initialQuestion && sentInitialRef.current !== initialQuestion) {
      sentInitialRef.current = initialQuestion;
      send(initialQuestion);
    }
    if (!isOpen) sentInitialRef.current = null;
  }, [isOpen, initialQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isStreaming) return;
    setInput('');
    send(messageText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[400px] h-[70vh] max-h-[580px] sm:h-[580px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">SIMBA — Analyste de marché</h3>
              <SimbaFreeBadge />
            </div>
            <p className="text-xs text-emerald-100 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stock.company_name} ({stock.symbol})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasConversation && (
            <button
              onClick={resetConversation}
              title="Nouvelle conversation"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <SimbaMessageList
          messages={messages}
          accent="emerald"
          status={status}
          onRate={rate}
          paywallVerb="analyser"
          thinkingLabel="SIMBA analyse..."
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions rapides */}
      {!hasConversation && (
        <div className="px-3 pb-2 flex gap-2 flex-wrap bg-white border-t border-slate-100 pt-2">
          {ANALYST_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors border border-emerald-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-center text-[10px] text-slate-400 bg-white px-3 pb-1">
        Analyse IA — pas un conseil financier réglementé
      </p>

      {/* Input / Paywall lock */}
      <div className="p-3 bg-white border-t border-slate-100">
        {paywallHit ? (
          <a
            href="/subscriptions"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm"
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
              placeholder="Analysez, comparez, questionnez..."
              maxLength={1000}
              className="w-full pl-4 pr-12 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl text-sm transition-all outline-none placeholder:text-slate-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 p-1.5 bg-emerald-600 text-white rounded-lg disabled:opacity-50 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAnalystChat;
