// src/components/challenge/ChallengeCTA.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Banknote,
  Target,
  Medal,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useChallengeStatus, useIsChallengeOpen } from '../../hooks/useChallenge';
import { EnrollmentModal } from './EnrollmentModal';
import { useAuth } from '../../contexts/AuthContext';

export function ChallengeCTA() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { data: challengeStatus } = useChallengeStatus();
  const isChallengeOpen = useIsChallengeOpen();
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  const handleCTAClick = () => {
    if (!isLoggedIn) navigate('/signup');
    else if (!challengeStatus?.enrolled) setShowEnrollmentModal(true);
    else window.location.href = 'https://www.africbourse.com/communities/-challenge-afribourse-le-hub-de-lelite';
  };

  const getButtonText = () => {
    if (!isLoggedIn) return 'Participer au Concours';
    if (!challengeStatus?.enrolled) return "S'inscrire au Challenge";
    return 'Accéder à la Communauté';
  };

  const getDaysUntilLaunch = () => {
    const diff = new Date('2026-03-02T00:00:00Z').getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilLaunch();

  return (
    <>
      <style>{`
        @keyframes challengeFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-challenge-icon] { animation: none !important; }
        }
      `}</style>

      <section className="relative mx-4 sm:mx-6 lg:mx-auto max-w-7xl mt-8 md:mt-12 rounded-2xl overflow-hidden shadow-2xl">

        {/* White background */}
        <div className="absolute inset-0 bg-white" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(#f0f4f8 1px,transparent 1px),linear-gradient(90deg,#f0f4f8 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Soft orange glow top-right */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 65%)',
            transform: 'translate(30%,-30%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 px-6 py-14 md:py-20 text-center">

          {/* Trophy icon */}
          <div
            data-challenge-icon
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #F97316)',
              boxShadow: '0 0 48px rgba(249,115,22,0.45)',
              animation: 'challengeFloat 3s ease-in-out infinite',
            }}
          >
            <Trophy className="w-10 h-10 text-white" />
          </div>

          {/* Label badge */}
          <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 text-orange-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-5">
            <TrendingUp className="w-4 h-4" />
            Challenge Officiel AfriBourse 2026
          </div>

          {/* Title */}
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4 max-w-3xl mx-auto">
            Qui sera le meilleur{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
            >
              gestionnaire de portefeuille ?
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Gérez{' '}
            <span className="text-gray-900 font-bold">1 000 000 FCFA</span> virtuels,
            affrontez les meilleurs investisseurs de la zone UEMOA et gagnez jusqu'à{' '}
            <span
              className="font-extrabold text-2xl text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #FF6B35, #F7931E)' }}
            >
              10 000 000 FCFA
            </span>{' '}
            de lots réels.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { icon: Banknote, label: '1M FCFA de capital virtuel', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400' },
              { icon: Target,   label: 'Objectif top 10',            cls: 'bg-blue-50   border-blue-200   text-blue-700   hover:border-blue-400'    },
              { icon: Medal,    label: "Prix jusqu'à 10M FCFA",      cls: 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-400'  },
            ].map(({ icon: Icon, label, cls }) => (
              <div
                key={label}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border bg-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cls}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </div>
            ))}
          </div>

          {/* Countdown — only when launch is in the future and user is enrolled */}
          {!isChallengeOpen && challengeStatus?.enrolled && daysLeft > 0 && (
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-gray-700 px-5 py-2.5 rounded-full text-sm font-medium mb-8">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              Le trading ouvre le 2 mars —{' '}
              <span className="text-gray-900 font-bold ml-1">dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* CTA button */}
          <div className="mb-6">
            <button
              onClick={handleCTAClick}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-lg transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-white cursor-pointer group"
              style={{
                background: 'linear-gradient(135deg, #FF6B35, #F7931E)',
                boxShadow: '0 12px 32px rgba(255,107,53,0.40)',
              }}
            >
              {getButtonText()}
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Enrolled status */}
          {challengeStatus?.enrolled && (
            <div className="inline-flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-5 py-2.5 rounded-full text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Inscrit — {challengeStatus.validTransactions ?? 0} / 5 transactions validées
            </div>
          )}
        </div>
      </section>

      <EnrollmentModal
        isOpen={showEnrollmentModal}
        onClose={() => setShowEnrollmentModal(false)}
        onSuccess={() => {
          setShowEnrollmentModal(false);
          window.location.href = 'https://www.africbourse.com/communities/-challenge-afribourse-le-hub-de-lelite';
        }}
      />
    </>
  );
}
