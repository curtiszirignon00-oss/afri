// src/components/profile/ShareCardModal.tsx
// Carte ADN partageable (image sociale façon Spotify Wrapped).
import { useState } from 'react';
import { X, Download, Share2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';
import { trackShareCardGenerated, trackShareCardDownloaded } from '../../lib/amplitude';

interface ShareCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    username?: string | null;
    dnaType?: string | null;
}

type Format = 'square' | 'story';

export default function ShareCardModal({ isOpen, onClose, username, dnaType }: ShareCardModalProps) {
    const [format, setFormat] = useState<Format>('square');
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    if (!username) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center" onClick={(e) => e.stopPropagation()}>
                    <p className="text-gray-700">Définis d'abord un nom d'utilisateur pour générer ta carte.</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium">Fermer</button>
                </div>
            </div>
        );
    }

    const imageUrl = `${API_BASE_URL}/og/image/profile/${encodeURIComponent(username)}?format=${format}`;

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `afribourse-${username}-${format}.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            trackShareCardDownloaded(dnaType || 'unknown', format);
            toast.success('Carte téléchargée !');
        } catch {
            toast.error('Échec du téléchargement');
        } finally {
            setDownloading(false);
        }
    };

    const handleNativeShare = async () => {
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const file = new File([blob], `afribourse-${username}.png`, { type: 'image/png' });
            const shareData: ShareData = {
                title: 'Mon ADN Investisseur — AfriBourse',
                text: 'Découvre mon Passeport Investisseur sur AfriBourse',
                url: `${window.location.origin}/u/${username}`,
            };
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ ...shareData, files: [file] });
            } else if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url!);
                toast.success('Lien copié !');
            }
            trackShareCardGenerated(dnaType || 'unknown', format);
        } catch {
            /* annulé par l'utilisateur */
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Partager ma carte</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-5">
                    {/* Toggle format */}
                    <div className="flex gap-2 mb-4">
                        {(['square', 'story'] as Format[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFormat(f)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 ${format === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {f === 'square' ? 'Carré (1:1)' : 'Story (9:16)'}
                            </button>
                        ))}
                    </div>

                    {/* Aperçu */}
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center">
                        <img
                            src={imageUrl}
                            alt="Carte ADN Investisseur"
                            className={`rounded-lg shadow ${format === 'story' ? 'max-h-[50vh]' : 'w-full'}`}
                            loading="lazy"
                        />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                        >
                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Télécharger
                        </button>
                        <button
                            onClick={handleNativeShare}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                        >
                            <Share2 className="w-4 h-4" />
                            Partager
                        </button>
                    </div>
                    <p className="mt-3 text-[11px] text-gray-400 text-center">
                        Portefeuille virtuel — simulation pédagogique.
                    </p>
                </div>
            </div>
        </div>
    );
}
