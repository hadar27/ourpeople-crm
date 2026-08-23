import { useEffect } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  HandCoins,
  Gift,
  FolderKanban,
  Truck,
  Wallet,
  Bell,
  BarChart3,
  ShieldCheck,
  Search,
  LogOut,
  ChevronDown,
  Home,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAlerts } from "@/lib/business-rules";
import { useSession, signOut } from "@/lib/auth";
import { useCanEdit, useCurrentUser, type EditableModule } from "@/lib/permissions";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const nav = [
  { to: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
  { to: "/participants", label: "נרשמים", icon: Users },
  { to: "/volunteers", label: "מתנדבים", icon: HeartHandshake },
  { to: "/donors", label: "תורמים", icon: HandCoins },
  { to: "/donations", label: "תרומות", icon: Gift, module: "donations" },
  { to: "/families", label: "מוטבים ומשפחות", icon: Home },
  { to: "/projects", label: "פרויקטים", icon: FolderKanban },
  { to: "/suppliers", label: "ספקים", icon: Truck },
  { to: "/finance", label: "כספים ERP", icon: Wallet, module: "finance" },
  { to: "/alerts", label: "התראות", icon: Bell },
  { to: "/reports", label: "KPI ודוחות", icon: BarChart3 },
  { to: "/users", label: "משתמשים והרשאות", icon: ShieldCheck, module: "users" },
] satisfies { to: string; label: string; icon: typeof LayoutDashboard; module?: EditableModule }[];

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const alertCount = useAlerts().filter((a) => a.severity !== "נמוכה").length;
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const user = useCurrentUser();
  const moduleAccess: Partial<Record<EditableModule, boolean>> = {
    donations: useCanEdit("donations"),
    finance: useCanEdit("finance"),
    users: useCanEdit("users"),
  };
  const visibleNav = nav.filter((item) => !item.module || moduleAccess[item.module]);

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login" });
    }
  }, [loading, session, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (loading || !session) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-[color:var(--surface)]"
      >
        <div className="text-sm text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex w-full bg-[color:var(--surface)]">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-l border-border bg-sidebar flex flex-col">
        <div className="h-20 flex items-center justify-center px-5 border-b border-sidebar-border bg-white">
          <Link to="/dashboard" className="block">
            <img src={logo} alt="Our People — אנשים שלנו" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            const showBadge = item.to === "/alerts" && alertCount > 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-brand text-brand-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-[-2px]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center gap-4 px-6 sticky top-0 z-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש מהיר במערכת..."
              className="pr-9 bg-surface-muted border-transparent"
            />
          </div>
          <Link
            to="/alerts"
            className="relative p-2 rounded-lg hover:bg-secondary text-foreground"
            aria-label="התראות"
          >
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 h-4 min-w-[16px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                {alertCount}
              </span>
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pr-4 border-r border-border outline-none">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-brand text-brand-foreground text-xs">
                    {user ? initials(user.name) : ""}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm leading-tight text-right">
                  <div className="font-semibold">{user?.name ?? ""}</div>
                  <div className="text-xs text-muted-foreground">{user?.role ?? ""}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                התנתקות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
