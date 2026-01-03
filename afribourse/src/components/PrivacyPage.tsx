import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, FileText, AlertCircle } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <Shield className="h-12 w-12 mr-4" />
            <h1 className="text-5xl font-bold">Politique de confidentialité</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl">
            Votre vie privée est importante pour nous. Découvrez comment nous protégeons vos données.
          </p>
          <p className="text-sm text-blue-200 mt-4">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start mb-4">
            <FileText className="h-8 w-8 text-blue-600 mr-3 mt-1" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                AfriBourse s'engage à protéger et à respecter votre vie privée. Cette politique explique comment
                nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous
                utilisez notre plateforme d'apprentissage et de simulation boursière.
              </p>
              <div className="mt-4 bg-blue-50 border-l-4 border-blue-600 p-4">
                <p className="text-blue-900 text-sm">
                  <strong>Note importante :</strong> AfriBourse est une plateforme éducative. Toutes les transactions
                  effectuées sont simulées et n'impliquent pas d'argent réel.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Données collectées */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start mb-4">
            <Database className="h-8 w-8 text-green-600 mr-3 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Données que nous collectons</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">1.1 Informations d'inscription</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Nom et prénom</li>
                    <li>Adresse email</li>
                    <li>Mot de passe (crypté)</li>
                    <li>Date de création du compte</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">1.2 Données d'utilisation</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Progression dans les modules d'apprentissage</li>
                    <li>Résultats des quiz et évaluations</li>
                    <li>Transactions simulées et historique du portefeuille</li>
                    <li>Préférences de navigation et favoris</li>
                    <li>Statistiques de performance</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">1.3 Données techniques</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                    <li>Adresse IP</li>
                    <li>Type de navigateur et version</li>
                    <li>Système d'exploitation</li>
                    <li>Pages consultées et durée des visites</li>
                    <li>Cookies et technologies similaires</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Utilisation des données */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start mb-4">
            <Eye className="h-8 w-8 text-purple-600 mr-3 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Comment nous utilisons vos données</h2>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">✓ Fournir nos services</h4>
                  <p className="text-gray-700 text-sm">
                    Gérer votre compte, suivre votre progression, sauvegarder votre portefeuille simulé
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">✓ Améliorer l'expérience utilisateur</h4>
                  <p className="text-gray-700 text-sm">
                    Personnaliser le contenu, recommander des modules adaptés à votre niveau
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">✓ Communiquer avec vous</h4>
                  <p className="text-gray-700 text-sm">
                    Envoyer des notifications importantes, newsletters éducatives (avec votre consentement)
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">✓ Sécurité et conformité</h4>
                  <p className="text-gray-700 text-sm">
                    Détecter les fraudes, prévenir les abus, respecter nos obligations légales
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">✓ Analyses et statistiques</h4>
                  <p className="text-gray-700 text-sm">
                    Comprendre comment notre plateforme est utilisée pour l'améliorer (données anonymisées)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partage des données */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start mb-4">
            <UserCheck className="h-8 w-8 text-yellow-600 mr-3 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Partage de vos données</h2>

              <p className="text-gray-700 mb-4">
                Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations uniquement dans les cas suivants :
              </p>

              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Prestataires de services</h4>
                    <p className="text-gray-600 text-sm">
                      Hébergement, analyse, email (sous contrats de confidentialité stricts)
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Obligation légale</h4>
                    <p className="text-gray-600 text-sm">
                      Si requis par la loi ou pour protéger nos droits légaux
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Avec votre consentement</h4>
                    <p className="text-gray-600 text-sm">
                      Pour toute autre raison, uniquement avec votre autorisation explicite
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start mb-4">
            <Lock className="h-8 w-8 text-red-600 mr-3 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sécurité de vos données</h2>

              <p className="text-gray-700 mb-4">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données :
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">🔒 Cryptage</h4>
                  <p className="text-gray-700 text-sm">
                    Connexions HTTPS, mots de passe hashés avec bcrypt
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">🛡️ Protection des accès</h4>
                  <p className="text-gray-700 text-sm">
                    Authentification JWT, limitation des tentatives de connexion
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">💾 Sauvegardes</h4>
                  <p className="text-gray-700 text-sm">
                    Sauvegardes régulières et sécurisées de la base de données
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">🔍 Surveillance</h4>
                  <p className="text-gray-700 text-sm">
                    Monitoring des activités suspectes et mises à jour de sécurité
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vos droits */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-start mb-4">
            <AlertCircle className="h-8 w-8 text-indigo-600 mr-3 mt-1" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Vos droits</h2>

              <p className="text-gray-700 mb-4">
                Conformément aux réglementations sur la protection des données, vous disposez des droits suivants :
              </p>

              <div className="space-y-3 bg-indigo-50 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-2">→</span>
                  <p className="text-gray-700"><strong>Accès :</strong> Demander une copie de vos données personnelles</p>
                </div>
                <div className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-2">→</span>
                  <p className="text-gray-700"><strong>Rectification :</strong> Corriger des données inexactes ou incomplètes</p>
                </div>
                <div className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-2">→</span>
                  <p className="text-gray-700"><strong>Suppression :</strong> Demander la suppression de vos données</p>
                </div>
                <div className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-2">→</span>
                  <p className="text-gray-700"><strong>Portabilité :</strong> Recevoir vos données dans un format structuré</p>
                </div>
                <div className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-2">→</span>
                  <p className="text-gray-700"><strong>Opposition :</strong> Vous opposer à certains traitements</p>
                </div>
                <div className="flex items-start">
                  <span className="text-indigo-600 font-bold mr-2">→</span>
                  <p className="text-gray-700"><strong>Retrait du consentement :</strong> Retirer votre consentement à tout moment</p>
                </div>
              </div>

              <p className="text-gray-700 mt-4 text-sm">
                Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@afribourse.com" className="text-blue-600 hover:underline font-semibold">privacy@afribourse.com</a>
              </p>
            </div>
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies et technologies similaires</h2>

          <p className="text-gray-700 mb-4">
            Nous utilisons des cookies pour améliorer votre expérience :
          </p>

          <div className="space-y-2">
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <p className="text-gray-700"><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site (authentification, sécurité)</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <p className="text-gray-700"><strong>Cookies de performance :</strong> Analyses d'utilisation pour améliorer le service</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <p className="text-gray-700"><strong>Cookies de préférence :</strong> Mémorisation de vos choix et paramètres</p>
            </div>
          </div>

          <p className="text-gray-700 mt-4 text-sm">
            Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
          </p>
        </div>

        {/* Conservation des données */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Conservation des données</h2>

          <p className="text-gray-700 mb-3">
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Fournir nos services tant que votre compte est actif</li>
            <li>Respecter nos obligations légales et réglementaires</li>
            <li>Résoudre des litiges et faire appliquer nos accords</li>
          </ul>
          <p className="text-gray-700 mt-3">
            Les comptes inactifs depuis plus de 2 ans peuvent être supprimés après notification.
          </p>
        </div>

        {/* Modifications */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Modifications de cette politique</h2>

          <p className="text-gray-700">
            Nous pouvons mettre à jour cette politique de confidentialité occasionnellement. Nous vous informerons
            de tout changement important par email ou via une notification sur la plateforme. La date de dernière
            mise à jour est indiquée en haut de cette page.
          </p>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Nous contacter</h2>
          <p className="mb-4">
            Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
          </p>
          <div className="space-y-2">
            <p>📧 Email : <a href="mailto:privacy@afribourse.com" className="underline font-semibold">contact@africbourse.com</a></p>
            <p>📝 Formulaire : <a href="/contact" className="underline font-semibold">Page de contact</a></p>
            <p>📍 Adresse : Abidjan, Côte d'Ivoire </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
