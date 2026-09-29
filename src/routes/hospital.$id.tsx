import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Phone, MapPin, Timer, Stethoscope, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { Btn, Card, DemoBadge, Page, RequireAuth, Stars, inr } from "@/components/app/ui";
import { LazyMap } from "@/components/app/LazyMap";
import { DOCTORS, HOSPITALS, haversine, predictWait, serviceById } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/hospital/$id")({
  loader: ({ params }) => { const h = HOSPITALS.find((x) => x.id === params.id); if (!h) throw notFound(); return { name: h.name, about: h.about }; },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.name ?? "Hospital"} — HEALTH ASSIST AI` }, { name: "description", content: loaderData?.about ?? "" }, { property: "og:title", content: `${loaderData?.name} — HEALTH ASSIST AI` }, { property: "og:description", content: loaderData?.about ?? "" }] }),
  component: () => <RequireAuth><HospitalPage /></RequireAuth>,
});

const GALLERY = ["Reception", "Patient ward", "Diagnostics", "Operation theatre"];

function HospitalPage() {
  const { id } = Route.useParams();
  const h = useStore((s) => s.hospitals.find((x) => x.id === id))!;
  const loc = useStore((s) => s.location);
  const docs = DOCTORS.filter((d) => d.hospitalId === id);
  const dist = loc ? haversine(loc, h) : null;
  return (
    <Page>
      <Link to="/find" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to results</Link>
      <Card className="overflow-hidden">
        <div className="bg-brand p-8 text-primary-foreground">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-sm opacity-80">{h.type}</p><h1 className="mt-1 text-3xl font-extrabold">{h.name}</h1>
              <p className="mt-2 flex items-center gap-1 text-sm opacity-90"><MapPin className="h-4 w-4" /> {h.area ? h.area + ", " : ""}{h.city}, {h.state} {h.pincode}{dist != null && ` · ${dist.toFixed(1)} km away`}</p></div>
            <div className="rounded-xl bg-card px-4 py-2 text-card-foreground"><Stars rating={h.rating} reviews={h.reviews} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
          {GALLERY.map((g, i) => <div key={g} className="flex aspect-[4/3] items-end rounded-xl p-3 text-xs font-semibold text-primary" style={{ background: `linear-gradient(135deg, oklch(0.95 0.04 ${200 + i * 15}), oklch(0.88 0.06 ${220 + i * 10}))` }}>{g}</div>)}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6"><h2 className="text-lg font-bold">About</h2><p className="mt-2 text-muted-foreground">{h.about}</p>
            <div className="mt-4 flex flex-wrap gap-2">{h.facilities.map((f) => <span key={f} className="inline-flex items-center gap-1 rounded-full bg-teal-soft px-3 py-1 text-xs font-medium text-accent-foreground"><CheckCircle2 className="h-3.5 w-3.5" />{f}</span>)}</div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Services & transparent pricing</h2><DemoBadge /></div>
            <div className="mt-4 divide-y">
              {h.services.map((s) => { const sv = serviceById(s.serviceId); return (
                <div key={s.serviceId} className="flex items-center justify-between py-3">
                  <div><p className="font-medium">{sv.name}</p><p className="text-xs text-muted-foreground">{sv.category}</p></div>
                  <div className="flex items-center gap-3"><span className="font-display font-bold">{inr(s.price)}</span><Link to="/book/$hospitalId" params={{ hospitalId: h.id }} search={{ service: s.serviceId }}><Btn size="sm" variant="outline">Book</Btn></Link></div>
                </div>); })}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-bold">Doctors</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {docs.map((d) => (
                <div key={d.id} className="rounded-xl border p-4">
                  <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-foreground"><Stethoscope className="h-5 w-5" /></span><div><p className="font-semibold">{d.name}</p><p className="text-xs text-muted-foreground">{d.specialty} · {d.experience} yrs</p></div></div>
                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {d.timings}</p>
                  <div className="mt-3 flex items-center justify-between"><span className="text-sm font-semibold">Fee {inr(d.fee)}</span><Link to="/book/$hospitalId" params={{ hospitalId: h.id }} search={{ doctor: d.id }}><Btn size="sm" variant="teal">Book appointment</Btn></Link></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Timer className="h-4 w-4 text-teal" /> AI-predicted wait time now</p>
            <p className="mt-1 font-display text-4xl font-extrabold text-primary">~{predictWait(h)} min</p>
            <p className="mt-1 text-xs text-muted-foreground">Regression on time of day, hospital size and patient volume.</p>
            <a href={`tel:${h.phone}`} className="mt-4 flex items-center gap-2 text-sm font-medium"><Phone className="h-4 w-4" /> {h.phone}</a>
            <Link to="/book/$hospitalId" params={{ hospitalId: h.id }}><Btn className="mt-4 w-full">Book appointment</Btn></Link>
          </Card>
          <LazyMap hospitals={[h]} user={loc} height={300} />
        </div>
      </div>
    </Page>
  );
}
