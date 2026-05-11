import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Shield, Clock, Users } from 'lucide-react';
import WebinarSection from '../components/learning/WebinarSection';

export default function WebinarPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-14 sm:px-6">
          <button
            onClick={() => navigate('/learn')}
            className="flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-sm mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'académie
          </button>

          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Live · Formation
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Webinaires de formation Afribourse
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mb-10">
            Des sessions live animées par nos experts marchés et analystes. Apprenez à investir sur la BRVM, décryptez les données financières et maîtrisez les graphiques — en direct, avec questions en temps réel.
          </p>

          {/* 3 Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Users className="w-5 h-5" />, title: 'Experts BRVM', desc: 'Analystes Afribourse & spécialistes marchés africains' },
              { icon: <Clock className="w-5 h-5" />, title: 'Sessions live', desc: 'Questions en temps réel, cas pratiques et exercices' },
              { icon: <Shield className="w-5 h-5" />, title: 'Contenu exclusif', desc: 'Supports PDF inclus, replay disponible pendant 30 jours' },
            ].map((p) => (
              <div key={p.title} className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-blue-300 mt-0.5 flex-shrink-0">{p.icon}</div>
                <div>
                  <p className="font-semibold text-white text-sm">{p.title}</p>
                  <p className="text-blue-300 text-xs mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Webinar cards — reuses the existing WebinarSection */}
      <div className="-mt-6">
        <WebinarSection />
      </div>

      {/* FAQ / Garanties */}
      <div className="max-w-3xl mx-auto px-4 pb-20 sm:px-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 mt-4">Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Comment se déroule un webinaire Afribourse ?',
              a: 'Chaque session est diffusée en live via Zoom ou Google Meet. Vous recevez le lien de connexion par email 24h avant la session. Un chat en direct vous permet de poser vos questions en temps réel.',
            },
            {
              q: 'Puis-je revoir le replay si je suis indisponible ?',
              a: "Oui. Le replay est disponible pendant 30 jours après la session pour tous les participants inscrits, même si vous n'avez pas pu assister en direct.",
            },
            {
              q: 'Qu\'est-ce que la préinscription ?',
              a: 'La préinscription vous réserve votre place et vous garantit le tarif early bird si vous confirmez votre paiement avant la date limite. Vous recevrez les instructions de paiement par email.',
            },
            {
              q: 'Le contenu est-il adapté aux débutants ?',
              a: 'Chaque webinaire indique son niveau. "Maîtriser les fondamentaux" est conçu pour les débutants complets. "Analyse fondamentale" et "Analyse technique" nécessitent des bases en finance.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="bg-white rounded-xl border border-gray-200 p-5 group">
              <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between gap-2">
                {q}
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg leading-none">›</span>
              </summary>
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <p className="font-bold text-lg mb-1">Complétez aussi l'académie en ligne</p>
          <p className="text-blue-200 text-sm mb-4">
            Modules écrits, quiz, certificat — apprenez à votre rythme entre les webinaires.
          </p>
          <button
            onClick={() => navigate('/learn')}
            className="bg-white text-blue-700 font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Accéder à l'académie
          </button>
        </div>
      </div>
    </div>
  );
}
