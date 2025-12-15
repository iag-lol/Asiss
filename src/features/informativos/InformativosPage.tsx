import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../shared/components/common/PageHeader';
import { FiltersBar } from '../../shared/components/common/FiltersBar';
import { DataTable, TableColumn } from '../../shared/components/common/DataTable';
import { EmptyState } from '../../shared/components/common/EmptyState';
import { LoadingState } from '../../shared/components/common/LoadingState';
import { ErrorState } from '../../shared/components/common/ErrorState';
import { ExportMenu } from '../../shared/components/common/ExportMenu';
import { useTerminalStore } from '../../shared/state/terminalStore';
import { informativosAdapter } from './service';
import { InformativoFilters, InformativoViewModel } from './types';
import { exportToXlsx } from '../../shared/utils/exportToXlsx';
import { displayTerminal, terminalOptions } from '../../shared/utils/terminal';
import { emailService } from '../../shared/services/emailService';
import { EmailAudience } from '../../shared/types/email';
import { formatDate } from '../../shared/utils/dates';
import { TerminalCode } from '../../shared/types/terminal';

export const InformativosPage = () => {
  const terminalContext = useTerminalStore((state) => state.context);
  const setTerminalContext = useTerminalStore((state) => state.setContext);
  const [filters, setFilters] = useState<InformativoFilters>({ alcance: 'todos' });

  const [audience, setAudience] = useState<EmailAudience>('todos');
  const [emailTerminal, setEmailTerminal] = useState<TerminalCode>('EL_ROBLE');
  const [manualRecipients, setManualRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const query = useQuery({
    queryKey: ['informativos', terminalContext, filters],
    queryFn: () => informativosAdapter.list({ terminalContext, filters, scope: 'view' }),
  });

  const columns: TableColumn<InformativoViewModel>[] = useMemo(
    () => [
      { key: 'titulo', header: 'Título' },
      { key: 'enviadoPor', header: 'Enviado por' },
      { key: 'alcance', header: 'Alcance', render: (row) => <span className="badge">{row.alcance}</span>, value: (row) => row.alcance },
      { key: 'fecha', header: 'Fecha', render: (row) => formatDate(row.fecha), value: (row) => formatDate(row.fecha) },
      { key: 'terminal', header: 'Terminal', render: (row) => displayTerminal(row.terminal), value: (row) => displayTerminal(row.terminal) },
    ],
    [],
  );

  const exportColumns = columns.map((col) => ({ key: col.key, header: col.header, value: (row: InformativoViewModel) => (col.value ? col.value(row) : (row as unknown as Record<string, unknown>)[col.key]) }));

  const handleExportView = () => {
    if (!query.data) return;
    exportToXlsx({ filename: 'informativos_vista', sheetName: 'Informativos', rows: query.data, columns: exportColumns });
  };

  const handleExportAll = async () => {
    const rows = await informativosAdapter.list({ terminalContext, scope: 'all' });
    exportToXlsx({ filename: 'informativos_completo', sheetName: 'Informativos', rows, columns: exportColumns });
  };

  const handleSendEmail = async () => {
    setErrorMessage('');
    setSending(true);
    try {
      const response = await emailService.sendEmail({
        audience,
        terminalCodes: audience === 'por_terminal' ? [emailTerminal] : undefined,
        manualRecipients: audience === 'manual' ? manualRecipients.split(',').map((item) => item.trim()).filter(Boolean) : undefined,
        subject,
        body,
      });
      setSentMessage(`Correo enviado (${response.messageId})`);
      setSubject('');
      setBody('');
      setManualRecipients('');
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Informativos"
        description="Comunicaciones internas con opciones de envío por terminal."
        actions={
          <div className="flex gap-2">
            <button className="btn btn-primary">Nuevo informativo</button>
            <ExportMenu onExportView={handleExportView} onExportAll={handleExportAll} />
          </div>
        }
      />

      <FiltersBar terminalContext={terminalContext} onTerminalChange={setTerminalContext}>
        <div className="flex flex-col gap-1">
          <label className="label">Alcance</label>
          <select
            className="input"
            value={filters.alcance}
            onChange={(e) => setFilters({ alcance: e.target.value as InformativoFilters['alcance'] })}
          >
            <option value="todos">Todos</option>
            <option value="terminal">Por terminal</option>
            <option value="segmentado">Segmentado</option>
          </select>
        </div>
      </FiltersBar>

      {query.isLoading && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {!query.isLoading && !query.isError && (
        <>
          {!query.data?.length && <EmptyState description="No hay informativos con los filtros actuales." />}
          {query.data && query.data.length > 0 && <DataTable columns={columns} rows={query.data} />}
        </>
      )}

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-900">Enviar correo interno</p>
            <p className="text-sm text-slate-600">Módulo preparado para conectar a Edge Function.</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            {sentMessage && <span className="badge">{sentMessage}</span>}
            {errorMessage && <span className="text-xs font-semibold text-red-600">{errorMessage}</span>}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="label">Destinatarios</label>
            <select className="input" value={audience} onChange={(e) => setAudience(e.target.value as EmailAudience)}>
              <option value="todos">Todos</option>
              <option value="por_terminal">Por terminal</option>
              <option value="manual">Lista manual</option>
            </select>
          </div>
          {audience === 'por_terminal' && (
            <div className="space-y-1">
              <label className="label">Terminal objetivo</label>
              <select className="input" value={emailTerminal} onChange={(e) => setEmailTerminal(e.target.value as TerminalCode)}>
                {terminalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {audience === 'manual' && (
            <div className="space-y-1 md:col-span-2">
              <label className="label">Correos (separados por coma)</label>
              <input
                className="input"
                value={manualRecipients}
                onChange={(e) => setManualRecipients(e.target.value)}
                placeholder="correo1@dominio.com, correo2@dominio.com"
              />
            </div>
          )}
          <div className="md:col-span-3 grid gap-3">
            <div className="space-y-1">
              <label className="label">Asunto</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="label">Mensaje</label>
              <textarea
                className="input min-h-[120px]"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Contenido del correo"
              />
            </div>
            <div className="flex justify-end">
              <button className="btn btn-primary" onClick={handleSendEmail} disabled={sending || !subject || !body}>
                {sending ? 'Enviando...' : 'Enviar (mock)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
