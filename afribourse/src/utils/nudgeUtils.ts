// src/utils/nudgeUtils.ts
// Utilitaires visuels pour le système de nudges

function injectPulseStyles() {
  if (document.getElementById('nudge-pulse-styles')) return;
  const style = document.createElement('style');
  style.id = 'nudge-pulse-styles';
  style.textContent = `
    @keyframes nudge-ring-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.7); outline-color: rgba(59,130,246,0.9); }
      60%  { box-shadow: 0 0 0 10px rgba(59,130,246,0);  outline-color: rgba(59,130,246,0.6); }
      100% { box-shadow: 0 0 0 0 rgba(59,130,246,0);  outline-color: rgba(59,130,246,0); }
    }
    .nudge-pulse-active {
      animation: nudge-ring-pulse 0.55s ease-out 4 !important;
      outline: 2px solid rgba(59,130,246,0.9) !important;
      outline-offset: 3px;
      position: relative;
      z-index: 1;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Fait scintiller l'élément DOM ayant l'ID donné pendant ~2 secondes.
 * Scroll optionnel vers l'élément avant le pulse.
 */
export function pulseElement(id: string, scrollTo = false) {
  injectPulseStyles();
  const el = document.getElementById(id);
  if (!el) return;
  if (scrollTo) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  el.classList.remove('nudge-pulse-active');
  // Force reflow pour réinitialiser l'animation si elle est déjà en cours
  void el.offsetHeight;
  el.classList.add('nudge-pulse-active');
  setTimeout(() => el.classList.remove('nudge-pulse-active'), 2400);
}
