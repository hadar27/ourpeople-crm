import { useMemo } from "react";
import { Flag } from "lucide-react";
import type { GanttPhase } from "@/lib/queries/project-phases";

function toDays(d: string) {
  return Math.floor(new Date(d).getTime() / 86_400_000);
}
function fmt(d: string) {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getFullYear()).slice(2)}`;
}

export function GanttChart({ phases }: { phases: GanttPhase[] }) {
  const { min, max, totalDays, monthMarks } = useMemo(() => {
    const starts = phases.map((p) => toDays(p.start));
    const ends = phases.map((p) => toDays(p.end));
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const totalDays = Math.max(1, max - min);

    // Month tick marks
    const startDate = new Date(min * 86_400_000);
    const endDate = new Date(max * 86_400_000);
    const marks: { label: string; offset: number }[] = [];
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cur <= endDate) {
      const off = ((toDays(cur.toISOString().slice(0, 10)) - min) / totalDays) * 100;
      const label = cur.toLocaleDateString("he-IL", { month: "short", year: "2-digit" });
      marks.push({ label, offset: Math.max(0, off) });
      cur.setMonth(cur.getMonth() + 1);
    }
    return { min, max, totalDays, monthMarks: marks };
  }, [phases]);

  const today = toDays(new Date().toISOString().slice(0, 10));
  const todayOffset = ((today - min) / totalDays) * 100;
  const todayVisible = todayOffset >= 0 && todayOffset <= 100;

  return (
    <div className="w-full" dir="ltr">
      {/* Header timeline */}
      <div className="grid grid-cols-[220px_1fr] gap-3 mb-2">
        <div className="text-xs font-semibold text-muted-foreground">משימה / שלב</div>
        <div className="relative h-6 border-b border-border">
          {monthMarks.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-dashed border-border text-[10px] text-muted-foreground pl-1"
              style={{ left: `${m.offset}%` }}
            >
              {m.label}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 relative">
        {phases.map((p) => {
          const start = toDays(p.start);
          const end = toDays(p.end);
          const left = ((start - min) / totalDays) * 100;
          const width = Math.max(1.5, ((end - start) / totalDays) * 100);
          const delayed = today > end && p.progress < 100;
          const onTrack = !delayed && p.progress >= 50;

          return (
            <div key={p.id} className="grid grid-cols-[220px_1fr] gap-3 items-center">
              <div className="text-xs" dir="rtl">
                <div className="font-semibold truncate flex items-center gap-1">
                  {p.milestone && <Flag className="h-3 w-3 text-brand" />}
                  {p.name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {p.owner} · {fmt(p.start)} → {fmt(p.end)}
                </div>
              </div>
              <div className="relative h-8 bg-surface-muted rounded-md">
                {/* Today line */}
                {todayVisible && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-rose-400/70 z-10"
                    style={{ left: `${todayOffset}%` }}
                  />
                )}
                {p.milestone ? (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rotate-45 bg-brand shadow-soft"
                    style={{ left: `${left + width / 2}%` }}
                    title={`${p.name} · ${p.progress}%`}
                  />
                ) : (
                  <div
                    className={`absolute top-1.5 bottom-1.5 rounded-md border ${
                      delayed
                        ? "bg-rose-100 border-rose-300"
                        : onTrack
                          ? "bg-brand-light border-brand/40"
                          : "bg-amber-50 border-amber-300"
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <div
                      className={`h-full rounded-md ${
                        delayed ? "bg-rose-400" : onTrack ? "bg-brand" : "bg-amber-400"
                      }`}
                      style={{ width: `${p.progress}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brand-deep">
                      {p.progress}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted-foreground" dir="rtl">
        <LegendDot color="bg-brand" label="במסלול" />
        <LegendDot color="bg-amber-400" label="בהתנעה / בעיכוב קל" />
        <LegendDot color="bg-rose-400" label="באיחור" />
        <LegendDot color="bg-rose-400/70" label="היום" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}
