import { useSyncExternalStore } from "react";
import { HOSPITALS, type Hospital } from "./data";

export type User = { name: string; email: string; phone: string; password: string; role: "patient" | "admin" };
export type Appointment = {
  id: string; userEmail: string; hospitalId: string; doctorId: string; serviceId: string;
  date: string; time: string; patient: { name: string; age: string; gender: string; phone: string; bloodGroup?: string; insuranceId?: string; allergies?: string; notes?: string };
  status: "confirmed" | "cancelled"; createdAt: number;
};
export type Loc = { lat: number; lng: number; label: string; source: "gps" | "manual" };
type State = {
  users: User[]; session: string | null; appointments: Appointment[]; location: Loc | null;
  compare: string[]; hospitals: Hospital[]; easyfill: Record<string, string> | null; largeText: boolean;
};

const KEY = "health-assist-ai-v1";
const initial: State = {
  users: [
    { name: "Demo Patient", email: "demo@healthassist.ai", phone: "9876543210", password: "demo123", role: "patient" },
    { name: "Hospital Admin", email: "admin@healthassist.ai", phone: "9000000000", password: "admin123", role: "admin" },
  ],
  session: null, appointments: [], location: null, compare: [], hospitals: HOSPITALS, easyfill: null, largeText: false,
};

let state: State = initial;
let loaded = false;
const subs = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...initial, ...JSON.parse(raw) }; } catch { /* ignore */ }
}
export function setState(fn: (s: State) => Partial<State>) {
  load();
  state = { ...state, ...fn(state) };
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}
export function getState() { load(); return state; }
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => { load(); return sel(state); },
    () => sel(initial),
  );
}
export function useHydrated() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}
export function useUser() {
  const email = useStore((s) => s.session);
  const users = useStore((s) => s.users);
  return users.find((u) => u.email === email) ?? null;
}

export const actions = {
  signup(u: Omit<User, "role">) {
    if (getState().users.some((x) => x.email.toLowerCase() === u.email.toLowerCase())) throw new Error("An account with this email already exists.");
    setState((s) => ({ users: [...s.users, { ...u, role: "patient" }], session: u.email }));
  },
  login(email: string, password: string) {
    const u = getState().users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (!u) throw new Error("Invalid email or password.");
    setState(() => ({ session: u.email }));
    return u;
  },
  logout() { setState(() => ({ session: null })); },
  setLocation(l: Loc | null) { setState(() => ({ location: l })); },
  toggleCompare(id: string) {
    setState((s) => ({ compare: s.compare.includes(id) ? s.compare.filter((x) => x !== id) : s.compare.length >= 3 ? s.compare : [...s.compare, id] }));
  },
  book(a: Omit<Appointment, "id" | "status" | "createdAt">) {
    const id = "HA-" + Date.now().toString(36).toUpperCase().slice(-6);
    setState((s) => ({ appointments: [...s.appointments, { ...a, id, status: "confirmed", createdAt: Date.now() }] }));
    return id;
  },
  cancel(id: string) { setState((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)) })); },
  reschedule(id: string, date: string, time: string) { setState((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, date, time, status: "confirmed" } : a)) })); },
  updateHospital(h: Hospital) { setState((s) => ({ hospitals: s.hospitals.map((x) => (x.id === h.id ? h : x)) })); },
  setEasyfill(v: Record<string, string> | null) { setState(() => ({ easyfill: v })); },
  toggleLargeText() { setState((s) => ({ largeText: !s.largeText })); },
};

export function bookedSlots(doctorId: string, date: string) {
  return getState().appointments.filter((a) => a.doctorId === doctorId && a.date === date && a.status === "confirmed").map((a) => a.time);
}
