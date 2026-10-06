// @ts-nocheck: This route currently uses dynamic types that are not compatible with strict TypeScript checking.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { LocateFixed, MapPin, Search, SlidersHorizontal, Timer, Scale, Check, CalendarClock, SearchX } from "lucide-react";
import { Btn, Card, DemoBadge, Input, Page, RequireAuth, Stars, inr } from "@/components/app/ui";
import { LazyMap } from "@/components/app/LazyMap";
import { DOCTORS, SERVICES, geocode, haversine, predictWait, slotsFor } from "@/lib/data";
import { actions, bookedSlots, useStore } from "@/lib/store";

export const Route = createFileRoute("/find")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Find Healthcare Services Near You — HEALTH ASSIST AI" }, { name: "description", content: "Nearby hospitals with prices, ratings, distance and available slots." }, { property: "og:title", content: "Find Healthcare Services — HEALTH ASSIST AI" }, { property: "og:description", content: "Compare nearby hospitals on a live map." }] }),
  component: () => <RequireAuth><FindPage /></RequireAuth>,
});

const RADIUS = 60;
const today = () => new Date().toISOString().slice(0, 10);

function FindPage() {
  const { q: initialQ } = Route.useSearch();
  const loc = useStore((s) => s.location);
  const hospitals = useStore((s) => s.hospitals);
  const compare = useStore((s) => s.compare);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState(initialQ ?? "");
  const [maxDist, setMaxDist] = useState(RADIUS);
  const [maxPrice, setMaxPrice] = useState(30000);
  const [minRating, setMinRating] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<"distance" | "price" | "rating">("distance");
  const [selected, setSelected] = useState<string | null>(null);

  const useGps = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported. Enter a city or pincode.");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { actions.setLocation({ lat: p.coords.latitude, lng: p.coords.longitude, label: "Your current location", source: "gps" }); setBusy(false); },
      () => { setBusy(false); toast.error("Location access denied. Please enter your city, area or pincode."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const useManual = async (e?: React.FormEvent, v?: string) => {
    e?.preventDefault();
    const text = v ?? manual;
    setBusy(true);
    const g = await geocode(text);
    setBusy(false);
    if (!g) return toast.error("Couldn't find that location. Try a city name or 6-digit pincode.");
    actions.setLocation({ ...g, source: "manual" });
  };

  const qq = q.trim().toLowerCase();
  const matchedService = SERVICES.find((s) => qq && (s.name.toLowerCase().includes(qq) || s.category.toLowerCase().includes(qq)));

  const results = useMemo(() => {
    if (!loc) return [];
    const d = today();
    return hospitals
      .map((h) => {
        const distance = haversine(loc, h);
        const docs = DOCTORS.filter((x) => x.hospitalId === h.id);
        const svc = matchedService ? h.services.find((s) => s.serviceId === matchedService.id) : undefined;
        const price = svc?.price ?? Math.min(...h.services.map((s) => s.price));
        const slots = docs.flatMap((doc) => slotsFor(doc.id, d, bookedSlots(doc.id, d)));
        const docMatch = docs.some((x) => x.specialty.toLowerCase().includes(qq) || x.name.toLowerCase().includes(qq));
        const nameMatch = h.name.toLowerCase().includes(qq) || h.type.toLowerCase().includes(qq);
        const matches = !qq || nameMatch || docMatch || !!svc;
        return { ...h, distance, price, slots: slots.length, nextSlot: slots.sort()[0], matches, wait: predictWait(h) };
      })
      .filter((h) => h.matches && h.distance <= maxDist && h.price <= maxPrice && h.rating >= minRating && (!openOnly || h.slots > 0))
      .sort((a, b) => (sort === "distance" ? a.distance - b.distance : sort === "price" ? a.price - b.price : b.rating - a.rating));
  }, [loc, hospitals, qq, matchedService, maxDist, maxPrice, minRating, openOnly, sort]);

  const onSelect = useCallback((id: string) => { setSelected(id); document.getElementById(`h-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, []);

  if (!loc) {
    return (
      <Page>
        <Card className="mx-auto max-w-2xl p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal-soft text-teal"><MapPin className="h-8 w-8" /></span>
          <h1 className="mt-6 text-3xl font-extrabold text-primary">Find Healthcare Services Near You</h1>
          <p className="mt-3 text-muted-foreground">Allow location access to find hospitals and healthcare services near you.</p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Btn size="lg" onClick={useGps} disabled={busy}><LocateFixed className="h-5 w-5" /> {busy ? "Locating…" : "Allow Location Access"}</Btn>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">or enter manually</p>
            <form onSubmit={useManual} className="flex w-full max-w-md gap-2">
              <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="City, area or pincode (e.g. Sankeshwar, 590001)" aria-label="City, area or pincode" />
              <Btn type="submit" variant="outline" disabled={busy || !manual.trim()}>Search</Btn>
            </form>
            <div className="flex flex-wrap justify-center gap-2">
              {["Sankeshwar", "Belagavi", "591313", "Bengaluru", "Pune"].map((c) => <button key={c} onClick={() => useManual(undefined, c)} className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-secondary">{c}</button>)}
            </div>
          </div>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-teal" /> {loc.label} <button className="font-semibold text-teal underline-offset-2 hover:underline" onClick={() => actions.setLocation(null)}>Change</button></p>
          <h1 className="mt-1 text-3xl font-extrabold text-primary">Nearby hospitals</h1>
        </div>
        <DemoBadge />
      </div>

      <Card className="mt-6 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search service, specialty or hospital (MRI, Cardiologist, Eye…)" aria-label="Search" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-11 rounded-xl border bg-card px-3 text-sm" aria-label="Sort by">
            <option value="distance">Nearest first</option><option value="price">Lowest price</option><option value="rating">Highest rated</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["OPD", "MRI", "Emergency", "Eye", "Dental", "Blood Test", "CT Scan", "Oncology"].map((c) => <button key={c} onClick={() => setQ(c)} className={`rounded-full border px-3 py-1 text-xs font-medium ${q === c ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>{c}</button>)}
        </div>
        <div className="mt-4 grid gap-4 border-t pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className="block"><span className="flex items-center gap-1 font-medium"><SlidersHorizontal className="h-3.5 w-3.5" /> Distance ≤ {maxDist} km</span><input type="range" min={1} max={RADIUS} value={maxDist} onChange={(e) => setMaxDist(+e.target.value)} className="w-full accent-[var(--teal)]" /></label>
          <label className="block"><span className="font-medium">Price ≤ {inr(maxPrice)}</span><input type="range" min={200} max={30000} step={100} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full accent-[var(--teal)]" /></label>
          <label className="block"><span className="font-medium">Rating ≥ {minRating || "Any"}</span><input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(+e.target.value)} className="w-full accent-[var(--teal)]" /></label>
          <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-4 w-4 accent-[var(--teal)]" /> Open slots today only</label>
        </div>
      </Card>

      {results.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-bold">No hospitals found for this location in the current database.</h2>
          <p className="mt-2 text-muted-foreground">Try another city or pincode, or widen your filters.</p>
          <Btn className="mt-6" variant="outline" onClick={() => actions.setLocation(null)}>Change location</Btn>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="lg:sticky lg:top-20 lg:self-start"><LazyMap hospitals={results} user={loc} radiusKm={maxDist} onSelect={onSelect} height={560} /></div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{results.length} hospitals{matchedService ? ` offering ${matchedService.name}` : ""}</p>
            {results.map((h) => (
              <Card key={h.id} className={`p-5 transition ${selected === h.id ? "ring-2 ring-teal" : ""}`}>
                <div id={`h-${h.id}`} className="flex gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-accent font-display text-xl font-bold text-accent-foreground">{h.name[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><h3 className="font-bold leading-tight">{h.name}</h3><p className="text-xs text-muted-foreground">{h.type} · {h.area ? h.area + ", " : ""}{h.city}</p></div>
                      <Stars rating={h.rating} reviews={h.reviews} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <Metric label={matchedService ? matchedService.name : "From"} value={inr(h.price)} />
                      <Metric label="Distance" value={`${h.distance.toFixed(1)} km`} />
                      <Metric label="Next slot" value={h.nextSlot ?? "—"} icon={<CalendarClock className="h-3.5 w-3.5" />} />
                      <Metric label="Est. wait" value={`~${h.wait} min`} icon={<Timer className="h-3.5 w-3.5" />} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to="/hospital/$id" params={{ id: h.id }}><Btn size="sm">View details</Btn></Link>
                      <Link to="/book/$hospitalId" params={{ hospitalId: h.id }} search={{ service: matchedService?.id }}><Btn size="sm" variant="teal">Book</Btn></Link>
                      <Btn size="sm" variant="outline" onClick={() => { if (!compare.includes(h.id) && compare.length >= 3) toast.error("You can compare up to 3 hospitals"); actions.toggleCompare(h.id); }}>
                        {compare.includes(h.id) ? <><Check className="h-4 w-4" /> Comparing</> : <><Scale className="h-4 w-4" /> Compare</>}
                      </Btn>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {compare.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <Card className="flex items-center gap-4 px-5 py-3 shadow-elevated"><span className="text-sm font-medium">{compare.length} / 3 selected</span><Link to="/compare"><Btn size="sm">Compare now</Btn></Link></Card>
        </div>
      )}
    </Page>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="rounded-lg bg-muted px-2.5 py-1.5"><p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">{icon}{label}</p><p className="font-semibold">{value}</p></div>;
}
