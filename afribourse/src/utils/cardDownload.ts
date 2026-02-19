// src/utils/cardDownload.ts
import { toPng } from 'html-to-image';

/**
 * Convert a DOM element to a PNG data URL
 */
export async function cardToDataUrl(element: HTMLElement): Promise<string> {
    return toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
    });
}

/**
 * Download a DOM element as a PNG image
 */
export async function downloadCardAsImage(element: HTMLElement, filename: string = 'afribourse-card'): Promise<void> {
    const dataUrl = await cardToDataUrl(element);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
}

/**
 * Convert data URL to Blob for sharing
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return res.blob();
}

/**
 * Share card image via Web Share API (mobile native sharing)
 */
export async function shareCardNative(element: HTMLElement, text: string): Promise<boolean> {
    if (!navigator.share || !navigator.canShare) return false;

    try {
        const dataUrl = await cardToDataUrl(element);
        const blob = await dataUrlToBlob(dataUrl);
        const file = new File([blob], 'afribourse-card.png', { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
            await navigator.share({
                text,
                files: [file],
            });
            return true;
        }
    } catch {
        // User cancelled or share failed
    }
    return false;
}
