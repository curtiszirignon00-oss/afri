// src/hooks/useShare.ts
import { useState } from 'react';
import type { ShareData } from '../types/share';

export function useShare() {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState<ShareData | null>(null);

    const openShareModal = (data: ShareData) => {
        setShareData(data);
        setIsShareModalOpen(true);
    };

    const closeShareModal = () => {
        setIsShareModalOpen(false);
        setShareData(null);
    };

    return {
        isShareModalOpen,
        shareData,
        openShareModal,
        closeShareModal,
    };
}
