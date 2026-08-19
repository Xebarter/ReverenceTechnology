import type { ReactNode } from 'react';

const tones: Record<string, string> = {
  submitted: 'border-rule bg-paper text-muted',
  in_review: 'border-gold/50 bg-paper text-ink',
  active: 'border-ink/15 bg-ink/[0.06] text-ink',
  paused: 'border-rule bg-paper-2 text-muted',
  completed: 'border-ink bg-ink text-paper',
  cancelled: 'border-red-200 bg-red-50 text-red-800',
  requested: 'border-gold/50 bg-paper text-ink',
  paid: 'border-ink/15 bg-ink/[0.06] text-ink',
  processing: 'border-gold/50 bg-paper text-ink',
  pending: 'border-rule bg-paper text-muted',
  new: 'border-rule bg-paper text-muted',
  reviewing: 'border-gold/50 bg-paper text-ink',
  shortlisted: 'border-ink/15 bg-ink/[0.06] text-ink',
  rejected: 'border-red-200 bg-red-50 text-red-800',
  hired: 'border-ink bg-ink text-paper',
  confirmed: 'border-ink/15 bg-ink/[0.06] text-ink',
  shipped: 'border-gold/50 bg-paper text-ink',
  delivered: 'border-ink bg-ink text-paper',
  unpaid: 'border-rule bg-paper text-muted',
};

function formatLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export default function StatusBadge({
  status,
  className = '',
}: {
  status: string;
  className?: string;
}) {
  const key = status.toLowerCase().replace(/\s+/g, '_');
  const tone = tones[key] || 'border-rule bg-surface text-ink';

  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] ${tone} ${className}`}
    >
      {formatLabel(status)}
    </span>
  );
}

export function AccountPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
        )}
        <h1 className="mt-1 font-serif text-2xl tracking-tight text-ink-deep sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">{description}</p>}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
