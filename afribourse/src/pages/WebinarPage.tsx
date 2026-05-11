import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Shield, Clock, Users, ShieldCheck } from 'lucide-react';
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

      {/* Garantie satisfaction */}
      <div className="max-w-3xl mx-auto px-4 pt-10 sm:px-6">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative flex items-start gap-5">
            <div className="flex-shrink-0 bg-white/20 rounded-2xl p-3">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-200 mb-1">Garantie satisfaction</p>
              <h3 className="text-xl font-extrabold leading-snug mb-2">
                Pas satisfait ? On vous rembourse. Sans condition.
              </h3>
              <p className="text-emerald-100 text-sm leading-relaxed">
                Si à la fin du webinaire vous estimez que le contenu ne correspond pas à vos attentes,
                envoyez-nous un email dans les 48h — nous vous remboursons intégralement.
                Aucun justificatif, aucune question.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {['Remboursement en 48h', 'Sans justificatif', 'Zéro condition'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    <span className="text-emerald-300">✓</span> {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 pb-20 sm:px-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 mt-10">Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Et si le webinaire ne répond pas à mes attentes ?',
              a: "On vous rembourse. Intégralement, sans condition, sans justificatif à fournir. Envoyez-nous simplement un email dans les 48h suivant la session — le remboursement est traité dans les 2 jours ouvrés. C'est notre engagement pour que vous puissiez vous inscrire en toute confiance.",
              highlight: true,
            },
            {
              q: 'Comment se déroule un webinaire Afribourse ?',
              a: 'Chaque session est diffusée en live via Zoom ou Google Meet. Vous recevez le lien de connexion par email 24h avant la session. Un chat en direct vous permet de poser vos questions en temps réel.',
            },
            {
              q: 'Puis-je revoir le replay si je suis indisponible ?',
              a: "Oui. Le replay est disponible pendant 30 jours après la session pour tous les participants inscrits, même si vous n'avez pas pu assister en direct.",
            },
            {
              q: "Qu'est-ce que la préinscription ?",
              a: 'La préinscription vous réserve votre place et vous garantit le tarif early bird parmi les 20 premiers. Vous recevrez les instructions de paiement par email — aucun paiement immédiat requis.',
            },
            {
              q: 'Le contenu est-il adapté aux débutants ?',
              a: 'Chaque webinaire indique son niveau. "Maîtriser les fondamentaux" est conçu pour les débutants complets. "Analyse fondamentale" et "Analyse technique" nécessitent des bases en finance.',
            },
          ].map(({ q, a, highlight }) => (
            <details
              key={q}
              className={`rounded-xl border p-5 group ${highlight ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}
            >
              <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {highlight && <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  {q}
                </span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform text-lg leading-none flex-shrink-0">›</span>
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
