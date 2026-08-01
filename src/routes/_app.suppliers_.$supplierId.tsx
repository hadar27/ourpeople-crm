import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  FileText,
  Receipt,
  Wallet,
  Phone,
  ShoppingCart,
  History,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/page-header";
import { MiniStat, SectionCard, EmptyState, RecordNotFound, Timeline, type TimelineItem } from "@/components/detail-kit";
import { suppliers, projects } from "@/lib/mock-data";
import { daysBetween, isOverdue } from "@/lib/crm-seed";
import { selectSupplierBundle, useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/suppliers_/$supplierId")({
  component: SupplierProfile,
});

function projectName(id?: string) {
  if (!id) return "—";
  return projects.find((p) => p.id === id)?.name ?? id;
}

function SupplierProfile() {
  const { supplierId: id } = useParams({ from: "/_app/suppliers_/$supplierId" });
  const supplier = suppliers.find((s) => s.id === id);
  const bundle = useStore(selectSupplierBundle(id));

  if (!supplier) {
    return (
      <RecordNotFound
        title="הספק לא נמצא"
        description={`לא קיימת רשומת ספק עם המזהה ${id}. ייתכן שהרשומה נמחקה או שהקישור שגוי.`}
        backTo="/suppliers"
        backLabel="חזרה לרשימת הספקים"
      />
    );
  }

  const { contracts, purchaseOrders, invoices, payments, documents, activity } = bundle;
  const activeContracts = contracts.filter((c) => c.status === "בתוקף");
  const contractValue = activeContracts.reduce((s, c) => s + c.value, 0);
  const invoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoiced - paid;
  const overdueInvoices = invoices.filter((i) => i.status !== "שולם" && isOverdue(i.dueDate));

  const timeline: TimelineItem[] = activity
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((a) => ({
      id: a.id,
      title: a.action,
      meta: `${a.actor}${a.detail ? ` · ${a.detail}` : ""}`,
      date: a.date,
      tone: a.action.includes("באיחור") || a.action.includes("הושעה") ? "danger" : "brand",
    }));

  return (
    <>
      <Link to="/suppliers" className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline">
        <ArrowRight className="h-4 w-4" /> חזרה לרשימת הספקים
      </Link>

      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-gradient text-white flex items-center justify-center">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{supplier.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                <span>{supplier.id}</span>·<span>{supplier.category}</span>·
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {supplier.contact}
                </span>
                ·<StatusBadge value={supplier.status} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => toast.success("דוח ספק יוצא לאקסל")}>
              <FileText className="h-4 w-4 ml-1" /> דוח ספק
            </Button>
            <Button className="bg-brand hover:bg-brand-deep" onClick={() => toast.success("בקשת תשלום נשלחה להנהלת חשבונות")}>
              <Wallet className="h-4 w-4 ml-1" /> בקשת תשלום
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <MiniStat label="חוזים בתוקף" value={String(activeContracts.length)} icon={<FileText className="h-4 w-4" />} />
          <MiniStat label="היקף התקשרות" value={`₪${contractValue.toLocaleString()}`} />
          <MiniStat label="סך חויב" value={`₪${invoiced.toLocaleString()}`} icon={<Receipt className="h-4 w-4" />} />
          <MiniStat label="שולם" value={`₪${paid.toLocaleString()}`} tone="good" />
          <MiniStat
            label="יתרה לתשלום"
            value={`₪${balance.toLocaleString()}`}
            tone={balance > 0 ? "warn" : "good"}
          />
        </div>

        {overdueInvoices.length > 0 && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {overdueInvoices.length} חשבוניות באיחור בסך ₪
            {overdueInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()} — הוותק הגבוה ביותר{" "}
            {Math.max(...overdueInvoices.map((i) => daysBetween(i.dueDate)))} ימים.
          </div>
        )}
      </div>

      <Tabs defaultValue="contracts" dir="rtl">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="contracts">חוזים ({contracts.length})</TabsTrigger>
          <TabsTrigger value="pos">הזמנות רכש ({purchaseOrders.length})</TabsTrigger>
          <TabsTrigger value="invoices">חשבוניות ({invoices.length})</TabsTrigger>
          <TabsTrigger value="payments">תשלומים ({payments.length})</TabsTrigger>
          <TabsTrigger value="docs">מסמכים ({documents.length})</TabsTrigger>
          <TabsTrigger value="activity">היסטוריית פעילות</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts">
          <SectionCard title="חוזים והתקשרויות">
            {contracts.length === 0 ? (
              <EmptyState text="אין חוזים רשומים" />
            ) : (
              <Table
                head={["מזהה", "כותרת", "פרויקט", "היקף", "תקופה", "סטטוס"]}
                rows={contracts.map((c) => [
                  c.id,
                  <span className="font-medium">{c.title}</span>,
                  c.projectId ? (
                    <Link to="/project/$id" params={{ id: c.projectId }} className="text-brand hover:underline">
                      {projectName(c.projectId)}
                    </Link>
                  ) : (
                    "כללי"
                  ),
                  <span className="font-semibold tabular-nums">₪{c.value.toLocaleString()}</span>,
                  <span className="text-muted-foreground text-xs">
                    {c.startDate} — {c.endDate}
                  </span>,
                  <StatusBadge value={c.status} />,
                ])}
              />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="pos">
          <SectionCard title="הזמנות רכש">
            {purchaseOrders.length === 0 ? (
              <EmptyState text="אין הזמנות רכש" />
            ) : (
              <Table
                head={["מזהה", "תיאור", "פרויקט", "סכום", "תאריך", "סטטוס"]}
                rows={purchaseOrders.map((p) => [
                  p.id,
                  <span className="font-medium">{p.description}</span>,
                  projectName(p.projectId),
                  <span className="font-semibold tabular-nums">₪{p.amount.toLocaleString()}</span>,
                  <span className="text-muted-foreground">{p.date}</span>,
                  <StatusBadge value={p.status} />,
                ])}
              />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="invoices">
          <SectionCard title="חשבוניות">
            {invoices.length === 0 ? (
              <EmptyState text="אין חשבוניות" />
            ) : (
              <Table
                head={["מזהה", "פרויקט", "סכום", "הופקה", "לתשלום עד", "גיול", "סטטוס"]}
                rows={invoices.map((i) => {
                  const late = i.status !== "שולם" && isOverdue(i.dueDate);
                  return [
                    i.id,
                    projectName(i.projectId),
                    <span className="font-semibold tabular-nums">₪{i.amount.toLocaleString()}</span>,
                    <span className="text-muted-foreground">{i.issueDate}</span>,
                    <span className={late ? "text-rose-600 font-medium" : "text-muted-foreground"}>{i.dueDate}</span>,
                    <span className={late ? "text-rose-600 font-medium" : "text-muted-foreground"}>
                      {late ? `${daysBetween(i.dueDate)} ימים באיחור` : "—"}
                    </span>,
                    <StatusBadge value={i.status} />,
                  ];
                })}
              />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="payments">
          <SectionCard title="תשלומים שבוצעו">
            {payments.length === 0 ? (
              <EmptyState text="לא בוצעו תשלומים" />
            ) : (
              <Table
                head={["מזהה", "חשבונית", "סכום", "אמצעי", "תאריך"]}
                rows={payments.map((p) => [
                  p.id,
                  p.invoiceId,
                  <span className="font-semibold tabular-nums">₪{p.amount.toLocaleString()}</span>,
                  p.method,
                  <span className="text-muted-foreground">{p.date}</span>,
                ])}
              />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="docs">
          <SectionCard
            title="מסמכים"
            actions={
              <Button variant="outline" size="sm" onClick={() => toast.info("העלאת מסמכים תתאפשר עם חיבור האחסון")}>
                <ShoppingCart className="h-4 w-4 ml-1" /> העלה מסמך
              </Button>
            }
          >
            {documents.length === 0 ? (
              <EmptyState text="אין מסמכים" />
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3">
                    <FileText className="h-5 w-5 text-brand shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.kind} · הועלה ב-{d.uploadedAt} על ידי {d.uploadedBy}
                      </div>
                    </div>
                    <button className="text-xs text-brand hover:underline" onClick={() => toast.success("המסמך הורד")}>
                      הורדה
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="activity">
          <SectionCard title="היסטוריית פעילות">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <History className="h-4 w-4" /> כל פעולה מול הספק נרשמת אוטומטית
            </div>
            <Timeline items={timeline} />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground">
          <tr className="text-right">
            {head.map((h) => (
              <th key={h} className="py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border hover:bg-surface-muted">
              {r.map((c, j) => (
                <td key={j} className="py-3 pl-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
