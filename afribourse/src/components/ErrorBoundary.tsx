// src/components/ErrorBoundary.tsx
// Filet de DERNIER RECOURS (crash du layout ou d'un provider). Les crashs de page sont
// normalement absorbés par RouteErrorBoundary, qui garde la navigation visible.
// Monté au-dessus du Router et d'AuthProvider : pas de hooks ici, on lit le rôle via errorViewer.
import { Component, ErrorInfo, ReactNode } from 'react';
import { isChunkLoadError, claimAutoReload, clearSwAndReload } from '../lib/chunkErrors';
import { isViewerAdmin } from '../lib/errorViewer';
import AdminErrorDetails from './errors/AdminErrorDetails';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    this.setState({ errorInfo });

    // Pour les chunk-load errors : tentative auto de rechargement après court délai (one-shot)
    if (isChunkLoadError(error) && claimAutoReload()) {
      console.info('[ErrorBoundary] chunk-load error détecté, SW clear + rechargement automatique');
      setTimeout(() => clearSwAndReload(), 600);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo } = this.state;
      const chunkLoad = isChunkLoadError(error);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {chunkLoad ? 'Nouvelle version disponible' : 'Oups, un petit souci'}
            </h2>
            <p className="text-gray-600 mb-6 text-sm">
              {chunkLoad
                ? 'AfriBourse vient d’être mis à jour. Rechargez la page pour continuer.'
                : 'L’application a rencontré un problème temporaire. Rechargez la page : vos données sont en sécurité.'}
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => (chunkLoad ? clearSwAndReload() : window.location.reload())}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Recharger la page
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Retour à l’accueil
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-5">
              Le problème persiste ? <a href="/contact" className="underline hover:text-gray-600">Contactez-nous</a>
            </p>

            {error && isViewerAdmin() && (
              <AdminErrorDetails error={error} componentStack={errorInfo?.componentStack} />
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
