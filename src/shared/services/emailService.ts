import { EmailPayload, EmailService } from '../types/email';

const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL ?? '/functions/v1/send-email';

export const emailService: EmailService = {
  sendEmail: async (payload: EmailPayload) => {
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email send failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { accepted: data.accepted ?? true, messageId: data.messageId ?? 'pending' };
  },
};
