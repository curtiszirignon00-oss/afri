// src/components/GlossaryPage.tsx
//
// Glossaire : meme sequence d'ouverture que les pages Learn, Marches et
// Actualites (titre centre, chapeau, bouton navy), puis une grille de fiches
// blanches au format unique. La charte tient sur le navy et l'orange du logo,
// l'orange n'intervenant que sur l'exemple chiffre et l'action principale.
import { Search, X, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HERO_BACKGROUNDS, HERO_GRID_STYLE } from '../utils/heroBackgrounds';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = 'https://afribourse-api.onrender.com/api/og/image/page/glossary';

const glossaryTerms = [
  {
    term: 'Action',
    definition: 'Part de propriété dans une entreprise. Quand vous achetez une action, vous devenez actionnaire et copropriétaire de cette entreprise.',
    example: 'Si vous achetez 100 actions de Sonatel, vous possédez une petite partie de cette entreprise télécom.'
  },
  {
    term: 'Dividende',
    definition: 'Part du bénéfice qu\'une entreprise distribue à ses actionnaires. C\'est une récompense pour votre investissement.',
    example: 'Si Sonatel verse un dividende de 500 FCFA par action et que vous en possédez 100, vous recevrez 50,000 FCFA.'
  },
  {
    term: 'Portefeuille',
    definition: 'Ensemble de tous vos investissements (actions, obligations, etc.). C\'est votre "panier" d\'investissements.',
    example: 'Votre portefeuille peut contenir 10 actions différentes pour diversifier vos risques.'
  },
  {
    term: 'SGI',
    definition: 'Société de Gestion et d\'Intermédiation. C\'est votre intermédiaire obligatoire pour acheter et vendre des actions en bourse.',
    example: 'CGF Bourse, Hudson & Cie sont des exemples de SGI qui peuvent exécuter vos ordres d\'achat.'
  },
  {
    term: 'Indice BRVM Composite',
    definition: 'Le "thermomètre" de la santé générale de la bourse. Il mesure la performance moyenne de toutes les entreprises cotées.',
    example: 'Si l\'indice BRVM Composite monte de 2%, cela signifie qu\'en moyenne, les entreprises se portent bien.'
  },
  {
    term: 'Capitalisation Boursière',
    definition: 'Valeur totale d\'une entreprise en bourse. C\'est le prix de l\'action multiplié par le nombre total d\'actions.',
    example: 'Si Sonatel a 1 million d\'actions à 15,000 FCFA chacune, sa capitalisation est de 15 milliards FCFA.'
  },
  {
    term: 'Obligation',
    definition: 'Titre de dette émis par une entreprise ou un État. En achetant une obligation, vous prêtez de l\'argent et recevez des intérêts.',
    example: 'Une obligation d\'État vous verse 5% d\'intérêt par an pendant 5 ans, puis vous rembourse le capital.'
  },
  {
    term: 'Volume',
    definition: 'Nombre d\'actions échangées durant une période. Un volume élevé indique un grand intérêt pour l\'action.',
    example: 'Si 50,000 actions d\'Orange CI ont été échangées aujourd\'hui, le volume est de 50,000.'
  },
  {
    term: 'Plus-value',
    definition: 'Gain réalisé quand vous vendez une action à un prix supérieur à celui d\'achat.',
    example: 'Vous achetez une action à 10,000 FCFA et la vendez à 12,000 FCFA. Votre plus-value est de 2,000 FCFA.'
  },
  {
    term: 'P/E Ratio',
    definition: 'Ratio Prix/Bénéfice. Il compare le prix de l\'action aux bénéfices de l\'entreprise. Un P/E bas peut indiquer une action sous-évaluée.',
    example: 'Si une action coûte 10,000 FCFA et que le bénéfice par action est de 1,000 FCFA, le P/E est de 10.'
  },
  {
    term: 'Diversification',
    definition: 'Stratégie qui consiste à répartir vos investissements sur plusieurs actions ou secteurs pour réduire le risque.',
    example: 'Au lieu de mettre tout votre argent dans une seule banque, investissez dans des banques, des télécoms et de l\'énergie.'
  },
  {
    term: 'Rendement',
    definition: 'Gain total (dividendes + plus-value) exprimé en pourcentage de votre investissement initial.',
    example: 'Vous investissez 100,000 FCFA et gagnez 10,000 FCFA en un an. Votre rendement est de 10%.'
  },
  {
    term: 'Volatilité',
    definition: 'Mesure des fluctuations du prix d\'une action. Une forte volatilité signifie que le prix change beaucoup et rapidement.',
    example: 'Une action qui passe de 5,000 FCFA à 7,000 FCFA puis à 4,000 FCFA en une semaine est très volatile.'
  },
  {
    term: 'Liquidité',
    definition: 'Facilité avec laquelle vous pouvez acheter ou vendre une action sans affecter son prix.',
    example: 'Sonatel est une action liquide car beaucoup de gens l\'achètent et la vendent chaque jour.'
  },
  {
    term: 'Compte-titres',
    definition: 'Compte spécial ouvert chez une SGI qui vous permet de détenir et gérer vos actions et obligations.',
    example: 'C\'est comme un compte bancaire, mais pour vos investissements en bourse plutôt que pour votre argent liquide.'
  }
];

export default function GlossaryPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTerms = searchTerm
    ? glossaryTerms.filter((item) =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : glossaryTerms;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Glossaire de l'Investisseur BRVM — Termes Boursiers Expliqués | AfriBourse</title>
        <meta name="description" content="Le dictionnaire complet des termes financiers de la BRVM expliqués en français : action, dividende, SGI, indice, P/E ratio, volatilité et 15 autres concepts essentiels pour investir." />
        <meta name="keywords" content="brvm, brvm action définition, brvm glossaire, brvm termes, action brvm explication, brvm SGI, brvm dividende, brvm composite définition, glossaire bourse, termes financiers BRVM, dictionnaire investissement bourse, bourse afrique vocabulaire" />
        <link rel="canonical" href={`${SITE_URL}/glossary`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content="Glossaire de l'Investisseur BRVM — Termes Boursiers Expliqués | AfriBourse" />
        <meta property="og:description" content="15 termes financiers de la BRVM expliqués simplement en français : action, dividende, SGI, volatilité, P/E ratio et plus." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${SITE_URL}/glossary`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AfriBourse" />
        <meta name="twitter:title" content="Glossaire Boursier BRVM | AfriBourse" />
        <meta name="twitter:description" content="Les termes financiers de la BRVM expliqués simplement en français." />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://africbourse.com/" },
            { "@type": "ListItem", "position": 2, "name": "Glossaire de l'Investisseur", "item": "https://africbourse.com/glossary" }
          ]
        })}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">

        {/* En-tete : titre, chapeau, bouton, comme Learn et Actualites */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
            Glossaire de l'Investisseur
          </h1>
          <p className="text-gray-600 text-sm sm:text-lg md:text-xl leading-relaxed mb-5">
            Le dictionnaire des termes financiers de la BRVM, expliqués simplement et
            accompagnés d'un exemple chiffré. Plus de jargon incompréhensible.
          </p>
          <button
            onClick={() => navigate('/learn')}
            className="inline-flex items-center gap-2 h-14 bg-gradient-to-r from-brand-navy to-[#173F66] hover:from-brand-navy-hover hover:to-brand-navy-hover text-white font-bold text-sm px-7 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            Voir les modules de formation
          </button>
        </div>

        {/* Recherche : meme champ que la page Actualites */}
        <div className="max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher un terme (ex : action, dividende...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-11 text-base bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Compteur */}
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-mono font-semibold text-gray-900 tabular-nums">{filteredTerms.length}</span>{' '}
          terme{filteredTerms.length > 1 ? 's' : ''}
          {searchTerm && ` pour « ${searchTerm} »`}
        </p>

        {/* Fiches : un seul gabarit, meme retrait et meme rythme partout */}
        {filteredTerms.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredTerms.map((item) => (
              <div
                key={item.term}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 transition-[border-color,box-shadow] duration-300 hover:border-brand-navy/25 hover:shadow-md"
              >
                <h2 className="text-lg sm:text-xl font-bold text-brand-navy mb-2">{item.term}</h2>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">{item.definition}</p>
                <div className="bg-ink-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-brand-orange-dark uppercase tracking-wide mb-1.5">
                    Exemple pratique
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.example}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Aucun terme trouvé</h2>
            <p className="text-sm text-gray-500">Essayez un autre mot-clé, par exemple « dividende » ou « SGI ».</p>
          </div>
        )}

        {/* Appel final : le bandeau navy signature du site */}
        <div
          className="relative overflow-hidden rounded-2xl mt-12 sm:mt-16"
          style={{ backgroundImage: HERO_BACKGROUNDS[0].gradient }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: HERO_BACKGROUNDS[0].halo }} />
          <div className="absolute inset-0 opacity-[0.07]" style={HERO_GRID_STYLE} />

          <div className="relative px-6 py-10 sm:px-10 sm:py-12 text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-3">
              Vous ne trouvez pas un terme ?
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6">
              Le glossaire s'enrichit à mesure que de nouveaux instruments arrivent sur la BRVM.
              Signalez-nous le mot qui vous manque, nous l'ajoutons.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-lg bg-brand-orange text-white text-sm font-semibold shadow-sm hover:bg-brand-orange-hover transition-colors"
              >
                Suggérer un terme
              </Link>
              <Link
                to="/markets"
                className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-lg border-2 border-white/80 text-white text-sm font-semibold hover:bg-white hover:text-brand-navy transition-colors"
              >
                Explorer les marchés BRVM
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
