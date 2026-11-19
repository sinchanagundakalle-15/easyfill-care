import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { Btn, Card, Input, Label, Logo } from "@/components/app/ui";
import { actions } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({ redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined }),
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
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const go = (role?: string) => { window.location.href = redirect ?? (role === "admin" ? "/admin" : "/find"); };
  const cloudSignIn = async (provider: "google" | "lovable") => {
    setErr(null);
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) setErr(result.error.message);
    else if (!result.redirected) go();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    try {
      if (mode === "signup") {
        const r = signupSchema.safeParse(f);
        if (!r.success) return setErr(r.error.issues[0]!.message);
        setBusy(true);
        const { data, error } = await supabase.auth.signUp({
          email: r.data.email,
          password: r.data.password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: r.data.name, phone: r.data.phone } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("login");
          setF({ ...f, password: "", confirm: "" });
        } else {
          toast.success("Account created. Welcome!");
          go();
        }
      } else {
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
        if (!error) {
          toast.success("Welcome back!");
          go();
          return;
        }
        // Local accounts remain available only for the explicitly labeled demo flow.
        if (!f.email.trim().toLowerCase().endsWith("@healthassist.ai")) throw error;
        const u = actions.login(f.email.trim(), f.password);
        toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
        go(u.role);
      }
    } catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
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
            <Btn type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}</Btn>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or continue with<div className="h-px flex-1 bg-border" /></div>
          <div className="grid gap-2">
            <Btn type="button" variant="outline" onClick={() => void cloudSignIn("google")}><GoogleMark /> Continue with Google</Btn>
            <Btn type="button" variant="outline" onClick={() => void cloudSignIn("lovable")}><LovableMark /> Continue with Lovable</Btn>
          </div>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />demo accounts<div className="h-px flex-1 bg-border" /></div>
          <div className="grid grid-cols-2 gap-2">
            <Btn type="button" variant="outline" onClick={() => demo()}>Demo patient</Btn>
            <Btn type="button" variant="outline" onClick={() => demo(true)}>Demo admin</Btn>
          </div>
          <Btn variant="ghost" className="mt-3 w-full" onClick={() => nav({ to: "/" })}>Back to home</Btn>
        </Card>
      </div>
    </div>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>;
}
