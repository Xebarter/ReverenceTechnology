import { Check } from 'lucide-react';
import type { ClientProjectStatus } from '../../lib/types';
import { PROJECT_STAGES, stageIndex } from '../../lib/projectProgress';

export function PaymentMeter({ percent, className = '' }: { percent: number; className?: string }) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-paper-2 ${className}`}>
      <div
        className="h-full rounded-full bg-ink transition-[width] duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function StageTrack({ status }: { status: ClientProjectStatus }) {
  if (status === 'cancelled') {
    return <p className="text-sm leading-relaxed text-muted">This project was cancelled.</p>;
  }

  const index = stageIndex(status);

  return (
    <ol className="grid grid-cols-4 gap-2 sm:gap-3">
      {PROJECT_STAGES.map((stage, i) => {
        const done = i < index;
        const current = i === index;
        const reached = done || current;
        return (
          <li key={stage.id} className="min-w-0">
            <div className="relative flex items-center">
              <span
                className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-semibold transition-colors duration-300 ${
                  reached ? 'border-ink bg-ink text-paper' : 'border-rule bg-surface text-muted'
                }`}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : i + 1}
              </span>
              {i < PROJECT_STAGES.length - 1 && (
                <span
                  className={`absolute left-7 right-[-0.5rem] top-1/2 h-px -translate-y-1/2 transition-colors duration-500 sm:right-[-0.75rem] ${
                    i < index ? 'bg-ink' : 'bg-rule'
                  }`}
                />
              )}
            </div>
            <div className={`mt-2 text-xs font-medium sm:text-sm ${reached ? 'text-ink-deep' : 'text-muted'}`}>
              {stage.label}
            </div>
            <div className="hidden text-xs text-muted sm:block">{stage.detail}</div>
          </li>
        );
      })}
    </ol>
  );
}
