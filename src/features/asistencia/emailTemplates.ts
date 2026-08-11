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
  /** @deprecated El detalle se renderiza en filas verticales; el ancho ya no se usa. */
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
  labelBg: '#f8fafd',
  headerBg: '#12304f',
  headerMuted: '#a8c4e4',
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

/** Campos que siempre deben caber en una sola línea (fechas, horas, turnos, RUT). */
const isSingleLineColumn = (column: AsissEmailColumn) => {
  const token = `${normalizedColumnToken(column.key)} ${normalizedColumnToken(column.label)}`;

  if (token.includes('colaborador') || token.includes('nombre') || token.includes('observacion')) {
    return false;
  }

  return (
    normalizedColumnToken(column.key) === 'rut' ||
    token.includes('rut') ||
    token.includes('fecha') ||
    token.includes('hora') ||
    token.includes('turno') ||
    token.includes('jornada') ||
    token.includes('horario') ||
    token.includes('dia') ||
    token.includes('inicio') ||
    token.includes('termino') ||
    token.includes('vuelta')
  );
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

/** 'FECHA DE\nSOLICITUD' -> 'Fecha de solicitud' | 'RUT' -> 'RUT' */
const formatFieldLabel = (label: string) => {
  const clean = normalizeWhitespace(label.replace(/[\r\n]+/g, ' '));
  if (!clean) return '';
  if (clean.length <= 3) return clean.toLocaleUpperCase('es-CL');

  const isAllCaps = clean === clean.toLocaleUpperCase('es-CL');
  if (!isAllCaps) return clean;

  const lower = clean.toLocaleLowerCase('es-CL');
  return lower.charAt(0).toLocaleUpperCase('es-CL') + lower.slice(1);
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

const renderDetailRow = (
  column: AsissEmailColumn,
  value: AsissEmailValue,
  index: number
) => {
  const label = formatFieldLabel(column.label);
  const isFirst = index === 0;
  const topBorder = isFirst ? '0' : `1px solid ${COLORS.hairline}`;
  const singleLine = isSingleLineColumn(column) ? 'white-space:nowrap;word-break:keep-all;' : 'word-break:break-word;';

  let renderedValue =
    normalizedColumnToken(column.key) === 'rut'
      ? escapeHtml(normalizeRutForEmail(textValue(value)))
      : renderValue(value);

  if (column.tone === 'conflict') {
    const theme = getConflictTheme(textValue(value));
    if (theme) {
      renderedValue = `<span style="display:inline-block;background:${theme.background};color:${theme.color};font-size:12px;font-weight:700;line-height:16px;padding:3px 9px;border-radius:4px;">${renderedValue}</span>`;
    }
  }

  return `
        <tr>
          <td width="38%" align="left" valign="top" style="width:38%;background:${COLORS.labelBg};border-top:${topBorder};border-right:1px solid ${COLORS.hairline};padding:10px 14px;font-family:${FONT_STACK};font-size:11px;font-weight:700;letter-spacing:.25px;line-height:16px;color:${COLORS.muted};text-align:left;vertical-align:top;">
            ${escapeHtml(label)}
          </td>
          <td align="left" valign="top" style="border-top:${topBorder};padding:10px 14px;font-family:${FONT_STACK};font-size:13px;font-weight:700;line-height:18px;color:${COLORS.ink};text-align:left;vertical-align:top;${singleLine}">
            ${renderedValue}
          </td>
        </tr>`;
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
  const statusColumn = columns.find((column) => column.tone === 'status');
  const statusText =
    (statusColumn ? textValue(rowData[statusColumn.key]) : '') || textValue(status) || 'Pendiente de autorización';
  const statusTheme = getStatusTheme(statusText || status);
  const safeStatusMessage = getStatusMessage(status, statusMessage);

  // El estado se comunica en la banda superior: no se repite dentro del detalle.
  const detailColumns = columns.filter(
    (column) => column.tone !== 'status' && hasAsissEmailValue(rowData[column.key])
  );

  const safeSentAt = formatEmailDateTime(sentAt ?? new Date());
  const safeUnitOrTerminal = textValue(unitOrTerminal || 'ASISS').toUpperCase();
  const safeTitle = textValue(title);
  const safeRegisteredBy = textValue(registeredBy) || 'ASISS';
  const safeRequestId = hasAsissEmailValue(requestId) ? textValue(requestId).toUpperCase() : '';
  const safeActionUrl = actionUrl && hasAsissEmailValue(actionUrl) ? String(actionUrl) : '';
  const safeActionLabel = textValue(actionLabel ?? 'REVISAR SOLICITUD') || 'REVISAR SOLICITUD';

  const metaRows: Array<{ column: AsissEmailColumn; value: AsissEmailValue }> = [
    { column: { key: 'registrado_por', label: 'Registrado por' }, value: safeRegisteredBy },
    { column: { key: 'fecha_envio', label: 'Fecha de envío' }, value: safeSentAt },
  ];

  const detailRows = [
    ...detailColumns.map((column) => ({ column, value: rowData[column.key] })),
    ...metaRows,
  ]
    .map((row, index) => renderDetailRow(row.column, row.value, index))
    .join('');

  const actionButton = safeActionUrl
    ? `
    <tr>
      <td align="center" style="padding:20px 0 0 0;text-align:center;">
        <a href="${escapeHtml(safeActionUrl)}" target="_blank" style="background:#1f5fe7;color:#ffffff;display:inline-block;font-family:${FONT_STACK};font-size:12px;font-weight:800;letter-spacing:.6px;text-decoration:none;text-transform:uppercase;padding:12px 26px;border-radius:6px;">
          ${escapeHtml(safeActionLabel.toUpperCase())}
        </a>
      </td>
    </tr>`
    : '';

  // El bloque trae su propio encabezado: el envoltorio omite el título duplicado.
  return `<!--ASISS_CARD_HEADER-->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;font-family:${FONT_STACK};">

    <!-- Estado de la solicitud -->
    <tr>
      <td style="padding:0 0 18px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${statusTheme.background};border:1px solid ${statusTheme.border};border-left:4px solid ${statusTheme.accent};border-collapse:separate;border-spacing:0;border-radius:6px;">
          <tr>
            <td align="left" style="padding:13px 16px;text-align:left;font-family:${FONT_STACK};">
              <span style="display:block;color:${statusTheme.text};font-size:12px;font-weight:800;letter-spacing:.7px;line-height:16px;text-transform:uppercase;">${escapeHtml(normalizeWhitespace(statusText))}</span>
              <span style="display:block;margin-top:5px;color:${COLORS.muted};font-size:12px;font-weight:500;line-height:17px;">${escapeHtml(safeStatusMessage)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Detalle de la solicitud -->
    <tr>
      <td style="padding:0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#ffffff;border:1px solid ${COLORS.border};border-collapse:separate;border-spacing:0;border-radius:8px;overflow:hidden;">
          <tr>
            <td colspan="2" align="left" style="background:${COLORS.headerBg};padding:13px 16px;text-align:left;font-family:${FONT_STACK};">
              <span style="display:block;color:${COLORS.headerMuted};font-size:9px;font-weight:800;letter-spacing:1.1px;line-height:12px;text-transform:uppercase;">${escapeHtml(safeUnitOrTerminal)} &middot; NOTIFICACIÓN AUTOMÁTICA</span>
              <span style="display:block;margin-top:4px;color:#ffffff;font-size:14px;font-weight:700;letter-spacing:-.1px;line-height:19px;">${escapeHtml(safeTitle)}</span>
            </td>
          </tr>${detailRows}
        </table>
      </td>
    </tr>
${actionButton}
    <tr>
      <td align="left" style="padding:16px 2px 0 2px;text-align:left;font-family:${FONT_STACK};font-size:10px;font-weight:600;line-height:15px;color:#96a5b8;">
        ${safeRequestId ? `Solicitud N&deg; <span style="word-break:break-all;">${escapeHtml(safeRequestId)}</span><br>` : ''}
        Notificación automática &middot; Sistema ASISS Logística
      </td>
    </tr>
  </table>`;
};
