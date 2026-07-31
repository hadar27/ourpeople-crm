import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function MiniStat({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "warn" | "danger" | "good";
}) {
  const toneClass =
    tone === "danger"
      ? "text-rose-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "good"
          ? "text-emerald-600"
          : "text-foreground";
  return (
    <div className="bg-surface-muted rounded-lg p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={`text-base font-bold mt-1 truncate ${toneClass}`}>{value}</div>
    </div>
  );
}

export function SectionCard({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-lg font-semibold">{title}</div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-muted-foreground py-12">
      <Inbox className="h-8 w-8 opacity-40" />
      <div className="font-medium">{text}</div>
      {hint && <div className="text-xs">{hint}</div>}
    </div>
  );
}

export type TimelineItem = {
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  body?: ReactNode;
  date: string;
  tone?: "brand" | "good" | "warn" | "danger" | "muted";
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  const dot: Record<string, string> = {
    brand: "bg-brand",
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    danger: "bg-rose-500",
    muted: "bg-muted-foreground/40",
  };
  if (items.length === 0) return <EmptyState text="אין רישומים להצגה" />;
  return (
    <ol className="relative border-r-2 border-border pr-5 space-y-5">
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span
            className={`absolute right-[-27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-card ${dot[it.tone ?? "brand"]}`}
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="font-medium text-sm">{it.title}</div>
            <div className="text-xs text-muted-foreground">{it.date}</div>
          </div>
          {it.meta && <div className="text-xs text-muted-foreground mt-0.5">{it.meta}</div>}
          {it.body && <div className="text-sm mt-2 leading-relaxed">{it.body}</div>}
        </li>
      ))}
    </ol>
  );
}
