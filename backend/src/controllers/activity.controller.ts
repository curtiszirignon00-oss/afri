// backend/src/controllers/activity.controller.ts
// Controllers pour activités et leaderboard

import { Request, Response, NextFunction } from 'express';
import * as activityService from '../services/activity.service';
import { parsePagination } from '../utils/pagination.util';

// =====================================
// ACTIVITÉS
// =====================================

/**
 * GET /api/activities/me
 * Récupère mes activités
 */
export async function getMyActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const limit = parsePagination(req.query.limit, undefined, 20).limit;

    const activities = await activityService.getUserActivities(userId, limit);
    return res.status(200).json(activities);

  } catch (error) {
    console.error('❌ Erreur getMyActivities:', error);
    return next(error);
  }
}

/**
 * GET /api/activities/feed
 * Fil d'actualités des amis
 */
export async function getActivityFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const limit = parsePagination(req.query.limit, undefined, 50).limit;

    const feed = await activityService.getActivityFeed(userId, limit);
    return res.status(200).json(feed);

  } catch (error) {
    console.error('❌ Erreur getActivityFeed:', error);
    return next(error);
  }
}

// =====================================
// LEADERBOARD
// =====================================

/**
 * GET /api/leaderboard/global
 * Classement général
 */
export async function getGlobalLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = parsePagination(req.query.limit, undefined, 100).limit;
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);

    const leaderboard = await activityService.getGlobalLeaderboard(limit, offset);
    return res.status(200).json(leaderboard);

  } catch (error) {
    console.error('❌ Erreur getGlobalLeaderboard:', error);
    return next(error);
  }
}

/**
 * GET /api/leaderboard/country/:code
 * Classement par pays
 */
export async function getCountryLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.params;
    const limit = parsePagination(req.query.limit, undefined, 50).limit;

    const leaderboard = await activityService.getCountryLeaderboard(code, limit);
    return res.status(200).json(leaderboard);

  } catch (error) {
    console.error('❌ Erreur getCountryLeaderboard:', error);
    return next(error);
  }
}

/**
 * GET /api/leaderboard/friends
 * Classement des amis
 */
export async function getFriendsLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const limit = parsePagination(req.query.limit, undefined, 50).limit;

    const leaderboard = await activityService.getFriendsLeaderboard(userId, limit);
    return res.status(200).json(leaderboard);

  } catch (error) {
    console.error('❌ Erreur getFriendsLeaderboard:', error);
    return next(error);
  }
}