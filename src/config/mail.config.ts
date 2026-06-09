import './env.config';

export const mailConfig = {
  host: process.env.SMTP_HOST?.trim() || 'localhost',
  port: Number(process.env.SMTP_PORT) || 1025,
  user: process.env.SMTP_USER?.trim() || '',
  pass: process.env.SMTP_PASS?.trim() || '',
  from: process.env.MAIL_FROM?.trim() || '',
  mailpitUiUrl: process.env.MAILPIT_UI_URL?.trim() || '',
} as const;
