import { ReactNode } from 'react';
import { TerminalContext } from '../../types/terminal';
import { TerminalSelector } from './TerminalSelector';

interface Props {
  terminalContext: TerminalContext;
  onTerminalChange: (context: TerminalContext) => void;
  children?: ReactNode;
}

export const FiltersBar = ({ terminalContext, onTerminalChange, children }: Props) => (
  <div className="card p-4 mb-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex-shrink-0">
        <TerminalSelector value={terminalContext} onChange={onTerminalChange} />
      </div>
      {children && (
        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4 lg:border-0 lg:pt-0">
          {children}
        </div>
      )}
    </div>
  </div>
);
