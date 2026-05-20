import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("sarah@ourpeople.org");
  const [password, setPassword] = useState("••••••••");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  };

  return (
    <div dir="rtl" className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Branding pane */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-brand-gradient text-white overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <img src={logo} alt="Our People" className="h-12 w-12 bg-white rounded-xl p-1.5" width={48} height={48} />
          <div>
            <div className="text-xl font-bold">Our People</div>
            <div className="text-sm text-white/80">Nonprofit Management Suite</div>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">מערכת אחת לניהול כל הפעילות העמותתית.</h1>
          <p className="mt-4 text-white/85 leading-relaxed">
            תורמים, מתנדבים, פרויקטים, כספים ו-KPI במקום אחד. בנוי לעבודה אמיתית של ארגונים חברתיים.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <Stat n="12K+" t="נרשמים" />
            <Stat n="850" t="מתנדבים" />
            <Stat n="₪14M" t="גיוס שנתי" />
          </div>
        </div>
        <div className="relative text-xs text-white/70 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> חיבור מאובטח · הרשאות מבוססות תפקיד
        </div>
      </div>

      {/* Form pane */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <form onSubmit={submit} className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <img src={logo} alt="Our People" className="h-10 w-10" width={40} height={40} />
            <div className="font-bold text-lg">Our People</div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">ברוכים השבים</h2>
            <p className="text-sm text-muted-foreground mt-1">היכנסו לחשבון הניהול שלכם.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">דוא״ל</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-9" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-9" />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox defaultChecked /> זכור אותי
            </label>
            <a className="text-brand hover:underline cursor-pointer">שכחתי סיסמה</a>
          </div>

          <Button type="submit" className="w-full h-11 bg-brand hover:bg-brand-deep">כניסה למערכת</Button>

          <p className="text-xs text-center text-muted-foreground">
            המערכת מוגנת ועובדת על בסיס תפקידים והרשאות.{" "}
            <Link to="/dashboard" className="text-brand hover:underline">דלגו לדמו</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Stat({ n, t }: { n: string; t: string }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur p-3 border border-white/15">
      <div className="text-xl font-bold">{n}</div>
      <div className="text-[11px] text-white/80">{t}</div>
    </div>
  );
}
