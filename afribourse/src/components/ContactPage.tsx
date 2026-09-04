// src/components/ContactPage.tsx
//
// Contact : meme ouverture que les autres pages (titre centre, chapeau), puis
// deux colonnes de cartes blanches au gabarit commun. La charte se limite au
// navy et a l'orange du logo, l'orange etant reserve a l'action principale.
// Le vert et le rouge ne servent qu'aux etats d'envoi.
import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, Twitter, Linkedin, Instagram, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useLocation, Link } from 'react-router-dom';
import { metaPixel } from '../utils/metaPixel';
import { Helmet } from 'react-helmet-async';
import PageBanner from './ui/PageBanner';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = 'https://afribourse-api.onrender.com/api/og/image/page/contact';

/** Habillage commun a tous les champs du formulaire. */
const FIELD_CLASS =
  'w-full h-12 px-4 text-sm bg-white border border-gray-200 rounded-xl ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy ' +
  'placeholder:text-gray-400 transition-colors';

const LABEL_CLASS = 'block text-sm font-semibold text-gray-700 mb-2';

const ContactPage: React.FC = () => {
  const location = useLocation();
  const prefilledMessage = (location.state as { prefilledMessage?: string })?.prefilledMessage || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: prefilledMessage
  });

  useEffect(() => {
    if (prefilledMessage) {
      setFormData(prev => ({ ...prev, message: prefilledMessage, subject: 'Question depuis le Centre d\'Aide' }));
    }
  }, [prefilledMessage]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Envoyer le message au backend
      const response = await axios.post(`${API_BASE_URL}/contact`, formData);

      if (response.status === 201) {
        setIsSubmitted(true);
        metaPixel.contact();
        setFormData({ name: '', email: '', subject: '', message: '' });

        // Réinitialiser le message de succès après 5 secondes
        setTimeout(() => setIsSubmitted(false), 5000);
      }
    } catch (err: unknown) {
      console.error('Erreur lors de l\'envoi du message:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message ||
        'Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Contactez AfriBourse — Support et Questions | AfriBourse</title>
        <meta name="description" content="Contactez l'équipe AfriBourse pour toute question sur la plateforme, votre compte, les marchés BRVM ou un partenariat. Réponse sous 24h." />
        <meta name="keywords" content="contact AfriBourse, support AfriBourse, aide BRVM, question investissement bourse Afrique" />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content="Contactez AfriBourse — Support et Questions" />
        <meta property="og:description" content="Une question sur AfriBourse ou la BRVM ? Contactez notre équipe, réponse sous 24h." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${SITE_URL}/contact`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content="@AfriBourse" />
        <meta name="twitter:title" content="Contactez AfriBourse" />
        <meta name="twitter:description" content="Une question sur AfriBourse ou la BRVM ? Notre équipe vous répond sous 24h." />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Helmet>

      {/* En-tete : le bandeau navy commun aux pages editoriales */}
      <PageBanner
        icon={Mail}
        title="Contactez-nous"
        subtitle="Une question, une suggestion ou besoin d'aide sur la plateforme : notre équipe vous répond sous 24 à 48 heures ouvrables."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">

        <div className="grid lg:grid-cols-2 gap-6 items-start">

          {/* Formulaire */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Envoyez-nous un message</h2>

            {isSubmitted && (
              <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-semibold text-sm">Message envoyé</p>
                  <p className="text-green-700 text-sm mt-1 leading-relaxed">
                    Nous vous répondrons dans les plus brefs délais. Un email de confirmation vient de vous être envoyé.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-semibold text-sm">Erreur</p>
                  <p className="text-red-700 text-sm mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className={LABEL_CLASS}>
                  Nom complet <span className="text-brand-orange">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label htmlFor="email" className={LABEL_CLASS}>
                  Email <span className="text-brand-orange">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={FIELD_CLASS}
                  placeholder="votre.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className={LABEL_CLASS}>
                  Sujet <span className="text-brand-orange">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className={`${FIELD_CLASS} cursor-pointer`}
                >
                  <option value="">Sélectionnez un sujet</option>
                  <option value="general">Question générale</option>
                  <option value="support">Support technique</option>
                  <option value="bug">Signaler un bug</option>
                  <option value="feature">Suggestion de fonctionnalité</option>
                  <option value="partnership">Partenariat</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className={LABEL_CLASS}>
                  Message <span className="text-brand-orange">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy placeholder:text-gray-400 resize-none transition-colors"
                  placeholder="Décrivez votre demande en détail..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-brand-orange text-white text-sm font-semibold shadow-sm hover:bg-brand-orange-hover disabled:bg-brand-orange/50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Colonne d'informations */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Informations de contact</h2>

              <dl className="divide-y divide-gray-100">
                <div className="flex items-start gap-4 py-4 first:pt-0">
                  <div className="min-w-0">
                    <dt className="font-semibold text-gray-900">Email</dt>
                    <dd className="text-sm text-gray-600 mt-1 space-y-0.5">
                      <a href="mailto:contact@africbourse.com" className="block hover:text-brand-navy transition-colors">
                        contact@africbourse.com
                      </a>
                      <a href="mailto:support@africbourse.com" className="block hover:text-brand-navy transition-colors">
                        support@africbourse.com
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-4 py-4">
                  <div className="min-w-0">
                    <dt className="font-semibold text-gray-900">Téléphone</dt>
                    <dd className="text-sm text-gray-600 mt-1">
                      <a href="tel:+2250703124506" className="font-mono hover:text-brand-navy transition-colors">
                        +225 07 03 12 45 06
                      </a>
                      <span className="flex items-center gap-1.5 text-gray-400 mt-1">
                        Lundi au vendredi, 8h00 à 18h00 GMT
                      </span>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-4 py-4">
                  <div className="min-w-0">
                    <dt className="font-semibold text-gray-900">Adresse</dt>
                    <dd className="text-sm text-gray-600 mt-1">
                      Cocody, Angré<br />
                      Abidjan, Côte d'Ivoire
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-4 py-4 last:pb-0">
                  <div className="min-w-0">
                    <dt className="font-semibold text-gray-900">Réseaux sociaux</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {[
                        { href: 'https://x.com/AfriBourseStart', icon: Twitter, label: 'Twitter (X)' },
                        { href: 'https://www.linkedin.com/company/108049903/admin/dashboard/', icon: Linkedin, label: 'LinkedIn' },
                        { href: 'https://www.instagram.com/afribourse_startup/', icon: Instagram, label: 'Instagram' },
                      ].map(({ href, icon: Icon, label }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-brand-navy hover:text-brand-navy transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </a>
                      ))}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Questions frequentes */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Questions fréquentes</h2>
              <div className="divide-y divide-gray-100">
                <div className="py-4 first:pt-0 last:pb-0">
                  <h3 className="font-semibold text-gray-900 mb-1">Combien de temps pour une réponse ?</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Nous répondons à tous les messages sous 24 à 48 heures ouvrables.
                  </p>
                </div>
                <div className="py-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Le support technique est-il disponible ?</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Oui, du lundi au vendredi de 8h à 18h GMT.
                  </p>
                </div>
                <div className="py-4 last:pb-0">
                  <h3 className="font-semibold text-gray-900 mb-1">Besoin d'une réponse immédiate ?</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Consultez le{' '}
                    <Link to="/glossary" className="text-brand-navy font-semibold hover:underline">
                      glossaire
                    </Link>{' '}
                    ou les{' '}
                    <Link to="/learn" className="text-brand-navy font-semibold hover:underline">
                      modules de formation
                    </Link>
                    , la plupart des questions y trouvent leur réponse.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
