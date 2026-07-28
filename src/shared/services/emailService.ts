import { EmailPayload, EmailService } from '../types/email';
import {
  ASISS_SUPABASE_ANON_KEY,
  ASISS_SUPABASE_URL,
  buildSupabaseFunctionsUrl,
} from '../lib/supabaseConfig';

const EMAIL_API_URL = `${buildSupabaseFunctionsUrl(ASISS_SUPABASE_URL)}/send-email`;

export const emailService: EmailService = {
  sendEmail: async (payload: EmailPayload) => {
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ASISS_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${ASISS_SUPABASE_ANON_KEY}`,
      },
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
