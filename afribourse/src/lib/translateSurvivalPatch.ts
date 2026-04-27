// Fait survivre React aux traducteurs de navigateur (Google Translate, Edge, Samsung Internet…).
//
// Problème : quand un traducteur remplace les nœuds texte d'un élément, le DOM réel diverge du
// virtual DOM de React. Au prochain rendu, React appelle `removeChild` ou `insertBefore` sur des
// nœuds qui ne sont plus enfants du parent attendu, ce qui jette `NotFoundError: The node to be
// removed is not a child of this node`. L'erreur remonte dans l'ErrorBoundary qui affiche
// "Une erreur est survenue".
//
// On patche ces deux méthodes pour échouer en silence quand le parent ne correspond plus, ce qui
// laisse React continuer son cycle de rendu sans planter. C'est une mitigation utilisée en prod par
// plusieurs grosses apps (LinkedIn, Discord) — coût négligeable, gain de stabilité majeur sur
// mobile où l'auto-traduction est très fréquente.
//
// À appeler une seule fois, avant le premier `createRoot().render()`.

export function applyTranslateSurvivalPatch(): void {
  if (typeof Node !== 'function' || !Node.prototype) return;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn('[translate-survival] removeChild: parent mismatch, ignoré', { child, parent: this });
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  } as typeof Node.prototype.removeChild;

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn('[translate-survival] insertBefore: référence détachée, append à la place', {
          newNode,
          referenceNode,
          parent: this,
        });
      }
      // Fallback : on tente un appendChild plutôt que de jeter
      try {
        return (this as Node).appendChild(newNode) as T;
      } catch {
        return newNode;
      }
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  } as typeof Node.prototype.insertBefore;
}
