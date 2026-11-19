import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { Bell, BellOff, ChevronLeft, ChevronRight, CircleHelp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Btn, Card, Input, Label, Page, RequireCloudAuth } from "@/components/app/ui";
import { useAppUser } from "@/lib/cloud-user";
import { deletePeriodRecord, getPrivateHealthData, savePeriodPreferences, savePeriodRecord } from "@/lib/private-health.functions";
import { estimatePeriodDates, predictNextPeriod, type PeriodRecord } from "@/lib/period";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/period-tracker")({
  head: () => ({ meta: [
    { title: "Private Period Tracker — HEALTH ASSIST AI" },
    { name: "description", content: "Privately record cycle dates and view personal estimates." },
    { property: "og:title", content: "Private Period Tracker — HEALTH ASSIST AI" },
    { property: "og:description", content: "Personal cycle history and estimates, kept private to your account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <RequireCloudAuth><PeriodTracker /></RequireCloudAuth>,
});

type PeriodData = Awaited<ReturnType<typeof getPrivateHealthData>>;
const emptyData: PeriodData = { periods: [], preferences: null, easyfillFields: null };

function PeriodTracker() {
  const user = useAppUser().user;
  const queryClient = useQueryClient();
  const getData = useServerFn(getPrivateHealthData);
  const saveRecord = useServerFn(savePeriodRecord);
  const removeRecord = useServerFn(deletePeriodRecord);
  const savePreferences = useServerFn(savePeriodPreferences);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cycleDays, setCycleDays] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState("2");
  const [saving, setSaving] = useState(false);
  const query = useQuery({ queryKey: ["private-health", user?.id], queryFn: getData, enabled: !!user?.isCloud });
  const data = query.data ?? emptyData;
  const records = data.periods as PeriodRecord[];
  const prediction = predictNextPeriod(records, cycleDays ? Number(cycleDays) : data.preferences?.average_cycle_days ?? null);
  const actualPeriodDays = useMemo(() => new Set(records.flatMap((record) => estimatePeriodDates(record.start_date, record.end_date ? Math.max(1, Math.round((Date.parse(`${record.end_date}T00:00:00Z`) - Date.parse(`${record.start_date}T00:00:00Z`)) / 86400000) + 1) : null))), [records]);
  const predictedPeriodDays = useMemo(() => new Set(estimatePeriodDates(prediction?.date ?? null, durationDays ? Number(durationDays) : data.preferences?.average_period_days ?? null)), [prediction?.date, durationDays, data.preferences?.average_period_days]);

  useEffect(() => {
    if (!data.preferences) return;
    setCycleDays(data.preferences.average_cycle_days?.toString() ?? "");
    setDurationDays(data.preferences.average_period_days?.toString() ?? "");
    setReminderEnabled(data.preferences.reminders_enabled);
    setReminderDays(String(data.preferences.reminder_days_before));
  }, [data.preferences]);

  useEffect(() => {
    if (!reminderEnabled || !prediction || typeof window === "undefined" || !("Notification" in window)) return;
    const daysBefore = Number(reminderDays);
    const reminderDate = new Date(`${prediction.date}T12:00:00`).getTime() - daysBefore * 86400000;
    const today = new Date();
    if (today.getTime() < reminderDate || today.getTime() >= reminderDate + 86400000 || Notification.permission !== "granted") return;
    const storageKey = `period-reminder-shown-${user?.id}-${prediction.date}`;
    if (window.localStorage.getItem(storageKey)) return;
    new Notification("Period estimate reminder", { body: `Your next period is estimated around ${format(new Date(`${prediction.date}T12:00:00`), "d MMMM")}. This is only an estimate.` });
    window.localStorage.setItem(storageKey, "shown");
  }, [reminderEnabled, prediction?.date, reminderDays, user?.id]);

  const save = async () => {
    if (!startDate) return toast.error("Choose the period start date.");
    if (endDate && endDate < startDate) return toast.error("End date must be on or after the start date.");
    setSaving(true);
    try {
      await saveRecord({ data: { startDate, endDate: endDate || null } });
      if (cycleDays || durationDays || data.preferences || reminderEnabled) await savePreferences({ data: {
        averageCycleDays: cycleDays ? Number(cycleDays) : null,
        averagePeriodDays: durationDays ? Number(durationDays) : null,
        remindersEnabled: reminderEnabled,
        reminderDaysBefore: Number(reminderDays),
      } });
      await queryClient.invalidateQueries({ queryKey: ["private-health", user?.id] });
      setStartDate(""); setEndDate("");
      toast.success("Your private record has been saved.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save your record."); }
    finally { setSaving(false); }
  };

  const saveSettings = async () => {
    const days = Number(reminderDays);
    const average = cycleDays ? Number(cycleDays) : null;
    const duration = durationDays ? Number(durationDays) : null;
    if (average !== null && (!Number.isInteger(average) || average < 18 || average > 60)) return toast.error("Cycle length must be between 18 and 60 days.");
    if (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 15)) return toast.error("Period duration must be between 1 and 15 days.");
    if (!Number.isInteger(days) || days < 0 || days > 14) return toast.error("Reminder lead time must be between 0 and 14 days.");
    if (reminderEnabled && typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return toast.error("Notifications were not allowed by this browser.");
    }
    setSaving(true);
    try {
      await savePreferences({ data: { averageCycleDays: average, averagePeriodDays: duration, remindersEnabled: reminderEnabled, reminderDaysBefore: days } });
      await queryClient.invalidateQueries({ queryKey: ["private-health", user?.id] });
      toast.success("Cycle settings saved.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save cycle settings."); }
    finally { setSaving(false); }
  };

  const daysInMonth = Array.from({ length: endOfMonth(month).getDate() }, (_, i) => i + 1);
  const blanks = startOfMonth(month).getDay();

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-semibold text-teal">Private to your account</p><h1 className="text-3xl font-extrabold text-primary">Period Tracker</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Your dates stay private. Predictions are estimates, not medical advice or a diagnosis.</p></div>
        {prediction && <Card className="px-5 py-3"><p className="text-xs text-muted-foreground">Next estimate</p><p className="font-semibold">{format(new Date(`${prediction.date}T12:00:00`), "d MMM yyyy")} · based on {prediction.cycleDays}-day average</p></Card>}
      </div>

      {query.isLoading ? <Card className="mt-6 p-8 text-center text-muted-foreground">Loading private records…</Card> : query.error ? <Card className="mt-6 p-8 text-center"><p className="font-semibold">Your private records could not be loaded.</p><Btn className="mt-3" variant="outline" onClick={() => void query.refetch()}>Try again</Btn></Card> : <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3"><Btn variant="outline" size="sm" aria-label="Previous month" onClick={() => setMonth((value) => subMonths(value, 1))}><ChevronLeft className="h-4 w-4" /></Btn><h2 className="font-display text-lg font-bold">{format(month, "MMMM yyyy")}</h2><Btn variant="outline" size="sm" aria-label="Next month" onClick={() => setMonth((value) => addMonths(value, 1))}><ChevronRight className="h-4 w-4" /></Btn></div>
            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{"SMTWTFS".split("").map((day, index) => <span key={`${day}-${index}`} className="py-2 font-semibold">{day}</span>)}</div>
            <div className="grid grid-cols-7 gap-1">{Array.from({ length: blanks }, (_, index) => <span key={`blank-${index}`} />)}{daysInMonth.map((day) => {
              const date = `${format(month, "yyyy-MM")}-${String(day).padStart(2, "0")}`;
              const actual = actualPeriodDays.has(date);
              const predicted = predictedPeriodDays.has(date);
              return <div key={date} title={actual ? "Recorded period date" : predicted ? "Estimated period date" : undefined} className={`grid aspect-square place-items-center rounded-full text-sm ${actual ? "bg-primary text-primary-foreground" : predicted ? "border-2 border-dashed border-teal text-foreground" : ""}`}>{day}</div>;
            })}</div>
            <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full bg-primary" /> Recorded dates</span><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full border-2 border-dashed border-teal" /> Estimate</span></div>
          </Card>

          <Card className="mt-5 p-5">
            <h2 className="text-lg font-bold">Period history</h2>
            {records.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No dates recorded yet.</p> : <div className="mt-3 divide-y">{[...records].sort((a, b) => b.start_date.localeCompare(a.start_date)).map((record) => <div key={record.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-semibold">Started {format(new Date(`${record.start_date}T12:00:00`), "d MMM yyyy")}</p><p className="text-xs text-muted-foreground">{record.end_date ? `Ended ${format(new Date(`${record.end_date}T12:00:00`), "d MMM yyyy")}` : "End date not recorded"}</p></div><Btn variant="ghost" size="sm" aria-label="Delete recorded period" onClick={async () => { try { await removeRecord({ data: { id: record.id! } }); await queryClient.invalidateQueries({ queryKey: ["private-health", user?.id] }); toast.success("Record deleted."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete the record."); } }}><Trash2 className="h-4 w-4" /></Btn></div>)}</div>}
          </Card>
        </section>

        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="text-lg font-bold">Record a period</h2>
            <div className="mt-4 space-y-3"><div><Label htmlFor="period-start">Start date</Label><Input id="period-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div><div><Label htmlFor="period-end">End date (optional)</Label><Input id="period-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div></div>
            <Btn className="mt-4 w-full" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save private record"}</Btn>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-bold">Cycle settings</h2>
            <div className="mt-4 grid grid-cols-2 gap-3"><div><Label htmlFor="cycle-days">Cycle length (days)</Label><Input id="cycle-days" type="number" min="18" max="60" placeholder="Use history" value={cycleDays} onChange={(event) => setCycleDays(event.target.value)} /></div><div><Label htmlFor="period-days">Period duration</Label><Input id="period-days" type="number" min="1" max="15" placeholder="Not set" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} /></div></div>
            <div className="mt-4 border-t pt-4"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={reminderEnabled} onChange={(event) => setReminderEnabled(event.target.checked)} /> Enable browser reminders</label><div className="mt-3"><Label htmlFor="reminder-days">Remind me before</Label><select id="reminder-days" value={reminderDays} onChange={(event) => setReminderDays(event.target.value)} className="h-11 w-full rounded-xl border bg-card px-3 text-sm">{[0, 1, 2, 3, 5, 7].map((days) => <option key={days} value={days}>{days === 0 ? "On the estimated day" : `${days} days before`}</option>)}</select></div>
              {reminderEnabled && <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><CircleHelp className="h-4 w-4 shrink-0" /> Reminders appear only when this app is open and your browser allows notifications.</p>}
            </div>
            <Btn className="mt-4 w-full" variant="outline" onClick={() => void saveSettings()} disabled={saving}>{saving ? "Saving…" : reminderEnabled ? <><Bell className="h-4 w-4" /> Save cycle settings</> : <><BellOff className="h-4 w-4" /> Save cycle settings</>}</Btn>
          </Card>
        </aside>
      </div>}
    </Page>
  );
}