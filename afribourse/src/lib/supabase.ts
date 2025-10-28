import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Stock = {
  id: string;
  symbol: string;
  company_name: string;
  sector: string;
  country: string;
  current_price: number;
  previous_close: number;
  daily_change_percent: number;
  volume: number;
  market_cap: number;
  description: string;
  logo_url: string;
  website_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MarketIndex = {
  id: string;
  index_name: string;
  index_value: number;
  daily_change_percent: number;
  date: string;
  created_at: string;
};

export type LearningModule = {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  difficulty_level: 'debutant' | 'intermediaire' | 'avance';
  content_type: 'article' | 'video' | 'quiz' | 'infographic';
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
  thumbnail_url: string;
  video_url: string;
  created_at: string;
  updated_at: string;
};

export type Startup = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sector: string;
  country: string;
  founding_year: number;
  stage: string;
  total_funding: number;
  team_size: number;
  website_url: string;
  logo_url: string;
  linkedin_url: string;
  twitter_url: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  author: string;
  source: string;
  country: string;
  sector: string;
  image_url: string;
  is_featured: boolean;
  published_at: string;
  created_at: string;
};

export type StockFundamental = {
  id: string;
  stock_id: string;
  year: number;
  pe_ratio: number;
  dividend_yield: number;
  revenue: number;
  net_profit: number;
  eps: number;
  book_value: number;
  created_at: string;
  updated_at: string;
};
