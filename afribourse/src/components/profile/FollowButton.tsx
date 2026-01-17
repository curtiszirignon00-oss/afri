// src/components/profile/FollowButton.tsx
import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollowUser, useUnfollowUser } from '../../hooks/useSocial';
import toast from 'react-hot-toast';

interface FollowButtonProps {
    userId: string;
    initialFollowing?: boolean;
}

export default function FollowButton({ userId, initialFollowing = false }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing);

    // Synchroniser avec initialFollowing quand il change (ex: après chargement des données)
    useEffect(() => {
        setIsFollowing(initialFollowing);
    }, [initialFollowing]);
    const followMutation = useFollowUser();
    const unfollowMutation = useUnfollowUser();

    const isLoading = followMutation.isPending || unfollowMutation.isPending;

    const handleClick = () => {
        if (isFollowing) {
            unfollowMutation.mutate(userId, {
                onSuccess: () => {
                    setIsFollowing(false);
                    toast.success('Vous ne suivez plus cet utilisateur');
                },
                onError: () => {
                    toast.error('Erreur lors du désabonnement');
                },
            });
        } else {
            followMutation.mutate(userId, {
                onSuccess: () => {
                    setIsFollowing(true);
                    toast.success('Vous suivez maintenant cet utilisateur');
                },
                onError: () => {
                    toast.error('Erreur lors de l\'abonnement');
                },
            });
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : isFollowing ? (
                <>
                    <UserMinus className="w-5 h-5" />
                    <span className="hidden sm:inline">Se désabonner</span>
                </>
            ) : (
                <>
                    <UserPlus className="w-5 h-5" />
                    <span className="hidden sm:inline">Suivre</span>
                </>
            )}
        </button>
    );
}
