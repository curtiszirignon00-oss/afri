// src/pages/CommunitiesPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    Plus,
    Search,
    Globe,
    Lock,
    Shield,
    Loader2,
    MessageSquare,
    Crown,
    CheckCircle,
    TrendingUp,
} from 'lucide-react';
import { useCommunities, useUserCommunities, COMMUNITY_CATEGORIES, type Community } from '../hooks/useCommunity';
import { useAuth } from '../contexts/AuthContext';
import CreateCommunityModal from '../components/community/CreateCommunityModal';

export default function CommunitiesPage() {
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const {
        data: discoverData,
        isLoading: discoverLoading,
    } = useCommunities(page, { search, category: category || undefined });

    const {
        data: myData,
        isLoading: myLoading,
    } = useUserCommunities(page);

    const isLoading = activeTab === 'discover' ? discoverLoading : myLoading;
    const communities = activeTab === 'discover' ? discoverData?.data || [] : myData?.data || [];
    const totalPages = activeTab === 'discover' ? discoverData?.totalPages || 1 : myData?.totalPages || 1;

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

    const getVisibilityLabel = (visibility: string) => {
        switch (visibility) {
            case 'PUBLIC':
                return 'Publique';
            case 'PRIVATE':
                return 'Privee';
            case 'SECRET':
                return 'Secrete';
            default:
                return visibility;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Communautes</h1>
                                <p className="text-indigo-100">
                                    Rejoignez des groupes d'investisseurs et partagez vos connaissances
                                </p>
                            </div>
                        </div>
                        {isAuthenticated && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Creer une communaute
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => { setActiveTab('discover'); setPage(1); }}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                            activeTab === 'discover'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Decouvrir
                    </button>
                    {isAuthenticated && (
                        <button
                            onClick={() => { setActiveTab('my'); setPage(1); }}
                            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                                activeTab === 'my'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            Mes communautes
                        </button>
                    )}
                </div>

                {/* Filters (only for discover tab) */}
                {activeTab === 'discover' && (
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher une communaute..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                            className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Toutes les categories</option>
                            {COMMUNITY_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && communities.length === 0 && (
                    <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {activeTab === 'my'
                                ? "Vous n'avez rejoint aucune communaute"
                                : 'Aucune communaute trouvee'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {activeTab === 'my'
                                ? 'Explorez les communautes et rejoignez celles qui vous interessent.'
                                : 'Essayez de modifier vos criteres de recherche.'}
                        </p>
                        {activeTab === 'my' && (
                            <button
                                onClick={() => setActiveTab('discover')}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                            >
                                Decouvrir des communautes
                            </button>
                        )}
                    </div>
                )}

                {/* Communities Grid */}
                {!isLoading && communities.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communities.map((community: Community) => (
                            <Link
                                key={community.id}
                                to={`/communities/${community.slug}`}
                                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Banner */}
                                <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                                    {community.banner_url && (
                                        <img
                                            src={community.banner_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    {community.is_verified && (
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Officielle
                                        </div>
                                    )}
                                    {community.is_featured && (
                                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            En vedette
                                        </div>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div className="relative px-4">
                                    <div className="absolute -top-8 w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                                        {community.avatar_url ? (
                                            <img
                                                src={community.avatar_url}
                                                alt={community.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Users className="w-8 h-8 text-indigo-600" />
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="pt-10 px-4 pb-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {community.name}
                                        </h3>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            {getVisibilityIcon(community.visibility)}
                                            <span>{getVisibilityLabel(community.visibility)}</span>
                                        </div>
                                    </div>

                                    {community.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {community.description}
                                        </p>
                                    )}

                                    {community.category && (
                                        <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full mb-3">
                                            {COMMUNITY_CATEGORIES.find(c => c.value === community.category)?.label || community.category}
                                        </span>
                                    )}

                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{community.members_count} membres</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageSquare className="w-4 h-4" />
                                            <span>{community.posts_count} posts</span>
                                        </div>
                                    </div>

                                    {/* Membership badge */}
                                    {community.isMember && (
                                        <div className="mt-3 flex items-center gap-2 text-sm">
                                            {community.memberRole === 'OWNER' && (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                                                    <Crown className="w-3 h-3" />
                                                    Proprietaire
                                                </span>
                                            )}
                                            {community.memberRole === 'ADMIN' && (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                                    <Shield className="w-3 h-3" />
                                                    Admin
                                                </span>
                                            )}
                                            {community.memberRole === 'MODERATOR' && (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                    <Shield className="w-3 h-3" />
                                                    Moderateur
                                                </span>
                                            )}
                                            {community.memberRole === 'MEMBER' && (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Membre
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Precedent
                        </button>
                        <span className="px-4 py-2 text-gray-600">
                            Page {page} sur {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Suivant
                        </button>
                    </div>
                )}
            </div>

            {/* Create Community Modal */}
            {showCreateModal && (
                <CreateCommunityModal onClose={() => setShowCreateModal(false)} />
            )}
        </div>
    );
}
