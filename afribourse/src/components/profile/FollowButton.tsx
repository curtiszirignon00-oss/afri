// src/components/profile/FollowButton.tsx
import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollowUser, useUnfollowUser } from '../../hooks/useSocial';
import toast from 'react-hot-toast';

interface FollowButtonProps {
    userId: string;
    initialFollowing?: boolean;
    /** Habillage pour le hero navy : aplat blanc / contour blanc au lieu de l'orange. */
    onDark?: boolean;
    size?: 'sm' | 'md';
}

export default function FollowButton({ userId, initialFollowing = false, onDark = false, size = 'md' }: FollowButtonProps) {
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

    // Suivre = action principale, donc l'orange de marque sur fond clair. Sur le
    // hero navy l'orange voisinerait avec le bouton « Partager ma carte » : on
    // bascule sur l'aplat blanc, l'autre traitement primaire de la charte.
    const skin = onDark
        ? isFollowing
            ? 'bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20 focus-visible:ring-white focus-visible:ring-offset-brand-navy'
            : 'bg-white text-brand-navy hover:bg-ink-50 shadow-sm focus-visible:ring-white focus-visible:ring-offset-brand-navy'
        : isFollowing
            ? 'bg-ink-100 text-ink-700 hover:bg-ink-200 focus-visible:ring-brand-navy'
            : 'bg-brand-orange text-white hover:bg-brand-orange-hover shadow-sm hover:shadow-md hover:shadow-brand-orange/30 focus-visible:ring-brand-orange';

    const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-sm gap-1.5' : 'px-6 py-2.5 gap-2';
    const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`flex items-center rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                ${sizeClass} ${skin} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {isLoading ? (
                <Loader2 className={`${iconClass} animate-spin`} />
            ) : isFollowing ? (
                <>
                    <UserMinus className={iconClass} />
                    <span className={size === 'sm' ? '' : 'hidden sm:inline'}>Se désabonner</span>
                </>
            ) : (
                <>
                    <UserPlus className={iconClass} />
                    <span className={size === 'sm' ? '' : 'hidden sm:inline'}>Suivre</span>
                </>
            )}
        </button>
    );
}
