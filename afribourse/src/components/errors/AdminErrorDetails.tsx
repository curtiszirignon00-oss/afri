// src/components/errors/AdminErrorDetails.tsx
// Détails techniques d'une erreur de rendu — affichés UNIQUEMENT aux admins
// (le parent décide). Ouvert par défaut : l'admin veut voir l'erreur tout de suite.

interface Props {
  error: Error;
  componentStack?: string | null;
}

export default function AdminErrorDetails({ error, componentStack }: Props) {
  const copy = () => {
    const text = [
      `${error.name || 'Error'}: ${error.message}`,
      `URL: ${window.location.href}`,
      `UA: ${navigator.userAgent}`,
      error.stack ?? '',
      componentStack ?? '',
    ].join('\n\n');
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-gray-700 text-left break-words">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-semibold text-amber-800">Détails techniques (visible par les admins)</span>
        <button type="button" onClick={copy} className="text-amber-700 underline shrink-0">
          Copier
        </button>
      </div>
      <div className="font-semibold">{error.name || 'Error'}</div>
      <div className="font-mono whitespace-pre-wrap">{error.message}</div>
      {error.stack && (
        <details className="mt-2">
          <summary className="cursor-pointer text-gray-500">Stack</summary>
          <pre className="mt-1 text-[10px] overflow-x-auto whitespace-pre-wrap">{error.stack}</pre>
        </details>
      )}
      {componentStack && (
        <details className="mt-2">
          <summary className="cursor-pointer text-gray-500">Composants</summary>
          <pre className="mt-1 text-[10px] overflow-x-auto whitespace-pre-wrap">{componentStack}</pre>
        </details>
      )}
    </div>
  );
}
