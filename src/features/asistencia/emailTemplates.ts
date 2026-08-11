export type AsissEmailValue =
  | string
  | number
  | null
  | undefined
  | {
      html: string;
      text?: string;
    };

export type AsissEmailTone = 'status' | 'conflict';

export interface AsissEmailColumn {
  key: string;
  label: string;
  /** @deprecated El ancho se calcula en píxeles según el tipo de dato (getColumnPixelWidth). */
  width?: number;
  tone?: AsissEmailTone;
}

export interface BuildAsissLogisticaEmailInput {
  title: string;
  subtitle?: string;
  unitOrTerminal: string;
  requestId?: string | number | null;
  registeredBy: string;
  audience: string;
  sentAt?: string | Date;
  columns: AsissEmailColumn[];
  rowData: Record<string, AsissEmailValue>;
  status: string;
  statusMessage?: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
}

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COLORS = {
  ink: '#16273f',
  muted: '#68798f',
  hairline: '#e6ecf4',
  border: '#d9e2ee',
  headerBg: '#12304f',
  headerRule: '#3a5a80',
};

const STATUS_MESSAGES: Record<string, string> = {
  PENDIENTE: 'Esta solicitud se encuentra pendiente de autorización. Revise los antecedentes antes de aprobar o rechazar.',
  AUTORIZADO: 'La solicitud fue aprobada y el registro fue actualizado correctamente.',
  APROBADO: 'La solicitud fue aprobada y el registro fue actualizado correctamente.',
  RECHAZADO: 'La solicitud fue rechazada. Revise el detalle y las observaciones registradas.',
  OBSERVADO: 'La solicitud fue observada. Revise las observaciones registradas antes de continuar.',
};

const INVALID_TEXT_VALUES = new Set(['undefined', 'null', 'nan', 'invalid date']);

const isHtmlValue = (value: AsissEmailValue): value is { html: string; text?: string } =>
  Boolean(value && typeof value === 'object' && 'html' in value);

const stripTags = (value: string) => value.replace(/<[^>]*>/g, ' ');

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const stripAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalizeStatus = (value: string) => stripAccents(value).toUpperCase();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidText = (value: string) => {
  const text = normalizeWhitespace(stripTags(value));
  return Boolean(text) && !INVALID_TEXT_VALUES.has(text.toLowerCase());
};

export const hasAsissEmailValue = (value: AsissEmailValue): boolean => {
  if (value === null || value === undefined) return false;

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (isHtmlValue(value)) {
    return isValidText(value.text ?? value.html);
  }

  return isValidText(value);
};

const renderTextWithBreaks = (value: string) =>
  escapeHtml(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '<br>');

const normalizeRutForEmail = (value: string) => {
  const compact = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (compact.length < 2) return normalizeWhitespace(value);

  const body = compact.slice(0, -1);
  const verifier = compact.slice(-1);
  return `${body}-${verifier}`;
};

const normalizedColumnToken = (value: string) => stripAccents(value).toLowerCase();

const columnToken = (column: AsissEmailColumn) =>
  `${normalizedColumnToken(column.key)} ${normalizedColumnToken(column.label)}`;

/** Las columnas de texto libre son las únicas que pueden envolver en varias líneas. */
const isWrappingColumn = (column: AsissEmailColumn) => /observacion|motivo/.test(columnToken(column));

/**
 * Ancho fijo en píxeles por columna. La tabla se arma con un ancho total explícito para que
 * ningún cliente de correo pueda comprimirla al reenviar (era la causa de la deformación).
 */
const getColumnPixelWidth = (column: AsissEmailColumn) => {
  const token = columnToken(column);

  if (/\brut\b/.test(token)) return 94;
  if (/colaborador|nombre/.test(token)) return 178;
  if (/observacion|motivo/.test(token)) return 172;
  if (/turno|jornada|horario/.test(token)) return 108;
  if (/estado/.test(token)) return 104;
  if (/fecha|\bdia\b|dias|inicio|termino|vuelta/.test(token)) return 96;
  if (/hora/.test(token)) return 88;
  if (/conflicto|validacion|documento/.test(token)) return 100;

  return 92;
};

const textValue = (value: AsissEmailValue) => {
  if (!hasAsissEmailValue(value)) return '';
  if (isHtmlValue(value)) return normalizeWhitespace(stripTags(value.text ?? value.html));
  return normalizeWhitespace(String(value));
};

const renderValue = (value: AsissEmailValue) => {
  if (!hasAsissEmailValue(value)) return '';
  if (isHtmlValue(value)) return value.html;
  return renderTextWithBreaks(String(value));
};


const parseDateValue = (value: string | Date) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T12:00:00` : trimmed;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatEmailDate = (value?: string | Date | null) => {
  if (!value) return '';
  const date = parseDateValue(value);
  if (!date) return '';

  return date.toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatEmailDateTime = (value?: string | Date | null) => {
  const date = value ? parseDateValue(value) : new Date();
  if (!date) return '';

  return date.toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

// "Pendiente de autorización" contiene "autoriz": el caso pendiente debe evaluarse primero.
const isPendingStatus = (normalized: string) =>
  normalized.includes('PENDIENT') || normalized.includes('EN REVIS');

const getStatusMessage = (status: string, fallback?: string) => {
  if (fallback && isValidText(fallback)) return fallback;
  const normalized = normalizeStatus(status);

  if (isPendingStatus(normalized)) return STATUS_MESSAGES.PENDIENTE;
  if (normalized.includes('RECHAZ')) return STATUS_MESSAGES.RECHAZADO;
  if (normalized.includes('OBSERV')) return STATUS_MESSAGES.OBSERVADO;
  if (normalized.includes('AUTORIZ') || normalized.includes('APROB')) return STATUS_MESSAGES.APROBADO;
  return STATUS_MESSAGES.PENDIENTE;
};

const getStatusTheme = (status: string) => {
  const normalized = normalizeStatus(status);
  const pending = { background: '#fffaf0', border: '#f4e2c2', accent: '#d98a00', text: '#96540b' };

  if (isPendingStatus(normalized)) return pending;

  if (normalized.includes('RECHAZ')) {
    return { background: '#fdf1f1', border: '#f0d2d2', accent: '#c53030', text: '#9d2626' };
  }

  if (normalized.includes('OBSERV')) {
    return { background: '#fff6ea', border: '#f2dfc4', accent: '#c2760b', text: '#8a5411' };
  }

  if (normalized.includes('AUTORIZ') || normalized.includes('APROB')) {
    return { background: '#eff8f2', border: '#cfe8d9', accent: '#188a52', text: '#15683f' };
  }

  return pending;
};

const getConflictTheme = (value: string) => {
  const normalized = normalizeStatus(value);

  if (normalized.includes('SIN CONFLICT') || normalized.includes('NINGUN')) {
    return { background: '#eff8f2', color: '#15683f' };
  }

  if (normalized.includes('CONFLICT') || normalized.includes('ADVERTENCIA')) {
    return { background: '#fdf1f1', color: '#9d2626' };
  }

  return null;
};

const renderHeaderCell = (column: AsissEmailColumn, isLast: boolean) => {
  const width = getColumnPixelWidth(column);

  return `
            <td width="${width}" align="center" valign="middle" style="width:${width}px;background:${COLORS.headerBg};border-right:${isLast ? '0' : `1px solid ${COLORS.headerRule}`};padding:11px 8px;font-family:${FONT_STACK};font-size:9px;font-weight:800;letter-spacing:.5px;line-height:12px;color:#ffffff;text-transform:uppercase;text-align:center;vertical-align:middle;">
              ${renderTextWithBreaks(column.label.toLocaleUpperCase('es-CL'))}
            </td>`;
};

const renderValueCell = (column: AsissEmailColumn, value: AsissEmailValue, isLast: boolean) => {
  const width = getColumnPixelWidth(column);
  const wrapping = isWrappingColumn(column)
    ? 'word-break:break-word;'
    : 'white-space:nowrap;word-break:keep-all;';

  let renderedValue =
    normalizedColumnToken(column.key) === 'rut'
      ? escapeHtml(normalizeRutForEmail(textValue(value)))
      : renderValue(value);

  let background = '#ffffff';
  let color = COLORS.ink;

  if (column.tone === 'status') {
    const theme = getStatusTheme(textValue(value));
    background = theme.background;
    color = theme.text;
  } else if (column.tone === 'conflict') {
    const theme = getConflictTheme(textValue(value));
    if (theme) {
      background = theme.background;
      color = theme.color;
    }
  }

  return `
            <td width="${width}" align="center" valign="middle" style="width:${width}px;background:${background};border-right:${isLast ? '0' : `1px solid ${COLORS.hairline}`};padding:13px 8px;font-family:${FONT_STACK};font-size:11px;font-weight:700;line-height:15px;color:${color};text-align:center;vertical-align:middle;${wrapping}">
              ${renderedValue}
            </td>`;
};

export const buildAsissLogisticaEmail = ({
  title,
  unitOrTerminal,
  requestId,
  registeredBy,
  sentAt,
  columns,
  rowData,
  status,
  statusMessage,
  actionUrl,
  actionLabel = 'REVISAR SOLICITUD',
}: BuildAsissLogisticaEmailInput) => {
  const visibleColumns = columns.filter((column) => hasAsissEmailValue(rowData[column.key]));

  const statusColumn = visibleColumns.find((column) => column.tone === 'status');
  const statusText =
    (statusColumn ? textValue(rowData[statusColumn.key]) : '') || textValue(status) || 'Pendiente de autorización';
  const statusTheme = getStatusTheme(statusText || status);
  const safeStatusMessage = getStatusMessage(status, statusMessage);

  const safeSentAt = formatEmailDateTime(sentAt ?? new Date());
  const safeUnitOrTerminal = textValue(unitOrTerminal || 'ASISS').toUpperCase();
  const safeTitle = textValue(title);
  const safeRegisteredBy = textValue(registeredBy) || 'ASISS';
  const safeRequestId = hasAsissEmailValue(requestId) ? textValue(requestId).toUpperCase() : '';
  const safeActionUrl = actionUrl && hasAsissEmailValue(actionUrl) ? String(actionUrl) : '';
  const safeActionLabel = textValue(actionLabel ?? 'REVISAR SOLICITUD') || 'REVISAR SOLICITUD';

  // Ancho total explícito: la tabla nunca se comprime, el cliente de correo desplaza en horizontal.
  const tableWidth = visibleColumns.reduce((total, column) => total + getColumnPixelWidth(column), 0);
  const lastIndex = visibleColumns.length - 1;

  const headerCells = visibleColumns
    .map((column, index) => renderHeaderCell(column, index === lastIndex))
    .join('');

  const valueCells = visibleColumns
    .map((column, index) => renderValueCell(column, rowData[column.key], index === lastIndex))
    .join('');

  const metaLine = [
    `Registrado por ${escapeHtml(safeRegisteredBy)}`,
    `Fecha de envío ${escapeHtml(safeSentAt)}`,
    safeRequestId ? `Solicitud N&deg; ${escapeHtml(safeRequestId)}` : '',
  ]
    .filter(Boolean)
    .join(' &nbsp;&middot;&nbsp; ');

  const actionButton = safeActionUrl
    ? `
    <tr>
      <td align="left" style="padding:18px 0 0 0;text-align:left;">
        <a href="${escapeHtml(safeActionUrl)}" target="_blank" style="background:#1f5fe7;color:#ffffff;display:inline-block;font-family:${FONT_STACK};font-size:12px;font-weight:800;letter-spacing:.6px;text-decoration:none;text-transform:uppercase;padding:12px 26px;border-radius:6px;">
          ${escapeHtml(safeActionLabel.toUpperCase())}
        </a>
      </td>
    </tr>`
    : '';

  // Marcas para el envoltorio: trae su propio encabezado y necesita un contenedor ancho.
  return `<!--ASISS_CARD_HEADER--><!--ASISS_WIDE_TABLE-->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;font-family:${FONT_STACK};">

    <!-- Encabezado -->
    <tr>
      <td align="left" style="padding:0 0 14px 0;text-align:left;font-family:${FONT_STACK};">
        <span style="display:block;color:${COLORS.muted};font-size:9px;font-weight:800;letter-spacing:1.1px;line-height:12px;text-transform:uppercase;">${escapeHtml(safeUnitOrTerminal)} &middot; NOTIFICACIÓN AUTOMÁTICA</span>
        <span style="display:block;margin-top:4px;color:${COLORS.ink};font-size:17px;font-weight:800;letter-spacing:-.3px;line-height:22px;">${escapeHtml(safeTitle)}</span>
      </td>
    </tr>

    <!-- Tabla de la solicitud -->
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="${tableWidth}" cellspacing="0" cellpadding="0" border="0" style="width:${tableWidth}px;min-width:${tableWidth}px;background:#ffffff;border:1px solid ${COLORS.border};border-collapse:collapse;">
          <tr>${headerCells}
          </tr>
          <tr>${valueCells}
          </tr>
        </table>
      </td>
    </tr>

    <!-- Estado -->
    <tr>
      <td style="padding:14px 0 0 0;">
        <table role="presentation" width="${tableWidth}" cellspacing="0" cellpadding="0" border="0" style="width:${tableWidth}px;background:${statusTheme.background};border:1px solid ${statusTheme.border};border-left:4px solid ${statusTheme.accent};border-collapse:separate;border-spacing:0;">
          <tr>
            <td align="left" style="padding:12px 16px;text-align:left;font-family:${FONT_STACK};">
              <span style="color:${statusTheme.text};font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;">${escapeHtml(normalizeWhitespace(statusText))}</span>
              <span style="color:${COLORS.muted};font-size:12px;font-weight:500;">&nbsp;&nbsp;${escapeHtml(safeStatusMessage)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
${actionButton}
    <tr>
      <td align="left" style="padding:14px 0 0 0;text-align:left;font-family:${FONT_STACK};font-size:10px;font-weight:600;line-height:15px;color:#96a5b8;">
        ${metaLine}<br>Notificación automática &middot; Sistema ASISS Logística
      </td>
    </tr>
  </table>`;
};
