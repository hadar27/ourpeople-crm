import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Download, FileCheck2, Plus, Trash2, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/page-header";
import { SectionCard, EmptyState } from "@/components/detail-kit";
import { FormDialog } from "@/components/form-dialog";
import { projects } from "@/lib/mock-data";
import { useCollection, useRecord } from "@/lib/records-store";
import { DonationEditButton } from "@/components/module-edit-dialogs";
import { ChangeHistory } from "@/components/change-history";
import { TODAY } from "@/lib/crm-seed";
import { addAllocation, newId, removeAllocation, selectAllocations, useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/donation/$id")({
  component: DonationDetail,
});

function DonationDetail() {
  const { id } = useParams({ from: "/_app/donation/$id" });
  const d = useRecord("donations", id);
  const donors = useCollection("donors");
  const allocations = useStore(selectAllocations(id));

  if (!d)
    return (
      <div className="card-elevated p-8 text-center">
        תרומה לא נמצאה. <Link to="/donations" className="text-brand">חזרה</Link>
      </div>
    );

  const donor = donors.find((x) => x.name === d.donor);
  const allocated = allocations.reduce((s, a) => s + a.amount, 0);
  const remaining = d.amount - allocated;
  const pct = Math.min(100, Math.round((allocated / d.amount) * 100));

  const handleAllocate = (v: Record<string, string>) => {
    const project = projects.find((p) => p.name === v.projectId);
    if (!project) return "יש לבחור פרויקט";
    const amount = Number(v.amount);
    if (!amount || amount <= 0) return "יש להזין סכום חיובי";
    if (amount > remaining) return `ניתן לייעד עד ₪${remaining.toLocaleString()} — היתרה שטרם יועדה`;
    addAllocation({
      id: newId("AL"),
      donationId: d.id,
      projectId: project.id,
      amount,
      date: v.date || TODAY,
      notes: v.notes || undefined,
    });
  };

  return (
    <>
      <Link to="/donations" className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline">
        <ArrowRight className="h-4 w-4" /> חזרה לרשימת התרומות
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-elevated p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-muted-foreground">{d.id}</div>
              <h1 className="text-3xl font-bold mt-1">₪{d.amount.toLocaleString()}</h1>
              <div className="mt-2">
                <StatusBadge value={d.receipt} />
              </div>
            </div>
            <div className="flex gap-2">
              <DonationEditButton record={d} />
              {d.receipt !== "הופק" && (
                <Button variant="outline" onClick={() => toast.success("הקבלה הופקה ונשלחה לתורם")}>
                  <FileCheck2 className="h-4 w-4 ml-1" /> הפק קבלה
                </Button>
              )}
              <Button className="bg-brand hover:bg-brand-deep" onClick={() => toast.success("המסמך הורד")}>
                <Download className="h-4 w-4 ml-1" /> הורד אישור
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Field
              label="תורם"
              value={
                donor ? (
                  <Link to="/donor/$id" params={{ id: donor.id }} className="text-brand hover:underline font-medium">
                    {d.donor}
                  </Link>
                ) : (
                  d.donor
                )
              }
            />
            <Field label="ייעוד מוצהר" value={d.project} />
            <Field label="אמצעי תשלום" value={d.method} />
            <Field label="תאריך" value={d.date} />
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="text-lg font-semibold mb-3">היסטוריית מסמך</div>
          <ol className="relative border-r-2 border-border pr-4 space-y-4 text-sm">
            <li>
              <div className="absolute right-[-7px] h-3 w-3 rounded-full bg-brand" />
              <div className="font-medium">תרומה נקלטה</div>
              <div className="text-xs text-muted-foreground">{d.date}</div>
            </li>
            {d.receipt === "הופק" && (
              <li>
                <div className="absolute right-[-7px] h-3 w-3 rounded-full bg-emerald-500" />
                <div className="font-medium">קבלה הופקה</div>
                <div className="text-xs text-muted-foreground">יום למחרת</div>
              </li>
            )}
            {d.receipt !== "הופק" && (
              <li className="text-amber-700">
                <div className="absolute right-[-7px] h-3 w-3 rounded-full bg-amber-500" />
                <div className="font-medium">ממתין להפקת קבלה</div>
              </li>
            )}
          </ol>
        </div>
      </div>

      <div className="mt-6">
        <ChangeHistory entityId={d.id} className="mb-6" />
        <SectionCard
          title="ייעוד התרומה לפרויקטים"
          actions={
            <FormDialog
              trigger={
                <Button size="sm" className="bg-brand hover:bg-brand-deep gap-1" disabled={remaining <= 0}>
                  <Plus className="h-4 w-4" /> ייעוד לפרויקט
                </Button>
              }
              title="ייעוד תרומה לפרויקט"
              description={`יתרה שטרם יועדה: ₪${remaining.toLocaleString()} מתוך ₪${d.amount.toLocaleString()}.`}
              successMessage="הייעוד נרשם ושויך לתקציב הפרויקט"
              fields={[
                { name: "projectId", label: "פרויקט", type: "select", required: true, options: projects.map((p) => p.name) },
                { name: "amount", label: "סכום (₪)", type: "number", required: true },
                { name: "date", label: "תאריך ייעוד", type: "date", required: true },
                { name: "notes", label: "הערות", type: "textarea", colSpan: 2 },
              ]}
              onSubmit={handleAllocate}
            />
          }
        >
          <div className="mb-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="flex items-center gap-1 text-muted-foreground">
                <PieChart className="h-4 w-4" /> יועד ₪{allocated.toLocaleString()} מתוך ₪{d.amount.toLocaleString()}
              </span>
              <span className={`font-semibold ${remaining > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {remaining > 0 ? `יתרה ₪${remaining.toLocaleString()}` : "יועד במלואו"}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-muted overflow-hidden">
              <div className="h-full bg-brand-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {allocations.length === 0 ? (
            <EmptyState text="התרומה טרם יועדה" hint="ייעדו את התרומה לפרויקט אחד או יותר" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="text-right">
                  <th className="py-2 font-medium">פרויקט</th>
                  <th className="py-2 font-medium">סכום</th>
                  <th className="py-2 font-medium">שיעור</th>
                  <th className="py-2 font-medium">תאריך</th>
                  <th className="py-2 font-medium">הערות</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => {
                  const p = projects.find((x) => x.id === a.projectId);
                  return (
                    <tr key={a.id} className="border-t border-border hover:bg-surface-muted">
                      <td className="py-3">
                        <Link to="/project/$id" params={{ id: a.projectId }} className="text-brand hover:underline font-medium">
                          {p?.name ?? a.projectId}
                        </Link>
                      </td>
                      <td className="py-3 font-semibold tabular-nums">₪{a.amount.toLocaleString()}</td>
                      <td className="py-3 tabular-nums text-muted-foreground">
                        {Math.round((a.amount / d.amount) * 100)}%
                      </td>
                      <td className="py-3 text-muted-foreground">{a.date}</td>
                      <td className="py-3 text-muted-foreground">{a.notes ?? "—"}</td>
                      <td className="py-3">
                        <button
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="בטל ייעוד"
                          onClick={() => {
                            removeAllocation(a.id);
                            toast.success("הייעוד בוטל");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </SectionCard>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-surface-muted rounded-lg p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}
