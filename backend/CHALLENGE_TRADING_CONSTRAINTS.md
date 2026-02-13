// IMPORTANT : Instructions pour appliquer les contraintes de trading

## Prochaine étape : Modifier les routes de trading (BUY/SELL)

Pour que le système soit complet, il faut ajouter le middleware `validateTradingHours` 
aux routes de trading pour bloquer les achats/ventes dans le wallet Concours avant le 2 février.

### Fichier à modifier : `backend/src/routes/portfolio.routes.ts`

Ajouter le middleware sur les routes buy/sell :

```typescript
import { validateTradingHours } from '../middleware/challenge.middleware';

// Route achat - avec validation trading hours
router.post(
    '/:portfolioId/buy',
    auth,
    validateTradingHours,  // ← AJOUTER ICI
    portfolioController.buyStock
);

// Route vente - avec validation trading hours
router.post(
    '/:portfolioId/sell',
    auth,
    validateTradingHours,  // ← AJOUTER ICI
    portfolioController.sellStock
);
```

Le middleware `validateTradingHours` :
- Vérifie le `walletType` dans le body de la requête
- Si `CONCOURS` : bloque weekend + avant 2 février
- Si `SANDBOX` : laisse passer

### Modification du frontend (BuyModal/SellModal)

Les modals de trading devront envoyer le `walletType` :

```typescript
await apiClient.post(`/portfolios/${portfolioId}/buy`, {
    ticker: selectedStock.ticker,
    quantity: buyQuantity,
    walletType: currentWalletMode  // SANDBOX ou CONCOURS
});
```
