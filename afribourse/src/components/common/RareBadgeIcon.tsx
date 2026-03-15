// Displays the rarest unlocked badge icon inline next to a username.
// Pass `badge` from the author/entry's `rare_badge` field, or use
// `getRareBadge(achievements)` to compute it from a UserAchievement array.

import type { AchievementRarity } from '../../types';

export interface RareBadge {
    icon: string;
    rarity: AchievementRarity;
    name: string;
}

const RARITY_RANK: Record<string, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };

/** Picks the rarest badge from an array of user achievements (profile.achievements). */
export function getRareBadge(
    achievements?: Array<{ achievement: { icon: string; rarity: string; name: string } }>
): RareBadge | null {
    if (!achievements || achievements.length === 0) return null;
    const best = achievements.reduce((prev, cur) =>
        (RARITY_RANK[cur.achievement.rarity] ?? 0) > (RARITY_RANK[prev.achievement.rarity] ?? 0) ? cur : prev
    );
    return {
        icon: best.achievement.icon,
        rarity: best.achievement.rarity as AchievementRarity,
        name: best.achievement.name,
    };
}

const RARITY_STYLE: Record<AchievementRarity, string> = {
    legendary: 'ring-2 ring-amber-400 bg-amber-50',
    epic:      'ring-2 ring-purple-400 bg-purple-50',
    rare:      'ring-2 ring-blue-400 bg-blue-50',
    common:    'ring-1 ring-gray-300 bg-gray-50',
};

interface Props {
    badge?: RareBadge | null;
    size?: 'xs' | 'sm';
}

export default function RareBadgeIcon({ badge, size = 'sm' }: Props) {
    if (!badge) return null;

    const dim = size === 'xs' ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs';

    return (
        <span
            title={badge.name}
            className={`inline-flex items-center justify-center rounded-full flex-shrink-0 ${dim} ${RARITY_STYLE[badge.rarity]}`}
        >
            {badge.icon}
        </span>
    );
}
