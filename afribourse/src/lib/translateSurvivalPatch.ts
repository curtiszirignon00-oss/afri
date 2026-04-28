// Fait survivre React aux traducteurs de navigateur (Google Translate, Edge, Samsung Internet…).
//
// Problème : quand un traducteur remplace les nœuds texte d'un élément, le DOM réel diverge du
// virtual DOM de React. Au prochain rendu, React appelle `removeChild` ou `insertBefore` sur des
// nœuds qui ne sont plus enfants du parent attendu, ce qui jette `NotFoundError`.
//
// On patche ces deux méthodes pour devenir des no-op silencieux quand le parent ne correspond
// plus, ce qui permet à React de continuer son cycle. Au prochain rendu cohérent, React
// rectifiera le DOM.
//
// Version canonique (cf. React issue #11538) — pas de fallback `appendChild`, qui pourrait
// déplacer le nœud à une position inattendue et faire diverger le virtual DOM davantage.
//
// À appeler une seule fois, avant le premier `createRoot().render()`.

export function applyTranslateSurvivalPatch(): void {
  if (typeof Node !== 'function' || !Node.prototype) return;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      // Nœud déjà retiré (probablement par un traducteur). On ignore.
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
      // Référence détachée. On ne tente PAS d'appendChild en fallback : ça déplacerait
      // le nœud à une position que React ne s'attend pas, créant des bugs en cascade.
      // React détectera le mismatch et rectifiera au prochain cycle.
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  } as typeof Node.prototype.insertBefore;
}
