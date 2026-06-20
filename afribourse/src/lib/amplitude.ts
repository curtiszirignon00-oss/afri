// src/lib/amplitude.ts — Wrapper de tracking AfriBourse
import * as amplitude from '@amplitude/unified';

// ── UTM capture ───────────────────────────────────────────────────────────────

export function captureUTMParams() {
  const params = new URLSearchParams(window.location.search);
  const utms: Record<string, string> = {
    utm_source:   params.get('utm_source')   || 'direct',
    utm_medium:   params.get('utm_medium')   || 'none',
    utm_campaign: params.get('utm_campaign') || 'none',
    utm_content:  params.get('utm_content')  || 'none',
    utm_term:     params.get('utm_term')     || 'none',
    referrer:     document.referrer          || 'direct',
  };
  if (!localStorage.getItem('afb_initial_utm_source')) {
    Object.keys(utms).forEach(k => localStorage.setItem('afb_initial_' + k, utms[k]));
  }
  return utms;
}

export function getInitialUTMs() {
  return {
    initial_utm_source:   localStorage.getItem('afb_initial_utm_source')   || 'direct',
    initial_utm_medium:   localStorage.getItem('afb_initial_utm_medium')   || 'none',
    initial_utm_campaign: localStorage.getItem('afb_initial_utm_campaign') || 'none',
    initial_utm_content:  localStorage.getItem('afb_initial_utm_content')  || 'none',
    initial_utm_term:     localStorage.getItem('afb_initial_utm_term')     || 'none',
    initial_referrer:     localStorage.getItem('afb_initial_referrer')     || 'direct',
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function trackSignUp(method = 'email') {
  amplitude.track('Sign Up', {
    method,
    ...getInitialUTMs(),
    referrer: document.referrer || 'direct',
  });
}

export function trackLogin(method = 'email') {
  amplitude.track('Login', { method });
}

export function trackLogout() {
  amplitude.track('Logout');
}

// ── Navigation ────────────────────────────────────────────────────────────────

export function trackPageView(pageName: string, params: Record<string, unknown> = {}) {
  amplitude.track('Page Viewed', { page_name: pageName, url: window.location.href, ...params });
}

// ── Bourse ────────────────────────────────────────────────────────────────────

export function trackStockViewed(ticker: string, market = 'BRVM') {
  amplitude.track('Stock Viewed', { ticker, market });
}

export function trackStockSearch(query: string) {
  amplitude.track('Stock Search', { query });
}

export function trackPortfolioViewed() {
  amplitude.track('Portfolio Viewed');
}

export function trackWatchlistAction(action: 'add' | 'remove', ticker: string) {
  amplitude.track('Watchlist Updated', { action, ticker });
}

export function trackMarketDataViewed(market: string) {
  amplitude.track('Market Data Viewed', { market });
}

// ── Abonnement ────────────────────────────────────────────────────────────────

export function trackUpgradeStarted(fromPlan = 'free', toPlan = 'premium') {
  amplitude.track('Upgrade Started', { from_plan: fromPlan, to_plan: toPlan });
}

export function trackUpgradeCompleted(plan: string, amount: number) {
  amplitude.track('Upgrade Completed', { plan, amount });
}

// ── Partage ───────────────────────────────────────────────────────────────────

export function trackShare(contentType: string, ticker = '', platform = 'community') {
  amplitude.track('Content Shared', { content_type: contentType, ticker, platform });
}

// ── Profil / Passeport Investisseur ─────────────────────────────────────────────
// Events de la refonte de la page Profil. Cf. plan "Refonte page Profil".

export function trackProfileViewed(profileId: string, isOwnProfile: boolean) {
  amplitude.track('profile_viewed', { profile_id: profileId, is_own_profile: isOwnProfile });
}

export function trackProfileLinkCopied(profileId: string, url: string) {
  amplitude.track('profile_link_copied', { profile_id: profileId, url });
}

export function trackShareCardGenerated(dnaType: string, format: string) {
  amplitude.track('share_card_generated', { dna_type: dnaType, format });
}

export function trackShareCardDownloaded(dnaType: string, format: string) {
  amplitude.track('share_card_downloaded', { dna_type: dnaType, format });
}

export function trackInvestorDnaStarted(source = 'profile_teaser') {
  amplitude.track('investor_dna_started', { source });
}

export function trackInvestorDnaCompleted(dnaType: string) {
  amplitude.track('investor_dna_completed', { dna_type: dnaType });
}

export function trackProfileFollowClicked(targetProfileId: string) {
  amplitude.track('profile_follow_clicked', { target_profile_id: targetProfileId });
}

export function trackPinnedPostClicked(postId: string) {
  amplitude.track('pinned_post_clicked', { post_id: postId });
}

export function trackSimilarProfileClicked(targetProfileId: string, dnaType?: string) {
  amplitude.track('similar_profile_clicked', { target_profile_id: targetProfileId, dna_type: dnaType });
}
