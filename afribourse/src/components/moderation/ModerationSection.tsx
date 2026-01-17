// src/components/moderation/ModerationSection.tsx
import { useState } from 'react';
import { Flag, AlertTriangle, Ban, FileText, CheckCircle, X, Eye, Trash2 } from 'lucide-react';
import { useModerationStats, useReports, useProcessReport } from '../../hooks/useModeration';
import { toast } from 'react-hot-toast';

export default function ModerationSection() {
    const { data: stats, isLoading: statsLoading } = useModerationStats();
    const [reportStatus, setReportStatus] = useState<string>('PENDING');
    const { data: reportsData, isLoading: reportsLoading } = useReports(1, reportStatus);
    const processReport = useProcessReport();

    const handleProcessReport = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
        try {
            await processReport.mutateAsync({
                reportId,
                status: action,
                resolution: action === 'RESOLVED' ? 'Contenu masqué par modération' : 'Signalement non fondé'
            });
            toast.success(action === 'RESOLVED' ? 'Contenu masqué avec succès' : 'Signalement rejeté');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors du traitement');
        }
    };

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-red-100 p-3 rounded-lg">
                            <Flag className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-2xl font-bold text-red-600">
                            {stats?.pendingReports || 0}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-700">Signalements en attente</h3>
                    <p className="text-xs text-gray-500 mt-1">Nécessitent une action</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                            {stats?.resolvedReportsLast30Days || 0}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-700">Traités (30j)</h3>
                    <p className="text-xs text-gray-500 mt-1">Actions effectuées</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-orange-100 p-3 rounded-lg">
                            <Ban className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-2xl font-bold text-orange-600">
                            {stats?.activeBans || 0}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-700">Utilisateurs bannis</h3>
                    <p className="text-xs text-gray-500 mt-1">Actuellement actifs</p>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-2xl font-bold text-purple-600">
                            {stats?.bannedKeywords || 0}
                        </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-700">Mots-clés bannis</h3>
                    <p className="text-xs text-gray-500 mt-1">Filtre automatique</p>
                </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Flag className="w-5 h-5 text-red-600" />
                        Signalements Récents
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setReportStatus('PENDING')}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${reportStatus === 'PENDING'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            En attente
                        </button>
                        <button
                            onClick={() => setReportStatus('RESOLVED')}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${reportStatus === 'RESOLVED'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Résolus
                        </button>
                        <button
                            onClick={() => setReportStatus('DISMISSED')}
                            className={`px-3 py-1 text-sm rounded-lg transition-colors ${reportStatus === 'DISMISSED'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Rejetés
                        </button>
                    </div>
                </div>

                {reportsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                ) : reportsData?.data?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signalé par</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    {reportStatus === 'PENDING' && (
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reportsData.data.map((report: any) => (
                                    <tr key={report.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                {report.content_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                                <span className="text-sm text-gray-900">{report.reason}</span>
                                            </div>
                                            {report.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            {report.reporter.name} {report.reporter.lastname}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(report.created_at).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        {reportStatus === 'PENDING' && (
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleProcessReport(report.id, 'RESOLVED')}
                                                        disabled={processReport.isPending}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Masquer le contenu"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleProcessReport(report.id, 'DISMISSED')}
                                                        disabled={processReport.isPending}
                                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Rejeter"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Flag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucun signalement {reportStatus === 'PENDING' ? 'en attente' : reportStatus === 'RESOLVED' ? 'résolu' : 'rejeté'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
