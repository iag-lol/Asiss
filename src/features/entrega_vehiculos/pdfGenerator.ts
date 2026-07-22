import jsPDF from 'jspdf';
import { VehicleHandoverRequest } from './types';

type DocumentKind = 'delivery' | 'reception';

/* ------------------------------------------------------------------ */
/* Geometría de página (Carta vertical, milímetros)                     */
/* ------------------------------------------------------------------ */

const PAGE_W = 215.9;
const MARGIN = 11;
const X0 = MARGIN;
const X1 = PAGE_W - MARGIN;
const CONTENT_W = X1 - X0;

const BLACK: [number, number, number] = [0, 0, 0];
const RED: [number, number, number] = [227, 6, 19];
const INK: [number, number, number] = [17, 24, 39];
const GREY: [number, number, number] = [120, 128, 138];
const HAIR: [number, number, number] = [150, 158, 168];

/* Ítems exactamente como aparecen en el formulario PRO-FIN-05-REG-01 */
const INVENTORY_ITEMS = [
  'Padrón Vehicular',
  'Permiso de circulación',
  'SOAP',
  'Cert. RT',
  'Cert. Gases',
  'TAG',
  'Tarjeta',
  'Rueda de Repuesto',
  'Gata y llave de ruedas',
  'Botiquín',
  'Triangulo',
  'Antena',
  'Extintor',
  'KM',
];

const uppercase = (value: string) => (value || '').trim().toLocaleUpperCase('es-CL');

const shortDate = (value: string) => {
  const [day, month, year] = (value || '').split('/');
  return day && month && year ? `${day}-${month}-${year.slice(-2)}` : value;
};

const safeFilename = (value: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_');

/* ------------------------------------------------------------------ */
/* Logo Transdev                                                        */
/* ------------------------------------------------------------------ */

/**
 * Si existe `public/logo_transdev.png` se usa el logo oficial en alta
 * resolución. Si no está disponible, se dibuja la marca vectorial
 * equivalente para que la ficha nunca salga sin identidad corporativa.
 */
const LOGO_URL = '/logo_transdev.png';
let logoPromise: Promise<string | null> | null = null;

const loadOfficialLogo = (): Promise<string | null> => {
  if (logoPromise) return logoPromise;
  logoPromise = (async () => {
    if (typeof fetch !== 'function' || typeof FileReader === 'undefined') return null;
    try {
      const response = await fetch(LOGO_URL, { cache: 'force-cache' });
      if (!response.ok) return null;
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) return null;
      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  })();
  return logoPromise;
};

/**
 * Marca vectorial "transdev": figura en movimiento + logotipo + bajada.
 * Se compone dentro del recuadro (x, y, w, h) y queda centrada en él.
 */
const drawVectorLogo = (doc: jsPDF, x: number, y: number, w: number, h: number) => {
  const markH = Math.min(h * 0.52, 14);
  const k = markH / 22; // la figura se define en una caja local de 20 x 22.
  const markW = 20 * k;

  const wordPt = markH * 1.55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(wordPt);
  const wordW = doc.getTextWidth('transdev');

  const gap = markH * 0.22;
  const blockW = markW + gap + wordW;
  const originX = x + (w - blockW) / 2;
  const originY = y + (h - markH) / 2 - markH * 0.12;

  const ctx = doc.context2d;
  ctx.save();
  ctx.strokeStyle = '#E30613';
  ctx.fillStyle = '#E30613';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const ux = (v: number) => originX + v * k;
  const uy = (v: number) => originY + v * k;

  // Cabeza.
  ctx.beginPath();
  ctx.arc(ux(9.2), uy(3.4), 2.4 * k, 0, Math.PI * 2, false);
  ctx.fill();

  // Brazo en impulso.
  ctx.lineWidth = 2.5 * k;
  ctx.beginPath();
  ctx.moveTo(ux(2.6), uy(11.6));
  ctx.quadraticCurveTo(ux(9.4), uy(9.6), ux(17.8), uy(3.4));
  ctx.stroke();

  // Torso y pierna delantera.
  ctx.lineWidth = 2.7 * k;
  ctx.beginPath();
  ctx.moveTo(ux(7.4), uy(9.2));
  ctx.quadraticCurveTo(ux(12.8), uy(12.4), ux(11.2), uy(20));
  ctx.stroke();

  // Pierna de apoyo.
  ctx.lineWidth = 2.3 * k;
  ctx.beginPath();
  ctx.moveTo(ux(9.8), uy(14.6));
  ctx.quadraticCurveTo(ux(5.2), uy(15.6), ux(1.4), uy(18.8));
  ctx.stroke();
  ctx.restore();

  const wordX = originX + markW + gap;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(wordPt);
  doc.setTextColor(...RED);
  doc.text('transdev', wordX, originY + markH * 0.82);

  doc.setFontSize(Math.max(4.6, markH * 0.42));
  doc.setCharSpace(0.18);
  doc.text('THE MOBILITY COMPANY', wordX + 0.6, originY + markH * 1.26);
  doc.setCharSpace(0);
  doc.setTextColor(...BLACK);
};

const drawLogo = (doc: jsPDF, logo: string | null, boxX: number, boxY: number, boxW: number, boxH: number) => {
  if (logo) {
    try {
      const props = doc.getImageProperties(logo);
      const ratio = Math.min((boxW - 12) / props.width, (boxH - 8) / props.height);
      const w = props.width * ratio;
      const h = props.height * ratio;
      doc.addImage(logo, boxX + (boxW - w) / 2, boxY + (boxH - h) / 2, w, h, undefined, 'FAST');
      return;
    } catch {
      /* si el archivo no es utilizable se usa la marca vectorial */
    }
  }
  drawVectorLogo(doc, boxX, boxY, boxW, boxH);
};

/* ------------------------------------------------------------------ */
/* Plano del vehículo (line art vectorial, 5 vistas)                    */
/* ------------------------------------------------------------------ */

type Ctx = jsPDF['context2d'];

/**
 * Lápiz con sistema de coordenadas local 0..100 en el eje X, para que las
 * vistas del vehículo se dibujen siempre con las mismas proporciones sin
 * importar el tamaño del recuadro.
 */
const pen = (ctx: Ctx, x: number, y: number, w: number) => {
  const s = w / 100;
  const px = (a: number) => x + a * s;
  const py = (b: number) => y + b * s;
  return {
    begin: () => ctx.beginPath(),
    move: (a: number, b: number) => ctx.moveTo(px(a), py(b)),
    to: (a: number, b: number) => ctx.lineTo(px(a), py(b)),
    curve: (ca: number, cb: number, a: number, b: number) =>
      ctx.quadraticCurveTo(px(ca), py(cb), px(a), py(b)),
    circle: (a: number, b: number, r: number) => {
      ctx.beginPath();
      ctx.arc(px(a), py(b), r * s, 0, Math.PI * 2, false);
      ctx.stroke();
    },
    stroke: () => ctx.stroke(),
    poly: (points: number[][]) => {
      ctx.beginPath();
      points.forEach(([a, b], index) => (index === 0 ? ctx.moveTo(px(a), py(b)) : ctx.lineTo(px(a), py(b))));
      ctx.stroke();
    },
  };
};

/** Vista lateral del furgón; `slidingDoor` abre la puerta corredera. */
const vanSide = (ctx: Ctx, x: number, y: number, w: number, slidingDoor: boolean) => {
  const d = pen(ctx, x, y, w);

  // Silueta: capó bajo adelante, techo alto y volumen de carga atrás.
  d.begin();
  d.move(2, 36);
  d.curve(2, 27, 11, 25);
  d.to(22, 24);
  d.curve(28, 9, 43, 7);
  d.to(86, 7);
  d.curve(95, 8, 96, 17);
  d.to(96, 40);
  d.curve(96, 45, 90, 45);
  d.to(8, 45);
  d.curve(2, 45, 2, 36);
  d.stroke();

  // Parabrisas y ventanas laterales.
  d.poly([[29, 22], [34, 11], [50, 11], [50, 22], [29, 22]]);
  d.poly([[54, 11], [72, 11], [72, 22], [54, 22], [54, 11]]);
  d.poly([[76, 11], [90, 11], [90, 22], [76, 22], [76, 11]]);

  // Cortes de puertas y manillas.
  d.poly([[52, 9], [52, 43]]);
  d.poly([[74, 9], [74, 43]]);
  d.poly([[26, 24], [26, 43]]);
  d.poly([[56, 26], [61, 26]]);
  d.poly([[78, 26], [83, 26]]);

  if (slidingDoor) {
    d.begin();
    d.move(54, 27);
    d.curve(63, 37, 72, 31);
    d.stroke();
    d.poly([[54, 27], [54, 41]]);
  }

  // Faldón inferior y paragolpes.
  d.poly([[6, 40], [92, 40]]);
  d.poly([[2, 37], [8, 37]]);

  // Ruedas y línea de suelo.
  [21, 80].forEach((wx) => {
    d.circle(wx, 45, 6.5);
    d.circle(wx, 45, 3);
  });
  d.poly([[2, 51.5], [13, 51.5]]);
  d.poly([[29, 51.5], [72, 51.5]]);
  d.poly([[88, 51.5], [96, 51.5]]);
};

/** Vista frontal (`rear = false`) o trasera (`rear = true`). Alto ≈ 0.78 · w. */
const vanFace = (ctx: Ctx, x: number, y: number, w: number, rear: boolean) => {
  const d = pen(ctx, x, y, w);

  // Carrocería.
  d.begin();
  d.move(11, 66);
  d.to(11, 24);
  d.curve(13, 9, 28, 7);
  d.to(72, 7);
  d.curve(87, 9, 89, 24);
  d.to(89, 66);
  d.to(11, 66);
  d.stroke();

  // Parabrisas o luneta.
  d.poly([[19, 13], [81, 13], [81, 33], [19, 33], [19, 13]]);

  // Espejos exteriores.
  d.poly([[5, 38], [11, 35]]);
  d.poly([[95, 38], [89, 35]]);

  // Paragolpes.
  d.poly([[12, 52], [88, 52]]);
  d.poly([[12, 61], [88, 61]]);

  if (rear) {
    d.poly([[26, 37], [74, 37]]);
    d.poly([[50, 13], [50, 52]]);
    d.poly([[14, 37], [23, 37], [23, 49], [14, 49], [14, 37]]);
    d.poly([[77, 37], [86, 37], [86, 49], [77, 49], [77, 37]]);
  } else {
    d.poly([[33, 39], [67, 39], [67, 46], [33, 46], [33, 39]]);
    d.poly([[14, 37], [30, 37], [30, 46], [14, 46], [14, 37]]);
    d.poly([[70, 37], [86, 37], [86, 46], [70, 46], [70, 37]]);
    d.poly([[38, 57], [62, 57]]);
  }

  // Neumáticos.
  d.poly([[15, 66], [15, 76], [26, 76], [26, 66]]);
  d.poly([[74, 66], [74, 76], [85, 76], [85, 66]]);
  d.poly([[11, 66], [89, 66]]);
};

/** Vista en planta. Alto ≈ 0.35 · w. */
const vanTop = (ctx: Ctx, x: number, y: number, w: number) => {
  const d = pen(ctx, x, y, w);

  // Contorno visto desde arriba.
  d.begin();
  d.move(9, 2);
  d.to(90, 2);
  d.curve(97, 3, 98, 17);
  d.curve(97, 31, 90, 33);
  d.to(9, 33);
  d.curve(3, 31, 2, 17);
  d.curve(3, 3, 9, 2);
  d.stroke();

  // Parabrisas, techo, puertas y portón.
  d.poly([[14, 4], [23, 9], [23, 26], [14, 31]]);
  d.poly([[29, 3], [29, 32]]);
  d.poly([[56, 3], [56, 32]]);
  d.poly([[82, 4], [82, 31]]);
  d.poly([[33, 11], [52, 11], [52, 24], [33, 24], [33, 11]]);
  d.poly([[60, 11], [78, 11], [78, 24], [60, 24], [60, 11]]);

  // Espejos retrovisores.
  d.poly([[25, 2.5], [27, 0]]);
  d.poly([[25, 32.5], [27, 35]]);
};

/**
 * Las cinco vistas del formulario original (dos laterales, frontal, trasera
 * y planta). Las proporciones son fijas: `w` manda y el alto total resulta
 * aproximadamente 0.88 · w.
 */
const drawVehicleBlueprint = (doc: jsPDF, x: number, y: number, w: number) => {
  const ctx = doc.context2d;
  ctx.save();
  ctx.strokeStyle = '#4B5563';
  ctx.lineWidth = 0.2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const sideW = w * 0.62;         // alto ≈ 0.52 · sideW
  const faceW = w * 0.3;          // alto ≈ 0.78 · faceW
  const faceX = x + w - faceW;
  const faceOffset = (sideW * 0.52 - faceW * 0.78) / 2;
  const rowH = sideW * 0.58;

  vanSide(ctx, x, y, sideW, false);
  vanFace(ctx, faceX, y + faceOffset, faceW, false);

  vanSide(ctx, x, y + rowH, sideW, true);
  vanFace(ctx, faceX, y + rowH + faceOffset, faceW, true);

  const topW = w * 0.78;
  vanTop(ctx, x + (w - topW) / 2, y + rowH * 2 + sideW * 0.05, topW);

  ctx.restore();
};

/* ------------------------------------------------------------------ */
/* Primitivas de formulario                                            */
/* ------------------------------------------------------------------ */

const fieldBox = (doc: jsPDF, x: number, y: number, w: number, h: number, value = '') => {
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h);
  if (value) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(Math.min(10, h * 1.5));
    doc.setTextColor(...INK);
    doc.text(uppercase(value), x + w / 2, y + h / 2 + h * 0.18, { align: 'center', maxWidth: w - 3 });
  }
};

const fieldLine = (doc: jsPDF, label: string, value: string, labelX: number, lineX: number, endX: number, y: number) => {
  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(label, labelX, y);
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(lineX, y + 1.4, endX, y + 1.4);
  if (value) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(uppercase(value), lineX + 2, y, { maxWidth: endX - lineX - 4 });
  }
};

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const drawPage = (doc: jsPDF, request: VehicleHandoverRequest, kind: DocumentKind, logo: string | null) => {
  const isDelivery = kind === 'delivery';
  const title = isDelivery ? 'FICHA DE ENTREGA MÓVIL' : 'FICHA DE RECEPCIÓN MÓVIL';
  const time = isDelivery ? request.startTime : request.endTime;

  /* ---------------- Encabezado ---------------- */
  const headY = 10;
  const headH = 26;
  const logoW = 62;
  const rightX = X0 + logoW;

  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.5);
  doc.rect(X0, headY, CONTENT_W, headH);
  doc.line(rightX, headY, rightX, headY + headH);

  drawLogo(doc, logo, X0, headY, logoW, headH);

  const titleH = 11;
  doc.setLineWidth(0.4);
  doc.line(rightX, headY + titleH, X1, headY + titleH);
  doc.setFont('times', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...BLACK);
  doc.text(`PRO-FIN-05-REG-01 ${title}`, (rightX + X1) / 2, headY + 7.6, { align: 'center' });

  const metaY = headY + titleH;
  const metaH = headH - titleH;
  const metaCells: Array<{ w: number; label: string; value: string; stacked: boolean }> = [
    { w: 40, label: 'HORA', value: time || '', stacked: true },
    { w: 50, label: 'FECHA', value: shortDate(request.date), stacked: true },
    { w: 27, label: 'N° FOLIO', value: '', stacked: false },
    { w: X1 - rightX - 117, label: '', value: request.id, stacked: false },
  ];

  let cx = rightX;
  metaCells.forEach((cell) => {
    doc.setDrawColor(...BLACK);
    doc.setLineWidth(0.4);
    doc.rect(cx, metaY, cell.w, metaH);
    if (cell.stacked) {
      doc.line(cx, metaY + 6, cx + cell.w, metaY + 6);
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...BLACK);
      doc.text(cell.label, cx + cell.w / 2, metaY + 4.3, { align: 'center' });
      if (cell.value) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...INK);
        doc.text(cell.value, cx + cell.w / 2, metaY + 11.6, { align: 'center' });
      }
    } else if (cell.label) {
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...BLACK);
      doc.text(cell.label, cx + cell.w / 2, metaY + metaH / 2 + 1.2, { align: 'center' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...INK);
      doc.text(uppercase(cell.value), cx + cell.w / 2, metaY + metaH / 2 + 1.6, { align: 'center' });
    }
    cx += cell.w;
  });

  /* ---------------- Identificación ---------------- */
  const labelX = X0 + 2;
  const fieldX = 76;
  const fieldEnd = 168;

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text('PPU MOVIL', labelX, 48);
  fieldBox(doc, fieldX, 43.5, 52, 8.5, request.plate);

  doc.setFont('times', 'bold');
  doc.setFontSize(9);
  doc.text('Nuevo', 176, 46);
  doc.text('Usado', 176, 52);
  fieldBox(doc, 188, 42.6, 16, 4.6);
  fieldBox(doc, 188, 48.6, 16, 4.6);

  fieldLine(doc, isDelivery ? 'Nombre de quien retira' : 'Nombre de quien devuelve', request.driverName, labelX, fieldX, fieldEnd, 60);
  fieldLine(doc, 'Cargo', request.cargo, labelX, fieldX, fieldEnd, 66.5);
  fieldLine(doc, 'Gerencia', request.gerencia, labelX, fieldX, fieldEnd, 76);

  /* ---------------- Documentos / implementos ---------------- */
  const listY = 84;
  const rowH = 5.8;
  const itemX = 76;
  const boxX = 132;
  const boxW = 40;

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text('DOCUMENTOS / IMPLEMENTOS', labelX, listY);

  INVENTORY_ITEMS.forEach((item, index) => {
    const y = listY + index * rowH;
    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text(item, itemX, y);
    doc.setDrawColor(...BLACK);
    doc.setLineWidth(0.3);
    doc.rect(boxX, y - 4, boxW, rowH - 1.2);
  });

  /* ---------------- Registro visual / observaciones ---------------- */
  const visualY = listY + INVENTORY_ITEMS.length * rowH + 2;
  const obsX = 96;
  const obsW = X1 - obsX;
  const obsH = 55;

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text('Observaciones', obsX + obsW / 2, visualY - 1, { align: 'center' });

  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.35);
  doc.rect(obsX, visualY + 1.5, obsW, obsH);
  const obsRows = 6;
  doc.setDrawColor(...HAIR);
  doc.setLineWidth(0.2);
  for (let i = 1; i < obsRows; i += 1) {
    doc.line(obsX, visualY + 1.5 + (obsH / obsRows) * i, obsX + obsW, visualY + 1.5 + (obsH / obsRows) * i);
  }

  drawVehicleBlueprint(doc, X0 + 3, visualY + 3, 54);

  /* ---------------- Declaración ---------------- */
  const legalY = visualY + obsH + 9;
  doc.setFont('times', 'normal');
  doc.setFontSize(8.4);
  doc.setTextColor(...INK);

  const paragraphs = isDelivery
    ? [
        'El Usuario se hará cargo del buen uso del equipo y a mantenerlo en buen estado de funcionamiento, tanto dentro como fuera de las dependencias de la empresa.',
        'En Caso de pérdida o daño del equipo, el usuario se hará cargo completamente de su restitución.',
        'El Usuario reconoce expresamente que el equipo recibido es de Redbus Urbano S.A. y se obliga, al término de la vigencia del contrato de restituirlo a la empresa, en el mismo estado en el que fue recibido, habida consideración a su uso y goce legítimo, y al desgaste que ello implica',
      ]
    : [
        'Las partes dejan constancia que el equipo y los implementos detallados en la presente ficha han sido revisados al momento de su devolución a Redbus Urbano S.A.',
        'Toda diferencia, daño, faltante o condición relevante debe quedar registrada en el recuadro de Observaciones.',
        'La recepción conforme de la unidad no limita revisiones técnicas posteriores ni las responsabilidades que correspondan al Usuario conforme a las políticas vigentes de la empresa.',
      ];

  let py = legalY;
  paragraphs.forEach((paragraph) => {
    const lines = doc.splitTextToSize(paragraph, CONTENT_W - 4) as string[];
    doc.text(lines, labelX, py, { lineHeightFactor: 1.35 });
    py += lines.length * 4 + 3.4;
  });

  /* ---------------- Firmas ---------------- */
  const signY = 267;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.line(X0, signY, X0 + 76, signY);
  doc.line(X1 - 76, signY, X1, signY);

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...BLACK);
  doc.text(isDelivery ? 'Firma y RUT Entrega' : 'Firma y RUT Recibe', X0, signY + 4.4);
  doc.text(isDelivery ? 'Firma y RUT Retira' : 'Firma y RUT Entrega', X1, signY + 4.4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...GREY);
  doc.text(`${uppercase(request.driverName)}  ·  ${uppercase(request.driverRut)}`, X1, signY - 1.6, { align: 'right' });
  doc.text(
    `ASISS · Solicitud ${request.id} · ${isDelivery ? 'Entrega' : 'Recepción'} · ${request.date}`,
    X0,
    signY - 1.6,
  );
  doc.setTextColor(...BLACK);
};

/* ------------------------------------------------------------------ */
/* API pública                                                          */
/* ------------------------------------------------------------------ */

const buildPdf = async (requests: VehicleHandoverRequest[], autoPrint = false) => {
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  const logo = await loadOfficialLogo();
  let pageIndex = 0;

  requests.forEach((request) => {
    (['delivery', 'reception'] as DocumentKind[]).forEach((kind) => {
      if (pageIndex > 0) doc.addPage('letter', 'portrait');
      drawPage(doc, request, kind, logo);
      pageIndex += 1;
    });
  });

  if (autoPrint) doc.autoPrint();
  return doc;
};

const openPrintWindow = (doc: jsPDF) => {
  const blobUrl = URL.createObjectURL(doc.output('blob'));
  const printWindow = window.open(blobUrl, '_blank');
  if (!printWindow) {
    URL.revokeObjectURL(blobUrl);
    throw new Error('El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes e inténtalo nuevamente.');
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};

export const downloadVehiclePdf = async (request: VehicleHandoverRequest) => {
  const doc = await buildPdf([request]);
  doc.save(`Entrega_Recepcion_${safeFilename(request.plate)}_${safeFilename(request.id)}.pdf`);
};

export const printVehiclePdf = async (request: VehicleHandoverRequest) => {
  openPrintWindow(await buildPdf([request], true));
};

export const downloadAllVehiclePdfs = async (requests: VehicleHandoverRequest[]) => {
  const date = requests[0]?.date || new Date().toISOString().slice(0, 10);
  const doc = await buildPdf(requests);
  doc.save(`Entregas_Recepciones_${safeFilename(date)}.pdf`);
};

export const printAllVehiclePdfs = async (requests: VehicleHandoverRequest[]) => {
  openPrintWindow(await buildPdf(requests, true));
};
