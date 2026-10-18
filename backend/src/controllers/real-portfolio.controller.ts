// backend/src/controllers/real-portfolio.controller.ts
// Portefeuille réel importé — surface distincte du portefeuille de simulation.

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { log } from '../config/logger';
import * as service from '../services/real-portfolio/real-portfolio.service';
import { RealPortfolioError } from '../services/real-portfolio/real-portfolio.service';
import { parseStatementFile, toDraftRows } from '../services/real-portfolio/parsers';
import { toIso } from '../services/real-portfolio/dates';
import type { DraftRow } from '../services/real-portfolio/types';

const uid = (req: Request) => (req as any).user?.id as string;

// ─── Schémas ───────────────────────────────────────────────────────────────

const num = z.number().finite().nullable();
const rowSchema = z.object({
  rowId: z.string().min(1).max(40),
  ticker: z.string().max(120),
  side: z.enum(['OPENING', 'BUY', 'SELL']),
  date: z.string().max(20),
  quantity: num,
  price: num,
  fees: num.optional(),
  existingId: z.string().regex(/^[a-f0-9]{24}$/).optional(),
  splitAdjusted: z.boolean().optional(),
  originalQuantity: num.optional(),
  originalPrice: num.optional(),
  note: z.string().max(500).nullable().optional(),
});

const draftSchema = z.object({
  rows: z.array(rowSchema).max(1000),
  mode: z.enum(['SNAPSHOT', 'TRANSACTIONS']).optional(),
  declaredCapital: z.number().finite().positive().nullable().optional(),
  cash: z.number().finite().min(0).nullable().optional(),
  replaceOpenings: z.boolean().optional(),
  deletedIds: z.array(z.string().regex(/^[a-f0-9]{24}$/)).max(1000).optional(),
});

const commitSchema = draftSchema.extend({
  source: z.enum(['MANUAL', 'CSV', 'XLSX']).optional(),
  fileName: z.string().max(200).nullable().optional(),
  name: z.string().max(80).optional(),
  broker: z.string().max(80).nullable().optional(),
});

const mapSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).max(1000),
  mapping: z.record(z.string(), z.string()),
  mode: z.enum(['SNAPSHOT', 'TRANSACTIONS']),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const settingsSchema = z.object({
  name: z.string().max(80).optional(),
  broker: z.string().max(80).nullable().optional(),
  declaredCapital: z.number().finite().positive().nullable().optional(),
  mode: z.enum(['SNAPSHOT', 'TRANSACTIONS']).optional(),
});

function handle(fn: (req: Request, res: Response) => Promise<unknown>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Données invalides.', errors: err.issues });
      }
      if (err instanceof RealPortfolioError) {
        return res.status(err.status).json({ message: err.message, report: err.report });
      }
      log.error('[real-portfolio]', err);
      next(err);
    }
  };
}

// ─── Upload ────────────────────────────────────────────────────────────────

export const uploadStatement = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, /\.(csv|txt|xlsx|xls|ods)$/i.test(file.originalname)),
}).single('file');

/** POST /parse — lit le fichier et propose un mapping de colonnes. Rien n'est enregistré. */
export const parseFile = handle(async (req, res) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ message: 'Fichier CSV ou Excel attendu (2 Mo max).' });
  try {
    const table = parseStatementFile(file.originalname, file.buffer);
    return res.json({ ...table, fileName: file.originalname });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || 'Fichier illisible.' });
  }
});

/** POST /map — applique le mapping choisi → lignes brouillon + rapport de validation. */
export const mapAndValidate = handle(async (req, res) => {
  const body = mapSchema.parse(req.body);
  const rows = toDraftRows(body.rows, body.mapping as any, body.mode, body.snapshotDate ?? toIso(new Date()));
  const report = await service.validateDraft(uid(req), rows, { mode: body.mode });
  return res.json({ rows, report });
});

// ─── Validation / écriture ─────────────────────────────────────────────────

export const validate = handle(async (req, res) => {
  const body = draftSchema.parse(req.body);
  return res.json(await service.validateDraft(uid(req), body.rows as DraftRow[], body));
});

export const commit = handle(async (req, res) => {
  const body = commitSchema.parse(req.body);
  const result = await service.commitRows(uid(req), { ...body, rows: body.rows as DraftRow[] });
  return res.status(201).json(result);
});

export const removeTransaction = handle(async (req, res) => {
  const id = String(req.params.id);
  if (!/^[a-f0-9]{24}$/.test(id)) return res.status(400).json({ message: 'Identifiant invalide.' });
  return res.json(await service.deleteTransaction(uid(req), id));
});

export const updateCash = handle(async (req, res) => {
  const { amount } = z.object({ amount: z.number().finite().min(0) }).parse(req.body);
  return res.json(await service.updateCash(uid(req), amount));
});

export const updateSettings = handle(async (req, res) => {
  return res.json(await service.updateSettings(uid(req), settingsSchema.parse(req.body)));
});

export const removePortfolio = handle(async (req, res) => {
  await service.deletePortfolio(uid(req));
  return res.status(204).end();
});

// ─── Lecture ───────────────────────────────────────────────────────────────

export const getDashboard = handle(async (req, res) => {
  const data = await service.getDashboard(uid(req));
  if (!data) return res.status(404).json({ message: 'Aucun portefeuille réel.' });
  return res.json(data);
});

export const getTransactions = handle(async (req, res) => res.json(await service.getTransactions(uid(req))));

export const getHistory = handle(async (req, res) => res.json(await service.getHistory(uid(req))));
