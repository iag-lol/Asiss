import { TerminalCode } from './terminal';

export type EmailAudience = 'todos' | 'por_terminal' | 'manual';

export interface EmailPayload {
  audience: EmailAudience;
  terminalCodes?: TerminalCode[];
  manualRecipients?: string[];
  subject: string;
  body: string;
}

export interface EmailService {
  sendEmail: (payload: EmailPayload) => Promise<{ accepted: boolean; messageId: string }>;
}
