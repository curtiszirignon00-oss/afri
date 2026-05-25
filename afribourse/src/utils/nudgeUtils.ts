// src/utils/nudgeUtils.ts
// Utilitaires visuels actifs pour le système de nudges — purement DOM, sans dépendances React

// ─── Flash bouton ─────────────────────────────────────────────────────────────
// Fait clignoter le fond du bouton en ambre 3 fois via inline styles.
// Les inline styles passent au-dessus de toutes les classes CSS et ne peuvent
// pas être masqués par overflow:hidden sur les parents.
export function flashButton(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const origBg = el.style.backgroundColor;
  const origTransform = el.style.transform;
  const origBoxShadow = el.style.boxShadow;

  let count = 0;

  function pulse() {
    el!.style.transition = 'background-color 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease';
    el!.style.backgroundColor = '#f59e0b';
    el!.style.transform = 'scale(1.18)';
    el!.style.boxShadow = '0 0 0 6px rgba(245,158,11,0.45)';

    setTimeout(() => {
      el!.style.backgroundColor = origBg;
      el!.style.transform = origTransform;
      el!.style.boxShadow = origBoxShadow;
      count++;
      if (count < 3) setTimeout(pulse, 180);
      else el!.style.transition = '';
    }, 220);
  }

  pulse();
}

// ─── Mise en évidence d'une section ──────────────────────────────────────────
// Entoure le panel d'un cadre bleu et d'un fond légèrement coloré pendant 3 s.
export function highlightSection(id: string, scrollTo = true) {
  const el = document.getElementById(id);
  if (!el) return;

  if (scrollTo) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const origBorder = el.style.border;
  const origBg = el.style.backgroundColor;
  const origBoxShadow = el.style.boxShadow;
  const origBorderRadius = el.style.borderRadius;

  el.style.transition = 'all 0.25s ease';
  el.style.border = '2px solid #3b82f6';
  el.style.backgroundColor = 'rgba(59,130,246,0.07)';
  el.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.18)';
  el.style.borderRadius = '12px';

  setTimeout(() => {
    el.style.border = origBorder;
    el.style.backgroundColor = origBg;
    el.style.boxShadow = origBoxShadow;
    el.style.borderRadius = origBorderRadius;
    setTimeout(() => { el.style.transition = ''; }, 300);
  }, 3200);
}

// ─── Focus input ──────────────────────────────────────────────────────────────
export function focusInput(id: string) {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) {
    el.focus();
    el.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.5)';
    setTimeout(() => { el.style.boxShadow = ''; }, 2500);
  }
}

// ─── Pulse (compatibilité ascendante) ────────────────────────────────────────
export function pulseElement(id: string, scrollTo = false) {
  flashButton(id);
  if (scrollTo) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
