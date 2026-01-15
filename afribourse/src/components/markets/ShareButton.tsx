// src/components/markets/ShareButton.tsx
import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareButtonProps {
    stockIds: string[];
}

export default function ShareButton({ stockIds }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const generateShareLink = () => {
        const ids = stockIds.join(',');
        return `${window.location.origin}${window.location.pathname}?compare=${ids}`;
    };

    const copyToClipboard = async () => {
        try {
            const link = generateShareLink();
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success('Lien copié dans le presse-papier !');

            // Reset icon after 2s
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error('Erreur lors de la copie du lien');
        }
    };

    return (
        <button
            onClick={copyToClipboard}
            disabled={stockIds.length === 0}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Partager la comparaison"
        >
            {copied ? (
                <>
                    <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span className="hidden sm:inline">Copié !</span>
                </>
            ) : (
                <>
                    <Share2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    <span className="hidden sm:inline">Partager</span>
                </>
            )}
        </button>
    );

}
