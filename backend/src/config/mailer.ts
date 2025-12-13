import config from "../config/environnement";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: {
    // Ne pas échouer sur les certificats invalides
    // Note: Nécessaire si un proxy/antivirus intercepte les connexions SSL
    // En production, si vous n'avez pas ce problème, vous pouvez mettre true
    rejectUnauthorized: false,
  },
});

export default transporter;
