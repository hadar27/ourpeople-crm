import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pencil, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormField } from "@/components/entity-form-dialog";

export type SaveResult = { ok: boolean; error?: string };

interface RecordEditDialogProps {
  /** Modal title, e.g. "עריכת נרשם" */
  title: string;
  description?: string;
  fields: FormField[];
  /** Pre-filled current record values (all as strings). */
  initialValues: Record<string, string>;
  /** Persist the change. Return { ok:false, error } to show a save error. */
  onSave: (values: Record<string, string>) => SaveResult | Promise<SaveResult>;
  successMessage?: string;
  /** Fields that require an extra confirmation click when changed. */
  sensitiveFields?: string[];
  triggerLabel?: string;
  triggerNode?: ReactNode;
  customValidate?: (values: Record<string, string>) => string | null;
}

export function RecordEditDialog({
  title,
  description,
  fields,
  initialValues,
  onSave,
  successMessage = "השינויים נשמרו בהצלחה",
  sensitiveFields = [],
  triggerLabel = "עריכה",
  triggerNode,
  customValidate,
}: RecordEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Re-prime the form with the current record every time the modal opens.
  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setErrors({});
      setSaveError(null);
      setConfirmed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const changedSensitive = useMemo(
    () =>
      sensitiveFields.filter(
        (f) => (values[f] ?? "").trim() !== (initialValues[f] ?? "").trim(),
      ),
    [values, initialValues, sensitiveFields],
  );

  const setField = (name: string, val: string) => {
    setValues((v) => ({ ...v, [name]: val }));
    setConfirmed(false);
    setSaveError(null);
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.name] ?? "").trim();
      if (f.required && !v) next[f.name] = "שדה חובה";
      else if (v && f.type === "email" && !/^\S+@\S+\.\S+$/.test(v)) next[f.name] = "אימייל לא תקין";
      else if (v && f.pattern && !f.pattern.test(v)) next[f.name] = f.patternMessage ?? "ערך לא תקין";
      else if (v && f.type === "tel" && !f.pattern && !/^\d{10}$/.test(v))
        next[f.name] = "מספר טלפון חייב להכיל 10 ספרות";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("יש לתקן את השדות המסומנים");
      return;
    }
    if (customValidate) {
      const err = customValidate(values);
      if (err) {
        setSaveError(err);
        toast.error(err);
        return;
      }
    }
    if (changedSensitive.length > 0 && !confirmed) {
      setConfirmed(true);
      toast.warning("שינוי רגיש — לחצו שוב על 'שמור שינויים' לאישור");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const res = await onSave(values);
      if (!res.ok) {
        setSaveError(res.error ?? "שמירת השינויים נכשלה. נסו שוב.");
        toast.error(res.error ?? "שמירת השינויים נכשלה. נסו שוב.");
        return;
      }
      toast.success(successMessage);
      setOpen(false);
    } catch {
      setSaveError("שמירת השינויים נכשלה. נסו שוב.");
      toast.error("שמירת השינויים נכשלה. נסו שוב.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerNode ?? (
          <Button variant="outline" size="sm" className="gap-1 border-brand/30 text-brand-deep hover:bg-brand/5">
            <Pencil className="h-3.5 w-3.5" /> {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        dir="rtl"
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border-brand/10 p-0"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-l from-brand-light/40 to-white rounded-t-2xl text-right">
          <DialogTitle className="text-xl font-bold text-brand-deep">{title}</DialogTitle>
          {description && <DialogDescription className="text-sm">{description}</DialogDescription>}
        </DialogHeader>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.name} className={`space-y-1.5 ${f.colSpan === 2 ? "sm:col-span-2" : ""}`}>
              <Label htmlFor={`edit-${f.name}`} className="text-sm font-medium">
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={`edit-${f.name}`}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  rows={3}
                />
              ) : f.type === "select" ? (
                <Select value={values[f.name] ?? ""} onValueChange={(v) => setField(f.name, v)}>
                  <SelectTrigger id={`edit-${f.name}`}>
                    <SelectValue placeholder={f.placeholder ?? "בחר..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`edit-${f.name}`}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  maxLength={f.maxLength}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              )}
              {f.helper && !errors[f.name] && <p className="text-xs text-muted-foreground">{f.helper}</p>}
              {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]}</p>}
            </div>
          ))}
        </div>

        {changedSensitive.length > 0 && (
          <div className="mx-6 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              שינוי רגיש בשדות: {changedSensitive.join(", ")}. {confirmed ? "לחצו 'שמור שינויים' לאישור סופי." : "יידרש אישור נוסף לפני השמירה."}
            </span>
          </div>
        )}

        {saveError && (
          <div className="mx-6 mb-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
            {saveError}
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 rounded-b-2xl gap-2 sm:gap-2 flex-row-reverse">
          <Button onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-deep min-w-32">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" /> שומר...
              </>
            ) : (
              "שמור שינויים"
            )}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
