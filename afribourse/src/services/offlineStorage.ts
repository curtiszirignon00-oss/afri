// afribourse/src/services/offlineStorage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AfriBourseDB extends DBSchema {
  stocks: {
    key: string;
    value: {
      ticker: string;
      name: string;
      price: number;
      change: number;
      updatedAt: string;
    };
    indexes: { 'by-ticker': string };
  };
  portfolio: {
    key: string;
    value: {
      id: string;
      positions: any[];
      cashBalance: number;
      updatedAt: string;
    };
  };
  learningModules: {
    key: string;
    value: {
      slug: string;
      title: string;
      content: any;
      updatedAt: string;
    };
    indexes: { 'by-slug': string };
  };
  pendingTransactions: {
    key: string;
    value: {
      id: string;
      type: 'BUY' | 'SELL';
      ticker: string;
      quantity: number;
      price: number;
      createdAt: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<AfriBourseDB>>;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AfriBourseDB>('afribourse-offline', 1, {
      upgrade(db) {
        // Stocks store
        const stockStore = db.createObjectStore('stocks', { keyPath: 'ticker' });
        stockStore.createIndex('by-ticker', 'ticker');

        // Portfolio store
        db.createObjectStore('portfolio', { keyPath: 'id' });

        // Learning modules store
        const learningStore = db.createObjectStore('learningModules', { keyPath: 'slug' });
        learningStore.createIndex('by-slug', 'slug');

        // Pending transactions (for background sync)
        db.createObjectStore('pendingTransactions', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

// Stocks
export async function saveStocksOffline(stocks: any[]) {
  const db = await getDB();
  const tx = db.transaction('stocks', 'readwrite');
  await Promise.all([
    ...stocks.map(stock => tx.store.put({ ...stock, updatedAt: new Date().toISOString() })),
    tx.done,
  ]);
}

export async function getStocksOffline() {
  const db = await getDB();
  return db.getAll('stocks');
}

// Portfolio
export async function savePortfolioOffline(portfolio: any) {
  const db = await getDB();
  await db.put('portfolio', { ...portfolio, updatedAt: new Date().toISOString() });
}

export async function getPortfolioOffline(id: string) {
  const db = await getDB();
  return db.get('portfolio', id);
}

// Learning modules
export async function saveLearningModulesOffline(modules: any[]) {
  const db = await getDB();
  const tx = db.transaction('learningModules', 'readwrite');
  await Promise.all([
    ...modules.map(m => tx.store.put({ ...m, updatedAt: new Date().toISOString() })),
    tx.done,
  ]);
}

export async function getLearningModulesOffline() {
  const db = await getDB();
  return db.getAll('learningModules');
}

export async function getLearningModuleBySlug(slug: string) {
  const db = await getDB();
  return db.getFromIndex('learningModules', 'by-slug', slug);
}

// Pending transactions (background sync)
export async function addPendingTransaction(transaction: Omit<AfriBourseDB['pendingTransactions']['value'], 'id' | 'createdAt'>) {
  const db = await getDB();
  await db.add('pendingTransactions', {
    ...transaction,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
}

export async function getPendingTransactions() {
  const db = await getDB();
  return db.getAll('pendingTransactions');
}

export async function removePendingTransaction(id: string) {
  const db = await getDB();
  await db.delete('pendingTransactions', id);
}

export async function clearAllOfflineData() {
  const db = await getDB();
  await Promise.all([
    db.clear('stocks'),
    db.clear('portfolio'),
    db.clear('learningModules'),
    db.clear('pendingTransactions'),
  ]);
}
