import { useState, useEffect } from 'react';
import { Building2, Globe, MapPin, User, Users, Calendar, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Stock } from '../../types';
import { getAIStockAnalysis } from '../../services/geminiService';

type CompanyInfo = {
  stock_ticker: string;
  description?: string | null;
  website?: string | null;
  employees?: number | null;
  founded_year?: number | null;
  headquarters?: string | null;
  ceo?: string | null;
  industry?: string | null;
};

type StockOverviewProps = {
  stock: Stock;
  companyInfo?: CompanyInfo | null;
};

export default function StockOverview({ stock, companyInfo }: StockOverviewProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    const fetchAIAnalysis = async () => {
      setIsLoadingAI(true);
      try {
        const analysis = await getAIStockAnalysis(stock);
        setAiAnalysis(analysis);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'analyse IA:', error);
        setAiAnalysis('⚠️ Impossible de charger l\'analyse IA pour le moment.');
      } finally {
        setIsLoadingAI(false);
      }
    };

    fetchAIAnalysis();
  }, [stock.id, stock.symbol]);
  const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

  const formatCurrency = (num: number) => {
    if (!num) return 'N/A';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)} Mds FCFA`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)} M FCFA`;
    return `${formatNumber(num)} FCFA`;
  };

  return (
    <div className="space-y-8 py-8">
      {/* AI Analysis Card */}
      <section>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-gray-900">Analyse IA par Gemini</h3>
            <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
              Propulsé par Google AI
            </span>
          </div>

          {isLoadingAI ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Génération de l'analyse...</span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
            </div>
          )}
        </div>
      </section>

      {/* Informations Clés */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Informations Clés</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Prix d'ouverture</p>
            <p className="text-lg font-bold text-gray-900">
              {stock.previous_close ? formatNumber(stock.previous_close) : 'N/A'} FCFA
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Prix actuel</p>
            <p className="text-lg font-bold text-gray-900">
              {formatNumber(stock.current_price)} FCFA
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Volume</p>
            <p className="text-lg font-bold text-gray-900">{formatNumber(stock.volume)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Cap. Boursière</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(stock.market_cap)}
            </p>
          </div>
        </div>
      </section>

      {/* À propos de l'entreprise */}
      {companyInfo && (
        <section>
          <h3 className="text-xl font-bold text-gray-900 mb-4">À propos de l'entreprise</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            {/* Description */}
            {(companyInfo.description || stock.description) && (
              <div>
                <p className="text-gray-700 leading-relaxed">
                  {companyInfo.description || stock.description}
                </p>
              </div>
            )}

            {/* Détails de l'entreprise */}
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              {companyInfo.industry && (
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Industrie</p>
                    <p className="font-semibold text-gray-900">{companyInfo.industry}</p>
                  </div>
                </div>
              )}

              {stock.sector && (
                <div className="flex items-center space-x-3">
                  <BarChart className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Secteur</p>
                    <p className="font-semibold text-gray-900">{stock.sector}</p>
                  </div>
                </div>
              )}

              {companyInfo.headquarters && (
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Siège Social</p>
                    <p className="font-semibold text-gray-900">{companyInfo.headquarters}</p>
                  </div>
                </div>
              )}

              {companyInfo.founded_year && (
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Année de création</p>
                    <p className="font-semibold text-gray-900">{companyInfo.founded_year}</p>
                  </div>
                </div>
              )}

              {companyInfo.ceo && (
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">PDG</p>
                    <p className="font-semibold text-gray-900">{companyInfo.ceo}</p>
                  </div>
                </div>
              )}

              {companyInfo.employees && (
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Employés</p>
                    <p className="font-semibold text-gray-900">
                      {formatNumber(companyInfo.employees)}
                    </p>
                  </div>
                </div>
              )}

              {(companyInfo.website || stock.website_url) && (
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Site web</p>
                    <a
                      href={companyInfo.website || stock.website_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Visiter le site
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Performance */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Performance</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Variation du jour</p>
              <p className={`text-lg font-bold ${stock.daily_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stock.daily_change_percent >= 0 ? '+' : ''}
                {stock.daily_change_percent.toFixed(2)}%
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Volume</p>
              <p className="text-lg font-bold text-gray-900">{formatNumber(stock.volume)}</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Plus Haut</p>
              <p className="text-lg font-bold text-gray-900">
                {/* Cette donnée viendra de l'historique */}
                N/A
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Plus Bas</p>
              <p className="text-lg font-bold text-gray-900">
                {/* Cette donnée viendra de l'historique */}
                N/A
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Import manquant pour le composant BarChart
import { BarChart } from 'lucide-react';
