// src/lib/polyfills.ts
// Importé EN PREMIER dans main.tsx : les imports ES sont évalués dans l'ordre,
// donc tout ce qui suit voit déjà ces correctifs.

// Object.hasOwn (Safari < 15.4, vieilles WebViews Android) : appelé au rendu par
// recharts 3 et react-markdown 10 → « Object.hasOwn is not a function ».
if (typeof (Object as { hasOwn?: unknown }).hasOwn !== 'function') {
  Object.defineProperty(Object, 'hasOwn', {
    value: (obj: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, key),
    configurable: true,
    writable: true,
  });
}

// Stockage web : null dans certaines WebViews (DOM storage désactivé), SecurityError
// quand les cookies sont bloqués. On teste en LECTURE seulement — un stockage plein
// reste lisible et ne doit pas être remplacé (on perdrait la session).
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    removeItem: (k: string) => { data.delete(k); },
    setItem: (k: string, v: string) => { data.set(k, String(v)); },
  };
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  let usable = false;
  try {
    const s = window[name];
    s.getItem('__afb_probe__');
    usable = true;
  } catch { /* indisponible */ }
  if (!usable) {
    try {
      Object.defineProperty(window, name, { value: createMemoryStorage(), configurable: true });
    } catch { /* tant pis : les appels protégés par try/catch continueront de fonctionner */ }
  }
}

// Quota plein (ou Safari privé ancien) : setItem jette QuotaExceededError. Aucune
// fonctionnalité n'en dépend — on ignore l'écriture au lieu de faire tomber la page.
try {
  const nativeSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key: string, value: string) {
    try {
      nativeSetItem.call(this, key, value);
    } catch (err) {
      console.warn('[storage] écriture ignorée :', key, err);
    }
  };
} catch { /* Storage absent */ }
