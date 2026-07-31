import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Bell } from "lucide-react";
import { useState } from "react";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { generateAlerts, moduleRoute } from "@/lib/business-rules";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const all = generateAlerts();
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const open = all.filter((a) => !resolved.has(a.id));
  const high = open.filter((a) => a.severity === "גבוהה").length;
  const mid = open.filter((a) => a.severity === "בינונית").length;
  const low = open.filter((a) => a.severity === "נמוכה").length;

  return (
    <>
      <PageHeader title="מרכז התראות" description="התראות אוטומטיות מבוססות חוקים עסקיים — חישוב חי מנתוני המערכת. ללא בינה מלאכותית." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">חמורות</div><div className="text-2xl font-bold mt-1 text-rose-600">{high}</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">בינוניות</div><div className="text-2xl font-bold mt-1 text-amber-600">{mid}</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">נמוכות</div><div className="text-2xl font-bold mt-1 text-brand">{low}</div></div>
        <div className="card-elevated p-4 bg-soft-gradient"><div className="text-xs text-muted-foreground">חוקים פעילים</div><div className="text-2xl font-bold mt-1">10</div></div>
      </div>

      <div className="card-elevated p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">התראות פתוחות ({open.length})</div>
          {resolved.size > 0 && (
            <button onClick={() => { setResolved(new Set()); toast.info("ההתראות שוחזרו"); }} className="text-xs text-brand hover:underline">
              שחזר התראות שטופלו
            </button>
          )}
        </div>
        {open.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
            <div className="text-lg font-semibold">הכל תקין!</div>
            <div className="text-sm text-muted-foreground mt-1">אין התראות פתוחות במערכת.</div>
          </div>
        ) : (
          <ul className="space-y-3">
            {open.map((a) => {
              const route = moduleRoute[a.module];
              return (
                <li key={a.id} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-surface-muted hover:bg-white transition-colors">
                  <div className={`p-2 rounded-lg ${a.severity === "גבוהה" ? "bg-rose-50 text-rose-600" : a.severity === "בינונית" ? "bg-amber-50 text-amber-600" : "bg-secondary text-brand"}`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold">{a.title}</div>
                      <StatusBadge value={a.severity} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      מודול: <span className="font-medium text-foreground">{a.module}</span> · חוק: {a.rule} · נוצר ב-{a.createdAt}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {route && (
                      <Link to={route} className="text-xs text-brand hover:underline flex items-center gap-1">
                        <Bell className="h-3 w-3" /> מעבר למודול
                      </Link>
                    )}
                    <button
                      onClick={() => { setResolved((p) => new Set(p).add(a.id)); toast.success("ההתראה סומנה כטופלה"); }}
                      className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" /> סמן כטופל
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
