import config from "../config/environnement";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export default transporter;
