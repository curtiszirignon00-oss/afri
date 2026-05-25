// src/components/certificate/CertificateShareButtons.tsx
import { useState } from 'react';
import { Linkedin, MessageCircle, Twitter, Facebook, Instagram, Link, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  certificateId: string;
  moduleName: string;
  certificateUrl: string;
}

export default function CertificateShareButtons({ certificateId, moduleName, certificateUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const { isLoggedIn } = useAuth();

  const trackShare = async (network: string) => {
    if (!isLoggedIn) return;
    try {
      await apiClient.post(`/certificates/${certificateId}/shared`, { network });
    } catch {
      // non-bloquant
    }
  };

  const encodedUrl = encodeURIComponent(certificateUrl);
  const linkedinText = encodeURIComponent(`Je viens de compléter le webinaire ${moduleName} avec l'Académie Afribourse 🏅 #BRVM #Finance #Afrique`);
  const whatsappText = encodeURIComponent(`🏅 Je viens d'obtenir mon certificat ${moduleName} — Académie Afribourse. ${certificateUrl}`);
  const twitterText = encodeURIComponent(`Je viens de compléter ${moduleName} avec @Afribourse 🏅 #BRVM #Investissement #Afrique`);

  const handleInstagram = async () => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}/download`);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `certificat-afribourse.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Image téléchargée — ouvrez Instagram et partagez depuis votre galerie !', { duration: 5000 });
      await trackShare('instagram');
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(certificateUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await trackShare('copy');
    } catch {
      toast.error('Impossible de copier le lien');
    }
  };

  const openShare = (url: string, network: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
    trackShare(network);
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${linkedinText}`, 'linkedin')}
        className="flex items-center gap-1.5 px-3 py-2 bg-[#0077B5] text-white rounded-lg text-sm font-medium hover:bg-[#006097] transition-colors"
      >
        <Linkedin size={15} />
        LinkedIn
      </button>

      <button
        onClick={() => openShare(`https://wa.me/?text=${whatsappText}`, 'whatsapp')}
        className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#20BD5C] transition-colors"
      >
        <MessageCircle size={15} />
        WhatsApp
      </button>

      <button
        onClick={() => openShare(`https://twitter.com/intent/tweet?text=${twitterText}&url=${encodedUrl}`, 'twitter')}
        className="flex items-center gap-1.5 px-3 py-2 bg-[#1DA1F2] text-white rounded-lg text-sm font-medium hover:bg-[#0d8fd9] transition-colors"
      >
        <Twitter size={15} />
        Twitter/X
      </button>

      <button
        onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, 'facebook')}
        className="flex items-center gap-1.5 px-3 py-2 bg-[#1877F2] text-white rounded-lg text-sm font-medium hover:bg-[#166FE5] transition-colors"
      >
        <Facebook size={15} />
        Facebook
      </button>

      <button
        onClick={handleInstagram}
        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors"
      >
        <Instagram size={15} />
        Instagram
      </button>

      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          copied ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {copied ? <Check size={15} /> : <Link size={15} />}
        {copied ? 'Copié ✓' : 'Copier le lien'}
      </button>
    </div>
  );
}
