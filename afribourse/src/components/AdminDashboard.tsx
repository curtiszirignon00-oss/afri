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
  Bot,
  ThumbsUp,
  ThumbsDown,
  Gift,
  CheckCircle2,
  Clock,
  MailOpen,
  Video,
  Phone,
  Send,
  Loader2,
  AlertCircle,
  X,
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

interface WebinarRegistrationRecord {
  id: string;
  webinarId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  userId: string | null;
  created_at: string;
}

interface TrialRecord {
  id: string;
  claimed: boolean;
  activatedAt: string | null;
  expiresAt: string | null;
  created_at: string;
  user: { id: string; name: string; lastname: string; email: string };
}

interface TrialStats {
  total: number;
  claimed: number;
  active: number;
  expired: number;
  unclaimed: number;
  claimRate: number;
  recent: TrialRecord[];
}

interface FeedbackByEndpoint {
  positive: number;
  negative: number;
  total: number;
}

interface AIFeedbackStats {
  period: string;
  feedback: {
    total: number;
    positive: number;
    negative: number;
    satisfactionRate: number;
    byEndpoint: Record<string, FeedbackByEndpoint>;
    dailyTrend: { date: string; positive: number; negative: number }[];
  };
  aiSummary: {
    totalCalls: number;
    avgResponseTimeMs: number;
    callsByEndpoint: Record<string, number>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [premiumIntents, setPremiumIntents] = useState<PremiumIntent[]>([]);
  const [trialStats, setTrialStats] = useState<TrialStats | null>(null);
  const [aiFeedbackStats, setAIFeedbackStats] = useState<AIFeedbackStats | null>(null);
  const [webinarRegistrations, setWebinarRegistrations] = useState<WebinarRegistrationRecord[]>([]);
  const [webinarFilter, setWebinarFilter] = useState<string>('all');
  const [campaignStatus, setCampaignStatus] = useState<'idle' | 'confirming' | 'sending' | 'done' | 'error'>('idle');
  const [campaignResult, setCampaignResult] = useState<{ total: number; sent: number; failed: number; filtered: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
    fetchPremiumIntents();
    fetchTrialStats();
    fetchAIFeedbackStats();
    fetchWebinarRegistrations();
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

  const fetchTrialStats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/trial-stats`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setTrialStats(data.data);
      }
    } catch (err) {
      console.error('Erreur trial stats:', err);
    }
  };

  const fetchAIFeedbackStats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/ai-feedback-stats?days=30`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAIFeedbackStats(data.data);
      }
    } catch (err) {
      console.error('Erreur AI feedback stats:', err);
    }
  };

  const fetchWebinarRegistrations = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/webinars/registrations`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setWebinarRegistrations(data.data ?? []);
      }
    } catch (err) {
      console.error('Erreur webinar registrations:', err);
    }
  };

  const exportWebinarCSV = () => {
    const rows = webinarRegistrations.filter(
      (r) => webinarFilter === 'all' || r.webinarId === webinarFilter,
    );
    const WEBINAR_LABELS: Record<string, string> = {
      'w1-fondamentaux': 'Fondamentaux (23 mai)',
      'w2-fondamentale': 'Analyse fondamentale (30-31 mai)',
      'w3-technique': 'Analyse technique (6-7 juin)',
    };
    const header = ['Webinaire', 'Prénom/Nom', 'Email', 'Téléphone', 'Date inscription'];
    const lines = rows.map((r) => [
      WEBINAR_LABELS[r.webinarId] ?? r.webinarId,
      [r.firstName, r.lastName].filter(Boolean).join(' ') || '—',
      r.email,
      r.phone ?? '—',
      new Date(r.created_at).toLocaleString('fr-FR'),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webinaires_inscriptions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

        {/* ═══════════════════════════════════════════ */}
        {/* FREE TRIAL STATS                          */}
        {/* ═══════════════════════════════════════════ */}
        <div className="mt-10">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <Gift className="w-6 h-6" />
                  Essai Gratuit IA — 14 jours
                </h2>
                <p className="text-violet-100 text-sm">Suivi des invitations et activations trial</p>
              </div>
              {trialStats && (
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{trialStats.claimRate}%</p>
                  <p className="text-violet-200 text-xs">taux d'activation</p>
                </div>
              )}
            </div>
          </div>

          {trialStats ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                  { label: 'Invitations envoyées', value: trialStats.total, icon: MailOpen, color: 'blue' },
                  { label: 'Liens cliqués', value: trialStats.claimed, icon: CheckCircle2, color: 'green' },
                  { label: 'Trials actifs', value: trialStats.active, icon: Zap, color: 'violet' },
                  { label: 'Trials expirés', value: trialStats.expired, icon: Clock, color: 'orange' },
                  { label: 'Non réclamés', value: trialStats.unclaimed, icon: MailOpen, color: 'gray' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 bg-${color}-100`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Table des 20 derniers trials */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">20 derniers tokens générés</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Utilisateur', 'Email', 'Statut', 'Activé le', 'Expire le'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {trialStats.recent.map((t) => {
                        const now = new Date();
                        const isActive = t.claimed && t.expiresAt && new Date(t.expiresAt) > now;
                        const isExpired = t.claimed && t.expiresAt && new Date(t.expiresAt) <= now;
                        return (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 text-sm font-medium text-gray-900">
                              {t.user.name} {t.user.lastname}
                            </td>
                            <td className="px-5 py-3 text-sm text-blue-600">{t.user.email}</td>
                            <td className="px-5 py-3">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                  <Zap className="w-3 h-3" /> Actif
                                </span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                                  <Clock className="w-3 h-3" /> Expiré
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                  <MailOpen className="w-3 h-3" /> En attente
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-sm text-gray-500">
                              {t.activatedAt ? new Date(t.activatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-5 py-3 text-sm text-gray-500">
                              {t.expiresAt ? new Date(t.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                      {trialStats.recent.length === 0 && (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Aucun trial généré pour l'instant</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">Chargement des stats trial…</div>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* AI FEEDBACK — POUCES LEVÉ / BAISSÉ         */}
        {/* ═══════════════════════════════════════════ */}
        <div className="mt-10">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <Bot className="w-6 h-6" />
                  Feedback IA — Pouces levé / baissé
                </h2>
                <p className="text-blue-100 text-sm">Satisfaction utilisateurs sur les 30 derniers jours</p>
              </div>
              {aiFeedbackStats && (
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{aiFeedbackStats.feedback.satisfactionRate}%</p>
                  <p className="text-blue-200 text-xs">satisfaction globale</p>
                </div>
              )}
            </div>
          </div>

          {aiFeedbackStats ? (
            <>
              {/* KPIs globaux */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total feedbacks', value: aiFeedbackStats.feedback.total, icon: Activity, color: 'blue', sub: '30 derniers jours' },
                  { label: 'Pouces levés 👍', value: aiFeedbackStats.feedback.positive, icon: ThumbsUp, color: 'green', sub: `${aiFeedbackStats.feedback.total > 0 ? Math.round(aiFeedbackStats.feedback.positive / aiFeedbackStats.feedback.total * 100) : 0}% des avis` },
                  { label: 'Pouces baissés 👎', value: aiFeedbackStats.feedback.negative, icon: ThumbsDown, color: 'red', sub: `${aiFeedbackStats.feedback.total > 0 ? Math.round(aiFeedbackStats.feedback.negative / aiFeedbackStats.feedback.total * 100) : 0}% des avis` },
                  { label: 'Appels IA totaux', value: aiFeedbackStats.aiSummary.totalCalls, icon: Bot, color: 'violet', sub: `moy. ${Math.round(aiFeedbackStats.aiSummary.avgResponseTimeMs / 1000)}s/réponse` },
                ].map(({ label, value, icon: Icon, color, sub }) => (
                  <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${color}-100`}>
                        <Icon className={`w-5 h-5 text-${color}-600`} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Barre de satisfaction globale */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Score de satisfaction global</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 w-8">👎</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${aiFeedbackStats.feedback.satisfactionRate}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">👍</span>
                  <span className="text-lg font-bold text-emerald-600 w-16 text-right">
                    {aiFeedbackStats.feedback.satisfactionRate}%
                  </span>
                </div>
              </div>

              {/* Feedback par outil IA */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-5">Satisfaction par outil IA</h3>
                {Object.keys(aiFeedbackStats.feedback.byEndpoint).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun feedback enregistré pour l'instant</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(aiFeedbackStats.feedback.byEndpoint)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([endpoint, data]) => {
                        const rate = data.total > 0 ? Math.round((data.positive / data.total) * 100) : 0;
                        const label: Record<string, string> = {
                          tutor: '🎓 Tuteur SIMBA',
                          analyst: '📊 Analyste SIMBA',
                          coach: '💬 Coach SIMBA',
                          'market-analysis': '📈 Analyse de marché',
                          'stock-analysis': '🔍 Analyse action',
                        };
                        return (
                          <div key={endpoint}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium text-gray-700">
                                {label[endpoint] ?? endpoint}
                              </span>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="text-green-600 font-semibold">👍 {data.positive}</span>
                                <span className="text-red-500 font-semibold">👎 {data.negative}</span>
                                <span className="text-gray-400">({data.total} avis)</span>
                                <span className={`font-bold ${rate >= 70 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                  {rate}%
                                </span>
                              </div>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${rate >= 70 ? 'bg-green-400' : rate >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">Chargement des stats feedback…</div>
          )}
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* WEBINAIRES — PRÉINSCRIPTIONS               */}
        {/* ═══════════════════════════════════════════ */}
        <div className="mt-10">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <Video className="w-6 h-6" />
                  Webinaires — Préinscriptions
                </h2>
                <p className="text-blue-100 text-sm">
                  {webinarRegistrations.length} inscription{webinarRegistrations.length !== 1 ? 's' : ''} au total
                </p>
              </div>
              <button
                onClick={exportWebinarCSV}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>
          </div>

          {/* KPIs par webinaire */}
          {(() => {
            const WEBINARS = [
              { id: 'w1-fondamentaux', label: 'Fondamentaux', date: '23 mai', color: 'blue' },
              { id: 'w2-fondamentale', label: 'Analyse fondamentale', date: '30-31 mai', color: 'emerald' },
              { id: 'w3-technique', label: 'Analyse technique', date: '6-7 juin', color: 'orange' },
            ];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {WEBINARS.map((w) => {
                  const count = webinarRegistrations.filter((r) => r.webinarId === w.id).length;
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 border-blue-100 text-blue-700',
                    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
                    orange: 'bg-orange-50 border-orange-100 text-orange-700',
                  };
                  return (
                    <button
                      key={w.id}
                      onClick={() => setWebinarFilter(webinarFilter === w.id ? 'all' : w.id)}
                      className={`rounded-xl border p-4 text-left transition-all ${colorMap[w.color]} ${webinarFilter === w.id ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                    >
                      <p className="text-xs font-semibold opacity-70 mb-1">{w.date}</p>
                      <p className="font-bold text-base">{w.label}</p>
                      <p className="text-3xl font-extrabold mt-1">{count}</p>
                      <p className="text-xs opacity-60 mt-0.5">préinscrit{count !== 1 ? 's' : ''}</p>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Filtre actif */}
          {webinarFilter !== 'all' && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Filtre :</span>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{webinarFilter}</span>
              <button onClick={() => setWebinarFilter('all')} className="text-xs text-gray-400 hover:text-gray-600 underline">Réinitialiser</button>
            </div>
          )}

          {/* Tableau */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Webinaire</th>
                    <th className="px-5 py-3">Nom</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3"><Phone className="w-3.5 h-3.5 inline mr-1" />Téléphone</th>
                    <th className="px-5 py-3">Inscrit le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(() => {
                    const WEBINAR_LABELS: Record<string, { label: string; color: string }> = {
                      'w1-fondamentaux': { label: 'Fondamentaux', color: 'bg-blue-100 text-blue-700' },
                      'w2-fondamentale': { label: 'Fondamentale', color: 'bg-emerald-100 text-emerald-700' },
                      'w3-technique':   { label: 'Technique', color: 'bg-orange-100 text-orange-700' },
                    };
                    const filtered = webinarRegistrations.filter(
                      (r) => webinarFilter === 'all' || r.webinarId === webinarFilter,
                    );
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                            Aucune préinscription pour l'instant
                          </td>
                        </tr>
                      );
                    }
                    return filtered.map((r) => {
                      const meta = WEBINAR_LABELS[r.webinarId] ?? { label: r.webinarId, color: 'bg-gray-100 text-gray-700' };
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-800 font-medium">
                            {[r.firstName, r.lastName].filter(Boolean).join(' ') || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">{r.email}</td>
                          <td className="px-5 py-3 text-sm text-gray-500">{r.phone ?? '—'}</td>
                          <td className="px-5 py-3 text-xs text-gray-400">
                            {new Date(r.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Campagne Email — Lancement Webinaires */}
        <div className="mt-8 mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <Send className="w-6 h-6" />
                  Campagne Email — Lancement Webinaires
                </h2>
                <p className="text-blue-100 text-sm">
                  Envoie l'email d'annonce à tous les utilisateurs réels (comptes afribourse exclus)
                </p>
              </div>
              {campaignStatus === 'idle' && (
                <button
                  onClick={() => setCampaignStatus('confirming')}
                  className="flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors shadow"
                >
                  <Send className="w-4 h-4" />
                  Envoyer la campagne
                </button>
              )}
            </div>
          </div>

          {/* Modal de confirmation */}
          {campaignStatus === 'confirming' && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 mb-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 text-base mb-1">Confirmer l'envoi de la campagne ?</p>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Cette action va envoyer l'email <strong>"🎓 Maîtrisez la BRVM avec nos experts"</strong> à <strong>tous les utilisateurs réels</strong> de la plateforme.<br />
                    Les comptes contenant "afribourse", "africbourse" ou les adresses jetables seront exclus.<br />
                    <strong>Action irréversible.</strong>
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setCampaignStatus('sending');
                    try {
                      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/send-webinar-launch-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                      });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        setCampaignResult(data.data);
                        setCampaignStatus('done');
                      } else {
                        setCampaignStatus('error');
                      }
                    } catch {
                      setCampaignStatus('error');
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Oui, envoyer maintenant
                </button>
                <button
                  onClick={() => setCampaignStatus('idle')}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* En cours d'envoi */}
          {campaignStatus === 'sending' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center gap-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin flex-shrink-0" />
              <div>
                <p className="font-bold text-blue-800 mb-1">Envoi en cours...</p>
                <p className="text-blue-600 text-sm">Les emails sont envoyés par lots de 50 avec pause de 2s entre chaque lot. Cette opération peut prendre plusieurs minutes.</p>
              </div>
            </div>
          )}

          {/* Résultat */}
          {campaignStatus === 'done' && campaignResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <p className="font-bold text-emerald-800 text-lg">Campagne envoyée avec succès !</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Utilisateurs ciblés', value: campaignResult.total, color: 'text-gray-800' },
                  { label: 'Comptes exclus', value: campaignResult.filtered, color: 'text-amber-600' },
                  { label: 'Emails envoyés', value: campaignResult.sent, color: 'text-emerald-600' },
                  { label: 'Échecs', value: campaignResult.failed, color: 'text-red-600' },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              {campaignResult.errors.length > 0 && (
                <details className="bg-white rounded-xl border border-red-100 p-4">
                  <summary className="text-sm font-semibold text-red-700 cursor-pointer">
                    {campaignResult.errors.length} erreur(s) d'envoi
                  </summary>
                  <ul className="mt-3 space-y-1">
                    {campaignResult.errors.map((e, i) => (
                      <li key={i} className="text-xs text-red-600 font-mono">{e}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {/* Erreur */}
          {campaignStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <p className="text-red-700 font-semibold">Erreur lors de l'envoi de la campagne. Vérifie les logs serveur.</p>
              </div>
              <button onClick={() => setCampaignStatus('idle')} className="text-sm text-red-600 underline">
                Réessayer
              </button>
            </div>
          )}
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
