import jsPDF from 'jspdf';
import { VehicleHandoverRequest } from './types';

type DocumentKind = 'delivery' | 'reception';

const PAGE_WIDTH = 215.9;
const MARGIN = 10;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
const NAVY: [number, number, number] = [20, 38, 63];
const RED: [number, number, number] = [226, 30, 50];
const SLATE: [number, number, number] = [71, 85, 105];
const LIGHT: [number, number, number] = [241, 245, 249];
const BORDER: [number, number, number] = [100, 116, 139];

const INVENTORY_ITEMS = [
  'Padrón vehicular',
  'Permiso de circulación',
  'SOAP',
  'Certificado RT',
  'Certificado de gases',
  'TAG',
  'Tarjeta combustible',
  'Rueda de repuesto',
  'Gata y llave de ruedas',
  'Botiquín',
  'Triángulo de seguridad',
  'Antena',
  'Extintor',
  'Kilometraje',
];

const uppercase = (value: string) => value.trim().toLocaleUpperCase('es-CL');

const shortDate = (value: string) => {
  const [day, month, year] = value.split('/');
  return day && month && year ? `${day}-${month}-${year.slice(-2)}` : value;
};

const safeFilename = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_');

const drawBrand = (doc: jsPDF, x: number, y: number) => {
  doc.setDrawColor(...RED);
  doc.setFillColor(...RED);
  doc.circle(x + 6, y + 7, 5.2, 'S');
  doc.circle(x + 7.6, y + 5.1, 1.2, 'F');
  doc.setLineWidth(1.1);
  doc.line(x + 3.5, y + 9.5, x + 8.8, y + 3.5);
  doc.line(x + 6.5, y + 7.2, x + 10.8, y + 9.4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...RED);
  doc.text('transdev', x + 13, y + 9.8);
  doc.setTextColor(0, 0, 0);
};

const drawCheck = (doc: jsPDF, x: number, y: number, checked: boolean) => {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  doc.rect(x, y, 11, 4.6);
  if (checked) {
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.7);
    doc.line(x + 3.2, y + 2.4, x + 5.1, y + 3.5);
    doc.line(x + 5.1, y + 3.5, x + 8.3, y + 1.2);
  }
};

const drawValueLine = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth: number,
  width: number,
) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(...NAVY);
  doc.text(label, x, y + 3.6);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.22);
  doc.line(x + labelWidth, y + 4.3, x + width, y + 4.3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(uppercase(value), x + labelWidth + 1.5, y + 3.4, { maxWidth: width - labelWidth - 2 });
};

const drawVehicleDiagram = (doc: jsPDF, x: number, y: number) => {
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);

  // Vista lateral.
  doc.roundedRect(x + 2, y + 5, 47, 16, 2, 2);
  doc.line(x + 12, y + 5, x + 17, y + 0.8);
  doc.line(x + 17, y + 0.8, x + 37, y + 0.8);
  doc.line(x + 37, y + 0.8, x + 44, y + 5);
  doc.line(x + 17, y + 1.6, x + 17, y + 12);
  doc.line(x + 29, y + 1.6, x + 29, y + 19);
  doc.line(x + 38, y + 2, x + 38, y + 19);
  doc.line(x + 2, y + 14.5, x + 49, y + 14.5);
  doc.circle(x + 12, y + 20, 3.2);
  doc.circle(x + 40, y + 20, 3.2);

  // Vista frontal.
  doc.roundedRect(x + 55, y + 4, 19, 18, 2, 2);
  doc.line(x + 58, y + 4, x + 61, y + 0.8);
  doc.line(x + 61, y + 0.8, x + 68, y + 0.8);
  doc.line(x + 68, y + 0.8, x + 71, y + 4);
  doc.line(x + 58, y + 11, x + 71, y + 11);
  doc.line(x + 61, y + 14.5, x + 68, y + 14.5);
  doc.circle(x + 59, y + 20, 1.4);
  doc.circle(x + 71, y + 20, 1.4);

  // Vista superior.
  const topY = y + 29;
  doc.roundedRect(x + 9, topY, 46, 17, 3, 3);
  doc.line(x + 18, topY + 1, x + 18, topY + 16);
  doc.line(x + 44, topY + 1, x + 44, topY + 16);
  doc.line(x + 25, topY + 1, x + 25, topY + 16);
  doc.line(x + 36, topY + 1, x + 36, topY + 16);
  doc.line(x + 11, topY + 5, x + 53, topY + 5);
  doc.line(x + 11, topY + 12, x + 53, topY + 12);
};

const drawPage = (doc: jsPDF, request: VehicleHandoverRequest, kind: DocumentKind) => {
  const isDelivery = kind === 'delivery';
  const title = isDelivery ? 'FICHA DE ENTREGA MÓVIL' : 'FICHA DE RECEPCIÓN MÓVIL';
  const time = isDelivery ? request.startTime : request.endTime;

  doc.setLineWidth(0.3);
  doc.setDrawColor(...NAVY);
  doc.rect(MARGIN, 9, CONTENT_WIDTH, 24);
  doc.line(65, 9, 65, 33);
  drawBrand(doc, 15, 12);

  doc.setFillColor(...NAVY);
  doc.rect(65, 9, CONTENT_WIDTH - 55, 11, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`PRO-FIN-05-REG-01  ${title}`, 135.5, 16, { align: 'center' });

  const metaX = 65;
  const metaY = 20;
  const metaWidths = [42, 56, 42];
  const metaLabels = ['HORA', 'FECHA', 'N° FOLIO'];
  const metaValues = [time, shortDate(request.date), request.id];
  let currentX = metaX;
  metaWidths.forEach((width, index) => {
    doc.setDrawColor(...NAVY);
    doc.rect(currentX, metaY, width, 13);
    doc.setFillColor(...LIGHT);
    doc.rect(currentX, metaY, width, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...SLATE);
    doc.text(metaLabels[index], currentX + (width / 2), metaY + 3.6, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setTextColor(...NAVY);
    doc.text(metaValues[index], currentX + (width / 2), metaY + 10.2, { align: 'center' });
    currentX += width;
  });

  doc.setFillColor(...RED);
  doc.rect(MARGIN, 36, 2, 25, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...NAVY);
  doc.text('ANTECEDENTES DEL VEHÍCULO Y RESPONSABLE', MARGIN + 5, 40);

  drawValueLine(doc, 'PPU MÓVIL', request.plate, MARGIN + 5, 43, 29, 88);
  drawValueLine(doc, 'MODELO', request.vehicleModel, MARGIN + 98, 43, 19, 97);
  drawValueLine(
    doc,
    isDelivery ? 'NOMBRE DE QUIEN RETIRA' : 'NOMBRE DE QUIEN DEVUELVE',
    request.driverName,
    MARGIN + 5,
    49,
    43,
    180,
  );
  drawValueLine(doc, 'CARGO', request.cargo, MARGIN + 5, 55, 18, 88);
  drawValueLine(doc, 'GERENCIA', request.gerencia, MARGIN + 98, 55, 22, 75);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text('NUEVO', 183, 41.5);
  drawCheck(doc, 194, 38.2, true);
  doc.text('USADO', 183, 47.8);
  drawCheck(doc, 194, 44.5, false);

  const sectionY = 66;
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, sectionY, CONTENT_WIDTH, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('DOCUMENTOS / IMPLEMENTOS', MARGIN + 3, sectionY + 4.1);
  doc.setFontSize(6.4);
  doc.text(isDelivery ? 'ENTREGADO' : 'RECIBIDO', 125, sectionY + 4.1, { align: 'center' });
  doc.text('ESTADO / DETALLE', 167, sectionY + 4.1, { align: 'center' });

  let itemY = sectionY + 6;
  INVENTORY_ITEMS.forEach((item, index) => {
    const rowHeight = 3.85;
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN, itemY, CONTENT_WIDTH, rowHeight, 'F');
    }
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.15);
    doc.line(MARGIN, itemY + rowHeight, MARGIN + CONTENT_WIDTH, itemY + rowHeight);
    doc.line(111, itemY, 111, itemY + rowHeight);
    doc.line(139, itemY, 139, itemY + rowHeight);
    doc.setFont('helvetica', index === INVENTORY_ITEMS.length - 1 ? 'bold' : 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text(item, MARGIN + 3, itemY + 2.7);
    itemY += rowHeight;
  });
  doc.setDrawColor(...BORDER);
  doc.rect(MARGIN, sectionY + 6, CONTENT_WIDTH, INVENTORY_ITEMS.length * 3.85);

  const inspectionY = 130;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text('REGISTRO VISUAL DEL VEHÍCULO', MARGIN + 2, inspectionY);
  doc.text('OBSERVACIONES', 100, inspectionY);

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  doc.rect(MARGIN, inspectionY + 3, 82, 55);
  drawVehicleDiagram(doc, MARGIN + 3, inspectionY + 7);
  doc.rect(97, inspectionY + 3, 109, 55);
  for (let line = 1; line < 8; line += 1) {
    doc.setDrawColor(203, 213, 225);
    doc.line(97, inspectionY + 3 + (line * 6.875), 206, inspectionY + 3 + (line * 6.875));
  }

  const responsibilityY = 194;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(MARGIN, responsibilityY, CONTENT_WIDTH, 30, 1.5, 1.5, 'F');
  doc.setFillColor(...RED);
  doc.rect(MARGIN, responsibilityY, 2, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...NAVY);
  doc.text(isDelivery ? 'DECLARACIÓN DE ENTREGA Y RESPONSABILIDAD' : 'DECLARACIÓN DE RECEPCIÓN', MARGIN + 5, responsibilityY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.7);
  doc.setTextColor(30, 41, 59);
  const declaration = isDelivery
    ? 'El usuario declara recibir el vehículo nuevo y los elementos detallados en esta ficha, y se compromete a mantenerlos en buen estado de funcionamiento y limpieza, dentro y fuera de las dependencias de la empresa. En caso de pérdida o daño imputable a su uso, deberá informar de inmediato y responder conforme a las políticas vigentes. Al término de la asignación, deberá restituir el vehículo y sus accesorios en las mismas condiciones de recepción, salvo el desgaste razonable por uso.'
    : 'Las partes declaran que el vehículo y los elementos detallados en esta ficha han sido revisados al momento de su devolución. Toda diferencia, daño, faltante o condición relevante debe quedar registrada en Observaciones. La recepción de esta unidad no limita revisiones técnicas posteriores ni las responsabilidades que correspondan conforme a las políticas vigentes.';
  const declarationLines = doc.splitTextToSize(declaration, CONTENT_WIDTH - 10) as string[];
  doc.text(declarationLines, MARGIN + 5, responsibilityY + 10, { lineHeightFactor: 1.3 });

  const signatureY = 250;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.45);
  doc.line(MARGIN, signatureY, 91, signatureY);
  doc.line(125, signatureY, 206, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...NAVY);
  doc.text(isDelivery ? 'FIRMA Y RUT ENTREGA' : 'FIRMA Y RUT RECIBE', 50.5, signatureY + 4, { align: 'center' });
  doc.text(isDelivery ? 'FIRMA Y RUT RETIRA' : 'FIRMA Y RUT ENTREGA', 165.5, signatureY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(...SLATE);
  doc.text(`Responsable: ${uppercase(request.driverName)} · RUT: ${uppercase(request.driverRut)}`, 165.5, signatureY + 8, { align: 'center' });

  doc.setDrawColor(...RED);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 268, 206, 268);
  doc.setFontSize(5.8);
  doc.setTextColor(...SLATE);
  doc.text(`Documento generado por ASISS · Solicitud ${request.id} · ${kind === 'delivery' ? 'Entrega' : 'Recepción'}`, MARGIN, 272);
  doc.text(`${kind === 'delivery' ? '1' : '2'} de 2`, 206, 272, { align: 'right' });
};

const buildPdf = (requests: VehicleHandoverRequest[], autoPrint = false) => {
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  let pageIndex = 0;

  requests.forEach((request) => {
    (['delivery', 'reception'] as DocumentKind[]).forEach((kind) => {
      if (pageIndex > 0) doc.addPage('letter', 'portrait');
      drawPage(doc, request, kind);
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

export const downloadVehiclePdf = (request: VehicleHandoverRequest) => {
  buildPdf([request]).save(`Entrega_Recepcion_${safeFilename(request.plate)}_${safeFilename(request.id)}.pdf`);
};

export const printVehiclePdf = (request: VehicleHandoverRequest) => {
  openPrintWindow(buildPdf([request], true));
};

export const downloadAllVehiclePdfs = (requests: VehicleHandoverRequest[]) => {
  const date = requests[0]?.date || new Date().toISOString().slice(0, 10);
  buildPdf(requests).save(`Entregas_Recepciones_${safeFilename(date)}.pdf`);
};

export const printAllVehiclePdfs = (requests: VehicleHandoverRequest[]) => {
  openPrintWindow(buildPdf(requests, true));
};
