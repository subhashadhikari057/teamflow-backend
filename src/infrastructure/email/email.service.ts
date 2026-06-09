import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { mailConfig } from '../../config/mail.config';
import type { EmailMessage, IEmailService } from './email.interface';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: false,
      ...(mailConfig.user || mailConfig.pass
        ? {
            auth: {
              user: mailConfig.user,
              pass: mailConfig.pass,
            },
          }
        : {}),
    });
  }

  async send(message: EmailMessage) {
    if (!mailConfig.from) {
      throw new ServiceUnavailableException('MAIL_FROM is not configured');
    }

    await this.transporter.sendMail({
      from: mailConfig.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });

    this.logger.log(
      `Email sent to ${message.to} via ${mailConfig.host}:${mailConfig.port} with subject "${message.subject}"`,
    );
  }
}
