import { ModalShell } from './ModalShell';

interface PrepActionModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
}

export function PrepActionModal({ open, onClose, featureName }: PrepActionModalProps) {
  return (
    <ModalShell open={open} onClose={onClose} title="Funktion wird vorbereitet">
      <p className="text-sm text-slate-400">
        „{featureName}“ ist im Control Center vorgesehen und wird mit den nächsten API-Erweiterungen
        der Haupt-App verfügbar.
      </p>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/20"
        >
          Schließen
        </button>
      </div>
    </ModalShell>
  );
}
