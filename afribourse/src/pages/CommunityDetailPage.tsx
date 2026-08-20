// src/pages/CommunityDetailPage.tsx
//
// Fiche d'une communaute. Meme grammaire visuelle que la liste /communities :
// bandeau d'identite navy, onglets en pastilles, contenus en cartes blanches
// arrondies. Les listes (membres, classement) reprennent l'anatomie de la
// liste des actions : un filet entre les lignes, l'identite a gauche et les
// chiffres a droite.
const POSTS_DISABLED = false;
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
    BadgeCheck,
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
    Share2,
    Copy,
    RefreshCw,
    Info,
    CheckCircle,
    Tag,
    X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useCommunity,
    useCommunityPosts,
    useJoinCommunity,
    useLeaveCommunity,
    useCommunityMembers,
    useGetInviteLink,
    useRegenerateInviteLink,
    COMMUNITY_CATEGORIES,
    type CommunityPost,
} from '../hooks/useCommunity';

import { useAuth } from '../contexts/AuthContext';
import CommunityPostCard from '../components/community/CommunityPostCard';
import CommunityPostComposer from '../components/community/CommunityPostComposer';
import CommunitySectionComposer from '../components/community/CommunitySectionComposer';
import CommunitySectionBar from '../components/community/CommunitySectionBar';
import CommunityMembersModal from '../components/community/CommunityMembersModal';
import { isSectionsCommunity, canPostInSection, SECTION_CONFIG, type CommunitySection } from '../config/communitySections';
import CommunitySettingsModal from '../components/community/CommunitySettingsModal';
import { Leaderboard } from '../components/challenge/Leaderboard';
import { HERO_BACKGROUNDS, HERO_GRID_STYLE } from '../utils/heroBackgrounds';
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
const CHALLENGE_COMMUNITY_SLUG = '-challenge-afribourse-le-hub-de-lelite';

/** Pastille d'onglet : navy pleine quand active, blanche cernee sinon. */
function tabClass(isActive: boolean) {
    return `flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
        isActive
            ? 'bg-brand-navy text-white shadow-sm'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-brand-navy'
    }`;
}

export default function CommunityDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const { isLoggedIn, userProfile } = useAuth();

    // Détecter si c'est la communauté du challenge
    const isChallengeCommunity = slug === CHALLENGE_COMMUNITY_SLUG;

    const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'members' | 'leaderboard' | 'events'>(
        isChallengeCommunity ? 'leaderboard' : 'posts'
    );
    const [postsPage, setPostsPage] = useState(1);
    const [activeSection, setActiveSection] = useState<CommunitySection>('MES_ANALYSES');
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showEventFormModal, setShowEventFormModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    const SectionIcon = SECTION_CONFIG[activeSection].icon;

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
    const sectionsEnabled = isSectionsCommunity(slug, community?.settings);
    const { data: postsData, isLoading: postsLoading } = useCommunityPosts(
        community?.id || '',
        postsPage,
        sectionsEnabled ? activeSection : undefined
    );
    const { data: membersData } = useCommunityMembers(community?.id || '', 1);

    const joinCommunity = useJoinCommunity();
    const leaveCommunity = useLeaveCommunity();
    const getInviteLink = useGetInviteLink();
    const regenerateInvite = useRegenerateInviteLink();

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

    const handleOpenInvite = async () => {
        if (!community) return;
        setShowInviteModal(true);
        if (!inviteLink) {
            try {
                const result = await getInviteLink.mutateAsync(community.id);
                setInviteLink(`${window.location.origin}/communities/join/${result.invite_token}`);
            } catch {
                toast.error('Erreur lors de la génération du lien d\'invitation');
            }
        }
    };

    const handleRegenerateInvite = async () => {
        if (!community) return;
        try {
            const result = await regenerateInvite.mutateAsync(community.id);
            setInviteLink(`${window.location.origin}/communities/join/${result.invite_token}`);
            toast.success('Lien d\'invitation regénéré');
        } catch {
            toast.error('Erreur lors de la regénération du lien');
        }
    };

    const handleCopyInviteLink = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        toast.success('Lien copié !');
    };

    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'PRIVATE':
                return <Lock className="w-4 h-4" />;
            case 'SECRET':
                return <Shield className="w-4 h-4" />;
            default:
                return <Globe className="w-4 h-4" />;
        }
    };

    const canManage = community?.memberRole === 'OWNER' || community?.memberRole === 'ADMIN' || userProfile?.role === 'admin';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
            </div>
        );
    }

    if (error || !community) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center max-w-md w-full">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Communaute non trouvee</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Cette communaute n'existe plus ou son lien a change.
                    </p>
                    <Link
                        to="/communities"
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navy-hover transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux communautes
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Bandeau d'identite : la signature navy du site, ou la banniere
                de la communaute voilee pour garder le texte lisible. */}
            <div
                className="relative overflow-hidden"
                style={{ backgroundImage: HERO_BACKGROUNDS[0].gradient }}
            >
                {community.banner_url && (
                    <>
                        <img
                            src={community.banner_url}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-brand-navy/80" />
                    </>
                )}
                {!community.banner_url && (
                    <>
                        <div className="absolute inset-0" style={{ backgroundImage: HERO_BACKGROUNDS[0].halo }} />
                        <div className="absolute inset-0 opacity-[0.07]" style={HERO_GRID_STYLE} />
                    </>
                )}

                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
                    <Link
                        to="/communities"
                        className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux communautes
                    </Link>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        {/* Avatar */}
                        <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                            {community.avatar_url ? (
                                <img
                                    src={community.avatar_url}
                                    alt={community.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Users className="w-9 h-9 text-brand-navy" />
                            )}
                        </div>

                        {/* Identite */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate">
                                    {community.name}
                                </h1>
                                {community.is_verified && (
                                    <BadgeCheck className="w-5 h-5 text-brand-orange shrink-0" aria-label="Communaute officielle" />
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/70">
                                <span className="flex items-center gap-1.5">
                                    {getVisibilityIcon(community.visibility)}
                                    {community.visibility === 'PUBLIC'
                                        ? 'Publique'
                                        : community.visibility === 'PRIVATE'
                                        ? 'Privee'
                                        : 'Secrete'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" />
                                    <span className="font-mono tabular-nums text-white">{community.members_count}</span>
                                    membres
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="font-mono tabular-nums text-white">{community.posts_count}</span>
                                    publications
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {canManage && (
                                <button
                                    onClick={handleOpenInvite}
                                    className="inline-flex items-center gap-2 h-11 px-4 rounded-lg border-2 border-white/80 text-white text-sm font-semibold hover:bg-white hover:text-brand-navy transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Inviter
                                </button>
                            )}

                            {isLoggedIn && !community.isMember && !community.hasPendingRequest && (
                                <button
                                    onClick={handleJoin}
                                    disabled={joinCommunity.isPending}
                                    className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-brand-orange text-white text-sm font-semibold shadow-sm hover:bg-brand-orange-hover disabled:opacity-50 transition-colors"
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
                                <span className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-white/10 border border-white/25 text-white text-sm font-semibold">
                                    <Clock className="w-4 h-4" />
                                    Demande en attente
                                </span>
                            )}

                            {community.isMember && community.memberRole !== 'OWNER' && (
                                <button
                                    onClick={handleLeave}
                                    disabled={leaveCommunity.isPending}
                                    className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-white/10 border border-white/25 text-white text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition-colors"
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
                                    className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-white/10 border border-white/25 text-white hover:bg-white/20 transition-colors"
                                    title="Parametres"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Onglets en pastilles, comme la bascule de /communities */}
            <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
                        {isChallengeCommunity && (
                            <button onClick={() => setActiveTab('leaderboard')} className={tabClass(activeTab === 'leaderboard')}>
                                <Trophy className="w-4 h-4" />
                                Classement
                            </button>
                        )}
                        {isChallengeCommunity && (
                            <button onClick={() => setActiveTab('events')} className={tabClass(activeTab === 'events')}>
                                <Calendar className="w-4 h-4" />
                                Evenements
                            </button>
                        )}
                        <button onClick={() => setActiveTab('posts')} className={tabClass(activeTab === 'posts')}>
                            <MessageSquare className="w-4 h-4" />
                            Publications
                        </button>
                        <button onClick={() => setActiveTab('about')} className={tabClass(activeTab === 'about')}>
                            <Info className="w-4 h-4" />
                            A propos
                        </button>
                        <button onClick={() => setActiveTab('members')} className={tabClass(activeTab === 'members')}>
                            <Users className="w-4 h-4" />
                            Membres
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenu */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Classement : uniquement pour la communaute challenge */}
                {activeTab === 'leaderboard' && isChallengeCommunity && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border-2 border-brand-orange shadow-sm p-5 sm:p-6">
                            <div className="flex items-start gap-4">
                                <span className="w-11 h-11 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0">
                                    <Trophy className="w-5 h-5 text-brand-orange-dark" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-1">
                                        Classement du Challenge AfriBourse 2026
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Le classement est mis a jour chaque fin de journee. Il repose sur la
                                        performance en pourcentage du portefeuille concours, rapportee au capital
                                        initial de 1 000 000 FCFA.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Leaderboard limit={20} showMyRank={true} />
                    </div>
                )}

                {/* Evenements : uniquement pour la communaute challenge */}
                {activeTab === 'events' && isChallengeCommunity && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                            <div className="flex items-start gap-4">
                                <span className="w-11 h-11 rounded-xl bg-ink-50 flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5 text-brand-navy" />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 mb-1">Evenements du challenge</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Retrouvez ici les webinaires, formations et rendez-vous lies au Challenge
                                        AfriBourse 2026.
                                    </p>
                                </div>
                                {isEventsAdmin && (
                                    <button
                                        onClick={() => {
                                            setEditingEvent(null);
                                            setShowEventFormModal(true);
                                        }}
                                        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-orange text-white text-sm font-semibold shadow-sm hover:bg-brand-orange-hover transition-colors shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Creer
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Chargement */}
                        {eventsLoading && (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
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

                                    const statusClass =
                                        event.status === 'CANCELLED'
                                            ? 'bg-red-50 text-red-600 border-red-200'
                                            : event.status === 'DRAFT' || isPast
                                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                                            : 'bg-brand-navy text-white border-brand-navy';

                                    return (
                                        <div
                                            key={event.id}
                                            className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 ${
                                                isPast ? 'opacity-80' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-4 sm:gap-5">
                                                {/* Date */}
                                                <div
                                                    className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                                                        isPast ? 'bg-gray-100' : 'bg-brand-navy'
                                                    }`}
                                                >
                                                    <span
                                                        className={`text-2xl font-bold font-mono leading-none ${
                                                            isPast ? 'text-gray-500' : 'text-white'
                                                        }`}
                                                    >
                                                        {day}
                                                    </span>
                                                    <span
                                                        className={`text-[11px] uppercase mt-1 ${
                                                            isPast ? 'text-gray-400' : 'text-white/70'
                                                        }`}
                                                    >
                                                        {month}
                                                    </span>
                                                </div>

                                                {/* Contenu */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${statusClass}`}
                                                        >
                                                            {event.status === 'DRAFT' && <EyeOff className="w-3 h-3" />}
                                                            {event.status === 'DRAFT' && 'Brouillon'}
                                                            {event.status === 'CANCELLED' && 'Annule'}
                                                            {event.status === 'PUBLISHED' && !isPast && 'A venir'}
                                                            {(event.status === 'PUBLISHED' || event.status === 'COMPLETED') && isPast && 'Termine'}
                                                        </span>
                                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                                            {formatEventType(event.type)}
                                                        </span>
                                                    </div>

                                                    <h4 className="font-bold text-lg text-gray-900 mb-1">
                                                        {event.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                                        {event.description}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="w-4 h-4 text-gray-400" />
                                                            {time} ({event.timezone})
                                                        </span>
                                                        {event.is_online ? (
                                                            <span className="flex items-center gap-1.5">
                                                                <Video className="w-4 h-4 text-gray-400" />
                                                                {event.platform === 'zoom'
                                                                    ? 'Zoom'
                                                                    : event.platform === 'google_meet'
                                                                    ? 'Google Meet'
                                                                    : event.platform === 'teams'
                                                                    ? 'Microsoft Teams'
                                                                    : 'En ligne'}
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                                {event.physical_location}
                                                            </span>
                                                        )}
                                                        {event._count && (
                                                            <span className="flex items-center gap-1.5">
                                                                <Users className="w-4 h-4 text-gray-400" />
                                                                <span className="font-mono tabular-nums text-gray-700">
                                                                    {event._count.registrations}
                                                                </span>
                                                                inscrit(s)
                                                                {event.max_participants && (
                                                                    <span className="font-mono text-gray-400">
                                                                        {' / '}{event.max_participants}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Lien de réunion pour les inscrits */}
                                                    {event.isRegistered && event.meeting_url && !isPast && (
                                                        <div className="mt-3 p-3 bg-ink-50 border border-ink-100 rounded-xl">
                                                            <p className="text-sm text-brand-navy font-semibold mb-1 flex items-center gap-1.5">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Vous etes inscrit
                                                            </p>
                                                            <a
                                                                href={event.meeting_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-2 text-brand-navy hover:text-brand-navy-hover text-sm font-medium underline underline-offset-2"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                                Acceder a la reunion
                                                            </a>
                                                            {event.meeting_id && (
                                                                <p className="text-xs text-gray-500 mt-1 font-mono">
                                                                    ID: {event.meeting_id}
                                                                    {event.meeting_password && ` | Mot de passe: ${event.meeting_password}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {event.is_free ? 'Gratuit' : `${event.price?.toLocaleString('fr-FR')} FCFA`}
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
                                                                className="p-2 text-gray-400 hover:text-brand-navy hover:bg-ink-50 rounded-lg transition-colors"
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
                                                                    className="p-2 text-gray-400 hover:text-brand-navy hover:bg-ink-50 rounded-lg transition-colors"
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
                                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                                                                    className="p-2 text-gray-400 hover:text-brand-navy hover:bg-ink-50 rounded-lg transition-colors"
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
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                                                                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                                                                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-orange text-white text-sm font-semibold shadow-sm hover:bg-brand-orange-hover transition-colors disabled:opacity-50"
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
                                                                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navy-hover transition-colors"
                                                                >
                                                                    Connectez-vous pour vous inscrire
                                                                </Link>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">
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
                                                            className="inline-flex items-center gap-2 text-brand-navy hover:text-brand-navy-hover text-sm font-semibold"
                                                        >
                                                            <Play className="w-4 h-4" />
                                                            Voir le replay
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Message si pas d'événements */}
                        {!eventsLoading && (!events || events.length === 0) && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    Aucun evenement programme
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    Les prochains rendez-vous seront annonces ici.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Publications */}
                {activeTab === 'posts' && (
                    <div className="max-w-3xl mx-auto">
                        {/* Barre de rubriques (communautés à sections) */}
                        {sectionsEnabled && (
                            <CommunitySectionBar
                                active={activeSection}
                                onChange={(s) => {
                                    setActiveSection(s);
                                    setPostsPage(1);
                                }}
                            />
                        )}

                        {/* Post Composer */}
                        {!POSTS_DISABLED && community.isMember && (
                            sectionsEnabled ? (
                                canPostInSection(activeSection, canManage) ? (
                                    <div className="mb-6">
                                        <CommunitySectionComposer
                                            communityId={community.id}
                                            section={activeSection}
                                            isAdmin={canManage}
                                        />
                                    </div>
                                ) : (
                                    <div className="mb-6 bg-white rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-500 flex items-center justify-center gap-2 text-center">
                                        <SectionIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                        Cette rubrique est en lecture seule : seul l'administrateur peut y publier.
                                        Vous pouvez liker et commenter.
                                    </div>
                                )
                            ) : (
                                <div className="mb-6">
                                    <CommunityPostComposer communityId={community.id} canModerate={canManage} />
                                </div>
                            )
                        )}

                        {/* Posts Loading */}
                        {postsLoading && (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
                            </div>
                        )}

                        {/* Posts Empty */}
                        {!postsLoading && posts.length === 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    Aucune publication
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {community.isMember
                                        ? 'Soyez le premier a publier dans cette communaute.'
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
                            <div className="flex justify-center items-center gap-2 mt-8">
                                <button
                                    onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                                    disabled={postsPage === 1}
                                    className="h-10 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-white disabled:opacity-50 transition-colors"
                                >
                                    Precedent
                                </button>
                                <span className="px-4 text-sm text-gray-500 font-mono tabular-nums">
                                    {postsPage} / {totalPostsPages}
                                </span>
                                <button
                                    onClick={() => setPostsPage((p) => Math.min(totalPostsPages, p + 1))}
                                    disabled={postsPage === totalPostsPages}
                                    className="h-10 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-white disabled:opacity-50 transition-colors"
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* A propos */}
                {activeTab === 'about' && (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Description */}
                        {community.description && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                                <h3 className="font-bold text-gray-900 mb-3">Description</h3>
                                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                                    {community.description}
                                </p>
                            </div>
                        )}

                        {/* Categorie et tags */}
                        {(community.category || (community.tags && community.tags.length > 0)) && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                                <h3 className="font-bold text-gray-900 mb-3">Categorie et mots-cles</h3>
                                <div className="flex flex-wrap gap-2">
                                    {community.category && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-navy text-white text-sm font-semibold rounded-full">
                                            <Tag className="w-3.5 h-3.5" />
                                            {COMMUNITY_CATEGORIES.find((c) => c.value === community.category)?.label ||
                                                community.category}
                                        </span>
                                    )}
                                    {community.tags?.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-ink-50 text-brand-navy border border-ink-100 rounded-full text-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regles */}
                        {community.rules && community.rules.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Regles de la communaute</h3>
                                <div className="space-y-4">
                                    {community.rules.map((rule, index) => (
                                        <div key={index} className="flex gap-3">
                                            <span className="w-7 h-7 bg-ink-50 text-brand-navy border border-ink-100 rounded-lg flex items-center justify-center text-sm font-bold font-mono flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="font-semibold text-gray-900">{rule.title}</p>
                                                <p className="text-sm text-gray-600 leading-relaxed">{rule.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Createur */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                            <h3 className="font-bold text-gray-900 mb-3">Creee par</h3>
                            <Link
                                to={`/profile/${community.creator.id}`}
                                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl -m-2 transition-colors"
                            >
                                <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-[#173F66] flex items-center justify-center overflow-hidden shrink-0">
                                    {community.creator.profile?.avatar_url ? (
                                        <img
                                            src={community.creator.profile.avatar_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-white">
                                            {community.creator.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </span>
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">
                                        {community.creator.name} {community.creator.lastname}
                                    </p>
                                    {community.creator.profile?.username && (
                                        <p className="text-sm text-gray-400">@{community.creator.profile.username}</p>
                                    )}
                                </div>
                                <Crown className="w-5 h-5 text-brand-orange ml-auto shrink-0" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Membres : meme anatomie que la liste des actions */}
                {activeTab === 'members' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">
                                    <span className="font-mono tabular-nums">{community.members_count}</span> membres
                                </h3>
                                {canManage && (
                                    <button
                                        onClick={() => setShowMembersModal(true)}
                                        className="text-sm text-brand-navy hover:text-brand-navy-hover font-semibold"
                                    >
                                        Gerer les membres
                                    </button>
                                )}
                            </div>

                            <ul className="divide-y divide-gray-100">
                                {members.slice(0, 10).map((member) => (
                                    <li key={member.id}>
                                        <Link
                                            to={`/profile/${member.user.id}`}
                                            className="group flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-[#173F66] flex items-center justify-center overflow-hidden shrink-0">
                                                {member.user.profile?.avatar_url ? (
                                                    <img
                                                        src={member.user.profile.avatar_url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-bold text-white">
                                                        {member.user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className="block font-bold text-gray-900 truncate group-hover:text-brand-navy transition-colors">
                                                    {member.user.name} {member.user.lastname}
                                                </span>
                                                {member.user.profile?.username && (
                                                    <span className="block text-xs text-gray-400 mt-1 truncate">
                                                        @{member.user.profile.username}
                                                    </span>
                                                )}
                                            </span>
                                            {member.role === 'OWNER' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-orange/10 text-brand-orange-dark rounded-full text-xs font-semibold shrink-0">
                                                    <Crown className="w-3 h-3" />
                                                    Proprietaire
                                                </span>
                                            )}
                                            {member.role === 'ADMIN' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ink-100 text-brand-navy-hover rounded-full text-xs font-semibold shrink-0">
                                                    <Shield className="w-3 h-3" />
                                                    Admin
                                                </span>
                                            )}
                                            {member.role === 'MODERATOR' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-ink-50 text-brand-navy rounded-full text-xs font-semibold shrink-0">
                                                    <Shield className="w-3 h-3" />
                                                    Modo
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                            {community.members_count > 10 && (
                                <button
                                    onClick={() => setShowMembersModal(true)}
                                    className="w-full py-4 text-center text-sm text-brand-navy hover:bg-gray-50 font-semibold border-t border-gray-100 transition-colors"
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

            {/* Modal lien d'invitation */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-xl bg-ink-50 flex items-center justify-center shrink-0">
                                    <Share2 className="w-4 h-4 text-brand-navy" />
                                </span>
                                <h3 className="font-bold text-gray-900">Inviter des membres</h3>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-5">
                            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                Partagez ce lien pour permettre à d'autres personnes de rejoindre <strong>{community.name}</strong>.
                                Même les communautés privées et secrètes peuvent être rejointes via ce lien.
                            </p>

                            {getInviteLink.isPending ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
                                </div>
                            ) : inviteLink ? (
                                <>
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            readOnly
                                            value={inviteLink}
                                            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 truncate focus:outline-none"
                                        />
                                        <button
                                            onClick={handleCopyInviteLink}
                                            className="p-2 bg-brand-navy text-white rounded-lg hover:bg-brand-navy-hover transition-colors flex-shrink-0"
                                            title="Copier le lien"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleCopyInviteLink}
                                        className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-brand-orange text-white text-sm font-semibold shadow-sm hover:bg-brand-orange-hover transition-colors mb-3"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copier le lien d'invitation
                                    </button>

                                    <button
                                        onClick={handleRegenerateInvite}
                                        disabled={regenerateInvite.isPending}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        {regenerateInvite.isPending ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-3 h-3" />
                                        )}
                                        Regénérer le lien (invalide l'ancien)
                                    </button>
                                </>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    Erreur lors de la génération du lien
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
