import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ?
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        : null}
      </div>
      {actions ?
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      : null}
    </div>
  );
}
