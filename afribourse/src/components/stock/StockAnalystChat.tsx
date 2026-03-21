import React, { useState, useRef, useEffect } from 'react';
import { BarChart2, Send, TrendingUp, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { askSIMBAAnalyst, sendAnalystFeedback, ChatMessage } from '../../services/geminiService';
import { Stock } from '../../types';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  rating?: 'up' | 'down';
  messageId?: string; // ID backend pour persister le feedback
}

interface StockAnalystChatProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
}

const ANALYST_SUGGESTIONS = [
  'Cette action est-elle bien valorisée ?',
  'Comparer le PER avec le secteur',
  'Quels risques surveiller ?',
  'Analyser le dividende',
];

export const StockAnalystChat: React.FC<StockAnalystChatProps> = ({ stock, isOpen, onClose }) => {
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Je suis SIMBA, votre analyste IA. Je connais les données de **${stock.company_name}** (${stock.symbol}). Posez-moi vos questions sur la valorisation, les ratios, les risques ou la stratégie.`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Réinitialiser le chat quand l'action change
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `Je suis SIMBA, votre analyste IA. Je connais les données de **${stock.company_name}** (${stock.symbol}). Posez-moi vos questions sur la valorisation, les ratios, les risques ou la stratégie.`,
        timestamp: Date.now(),
      },
    ]);
  }, [stock.symbol]);

  const rateMessage = (id: string, rating: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const newRating = m.rating === rating ? undefined : rating;
        // Envoi au backend (fire-and-forget) uniquement si on active un rating
        if (newRating && m.messageId) {
          sendAnalystFeedback(m.messageId, newRating === 'up' ? 'positive' : 'negative');
        }
        return { ...m, rating: newRating };
      })
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

    const { reply, messageId } = await askSIMBAAnalyst(messageText, history, stock.symbol);

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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[380px] h-[540px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">SIMBA — Analyste de marché</h3>
            <p className="text-xs text-emerald-100 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stock.company_name} ({stock.symbol})
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
            <div
              className={`max-w-[88%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-sm'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
            {msg.role === 'assistant' && msg.id !== 'welcome' && (
              <div className="flex gap-1 mt-1 ml-1">
                <button
                  onClick={() => rateMessage(msg.id, 'up')}
                  title="Utile"
                  className={`p-1 rounded-full transition-colors ${
                    msg.rating === 'up'
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => rateMessage(msg.id, 'down')}
                  title="Pas utile"
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
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100">
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
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 bg-emerald-600 text-white rounded-lg disabled:opacity-50 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAnalystChat;
