import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, ChevronDown, ChevronUp, Sparkles, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import {
  askSIMBAPortfolioAdvisor,
  sendAnalystFeedback,
  ChatMessage,
  PortfolioCtx,
} from '../services/geminiService';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  messageId?: string;
  rating?: 'up' | 'down';
}

interface SimbaPortfolioAdvisorProps {
  portfolioContext: PortfolioCtx;
}

const QUICK_SUGGESTIONS = [
  'Analyse mon portefeuille',
  'Suis-je bien diversifié ?',
  'Quelle position est la plus risquée ?',
  'Que faire avec mes liquidités ?',
  'Comment interpréter mes plus-values ?',
];

// Rendu Markdown minimaliste (gras + sauts de ligne)
function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Sauts de ligne
    return part.split('\n').map((line, j, arr) => (
      <React.Fragment key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  });
}

const SimbaPortfolioAdvisor: React.FC<SimbaPortfolioAdvisorProps> = ({ portfolioContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Bonjour ! Je suis SIMBA, ton conseiller pédagogique de portefeuille. Je vois tes positions et ton historique — pose-moi tes questions sur la gestion de ton portefeuille simulé !',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const rateMessage = (id: string, rating: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newRating = m.rating === rating ? undefined : rating;
        if (newRating && m.messageId) {
          sendAnalystFeedback(m.messageId, newRating === 'up' ? 'positive' : 'negative', 'analyst');
        }
        return { ...m, rating: newRating };
      }),
    );
  };

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;

    const userMsg: UIMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history: ChatMessage[] = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.text }));

    const { reply, messageId } = await askSIMBAPortfolioAdvisor(messageText, history, portfolioContext);

    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: reply,
        timestamp: Date.now(),
        messageId,
      },
    ]);
    setIsLoading(false);
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
              <span className="text-xs bg-yellow-400 text-yellow-900 font-semibold px-2 py-0.5 rounded-full">
                BÊTA
              </span>
            </div>
            <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" />
              Avis pédagogique sur ton portefeuille simulé
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
          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 leading-snug">
              <strong>Version bêta.</strong> Les avis de SIMBA sont pédagogiques et basés sur ton portefeuille{' '}
              <strong>simulé</strong>. Ceci ne constitue pas un conseil en investissement sur un portefeuille réel.
            </p>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'
                  }`}
                >
                  {renderMarkdown(msg.text)}
                </div>

                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div className="flex gap-1 mt-1 ml-1">
                    <button
                      onClick={() => rateMessage(msg.id, 'up')}
                      title="Réponse utile"
                      className={`p-1 rounded-full transition-colors ${
                        msg.rating === 'up'
                          ? 'text-indigo-600 bg-indigo-50'
                          : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => rateMessage(msg.id, 'down')}
                      title="Réponse insuffisante"
                      className={`p-1 rounded-full transition-colors ${
                        msg.rating === 'down'
                          ? 'text-red-500 bg-red-50'
                          : 'text-slate-300 hover:text-red-400 hover:bg-red-50'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="ml-1 text-xs text-slate-400">SIMBA analyse...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length <= 1 && (
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

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100">
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
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SimbaPortfolioAdvisor;
