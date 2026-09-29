import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Scale, CalendarCheck, ScanText, Search, ShieldCheck, Mic, Timer, ArrowRight, Quote } from "lucide-react";
import { Btn, Card, Header, Stars } from "@/components/app/ui";
import { HOSPITALS } from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HEALTH ASSIST AI — Hospital Service Comparison & EasyFill" },
      { name: "description", content: "Find nearby hospitals, compare prices and availability, book appointments, and fill healthcare forms with accessible assistance." },
      { property: "og:title", content: "HEALTH ASSIST AI — Hospital Service Comparison & EasyFill" },
      { property: "og:description", content: "Find nearby healthcare services. Compare. Book. Fill with ease." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: MapPin, title: "Nearby Hospitals", text: "Use your live location or any city/pincode to find care around you on an interactive map." },
  { icon: Scale, title: "Compare Prices", text: "Transparent service prices, ratings, distance and open slots side by side." },
  { icon: CalendarCheck, title: "Easy Booking", text: "Pick a doctor, date and slot. Get a booking reference instantly." },
  { icon: ScanText, title: "EasyFill OCR", text: "Scan a medical form, auto-extract fields, and fill it with voice and read-aloud." },
];
const TESTI = [
  { name: "Shweta K., Sankeshwar", text: "I compared MRI prices in two minutes and booked a morning slot. No more phone calls." },
  { name: "Ramesh P., Belagavi", text: "EasyFill read my father's form aloud and filled it by voice. Truly accessible." },
  { name: "Dr. A. Kulkarni", text: "Patients arrive with complete forms. The front desk queue is visibly shorter." },
];

function Landing() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  return (
    <div className="min-h-dvh">
      <Header />
      <section className="bg-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-accent-foreground"><ShieldCheck className="h-3.5 w-3.5 text-teal" /> Hospital Service Comparison & EasyFill</p>
            <h1 className="text-4xl font-extrabold leading-[1.05] text-primary sm:text-6xl">Healthcare services, <span className="text-teal">simplified.</span></h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">Find nearby hospitals, compare prices and availability, book appointments, and fill healthcare forms with accessible assistance.</p>
            <p className="mt-3 text-sm font-semibold text-primary/80">Find nearby healthcare services. Compare. Book. Fill with ease.</p>
            <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/find", search: { q } }); }} className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border bg-card p-2 shadow-elevated">
              <Search className="ml-2 h-5 w-5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search MRI, Eye Checkup, Cardiologist…" className="h-11 flex-1 bg-transparent text-sm outline-none" aria-label="Search healthcare service" />
              <Btn type="submit">Search</Btn>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/find"><Btn size="lg">Find Healthcare Services <ArrowRight className="h-4 w-4" /></Btn></Link>
              <Link to="/easyfill"><Btn size="lg" variant="outline"><ScanText className="h-4 w-4" /> Try EasyFill</Btn></Link>
            </div>
          </div>
          <div className="relative">
            <Card className="p-5 shadow-elevated">
              <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">Top rated near you</p><span className="text-xs text-muted-foreground">Live availability</span></div>
              <div className="space-y-3">
                {HOSPITALS.slice(0, 4).map((h, i) => (
                  <div key={h.id} className="flex items-center gap-3 rounded-xl border p-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent font-display font-bold text-accent-foreground">{h.name[0]}</div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{h.name}</p><p className="text-xs text-muted-foreground">{h.type} · {(0.4 + i * 0.6).toFixed(1)} km</p></div>
                    <Stars rating={h.rating} />
                  </div>
                ))}
              </div>
            </Card>
            <Card className="absolute -bottom-6 -left-6 hidden items-center gap-3 p-4 sm:flex"><Timer className="h-8 w-8 text-teal" /><div><p className="text-xs text-muted-foreground">AI wait-time estimate</p><p className="font-display text-lg font-bold">~14 min</p></div></Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold text-primary">Everything from search to signed form</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6 transition hover:-translate-y-1 hover:shadow-elevated">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal-soft text-teal"><f.icon className="h-6 w-6" /></span>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-brand">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 text-primary-foreground sm:grid-cols-4">
          {[["13", "Partner hospitals"], ["24+", "Services with prices"], ["26", "Doctors"], ["Voice", "Accessible forms"]].map(([a, b]) => (
            <div key={b}><p className="font-display text-4xl font-extrabold">{a}</p><p className="opacity-80">{b}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-3xl font-bold text-primary">What people say</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {TESTI.map((t) => (
            <Card key={t.name} className="p-6"><Quote className="h-6 w-6 text-teal" /><p className="mt-3">{t.text}</p><p className="mt-4 text-sm font-semibold text-muted-foreground">{t.name}</p></Card>
          ))}
        </div>
        <Card className="mt-12 flex flex-col items-start justify-between gap-4 p-8 md:flex-row md:items-center">
          <div><h3 className="text-xl font-bold">Quick access</h3><p className="text-muted-foreground">Jump straight into any part of the flow.</p></div>
          <div className="flex flex-wrap gap-2">
            <Link to="/find"><Btn variant="outline"><MapPin className="h-4 w-4" /> Nearby care</Btn></Link>
            <Link to="/compare"><Btn variant="outline"><Scale className="h-4 w-4" /> Compare</Btn></Link>
            <Link to="/appointments"><Btn variant="outline"><CalendarCheck className="h-4 w-4" /> Appointments</Btn></Link>
            <Link to="/easyfill"><Btn variant="outline"><Mic className="h-4 w-4" /> EasyFill</Btn></Link>
          </div>
        </Card>
      </section>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© 2026 HEALTH ASSIST AI · Final-year engineering project · Hospital data shown is demo data</footer>
    </div>
  );
}
