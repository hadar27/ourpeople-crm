import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
  tone?: "default" | "brand" | "soft";
}) {
  const toneClass =
    tone === "brand"
      ? "bg-brand-gradient text-brand-foreground border-transparent"
      : tone === "soft"
        ? "bg-soft-gradient"
        : "bg-card";
  return (
    <div className={`rounded-xl border border-border p-5 shadow-soft ${toneClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-xs ${tone === "brand" ? "text-white/80" : "text-muted-foreground"}`}>{label}</div>
          <div className="mt-2 text-2xl font-bold">{value}</div>
          {delta && (
            <div className={`mt-1 text-xs ${tone === "brand" ? "text-white/80" : "text-muted-foreground"}`}>{delta}</div>
          )}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${tone === "brand" ? "bg-white/15" : "bg-secondary text-brand-deep"}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    "פעיל": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "פעילה": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "מאושר": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "שולם": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "הופק": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "הסתיים": "bg-secondary text-brand-deep border-border",
    "לא נדרש תשלום": "bg-secondary text-brand-deep border-border",
    "ממתין": "bg-amber-50 text-amber-700 border-amber-200",
    "ממתין לתשלום": "bg-amber-50 text-amber-700 border-amber-200",
    "ממתין לאישור": "bg-amber-50 text-amber-700 border-amber-200",
    "חלקי": "bg-amber-50 text-amber-700 border-amber-200",
    "שולם חלקית": "bg-amber-50 text-amber-700 border-amber-200",
    "בהפסקה": "bg-amber-50 text-amber-700 border-amber-200",
    "טיוטה": "bg-muted text-muted-foreground border-border",
    "בתכנון": "bg-secondary text-brand-deep border-border",
    "לא פעיל": "bg-muted text-muted-foreground border-border",
    "לא שולם": "bg-rose-50 text-rose-700 border-rose-200",
    "חסר": "bg-rose-50 text-rose-700 border-rose-200",
    "מושעה": "bg-rose-50 text-rose-700 border-rose-200",
    "גבוהה": "bg-rose-50 text-rose-700 border-rose-200",
    "בינונית": "bg-amber-50 text-amber-700 border-amber-200",
    "נמוכה": "bg-secondary text-brand-deep border-border",
  };
  const cls = map[value] ?? "bg-secondary text-brand-deep border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {value}
    </span>
  );
}
