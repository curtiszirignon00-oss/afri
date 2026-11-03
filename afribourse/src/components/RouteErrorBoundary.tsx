// src/components/RouteErrorBoundary.tsx
// Boundary au niveau de la page (dans <main>) : un crash de page laisse le Header,
// la nav mobile et le footer en place, et se réinitialise dès qu'on change de route.
// L'ErrorBoundary global reste le filet de dernier recours (crash du layout/providers).
import { Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isChunkLoadError, clearSwAndReload } from '../lib/chunkErrors';
import AdminErrorDetails from './errors/AdminErrorDetails';

interface Props {
  children: ReactNode;
  /** Changement de valeur (ex. pathname) → la boundary se réinitialise */
  resetKey: string;
}

interface State {
  error: Error | null;
  componentStack: string | null;
  retries: number;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null, retries: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RouteErrorBoundary]', error, info?.componentStack);
    this.setState({ componentStack: info?.componentStack ?? null });
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null, componentStack: null, retries: 0 });
    }
  }

  private retry = () => {
    this.setState((s) => ({ error: null, componentStack: null, retries: s.retries + 1 }));
  };

  render() {
    const { error, componentStack, retries } = this.state;
    if (!error) return this.props.children;
    return (
      <RouteErrorFallback
        error={error}
        componentStack={componentStack}
        // Après deux essais infructueux, un rechargement complet a plus de chances de réussir
        onRetry={retries < 2 && !isChunkLoadError(error) ? this.retry : null}
      />
    );
  }
}

function RouteErrorFallback({
  error,
  componentStack,
  onRetry,
}: {
  error: Error;
  componentStack: string | null;
  onRetry: (() => void) | null;
}) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const chunkLoad = isChunkLoadError(error);

  const btn = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors';

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {chunkLoad ? 'Nouvelle version disponible' : 'Cette page n’a pas pu s’afficher'}
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          {chunkLoad
            ? 'AfriBourse vient d’être mis à jour. Rechargez la page pour continuer.'
            : 'Un petit souci technique nous empêche d’afficher cette page. Réessayez, ou continuez votre navigation ailleurs.'}
        </p>

        <div className="flex flex-col gap-2">
          {onRetry ? (
            <button type="button" onClick={onRetry} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (chunkLoad ? clearSwAndReload() : window.location.reload())}
              className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}
            >
              <RefreshCw className="w-4 h-4" /> Recharger la page
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => navigate(-1)} className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <button type="button" onClick={() => navigate('/')} className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}>
              <Home className="w-4 h-4" /> Accueil
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-5">
          Le problème persiste ? <a href="/contact" className="underline hover:text-gray-600">Contactez-nous</a>
        </p>

        {isAdmin && <AdminErrorDetails error={error} componentStack={componentStack} />}
      </div>
    </div>
  );
}
