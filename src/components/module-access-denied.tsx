import { EmptyState } from "@/components/detail-kit";
import { PageHeader } from "@/components/page-header";

export function ModuleAccessDenied({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="card-elevated p-16">
        <EmptyState
          text="אין לך הרשאה לצפייה בעמוד זה"
          hint="התוכן מוצג בהתאם להרשאות התפקיד שלך במערכת."
        />
      </div>
    </>
  );
}
