import { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
    X,
    Download,
    Share2,
    CheckCircle,
    Star,
    Award,
    Printer
} from 'lucide-react';

interface CertificateModalProps {
    onClose: () => void;
    userName: string;
    modulesCompleted: number;
    totalModules: number;
    averageScore: number;
    durationDays: number;
    certId: string;
}

const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function CertificateModal({
    onClose,
    userName,
    modulesCompleted,
    totalModules,
    averageScore,
    durationDays,
    certId
}: CertificateModalProps) {
    const certRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'pdf' | 'card'>('pdf');
    const [downloading, setDownloading] = useState(false);

    const now = new Date();
    const dateStr = `${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`;
    const verifyUrl = `afribourse.com/verify/${certId}`;

    const downloadImage = useCallback(async () => {
        const node = activeTab === 'pdf' ? certRef.current : cardRef.current;
        if (!node) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: activeTab === 'pdf' ? '#ffffff' : undefined,
            });
            const link = document.createElement('a');
            link.download = `certificat-afribourse-${certId}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Erreur téléchargement certificat:', err);
        } finally {
            setDownloading(false);
        }
    }, [activeTab, certId]);

    const printCertificate = useCallback(() => {
        const node = certRef.current;
        if (!node) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
              <head>
                <title>Certificat AfriBourse - ${userName}</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: 'Segoe UI', Arial, sans-serif; background: white; }
                  @media print { @page { margin: 0; size: A4 landscape; } }
                </style>
              </head>
              <body>${node.outerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    }, [userName]);

    const shareLinkedIn = useCallback(() => {
        const url = `https://${verifyUrl}`;
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
    }, [verifyUrl]);

    const shareWhatsApp = useCallback(() => {
        const text = `🎓 Je viens de terminer le Parcours Investisseur BRVM sur AfriBourse !\n\n✅ ${modulesCompleted}/${totalModules} modules complétés\n📊 Score final : ${averageScore}%\n⏱️ Durée : ${durationDays} jours\n\n🔗 Vérifier mon certificat : https://${verifyUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    }, [modulesCompleted, totalModules, averageScore, durationDays, verifyUrl]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center p-2 pt-4 sm:p-4 sm:pt-8 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-8"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-gray-900">Mon Certificat</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6">
                    <button
                        onClick={() => setActiveTab('pdf')}
                        className={`py-3 px-1 mr-6 text-xs font-semibold tracking-widest uppercase border-b-2 transition-colors ${
                            activeTab === 'pdf'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Format PDF téléchargeable
                    </button>
                    <button
                        onClick={() => setActiveTab('card')}
                        className={`py-3 px-1 text-xs font-semibold tracking-widest uppercase border-b-2 transition-colors ${
                            activeTab === 'card'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Format carte partage (LinkedIn / WhatsApp)
                    </button>
                </div>

                {/* Certificate PDF */}
                {activeTab === 'pdf' && (
                    <div className="p-6">
                        <div
                            ref={certRef}
                            className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden"
                            style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
                        >
                            {/* Cert header */}
                            <div className="flex justify-between items-start px-4 py-4 sm:px-8 sm:py-6 border-b-2 border-gray-100">
                                <div>
                                    <div className="text-2xl font-bold">
                                        <span className="text-indigo-600">Afri</span>
                                        <span className="text-gray-900">bourse</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        Plateforme d'éducation financière BRVM
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-gray-400 tracking-widest uppercase">
                                        Certificat Officiel
                                    </div>
                                    <div className="text-sm font-semibold text-gray-700 mt-0.5">
                                        {dateStr}
                                    </div>
                                </div>
                            </div>

                            {/* Cert body */}
                            <div className="px-4 py-6 sm:px-8 sm:py-8 relative">
                                {/* Watermark */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                                    aria-hidden="true"
                                >
                                    <div
                                        className="text-7xl font-black text-indigo-50 tracking-widest uppercase"
                                        style={{ transform: 'rotate(-25deg)', letterSpacing: '0.3em' }}
                                    >
                                        CERTIFIÉ
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <div className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-3">
                                        Certification de Réussite
                                    </div>

                                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                                        Parcours complet — Investir à la BRVM
                                    </h1>

                                    <p className="text-sm text-gray-500 mb-8">
                                        Tous les modules du programme de formation ont été complétés avec succès.
                                    </p>

                                    <div className="mb-6">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                                            Décerné à
                                        </div>
                                        <div className="text-2xl font-bold text-indigo-600">
                                            {userName}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-8">
                                        {[
                                            { label: 'Modules', value: `${modulesCompleted} / ${totalModules}` },
                                            { label: 'Score Final', value: `${averageScore} %` },
                                            { label: 'Durée', value: `${durationDays} jours` },
                                        ].map(stat => (
                                            <div
                                                key={stat.label}
                                                className="bg-indigo-50 border border-indigo-100 rounded-lg p-3"
                                            >
                                                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                                                    {stat.label}
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">
                                                    {stat.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                                        <div className="text-xs text-gray-400 break-all sm:break-normal">
                                            Vérifier ce certificat :{' '}
                                            <span className="text-indigo-600 font-medium">{verifyUrl}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1 self-start sm:self-auto">
                                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-xs font-semibold text-green-600">
                                                Certifié valide
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Share Card */}
                {activeTab === 'card' && (
                    <div className="p-6">
                        <div
                            ref={cardRef}
                            className="rounded-2xl overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, #4338ca 0%, #3730a3 50%, #312e81 100%)',
                                fontFamily: "'Segoe UI', Arial, sans-serif",
                                maxWidth: 400,
                                margin: '0 auto',
                            }}
                        >
                            {/* Card header */}
                            <div className="flex items-center justify-between px-6 pt-5 pb-4">
                                <div className="text-white text-xl font-bold">
                                    <span className="text-white">Afri</span>
                                    <span className="text-indigo-300">bourse</span>
                                </div>
                                <div className="bg-white/20 border border-white/30 rounded-full px-3 py-0.5 text-xs font-bold text-white tracking-wide">
                                    Certifié
                                </div>
                            </div>

                            <div className="px-6 pb-6">
                                {/* Star icon */}
                                <div className="w-12 h-12 rounded-full bg-yellow-400/20 border-2 border-yellow-400/40 flex items-center justify-center mb-4">
                                    <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                                </div>

                                <div className="text-indigo-300 text-xs font-bold tracking-widest uppercase mb-1">
                                    Certificat de Réussite
                                </div>
                                <div className="text-white text-xl font-bold mb-1">
                                    Parcours Investisseur BRVM
                                </div>
                                <div className="text-indigo-200 text-sm mb-5">
                                    {userName} a complété le parcours complet
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 mb-5">
                                    {[
                                        { label: 'Modules', value: String(modulesCompleted) },
                                        { label: 'Score', value: `${averageScore}%` },
                                        { label: 'Durée', value: `${durationDays}j` },
                                    ].map(stat => (
                                        <div
                                            key={stat.label}
                                            className="rounded-xl py-3 px-2 text-center"
                                            style={{ background: 'rgba(255,255,255,0.12)' }}
                                        >
                                            <div className="text-white text-lg font-bold leading-tight">
                                                {stat.value}
                                            </div>
                                            <div className="text-indigo-300 text-xs font-semibold uppercase tracking-wide mt-0.5">
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div
                                    className="text-center text-xs text-indigo-300 pt-4"
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
                                >
                                    afribourse.com · Éducation financière BRVM · Zone UEMOA
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={downloadImage}
                            disabled={downloading}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            {downloading ? 'Génération...' : 'Télécharger PNG'}
                        </button>

                        {activeTab === 'pdf' && (
                            <button
                                onClick={printCertificate}
                                className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Imprimer / PDF
                            </button>
                        )}

                        {activeTab === 'card' && (
                            <>
                                <button
                                    onClick={shareLinkedIn}
                                    className="flex items-center gap-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Partager LinkedIn
                                </button>
                                <button
                                    onClick={shareWhatsApp}
                                    className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Partager WhatsApp
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
