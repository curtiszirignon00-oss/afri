// src/pages/CommunityDetailPage.tsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Users,
    MessageSquare,
    Settings,
    Globe,
    Lock,
    Shield,
    Crown,
    CheckCircle,
    Loader2,
    ArrowLeft,
    UserPlus,
    LogOut,
    Clock,
    AlertCircle,
    Trophy,
    Calendar,
    Video,
    ExternalLink,
    MapPin,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Play,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useCommunity,
    useCommunityPosts,
    useJoinCommunity,
    useLeaveCommunity,
    useCommunityMembers,
    COMMUNITY_CATEGORIES,
    type CommunityPost,
} from '../hooks/useCommunity';
import { useAuth } from '../contexts/AuthContext';
import CommunityPostCard from '../components/community/CommunityPostCard';
import CommunityPostComposer from '../components/community/CommunityPostComposer';
import CommunityMembersModal from '../components/community/CommunityMembersModal';
import CommunitySettingsModal from '../components/community/CommunitySettingsModal';
import { Leaderboard } from '../components/challenge/Leaderboard';
import {
    usePublishedEvents,
    useIsEventsAdmin,
    useAllEvents,
    useRegisterToEvent,
    useCancelRegistration,
    usePublishEvent,
    useCancelEvent,
    useCompleteEvent,
    useDeleteEvent,
    isEventPast,
    isRegistrationOpen,
    formatEventType,
    type Event,
} from '../hooks/useEvents';
import EventFormModal from '../components/events/EventFormModal';

// Slug de la communauté du challenge AfriBourse
const CHALLENGE_COMMUNITY_SLUG = '-challenge-afribourse-du-virtuel-au-reel-';

export default function CommunityDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { isLoggedIn } = useAuth();

    // Détecter si c'est la communauté du challenge
    const isChallengeCommunity = slug === CHALLENGE_COMMUNITY_SLUG;

    const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'members' | 'leaderboard' | 'events'>(
        isChallengeCommunity ? 'leaderboard' : 'posts'
    );
    const [postsPage, setPostsPage] = useState(1);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showEventFormModal, setShowEventFormModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const { data: community, isLoading, error } = useCommunity(slug || '');

    // Events hooks (seulement pour la communauté challenge)
    const { data: isEventsAdmin } = useIsEventsAdmin();
    const { data: publishedEvents, isLoading: eventsLoading } = usePublishedEvents();
    const { data: allEvents } = useAllEvents();
    const registerToEvent = useRegisterToEvent();
    const cancelRegistration = useCancelRegistration();
    const publishEvent = usePublishEvent();
    const cancelEvent = useCancelEvent();
    const completeEvent = useCompleteEvent();
    const deleteEvent = useDeleteEvent();

    // Utiliser tous les événements si admin, sinon seulement les publiés
    const events = isEventsAdmin ? allEvents : publishedEvents;
    const { data: postsData, isLoading: postsLoading } = useCommunityPosts(community?.id || '', postsPage);
    const { data: membersData } = useCommunityMembers(community?.id || '', 1);

    const joinCommunity = useJoinCommunity();
    const leaveCommunity = useLeaveCommunity();

    const posts = postsData?.data || [];
    const totalPostsPages = postsData?.totalPages || 1;
    const members = membersData?.data || [];

    const handleJoin = async () => {
        if (!community) return;

        try {
            const result = await joinCommunity.mutateAsync(community.id);
            if (result.status === 'pending') {
                toast.success('Votre demande a ete envoyee. En attente d\'approbation.');
            } else {
                toast.success('Vous avez rejoint la communaute!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de l\'adhesion');
        }
    };

    const handleLeave = async () => {
        if (!community) return;

        if (!confirm('Etes-vous sur de vouloir quitter cette communaute?')) return;

        try {
            await leaveCommunity.mutateAsync(community.id);
            toast.success('Vous avez quitte la communaute');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors du depart');
        }
    };

    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'PUBLIC':
                return <Globe className="w-4 h-4 text-green-500" />;
            case 'PRIVATE':
                return <Lock className="w-4 h-4 text-yellow-500" />;
            case 'SECRET':
                return <Shield className="w-4 h-4 text-red-500" />;
            default:
                return <Globe className="w-4 h-4" />;
        }
    };

    const canManage = community?.memberRole === 'OWNER' || community?.memberRole === 'ADMIN';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !community) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Communaute non trouvee</h2>
                    <Link to="/communities" className="text-indigo-600 hover:underline">
                        Retour aux communautes
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Banner */}
            <div className="relative">
                <div className="h-48 bg-gradient-to-r from-indigo-600 to-purple-600">
                    {community.banner_url && (
                        <img
                            src={community.banner_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Back button */}
                <Link
                    to="/communities"
                    className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-black/30 text-white rounded-lg hover:bg-black/50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                </Link>

                {/* Community Info Overlay */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-16 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                        {/* Avatar */}
                        <div className="w-32 h-32 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden">
                            {community.avatar_url ? (
                                <img
                                    src={community.avatar_url}
                                    alt={community.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Users className="w-16 h-16 text-indigo-600" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
                                {community.is_verified && (
                                    <CheckCircle className="w-5 h-5 text-blue-500" />
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    {getVisibilityIcon(community.visibility)}
                                    <span>
                                        {community.visibility === 'PUBLIC'
                                            ? 'Publique'
                                            : community.visibility === 'PRIVATE'
                                            ? 'Privee'
                                            : 'Secrete'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{community.members_count} membres</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{community.posts_count} posts</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            {isLoggedIn && !community.isMember && !community.hasPendingRequest && (
                                <button
                                    onClick={handleJoin}
                                    disabled={joinCommunity.isPending}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {joinCommunity.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <UserPlus className="w-4 h-4" />
                                    )}
                                    Rejoindre
                                </button>
                            )}

                            {community.hasPendingRequest && (
                                <span className="flex items-center gap-2 px-6 py-3 bg-yellow-100 text-yellow-700 rounded-xl">
                                    <Clock className="w-4 h-4" />
                                    Demande en attente
                                </span>
                            )}

                            {community.isMember && community.memberRole !== 'OWNER' && (
                                <button
                                    onClick={handleLeave}
                                    disabled={leaveCommunity.isPending}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                >
                                    {leaveCommunity.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <LogOut className="w-4 h-4" />
                                    )}
                                    Quitter
                                </button>
                            )}

                            {canManage && (
                                <button
                                    onClick={() => setShowSettingsModal(true)}
                                    className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b bg-white sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        {/* Onglet Classement - uniquement pour la communauté challenge */}
                        {isChallengeCommunity && (
                            <button
                                onClick={() => setActiveTab('leaderboard')}
                                className={`py-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                                    activeTab === 'leaderboard'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Trophy className="w-4 h-4" />
                                Classement
                            </button>
                        )}
                        {/* Onglet Événements - uniquement pour la communauté challenge */}
                        {isChallengeCommunity && (
                            <button
                                onClick={() => setActiveTab('events')}
                                className={`py-4 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                                    activeTab === 'events'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Evenements
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`py-4 border-b-2 font-medium transition-colors ${
                                activeTab === 'posts'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Publications
                        </button>
                        <button
                            onClick={() => setActiveTab('about')}
                            className={`py-4 border-b-2 font-medium transition-colors ${
                                activeTab === 'about'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            A propos
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`py-4 border-b-2 font-medium transition-colors ${
                                activeTab === 'members'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Membres
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Leaderboard Tab - uniquement pour la communauté challenge */}
                {activeTab === 'leaderboard' && isChallengeCommunity && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <Trophy className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        Classement du Challenge AfriBourse 2026
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Le classement est mis a jour chaque fin de journee.
                                        Il est base sur la performance en pourcentage du portefeuille concours
                                        par rapport au capital initial de 1 000 000 FCFA.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Leaderboard limit={20} showMyRank={true} />
                    </div>
                )}

                {/* Events Tab - uniquement pour la communauté challenge */}
                {activeTab === 'events' && isChallengeCommunity && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Calendar className="w-6 h-6 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        Evenements du Challenge
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Retrouvez ici tous les webinaires, formations et evenements lies au Challenge AfriBourse 2026.
                                    </p>
                                </div>
                                {/* Bouton créer événement pour admin */}
                                {isEventsAdmin && (
                                    <button
                                        onClick={() => {
                                            setEditingEvent(null);
                                            setShowEventFormModal(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Creer
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Chargement */}
                        {eventsLoading && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                            </div>
                        )}

                        {/* Liste des événements */}
                        {!eventsLoading && events && events.length > 0 && (
                            <div className="space-y-4">
                                {events.map((event) => {
                                    const isPast = isEventPast(event);
                                    const canRegister = isRegistrationOpen(event);
                                    const eventDate = new Date(event.event_date);
                                    const day = eventDate.getDate();
                                    const month = eventDate.toLocaleString('fr-FR', { month: 'short' });
                                    const time = eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <div
                                            key={event.id}
                                            className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
                                                isPast ? 'opacity-75' : ''
                                            }`}
                                        >
                                            {/* Badge de statut */}
                                            <div
                                                className={`px-4 py-2 text-sm font-medium flex items-center justify-between ${
                                                    event.status === 'DRAFT'
                                                        ? 'bg-gray-400 text-white'
                                                        : event.status === 'CANCELLED'
                                                        ? 'bg-red-500 text-white'
                                                        : isPast
                                                        ? 'bg-gray-500 text-white'
                                                        : 'bg-indigo-600 text-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {!isPast && event.status === 'PUBLISHED' && (
                                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                                    )}
                                                    {event.status === 'DRAFT' && (
                                                        <>
                                                            <EyeOff className="w-4 h-4" />
                                                            Brouillon
                                                        </>
                                                    )}
                                                    {event.status === 'CANCELLED' && 'Annule'}
                                                    {event.status === 'PUBLISHED' && !isPast && 'A venir'}
                                                    {(event.status === 'PUBLISHED' || event.status === 'COMPLETED') && isPast && 'Termine'}
                                                </div>
                                                <span className="text-xs opacity-75">
                                                    {formatEventType(event.type)}
                                                </span>
                                            </div>

                                            <div className="p-6">
                                                <div className="flex items-start gap-4">
                                                    {/* Date */}
                                                    <div
                                                        className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                                                            isPast ? 'bg-gray-100' : 'bg-indigo-100'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`text-2xl font-bold ${
                                                                isPast ? 'text-gray-500' : 'text-indigo-600'
                                                            }`}
                                                        >
                                                            {day}
                                                        </span>
                                                        <span
                                                            className={`text-xs uppercase ${
                                                                isPast ? 'text-gray-400' : 'text-indigo-500'
                                                            }`}
                                                        >
                                                            {month}
                                                        </span>
                                                    </div>

                                                    {/* Contenu */}
                                                    <div className="flex-1">
                                                        <h4
                                                            className={`font-semibold text-lg mb-1 ${
                                                                isPast ? 'text-gray-700' : 'text-gray-900'
                                                            }`}
                                                        >
                                                            {event.title}
                                                        </h4>
                                                        <p
                                                            className={`text-sm mb-3 ${
                                                                isPast ? 'text-gray-500' : 'text-gray-600'
                                                            }`}
                                                        >
                                                            {event.description}
                                                        </p>
                                                        <div
                                                            className={`flex flex-wrap items-center gap-4 text-sm ${
                                                                isPast ? 'text-gray-400' : 'text-gray-500'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{time} ({event.timezone})</span>
                                                            </div>
                                                            {event.is_online ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Video className="w-4 h-4" />
                                                                    <span>
                                                                        {event.platform === 'zoom'
                                                                            ? 'Zoom'
                                                                            : event.platform === 'google_meet'
                                                                            ? 'Google Meet'
                                                                            : event.platform === 'teams'
                                                                            ? 'Microsoft Teams'
                                                                            : 'En ligne'}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="w-4 h-4" />
                                                                    <span>{event.physical_location}</span>
                                                                </div>
                                                            )}
                                                            {event._count && (
                                                                <div className="flex items-center gap-1">
                                                                    <Users className="w-4 h-4" />
                                                                    <span>
                                                                        {event._count.registrations} inscrit(s)
                                                                        {event.max_participants && ` / ${event.max_participants}`}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Lien de réunion pour les inscrits */}
                                                        {event.isRegistered && event.meeting_url && !isPast && (
                                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                                <p className="text-sm text-green-700 font-medium mb-1">
                                                                    Vous etes inscrit !
                                                                </p>
                                                                <a
                                                                    href={event.meeting_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    Acceder a la reunion
                                                                </a>
                                                                {event.meeting_id && (
                                                                    <p className="text-xs text-green-600 mt-1">
                                                                        ID: {event.meeting_id}
                                                                        {event.meeting_password && ` | Mot de passe: ${event.meeting_password}`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                                    <span className="text-sm text-gray-500">
                                                        {event.is_free ? 'Gratuit' : `${event.price?.toLocaleString()} FCFA`}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        {/* Boutons admin */}
                                                        {isEventsAdmin && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingEvent(event);
                                                                        setShowEventFormModal(true);
                                                                    }}
                                                                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                    title="Modifier"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </button>

                                                                {event.status === 'DRAFT' && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await publishEvent.mutateAsync(event.id);
                                                                                toast.success('Evenement publie');
                                                                            } catch (err) {
                                                                                toast.error('Erreur lors de la publication');
                                                                            }
                                                                        }}
                                                                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                        title="Publier"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                )}

                                                                {event.status === 'PUBLISHED' && !isPast && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (confirm('Annuler cet evenement ?')) {
                                                                                try {
                                                                                    await cancelEvent.mutateAsync(event.id);
                                                                                    toast.success('Evenement annule');
                                                                                } catch (err) {
                                                                                    toast.error('Erreur');
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Annuler"
                                                                    >
                                                                        <EyeOff className="w-4 h-4" />
                                                                    </button>
                                                                )}

                                                                {isPast && event.status === 'PUBLISHED' && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            const replayUrl = prompt('URL du replay (optionnel):');
                                                                            try {
                                                                                await completeEvent.mutateAsync({
                                                                                    eventId: event.id,
                                                                                    replay_url: replayUrl || undefined,
                                                                                });
                                                                                toast.success('Evenement marque comme termine');
                                                                            } catch (err) {
                                                                                toast.error('Erreur');
                                                                            }
                                                                        }}
                                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="Marquer termine"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={async () => {
                                                                        if (confirm('Supprimer cet evenement ?')) {
                                                                            try {
                                                                                await deleteEvent.mutateAsync(event.id);
                                                                                toast.success('Evenement supprime');
                                                                            } catch (err) {
                                                                                toast.error('Erreur');
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Boutons utilisateur */}
                                                        {!isPast && event.status === 'PUBLISHED' && (
                                                            <>
                                                                {event.isRegistered ? (
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await cancelRegistration.mutateAsync(event.id);
                                                                                toast.success('Inscription annulee');
                                                                            } catch (err: any) {
                                                                                toast.error(err.response?.data?.error || 'Erreur');
                                                                            }
                                                                        }}
                                                                        disabled={cancelRegistration.isPending}
                                                                        className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                                                                    >
                                                                        Annuler inscription
                                                                    </button>
                                                                ) : canRegister && isLoggedIn ? (
                                                                    <button
                                                                        onClick={async () => {
                                                                            try {
                                                                                await registerToEvent.mutateAsync(event.id);
                                                                                toast.success('Inscription reussie !');
                                                                            } catch (err: any) {
                                                                                toast.error(err.response?.data?.error || 'Erreur');
                                                                            }
                                                                        }}
                                                                        disabled={registerToEvent.isPending}
                                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                                                                    >
                                                                        {registerToEvent.isPending ? (
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                        ) : (
                                                                            <UserPlus className="w-4 h-4" />
                                                                        )}
                                                                        S'inscrire
                                                                    </button>
                                                                ) : !isLoggedIn ? (
                                                                    <Link
                                                                        to="/login"
                                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                                                    >
                                                                        Connectez-vous pour vous inscrire
                                                                    </Link>
                                                                ) : (
                                                                    <span className="text-sm text-gray-500">
                                                                        Inscriptions fermees
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Replay */}
                                                        {isPast && event.replay_url && (
                                                            <a
                                                                href={event.replay_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                                Voir le replay
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Message si pas d'événements */}
                        {!eventsLoading && (!events || events.length === 0) && (
                            <div className="bg-white rounded-xl p-12 text-center">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Aucun evenement programme
                                </h3>
                                <p className="text-gray-600">
                                    Les prochains evenements seront annonces ici. Restez connectes!
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Posts Tab */}
                {activeTab === 'posts' && (
                    <div className="max-w-2xl mx-auto">
                        {/* Post Composer */}
                        {community.isMember && (
                            <div className="mb-6">
                                <CommunityPostComposer communityId={community.id} />
                            </div>
                        )}

                        {/* Posts Loading */}
                        {postsLoading && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                            </div>
                        )}

                        {/* Posts Empty */}
                        {!postsLoading && posts.length === 0 && (
                            <div className="bg-white rounded-xl p-12 text-center">
                                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Aucune publication
                                </h3>
                                <p className="text-gray-600">
                                    {community.isMember
                                        ? 'Soyez le premier a publier dans cette communaute!'
                                        : 'Rejoignez la communaute pour voir et publier des contenus.'}
                                </p>
                            </div>
                        )}

                        {/* Posts List */}
                        {!postsLoading && posts.length > 0 && (
                            <div className="space-y-6">
                                {posts.map((post: CommunityPost) => (
                                    <CommunityPostCard
                                        key={post.id}
                                        post={post}
                                        communityId={community.id}
                                        canModerate={canManage}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Posts Pagination */}
                        {totalPostsPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <button
                                    onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                                    disabled={postsPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Precedent
                                </button>
                                <span className="px-4 py-2 text-gray-600">
                                    Page {postsPage} sur {totalPostsPages}
                                </span>
                                <button
                                    onClick={() => setPostsPage((p) => Math.min(totalPostsPages, p + 1))}
                                    disabled={postsPage === totalPostsPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* About Tab */}
                {activeTab === 'about' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Description */}
                        {community.description && (
                            <div className="bg-white rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{community.description}</p>
                            </div>
                        )}

                        {/* Category */}
                        {community.category && (
                            <div className="bg-white rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Categorie</h3>
                                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                                    {COMMUNITY_CATEGORIES.find((c) => c.value === community.category)?.label ||
                                        community.category}
                                </span>
                            </div>
                        )}

                        {/* Tags */}
                        {community.tags && community.tags.length > 0 && (
                            <div className="bg-white rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {community.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rules */}
                        {community.rules && community.rules.length > 0 && (
                            <div className="bg-white rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Regles de la communaute</h3>
                                <div className="space-y-4">
                                    {community.rules.map((rule, index) => (
                                        <div key={index} className="flex gap-3">
                                            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium text-gray-900">{rule.title}</p>
                                                <p className="text-sm text-gray-600">{rule.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Creator */}
                        <div className="bg-white rounded-xl p-6">
                            <h3 className="font-semibold text-gray-900 mb-3">Creee par</h3>
                            <Link
                                to={`/profile/${community.creator.id}`}
                                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg -m-2"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                    {community.creator.profile?.avatar_url ? (
                                        <img
                                            src={community.creator.profile.avatar_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Users className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {community.creator.name} {community.creator.lastname}
                                    </p>
                                    {community.creator.profile?.username && (
                                        <p className="text-sm text-gray-500">@{community.creator.profile.username}</p>
                                    )}
                                </div>
                                <Crown className="w-5 h-5 text-yellow-500 ml-auto" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white rounded-xl overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">
                                    {community.members_count} membres
                                </h3>
                                {canManage && (
                                    <button
                                        onClick={() => setShowMembersModal(true)}
                                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                    >
                                        Gerer les membres
                                    </button>
                                )}
                            </div>

                            <div className="divide-y">
                                {members.slice(0, 10).map((member) => (
                                    <Link
                                        key={member.id}
                                        to={`/profile/${member.user.id}`}
                                        className="flex items-center gap-3 p-4 hover:bg-gray-50"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                            {member.user.profile?.avatar_url ? (
                                                <img
                                                    src={member.user.profile.avatar_url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Users className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {member.user.name} {member.user.lastname}
                                            </p>
                                            {member.user.profile?.username && (
                                                <p className="text-sm text-gray-500">
                                                    @{member.user.profile.username}
                                                </p>
                                            )}
                                        </div>
                                        {member.role === 'OWNER' && (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                                <Crown className="w-3 h-3" />
                                                Proprietaire
                                            </span>
                                        )}
                                        {member.role === 'ADMIN' && (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                                <Shield className="w-3 h-3" />
                                                Admin
                                            </span>
                                        )}
                                        {member.role === 'MODERATOR' && (
                                            <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                <Shield className="w-3 h-3" />
                                                Modo
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {community.members_count > 10 && (
                                <button
                                    onClick={() => setShowMembersModal(true)}
                                    className="w-full p-4 text-center text-indigo-600 hover:bg-gray-50 font-medium"
                                >
                                    Voir tous les membres
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showMembersModal && (
                <CommunityMembersModal
                    communityId={community.id}
                    canManage={canManage}
                    onClose={() => setShowMembersModal(false)}
                />
            )}

            {showSettingsModal && (
                <CommunitySettingsModal
                    community={community}
                    onClose={() => setShowSettingsModal(false)}
                />
            )}

            {/* Modal création/édition événement */}
            {showEventFormModal && (
                <EventFormModal
                    isOpen={showEventFormModal}
                    onClose={() => {
                        setShowEventFormModal(false);
                        setEditingEvent(null);
                    }}
                    event={editingEvent}
                />
            )}
        </div>
    );
}
