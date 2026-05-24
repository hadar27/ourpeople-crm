import { useState, type ReactNode } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FieldType = "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";

export interface FormField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  colSpan?: 1 | 2;
}

interface EntityFormDialogProps {
  triggerLabel: string;
  title: string;
  description?: string;
  fields: FormField[];
  successMessage: string;
  triggerNode?: ReactNode;
}

export function EntityFormDialog({
  triggerLabel,
  title,
  description,
  fields,
  successMessage,
  triggerNode,
}: EntityFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (name: string, val: string) => {
    setValues((v) => ({ ...v, [name]: val }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.name] ?? "").trim();
      if (f.required && !v) next[f.name] = "שדה חובה";
      else if (v && f.type === "email" && !/^\S+@\S+\.\S+$/.test(v)) next[f.name] = "אימייל לא תקין";
      else if (v && f.type === "tel" && !/^[\d\-+\s()]{7,}$/.test(v)) next[f.name] = "טלפון לא תקין";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("יש למלא את כל שדות החובה");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    toast.success(successMessage);
    setValues({});
    setErrors({});
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerNode ?? (
          <Button className="bg-brand hover:bg-brand-deep gap-1">
            <Plus className="h-4 w-4" /> {triggerLabel}
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
          <DialogClose className="absolute left-4 top-4 rounded-full p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.name} className={`space-y-1.5 ${f.colSpan === 2 ? "sm:col-span-2" : ""}`}>
              <Label htmlFor={f.name} className="text-sm font-medium">
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                  rows={3}
                />
              ) : f.type === "select" ? (
                <Select value={values[f.name] ?? ""} onValueChange={(v) => setField(f.name, v)}>
                  <SelectTrigger id={f.name}>
                    <SelectValue placeholder={f.placeholder ?? "בחר..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              )}
              {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]}</p>}
            </div>
          ))}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 rounded-b-2xl gap-2 sm:gap-2 flex-row-reverse">
          <Button onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-deep min-w-24">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> שומר...</> : "שמור"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
