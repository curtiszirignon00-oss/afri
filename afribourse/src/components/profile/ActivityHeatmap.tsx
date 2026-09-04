// src/components/profile/ActivityHeatmap.tsx
// Heatmap d'activité façon GitHub/Strava — 12 semaines glissantes.
//
// La rampe teal (teal-200 -> teal-800) n'appartenait pas a la charte. Les cinq
// niveaux sont maintenant des opacites croissantes de l'orange de marque : une
// seule teinte, celle du logo, et une intensite qui se lit d'un coup d'oeil.
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';
import ProfileSectionCard from './ProfileSectionCard';

interface HeatmapDay {
    date: string;
    count: number;
}

// 5 niveaux d'intensité (rampe orange de marque)
function levelClass(count: number): string {
    if (count <= 0) return 'bg-ink-100';
    if (count === 1) return 'bg-brand-orange/25';
    if (count <= 3) return 'bg-brand-orange/50';
    if (count <= 5) return 'bg-brand-orange/75';
    return 'bg-brand-orange-dark';
}

const LEGEND = ['bg-ink-100', 'bg-brand-orange/25', 'bg-brand-orange/50', 'bg-brand-orange/75', 'bg-brand-orange-dark'];

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
        <ProfileSectionCard
            title="Activité"
            subtitle={`${totalActive} jour${totalActive > 1 ? 's' : ''} actif${totalActive > 1 ? 's' : ''} sur 12 semaines`}
        >
            {isLoading ? (
                <div className="h-24 bg-ink-50 rounded-xl animate-pulse" />
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
                    <div className="flex items-center justify-end gap-1 mt-3 text-xs text-ink-400">
                        <span>Moins</span>
                        {LEGEND.map((c) => (
                            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
                        ))}
                        <span>Plus</span>
                    </div>
                </>
            )}
        </ProfileSectionCard>
    );
}
