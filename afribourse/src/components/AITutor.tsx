import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, ThumbsUp, ThumbsDown, X, Lock, Zap } from 'lucide-react';
import { askGeminiTutor, sendAnalystFeedback, ChatMessage, TutorUserContext } from '../services/geminiService';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  messageId?: string;
  rating?: 'up' | 'down';
  paywallHit?: boolean;
}

interface AITutorProps {
  userContext: TutorUserContext;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_SUGGESTIONS = [
  "C'est quoi la BRVM ?",
  'Comment diversifier ?',
  'Expliquer le PER',
];

export const AITutor: React.FC<AITutorProps> = ({ userContext, isOpen, onClose }) => {
  const moduleLabel = userContext.currentModule ?? 'ce module';

  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Je suis SIMBA, ton tuteur Afribourse. Tu étudies **${moduleLabel}** — pose-moi tes questions !`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paywallHit, setPaywallHit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Réinitialiser quand le module change
  useEffect(() => {
    const label = userContext.currentModule ?? 'ce module';
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `Je suis SIMBA, ton tuteur Afribourse. Tu étudies **${label}** — pose-moi tes questions !`,
        timestamp: Date.now(),
      },
    ]);
  }, [userContext.currentModule]);

  const rateMessage = (id: string, rating: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newRating = m.rating === rating ? undefined : rating;
        if (newRating && m.messageId) {
          sendAnalystFeedback(m.messageId, newRating === 'up' ? 'positive' : 'negative', 'tutor');
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

    const { reply, messageId, paywallHit: hit } = await askGeminiTutor(messageText, history, userContext);

    if (hit) {
      setPaywallHit(true);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: '',
        timestamp: Date.now(),
        paywallHit: true,
      }]);
    } else {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: reply,
        timestamp: Date.now(),
        messageId,
      }]);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[360px] h-[70vh] max-h-[520px] sm:h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">SIMBA — Tuteur Afribourse</h3>
            <p className="text-xs text-blue-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {userContext.currentModule ?? 'Learning Academy'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {/* Carte paywall */}
            {msg.paywallHit ? (
              <div className="w-full max-w-[92%] bg-gradient-to-br from-blue-950 to-indigo-900 rounded-2xl p-4 shadow-lg border border-blue-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-yellow-400/20 p-1.5 rounded-lg">
                    <Lock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">Quota journalier atteint</span>
                </div>
                <p className="text-blue-200 text-xs leading-relaxed mb-3">
                  Tu as utilisé tes <strong className="text-white">4 questions gratuites</strong> aujourd'hui.<br />
                  Pour continuer à apprendre avec SIMBA sans limite, passe à la formule <strong className="text-yellow-400">Premium</strong>.
                </p>
                <a
                  href="/subscriptions"
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-300 hover:to-orange-300 text-slate-900 font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Passer à Premium
                </a>
                <p className="text-blue-400 text-[10px] text-center mt-2">↻ Tes questions gratuites se réinitialisent demain</p>
              </div>
            ) : (
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            )}

            {/* Boutons de vote — uniquement sur les réponses de SIMBA (hors welcome) */}
            {msg.role === 'assistant' && msg.id !== 'welcome' && !msg.paywallHit && (
              <div className="flex gap-1 mt-1 ml-1">
                <button
                  onClick={() => rateMessage(msg.id, 'up')}
                  title="Réponse utile"
                  className={`p-1 rounded-full transition-colors ${
                    msg.rating === 'up'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'
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
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="ml-1 text-xs text-slate-400">SIMBA réfléchit...</span>
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
            disabled={!input.trim() || isLoading}
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
