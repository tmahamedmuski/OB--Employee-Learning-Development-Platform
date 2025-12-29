const nodemailer = require('nodemailer');

let transporter;
const isDevelopment = process.env.NODE_ENV !== 'production';

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  // In development, allow missing SMTP config (will log to console instead)
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    if (isDevelopment) {
      return null; // Return null to indicate console mode
    }
    throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailer = createTransporter();

    // Development mode: log to console if SMTP not configured
    if (!mailer) {
      console.log('\n📧 [DEV MODE] Email would be sent:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', html.replace(/<[^>]*>/g, '').trim());
      console.log('---\n');
      return; // Success in dev mode
    }

    await mailer.sendMail({
      from: process.env.SMTP_FROM || `"MindMeld" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    // In development, log error but don't crash - allow testing
    if (isDevelopment) {
      console.error('[DEV MODE] SMTP error (continuing anyway):', error.message);
      console.log('\n📧 [DEV MODE] Email would be sent:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', html.replace(/<[^>]*>/g, '').trim());
      console.log('---\n');
      return; // Don't throw in dev mode
    }
    // In production, re-throw the error
    throw error;
  }
};

module.exports = sendEmail;

