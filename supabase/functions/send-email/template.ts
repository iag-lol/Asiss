interface EmailTemplateInput {
  subject: string;
  body: string;
  audience: string;
  terminalCodes?: string[];
  brandUrl?: string;
  accentColor?: string;
}

const baseStyles = {
  background: '#0f172a',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#475569',
  accent: '#3c5eff',
  badge: '#e2e8f0',
};

const inline = (styles: Record<string, string | number>) =>
  Object.entries(styles)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');

export const renderEmailTemplate = ({
  subject,
  body,
  audience,
  terminalCodes,
  brandUrl,
  accentColor = baseStyles.accent,
}: EmailTemplateInput) => {
  const terminals = terminalCodes?.length ? terminalCodes.join(', ') : 'Todos';
  const safeBody = body.replace(/\n/g, '<br />');

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @media (max-width: 640px) {
        .card { padding: 24px !important; }
        .grid { display: block !important; }
        .pill { display: block !important; margin-bottom: 8px; }
      }
      .btn:hover { filter: brightness(0.95); }
    </style>
  </head>
  <body style="${inline({
    margin: 0,
    padding: '24px',
    background: baseStyles.background,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    color: baseStyles.text,
  })}">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 720px; margin: 0 auto;">
      <tr>
        <td style="${inline({ textAlign: 'center', padding: '12px 0 24px 0', color: '#cbd5e1', letterSpacing: '2px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' })}">
          Asiss · Dashboard logístico
        </td>
      </tr>
      <tr>
        <td class="card" style="${inline({
          background: baseStyles.card,
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.20)',
          border: '1px solid #e2e8f0',
        })}">
          <div style="${inline({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
          })}">
            <div style="${inline({ display: 'flex', alignItems: 'center', gap: '12px' })}">
              <div style="${inline({
                height: '44px',
                width: '44px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${accentColor}, #1d4ed8)`,
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontWeight: 800,
                letterSpacing: '0.5px',
              })}">
                A
              </div>
              <div>
                <p style="${inline({ margin: 0, fontSize: '12px', color: baseStyles.muted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' })}">Comunicado</p>
                <p style="${inline({ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800 })}">${subject}</p>
              </div>
            </div>
            <div class="pill" style="${inline({
              padding: '8px 12px',
              background: baseStyles.badge,
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              color: baseStyles.muted,
            })}">
              ${audience === 'todos' ? 'Todos los terminales' : `Segmento: ${audience}`}
            </div>
          </div>

          <div style="${inline({
            margin: '18px 0',
            padding: '18px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            lineHeight: 1.6,
            color: baseStyles.muted,
            fontSize: '15px',
          })}">
            ${safeBody}
          </div>

          <div class="grid" style="${inline({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px',
          })}">
            <div style="${inline({
              padding: '12px',
              borderRadius: '12px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
            })}">
              <p style="${inline({ margin: '0 0 6px 0', color: baseStyles.muted, fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' })}">Terminales</p>
              <p style="${inline({ margin: 0, fontSize: '14px', fontWeight: 700, color: baseStyles.text })}">${terminals}</p>
            </div>
            <div style="${inline({
              padding: '12px',
              borderRadius: '12px',
              background: '#eef2ff',
              border: '1px solid #e0e7ff',
            })}">
              <p style="${inline({ margin: '0 0 6px 0', color: '#4338ca', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' })}">Tipo</p>
              <p style="${inline({ margin: 0, fontSize: '14px', fontWeight: 700, color: '#312e81' })}">Informativo interno Asiss</p>
            </div>
          </div>

          ${brandUrl ? `<a class="btn" href="${brandUrl}" style="${inline({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: accentColor,
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            letterSpacing: '0.3px',
          })}">Ir al panel <span style="${inline({ opacity: 0.7 })}">→</span></a>` : ''}
        </td>
      </tr>
      <tr>
        <td style="${inline({ textAlign: 'center', color: '#cbd5e1', fontSize: '12px', paddingTop: '18px' })}">
          © ${new Date().getFullYear()} Asiss · Operaciones y logística
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
