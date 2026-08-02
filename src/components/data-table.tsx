import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Filter, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  searchKeys,
  toolbar,
  getRowHref,
  rowActions,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys: (keyof T)[];
  toolbar?: ReactNode;
  getRowHref?: (row: T) => string | undefined;
  /** Rendered in a trailing cell, outside the row link (e.g. an edit button). */
  rowActions?: (row: T) => ReactNode;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(needle)),
    );
  }, [q, rows, searchKeys]);

  return (
    <div className="rounded-xl bg-card border border-border shadow-soft">
      <div className="p-4 flex flex-wrap items-center gap-3 border-b border-border">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש..."
            className="pr-9 bg-surface-muted border-transparent"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info("פאנל סינון מתקדם בקרוב")}>
          <Filter className="h-4 w-4" /> סינון
        </Button>
        <div className="flex-1" />
        {toolbar}
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => toast.success(`יוצאו ${filtered.length} רשומות לאקסל`)}
        >
          <Download className="h-4 w-4" /> ייצוא Excel
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-muted-foreground sticky top-0">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`text-right font-medium px-4 py-3 ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
              {rowActions && <th className="w-10 text-right font-medium px-4 py-3">פעולות</th>}
              {getRowHref && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const href = getRowHref?.(row);
              const RowWrap = ({ children }: { children: ReactNode }) =>
                href ? (
                  <tr
                    key={i}
                    className="border-t border-border hover:bg-brand/5 transition-colors cursor-pointer group"
                  >
                    {children}
                  </tr>
                ) : (
                  <tr key={i} className="border-t border-border hover:bg-surface-muted/60">
                    {children}
                  </tr>
                );
              return (
                <RowWrap key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                      {href ? (
                        <Link to={href} className="block">
                          {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                        </Link>
                      ) : c.render ? (
                        c.render(row)
                      ) : (
                        String(row[c.key as keyof T] ?? "")
                      )}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                  {href && (
                    <td className="px-2 py-3 text-muted-foreground">
                      <Link to={href} className="block">
                        <ChevronLeft className="h-4 w-4 group-hover:text-brand transition-colors" />
                      </Link>
                    </td>
                  )}
                </RowWrap>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + (getRowHref ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Search className="h-8 w-8 opacity-40" />
                    <div className="font-medium">לא נמצאו תוצאות</div>
                    <div className="text-xs">נסו לשנות את מילות החיפוש או להסיר סינונים</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border flex items-center justify-between">
        <span>
          מציג {filtered.length} מתוך {rows.length} רשומות
        </span>
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 rounded border border-border hover:bg-surface-muted disabled:opacity-40" disabled>
            הקודם
          </button>
          <span className="px-3 py-1 rounded bg-brand text-white">1</span>
          <button className="px-2 py-1 rounded border border-border hover:bg-surface-muted disabled:opacity-40" disabled>
            הבא
          </button>
        </div>
      </div>
    </div>
  );
}
