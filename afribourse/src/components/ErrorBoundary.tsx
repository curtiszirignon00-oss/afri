// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

// Détecte les erreurs spécifiques de chargement de chunk lazy (réseau flaky, deploy en cours)
function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message || '';
  const name = error.name || '';
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /is not a valid javascript mime type/i.test(msg)
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });

    // Pour les chunk-load errors : tentative auto de rechargement après court délai (one-shot)
    if (isChunkLoadError(error)) {
      const KEY = 'afribourse_chunk_reload_attempt';
      const lastAttempt = Number(sessionStorage.getItem(KEY) || 0);
      const now = Date.now();
      // Anti-boucle : pas plus d'un reload auto par 30s
      if (now - lastAttempt > 30_000) {
        sessionStorage.setItem(KEY, String(now));
        console.info('[ErrorBoundary] chunk-load error détecté, rechargement automatique');
        setTimeout(() => window.location.reload(), 600);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails } = this.state;
      const chunkLoad = isChunkLoadError(error);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
              Une erreur est survenue
            </h2>
            <p className="text-gray-600 mb-4 text-sm text-center">
              {chunkLoad
                ? 'Un module de l\'application n\'a pas pu être chargé. Cela peut arriver après une mise à jour ou avec une connexion instable. Rechargez la page.'
                : 'Un problème temporaire est apparu. Rechargez la page pour continuer.'}
            </p>

            {error && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  {showDetails ? 'Masquer les détails' : 'Afficher les détails techniques'}
                </button>
                {showDetails && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 break-words">
                    <div className="font-semibold mb-1">{error.name || 'Error'}</div>
                    <div className="font-mono whitespace-pre-wrap">{error.message}</div>
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-gray-500">Stack</summary>
                        <pre className="mt-1 text-[10px] overflow-x-auto whitespace-pre-wrap">{error.stack}</pre>
                      </details>
                    )}
                    {errorInfo?.componentStack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-gray-500">Composants</summary>
                        <pre className="mt-1 text-[10px] overflow-x-auto whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
