import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { renderEmailTemplate } from './template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromAddress = Deno.env.get('RESEND_FROM') ?? 'notificaciones@asiss.online';
  const fallbackRecipients = Deno.env.get('RESEND_FALLBACK_TO')
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const brandUrl = Deno.env.get('RESEND_BRAND_URL');

  if (!apiKey) {
    return new Response('Missing RESEND_API_KEY', { status: 500, headers: corsHeaders });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  const { subject, body, audience, terminalCodes, manualRecipients } = payload ?? {};

  if (!subject || !body || !audience) {
    return new Response('Missing required fields', { status: 400, headers: corsHeaders });
  }

  let to: string[] = fallbackRecipients ?? [];
  if (audience === 'manual' && Array.isArray(manualRecipients) && manualRecipients.length > 0) {
    to = manualRecipients;
  }

  if (!to.length) {
    return new Response('No recipients resolved. Configure RESEND_FALLBACK_TO or provide manualRecipients.', {
      status: 400,
      headers: corsHeaders,
    });
  }

  const html = renderEmailTemplate({
    subject,
    body,
    audience,
    terminalCodes,
    brandUrl,
  });

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject,
      html,
    }),
  });

  const result = await resendResponse.json();

  if (!resendResponse.ok) {
    const message = typeof result === 'string' ? result : JSON.stringify(result);
    return new Response(`Resend error: ${message}`, { status: resendResponse.status, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ accepted: true, messageId: result.id ?? 'resend-pending' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
