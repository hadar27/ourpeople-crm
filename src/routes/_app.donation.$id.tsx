import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Download, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/page-header";
import { donations, donors, projects } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/donation/$id")({
  component: DonationDetail,
});

function DonationDetail() {
  const { id } = useParams({ from: "/_app/donation/$id" });
  const d = donations.find((x) => x.id === id);
  if (!d) return <div className="card-elevated p-8 text-center">תרומה לא נמצאה. <Link to="/donations" className="text-brand">חזרה</Link></div>;
  const donor = donors.find((x) => x.name === d.donor);
  const project = projects.find((p) => p.name === d.project || d.project.includes(p.name.split(" ")[0]));

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
              <div className="mt-2"><StatusBadge value={d.receipt} /></div>
            </div>
            <div className="flex gap-2">
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
            <Field label="תורם" value={donor ? <Link to="/donor/$id" params={{ id: donor.id }} className="text-brand hover:underline font-medium">{d.donor}</Link> : d.donor} />
            <Field label="פרויקט" value={project ? <Link to="/project/$id" params={{ id: project.id }} className="text-brand hover:underline font-medium">{d.project}</Link> : d.project} />
            <Field label="אמצעי תשלום" value={d.method} />
            <Field label="תאריך" value={d.date} />
          </div>
        </div>

        <div className="card-elevated p-5">
          <div className="text-lg font-semibold mb-3">היסטוריית מסמך</div>
          <ol className="relative border-r-2 border-border pr-4 space-y-4 text-sm">
            <li><div className="absolute right-[-7px] h-3 w-3 rounded-full bg-brand" /><div className="font-medium">תרומה נקלטה</div><div className="text-xs text-muted-foreground">{d.date}</div></li>
            {d.receipt === "הופק" && <li><div className="absolute right-[-7px] h-3 w-3 rounded-full bg-emerald-500" /><div className="font-medium">קבלה הופקה</div><div className="text-xs text-muted-foreground">יום למחרת</div></li>}
            {d.receipt !== "הופק" && <li className="text-amber-700"><div className="absolute right-[-7px] h-3 w-3 rounded-full bg-amber-500" /><div className="font-medium">ממתין להפקת קבלה</div></li>}
          </ol>
        </div>
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
