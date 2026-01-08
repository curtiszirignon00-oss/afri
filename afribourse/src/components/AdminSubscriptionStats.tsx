import { useEffect, useState } from 'react';
import { TrendingUp, Users, Zap, Crown, Target, Calendar } from 'lucide-react';

interface IntentsByPlan {
  planId: string;
  count: number;
}

interface IntentsByFeature {
  feature: string;
  count: number;
}

interface IntentsBySource {
  source: string;
  count: number;
}

interface RecentIntent {
  id: string;
  planId: string;
  planName: string;
  price: string;
  feature: string | null;
  source: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    lastname: string;
    email: string;
  };
}

interface StatsData {
  totalIntents: number;
  uniqueUsers: number;
  intentsByPlan: IntentsByPlan[];
  intentsByFeature: IntentsByFeature[];
  intentsBySource: IntentsBySource[];
  recentIntents: RecentIntent[];
  intentsByDay: { created_at: string; planId: string }[];
}

export default function AdminSubscriptionStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/subscriptions/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }

      const result = await response.json();
      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const investisseurPlusCount = stats.intentsByPlan.find(p => p.planId === 'investisseur-plus')?.count || 0;
  const proCount = stats.intentsByPlan.find(p => p.planId === 'pro')?.count || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Statistiques d'Intentions d'Abonnement
          </h1>
          <p className="text-gray-600">
            Suivi des utilisateurs intéressés par les plans premium
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Intentions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalIntents}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Total Intentions</h3>
          </div>

          {/* Unique Users */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Utilisateurs Uniques</h3>
          </div>

          {/* Investisseur+ */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{investisseurPlusCount}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Investisseur+</h3>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{proCount}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Pro</h3>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Feature */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <Target className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Par Fonctionnalité</h3>
            </div>
            <div className="space-y-3">
              {stats.intentsByFeature.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.feature || 'Non spécifié'}</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{
                          width: `${(item.count / stats.totalIntents) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Source */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Par Source</h3>
            </div>
            <div className="space-y-3">
              {stats.intentsBySource.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">{item.source || 'Inconnue'}</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                      <div
                        className="h-2 bg-green-600 rounded-full"
                        style={{
                          width: `${(item.count / stats.totalIntents) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Intents Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Intentions Récentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fonctionnalité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentIntents.map((intent) => (
                  <tr key={intent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {intent.user.name} {intent.user.lastname}
                      </div>
                      <div className="text-sm text-gray-500">{intent.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          intent.planId === 'pro'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {intent.planName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {intent.feature || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {intent.source || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(intent.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
