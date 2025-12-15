import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  key: string;
  header: string;
  value?: (row: T) => string | number | boolean | null | undefined | unknown;
}

export interface ExportToXlsxInput<T> {
  filename: string;
  sheetName: string;
  rows: T[];
  columns: ExportColumn<T>[];
}

export const exportToXlsx = <T>({ filename, sheetName, rows, columns }: ExportToXlsxInput<T>): void => {
  const effectiveFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const headerRow = columns.map((col) => col.header);
  const dataRows = rows.map((row) =>
    columns.map((col) => {
      const value = col.value ? col.value(row) : (row as Record<string, unknown>)[col.key];
      return value ?? '';
    }),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, effectiveFilename);
};
