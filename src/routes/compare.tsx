import { createFileRoute, Link } from "@tanstack/react-router";
import { X, Scale } from "lucide-react";
import { Btn, Card, DemoBadge, Page, RequireAuth, Stars, inr } from "@/components/app/ui";
import { DOCTORS, SERVICES, haversine, predictWait, slotsFor } from "@/lib/data";
import { actions, bookedSlots, useStore } from "@/lib/store";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "Compare Hospitals — HEALTH ASSIST AI" }, { name: "description", content: "Side-by-side comparison of up to 3 hospitals." }, { property: "og:title", content: "Compare Hospitals — HEALTH ASSIST AI" }, { property: "og:description", content: "Price, rating, distance, availability and facilities." }] }),
  component: () => <RequireAuth><ComparePage /></RequireAuth>,
});

function ComparePage() {
  const ids = useStore((s) => s.compare);
  const all = useStore((s) => s.hospitals);
  const loc = useStore((s) => s.location);
  const hs = ids.map((id) => all.find((h) => h.id === id)!).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  if (!hs.length) return <Page><Card className="p-12 text-center"><Scale className="mx-auto h-10 w-10 text-muted-foreground" /><h1 className="mt-3 text-xl font-bold">Nothing to compare yet</h1><p className="text-muted-foreground">Add up to 3 hospitals from the search results.</p><Link to="/find"><Btn className="mt-5">Find hospitals</Btn></Link></Card></Page>;
  const svcIds = SERVICES.filter((s) => hs.some((h) => h.services.some((x) => x.serviceId === s.id))).map((s) => s.id);
  const rows: [string, (h: (typeof hs)[number]) => React.ReactNode][] = [
    ["Rating", (h) => <Stars rating={h.rating} reviews={h.reviews} />],
    ["Distance", (h) => (loc ? `${haversine(loc, h).toFixed(1)} km` : "—")],
    ["Open slots today", (h) => DOCTORS.filter((d) => d.hospitalId === h.id).reduce((n, d) => n + slotsFor(d.id, today, bookedSlots(d.id, today)).length, 0)],
    ["Est. wait", (h) => `~${predictWait(h)} min`],
    ["Type", (h) => h.type],
    ["Facilities", (h) => <div className="flex flex-wrap gap-1">{h.facilities.map((f) => <span key={f} className="rounded bg-teal-soft px-1.5 py-0.5 text-xs">{f}</span>)}</div>],
  ];
  return (
    <Page>
      <div className="flex items-center justify-between"><h1 className="text-3xl font-extrabold text-primary">Compare hospitals</h1><DemoBadge /></div>
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b"><th className="w-44 p-4 text-left text-muted-foreground" />
            {hs.map((h) => <th key={h.id} className="p-4 text-left align-top"><div className="flex justify-between gap-2"><span className="font-display text-base font-bold">{h.name}</span><button aria-label={`Remove ${h.name}`} onClick={() => actions.toggleCompare(h.id)}><X className="h-4 w-4" /></button></div></th>)}</tr></thead>
          <tbody>
            {rows.map(([l, f]) => <tr key={l} className="border-b"><td className="p-4 font-semibold text-muted-foreground">{l}</td>{hs.map((h) => <td key={h.id} className="p-4">{f(h)}</td>)}</tr>)}
            {svcIds.map((sid) => { const prices = hs.map((h) => h.services.find((x) => x.serviceId === sid)?.price); const min = Math.min(...prices.filter((x): x is number => x != null));
              return <tr key={sid} className="border-b"><td className="p-4 text-muted-foreground">{SERVICES.find((s) => s.id === sid)!.name}</td>{prices.map((p, i) => <td key={i} className={`p-4 font-semibold ${p === min ? "text-success" : ""}`}>{p != null ? inr(p) : <span className="text-muted-foreground">—</span>}</td>)}</tr>; })}
            <tr><td className="p-4" />{hs.map((h) => <td key={h.id} className="p-4"><Link to="/book/$hospitalId" params={{ hospitalId: h.id }}><Btn size="sm">Book</Btn></Link></td>)}</tr>
          </tbody>
        </table>
      </Card>
    </Page>
  );
}
