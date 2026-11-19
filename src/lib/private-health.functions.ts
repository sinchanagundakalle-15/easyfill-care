import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid date");

export const getPrivateHealthData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [periods, preferences, easyfill] = await Promise.all([
      context.supabase.from("period_records").select("id, start_date, end_date").order("start_date", { ascending: true }),
      context.supabase.from("period_preferences").select("average_cycle_days, average_period_days, reminders_enabled, reminder_days_before").maybeSingle(),
      context.supabase.from("easyfill_data").select("fields").maybeSingle(),
    ]);
    const failure = periods.error ?? preferences.error ?? easyfill.error;
    if (failure) {
      console.error("Could not read private health data:", failure.message);
      throw new Error("Your private health records could not be loaded. Please try again.");
    }
    return {
      periods: periods.data ?? [],
      preferences: preferences.data ?? null,
      easyfillFields: (easyfill.data?.fields ?? null) as Record<string, string> | null,
    };
  });

export const savePeriodRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ startDate: dateValue, endDate: dateValue.nullable() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.endDate && data.endDate < data.startDate) throw new Error("Period end date must be on or after the start date.");
    const { error } = await context.supabase.from("period_records").upsert({
      user_id: context.userId,
      start_date: data.startDate,
      end_date: data.endDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,start_date" });
    if (error) {
      console.error("Could not save period record:", error.message);
      throw new Error("Your period dates could not be saved. Please try again.");
    }
    return { success: true };
  });

export const deletePeriodRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("period_records").delete().eq("id", data.id);
    if (error) {
      console.error("Could not delete period record:", error.message);
      throw new Error("The selected period record could not be deleted.");
    }
    return { success: true };
  });

export const savePeriodPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    averageCycleDays: z.number().int().min(18).max(60).nullable(),
    averagePeriodDays: z.number().int().min(1).max(15).nullable(),
    remindersEnabled: z.boolean(),
    reminderDaysBefore: z.number().int().min(0).max(14),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("period_preferences").upsert({
      user_id: context.userId,
      average_cycle_days: data.averageCycleDays,
      average_period_days: data.averagePeriodDays,
      reminders_enabled: data.remindersEnabled,
      reminder_days_before: data.reminderDaysBefore,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error("Could not save period preferences:", error.message);
      throw new Error("Your cycle settings could not be saved. Please try again.");
    }
    return { success: true };
  });

export const savePrivateEasyFillData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ fields: z.record(z.string(), z.string().max(4000)).refine((fields) => Object.keys(fields).length <= 30) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("easyfill_data").upsert({
      user_id: context.userId,
      fields: data.fields as Json,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error("Could not save EasyFill data:", error.message);
      throw new Error("Your confirmed form details could not be saved.");
    }
    return { success: true };
  });