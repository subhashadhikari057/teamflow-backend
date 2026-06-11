import type { AuthEmailMessage } from './auth-email.interface';

interface BuildVerificationEmailInput {
  verificationLink: string;
  token: string;
}

export function buildVerificationEmail(
  input: BuildVerificationEmailInput,
): AuthEmailMessage {
  return {
    subject: 'Verify your Teamflow email',
    text: [
      'Welcome to Teamflow.',
      '',
      'Please verify your email address to activate your account.',
      '',
      `Verify Email: ${input.verificationLink}`,
      '',
      `If the button does not work, use this token: ${input.token}`,
    ].join('\n'),
  };
}
