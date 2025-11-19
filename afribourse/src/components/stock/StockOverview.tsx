import { Building2, Globe, MapPin, User, Users, Calendar } from 'lucide-react';
import { Stock } from '../../types';

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
  const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

  const formatCurrency = (num: number) => {
    if (!num) return 'N/A';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)} Mds FCFA`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)} M FCFA`;
    return `${formatNumber(num)} FCFA`;
  };

  return (
    <div className="space-y-8 py-8">
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
