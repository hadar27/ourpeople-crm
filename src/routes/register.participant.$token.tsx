import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { validateIsraeliId } from "@/lib/validation";
import { PHONE_PATTERN } from "@/lib/edit-forms";

export const Route = createFileRoute("/register/participant/$token")({
  component: ParticipantRegistrationPage,
});

type ProjectInfo = {
  id: string;
  name: string;
};

type FormData = {
  name: string;
  idNumber: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  sex: string;
  parentName: string;
  parentPhone: string;
  hasAllergyWarning: boolean;
  foodAllergies: string;
  registrationDate: string;
  documentsComplete: boolean;
  isNewImmigrant: boolean;
  immigrationYear: string;
  address: string;
  city: string;
  notes: string;
};

function ParticipantRegistrationPage() {
  const { token } = useParams({ from: "/register/participant/$token" });
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    idNumber: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    sex: "",
    parentName: "",
    parentPhone: "",
    hasAllergyWarning: false,
    foodAllergies: "",
    registrationDate: new Date().toISOString().split("T")[0],
    documentsComplete: false,
    isNewImmigrant: false,
    immigrationYear: "",
    address: "",
    city: "",
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
          .eq("link_type", "participant")
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("יש למלא את השם");
      return;
    }

    if (!formData.idNumber.trim()) {
      toast.error("יש למלא את תעודת הזהות");
      return;
    }

    if (!validateIsraeliId(formData.idNumber)) {
      toast.error("ת.ז. לא תקינה");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("יש למלא את מספר הטלפון");
      return;
    }

    if (!PHONE_PATTERN.test(formData.phone)) {
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
        .from("pending_participant_registrations")
        .insert({
          project_id: project.id,
          registration_token: token,
          name: formData.name,
          id_number: formData.idNumber,
          phone: formData.phone,
          email: formData.email || null,
          date_of_birth: formData.dateOfBirth || null,
          sex: formData.sex || null,
          parent_name: formData.parentName || null,
          parent_phone: formData.parentPhone || null,
          food_allergies: formData.hasAllergyWarning ? formData.foodAllergies || null : null,
          registration_date: formData.registrationDate,
          status: "ממתין לאישור",
          payment_status: "לא שולם",
          documents_complete: formData.documentsComplete,
          is_new_immigrant: formData.isNewImmigrant,
          immigration_year: formData.immigrationYear ? parseInt(formData.immigrationYear) : null,
          address: formData.address || null,
          city: formData.city || null,
          source: "אתר",
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast.success("ההרשמה התקבלה בהצלחה! נציג הארגון יבדוק אותה בקרוב.");
      setFormData({
        name: "",
        idNumber: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        sex: "",
        parentName: "",
        parentPhone: "",
        hasAllergyWarning: false,
        foodAllergies: "",
        registrationDate: new Date().toISOString().split("T")[0],
        documentsComplete: false,
        isNewImmigrant: false,
        immigrationYear: "",
        address: "",
        city: "",
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
          <h1 className="text-3xl font-bold mb-2">הרשמה כמשתתף/ת</h1>
          <p className="text-muted-foreground mb-2">פרויקט: {project.name}</p>
          <p className="text-sm text-muted-foreground mb-8">
            תודה על עניינך! אנא מלא את הטופס הבא כדי להירשם.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                מידע בסיסי
              </h3>
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
                  <Label htmlFor="idNumber">תעודת זהות *</Label>
                  <Input
                    id="idNumber"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="123456789"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">טלפון *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0501234567"
                    required
                    disabled={submitting}
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">תאריך לידה</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="sex">מין</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value) => handleSelectChange("sex", value)}
                  >
                    <SelectTrigger disabled={submitting}>
                      <SelectValue placeholder="בחר מין" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="זכר">זכר</SelectItem>
                      <SelectItem value="נקבה">נקבה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentName">שם הורה/אפוטרופוס</Label>
                  <Input
                    id="parentName"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    placeholder="שם ההורה"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="parentPhone">טלפון הורה</Label>
                  <Input
                    id="parentPhone"
                    name="parentPhone"
                    type="tel"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="0501234567"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registrationDate">תאריך הרשמה</Label>
                  <Input
                    id="registrationDate"
                    name="registrationDate"
                    type="date"
                    value={formData.registrationDate}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="city">עיר</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="תל אביב"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="רחוב וביתבן"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Document Status */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                מידע נוסף
              </h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="documentsComplete"
                  name="documentsComplete"
                  checked={formData.documentsComplete}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      documentsComplete: checked as boolean,
                    }))
                  }
                  disabled={submitting}
                />
                <Label
                  htmlFor="documentsComplete"
                  className="cursor-pointer font-normal"
                >
                  המסמכים שלי הושלמו
                </Label>
              </div>
            </div>

            {/* Immigration Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                מידע כללי
              </h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isNewImmigrant"
                  name="isNewImmigrant"
                  checked={formData.isNewImmigrant}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      isNewImmigrant: checked as boolean,
                    }));
                  }}
                  disabled={submitting}
                />
                <Label
                  htmlFor="isNewImmigrant"
                  className="cursor-pointer font-normal"
                >
                  אני עולה חדש/ה
                </Label>
              </div>

              {formData.isNewImmigrant && (
                <div>
                  <Label htmlFor="immigrationYear">שנת הגעה</Label>
                  <Input
                    id="immigrationYear"
                    name="immigrationYear"
                    type="number"
                    value={formData.immigrationYear}
                    onChange={handleChange}
                    placeholder="2022"
                    min="1900"
                    max={new Date().getFullYear()}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>

            {/* Food Allergies */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                אלרגיות ודיאטה
              </h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasAllergyWarning"
                  name="hasAllergyWarning"
                  checked={formData.hasAllergyWarning}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      hasAllergyWarning: checked as boolean,
                    }));
                  }}
                  disabled={submitting}
                />
                <Label
                  htmlFor="hasAllergyWarning"
                  className="cursor-pointer font-normal"
                >
                  יש לי אלרגיה לאוכל
                </Label>
              </div>

              {formData.hasAllergyWarning && (
                <div>
                  <Label htmlFor="foodAllergies">פרטי האלרגיה</Label>
                  <Textarea
                    id="foodAllergies"
                    name="foodAllergies"
                    value={formData.foodAllergies}
                    onChange={handleChange}
                    placeholder="תאר את האלרגיות והתגובות..."
                    rows={3}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">הערות נוספות</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="ספר לנו עוד על עצמך או על צורכיך..."
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
                {submitting ? "שולח..." : "הרשמה"}
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
