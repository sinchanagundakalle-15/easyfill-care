import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";
import { HeartPulse, LogOut, Star, Type, Menu } from "lucide-react";
import { useState } from "react";
import { actions, useHydrated, useStore, useUser } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Btn({ variant = "primary", size = "md", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "teal" | "danger"; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" && "h-9 px-3 text-sm", size === "md" && "h-11 px-5 text-sm", size === "lg" && "h-13 px-7 text-base py-3.5",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90 shadow-card",
        variant === "teal" && "bg-teal text-primary-foreground hover:opacity-90 shadow-card",
        variant === "outline" && "border border-input bg-card text-foreground hover:bg-secondary",
        variant === "ghost" && "text-foreground hover:bg-secondary",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:opacity-90",
        className,
      )}
    />
  );
}

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cn("h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15", className)} />;
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</label>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card shadow-card", className)}>{children}</div>;
}

export function Stars({ rating, reviews }: { rating: number; reviews?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold">
      <Star className="h-4 w-4 fill-warning text-warning" /> {rating.toFixed(1)}
      {reviews != null && <span className="font-normal text-muted-foreground">({reviews.toLocaleString()})</span>}
    </span>
  );
}

export function DemoBadge() {
  return <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-foreground">Demo Data</span>;
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-primary-foreground shadow-card"><HeartPulse className="h-5 w-5" /></span>
      <span className="font-display text-lg font-bold tracking-tight text-primary">HEALTH ASSIST <span className="text-teal">AI</span></span>
    </Link>
  );
}

const NAV = [
  { to: "/find", label: "Find Care" },
  { to: "/compare", label: "Compare" },
  { to: "/appointments", label: "My Appointments" },
  { to: "/easyfill", label: "EasyFill" },
] as const;

export function Header() {
  const user = useUser();
  const nav = useNavigate();
  const large = useStore((s) => s.largeText);
  const cmp = useStore((s) => s.compare.length);
  const [open, setOpen] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("large-text", large); }, [large]);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "!text-primary bg-secondary" }}>
              {n.label}{n.to === "/compare" && cmp > 0 && <span className="ml-1 rounded-full bg-teal px-1.5 text-[10px] text-primary-foreground">{cmp}</span>}
            </Link>
          ))}
          {user?.role === "admin" && <Link to="/admin" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary" activeProps={{ className: "!text-primary bg-secondary" }}>Admin</Link>}
        </nav>
        <div className="flex items-center gap-2">
          <button aria-label="Toggle large high-contrast text" onClick={actions.toggleLargeText} className={cn("grid h-9 w-9 place-items-center rounded-lg border", large && "bg-primary text-primary-foreground")}><Type className="h-4 w-4" /></button>
          {user ? (
            <>
              <span className="hidden text-sm font-medium lg:inline">Hi, {user.name.split(" ")[0]}</span>
              <Btn size="sm" variant="outline" onClick={() => { actions.logout(); nav({ to: "/" }); }}><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span></Btn>
            </>
          ) : (
            <Link to="/auth"><Btn size="sm">Sign in</Btn></Link>
          )}
          <button aria-label="Menu" className="grid h-9 w-9 place-items-center rounded-lg border md:hidden" onClick={() => setOpen(!open)}><Menu className="h-4 w-4" /></button>
        </div>
      </div>
      {open && (
        <div className="border-t px-4 py-2 md:hidden">
          {NAV.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium">{n.label}</Link>)}
          {user?.role === "admin" && <Link to="/admin" className="block rounded-lg px-3 py-2 text-sm font-medium">Admin</Link>}
        </div>
      )}
    </header>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-dvh">
      <Header />
      <main className={cn("mx-auto max-w-7xl px-4 py-8", className)}>{children}</main>
    </div>
  );
}

export function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const hydrated = useHydrated();
  const user = useUser();
  const nav = useNavigate();
  useEffect(() => {
    if (hydrated && !user) nav({ to: "/auth", search: { redirect: window.location.pathname } });
  }, [hydrated, user, nav]);
  if (!hydrated || !user) return <div className="grid min-h-dvh place-items-center text-muted-foreground">Loading…</div>;
  if (admin && user.role !== "admin") return <Page><Card className="p-10 text-center"><h2 className="text-xl font-bold">Admin access required</h2><p className="mt-2 text-muted-foreground">Sign in with admin@healthassist.ai / admin123.</p></Card></Page>;
  return <>{children}</>;
}

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
