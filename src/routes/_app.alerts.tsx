import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { alerts } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const high = alerts.filter((a) => a.severity === "גבוהה").length;
  const mid = alerts.filter((a) => a.severity === "בינונית").length;
  const low = alerts.filter((a) => a.severity === "נמוכה").length;

  return (
    <>
      <PageHeader title="התראות מערכת" description="התראות אוטומטיות מבוססות חוקים עסקיים — ללא בינה מלאכותית." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">חמורות</div><div className="text-2xl font-bold mt-1 text-rose-600">{high}</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">בינוניות</div><div className="text-2xl font-bold mt-1 text-amber-600">{mid}</div></div>
        <div className="card-elevated p-4"><div className="text-xs text-muted-foreground">נמוכות</div><div className="text-2xl font-bold mt-1 text-brand">{low}</div></div>
        <div className="card-elevated p-4 bg-soft-gradient"><div className="text-xs text-muted-foreground">חוקים פעילים</div><div className="text-2xl font-bold mt-1">12</div></div>
      </div>

      <div className="card-elevated p-5">
        <div className="text-lg font-semibold mb-4">התראות פתוחות</div>
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-surface-muted">
              <div className={`p-2 rounded-lg ${a.severity === "גבוהה" ? "bg-rose-50 text-rose-600" : a.severity === "בינונית" ? "bg-amber-50 text-amber-600" : "bg-secondary text-brand"}`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold">{a.title}</div>
                  <StatusBadge value={a.severity} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  מודול: <span className="font-medium text-foreground">{a.module}</span> · חוק: {a.rule} · נוצר ב-{a.createdAt}
                </div>
              </div>
              <button className="text-xs text-brand hover:underline flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> סמן כטופל
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
