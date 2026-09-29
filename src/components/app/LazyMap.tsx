import { lazy, Suspense, type ComponentProps } from "react";
import { useHydrated } from "@/lib/store";

const HospitalMap = lazy(() => import("./HospitalMap"));

export function LazyMap(p: ComponentProps<typeof HospitalMap>) {
  const h = useHydrated();
  const ph = <div style={{ height: p.height ?? 420 }} className="w-full animate-pulse rounded-2xl bg-muted" />;
  if (!h) return ph;
  return <Suspense fallback={ph}><HospitalMap {...p} /></Suspense>;
}
