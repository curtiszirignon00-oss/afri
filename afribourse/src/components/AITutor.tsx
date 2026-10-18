import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, Zap, RotateCcw } from 'lucide-react';
import { TutorUserContext } from '../services/geminiService';
import SimbaFreeBadge from './SimbaFreeBadge';
import SimbaMessageList from './simba/SimbaMessageList';
import { useSimbaChat } from '../hooks/useSimbaChat';

interface AITutorProps {
  userContext: TutorUserContext;
  isOpen: boolean;
  onClose: () => void;
  motivationMode?: boolean;
}

const QUICK_SUGGESTIONS = [
  "C'est quoi la BRVM ?",
  'Comment diversifier ?',
  'Expliquer le PER',
];

const MOTIVATION_WELCOME = `Félicitations pour ton premier module ! 🎉

Dis-moi — qu'est-ce qui t'a motivé à apprendre sur la BRVM et les marchés financiers africains ?`;

export const AITutor: React.FC<AITutorProps> = ({ userContext, isOpen, onClose, motivationMode = false }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const moduleLabel = userContext.currentModule ?? 'ce module';

  // Une conversation mémorisée par module (et une dédiée au mode motivation)
  const { messages, isStreaming, status, paywallHit, hasConversation, send, resetConversation, rate } = useSimbaChat({
    kind: 'tutor',
    contextKey: motivationMode ? 'motivation' : (userContext.currentModule ?? 'general'),
    welcome: motivationMode
      ? MOTIVATION_WELCOME
      : `Je suis SIMBA, ton tuteur Afribourse. Tu étudies **${moduleLabel}** — pose-moi tes questions !`,
    enabled: isOpen,
    extraBody: { userContext: { ...userContext, motivationMode: motivationMode || undefined } },
    feedbackEndpoint: 'tutor',
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isStreaming) return;
    setInput('');
    send(messageText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] h-[70vh] max-h-[560px] sm:h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">SIMBA — {motivationMode ? 'Coach Motivation' : 'Tuteur Afribourse'}</h3>
              <SimbaFreeBadge />
            </div>
            <p className="text-xs text-blue-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {motivationMode ? 'Premier module complété 🎉' : (userContext.currentModule ?? 'Learning Academy')}
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
          accent="blue"
          status={status}
          onRate={rate}
          paywallVerb="apprendre"
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions rapides — masquées en mode motivation (SIMBA pose la question) */}
      {!hasConversation && !motivationMode && (
        <div className="px-3 pb-2 flex gap-2 flex-wrap bg-white border-t border-slate-100 pt-2">
          {QUICK_SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-100"
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
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-sm"
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
            placeholder="Posez une question sur ce module..."
            maxLength={1000}
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm transition-all outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

export default AITutor;
