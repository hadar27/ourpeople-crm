import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useRef } from "react";
import {
  ArrowRight,
  Building2,
  FileText,
  Receipt,
  Phone,
  Upload,
  History,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/page-header";
import {
  MiniStat,
  SectionCard,
  EmptyState,
  RecordNotFound,
  Timeline,
  type TimelineItem,
} from "@/components/detail-kit";
import { useSupplier } from "@/lib/queries/suppliers";
import { useContractsForSupplier } from "@/lib/queries/contracts";
import { usePurchaseOrdersForSupplier } from "@/lib/queries/purchase-orders";
import { useSupplierInvoicesForSupplier } from "@/lib/queries/supplier-invoices";
import { useSupplierPaymentsForSupplier } from "@/lib/queries/supplier-payments";
import {
  downloadEntityDocument,
  useDocumentsForEntity,
  useUploadEntityDocument,
} from "@/lib/queries/documents";
import { useActivityLogForEntity } from "@/lib/queries/activity-log";
import { SupplierEditButton } from "@/components/module-edit-dialogs";
import { isOverdue } from "@/lib/crm-seed";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/suppliers_/$supplierId")({
  component: SupplierProfile,
});

function SupplierProfile() {
  const { supplierId: id } = useParams({ from: "/_app/suppliers_/$supplierId" });
  const { data: supplier, isLoading, isError, refetch } = useSupplier(id);
  const { data: contractsData } = useContractsForSupplier(id);
  const { data: purchaseOrdersData } = usePurchaseOrdersForSupplier(id);
  const { data: invoicesData } = useSupplierInvoicesForSupplier(id);
  const { data: paymentsData } = useSupplierPaymentsForSupplier(id);
  const { data: documentsData } = useDocumentsForEntity("supplier", id);
  const uploadDocument = useUploadEntityDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: activityData } = useActivityLogForEntity("supplier", id);

  if (isLoading) {
    return (
      <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> טוען פרטי ספק...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card-elevated flex flex-col items-center gap-3 p-16 text-center">
        <div className="text-sm text-muted-foreground">אירעה שגיאה בטעינת הספק.</div>
        <button onClick={() => refetch()} className="text-sm text-brand hover:underline">
          נסה שוב
        </button>
      </div>
    );
  }

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

  const contracts = contractsData ?? [];
  const purchaseOrders = purchaseOrdersData ?? [];
  const invoices = invoicesData ?? [];
  const payments = paymentsData ?? [];
  const documents = documentsData ?? [];
  const activity = activityData ?? [];
  const activeContracts = contracts.filter((c) => c.status === "בתוקף");
  const contractValue = activeContracts.reduce((s, c) => s + c.value, 0);
  const approvedOrdersValue = purchaseOrders
    .filter((order) => order.status === "מאושרת")
    .reduce((sum, order) => sum + order.amount, 0);
  const invoiced = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoiced - paid;
  const overdueInvoices = invoices.filter((i) => i.status !== "שולם" && isOverdue(i.dueDate));

  const handleDocumentUpload = async (file?: File) => {
    if (!file) return;
    try {
      await uploadDocument.mutateAsync({
        entityType: "supplier",
        entityId: id,
        file,
        kind: "קבלה",
      });
      toast.success("הקבלה הועלתה ונשמרה בהצלחה");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "העלאת הקבלה נכשלה");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
      <Link
        to="/suppliers"
        className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline"
      >
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
            <SupplierEditButton record={supplier} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <MiniStat
            label="חוזים בתוקף"
            value={String(activeContracts.length)}
            icon={<FileText className="h-4 w-4" />}
          />
          <MiniStat label="היקף התקשרות" value={`₪${contractValue.toLocaleString()}`} />
          <MiniStat
            label="סך חויב"
            value={`₪${invoiced.toLocaleString()}`}
            icon={<Receipt className="h-4 w-4" />}
          />
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
            {overdueInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}.
          </div>
        )}
      </div>

      <Tabs defaultValue="invoices" dir="rtl">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="invoices">חשבוניות והתחייבויות ({invoices.length})</TabsTrigger>
          <TabsTrigger value="payments">תשלומים ({payments.length})</TabsTrigger>
          <TabsTrigger value="docs">מסמכים ({documents.length})</TabsTrigger>
          <TabsTrigger value="activity">היסטוריית פעילות</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniStat label="התחייבות בחוזים" value={`₪${contractValue.toLocaleString()}`} />
            <MiniStat label="הזמנות מאושרות" value={`₪${approvedOrdersValue.toLocaleString()}`} />
            <MiniStat label="חשבוניות שהתקבלו" value={`₪${invoiced.toLocaleString()}`} />
            <MiniStat
              label="יתרה לתשלום"
              value={`₪${balance.toLocaleString()}`}
              tone={balance > 0 ? "warn" : "good"}
            />
          </div>

          <SectionCard title="בסיס ההתחייבות — חוזים">
            {contracts.length === 0 ? (
              <EmptyState text="אין חוזים רשומים" />
            ) : (
              <Table
                head={["מזהה", "כותרת", "פרויקט", "היקף", "תקופה", "סטטוס"]}
                rows={contracts.map((c) => [
                  c.id,
                  <span className="font-medium">{c.title}</span>,
                  c.projectId ? (
                    <Link
                      to="/project/$id"
                      params={{ id: c.projectId }}
                      className="text-brand hover:underline"
                    >
                      {c.projectName ?? c.projectId}
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
          <SectionCard title="הזמנות רכש והתחייבויות מאושרות">
            {purchaseOrders.length === 0 ? (
              <EmptyState text="אין הזמנות רכש" />
            ) : (
              <Table
                head={["מזהה", "תיאור", "פרויקט", "סכום", "תאריך", "סטטוס"]}
                rows={purchaseOrders.map((p) => [
                  p.id,
                  <span className="font-medium">{p.description}</span>,
                  p.projectName ?? "—",
                  <span className="font-semibold tabular-nums">₪{p.amount.toLocaleString()}</span>,
                  <span className="text-muted-foreground">{p.date}</span>,
                  <StatusBadge value={p.status} />,
                ])}
              />
            )}
          </SectionCard>
          <SectionCard title="חשבוניות שהתקבלו">
            {invoices.length === 0 ? (
              <EmptyState text="אין חשבוניות" />
            ) : (
              <Table
                head={["מזהה", "פרויקט", "סכום", "הופקה", "לתשלום עד", "סטטוס"]}
                rows={invoices.map((i) => {
                  const late = i.status !== "שולם" && isOverdue(i.dueDate);
                  return [
                    i.id,
                    i.projectName ?? "—",
                    <span className="font-semibold tabular-nums">
                      ₪{i.amount.toLocaleString()}
                    </span>,
                    <span className="text-muted-foreground">{i.issueDate}</span>,
                    <span className={late ? "text-rose-600 font-medium" : "text-muted-foreground"}>
                      {i.dueDate}
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
              <Button
                variant="outline"
                size="sm"
                disabled={uploadDocument.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 ml-1" />
                {uploadDocument.isPending ? "מעלה..." : "העלה קבלה"}
              </Button>
            }
          >
            {documents.length === 0 ? (
              <EmptyState text="אין מסמכים" />
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3"
                  >
                    <FileText className="h-5 w-5 text-brand shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.kind} · הועלה ב-{d.uploadedAt} על ידי {d.uploadedBy}
                      </div>
                    </div>
                    <button
                      className="text-xs text-brand hover:underline"
                      onClick={async () => {
                        try {
                          await downloadEntityDocument(d);
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "הורדת המסמך נכשלה");
                        }
                      }}
                    >
                      הורדה
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(event) => handleDocumentUpload(event.target.files?.[0])}
          />
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
