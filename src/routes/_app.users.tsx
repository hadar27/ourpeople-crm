import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EntityFormDialog } from "@/components/entity-form-dialog";
import { useUsers, useCreateUser, type UserRecord } from "@/lib/queries/users";
import { UserEditButton, UserDeleteButton } from "@/components/module-edit-dialogs";
import { useSession } from "@/lib/auth";
import { useCanEdit } from "@/lib/permissions";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

const columns: Column<UserRecord>[] = [
  { key: "name", header: "שם", render: (r) => <span className="font-medium">{r.name}</span> },
  {
    key: "email",
    header: "דוא״ל",
    render: (r) => <span className="text-muted-foreground">{r.email}</span>,
  },
  { key: "role", header: "תפקיד", render: (r) => <StatusBadge value={r.role} /> },
  { key: "status", header: "סטטוס", render: (r) => <StatusBadge value={r.status} /> },
  { key: "lastLogin", header: "כניסה אחרונה" },
];

function UsersPage() {
  const { data: users, isLoading, isError, refetch } = useUsers();
  const createUser = useCreateUser();
  const { session } = useSession();
  const canAddUser = useCanEdit("users");
  return (
    <>
      <PageHeader
        title="משתמשים והרשאות"
        description="ניהול משתמשי המערכת ותפקידיהם."
        actions={
          canAddUser && (
            <EntityFormDialog
              triggerLabel="הוסף משתמש"
              title="הוספת משתמש חדש"
              description="יצירת חשבון משתמש ושיוך לתפקיד והרשאות."
              successMessage="משתמש חדש נוסף בהצלחה"
              fields={[
                { name: "name", label: "שם מלא", required: true },
                { name: "email", label: "דוא״ל", type: "email", required: true },
                { name: "phone", label: "טלפון", type: "tel" },
                {
                  name: "role",
                  label: "תפקיד",
                  type: "select",
                  required: true,
                  options: [
                    "מנהל מערכת",
                    "הנהלה",
                    "מנהל כספים",
                    "מנהל מתנדבים",
                    "מנהל קשרי תורמים",
                  ],
                },
                { name: "status", label: "סטטוס", type: "select", options: ["פעיל", "מושעה"] },
                {
                  name: "password",
                  label: "סיסמה זמנית",
                  placeholder: "השאירו ריק ליצירה אוטומטית",
                  helper:
                    "משמשת ליצירת חשבון התחברות אמיתי במערכת. אם תשאירו ריק, תיווצר סיסמה אקראית שתוצג לאחר השמירה.",
                },
              ]}
              onCreate={async (v) => {
                try {
                  const result = await createUser.mutateAsync({
                    accessToken: session?.access_token ?? "",
                    name: v.name,
                    email: v.email,
                    role: v.role as UserRecord["role"],
                    status: (v.status || "פעיל") as UserRecord["status"],
                    password: v.password || undefined,
                  });
                  if (result.generatedPassword) {
                    toast.success(`סיסמה זמנית שנוצרה: ${result.generatedPassword}`, {
                      duration: 20000,
                    });
                  }
                  return { ok: true };
                } catch (err) {
                  return { ok: false, error: err instanceof Error ? err.message : "השמירה נכשלה" };
                }
              }}
            />
          )
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
            <button onClick={() => refetch()} className="text-sm text-brand hover:underline">
              נסה שוב
            </button>
          </div>
        ) : (
          <DataTable
            rows={users ?? []}
            columns={columns}
            searchKeys={["name", "email", "role"]}
            rowActions={(r) => (
              <div className="flex items-center justify-end gap-2">
                <UserEditButton record={r} />
                <UserDeleteButton record={r} />
              </div>
            )}
          />
        )}
      </div>
    </>
  );
}
