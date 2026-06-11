import type { AuthEmailMessage } from './auth-email.interface';

interface BuildPasswordResetEmailInput {
  resetLink: string;
  token: string;
}

export function buildPasswordResetEmail(
  input: BuildPasswordResetEmailInput,
): AuthEmailMessage {
  return {
    subject: 'Reset your Teamflow password',
    text: [
      'We received a request to reset your Teamflow password.',
      '',
      `Reset Password: ${input.resetLink}`,
      '',
      `If the button does not work, use this token: ${input.token}`,
    ].join('\n'),
  };
}
