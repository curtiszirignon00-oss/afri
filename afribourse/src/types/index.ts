// ========================================
// TYPES UTILISATEUR & AUTHENTIFICATION
// ========================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
  first_name?: string | null;
  last_name?: string | null;
  country: string | null;
  birth_date: string | null;
  has_invested: boolean | null;
  experience_level: string | null;
  main_goals: string[] | null;
  monthly_amount: string | null;
  profile_type: string | null;
  avatar_url?: string | null;
  is_public?: boolean;
  bio?: string | null;
  social_links?: string[];
}

// ========================================
// TYPES MARCHÉ (BRVM)
// ========================================

export interface Stock {
  id: string;
  symbol: string;
  company_name: string;
  sector: string | null;
  description: string | null;
  website_url: string | null;
  current_price: number;
  previous_close: number;
  daily_change_percent: number;
  volume: number;
  market_cap: number;
  logo_url?: string | null;
}

export interface StockFundamental {
  id: string;
  stockId: string;
  year: number;
  pe_ratio: number;
  dividend_yield: number;
  eps: number;
  revenue?: number;
  net_profit?: number;
  book_value?: number;
}

export interface MarketIndex {
  id: string;
  index_name: string;
  index_value: number;
  daily_change_percent: number;
  date: string;
}

// ========================================
// TYPES PORTFOLIO & TRANSACTIONS
// ========================================

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  initial_balance: number;
  cash_balance: number;
  positions: Position[];
  transactions?: Transaction[];
}

export interface Position {
  id: string;
  portfolioId: string;
  stock_ticker: string;
  quantity: number;
  average_buy_price: number;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  stock_ticker: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price_per_share: number;
  created_at: string | null;
}

export interface WatchlistItem {
  id: string;
  stock_ticker: string;
  userId: string;
  created_at?: string | null;
}

export interface PortfolioHistoryPoint {
  date: string;
  value: number;
}

// ========================================
// TYPES CONTENU (NEWS & LEARNING)
// ========================================

export interface NewsArticle {
  id: string;
  title: string;
  slug: string | null;
  summary: string | null;
  content: string | null;
  category: string | null;
  author: string | null;
  source: string | null;
  country: string | null;
  sector: string | null;
  image_url: string | null;
  is_featured: boolean;
  published_at: string | null;
  created_at: string | null;
}

export interface LearningModule {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  difficulty_level: string;
  content_type: string;
  duration_minutes: number | null;
  order_index: number | null;
  is_published: boolean;
  thumbnail_url: string | null;
  video_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LearningProgress {
  id: string;
  is_completed: boolean;
  completed_at: string | null;
  userId: string;
  moduleId: string;
  module: {
    slug: string;
    title: string;
    order_index: number;
  };
}

// ========================================
// TYPES NAVIGATION & API
// ========================================

export type Page =
  | 'home'
  | 'markets'
  | 'stock-detail'
  | 'news'
  | 'learn'
  | 'glossary'
  | 'signup'
  | 'login'
  | 'dashboard'
  | 'profile'
  | 'transactions';

export interface Navigation {
  page: Page;
  data?: any;
}