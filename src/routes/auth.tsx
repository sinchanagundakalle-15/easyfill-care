import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Btn, Card, Input, Label, Logo } from "@/components/app/ui";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({ meta: [{ title: "Sign in — HEALTH ASSIST AI" }, { name: "description", content: "Sign in or create your HEALTH ASSIST AI account." }, { property: "og:title", content: "Sign in — HEALTH ASSIST AI" }, { property: "og:description", content: "Access nearby hospitals, bookings and EasyFill." }] }),
  component: AuthPage,
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

function AuthPage() {
  const { redirect } = Route.useSearch();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const go = (role?: string) => { window.location.href = redirect ?? (role === "admin" ? "/admin" : "/find"); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    try {
      if (mode === "signup") {
        const r = signupSchema.safeParse(f);
        if (!r.success) return setErr(r.error.issues[0].message);
        actions.signup({ name: r.data.name, email: r.data.email, phone: r.data.phone, password: r.data.password });
        toast.success("Account created. Welcome!");
        go();
      } else {
        const u = actions.login(f.email.trim(), f.password);
        toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
        go(u.role);
      }
    } catch (x) { setErr((x as Error).message); }
  };
  const demo = (admin?: boolean) => { const u = actions.login(admin ? "admin@healthassist.ai" : "demo@healthassist.ai", admin ? "admin123" : "demo123"); toast.success("Signed in with demo account"); go(u.role); };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand p-12 text-primary-foreground lg:flex">
        <div className="rounded-xl bg-card/95 p-2 w-fit"><Logo /></div>
        <div><h2 className="text-4xl font-extrabold">Find nearby healthcare services.<br />Compare. Book. Fill with ease.</h2><p className="mt-4 max-w-md opacity-80">One account for hospital search, appointment booking and accessible form filling.</p></div>
        <p className="text-sm opacity-70">Hospital Service Comparison & EasyFill</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <div className="lg:hidden mb-6"><Logo /></div>
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setErr(null); }} className={`rounded-lg py-2 text-sm font-semibold ${mode === m ? "bg-card shadow-card" : "text-muted-foreground"}`}>{m === "login" ? "Login" : "Sign Up"}</button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && <div><Label htmlFor="n">Full name</Label><Input id="n" value={f.name} onChange={set("name")} /></div>}
            <div><Label htmlFor="e">Email</Label><Input id="e" type="email" value={f.email} onChange={set("email")} /></div>
            {mode === "signup" && <div><Label htmlFor="p">Phone</Label><Input id="p" inputMode="numeric" value={f.phone} onChange={set("phone")} /></div>}
            <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" value={f.password} onChange={set("password")} /></div>
            {mode === "signup" && <div><Label htmlFor="c">Confirm password</Label><Input id="c" type="password" value={f.confirm} onChange={set("confirm")} /></div>}
            {err && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
            <Btn type="submit" className="w-full">{mode === "login" ? "Login" : "Create account"}</Btn>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="outline" onClick={() => demo()}>Demo patient</Btn>
            <Btn variant="outline" onClick={() => demo(true)}>Demo admin</Btn>
          </div>
          <Btn variant="ghost" className="mt-3 w-full" onClick={() => nav({ to: "/" })}>Back to home</Btn>
        </Card>
      </div>
    </div>
  );
}
