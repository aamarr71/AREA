import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/area-utils';
import { TodoText } from '../lib/area-utils';

type FieldBase = {
  label: string;
  textarea?: boolean;
  className?: string;
};

export function FloatingInput({ label, className, ...props }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn('group relative block pt-5', className)}>
      <input
        className="peer block w-full border-0 border-b border-[var(--area-line-strong)] bg-transparent px-0 pb-3 pt-2 text-[15px] outline-none transition-colors placeholder:text-transparent focus:border-[var(--area-ink)]"
        placeholder={label}
        {...props}
      />
      <span className="pointer-events-none absolute left-0 top-6 text-[15px] text-[var(--area-muted)] transition-all duration-150 peer-focus:top-0 peer-focus:font-mono peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.1em] peer-focus:text-[var(--area-ink)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:font-mono peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.1em]">
        <TodoText value={label} />
      </span>
    </label>
  );
}

export function FloatingTextarea({ label, className, ...props }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={cn('group relative block pt-5', className)}>
      <textarea
        rows={4}
        className="peer block w-full resize-none border-0 border-b border-[var(--area-line-strong)] bg-transparent px-0 pb-3 pt-2 text-[15px] outline-none transition-colors placeholder:text-transparent focus:border-[var(--area-ink)]"
        placeholder={label}
        {...props}
      />
      <span className="pointer-events-none absolute left-0 top-6 text-[15px] text-[var(--area-muted)] transition-all duration-150 peer-focus:top-0 peer-focus:font-mono peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.1em] peer-focus:text-[var(--area-ink)] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:font-mono peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[0.1em]">
        <TodoText value={label} />
      </span>
    </label>
  );
}
