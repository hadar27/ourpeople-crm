import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { useUsers, useCreateUser, type UserRecord } from "@/lib/queries/users";
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
  const { data: users, isLoading, isError, refetch } = useUsers();
  const createUser = useCreateUser();
  return (
    <>
      <PageHeader
        title="משתמשים והרשאות"
        description="ניהול משתמשי המערכת ותפקידיהם."
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
              { name: "role", label: "תפקיד", type: "select", required: true, options: ["מנהל מערכת", "הנהלה", "מנהל כספים", "מנהל מתנדבים", "מנהל קשרי תורמים"] },
              { name: "status", label: "סטטוס", type: "select", options: ["פעיל", "מושעה"] },
              { name: "password", label: "סיסמה זמנית", required: true, placeholder: "תישלח באימייל", helper: "רשומה זו היא ספריית אנשי צוות בלבד — אינה יוצרת חשבון התחברות אמיתי" },
            ]}
            onCreate={async (v) => {
              try {
                await createUser.mutateAsync({
                  name: v.name,
                  email: v.email,
                  role: v.role as UserRecord["role"],
                  status: (v.status || "פעיל") as UserRecord["status"],
                  lastLogin: "",
                });
                return { ok: true };
              } catch (err) {
                return { ok: false, error: err instanceof Error ? err.message : "השמירה נכשלה" };
              }
            }}
          />
        }
      />
      <div className="mb-6">
        {isLoading ? (
          <div className="card-elevated flex items-center justify-center gap-2 p-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> טוען משתמשים...
          </div>
        ) : isError ? (
          <div className="card-elevated flex flex-col items-center gap-3 p-16 text-center">
            <div className="text-sm text-muted-foreground">אירעה שגיאה בטעינת המשתמשים.</div>
            <button onClick={() => refetch()} className="text-sm text-brand hover:underline">נסה שוב</button>
          </div>
        ) : (
          <DataTable rows={users ?? []} columns={columns} searchKeys={["name", "email", "role"]} rowActions={(r) => <UserEditButton record={r} />} />
        )}
      </div>
    </>
  );
}
