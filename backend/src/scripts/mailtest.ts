import transporter, { smtpReady } from '../config/mailer';

async function main() {
  console.log('smtpReady =', smtpReady);
  console.log('HOST =', process.env.SMTP_HOST, '| USER =', process.env.SMTP_USER, '| FROM =', process.env.SMTP_FROM_EMAIL);
  try {
    await transporter.verify();
    console.log('✅ transporter.verify() OK — connexion SMTP fonctionne');
  } catch (e: any) {
    console.error('❌ verify failed:', e.code || e.name, '-', e.message, e.response ? '| SMTP: ' + e.response : '');
    return;
  }
  const to = process.argv[2];
  if (to) {
    try {
      const info = await transporter.sendMail({
        from: `"AfriBourse" <${process.env.SMTP_FROM_EMAIL}>`,
        to,
        subject: 'Test AfriBourse — diagnostic email',
        html: '<p>Ceci est un test de diagnostic d\'envoi email AfriBourse.</p>',
        text: 'Test diagnostic email AfriBourse.',
      });
      console.log('✅ Email envoyé →', to, '| messageId:', info.messageId);
    } catch (e: any) {
      console.error('❌ sendMail failed:', e.code || e.name, '-', e.message, e.response ? '| SMTP: ' + e.response : '');
    }
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
