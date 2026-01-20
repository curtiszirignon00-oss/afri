// src/components/challenge/RulesModal.tsx
import React, { useState } from 'react';
import { useAcceptRules } from '../../hooks/useChallenge';
import './RulesModal.css';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

const RULES = [
  {
    icon: '📅',
    title: 'Dates du Challenge',
    description: 'Du 2 février au 30 juin 2026. Les inscriptions sont ouvertes dès maintenant.',
  },
  {
    icon: '💰',
    title: 'Capital Initial',
    description: 'Chaque participant démarre avec 1 000 000 FCFA virtuels.',
  },
  {
    icon: '🚫',
    title: 'Trading Weekend Interdit',
    description: 'Le trading est interdit le samedi et dimanche pour le wallet Concours.',
  },
  {
    icon: '📊',
    title: 'Éligibilité',
    description: 'Vous devez trader au moins 5 actions différentes pour être éligible au classement final.',
  },
  {
    icon: '🏆',
    title: 'Classement',
    description: 'Le classement est basé sur la performance de votre portefeuille (gain/perte en %).',
  },
  {
    icon: '⚠️',
    title: 'Fair Play',
    description: 'Toute tentative de fraude entraînera une disqualification immédiate.',
  },
  {
    icon: '🎁',
    title: 'Prix à Gagner',
    description: 'Plus de 10 000 000 FCFA de lots réels à remporter pour les meilleurs investisseurs.',
  },
];

export function RulesModal({ isOpen, onClose, onAccept }: RulesModalProps) {
  const acceptRulesMutation = useAcceptRules();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    try {
      await acceptRulesMutation.mutateAsync();
      onAccept?.();
      onClose();
    } catch (error: any) {
      console.error('Erreur acceptation règlement:', error);
      alert(error.response?.data?.error || 'Erreur lors de l\'acceptation du règlement');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
        <button className="rules-modal-close" onClick={onClose}>
          &times;
        </button>

        <div className="rules-modal-header">
          <div className="rules-modal-icon">📋</div>
          <h2>Règlement du Challenge AfriBourse 2026</h2>
          <p>Veuillez lire attentivement le règlement avant de participer</p>
        </div>

        <div className="rules-modal-content" onScroll={handleScroll}>
          {RULES.map((rule, index) => (
            <div key={index} className="rule-item">
              <span className="rule-icon">{rule.icon}</span>
              <div className="rule-text">
                <h4>{rule.title}</h4>
                <p>{rule.description}</p>
              </div>
            </div>
          ))}

          <div className="rules-download">
            <a
              href="/docs/reglement_challenge_2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="download-link"
            >
              📄 Télécharger le règlement complet (PDF)
            </a>
          </div>
        </div>

        <div className="rules-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn-accept"
            onClick={handleAccept}
            disabled={!hasScrolledToBottom || acceptRulesMutation.isPending}
            title={!hasScrolledToBottom ? 'Veuillez lire le règlement en entier' : ''}
          >
            {acceptRulesMutation.isPending ? 'Acceptation...' : '✓ J\'accepte le règlement'}
          </button>
        </div>

        {!hasScrolledToBottom && (
          <div className="scroll-hint">
            ↓ Faites défiler pour lire le règlement complet
          </div>
        )}
      </div>
    </div>
  );
}
