import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { APP_VERSION } from "@/lib/version";

function NotFoundComponent() {
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[color:var(--surface)] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-brand-deep">404</h1>
        <h2 className="mt-4 text-xl font-semibold">העמוד לא נמצא</h2>
        <p className="mt-2 text-sm text-muted-foreground">העמוד שחיפשת אינו קיים או הוסר.</p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
          >
            חזרה ללוח הבקרה
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[color:var(--surface)] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">אירעה תקלה</h1>
        <p className="mt-2 text-sm text-muted-foreground">לא הצלחנו לטעון את העמוד. נסו לרענן.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-lg bg-brand px-4 py-2 text-sm text-brand-foreground"
          >
            נסה שוב
          </button>
          <a href="/" className="rounded-lg border border-border bg-card px-4 py-2 text-sm">דף הבית</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Our People — פלטפורמת ניהול עמותה" },
      { name: "description", content: "מערכת ERP/CRM לניהול עמותה: תורמים, תרומות, מתנדבים, פרויקטים וכספים." },
      { property: "og:title", content: "Our People — פלטפורמת ניהול עמותה" },
      { name: "twitter:title", content: "Our People — פלטפורמת ניהול עמותה" },
      { property: "og:description", content: "מערכת ERP/CRM לניהול עמותה: תורמים, תרומות, מתנדבים, פרויקטים וכספים." },
      { name: "twitter:description", content: "מערכת ERP/CRM לניהול עמותה: תורמים, תרומות, מתנדבים, פרויקטים וכספים." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d1d109f9-071a-4007-bf36-d9da0d0a1632/id-preview-0b34e04d--a108093e-e792-4986-b02b-fafd4c9d27b5.lovable.app-1785661124458.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d1d109f9-071a-4007-bf36-d9da0d0a1632/id-preview-0b34e04d--a108093e-e792-4986-b02b-fafd4c9d27b5.lovable.app-1785661124458.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    console.log(`Our People CRM — v${APP_VERSION}`);
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
