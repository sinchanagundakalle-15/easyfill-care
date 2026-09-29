import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Btn, Card, Page, RequireAuth } from "@/components/app/ui";
import { DOCTORS, serviceById, slotsFor } from "@/lib/data";
import { actions, bookedSlots, useStore, useUser } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/appointments")({
  head: () => ({ meta: [{ title: "My Appointments — HEALTH ASSIST AI" }, { name: "description", content: "View, cancel and reschedule your appointments." }, { property: "og:title", content: "My Appointments — HEALTH ASSIST AI" }, { property: "og:description", content: "Your appointment calendar." }] }),
  component: () => <RequireAuth><Appts /></RequireAuth>,
});

function Appts() {
  const user = useUser()!;
  const all = useStore((s) => s.appointments);
  const hospitals = useStore((s) => s.hospitals);
  const mine = all.filter((a) => a.userEmail === user.email).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [resch, setResch] = useState<string | null>(null);
  const [rDate, setRDate] = useState(new Date().toISOString().slice(0, 10));

  const first = month.getDay(), days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const byDate = (d: number) => { const k = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; return mine.filter((a) => a.date === k && a.status === "confirmed"); };

  return (
    <Page>
      <h1 className="text-3xl font-extrabold text-primary">My Appointments</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card className="p-5 lg:self-start">
          <div className="flex items-center justify-between"><button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><p className="font-bold">{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p><button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
            {"SMTWTFS".split("").map((d, i) => <span key={i} className="py-1 font-semibold text-muted-foreground">{d}</span>)}
            {Array.from({ length: first }).map((_, i) => <span key={"e" + i} />)}
            {Array.from({ length: days }, (_, i) => i + 1).map((d) => { const a = byDate(d); return <span key={d} className={cn("aspect-square rounded-lg py-2 text-sm", a.length && "bg-primary font-bold text-primary-foreground")} title={a.map((x) => x.time).join(", ")}>{d}</span>; })}
          </div>
        </Card>
        <div className="space-y-4">
          {mine.length === 0 && <Card className="p-10 text-center"><CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-semibold">No appointments yet</p><Link to="/find"><Btn className="mt-4">Find a hospital</Btn></Link></Card>}
          {mine.map((a) => {
            const h = hospitals.find((x) => x.id === a.hospitalId)!, d = DOCTORS.find((x) => x.id === a.doctorId)!;
            return (
              <Card key={a.id} className={cn("p-5", a.status === "cancelled" && "opacity-60")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-mono text-xs text-muted-foreground">{a.id}</p><h3 className="font-bold">{h.name}</h3><p className="text-sm text-muted-foreground">{d.name} · {serviceById(a.serviceId).name}</p><p className="mt-1 text-sm font-semibold">{new Date(a.date).toDateString()} · {a.time} · {a.patient.name}</p></div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", a.status === "confirmed" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>{a.status}</span>
                </div>
                {a.status === "confirmed" && (
                  <div className="mt-4 flex gap-2">
                    <Btn size="sm" variant="outline" onClick={() => setResch(resch === a.id ? null : a.id)}>Reschedule</Btn>
                    <Btn size="sm" variant="danger" onClick={() => { actions.cancel(a.id); toast.success("Appointment cancelled"); }}>Cancel</Btn>
                  </div>
                )}
                {resch === a.id && (
                  <div className="mt-4 rounded-xl bg-muted p-3">
                    <input type="date" value={rDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setRDate(e.target.value)} className="h-10 rounded-lg border bg-card px-2 text-sm" aria-label="New date" />
                    <div className="mt-2 flex flex-wrap gap-2">{slotsFor(a.doctorId, rDate, bookedSlots(a.doctorId, rDate)).map((s) => <button key={s} onClick={() => { actions.reschedule(a.id, rDate, s); setResch(null); toast.success("Rescheduled"); }} className="rounded-lg border bg-card px-3 py-1 text-sm font-semibold hover:bg-secondary">{s}</button>)}</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </Page>
  );
}
