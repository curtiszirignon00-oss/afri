import { useEffect, useState } from 'react';
import {
  Users,
  TrendingUp,
  Briefcase,
  CreditCard,
  UserCheck,
  UserX,
  Target,
  Activity,
  Crown,
  Zap,
  Calendar,
  DollarSign,
  BarChart3,
} from 'lucide-react';

interface UserStats {
  total: number;
  confirmed: number;
  unconfirmed: number;
  byRole: { role: string; count: number }[];
  byMonth: { month: string; count: number }[];
  activeLastWeek: number;
  latest: {
    id: string;
    name: string;
    lastname: string;
    email: string;
    email_verified_at: string | null;
    role: string;
    created_at: string | null;
  }[];
}

interface PortfolioStats {
  total: number;
  averagePerUser: number;
}

interface TransactionStats {
  total: number;
  byType: { type: string; count: number }[];
  totalVolume: number;
  last30Days: number;
}

interface SubscriptionStats {
  totalIntents: number;
  uniqueUsers: number;
  conversionRate: number;
  byPlan: { planId: string; count: number }[];
  byPaymentMethod: { method: string; count: number }[];
}

interface TopUser {
  user: {
    id: string;
    name: string;
    lastname: string;
    email: string;
    created_at: string | null;
  };
  transactionCount: number;
}

interface PlatformStats {
  users: UserStats;
  portfolios: PortfolioStats;
  transactions: TransactionStats;
  subscriptions: SubscriptionStats;
  topUsers: TopUser[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/platform-stats`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setStats(result.data);
    } catch (err) {
      console.error('Erreur complète:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dashboard Administrateur
          </h1>
          <p className="text-gray-600">
            Vue d'ensemble complète de la plateforme AfriBourse
          </p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {formatNumber(stats.users.total)}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Utilisateurs Total
            </h3>
            <p className="text-xs text-gray-500">
              {stats.users.activeLastWeek} actifs cette semaine
            </p>
          </div>

          {/* Total Portfolios */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {formatNumber(stats.portfolios.total)}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Portefeuilles Créés
            </h3>
            <p className="text-xs text-gray-500">
              Moyenne: {stats.portfolios.averagePerUser.toFixed(1)} par
              utilisateur
            </p>
          </div>

          {/* Total Transactions */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {formatNumber(stats.transactions.total)}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Transactions Total
            </h3>
            <p className="text-xs text-gray-500">
              {stats.transactions.last30Days} ces 30 derniers jours
            </p>
          </div>

          {/* Subscription Intents */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {formatNumber(stats.subscriptions.totalIntents)}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Intentions Premium
            </h3>
            <p className="text-xs text-gray-500">
              Taux de conversion: {stats.subscriptions.conversionRate}%
            </p>
          </div>
        </div>

        {/* User Statistics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Email Confirmation */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UserCheck className="w-5 h-5 text-green-600 mr-2" />
              Confirmation Email
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Confirmés</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                    <div
                      className="h-2 bg-green-600 rounded-full"
                      style={{
                        width: `${
                          (stats.users.confirmed / stats.users.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12">
                    {formatNumber(stats.users.confirmed)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Non confirmés</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                    <div
                      className="h-2 bg-red-600 rounded-full"
                      style={{
                        width: `${
                          (stats.users.unconfirmed / stats.users.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12">
                    {formatNumber(stats.users.unconfirmed)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Volume */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 text-green-600 mr-2" />
              Volume Total
            </h3>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">
                {formatCurrency(stats.transactions.totalVolume)}
              </p>
              <p className="text-sm text-gray-600">
                Volume total des transactions
              </p>
            </div>
          </div>

          {/* Subscription Conversion */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 text-blue-600 mr-2" />
              Conversion Premium
            </h3>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600 mb-2">
                {stats.subscriptions.conversionRate}%
              </p>
              <p className="text-sm text-gray-600">
                {stats.subscriptions.uniqueUsers} utilisateurs intéressés
              </p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subscription by Plan */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
              Intentions par Plan
            </h3>
            <div className="space-y-3">
              {stats.subscriptions.byPlan.map((plan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {plan.planId === 'pro' ? (
                      <Crown className="w-4 h-4 text-purple-600 mr-2" />
                    ) : (
                      <Zap className="w-4 h-4 text-yellow-600 mr-2" />
                    )}
                    <span className="text-sm text-gray-700 capitalize">
                      {plan.planId === 'investisseur-plus'
                        ? 'Investisseur+'
                        : 'Pro'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                      <div
                        className={`h-2 rounded-full ${
                          plan.planId === 'pro'
                            ? 'bg-purple-600'
                            : 'bg-yellow-600'
                        }`}
                        style={{
                          width: `${
                            (plan.count / stats.subscriptions.totalIntents) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8">
                      {plan.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 text-green-600 mr-2" />
              Méthodes de Paiement Préférées
            </h3>
            <div className="space-y-3">
              {stats.subscriptions.byPaymentMethod.map((method, index) => {
                const total = stats.subscriptions.byPaymentMethod.reduce(
                  (sum, m) => sum + m.count,
                  0
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700 capitalize">
                      {method.method || 'Non spécifié'}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                        <div
                          className="h-2 bg-green-600 rounded-full"
                          style={{
                            width: `${(method.count / total) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-8">
                        {method.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              Top 10 Utilisateurs Actifs
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscrit le
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topUsers.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.user.name} {item.user.lastname}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {item.transactionCount} transactions
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.user.created_at ? new Date(item.user.created_at).toLocaleDateString(
                        'fr-FR'
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest Users */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Calendar className="w-5 h-5 text-green-600 mr-2" />
              Derniers Utilisateurs Inscrits
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'inscription
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.users.latest.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name} {user.lastname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email_verified_at ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Confirmé
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <UserX className="w-3 h-3 mr-1" />
                          Non confirmé
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '-'}
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
