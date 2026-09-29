import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, ScanText, Stethoscope, Activity } from "lucide-react";
import { Btn, Card, Input, Label, Page, RequireAuth, inr } from "@/components/app/ui";
import { DOCTORS, serviceById, slotsFor, triageScore } from "@/lib/data";
import { actions, bookedSlots, useStore, useUser } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book/$hospitalId")({
  validateSearch: (s: Record<string, unknown>): { service?: string | undefined; doctor?: string | undefined } => ({ service: typeof s["service"] === "string" ? (s["service"] as string) : undefined, doctor: typeof s["doctor"] === "string" ? (s["doctor"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Book Appointment — HEALTH ASSIST AI" }, { name: "description", content: "Book a doctor appointment in a few steps." }, { property: "og:title", content: "Book Appointment — HEALTH ASSIST AI" }, { property: "og:description", content: "Pick doctor, date and time slot." }] }),
  component: () => <RequireAuth><BookPage /></RequireAuth>,
});

const patientSchema = z.object({
  name: z.string().trim().min(2, "Enter patient name").max(100),
  age: z.string().regex(/^\d{1,3}$/, "Enter a valid age"),
  gender: z.string().min(1, "Select gender"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone"),
});

function nextDays(n: number) { return Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }); }
const iso = (d: Date) => d.toISOString().slice(0, 10);

function BookPage() {
  const { hospitalId } = Route.useParams();
  const search = Route.useSearch();
  const nav = useNavigate();
  const user = useUser()!;
  const h = useStore((s) => s.hospitals.find((x) => x.id === hospitalId))!;
  const easy = useStore((s) => s.easyfill);
  useStore((s) => s.appointments.length);
  const docs = DOCTORS.filter((d) => d.hospitalId === hospitalId);
  const [step, setStep] = useState(search.doctor ? 1 : 0);
  const [doctorId, setDoctorId] = useState<string>(search.doctor ?? docs[0]!.id);
  const [serviceId, setServiceId] = useState<string>(search.service ?? h.services[0]!.serviceId);
  const [date, setDate] = useState(iso(new Date()));
  const [time, setTime] = useState<string | null>(null);
  const [p, setP] = useState({ name: user.name, age: "", gender: "", phone: user.phone, bloodGroup: "", insuranceId: "", allergies: "", notes: "" });
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const slots = useMemo(() => slotsFor(doctorId, date, bookedSlots(doctorId, date)), [doctorId, date, step]);
  const doctor = docs.find((d) => d.id === doctorId)!;
  const price = h.services.find((s) => s.serviceId === serviceId)?.price ?? 0;
  const triage = triageScore(p.notes, +p.age || 30);

  const fillFromEasy = () => {
    if (!easy) return;
    const e = easy as Partial<Record<string, string>> & { patientName?: string; age?: string; gender?: string; phone?: string; bloodGroup?: string; insuranceId?: string; allergies?: string; medicalHistory?: string };
    setP((x) => ({ ...x, name: e.patientName || x.name, age: e.age || x.age, gender: e.gender || x.gender, phone: e.phone || x.phone, bloodGroup: e.bloodGroup || "", insuranceId: e.insuranceId || "", allergies: e.allergies || "", notes: e.medicalHistory || x.notes }));
    toast.success("Patient details filled from EasyFill");
  };

  const confirm = () => {
    const r = patientSchema.safeParse(p);
    if (!r.success) return setErr(r.error.issues[0]!.message);
    setErr(null);
    const id = actions.book({ userEmail: user.email, hospitalId, doctorId, serviceId, date, time: time!, patient: p });
    setDone(id);
  };

  const STEPS = ["Doctor & service", "Date & time", "Patient details", "Review"];
  return (
    <Page className="max-w-4xl">
      <p className="text-sm text-muted-foreground">Booking at</p>
      <h1 className="text-2xl font-extrabold text-primary">{h.name}</h1>
      <ol className="mt-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => <li key={s} className={cn("rounded-full px-2 py-1.5 text-center text-xs font-semibold", i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i + 1}. <span className="hidden sm:inline">{s}</span></li>)}
      </ol>

      <Card className="mt-6 p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div><Label>Select doctor</Label><div className="grid gap-3 sm:grid-cols-2">
              {docs.map((d) => <button key={d.id} onClick={() => setDoctorId(d.id)} className={cn("flex items-center gap-3 rounded-xl border p-4 text-left", doctorId === d.id && "border-teal ring-2 ring-teal/30")}><Stethoscope className="h-5 w-5 text-teal" /><div><p className="font-semibold">{d.name}</p><p className="text-xs text-muted-foreground">{d.specialty} · Fee {inr(d.fee)}</p></div></button>)}
            </div></div>
            <div><Label htmlFor="svc">Service</Label>
              <select id="svc" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="h-11 w-full rounded-xl border bg-card px-3 text-sm">
                {h.services.map((s) => <option key={s.serviceId} value={s.serviceId}>{serviceById(s.serviceId).name} — {inr(s.price)}</option>)}
              </select></div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-6">
            <div><Label>Date</Label><div className="flex gap-2 overflow-x-auto pb-2">
              {nextDays(10).map((d) => <button key={iso(d)} onClick={() => { setDate(iso(d)); setTime(null); }} className={cn("min-w-[72px] rounded-xl border p-3 text-center", date === iso(d) && "border-teal bg-teal-soft")}><p className="text-xs text-muted-foreground">{d.toLocaleDateString("en-IN", { weekday: "short" })}</p><p className="font-display text-lg font-bold">{d.getDate()}</p><p className="text-xs">{d.toLocaleDateString("en-IN", { month: "short" })}</p></button>)}
            </div></div>
            <div><Label>Available slots · {doctor.name}</Label>
              {slots.length === 0 ? <p className="text-sm text-muted-foreground">No slots on this date. Try another day.</p> :
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{slots.map((s) => <button key={s} onClick={() => setTime(s)} className={cn("rounded-lg border py-2 text-sm font-semibold", time === s ? "bg-primary text-primary-foreground" : "hover:bg-secondary")}>{s}</button>)}</div>}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-teal-soft p-3 text-sm">
              <span className="flex items-center gap-2"><ScanText className="h-4 w-4 text-teal" /> {easy ? "EasyFill data available — autofill in one click." : "Have a filled paper form? Scan it with EasyFill."}</span>
              {easy ? <Btn size="sm" variant="teal" onClick={fillFromEasy}>Autofill from EasyFill</Btn> : <Link to="/easyfill"><Btn size="sm" variant="outline">Open EasyFill</Btn></Link>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <F l="Patient name" v={p.name} on={(v) => setP({ ...p, name: v })} />
              <F l="Age" v={p.age} on={(v) => setP({ ...p, age: v })} />
              <div><Label htmlFor="g">Gender</Label><select id="g" value={p.gender} onChange={(e) => setP({ ...p, gender: e.target.value })} className="h-11 w-full rounded-xl border bg-card px-3 text-sm"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
              <F l="Phone" v={p.phone} on={(v) => setP({ ...p, phone: v })} />
              <F l="Blood group" v={p.bloodGroup} on={(v) => setP({ ...p, bloodGroup: v })} />
              <F l="Insurance ID" v={p.insuranceId} on={(v) => setP({ ...p, insuranceId: v })} />
              <F l="Allergies" v={p.allergies} on={(v) => setP({ ...p, allergies: v })} />
            </div>
            <div><Label htmlFor="notes">Symptoms / notes</Label><textarea id="notes" maxLength={500} value={p.notes} onChange={(e) => setP({ ...p, notes: e.target.value })} rows={3} className="w-full rounded-xl border bg-card p-3 text-sm outline-none focus:border-teal" placeholder="e.g. fever and headache since 2 days" /></div>
            {p.notes && <div className="flex items-center gap-3 rounded-xl border p-3"><Activity className="h-5 w-5 text-teal" /><div className="flex-1"><p className="text-sm font-semibold">AI triage urgency: {triage.level}</p><div className="mt-1 h-2 rounded-full bg-muted"><div className={cn("h-2 rounded-full", triage.score >= 60 ? "bg-destructive" : triage.score >= 35 ? "bg-warning" : "bg-success")} style={{ width: `${triage.score}%` }} /></div></div><span className="font-display font-bold">{triage.score}</span></div>}
            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
          </div>
        )}
        {step === 3 && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[["Hospital", h.name], ["Doctor", `${doctor.name} (${doctor.specialty})`], ["Service", `${serviceById(serviceId).name} · ${inr(price)}`], ["Date & time", `${new Date(date).toDateString()} · ${time}`], ["Patient", `${p.name}, ${p.age} ${p.gender}`], ["Phone", p.phone]].map(([a, b]) => <div key={a} className="rounded-xl bg-muted p-3"><dt className="text-xs text-muted-foreground">{a}</dt><dd className="font-semibold">{b}</dd></div>)}
          </dl>
        )}
        <div className="mt-8 flex justify-between">
          <Btn variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Btn>
          {step < 3 ? <Btn disabled={step === 1 && !time} onClick={() => { if (step === 2) { const r = patientSchema.safeParse(p); if (!r.success) return setErr(r.error.issues[0]!.message); setErr(null); } setStep(step + 1); }}>Continue</Btn> : <Btn variant="teal" onClick={confirm}>Confirm booking</Btn>}
        </div>
      </Card>

      {done && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-md p-8 text-center shadow-elevated animate-in zoom-in-95">
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h2 className="mt-4 text-2xl font-extrabold">Appointment confirmed</h2>
            <p className="mt-2 text-muted-foreground">{doctor.name} · {new Date(date).toDateString()} at {time}</p>
            <p className="mt-4 rounded-xl bg-muted py-3 font-mono text-lg font-bold tracking-widest">{done}</p>
            <p className="text-xs text-muted-foreground">Booking reference ID</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Btn variant="outline" onClick={() => nav({ to: "/appointments" })}>My appointments</Btn>
              <Btn onClick={() => nav({ to: "/easyfill" })}>Fill forms (EasyFill)</Btn>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}

function F({ l, v, on }: { l: string; v: string; on: (v: string) => void }) {
  const id = l.replace(/\s/g, "");
  return <div><Label htmlFor={id}>{l}</Label><Input id={id} value={v} maxLength={100} onChange={(e) => on(e.target.value)} /></div>;
}
