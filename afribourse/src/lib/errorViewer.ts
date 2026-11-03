// src/lib/errorViewer.ts
// Qui regarde l'écran d'erreur ? Les détails techniques (message, stack) ne sont
// montrés qu'aux admins. L'ErrorBoundary global est monté AU-DESSUS d'AuthProvider
// et ne peut pas appeler useAuth() : AuthProvider recopie donc le rôle ici.
// Purement cosmétique — un non-admin qui verrait sa propre stack ne risque rien.

let viewerIsAdmin = false;

export function setViewerIsAdmin(isAdmin: boolean): void {
  viewerIsAdmin = isAdmin;
}

export function isViewerAdmin(): boolean {
  return viewerIsAdmin;
}
