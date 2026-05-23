import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Mail, Phone, Heart, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/page-header";
import { donors, donations } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/donor/$id")({
  component: DonorDetail,
});

function DonorDetail() {
  const { id } = useParams({ from: "/_app/donor/$id" });
  const donor = donors.find((d) => d.id === id);
  if (!donor) {
    return <div className="card-elevated p-8 text-center">תורם לא נמצא. <Link to="/donors" className="text-brand">חזרה</Link></div>;
  }
  const history = donations.filter((d) => d.donor === donor.name);

  return (
    <>
      <Link to="/donors" className="text-sm text-brand inline-flex items-center gap-1 mb-4 hover:underline">
        <ArrowRight className="h-4 w-4" /> חזרה לרשימת התורמים
      </Link>

      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-gradient text-white text-2xl font-bold flex items-center justify-center">
              {donor.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{donor.name}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{donor.id}</span>·<StatusBadge value={donor.type} />·<StatusBadge value={donor.status} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.success("שיחה נרשמה ביומן")}>
              <Phone className="h-4 w-4 ml-1" /> רישום שיחה
            </Button>
            <Button className="bg-brand hover:bg-brand-deep" onClick={() => toast.success("פנייה נשלחה")}>
              <Mail className="h-4 w-4 ml-1" /> שלח פנייה
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Stat label="סך תרומות" value={`₪${donor.totalDonated.toLocaleString()}`} icon={<Gift className="h-4 w-4" />} />
          <Stat label="מספר תרומות" value={String(history.length)} />
          <Stat label="תרומה אחרונה" value={donor.lastDonation} />
          <Stat label="תחומי עניין" value={donor.interests.join(", ")} icon={<Heart className="h-4 w-4" />} />
        </div>
      </div>

      <div className="card-elevated p-5">
        <div className="text-lg font-semibold mb-4">היסטוריית תרומות</div>
        {history.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">אין נתונים להצגה</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-right">
                <th className="py-2">מזהה</th>
                <th className="py-2">פרויקט</th>
                <th className="py-2">סכום</th>
                <th className="py-2">אמצעי</th>
                <th className="py-2">קבלה</th>
                <th className="py-2">תאריך</th>
              </tr>
            </thead>
            <tbody>
              {history.map((d) => (
                <tr key={d.id} className="border-t border-border hover:bg-surface-muted">
                  <td className="py-3">
                    <Link to="/donation/$id" params={{ id: d.id }} className="text-brand hover:underline font-medium">
                      {d.id}
                    </Link>
                  </td>
                  <td className="py-3">{d.project}</td>
                  <td className="py-3 font-semibold">₪{d.amount.toLocaleString()}</td>
                  <td className="py-3 text-muted-foreground">{d.method}</td>
                  <td className="py-3"><StatusBadge value={d.receipt} /></td>
                  <td className="py-3 text-muted-foreground">{d.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-surface-muted rounded-lg p-4">
      <div className="text-xs text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className="text-base font-bold mt-1 truncate">{value}</div>
    </div>
  );
}
