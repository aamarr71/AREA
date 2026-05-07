import type { ReactNode } from 'react';

export type Severity = 'rot' | 'amber' | 'teal' | 'online' | 'degraded' | 'offline' | string;

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function statusClass(status?: Severity): string {
  if (status === 'rot' || status === 'offline') return 'status-red';
  if (status === 'amber' || status === 'degraded') return 'status-amber';
  if (status === 'teal' || status === 'online') return 'status-teal';
  return '';
}

export function isPlaceholder(value: unknown): value is string {
  return typeof value === 'string' && (/__TODO[^_]*__|__TODO_[A-Z0-9_]+__|__live__/i.test(value));
}

export function safeHref(href?: string): string {
  if (!href || isPlaceholder(href)) return '#todo';
  return href;
}

export function TodoText({ value, className }: { value: string | number | null | undefined; className?: string }): ReactNode {
  if (value === null || value === undefined) return null;
  const text = String(value);
  const tokenPattern = /(__TODO(?:_[A-Z0-9_]+)?__|__live__)/gi;
  const pieces = text.split(tokenPattern).filter(Boolean);

  if (!pieces.some((piece) => tokenPattern.test(piece))) {
    return <>{text}</>;
  }

  return (
    <span className={className}>
      {pieces.map((piece, index) => {
        tokenPattern.lastIndex = 0;
        if (tokenPattern.test(piece)) {
          const label = piece.toLowerCase() === '__live__' ? 'LIVE-DATEN' : piece.replace(/_/g, ' ').replace(/TODO/i, 'TODO');
          return (
            <span className="todo-chip" key={`${piece}-${index}`}>
              {label.trim()}
            </span>
          );
        }
        return <span key={`${piece}-${index}`}>{piece}</span>;
      })}
    </span>
  );
}

export function issueCopy(count: number): string {
  return count === 1 ? '1' : String(count);
}

export function objectSummaryFromDemo(demo: Record<string, string>): string {
  return `${demo.size_value} · ${demo.rooms_value} Zi · ${demo.price_value}`;
}

export function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
