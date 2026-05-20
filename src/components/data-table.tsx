import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Filter } from "lucide-react";

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
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys: (keyof T)[];
  toolbar?: ReactNode;
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
        <Button variant="outline" size="sm" className="gap-1">
          <Filter className="h-4 w-4" /> סינון
        </Button>
        <div className="flex-1" />
        {toolbar}
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" /> ייצוא Excel
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`text-right font-medium px-4 py-3 ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-surface-muted/60">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  לא נמצאו תוצאות
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border">
        מציג {filtered.length} מתוך {rows.length} רשומות
      </div>
    </div>
  );
}
