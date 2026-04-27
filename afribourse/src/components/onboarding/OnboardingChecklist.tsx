import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp, ArrowRight, Trophy } from 'lucide-react';
import { useOnboardingGuideContext } from '../../context/OnboardingGuideContext';

const ITEMS = [
  { key: 'cours' as const, label: 'Lire un cours', route: '/learn' },
  { key: 'quiz' as const, label: 'Faire un quiz', route: '/learn' },
  { key: 'achat' as const, label: 'Acheter une action', route: '/markets' },
];

export default function OnboardingChecklist() {
  const navigate = useNavigate();
  const { isActive, steps, completedCount, isComplete, isChecklistVisible } = useOnboardingGuideContext();
  const [collapsed, setCollapsed] = useState(false);

  if (!isActive || !isChecklistVisible) return null;

  const progress = (completedCount / 3) * 100;

  return (
    <>
      <div
        className="fixed z-40 rounded-xl shadow-xl border border-gray-200 bg-white overflow-hidden"
        style={{
          bottom: '24px',
          right: '24px',
          width: '220px',
          animation: 'ob-slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-white text-sm font-semibold"
          style={{ backgroundColor: '#0A1628' }}
        >
          <span>Premiers Pas</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal opacity-75">{completedCount}/3</span>
            {collapsed ? (
              <ChevronUp className="w-3.5 h-3.5 opacity-75" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 opacity-75" />
            )}
          </div>
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#00D4A8' }}
          />
        </div>

        {/* Body */}
        {!collapsed && (
          <div className="p-2">
            {isComplete ? (
              <div className="flex flex-col items-center gap-2 py-3 text-center">
                <Trophy className="w-8 h-8" style={{ color: '#00D4A8' }} />
                <p className="text-xs font-semibold text-gray-800">Parcours terminé !</p>
                <p className="text-xs text-gray-500">Bravo, tu es prêt(e) à investir</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {ITEMS.map(({ key, label, route }) => {
                  const done = steps[key];
                  return (
                    <li key={key}>
                      <button
                        disabled={done}
                        onClick={() => navigate(route)}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs transition-colors ${
                          done
                            ? 'text-gray-400 cursor-default'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                            done
                              ? 'border-transparent'
                              : 'border-gray-300'
                          }`}
                          style={done ? { backgroundColor: '#00D4A8' } : {}}
                        >
                          {done && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </span>
                        <span className={done ? 'line-through' : ''}>{label}</span>
                        {!done && (
                          <ArrowRight className="w-3 h-3 ml-auto text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ob-slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
