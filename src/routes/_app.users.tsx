import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EmptyState } from "@/components/detail-kit";
import { useUsers, type UserRecord } from "@/lib/queries/users";
import { UserEditButton, UserDeleteButton } from "@/components/module-edit-dialogs";
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
  const canAccess = useCanEdit("users");

  if (!canAccess) {
    return (
      <>
        <PageHeader title="משתמשים והרשאות" description="ניהול משתמשי המערכת ותפקידיהם." />
        <div className="card-elevated p-16">
          <EmptyState
            text="אין לך הרשאה לצפייה בעמוד זה"
            hint="גישה למשתמשים והרשאות מוגבלת למנהל מערכת."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="משתמשים והרשאות" description="ניהול משתמשי המערכת ותפקידיהם." />
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
