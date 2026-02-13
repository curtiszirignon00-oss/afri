// src/components/notifications/NotificationDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Heart, MessageCircle, UserPlus, TrendingUp, Award, Star, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    useNotifications,
    useUnreadNotificationCount,
    useMarkNotificationAsRead,
    useMarkAllNotificationsAsRead,
    type Notification
} from '../../hooks/useNotifications';

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
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onClick: () => void;
}

function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
    const iconConfig = notificationIcons[notification.type] || { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    const IconComponent = iconConfig.icon;

    const handleClick = () => {
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${
                !notification.is_read ? 'bg-blue-50/50' : ''
            }`}
        >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconConfig.bgColor} flex items-center justify-center`}>
                <IconComponent className={`w-5 h-5 ${iconConfig.color}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notification.title}
                </p>
                <p className="text-sm text-gray-500 truncate">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notification.created_at)}</p>
            </div>
            {!notification.is_read && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2" />
            )}
        </button>
    );
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const { data: unreadCount = 0 } = useUnreadNotificationCount();
    const { data: notificationsData, isLoading } = useNotifications(1, false);
    const markAsRead = useMarkNotificationAsRead();
    const markAllAsRead = useMarkAllNotificationsAsRead();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = () => {
        setIsOpen(false);
        navigate('/notifications');
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead.mutate();
    };

    const notifications = notificationsData?.data || [];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    disabled={markAllAsRead.isPending}
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Tout marquer lu
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                                <p className="text-sm">Aucune notification</p>
                                <p className="text-xs text-gray-400 mt-1">Vous serez notifié ici</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={(id) => markAsRead.mutate(id)}
                                        onClick={() => handleNotificationClick()}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-gray-100 p-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/notifications');
                                }}
                                className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Voir toutes les notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
