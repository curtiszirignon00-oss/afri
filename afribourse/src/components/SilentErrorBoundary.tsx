import { Component, ErrorInfo, ReactNode } from 'react';

// ErrorBoundary "silencieuse" pour les composants non critiques (popups différés,
// prompts PWA, modales d'onboarding…). Si leur chargement lazy échoue ou si elles
// jettent à l'exécution, on ignore l'erreur — le composant n'est juste pas affiché.
//
// Sans ça, l'échec d'un dynamic import() pour un composant secondaire remonte jusqu'à
// l'ErrorBoundary principal et cache TOUTE l'application derrière l'écran d'erreur,
// alors que l'app fonctionne très bien sans le popup.

interface Props {
  children: ReactNode;
  name?: string; // pour les logs
}

interface State {
  hasError: boolean;
}

export default class SilentErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(
      `[SilentErrorBoundary${this.props.name ? ` · ${this.props.name}` : ''}] composant ignoré suite à une erreur :`,
      error,
      info?.componentStack
    );
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
