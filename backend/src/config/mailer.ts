import config from "../config/environnement";
import nodemailer from "nodemailer";
import { log } from "./logger";

const port = config.email.port || 587;
const isPort465 = port === 465;

// ── Validation des credentials au démarrage ──────────────────────────────────
const missingVars: string[] = [];
if (!config.email.host) missingVars.push('SMTP_HOST');
if (!config.email.user) missingVars.push('SMTP_USER');
if (!config.email.pass) missingVars.push('SMTP_PASS');
if (!config.email.from) missingVars.push('SMTP_FROM_EMAIL');

if (missingVars.length > 0) {
  log.error(
    `[MAILER] ❌ Variables SMTP manquantes : ${missingVars.join(', ')}. ` +
    `Les emails ne seront PAS envoyés. Configurez ces variables dans le dashboard Render.`
  );
} else {
  log.info(`[MAILER] ✅ SMTP configuré → ${config.email.host}:${port} (user: ${config.email.user})`);
}

// ── Transporter Nodemailer ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port,
  secure: isPort465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

// ── Vérification de la connexion au démarrage (asynchrone, non-bloquant) ─────
if (missingVars.length === 0) {
  transporter.verify().then(() => {
    log.info('[MAILER] ✅ Connexion SMTP vérifiée avec succès');
  }).catch((err: Error) => {
    log.error(`[MAILER] ❌ Connexion SMTP échouée au démarrage : ${err.message}`);
    log.error('[MAILER] → Vérifiez SMTP_HOST, SMTP_USER, SMTP_PASS dans les variables Render.');
  });
}

export const smtpReady = missingVars.length === 0;
export default transporter;
