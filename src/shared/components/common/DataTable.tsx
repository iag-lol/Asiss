import { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number | boolean | null | undefined;
}

interface Props<T> {
  columns: TableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
}

export const DataTable = <T,>({ columns, rows, emptyMessage = 'Sin resultados' }: Props<T>) => {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
          <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
        <p className="mt-1 text-xs text-slate-400">No hay datos para mostrar en este momento</p>
      </div>
    );
  }

  return (
    <div className="table-container overflow-x-auto">
      <table className="table">
        <thead className="table-header">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="table-header-cell">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table-body">
          {rows.map((row, idx) => (
            <tr key={idx} className="table-row">
              {columns.map((col) => (
                <td key={col.key} className="table-cell">
                  {col.render ? col.render(row) : (row as unknown as Record<string, unknown>)[col.key] as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
