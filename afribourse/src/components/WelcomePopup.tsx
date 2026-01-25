// src/components/WelcomePopup.tsx
import { useState, useEffect } from 'react';
import { X, Rocket, Gift, BookOpen, Wallet, Star, Sparkles } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import confetti from 'canvas-confetti';

interface WelcomePopupData {
  badge: {
    name: string;
    icon: string;
    description: string;
    rarity: string;
  };
  bonusCapital: number;
  bonusXp: number;
  modulesUnlocked: number;
  portfolioBalance: number;
}

interface WelcomePopupProps {
  onClose: () => void;
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  const [data, setData] = useState<WelcomePopupData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkWelcomePopup();
  }, []);

  const checkWelcomePopup = async () => {
    try {
      const response = await apiClient.get('/users/welcome-popup');
      if (response.data.show) {
        setData(response.data.data);
        setIsVisible(true);
        // Lancer les confettis
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f97316', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'],
          });
        }, 300);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du popup:', error);
    }
  };

  const handleDismiss = async () => {
    try {
      await apiClient.post('/users/welcome-popup/dismiss');
      setIsVisible(false);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la fermeture du popup:', error);
      setIsVisible(false);
      onClose();
    }
  };

  if (!isVisible || !data) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-amber-400 via-yellow-500 to-orange-500';
      case 'epic':
        return 'from-purple-500 to-indigo-600';
      case 'rare':
        return 'from-blue-400 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
        {/* Header avec gradient */}
        <div className={`bg-gradient-to-r ${getRarityColor(data.badge.rarity)} p-6 text-center relative overflow-hidden`}>
          {/* Particules décoratives */}
          <div className="absolute inset-0 opacity-30">
            <Sparkles className="absolute top-4 left-4 w-6 h-6 text-white animate-pulse" />
            <Sparkles className="absolute top-8 right-8 w-4 h-4 text-white animate-pulse delay-100" />
            <Sparkles className="absolute bottom-4 left-12 w-5 h-5 text-white animate-pulse delay-200" />
            <Star className="absolute top-6 right-4 w-5 h-5 text-white animate-spin-slow" />
          </div>

          {/* Badge icon */}
          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 ring-4 ring-white/30 shadow-lg">
              <span className="text-5xl">{data.badge.icon}</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Bienvenue, Pionnier !
            </h2>
            <p className="text-white/90 text-sm">
              Merci pour votre fidélité
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Message explicatif */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              Suite à une maintenance technique, nous avons restauré votre compte.
              Pour vous remercier de votre patience, voici vos cadeaux de bienvenue :
            </p>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getRarityColor(data.badge.rarity)} flex items-center justify-center shadow-lg`}>
              <span className="text-2xl">{data.badge.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900">{data.badge.name}</h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full uppercase">
                  {data.badge.rarity}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{data.badge.description}</p>
            </div>
          </div>

          {/* Bonus grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Capital bonus */}
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <Wallet className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-700">+500K</div>
              <div className="text-xs text-green-600">FCFA</div>
            </div>

            {/* XP bonus */}
            <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
              <Star className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-700">+{data.bonusXp}</div>
              <div className="text-xs text-purple-600">XP</div>
            </div>

            {/* Modules */}
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-700">{data.modulesUnlocked}</div>
              <div className="text-xs text-blue-600">Modules</div>
            </div>
          </div>

          {/* Nouveau solde */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Votre nouveau solde</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.portfolioBalance)}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleDismiss}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Rocket className="w-5 h-5" />
            C'est parti !
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
