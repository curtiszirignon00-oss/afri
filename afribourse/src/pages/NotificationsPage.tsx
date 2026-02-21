// src/pages/NotificationsPage.tsx
import { useState } from 'react';
import { Bell, Check, CheckCheck, Heart, MessageCircle, UserPlus, TrendingUp, Award, Star, AlertTriangle, ArrowLeft, Filter, Users, UserCheck, UserX, Mail, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    useNotifications,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead,
    type Notification
} from '../hooks/useNotifications';

// Icon mapping for notification types
const notificationIcons: Record<string, { icon: typeof Bell; color: string; bgColor: string }> = {
    NEW_POST: { icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    NEW_FOLLOWER: { icon: UserPlus, color: 'text-green-600', bgColor: 'bg-green-100' },
    POST_LIKE: { icon: Heart, color: 'text-red-500', bgColor: 'bg-red-100' },
    POST_COMMENT: { icon: MessageCircle, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    COMMENT_REPLY: { icon: MessageCircle, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    MENTION: { icon: Star, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    ACHIEVEMENT: { icon: Award, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    LEVEL_UP: { icon: Award, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    PRICE_ALERT: { icon: AlertTriangle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    COMMUNITY_INVITE: { icon: Mail, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    COMMUNITY_JOIN: { icon: Users, color: 'text-teal-600', bgColor: 'bg-teal-100' },
    COMMUNITY_POST: { icon: MessageCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    JOIN_REQUEST: { icon: UserPlus, color: 'text-violet-600', bgColor: 'bg-violet-100' },
    JOIN_APPROVED: { icon: UserCheck, color: 'text-green-600', bgColor: 'bg-green-100' },
    JOIN_REJECTED: { icon: UserX, color: 'text-red-600', bgColor: 'bg-red-100' },
    SYSTEM: { icon: Info, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onClick: () => void;
}

function NotificationCard({ notification, onMarkAsRead, onClick }: NotificationCardProps) {
    const iconConfig = notificationIcons[notification.type] || { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    const IconComponent = iconConfig.icon;

    const handleClick = () => {
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }
        onClick();
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                !notification.is_read ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'
            }`}
        >
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${iconConfig.bgColor} flex items-center justify-center`}>
                <IconComponent className={`w-6 h-6 ${iconConfig.color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-base ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notification.title}
                    </p>
                    {!notification.is_read && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2" />
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-2">{formatTimeAgo(notification.created_at)}</p>
            </div>
            {!notification.is_read && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                    }}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Marquer comme lu"
                >
                    <Check className="w-4 h-4 text-gray-400 hover:text-green-600" />
                </button>
            )}
        </div>
    );
}

export default function NotificationsPage() {
    const [page, setPage] = useState(1);
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const navigate = useNavigate();

    const { data: notificationsData, isLoading, isFetching } = useNotifications(page, showUnreadOnly);
    const markAsRead = useMarkNotificationAsRead();
    const markAllAsRead = useMarkAllNotificationsAsRead();

    const handleNotificationClick = (notification: Notification) => {
        // Navigate based on notification type
        const meta = notification.metadata;

        if (notification.type === 'NEW_FOLLOWER' && notification.actor_id) {
            navigate(`/investor/${notification.actor_id}`);
        } else if (notification.type === 'PRICE_ALERT') {
            navigate('/dashboard');
        } else if (['COMMUNITY_INVITE', 'JOIN_APPROVED', 'COMMUNITY_POST', 'COMMUNITY_JOIN'].includes(notification.type) && meta?.communitySlug) {
            navigate(`/community/${meta.communitySlug}`);
        } else if (notification.type === 'JOIN_REQUEST' && meta?.communitySlug) {
            navigate(`/community/${meta.communitySlug}`);
        } else if (notification.post_id) {
            navigate(`/community?post=${notification.post_id}`);
        } else if (notification.type === 'ACHIEVEMENT' || notification.type === 'LEVEL_UP') {
            navigate('/dashboard');
        }
    };

    const notifications = notificationsData?.data || [];
    const totalPages = notificationsData?.totalPages || 1;
    const unreadCount = notificationsData?.unreadCount || 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                            {unreadCount > 0 && (
                                <p className="text-sm text-gray-500">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                showUnreadOnly
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            Non lues
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead.mutate()}
                                disabled={markAllAsRead.isPending}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Tout marquer lu
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100">
                        <Bell className="w-16 h-16 text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            {showUnreadOnly ? 'Aucune notification non lue' : 'Aucune notification'}
                        </h2>
                        <p className="text-gray-500 text-center max-w-sm">
                            {showUnreadOnly
                                ? 'Vous avez lu toutes vos notifications.'
                                : 'Vous recevrez des notifications lorsque quelqu\'un interagira avec vous.'}
                        </p>
                        {showUnreadOnly && (
                            <button
                                onClick={() => setShowUnreadOnly(false)}
                                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Voir toutes les notifications
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={(id) => markAsRead.mutate(id)}
                                onClick={() => handleNotificationClick(notification)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || isFetching}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Précédent
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-600">
                            Page {page} sur {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || isFetching}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Suivant
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
