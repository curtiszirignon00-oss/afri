// src/hooks/useContentUnseen.ts
// Tracks unseen news articles and community posts using localStorage timestamps.
// Works for both authenticated and anonymous users.

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRecentNews } from './useApi';
import { apiClient } from '../lib/api-client';

const NEWS_LS_KEY      = 'afribourse_last_seen_news';
const COMMUNITY_LS_KEY = 'afribourse_last_seen_community';

// ---------------------------------------------------------------------------
// News
// ---------------------------------------------------------------------------

/** Returns the number of news articles published since the user last visited /news. */
export function useUnseenNewsCount(): number {
  const [count, setCount] = useState(0);
  const { data: articles } = useRecentNews(8);

  useEffect(() => {
    if (!articles?.length) return;
    const raw = localStorage.getItem(NEWS_LS_KEY);
    if (!raw) {
      // First ever visit — show a dot without an inflated count
      setCount(1);
      return;
    }
    const since    = new Date(raw);
    const newCount = articles.filter(
      (a) => a.published_at && new Date(a.published_at) > since
    ).length;
    setCount(newCount);
  }, [articles]);

  return count;
}

/** Call this when the user navigates to /news. */
export function markNewsVisited(): void {
  localStorage.setItem(NEWS_LS_KEY, new Date().toISOString());
}

// ---------------------------------------------------------------------------
// Community (public / non-authenticated)
// ---------------------------------------------------------------------------

/** Returns the number of new community posts since the user last visited /community.
 *  Used only when the user is NOT logged in (logged-in users use the server-side count). */
export function useUnseenCommunityPublicCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  const { data } = useQuery({
    queryKey: ['community', 'latest-public'],
    queryFn: async () => {
      const res = await apiClient.get('/social/community?page=1&limit=5');
      return res.data;
    },
    enabled,
    staleTime:       3 * 60 * 1000,
    refetchInterval: 90 * 1000,
  });

  useEffect(() => {
    const posts: any[] = data?.data ?? data?.posts ?? [];
    if (!posts.length) return;
    const raw = localStorage.getItem(COMMUNITY_LS_KEY);
    if (!raw) {
      setCount(1);
      return;
    }
    const since    = new Date(raw);
    const newCount = posts.filter(
      (p) => p.created_at && new Date(p.created_at) > since
    ).length;
    setCount(newCount);
  }, [data]);

  return count;
}

/** Call this when the user navigates to /community. */
export function markCommunityVisited(): void {
  localStorage.setItem(COMMUNITY_LS_KEY, new Date().toISOString());
}
