// src/components/PrivacyPage.tsx
//
// Politique de confidentialite : bandeau navy commun, puis des sections en
// cartes blanches identiques, chacune ouverte par une tuile d'icone navy.
// Les emojis des sous-titres laissent la place a des icones lucide.
import React from 'react';
import {
  Shield, Lock, Eye, Database, UserCheck, FileText, AlertCircle,
  Check, ArrowRight, Cookie, Clock, RefreshCw, Mail, MapPin, KeyRound,
  HardDriveDownload, ScanSearch,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageBanner from './ui/PageBanner';

const SITE_URL = 'https://africbourse.com';
const CONTACT_EMAIL = 'contact@africbourse.com';

/** Gabarit commun a toutes les sections. */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-11 h-11 rounded-xl bg-ink-50 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-brand-navy" />
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

const USES = [
  { title: 'Fournir nos services', text: 'Gérer votre compte, suivre votre progression, sauvegarder votre portefeuille simulé.' },
  { title: "Améliorer l'expérience utilisateur", text: 'Personnaliser le contenu, recommander des modules adaptés à votre niveau.' },
  { title: 'Communiquer avec vous', text: 'Envoyer des notifications importantes et des newsletters éducatives, avec votre consentement.' },
  { title: 'Sécurité et conformité', text: 'Détecter les fraudes, prévenir les abus, respecter nos obligations légales.' },
  { title: 'Analyses et statistiques', text: "Comprendre comment la plateforme est utilisée pour l'améliorer, sur des données anonymisées." },
];

const SHARING = [
  { title: 'Prestataires de services', text: 'Hébergement, analyse, email, sous contrats de confidentialité stricts.' },
  { title: 'Obligation légale', text: 'Si requis par la loi ou pour protéger nos droits légaux.' },
  { title: 'Avec votre consentement', text: 'Pour toute autre raison, uniquement avec votre autorisation explicite.' },
];

const SECURITY = [
  { icon: KeyRound, title: 'Cryptage', text: 'Connexions HTTPS, mots de passe hachés avec bcrypt.' },
  { icon: Lock, title: 'Protection des accès', text: 'Authentification JWT, limitation des tentatives de connexion.' },
  { icon: HardDriveDownload, title: 'Sauvegardes', text: 'Sauvegardes régulières et sécurisées de la base de données.' },
  { icon: ScanSearch, title: 'Surveillance', text: 'Monitoring des activités suspectes et mises à jour de sécurité.' },
];

const RIGHTS = [
  { title: 'Accès', text: 'Demander une copie de vos données personnelles' },
  { title: 'Rectification', text: 'Corriger des données inexactes ou incomplètes' },
  { title: 'Suppression', text: 'Demander la suppression de vos données' },
  { title: 'Portabilité', text: 'Recevoir vos données dans un format structuré' },
  { title: 'Opposition', text: 'Vous opposer à certains traitements' },
  { title: 'Retrait du consentement', text: 'Retirer votre consentement à tout moment' },
];

const COOKIES = [
  { title: 'Cookies essentiels', text: 'Nécessaires au fonctionnement du site : authentification, sécurité.' },
  { title: 'Cookies de performance', text: "Analyses d'utilisation pour améliorer le service." },
  { title: 'Cookies de préférence', text: 'Mémorisation de vos choix et paramètres.' },
];

const PrivacyPage: React.FC = () => {
  const lastUpdate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Politique de Confidentialité | AfriBourse</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${SITE_URL}/privacy`} />
      </Helmet>

      <PageBanner
        icon={Shield}
        title="Politique de confidentialité"
        subtitle="Votre vie privée est importante pour nous. Voici comment nous protégeons vos données."
        meta={`Dernière mise à jour : ${lastUpdate}`}
        maxWidth="max-w-4xl"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 space-y-6">

        {/* Introduction */}
        <Section icon={FileText} title="Introduction">
          <p className="text-gray-600 leading-relaxed mb-4">
            AfriBourse s'engage à protéger et à respecter votre vie privée. Cette politique explique comment
            nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous
            utilisez notre plateforme d'apprentissage et de simulation boursière.
          </p>
          <div className="bg-ink-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong className="text-brand-navy">Note importante :</strong> AfriBourse est une plateforme éducative.
              Toutes les transactions effectuées sont simulées et n'impliquent pas d'argent réel.
            </p>
          </div>
        </Section>

        {/* Donnees collectees */}
        <Section icon={Database} title="1. Données que nous collectons">
          <div className="divide-y divide-gray-100">
            <div className="py-4 first:pt-0">
              <h3 className="font-semibold text-gray-900 mb-2">1.1 Informations d'inscription</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                {['Nom et prénom', 'Adresse email', 'Mot de passe (crypté)', 'Date de création du compte'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-navy mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="py-4">
              <h3 className="font-semibold text-gray-900 mb-2">1.2 Données d'utilisation</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                {[
                  "Progression dans les modules d'apprentissage",
                  'Résultats des quiz et évaluations',
                  'Transactions simulées et historique du portefeuille',
                  'Préférences de navigation et favoris',
                  'Statistiques de performance',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-navy mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="py-4 last:pb-0">
              <h3 className="font-semibold text-gray-900 mb-2">1.3 Données techniques</h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                {[
                  'Adresse IP',
                  'Type de navigateur et version',
                  "Système d'exploitation",
                  'Pages consultées et durée des visites',
                  'Cookies et technologies similaires',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-navy mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Utilisation */}
        <Section icon={Eye} title="2. Comment nous utilisons vos données">
          <div className="grid sm:grid-cols-2 gap-4">
            {USES.map(({ title, text }) => (
              <div key={title} className="bg-ink-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-navy shrink-0" />
                  {title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Partage */}
        <Section icon={UserCheck} title="3. Partage de vos données">
          <p className="text-gray-600 leading-relaxed mb-4">
            Nous ne vendons jamais vos données personnelles. Nous pouvons les partager uniquement dans les cas suivants :
          </p>
          <div className="divide-y divide-gray-100">
            {SHARING.map(({ title, text }) => (
              <div key={title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="w-6 h-6 rounded-full bg-ink-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-brand-navy" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Securite */}
        <Section icon={Lock} title="4. Sécurité de vos données">
          <p className="text-gray-600 leading-relaxed mb-4">
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données :
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {SECURITY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="bg-ink-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-brand-navy shrink-0" />
                  {title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Droits */}
        <Section icon={AlertCircle} title="5. Vos droits">
          <p className="text-gray-600 leading-relaxed mb-4">
            Conformément aux réglementations sur la protection des données, vous disposez des droits suivants :
          </p>
          <div className="bg-ink-50 rounded-xl p-4 space-y-2.5">
            {RIGHTS.map(({ title, text }) => (
              <div key={title} className="flex items-start gap-2.5">
                <ArrowRight className="w-4 h-4 text-brand-navy shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  <strong className="text-gray-900">{title} :</strong> {text}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Pour exercer ces droits, écrivez-nous à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-navy font-semibold hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        {/* Cookies */}
        <Section icon={Cookie} title="6. Cookies et technologies similaires">
          <p className="text-gray-600 leading-relaxed mb-4">
            Nous utilisons des cookies pour améliorer votre expérience :
          </p>
          <div className="divide-y divide-gray-100">
            {COOKIES.map(({ title, text }) => (
              <div key={title} className="py-3 first:pt-0 last:pb-0">
                <p className="text-sm text-gray-600">
                  <strong className="text-gray-900">{title} :</strong> {text}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-4">
            Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
          </p>
        </Section>

        {/* Conservation */}
        <Section icon={Clock} title="7. Conservation des données">
          <p className="text-gray-600 leading-relaxed mb-3">
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour :
          </p>
          <ul className="text-sm text-gray-600 space-y-1.5 mb-3">
            {[
              'Fournir nos services tant que votre compte est actif',
              'Respecter nos obligations légales et réglementaires',
              'Résoudre des litiges et faire appliquer nos accords',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-navy mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-600 leading-relaxed">
            Les comptes inactifs depuis plus de 2 ans peuvent être supprimés après notification.
          </p>
        </Section>

        {/* Modifications */}
        <Section icon={RefreshCw} title="8. Modifications de cette politique">
          <p className="text-gray-600 leading-relaxed">
            Nous pouvons mettre à jour cette politique occasionnellement. Nous vous informerons de tout changement
            important par email ou via une notification sur la plateforme. La date de dernière mise à jour est
            indiquée en haut de cette page.
          </p>
        </Section>

        {/* Contact */}
        <section className="bg-white rounded-2xl border-2 border-brand-orange shadow-sm p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Nous contacter</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Pour toute question concernant cette politique ou vos données personnelles :
          </p>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-brand-navy shrink-0" />
              <dt className="sr-only">Email</dt>
              <dd>
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-navy font-semibold hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-brand-navy shrink-0" />
              <dt className="sr-only">Formulaire</dt>
              <dd>
                <Link to="/contact" className="text-brand-navy font-semibold hover:underline">
                  Page de contact
                </Link>
              </dd>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-brand-navy shrink-0" />
              <dt className="sr-only">Adresse</dt>
              <dd className="text-gray-600">Abidjan, Côte d'Ivoire</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
