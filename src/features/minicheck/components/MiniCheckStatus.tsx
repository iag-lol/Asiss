import { ReactNode } from 'react';
import { NullableBoolean } from '../types';

export type StatusTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

interface StatusPillProps {
  children: ReactNode;
  tone?: StatusTone;
}

export const StatusPill = ({ children, tone = 'neutral' }: StatusPillProps) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${TONE_CLASSES[tone]}`}
  >
    {children}
  </span>
);

interface BooleanStatusProps {
  value: NullableBoolean | undefined;
  trueLabel?: string;
  falseLabel?: string;
  trueTone?: StatusTone;
  falseTone?: StatusTone;
}

export const BooleanStatus = ({
  value,
  trueLabel = 'OK',
  falseLabel = 'Falla',
  trueTone = 'success',
  falseTone = 'danger',
}: BooleanStatusProps) => {
  if (value === null || value === undefined) {
    return <StatusPill>Sin dato</StatusPill>;
  }

  return (
    <StatusPill tone={value ? trueTone : falseTone}>
      {value ? trueLabel : falseLabel}
    </StatusPill>
  );
};
