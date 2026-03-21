import type {
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export function AdminPageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em]">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{description}</p>
    </div>
  );
}

export function AdminPanel({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={cn("surface-panel rounded-[1.5rem] p-6", className)}>
      {children}
    </section>
  );
}

export function AdminField({
  label,
  hint,
  children,
}: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent",
        props.className,
      )}
    />
  );
}

export function AdminTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent",
        props.className,
      )}
    />
  );
}

export function AdminSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "rounded-2xl border border-border bg-white/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent",
        props.className,
      )}
    />
  );
}

export function AdminCheckbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-foreground">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border text-accent"
      />
      <span>{label}</span>
    </label>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const classes =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-200 text-slate-700";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em]",
        classes,
      )}
    >
      {children}
    </span>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
}: PropsWithChildren<{ variant?: "primary" | "secondary" | "danger" }>) {
  const styles =
    variant === "secondary"
      ? "border border-border-strong bg-white/60 text-foreground hover:bg-white"
      : variant === "danger"
        ? "bg-red-600 text-white hover:bg-red-700"
        : "bg-surface-dark text-white hover:bg-surface-dark/92";

  return (
    <button
      type="submit"
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition",
        styles,
      )}
    >
      {children}
    </button>
  );
}
