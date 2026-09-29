import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, CalendarCheck, Users, IndianRupee } from "lucide-react";
import { Btn, Card, DemoBadge, Input, Page, RequireAuth, inr } from "@/components/app/ui";
import { DOCTORS, serviceById } from "@/lib/data";
import { actions, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — HEALTH ASSIST AI" }, { name: "description", content: "Manage hospitals, services, pricing and appointments." }, { property: "og:title", content: "Admin — HEALTH ASSIST AI" }, { property: "og:description", content: "Hospital management dashboard." }] }),
  component: () => <RequireAuth admin><Admin /></RequireAuth>,
});

function Admin() {
  const hospitals = useStore((s) => s.hospitals);
  const appts = useStore((s) => s.appointments);
  const [tab, setTab] = useState<"hospitals" | "appointments">("hospitals");
  const [edit, setEdit] = useState<string | null>(null);
  const eh = hospitals.find((h) => h.id === edit);
  const [draft, setDraft] = useState<typeof eh>(undefined);
  const revenue = appts.filter((a) => a.status === "confirmed").reduce((n, a) => n + (hospitals.find((h) => h.id === a.hospitalId)?.services.find((s) => s.serviceId === a.serviceId)?.price ?? 0), 0);

  return (
    <Page>
      <div className="flex items-center justify-between"><h1 className="text-3xl font-extrabold text-primary">Hospital Admin</h1><DemoBadge /></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[[Building2, "Hospitals", hospitals.length], [Users, "Doctors", DOCTORS.length], [CalendarCheck, "Bookings", appts.filter((a) => a.status === "confirmed").length], [IndianRupee, "Booked value", inr(revenue)]].map(([I, l, v]) => { const Icon = I as typeof Building2; return <Card key={l as string} className="p-5"><Icon className="h-5 w-5 text-teal" /><p className="mt-2 text-sm text-muted-foreground">{l as string}</p><p className="font-display text-2xl font-bold">{v as string}</p></Card>; })}
      </div>
      <div className="mt-6 flex gap-2">{(["hospitals", "appointments"] as const).map((t) => <Btn key={t} variant={tab === t ? "primary" : "outline"} size="sm" onClick={() => setTab(t)} className="capitalize">{t}</Btn>)}</div>

      {tab === "hospitals" ? (
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Hospital</th><th className="p-3">City</th><th className="p-3">Type</th><th className="p-3">Rating</th><th className="p-3">Services</th><th className="p-3" /></tr></thead>
            <tbody>{hospitals.map((h) => <tr key={h.id} className="border-b"><td className="p-3 font-semibold">{h.name}</td><td className="p-3">{h.city} {h.pincode}</td><td className="p-3">{h.type}</td><td className="p-3">{h.rating}</td><td className="p-3">{h.services.length}</td><td className="p-3"><Btn size="sm" variant="outline" onClick={() => { setEdit(h.id); setDraft(structuredClone(h)); }}>Edit</Btn></td></tr>)}</tbody></table>
        </Card>
      ) : (
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Ref</th><th className="p-3">Patient</th><th className="p-3">Hospital</th><th className="p-3">Service</th><th className="p-3">When</th><th className="p-3">Status</th></tr></thead>
            <tbody>{appts.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No bookings yet</td></tr> : appts.map((a) => <tr key={a.id} className="border-b"><td className="p-3 font-mono">{a.id}</td><td className="p-3">{a.patient.name}</td><td className="p-3">{hospitals.find((h) => h.id === a.hospitalId)?.name}</td><td className="p-3">{serviceById(a.serviceId).name}</td><td className="p-3">{a.date} {a.time}</td><td className="p-3">{a.status}{a.status === "confirmed" && <button className="ml-2 text-destructive underline" onClick={() => actions.cancel(a.id)}>cancel</button>}</td></tr>)}</tbody></table>
        </Card>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" role="dialog" aria-modal="true">
          <Card className="max-h-[85vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="text-lg font-bold">{draft.name}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-sm">Rating<Input type="number" step="0.1" min={0} max={5} value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Math.min(5, Math.max(0, +e.target.value)) })} /></label>
              <label className="text-sm">Phone<Input value={draft.phone} maxLength={20} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></label>
            </div>
            <p className="mt-4 text-sm font-semibold">Service pricing</p>
            <div className="mt-2 space-y-2">{draft.services.map((s, i) => <div key={s.serviceId} className="flex items-center gap-2"><span className="flex-1 text-sm">{serviceById(s.serviceId).name}</span><Input type="number" min={0} className="w-32" value={s.price} onChange={(e) => { const services = [...draft.services]; services[i] = { ...s, price: Math.max(0, +e.target.value) }; setDraft({ ...draft, services }); }} /></div>)}</div>
            <div className="mt-6 flex justify-end gap-2"><Btn variant="outline" onClick={() => { setDraft(undefined); setEdit(null); }}>Cancel</Btn><Btn onClick={() => { actions.updateHospital(draft); toast.success("Hospital updated"); setDraft(undefined); setEdit(null); }}>Save</Btn></div>
          </Card>
        </div>
      )}
    </Page>
  );
}
