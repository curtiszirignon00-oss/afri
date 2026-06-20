// src/components/profile/ActivityHeatmap.tsx
// Heatmap d'activité façon GitHub/Strava — 12 semaines glissantes, palette teal.
import { useQuery } from '@tanstack/react-query';
import { Activity } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface HeatmapDay {
    date: string;
    count: number;
}

// 5 niveaux d'intensité (palette teal Afribourse)
function levelClass(count: number): string {
    if (count <= 0) return 'bg-gray-100';
    if (count === 1) return 'bg-teal-200';
    if (count <= 3) return 'bg-teal-400';
    if (count <= 5) return 'bg-teal-600';
    return 'bg-teal-800';
}

export default function ActivityHeatmap({ enabled = true }: { enabled?: boolean }) {
    const { data, isLoading } = useQuery({
        queryKey: ['activity-heatmap'],
        queryFn: async () => {
            const res = await apiClient.get('/investor-profile/activity-heatmap');
            return res.data.data as HeatmapDay[];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });

    if (!enabled) return null;

    // Organiser en colonnes de 7 jours (semaines)
    const days = data ?? [];
    const weeks: HeatmapDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const totalActive = days.filter(d => d.count > 0).length;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Activité</h3>
                    <p className="text-sm text-gray-500">{totalActive} jour{totalActive > 1 ? 's' : ''} actif{totalActive > 1 ? 's' : ''} sur 12 semaines</p>
                </div>
            </div>

            {isLoading ? (
                <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />
            ) : (
                <>
                    <div className="flex gap-1 overflow-x-auto pb-1">
                        {weeks.map((week, wi) => (
                            <div key={wi} className="flex flex-col gap-1">
                                {week.map((day) => (
                                    <div
                                        key={day.date}
                                        title={`${day.date} · ${day.count} activité${day.count > 1 ? 's' : ''}`}
                                        className={`w-3 h-3 rounded-sm ${levelClass(day.count)}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-3 text-xs text-gray-400">
                        <span>Moins</span>
                        <div className="w-3 h-3 rounded-sm bg-gray-100" />
                        <div className="w-3 h-3 rounded-sm bg-teal-200" />
                        <div className="w-3 h-3 rounded-sm bg-teal-400" />
                        <div className="w-3 h-3 rounded-sm bg-teal-600" />
                        <div className="w-3 h-3 rounded-sm bg-teal-800" />
                        <span>Plus</span>
                    </div>
                </>
            )}
        </div>
    );
}
