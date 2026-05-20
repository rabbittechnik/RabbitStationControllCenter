interface ApiOfflineNoticeProps {
  message?: string;
  className?: string;
}

export const API_OFFLINE_DATA_MSG =
  'Haupt-App API offline – Daten können aktuell nicht geladen werden.';

export const API_OFFLINE_LOGS_MSG =
  'Haupt-App-Logs können nicht geladen werden, weil die Server/API nicht erreichbar ist.';

export function ApiOfflineNotice({ message = API_OFFLINE_DATA_MSG, className = '' }: ApiOfflineNoticeProps) {
  return (
    <div
      className={`rounded-lg border border-neon-orange/40 bg-neon-orange/10 px-4 py-3 text-sm text-orange-100 ${className}`}
    >
      {message}
    </div>
  );
}
