import { useEffect, useState } from 'react';
import { Users, MousePointer, Eye, Smartphone, TrendingUp, Target, BookOpen, Activity, AlertTriangle } from 'lucide-react';

// ─── Types Stats classiques ───────────────────────────────────────────────────
interface AnalyticsData {
  period: { days: number; startDate: string; endDate: string };
  overview: {
    totalPageViews: number;
    totalActions: number;
    totalFeatureUses: number;
    uniqueActiveUsers: number;
  };
  topPages: Array<{ path: string; title: string; views: number; avgDuration: number }>;
  topActions: Array<{ type: string; name: string; count: number }>;
  featureUsage: Array<{
    name: string; type: string; totalUses: number;
    accessGranted: number; blockedByPaywall: number; conversionRate: number;
  }>;
  deviceBreakdown: Array<{ deviceType: string; count: number }>;
}

// ─── Types Cohortes ───────────────────────────────────────────────────────────
interface RetentionSlot { eligible: number; retained: number; rate: number | null }
interface CohortData {
  period: { cohortWindowDays: number; from: string; to: string };
  overview: { totalSignups: number; usersWithActions: number; usersWithPageViews: number };
  retentionFunnel: { d1: RetentionSlot; d7: RetentionSlot; d30: RetentionSlot };
  firstActionDistribution: Array<{ action_type: string; action_name: string; count: number; percentage: number }>;
  dropoffPages: Array<{ page_path: string; users_last_seen_here: number; percentage: number }>;
  churnedD1Count: number;
  engagementTime: {
    learning: {
      total_sessions: number; unique_users: number;
      avg_seconds_per_session: number; total_minutes_from_progress: number; avg_minutes_per_user: number;
    };
    simulator: {
      total_sessions: number; unique_users: number;
      avg_seconds_per_session: number; total_trades: number; avg_trades_per_user: number;
    };
  };
  ahaSignals: {
    methodology: string; eligible_d7: number; retained_d7: number; churned_d7: number;
    signals: Array<{
      action_type: string; action_name: string;
      retained_rate: number; churned_rate: number; lift: number; verdict: string;
    }>;
  };
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const RateBar = ({ value, color = 'bg-blue-500' }: { value: number; color?: string }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
    <span className="text-sm font-semibold text-gray-800 w-10 text-right">{value}%</span>
  </div>
);

const RetentionCard = ({ label, slot, color }: { label: string; slot: RetentionSlot; color: string }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
    <p className={`text-4xl font-bold ${color} mb-2`}>
      {slot.rate !== null ? `${slot.rate}%` : '—'}
    </p>
    <p className="text-sm text-gray-500">
      {slot.retained} / {slot.eligible} utilisateurs éligibles
    </p>
    <div className="mt-3">
      <RateBar value={slot.rate ?? 0} color={color.replace('text-', 'bg-')} />
    </div>
  </div>
);

const VerdictBadge = ({ verdict }: { verdict: string }) => {
  const colors: Record<string, string> = {
    'Fort signal': 'bg-green-100 text-green-800',
    'Signal modéré': 'bg-yellow-100 text-yellow-800',
    'Faible': 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[verdict] ?? colors['Faible']}`}>
      {verdict}
    </span>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AdminAnalyticsDashboard() {
  const [tab, setTab] = useState<'stats' | 'cohort'>('stats');

  // Stats classiques
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [days, setDays] = useState(7);

  // Cohortes
  const [cohort, setCohort] = useState<CohortData | null>(null);
  const [loadingCohort, setLoadingCohort] = useState(false);
  const [cohortWindow, setCohortWindow] = useState(90);
  const [errorCohort, setErrorCohort] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setError(null);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/analytics/stats?days=${days}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erreur stats');
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchCohort = async () => {
    try {
      setLoadingCohort(true);
      setErrorCohort(null);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/analytics/cohort?window=${cohortWindow}`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('Erreur cohort');
      const result = await res.json();
      setCohort(result.data);
    } catch (err) {
      setErrorCohort(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoadingCohort(false);
    }
  };

  useEffect(() => { if (tab === 'stats') fetchStats(); }, [tab, days]);
  useEffect(() => { if (tab === 'cohort') fetchCohort(); }, [tab, cohortWindow]);

  const tabs = [
    { id: 'stats' as const, label: 'Stats globales', icon: BarChart },
    { id: 'cohort' as const, label: 'Analyse cohortes', icon: Target },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Comportement</h1>
        <p className="mt-1 text-gray-500">Comprendre comment les utilisateurs interagissent avec la plateforme</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          ONGLET STATS
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'stats' && (
        <>
          <div className="flex gap-2 mb-6">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  days === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {d} jours
              </button>
            ))}
          </div>

          {loadingStats && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          )}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          {data && !loadingStats && (
            <>
              {/* Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Vues de pages', value: data.overview.totalPageViews, icon: Eye, color: 'text-blue-500' },
                  { label: 'Actions', value: data.overview.totalActions, icon: MousePointer, color: 'text-green-500' },
                  { label: 'Utilisateurs actifs', value: data.overview.uniqueActiveUsers, icon: Users, color: 'text-purple-500' },
                  { label: 'Utilisations features', value: data.overview.totalFeatureUses, icon: TrendingUp, color: 'text-orange-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
                      </div>
                      <Icon className={`h-10 w-10 ${color}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Pages */}
              <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Pages les plus visitées</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Page</th>
                      <th className="px-6 py-3 text-left">Vues</th>
                      <th className="px-6 py-3 text-left">Temps moyen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.topPages.map((page, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-gray-900">{page.title}</p>
                          <p className="text-xs text-gray-400">{page.path}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                            {page.views}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{formatDuration(page.avgDuration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top Actions */}
              <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Actions les plus effectuées</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Action</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Nombre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.topActions.map((action, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{action.name}</td>
                        <td className="px-6 py-3">
                          <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">{action.type}</code>
                        </td>
                        <td className="px-6 py-3">
                          <span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                            {action.count}×
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Feature Usage */}
              <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Fonctionnalités — accès & blocages</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Feature</th>
                      <th className="px-6 py-3 text-left">Type</th>
                      <th className="px-6 py-3 text-left">Utilisations</th>
                      <th className="px-6 py-3 text-left">Bloqués</th>
                      <th className="px-6 py-3 text-left">Taux blocage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.featureUsage.map((f, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{f.name}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            f.type === 'free' ? 'bg-green-100 text-green-800'
                            : f.type === 'premium' ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                          }`}>{f.type}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{f.totalUses}</td>
                        <td className="px-6 py-3 text-sm font-medium text-red-600">{f.blockedByPaywall}</td>
                        <td className="px-6 py-3 w-40">
                          <RateBar value={f.conversionRate} color="bg-red-400" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Devices */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-gray-500" /> Appareils
                </h2>
                <div className="space-y-3">
                  {data.deviceBreakdown.map((d, i) => {
                    const total = data.deviceBreakdown.reduce((s, x) => s + x.count, 0);
                    const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-gray-700">{d.deviceType}</span>
                          <span className="text-gray-500">{d.count} ({pct}%)</span>
                        </div>
                        <RateBar value={pct} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ONGLET COHORTES
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'cohort' && (
        <>
          {/* Contrôle fenêtre */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-gray-600 font-medium">Fenêtre d'inscription :</span>
            {[30, 60, 90, 180].map((w) => (
              <button
                key={w}
                onClick={() => setCohortWindow(w)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  cohortWindow === w ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {w}j
              </button>
            ))}
          </div>

          {loadingCohort && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          )}
          {errorCohort && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{errorCohort}</p>
              <button onClick={fetchCohort} className="mt-2 text-red-600 hover:underline text-sm font-medium">
                Réessayer
              </button>
            </div>
          )}

          {cohort && !loadingCohort && (
            <>
              {/* Overview cohorte */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Inscriptions', value: cohort.overview.totalSignups, icon: Users, color: 'text-blue-500' },
                  { label: 'Ont fait une action', value: cohort.overview.usersWithActions, icon: MousePointer, color: 'text-green-500' },
                  { label: 'Ont visité une page', value: cohort.overview.usersWithPageViews, icon: Eye, color: 'text-purple-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">derniers {cohortWindow} jours</p>
                      </div>
                      <Icon className={`h-10 w-10 ${color}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Q3 RÉTENTION ─────────────────────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 mb-6 p-6">
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Rétention — D+1 / D+7 / D+30
                </h2>
                <p className="text-xs text-gray-400 mb-5">
                  % d'utilisateurs qui ont eu une session APRÈS le seuil
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <RetentionCard label="D+1" slot={cohort.retentionFunnel.d1} color="text-orange-500" />
                  <RetentionCard label="D+7" slot={cohort.retentionFunnel.d7} color="text-blue-500" />
                  <RetentionCard label="D+30" slot={cohort.retentionFunnel.d30} color="text-green-600" />
                </div>
              </div>

              {/* ── Q1 PREMIÈRE FEATURE ───────────────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Première action après inscription
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {cohort.overview.usersWithActions} utilisateurs ont réalisé au moins une action
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  {cohort.firstActionDistribution.slice(0, 10).map((a, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-800">{a.action_name}</span>
                        <span className="text-gray-500">{a.count} utilisateurs ({a.percentage}%)</span>
                      </div>
                      <RateBar value={a.percentage} color={i === 0 ? 'bg-purple-500' : 'bg-purple-200'} />
                    </div>
                  ))}
                  {cohort.firstActionDistribution.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Pas encore de données d'actions</p>
                  )}
                </div>
              </div>

              {/* ── Q2 ABANDON ───────────────────────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    Écrans d'abandon
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Dernière page visitée par les {cohort.churnedD1Count} utilisateurs perdus après J+1
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  {cohort.dropoffPages.slice(0, 8).map((p, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <code className="text-gray-700 font-medium">{p.page_path}</code>
                        <span className="text-gray-500">{p.users_last_seen_here} ({p.percentage}%)</span>
                      </div>
                      <RateBar value={p.percentage} color={i === 0 ? 'bg-red-500' : 'bg-red-200'} />
                    </div>
                  ))}
                  {cohort.dropoffPages.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      {cohort.churnedD1Count === 0
                        ? 'Pas encore d\'utilisateurs churned éligibles'
                        : 'Pas de page views enregistrées pour les utilisateurs churned'}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Q4 TEMPS LEARNING vs SIMULATEUR ──────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 mb-6 p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-teal-500" />
                  Engagement — Modules éducatifs vs Simulateur
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {/* Learning */}
                  <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                    <p className="text-sm font-bold text-teal-700 mb-3">Modules éducatifs</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Utilisateurs</span>
                        <span className="font-semibold text-gray-900">{cohort.engagementTime.learning.unique_users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sessions</span>
                        <span className="font-semibold text-gray-900">{cohort.engagementTime.learning.total_sessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durée moy / session</span>
                        <span className="font-semibold text-gray-900">{formatDuration(cohort.engagementTime.learning.avg_seconds_per_session)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Moy. progression / user</span>
                        <span className="font-semibold text-gray-900">{cohort.engagementTime.learning.avg_minutes_per_user} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total temps progression</span>
                        <span className="font-semibold text-gray-900">{cohort.engagementTime.learning.total_minutes_from_progress} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Simulator */}
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <p className="text-sm font-bold text-orange-700 mb-3">Simulateur de trading</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Utilisateurs</span>
                        <span className="font-semibold text-gray-900">{cohort.engagementTime.simulator.unique_users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sessions page</span>
                        <span className="font-semibold text-gray-900">{cohort.engagementTime.simulator.total_sessions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durée moy / session</span>
                        <span className="font-semibold text-gray-900">{formatDuration(cohort.engagementTime.simulator.avg_seconds_per_session)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total trades simulés</span>
                        <span className="font-semibold text-gray-900">{cohort.engagementTime.simulator.total_trades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Moy. trades / user</span>
                        <span className="font-semibold text-gray-900">{cohort.engagementTime.simulator.avg_trades_per_user}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Q5 AHA MOMENT ────────────────────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    Aha moment — signaux de rétention
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">{cohort.ahaSignals.methodology}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Éligibles D+7 : <strong className="text-gray-800">{cohort.ahaSignals.eligible_d7}</strong></span>
                    <span className="text-green-700">Retenus : <strong>{cohort.ahaSignals.retained_d7}</strong></span>
                    <span className="text-red-600">Churned : <strong>{cohort.ahaSignals.churned_d7}</strong></span>
                  </div>
                </div>
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Action (W1)</th>
                      <th className="px-6 py-3 text-left">Retained %</th>
                      <th className="px-6 py-3 text-left">Churned %</th>
                      <th className="px-6 py-3 text-left">Lift</th>
                      <th className="px-6 py-3 text-left">Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cohort.ahaSignals.signals.map((s, i) => (
                      <tr key={i} className={`hover:bg-gray-50 ${s.verdict === 'Fort signal' ? 'bg-green-50' : ''}`}>
                        <td className="px-6 py-3">
                          <p className="text-sm font-medium text-gray-900">{s.action_name}</p>
                          <code className="text-xs text-gray-400">{s.action_type}</code>
                        </td>
                        <td className="px-6 py-3 w-28">
                          <RateBar value={s.retained_rate} color="bg-green-500" />
                        </td>
                        <td className="px-6 py-3 w-28">
                          <RateBar value={s.churned_rate} color="bg-red-400" />
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-sm font-bold ${s.lift >= 2 ? 'text-green-700' : s.lift >= 1.5 ? 'text-yellow-600' : 'text-gray-400'}`}>
                            {s.lift === 99 ? '∞' : `×${s.lift}`}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <VerdictBadge verdict={s.verdict} />
                        </td>
                      </tr>
                    ))}
                    {cohort.ahaSignals.signals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                          Pas encore assez de données pour calculer les signaux de rétention
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
