// src/components/profile/SocialStats.tsx
import { Users, UserPlus, FileText, Lock } from 'lucide-react';
import { Card } from '../ui';

interface SocialStatsProps {
    profile: any;
}

export default function SocialStats({ profile }: SocialStatsProps) {
    const investorProfile = profile.investorProfile;
    const showFollowers = investorProfile?.show_followers_count !== false;
    const showFollowing = investorProfile?.show_following_count !== false;

    const stats = [
        {
            label: 'Abonnés',
            value: profile.stats?.followers_count || 0,
            icon: Users,
            color: 'blue',
            visible: showFollowers,
        },
        {
            label: 'Abonnements',
            value: profile.stats?.following_count || 0,
            icon: UserPlus,
            color: 'purple',
            visible: showFollowing,
        },
        {
            label: 'Publications',
            value: profile.stats?.posts_count || 0,
            icon: FileText,
            color: 'green',
            visible: true,
        },
    ];

    return (
        <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistiques</h3>
            <div className="space-y-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                                    <Icon className={`w-4 h-4 text-${stat.color}-600`} />
                                </div>
                                <span className="text-sm text-gray-600">{stat.label}</span>
                            </div>
                            {stat.visible ? (
                                <span className="font-semibold text-gray-900">{stat.value}</span>
                            ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
