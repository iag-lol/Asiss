interface EmailTemplateInput {
  subject: string;
  body: string;
  audience: string;
  terminalCodes?: string[];
  brandUrl?: string;
  accentColor?: string;
}

// SVG Icons as inline base64 or direct SVG
const ICONS = {
  logo: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="url(#gradient1)"/>
    <path d="M24 12L32 28H16L24 12Z" fill="white" opacity="0.9"/>
    <path d="M24 20L28 28H20L24 20Z" fill="white"/>
    <circle cx="24" cy="32" r="4" fill="white"/>
    <defs>
      <linearGradient id="gradient1" x1="0" y1="0" x2="48" y2="48">
        <stop offset="0%" stop-color="#3b82f6"/>
        <stop offset="100%" stop-color="#1d4ed8"/>
      </linearGradient>
    </defs>
  </svg>`,
  check: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#dcfce7" stroke="#22c55e" stroke-width="3"/>
    <path d="M20 32L28 40L44 24" stroke="#16a34a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  x: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#fee2e2" stroke="#ef4444" stroke-width="3"/>
    <path d="M22 22L42 42M42 22L22 42" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/>
  </svg>`,
  clock: `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>
    <circle cx="32" cy="32" r="4" fill="#d97706"/>
    <path d="M32 18V32L42 38" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
  building: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 18V4C3 3.44772 3.44772 3 4 3H10C10.5523 3 11 3.44772 11 4V18" stroke="#64748b" stroke-width="1.5"/>
    <path d="M11 8H15C15.5523 8 16 8.44772 16 9V18" stroke="#64748b" stroke-width="1.5"/>
    <path d="M6 7H8M6 10H8M6 13H8M13 11H14M13 14H14" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M1 18H18" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  calendar: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="16" height="14" rx="2" stroke="#64748b" stroke-width="1.5"/>
    <path d="M2 8H18" stroke="#64748b" stroke-width="1.5"/>
    <path d="M6 2V5M14 2V5" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  user: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="6" r="4" stroke="#64748b" stroke-width="1.5"/>
    <path d="M3 18C3 14.134 6.13401 11 10 11C13.866 11 17 14.134 17 18" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  id: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="16" height="12" rx="2" stroke="#64748b" stroke-width="1.5"/>
    <circle cx="7" cy="9" r="2" stroke="#64748b" stroke-width="1.5"/>
    <path d="M4 14C4 12.3431 5.34315 11 7 11C8.65685 11 10 12.3431 10 14" stroke="#64748b" stroke-width="1.5"/>
    <path d="M12 8H16M12 11H15" stroke="#64748b" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  mail: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="16" height="12" rx="2" stroke="#64748b" stroke-width="1.5"/>
    <path d="M2 6L10 11L18 6" stroke="#64748b" stroke-width="1.5"/>
  </svg>`,
  arrow: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

export const renderEmailTemplate = ({
  subject,
  body,
  audience,
  terminalCodes,
  brandUrl = 'https://iag-lol.github.io/Asiss',
  accentColor = '#2563eb',
}: EmailTemplateInput) => {
  const terminals = terminalCodes?.length ? terminalCodes.join(', ') : 'Todos';
  const year = new Date().getFullYear();
  const dateTime = new Date().toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; min-height: 100vh;">
  
  <!-- Wrapper Table -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 16px 32px; background: rgba(255,255,255,0.05); border-radius: 100px; border: 1px solid rgba(255,255,255,0.1);">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right: 12px;">
                          ${ICONS.logo}
                        </td>
                        <td>
                          <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 2px;">ASISS</span>
                          <br>
                          <span style="color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 1px;">OPERACIONES Y LOGÍSTICA</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
                
                <!-- Card Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${accentColor} 0%, #1d4ed8 100%); padding: 40px 32px; text-align: center;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center">
                          <span style="display: inline-block; padding: 8px 20px; background: rgba(255,255,255,0.15); border-radius: 100px; color: rgba(255,255,255,0.9); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px;">NOTIFICACIÓN SISTEMA</span>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-top: 16px;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; line-height: 1.3;">${subject}</h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Card Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    
                    <!-- Content Box -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border-left: 4px solid ${accentColor}; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 24px;">
                          <div style="color: #334155; font-size: 15px; line-height: 1.8;">
                            ${body}
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Info Cards -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                      <tr>
                        <td width="48%" style="padding-right: 8px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <tr>
                              <td style="padding: 16px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="padding-right: 10px; vertical-align: top;">
                                      ${ICONS.building}
                                    </td>
                                    <td>
                                      <span style="display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Terminales</span>
                                      <span style="display: block; font-size: 14px; font-weight: 700; color: #1e293b;">${terminals}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="48%" style="padding-left: 8px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border: 1px solid #bfdbfe;">
                            <tr>
                              <td style="padding: 16px;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="padding-right: 10px; vertical-align: top;">
                                      ${ICONS.mail}
                                    </td>
                                    <td>
                                      <span style="display: block; font-size: 10px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Audiencia</span>
                                      <span style="display: block; font-size: 14px; font-weight: 700; color: #1e40af;">${audience === 'manual' ? 'Directo' : audience === 'todos' ? 'General' : 'Por Terminal'}</span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                      <tr>
                        <td style="height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent);"></td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="${brandUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${accentColor} 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="color: #ffffff; padding-right: 8px;">Ir al Panel de Asistencia</td>
                                <td>${ICONS.arrow}</td>
                              </tr>
                            </table>
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.5); font-size: 12px;">${dateTime}</p>
                    <p style="margin: 0; color: rgba(255,255,255,0.3); font-size: 11px;">© ${year} Asiss · Operaciones y Logística · Transdev Chile</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
};
