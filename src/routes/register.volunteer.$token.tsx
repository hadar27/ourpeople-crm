import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PHONE_PATTERN } from "@/lib/edit-forms";

export const Route = createFileRoute("/register/volunteer/$token")({
  component: VolunteerRegistrationPage,
});

type ProjectInfo = {
  id: string;
  name: string;
};

type FormData = {
  name: string;
  availability: string;
  hours: string;
  skills: string;
  phone: string;
  email: string;
  notes: string;
};

function VolunteerRegistrationPage() {
  const { token } = useParams({ from: "/register/volunteer/$token" });
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    availability: "",
    hours: "0",
    skills: "",
    phone: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // Find registration link by token
        const { data: links, error: linkError } = await supabase
          .from("project_registration_links")
          .select("project_id, projects(id, name)")
          .eq("link_token", token)
          .eq("link_type", "volunteer")
          .single();

        if (linkError || !links) {
          setError("קישור זה אינו תקף או פג תוקף.");
          setLoading(false);
          return;
        }

        const projectInfo = (links as any).projects;
        if (!projectInfo) {
          setError("הפרויקט לא נמצא.");
          setLoading(false);
          return;
        }

        setProject(projectInfo);
        setLoading(false);
      } catch (err) {
        setError("אירעה שגיאה בטעינת הדף.");
        setLoading(false);
      }
    };

    fetchProject();
  }, [token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("יש למלא את השם");
      return;
    }

    if (!formData.availability.trim()) {
      toast.error("יש למלא את הזמינות");
      return;
    }

    if (formData.phone.trim() && !PHONE_PATTERN.test(formData.phone)) {
      toast.error("טלפון חייב להכיל 10 ספרות");
      return;
    }

    if (!project) {
      toast.error("שגיאה: הפרויקט לא נמצא");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("pending_volunteer_registrations")
        .insert({
          project_id: project.id,
          registration_token: token,
          name: formData.name,
          availability: formData.availability,
          hours: parseFloat(formData.hours) || 0,
          skills: formData.skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
          phone: formData.phone || null,
          email: formData.email || null,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast.success("ההרשמה התקבלה בהצלחה! נציג הארגון יבדוק אותה בקרוב.");
      setFormData({
        name: "",
        availability: "",
        hours: "0",
        skills: "",
        phone: "",
        email: "",
        notes: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate({ to: "/" });
      }, 2000);
    } catch (err) {
      toast.error("שגיאה בשליחת הטופס. אנא נסה שוב.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="text-muted-foreground">טוען הטופס...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="card-elevated max-w-md w-full p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h1 className="text-lg font-semibold mb-2">קישור לא תקף</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "קישור זה אינו תקף או פג תוקף."}
          </p>
          <Button
            onClick={() => navigate({ to: "/" })}
            className="w-full bg-brand hover:bg-brand-deep"
          >
            חזור לעמוד הבית
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card-elevated p-8">
          <h1 className="text-3xl font-bold mb-2">הצטרפות כמתנדב/ת</h1>
          <p className="text-muted-foreground mb-2">פרויקט: {project.name}</p>
          <p className="text-sm text-muted-foreground mb-8">
            תודה על עניינך להצטרף! אנא מלא את הטופס הבא כדי להתחיל.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">שם *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="שמך המלא"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0501234567"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">דוא״ל</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="hours">שעות לשבוע</Label>
                <Input
                  id="hours"
                  name="hours"
                  type="number"
                  value={formData.hours}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="availability">זמינות *</Label>
              <Input
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                placeholder="למשל: בוקר + סופי שבוע"
                required
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                אנא ציין את השעות והימים שאתה/ה זמין/ה
              </p>
            </div>

            <div>
              <Label htmlFor="skills">כישורים</Label>
              <Input
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="למשל: הדרכה, עברית, ספורט (הפרד בפסיקים)"
                disabled={submitting}
              />
            </div>

            <div>
              <Label htmlFor="notes">הערות נוספות</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="ספר לנו עוד על עצמך..."
                rows={4}
                disabled={submitting}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-brand hover:bg-brand-deep"
              >
                {submitting ? "שולח..." : "הצטרפות"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => navigate({ to: "/" })}
              >
                ביטול
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
