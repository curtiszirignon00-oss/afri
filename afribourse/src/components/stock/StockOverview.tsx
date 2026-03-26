import { useState, useEffect, useRef } from 'react';
import { Building2, Globe, MapPin, User, Users, Calendar, Sparkles, Zap, Loader2, MessageCircle, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Stock } from '../../types';
import PremiumPaywall from '../PremiumPaywall';
import { StockAnalystChat } from './StockAnalystChat';
import { getSIMBAStockAnalysis, sendAnalystFeedback } from '../../services/geminiService';
import { useAuth } from '../../contexts/AuthContext';
import { useStock52Week } from '../../hooks/useStockDetails';

type CompanyInfo = {
  stock_ticker: string;
  description?: string | null;
  website?: string | null;
  employees?: number | null;
  founded_year?: number | null;
  headquarters?: string | null;
  ceo?: string | null;
  industry?: string | null;
  indices?: string[];
};

type StockOverviewProps = {
  stock: Stock;
  companyInfo?: CompanyInfo | null;
};

export default function StockOverview({ stock, companyInfo }: StockOverviewProps) {
  const { userProfile } = useAuth();
  const isPremium = ['investisseur-plus', 'premium', 'max'].includes(userProfile?.subscriptionTier ?? '');
  const { data: weekData } = useStock52Week(stock.symbol);

  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [analysisRating, setAnalysisRating] = useState<'up' | 'down' | null>(null);
  const analysisMessageId = useRef<string>(`analysis-${stock.symbol}-${Date.now()}`);

  const fetchSIMBAAnalysis = async () => {
    if (isLoadingAI || aiAnalysis) return;
    setIsLoadingAI(true);
    const analysis = await getSIMBAStockAnalysis(stock);
    setAiAnalysis(analysis);
    setIsLoadingAI(false);
  };

  // Charge automatiquement l'analyse pour les abonnés premium
  useEffect(() => {
    if (isPremium) fetchSIMBAAnalysis();
    // Réinitialiser le rating quand l'action change
    setAnalysisRating(null);
    analysisMessageId.current = `analysis-${stock.symbol}-${Date.now()}`;
  }, [stock.symbol, isPremium]);

  const rateAnalysis = (rating: 'up' | 'down') => {
    const newRating = analysisRating === rating ? null : rating;
    setAnalysisRating(newRating);
    if (newRating) {
      sendAnalystFeedback(
        analysisMessageId.current,
        newRating === 'up' ? 'positive' : 'negative',
        'analyst',
      );
    }
  };
  const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

  const formatCurrency = (num: number) => {
    if (!num) return 'N/A';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)} Mds FCFA`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)} M FCFA`;
    return `${formatNumber(num)} FCFA`;
  };

  return (
    <div className="space-y-8 py-8">
      {/* AI Analysis Card — SIMBA */}
      <section>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-gray-900">Analyse par SIMBA</h3>
            {!isPremium && (
              <span className="ml-auto text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                <Zap size={12} />
                Premium
              </span>
            )}
          </div>

          {/* État : non-premium → paywall */}
          {!isPremium && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full mb-4">
                <Sparkles className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Analyse approfondie par IA</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Obtenez une analyse détaillée de cette action par SIMBA, notre analyste IA spécialisé sur la BRVM.
              </p>
              <button
                onClick={() => setShowPremiumPaywall(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
              >
                <Zap className="w-5 h-5" />
                Demander à l'Analyste IA
              </button>
              <p className="text-sm text-gray-500 mt-4">Fonctionnalité réservée aux abonnés Investisseur+</p>
            </div>
          )}

          {/* État : premium + chargement */}
          {isPremium && isLoadingAI && (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm">SIMBA analyse l'action...</p>
            </div>
          )}

          {/* État : premium + analyse disponible */}
          {isPremium && !isLoadingAI && aiAnalysis && (
            <div className="prose prose-sm max-w-none text-slate-700">
              <ReactMarkdown>{aiAnalysis}</ReactMarkdown>

              {/* Actions : feedback + chat */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 not-prose">
                <span className="text-xs text-slate-400">Cette analyse vous a aidé ?</span>
                <button
                  onClick={() => rateAnalysis('up')}
                  title="Analyse utile"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-colors ${
                    analysisRating === 'up'
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  {analysisRating === 'up' && <span>Utile</span>}
                </button>
                <button
                  onClick={() => rateAnalysis('down')}
                  title="Analyse insuffisante"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-colors ${
                    analysisRating === 'down'
                      ? 'bg-red-100 text-red-500 font-medium'
                      : 'text-slate-400 hover:text-red-400 hover:bg-red-50'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  {analysisRating === 'down' && <span>À améliorer</span>}
                </button>
                <button
                  onClick={() => setShowChat(true)}
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                >
                  <MessageCircle className="w-4 h-4" />
                  Poser une question à SIMBA
                </button>
              </div>
            </div>
          )}

          {/* État : premium + pas encore chargé */}
          {isPremium && !isLoadingAI && !aiAnalysis && (
            <div className="text-center py-6">
              <button
                onClick={fetchSIMBAAnalysis}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all shadow-md"
              >
                <Sparkles className="w-5 h-5" />
                Demander à l'Analyste IA
              </button>
            </div>
          )}
        </div>

        {/* Chat Analyste SIMBA */}
        <StockAnalystChat
          stock={stock}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />

        {/* Paywall Modal */}
        <PremiumPaywall
          isOpen={showPremiumPaywall}
          onClose={() => setShowPremiumPaywall(false)}
          feature="Obtenir l'analyse IA approfondie de cette action par SIMBA"
          plan="investisseur-plus"
        />
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

            {/* Indices de cotation */}
            {companyInfo.indices && companyInfo.indices.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                  <p className="text-sm text-gray-600 font-medium">Indices de cotation</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {companyInfo.indices.map((idx) => {
                    const isBRVM30 = idx === 'BRVM-30';
                    const isPrestige = idx === 'BRVM-Prestige';
                    const isSector = idx.startsWith('BRVM-') && !['BRVM-30', 'BRVM-C', 'BRVM-Prestige', 'BRVM-Principal'].includes(idx);
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          isBRVM30
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : isPrestige
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : isSector
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {idx}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
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
              <p className="text-sm text-gray-600 mb-1">Plus Haut 52s</p>
              <p className="text-lg font-bold text-gray-900">
                {weekData?.high52w != null ? `${formatNumber(weekData.high52w)} FCFA` : 'N/A'}
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Plus Bas 52s</p>
              <p className="text-lg font-bold text-gray-900">
                {weekData?.low52w != null ? `${formatNumber(weekData.low52w)} FCFA` : 'N/A'}
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
