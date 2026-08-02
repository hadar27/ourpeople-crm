import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { permissionsMatrix } from "@/lib/mock-data";
import { useCollection, type UserRecord } from "@/lib/records-store";
import { UserEditButton } from "@/components/module-edit-dialogs";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

const columns: Column<UserRecord>[] = [
  { key: "name", header: "שם", render: (r) => <span className="font-medium">{r.name}</span> },
  { key: "email", header: "דוא״ל", render: (r) => <span className="text-muted-foreground">{r.email}</span> },
  { key: "role", header: "תפקיד", render: (r) => <StatusBadge value={r.role} /> },
  { key: "status", header: "סטטוס", render: (r) => <StatusBadge value={r.status} /> },
  { key: "lastLogin", header: "כניסה אחרונה" },
];

function UsersPage() {
  const users = useCollection("users");
  return (
    <>
      <PageHeader
        title="משתמשים והרשאות"
        description="ניהול משתמשי המערכת ומטריצת הרשאות לפי תפקידים."
        actions={
          <EntityFormDialog
            triggerLabel="הוסף משתמש"
            title="הוספת משתמש חדש"
            description="יצירת חשבון משתמש ושיוך לתפקיד והרשאות."
            successMessage="משתמש חדש נוסף בהצלחה"
            fields={[
              { name: "name", label: "שם מלא", required: true },
              { name: "email", label: "דוא״ל", type: "email", required: true },
              { name: "phone", label: "טלפון", type: "tel" },
              { name: "role", label: "תפקיד", type: "select", required: true, options: ["מנהל מערכת", "מנהל פרויקטים", "כספים", "רכז תורמים", "רכז מתנדבים", "צפייה בלבד"] },
              { name: "status", label: "סטטוס", type: "select", options: ["פעיל", "מושעה"] },
              { name: "password", label: "סיסמה זמנית", required: true, placeholder: "תישלח באימייל" },
            ]}
          />
        }
      />
      <div className="mb-6">
        <DataTable rows={users} columns={columns} searchKeys={["name", "email", "role"]} rowActions={(r) => <UserEditButton record={r} />} />
      </div>

      <div className="card-elevated p-5">
        <div className="text-lg font-semibold mb-1">מטריצת הרשאות</div>
        <div className="text-xs text-muted-foreground mb-4">הרשאות צפייה ועריכה לפי תפקיד.</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted">
              <tr className="text-right text-muted-foreground">
                <th className="px-4 py-3 font-medium">מודול</th>
                <th className="px-4 py-3 font-medium text-center">מנהל מערכת</th>
                <th className="px-4 py-3 font-medium text-center">הנהלה</th>
                <th className="px-4 py-3 font-medium text-center">מנהל כספים</th>
                <th className="px-4 py-3 font-medium text-center">מנהל מתנדבים</th>
                <th className="px-4 py-3 font-medium text-center">מנהל קשרי תורמים</th>
              </tr>
            </thead>
            <tbody>
              {permissionsMatrix.map((row) => (
                <tr key={row.module} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{row.module}</td>
                  <Cell ok={row.admin} />
                  <Cell ok={row.mgmt} />
                  <Cell ok={row.finance} />
                  <Cell ok={row.volunteers} />
                  <Cell ok={row.donors} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Cell({ ok }: { ok: boolean }) {
  return (
    <td className="px-4 py-3 text-center">
      {ok ? (
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-brand/10 text-brand">
          <Check className="h-4 w-4" />
        </span>
      ) : (
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-muted text-muted-foreground">
          <X className="h-4 w-4" />
        </span>
      )}
    </td>
  );
}
