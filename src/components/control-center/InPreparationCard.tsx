import { Construction } from 'lucide-react';

interface InPreparationCardProps {
  title: string;
  description: string;
  plannedItems?: string[];
  dataSource?: string;
  statusLabel?: string;
}

export function InPreparationCard({
  title,
  description,
  plannedItems,
  dataSource,
  statusLabel = 'noch nicht angebunden',
}: InPreparationCardProps) {
  return (
    <div className="glass-card flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
      <Construction className="mb-4 h-10 w-10 text-neon-cyan/70" />
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-lg text-sm text-slate-400">{description}</p>
      <p className="mt-3 text-xs text-neon-orange/90">Status: {statusLabel}</p>
      {plannedItems && plannedItems.length > 0 ?
        <div className="mt-4 w-full max-w-md text-left">
          <p className="text-xs font-medium text-slate-400">Geplant:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-500">
            {plannedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      : null}
      {dataSource ?
        <p className="mt-4 text-[10px] text-slate-600">Datenquelle: {dataSource}</p>
      : null}
    </div>
  );
}
