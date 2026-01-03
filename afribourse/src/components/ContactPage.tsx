import React, { useState } from 'react';
import { Mail, MessageSquare, Phone, MapPin, Send, CheckCircle, Twitter, Linkedin, Instagram } from 'lucide-react';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simuler l'envoi du formulaire
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitted(true);
    setIsSubmitting(false);
    setFormData({ name: '', email: '', subject: '', message: '' });

    // Réinitialiser le message de succès après 5 secondes
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-6">Contactez-nous</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Une question, une suggestion ou besoin d'aide ? Notre équipe est là pour vous répondre.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Formulaire de contact */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>

            {isSubmitted && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-green-800 font-semibold">Message envoyé avec succès !</h3>
                  <p className="text-green-700 text-sm mt-1">
                    Nous vous répondrons dans les plus brefs délais.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet <span className="text-red-500">*</span>
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Décrivez votre demande en détail..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Informations de contact */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Informations de contact</h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 text-blue-600">
                      <Mail className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600 mt-1">contact@africbourse.com</p>
                    <p className="text-gray-600">support@africbourse.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100 text-green-600">
                      <Phone className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Téléphone</h3>
                    <p className="text-gray-600 mt-1">+225 07 03 12 45 06</p>
                    <p className="text-sm text-gray-500">Lundi - Vendredi, 8h00 - 18h00 GMT</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 text-purple-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
                    <p className="text-gray-600 mt-1">Abidjan, Côte d'Ivoire</p>
                    <p className="text-gray-600">Cocody, Angré</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-yellow-100 text-yellow-600">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Réseaux sociaux</h3>
                    <div className="mt-3 flex flex-col space-y-2">
                      <a
                        href="https://x.com/AfriBourseStart"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                        <span>Twitter (X)</span>
                      </a>
                      <a
                        href="https://www.linkedin.com/company/108049903/admin/dashboard/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </a>
                      <a
                        href="https://www.instagram.com/afribourse_startup/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-700 hover:text-pink-600 transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                        <span>Instagram</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ rapide */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions fréquentes</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Combien de temps pour une réponse ?</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Nous nous efforçons de répondre à tous les messages dans les 24-48 heures ouvrables.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Support technique disponible ?</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Oui, notre équipe de support est disponible du lundi au vendredi de 8h à 18h GMT.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Besoin d'aide immédiate ?</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Consultez notre <a href="/glossary" className="text-blue-600 hover:underline">glossaire</a> ou
                    nos <a href="/learn" className="text-blue-600 hover:underline">modules d'apprentissage</a> pour
                    des réponses rapides.
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
