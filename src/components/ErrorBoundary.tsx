import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  /** Kompakte Darstellung innerhalb des Control-Center-Layouts. */
  compact?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function ErrorFallback({
  compact,
  title,
  message,
  detail,
  onReload,
}: {
  compact?: boolean;
  title: string;
  message: string;
  detail: string;
  onReload: () => void;
}) {
  const wrapClass = compact ?
    'glass-card m-4 p-6'
  : 'flex min-h-screen items-center justify-center bg-navy-950 p-6';

  return (
    <div className={wrapClass}>
      <div className="mx-auto max-w-lg rounded-xl border border-neon-red/30 bg-navy-900/90 p-6 text-center shadow-lg">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-xs text-slate-500">Technische Details</summary>
          <pre className="mt-2 max-h-32 overflow-auto rounded bg-navy-950 p-2 text-[10px] text-slate-500">
            {detail}
          </pre>
        </details>
        <button
          type="button"
          onClick={onReload}
          className="mt-6 rounded-lg bg-neon-cyan/20 px-4 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30"
        >
          Seite neu laden
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const title =
      this.props.title ?? 'RabbitStation Control Center konnte nicht geladen werden';

    return (
      <ErrorFallback
        compact={this.props.compact}
        title={title}
        message="Beim Laden der Control-Center-Daten ist ein Fehler aufgetreten."
        detail={error.message}
        onReload={() => window.location.reload()}
      />
    );
  }
}
