/// <reference types="node" />
// Script pour générer un aperçu HTML du résumé de portefeuille sans l'envoyer
import * as fs from 'fs';
import * as path from 'path';

async function generatePortfolioSummaryPreview() {
  console.log('📊 Génération de l\'aperçu du résumé de portefeuille\n');
  console.log('='.repeat(60));

  // Données de test avec un portefeuille réaliste
  const name = 'Jean Kouadio';
  const portfolioStats = {
    totalValue: 5780000,
    cashBalance: 1200000,
    investedValue: 4500000,
    totalGainLoss: 80000,
    totalGainLossPercent: 1.78,
    topPerformers: [
      { ticker: 'SIVC', gainLossPercent: 12.5, currentPrice: 1280 },
      { ticker: 'ONTBF', gainLossPercent: 8.3, currentPrice: 3250 },
      { ticker: 'BOABF', gainLossPercent: 5.2, currentPrice: 6800 },
    ],
    topLosers: [
      { ticker: 'SDCC', gainLossPercent: -3.5, currentPrice: 4100 },
      { ticker: 'TTLC', gainLossPercent: -2.1, currentPrice: 920 },
      { ticker: 'NEIC', gainLossPercent: -1.2, currentPrice: 785 },
    ],
    positionsCount: 8,
    period: 'du 1er au 14 janvier 2026',
  };

  console.log('\n📋 Données de test:');
  console.log(`   → Nom: ${name}`);
  console.log(`   → Valeur totale: ${portfolioStats.totalValue.toLocaleString('fr-FR')} FCFA`);
  console.log(`   → Performance: ${portfolioStats.totalGainLossPercent > 0 ? '+' : ''}${portfolioStats.totalGainLossPercent}%`);
  console.log(`   → Positions: ${portfolioStats.positionsCount}`);

  const displayName = name || 'Investisseur';
  const isProfit = portfolioStats.totalGainLoss >= 0;
  const gainLossColor = isProfit ? '#10b981' : '#ef4444';
  const gainLossText = isProfit ? 'Gain' : 'Perte';

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Résumé de Portefeuille - AfriBourse</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 10px;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .logo-text {
      font-size: 32px;
      font-weight: bold;
      color: #f97316;
      margin: 0;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      color: #4b5563;
      margin-bottom: 15px;
    }
    .summary-box {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin: 30px 0;
      text-align: center;
    }
    .summary-box h2 {
      margin: 0 0 10px 0;
      font-size: 16px;
      opacity: 0.95;
      font-weight: normal;
    }
    .summary-box .value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .summary-box .performance {
      font-size: 20px;
      background-color: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 8px;
      display: inline-block;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 30px 0;
    }
    .stat-item {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
    }
    .section {
      margin: 30px 0;
    }
    .section h3 {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stock-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      margin-bottom: 10px;
      background-color: #f9fafb;
      border-radius: 6px;
    }
    .stock-ticker {
      font-weight: 600;
      color: #1f2937;
    }
    .stock-performance {
      font-weight: bold;
      font-size: 14px;
    }
    .profit {
      color: #10b981;
    }
    .loss {
      color: #ef4444;
    }
    .button {
      display: inline-block;
      padding: 15px 30px;
      background-color: #f97316;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #ea580c;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    .tip-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .tip-box p {
      margin: 0;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 6H23V12" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h2 class="logo-text">AfriBourse</h2>
      </div>
    </div>

    <h1>📊 Résumé de Votre Portefeuille</h1>

    <p>Bonjour ${displayName},</p>

    <p>Voici le résumé de votre portefeuille pour la période <strong>${portfolioStats.period}</strong>.</p>

    <div class="summary-box">
      <h2>Valeur Totale du Portefeuille</h2>
      <div class="value">${portfolioStats.totalValue.toLocaleString('fr-FR')} FCFA</div>
      <div class="performance" style="color: ${gainLossColor};">
        ${isProfit ? '↗' : '↘'} ${gainLossText}: ${Math.abs(portfolioStats.totalGainLoss).toLocaleString('fr-FR')} FCFA
        (${isProfit ? '+' : ''}${portfolioStats.totalGainLossPercent.toFixed(2)}%)
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">Liquidités</div>
        <div class="stat-value">${portfolioStats.cashBalance.toLocaleString('fr-FR')} FCFA</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Investi</div>
        <div class="stat-value">${portfolioStats.investedValue.toLocaleString('fr-FR')} FCFA</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Positions</div>
        <div class="stat-value">${portfolioStats.positionsCount}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Performance</div>
        <div class="stat-value" style="color: ${gainLossColor};">
          ${isProfit ? '+' : ''}${portfolioStats.totalGainLossPercent.toFixed(2)}%
        </div>
      </div>
    </div>

    <div class="section">
      <h3>🚀 Meilleures Performances</h3>
      ${portfolioStats.topPerformers.map(stock => `
        <div class="stock-item">
          <span class="stock-ticker">${stock.ticker}</span>
          <span class="stock-performance profit">+${stock.gainLossPercent.toFixed(2)}%</span>
        </div>
      `).join('')}
    </div>

    <div class="section">
      <h3>📉 Moins Bonnes Performances</h3>
      ${portfolioStats.topLosers.map(stock => `
        <div class="stock-item">
          <span class="stock-ticker">${stock.ticker}</span>
          <span class="stock-performance loss">${stock.gainLossPercent.toFixed(2)}%</span>
        </div>
      `).join('')}
    </div>

    <div class="tip-box">
      <p><strong>💡 Conseil :</strong> ${isProfit
        ? 'Votre portefeuille est en croissance ! Continuez à surveiller vos positions et envisagez de diversifier davantage.'
        : 'Ne vous inquiétez pas, les marchés fluctuent. Révisez votre stratégie et considérez les opportunités d\'achat à bas prix.'
      }</p>
    </div>

    <p>Pour une analyse complète de votre portefeuille et gérer vos positions :</p>

    <div style="text-align: center;">
      <a href="https://www.africbourse.com/dashboard" class="button">Voir Mon Dashboard</a>
    </div>

    <div class="footer">
      <p>Cet email a été envoyé par AfriBourse - Résumé bi-hebdomadaire de portefeuille</p>
      <p>Questions ? Contactez-nous à contact@africbourse.com</p>
    </div>
  </div>
</body>
</html>
  `;

  // Sauvegarder le HTML dans un fichier pour visualisation
  const previewPath = path.join(__dirname, '../../preview-portfolio-summary.html');
  fs.writeFileSync(previewPath, htmlContent);
  console.log(`\n📄 Aperçu HTML sauvegardé dans: ${previewPath}`);
  console.log('   → Ouvrez ce fichier dans un navigateur pour voir le rendu\n');

  console.log('✅ Génération de l\'aperçu terminée!');
}

// Exécuter le test
generatePortfolioSummaryPreview()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  });
