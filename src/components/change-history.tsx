import { History } from "lucide-react";
import { SectionCard, EmptyState } from "@/components/detail-kit";
import { useAuditTrail, type AuditEntry } from "@/lib/records-store";

function formatAt(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("he-IL")} ${d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
}

export function ChangeHistoryList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState text="לא בוצעו שינויים ברשומה" hint="כל עריכה תתועד כאן עם המשתמש, התאריך והערכים הקודמים." />;
  }
  return (
    <ul className="space-y-3">
      {entries.map((e) => (
        <li key={e.id} className="rounded-lg bg-surface-muted p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">{e.actor}</span> · {e.entityType} · {e.entityId}
            </span>
            <span>{formatAt(e.at)}</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {e.changes.map((c, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{c.field}:</span>
                <span className="line-through text-muted-foreground">{c.from}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-brand-deep font-medium">{c.to}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** "היסטוריית שינויים" card for a single record. */
export function ChangeHistory({ entityId, className = "" }: { entityId: string; className?: string }) {
  const entries = useAuditTrail(entityId);
  return (
    <SectionCard title="היסטוריית שינויים" icon={<History className="h-4 w-4" />} className={className}>
      <ChangeHistoryList entries={entries} />
    </SectionCard>
  );
}
