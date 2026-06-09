export interface EmailMessage {
  html?: string;
  subject: string;
  text: string;
  to: string;
}

export interface IEmailService {
  send(message: EmailMessage): Promise<void>;
}
