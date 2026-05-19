import { Construction } from 'lucide-react';

interface ComingSoonPanelProps {
  sectionLabel?: string;
}

export function ComingSoonPanel({ sectionLabel }: ComingSoonPanelProps) {
  return (
    <div className="glass-card flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
      <Construction className="mb-4 h-10 w-10 text-neon-cyan/70" />
      <h2 className="text-lg font-semibold text-white">Bereich in Vorbereitung</h2>
      {sectionLabel ?
        <p className="mt-1 text-xs text-neon-cyan/80">{sectionLabel}</p>
      : null}
      <p className="mt-3 max-w-md text-sm text-slate-400">
        Diese Funktion wird vorbereitet und ist noch nicht vollständig angebunden.
      </p>
    </div>
  );
}
