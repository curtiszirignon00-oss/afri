import { Search, Book } from 'lucide-react';
import { useState } from 'react';

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
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTerms = searchTerm
    ? glossaryTerms.filter((item) =>
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : glossaryTerms;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Book className="w-12 h-12 text-orange-600" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Glossaire de l'Investisseur</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Le dictionnaire complet des termes financiers expliqués simplement. Plus de jargon incompréhensible !
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un terme (ex: action, dividende...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredTerms.map((item) => (
          <div
            key={item.term}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-2xl font-bold text-orange-600 mb-3">{item.term}</h3>
            <p className="text-gray-700 mb-4 leading-relaxed">{item.definition}</p>
            <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
              <p className="text-sm font-semibold text-orange-700 mb-1">Exemple pratique :</p>
              <p className="text-sm text-gray-700">{item.example}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun terme trouvé. Essayez un autre mot-clé.</p>
        </div>
      )}

      <div className="mt-16 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vous ne trouvez pas un terme ?</h2>
          <p className="text-gray-700 mb-6">
            Nous enrichissons constamment notre glossaire. Si un terme vous échappe, n'hésitez pas à nous le signaler !
          </p>
          <button className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold">
            Suggérer un terme
          </button>
        </div>
      </div>
    </div>
  );
}
