// src/pages/CommunityPostDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Heart, MessageCircle, Lock, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import {
    useCommunityPost,
    useLikeCommunityPost,
    useUnlikeCommunityPost,
} from '../hooks/useCommunity';
import { SECTION_CONFIG } from '../config/communitySections';
import { useAuth } from '../contexts/AuthContext';
import CommunityCommentSection from '../components/community/CommunityCommentSection';

export default function CommunityPostDetailPage() {
    const { postId } = useParams<{ postId: string }>();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const { data: post, isLoading, error } = useCommunityPost(postId || '');

    const likePost = useLikeCommunityPost();
    const unlikePost = useUnlikeCommunityPost();
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [likesCount, setLikesCount] = useState<number>(0);
    const [showComments, setShowComments] = useState(false);

    // Initialise l'état du like quand le post est chargé
    useEffect(() => {
        if (post) {
            setIsLiked(!!post.hasLiked);
            setLikesCount(post.likes_count || 0);
        }
    }, [post?.id]);

    const handleLike = async () => {
        if (!isLoggedIn || !post) {
            toast.error('Connectez-vous pour aimer ce contenu');
            return;
        }
        try {
            if (isLiked) {
                await unlikePost.mutateAsync(post.id);
                setIsLiked(false);
                setLikesCount((c) => Math.max(0, c - 1));
            } else {
                await likePost.mutateAsync(post.id);
                setIsLiked(true);
                setLikesCount((c) => c + 1);
            }
        } catch {
            toast.error('Erreur');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Contenu introuvable</h2>
                    <p className="text-gray-600 mb-6">Ce contenu n'existe pas ou n'est pas accessible.</p>
                    <Link to="/communities" className="text-indigo-600 hover:underline">Retour aux communautés</Link>
                </div>
            </div>
        );
    }

    const sectionCfg = post.section ? SECTION_CONFIG[post.section] : null;
    const communitySlug = (post as any).community?.slug;
    const htmlUrl = post.metadata?.html_url;
    const locked = post.metadata?.locked;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Barre supérieure */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <button
                        onClick={() => (communitySlug ? navigate(`/communities/${communitySlug}`) : navigate('/communities'))}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Retour</span>
                    </button>
                    {sectionCfg && (
                        <span className="text-sm text-gray-500">{sectionCfg.emoji} {sectionCfg.label}</span>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* En-tête du contenu */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
                    {post.title && <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>}

                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                        <Link to={`/profile/${post.author.id}`} className="flex items-center gap-2 hover:text-gray-700">
                            <div className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                {post.author.profile?.avatar_url ? (
                                    <img src={post.author.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-semibold text-gray-600">{post.author.name[0]}</span>
                                )}
                            </div>
                            <span className="font-medium text-gray-700">{post.author.name} {post.author.lastname}</span>
                            {post.author.profile?.verified_investor && <CheckCircle className="w-4 h-4 text-blue-500" />}
                        </Link>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                        </span>
                    </div>

                    {post.content && (
                        <p className="text-gray-700 mt-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    )}
                </div>

                {/* Contenu HTML (page dédiée) */}
                {locked ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center gap-3">
                        <Lock className="w-6 h-6 text-amber-500 flex-shrink-0" />
                        <p className="text-amber-800">
                            Ce contenu est réservé aux membres de niveau {post.metadata?.unlock_level}+.
                            Continuez à progresser pour le débloquer.
                        </p>
                    </div>
                ) : htmlUrl ? (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <iframe
                            src={htmlUrl}
                            title={post.title || 'Contenu'}
                            className="w-full"
                            style={{ height: '80vh', border: 'none' }}
                            sandbox="allow-popups allow-popups-to-escape-sandbox"
                        />
                    </div>
                ) : null}

                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm mt-4 px-6 py-3 flex items-center gap-6">
                    <button
                        onClick={handleLike}
                        disabled={likePost.isPending || unlikePost.isPending}
                        className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{likesCount}</span>
                    </button>
                    <button
                        onClick={() => setShowComments((v) => !v)}
                        className="flex items-center gap-2 text-gray-500 hover:text-indigo-500 transition-colors"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.comments_count}</span>
                    </button>
                </div>

                {/* Commentaires */}
                {showComments && (
                    <div className="bg-white rounded-xl shadow-sm mt-4">
                        <CommunityCommentSection postId={post.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
