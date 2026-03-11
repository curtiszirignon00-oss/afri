import config from "../config/environnement";
import nodemailer from "nodemailer";

// Détection automatique du mode secure selon le port
// Port 465 = SSL (secure: true)
// Port 587 = TLS (secure: false)
const port = config.email.port || 587;
const isPort465 = port === 465;

console.log(`📧 [MAILER] Configuration SMTP:`);
console.log(`   → Serveur: ${config.email.host}:${port}`);
console.log(`   → Mode: ${isPort465 ? 'SSL (Port 465)' : 'TLS (Port 587)'}`);
console.log(`   → Utilisateur: ${config.email.user}`);

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: port,
  secure: isPort465, // true pour 465 (SSL), false pour 587 (TLS)
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: {
    // Brevo SMTP requiert false — leur chaîne contient un CA intermédiaire non reconnu
    // La connexion reste chiffrée TLS (confidentialité assurée)
    rejectUnauthorized: false,
  },
  // Augmenter les timeouts pour les connexions lentes (comme Render)
  connectionTimeout: 10000, // 10 secondes
  greetingTimeout: 10000,   // 10 secondes
  socketTimeout: 10000,     // 10 secondes
});

export default transporter;
