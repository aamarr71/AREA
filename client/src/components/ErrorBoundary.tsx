import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--area-paper)] p-8">
          <div className="flex w-full max-w-2xl flex-col items-center rounded-[8px] border border-[var(--area-line)] bg-[var(--area-surface)] p-8 shadow-hair">
            <AlertTriangle
              size={48}
              className="mb-6 flex-shrink-0 text-[var(--area-red)]"
            />

            <h2 className="mb-4 font-display text-[32px] leading-tight">Ein Fehler ist aufgetreten.</h2>

            <div className="mb-6 w-full overflow-auto rounded-[6px] border border-[var(--area-line)] bg-[rgba(15,20,25,0.03)] p-4">
              <pre className="whitespace-break-spaces font-mono text-[12px] text-[var(--area-muted)]">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 rounded-[6px] border border-[var(--area-ink)] px-4 py-2 font-mono text-[12px] uppercase tracking-[0.08em]",
                "bg-[var(--area-ink)] text-[var(--area-paper)]",
                "cursor-pointer hover:opacity-90"
              )}
            >
              <RotateCcw size={16} />
              Neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
