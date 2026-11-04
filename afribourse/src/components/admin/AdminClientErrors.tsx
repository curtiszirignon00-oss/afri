import { useEffect, useState } from 'react';
import { Bug, RefreshCw, Loader2, Search, CheckCircle2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

// Erreurs remontées automatiquement par le front (cf. lib/errorReporter.ts),
// groupées par empreinte côté backend (services/clientErrors.service.ts).

interface ClientErrorItem {
  id: string;
  kind: string;
  name: string | null;
  message: string;
  stack: string | null;
  componentStack: string | null;
  route: string;
  release: string | null;
  count: number;
  usersCount: number;
  codes: string[];
  lastUserEmail: string | null;
  lastUserAgent: string | null;
  resolved: boolean;
  firstSeen: string;
  lastSeen: string;
}

type Status = 'open' | 'resolved' | 'all';

const KIND_LABELS: Record<string, { label: string; cls: string }> = {
  route: { label: 'Page', cls: 'bg-amber-100 text-amber-800' },
  render: { label: 'App entière', cls: 'bg-red-100 text-red-800' },
  silent: { label: 'Composant masqué', cls: 'bg-slate-100 text-slate-700' },
  window: { label: 'JS', cls: 'bg-violet-100 text-violet-800' },
  unhandledrejection: { label: 'Promesse', cls: 'bg-blue-100 text-blue-800' },
};

function fmt(d: string) {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function shortUA(ua: string | null) {
  if (!ua) return '';
  const os = ua.match(/iPhone OS [\d_]+|Android [\d.]+|Windows NT [\d.]+|Mac OS X [\d_]+/)?.[0]?.replace(/_/g, '.') ?? '';
  const br = ua.match(/(SamsungBrowser|CriOS|FBAN|Instagram|Edg|Chrome|Firefox|Version)\/[\d.]+/)?.[0] ?? '';
  return [os, br.replace('Version/', 'Safari/')].filter(Boolean).join(' · ');
}

export default function AdminClientErrors() {
  const [items, setItems] = useState<ClientErrorItem[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [seen24h, setSeen24h] = useState(0);
  const [status, setStatus] = useState<Status>('open');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchErrors = async (q = query) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/client-errors', { params: { status, q: q || undefined } });
      const data = res.data.data;
      setItems(data?.items ?? []);
      setOpenCount(data?.openCount ?? 0);
      setSeen24h(data?.seen24h ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchErrors(); }, [status]);

  const toggleResolved = async (item: ClientErrorItem) => {
    setUpdating(item.id);
    try {
      await apiClient.patch(`/admin/client-errors/${item.id}`, { resolved: !item.resolved });
      await fetchErrors();
    } catch { /* ignore */ }
    finally { setUpdating(null); }
  };

  return (
    <div className="mt-10">
      <div className="bg-gradient-to-r from-amber-600 to-red-600 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Bug className="w-6 h-6" />
              Erreurs côté utilisateurs
            </h2>
            <p className="text-amber-100 text-sm">
              Remontées automatiquement depuis les navigateurs. Un utilisateur qui contacte le support avec un code AB-XXXX peut être retrouvé ici.
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-3xl font-bold text-white">{openCount}</p>
              <p className="text-amber-200 text-xs">à traiter</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{seen24h}</p>
              <p className="text-amber-200 text-xs">vues sur 24 h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
            {(['open', 'resolved', 'all'] as Status[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1 rounded-md ${status === s ? 'bg-white shadow-sm font-semibold text-gray-900' : 'text-gray-500'}`}
              >
                {s === 'open' ? 'À traiter' : s === 'resolved' ? 'Résolues' : 'Toutes'}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); fetchErrors(query); }}
            className="flex items-center gap-2 flex-1 min-w-[200px]"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Code AB-XXXX, message, page ou email"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </form>
          <button onClick={() => fetchErrors()} className="p-2 text-gray-500 hover:text-gray-800" title="Actualiser">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>

        {!loading && items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {status === 'open' ? 'Aucune erreur à traiter 🎉' : 'Aucune erreur'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => {
              const kind = KIND_LABELS[item.kind] ?? { label: item.kind, cls: 'bg-gray-100 text-gray-700' };
              const isOpen = expanded === item.id;
              return (
                <li key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setExpanded(isOpen ? null : item.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${kind.cls}`}>{kind.label}</span>
                        <span className="text-xs font-mono text-gray-500">{item.route}</span>
                        {item.resolved && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-800">Résolue</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {item.name && item.name !== 'Error' ? `${item.name} : ` : ''}{item.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>{item.count}</strong> fois · {item.usersCount} utilisateur(s) connecté(s) · dernière le {fmt(item.lastSeen)} · première le {fmt(item.firstSeen)}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleResolved(item)}
                        disabled={updating === item.id}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border disabled:opacity-50 ${
                          item.resolved
                            ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {item.resolved ? <><RotateCcw className="w-3.5 h-3.5" /> Rouvrir</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Résolu</>}
                      </button>
                      <button onClick={() => setExpanded(isOpen ? null : item.id)} className="p-1 text-gray-400">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 space-y-2 text-xs text-gray-700">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div><span className="text-gray-400">Dernier utilisateur :</span> {item.lastUserEmail ?? 'visiteur non connecté'}</div>
                        <div><span className="text-gray-400">Appareil :</span> {shortUA(item.lastUserAgent) || '—'}</div>
                        <div><span className="text-gray-400">Version :</span> <span className="font-mono">{item.release ?? '—'}</span></div>
                        <div className="break-words"><span className="text-gray-400">Codes récents :</span> <span className="font-mono">{item.codes.slice(-8).join(', ') || '—'}</span></div>
                      </div>
                      {item.lastUserAgent && (
                        <div className="font-mono text-[10px] text-gray-400 break-all">{item.lastUserAgent}</div>
                      )}
                      {item.stack && (
                        <pre className="p-2 bg-gray-50 border border-gray-200 rounded text-[10px] overflow-x-auto whitespace-pre-wrap">{item.stack}</pre>
                      )}
                      {item.componentStack && (
                        <details>
                          <summary className="cursor-pointer text-gray-500">Composants</summary>
                          <pre className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-[10px] overflow-x-auto whitespace-pre-wrap">{item.componentStack}</pre>
                        </details>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
