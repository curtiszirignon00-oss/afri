import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Eye,
  MousePointerClick,
  Shield,
  Flag,
  AlertTriangle,
  Ban,
  FileText,
  Download,
} from 'lucide-react';
import { useModerationStats, useReports } from '../hooks/useModeration';
import ModerationSection from './moderation/ModerationSection';

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

interface AnalyticsOverview {
  totalPageViews: number;
  totalActions: number;
  totalFeatureUses: number;
  uniqueActiveUsers: number;
}

interface PlatformStats {
  users: UserStats;
  portfolios: PortfolioStats;
  transactions: TransactionStats;
  subscriptions: SubscriptionStats;
  topUsers: TopUser[];
}

interface AnalyticsData {
  overview: AnalyticsOverview;
}

interface PremiumIntent {
  id: string;
  planId: string;
  planName: string;
  price: string;
  paymentMethod: string | null;
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [premiumIntents, setPremiumIntents] = useState<PremiumIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
    fetchPremiumIntents();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/platform-stats`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
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

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/analytics/stats?days=7`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data);
      }
    } catch (err) {
      console.error('Erreur analytics:', err);
    }
  };

  const fetchPremiumIntents = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/premium-intents`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      if (response.ok) {
        const result = await response.json();
        setPremiumIntents(result.data);
      }
    } catch (err) {
      console.error('Erreur premium intents:', err);
    }
  };

  const handleForceVerify = async () => {
    if (!verifyEmail.trim()) return;
    setVerifyLoading(true);
    setVerifyStatus(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/force-verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: verifyEmail.trim() }),
      });
      const data = await res.json();
      setVerifyStatus({ ok: data.success, msg: data.message });
      if (data.success) setVerifyEmail('');
    } catch {
      setVerifyStatus({ ok: false, msg: 'Erreur réseau' });
    } finally {
      setVerifyLoading(false);
    }
  };

  const exportEmailsCSV = () => {
    const uniqueUsers = Array.from(
      new Map(premiumIntents.map((i) => [i.user.id, i.user])).values()
    );
    const csv = [
      'Nom,Prénom,Email',
      ...uniqueUsers.map((u) => `${u.name},${u.lastname},${u.email}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intentions_premium.csv';
    a.click();
    URL.revokeObjectURL(url);
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

        {/* Analytics Section - Quick Overview */}
        {analytics && (
          <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Analytics (7 derniers jours)
                </h2>
                <p className="text-blue-100 text-sm">
                  Comportement et engagement des utilisateurs
                </p>
              </div>
              <Link
                to="/admin/analytics"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Voir détails
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 text-sm">Pages vues</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(analytics.overview.totalPageViews)}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <MousePointerClick className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 text-sm">Actions</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(analytics.overview.totalActions)}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 text-sm">Utilisations</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(analytics.overview.totalFeatureUses)}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-100 text-sm">Actifs uniques</span>
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(analytics.overview.uniqueActiveUsers)}
                </p>
              </div>
            </div>
          </div>
        )}

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
                        width: `${(stats.users.confirmed / stats.users.total) * 100
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
                        width: `${(stats.users.unconfirmed / stats.users.total) * 100
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
                        className={`h-2 rounded-full ${plan.planId === 'pro'
                          ? 'bg-purple-600'
                          : 'bg-yellow-600'
                          }`}
                        style={{
                          width: `${(plan.count / stats.subscriptions.totalIntents) *
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
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin'
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

        {/* Débloquer un utilisateur - Forcer la vérification email */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-orange-400">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-orange-500" />
            Débloquer un utilisateur
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Si un utilisateur ne peut pas se connecter à cause de son email non confirmé, forcez la vérification ici.
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              value={verifyEmail}
              onChange={(e) => setVerifyEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              onKeyDown={(e) => e.key === 'Enter' && handleForceVerify()}
            />
            <button
              onClick={handleForceVerify}
              disabled={verifyLoading || !verifyEmail.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {verifyLoading ? 'En cours...' : 'Vérifier email'}
            </button>
          </div>
          {verifyStatus && (
            <p className={`mt-3 text-sm font-medium ${verifyStatus.ok ? 'text-green-600' : 'text-red-600'}`}>
              {verifyStatus.msg}
            </p>
          )}
        </div>

        {/* Premium Intents - Liste des emails */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Crown className="w-5 h-5 text-yellow-500 mr-2" />
              Intentions Premium — Emails ({premiumIntents.length} intentions,{' '}
              {new Set(premiumIntents.map((i) => i.user.id)).size} utilisateurs uniques)
            </h3>
            <button
              onClick={exportEmailsCSV}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {premiumIntents.map((intent) => (
                  <tr key={intent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {intent.user.name} {intent.user.lastname}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-blue-600">
                      {intent.user.email}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        intent.planId === 'pro'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {intent.planName}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {intent.paymentMethod || '—'}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(intent.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
                {premiumIntents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                      Aucune intention premium enregistrée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Moderation Section */}
        <div className="mt-8 mb-8">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Modération de la Plateforme
                </h2>
                <p className="text-red-100 text-sm">
                  Gestion des signalements et sécurité du contenu
                </p>
              </div>
            </div>
          </div>

          <ModerationSection />
        </div>
      </div>
    </div>
  );
}
