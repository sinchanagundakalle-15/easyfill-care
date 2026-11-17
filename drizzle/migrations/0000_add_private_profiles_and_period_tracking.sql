CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

CREATE TABLE public.period_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT period_records_valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.period_records TO authenticated;
GRANT ALL ON public.period_records TO service_role;
ALTER TABLE public.period_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own period records" ON public.period_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own period records" ON public.period_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own period records" ON public.period_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own period records" ON public.period_records FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE UNIQUE INDEX period_records_user_start_date_idx ON public.period_records (user_id, start_date);

CREATE TABLE public.period_preferences (
  user_id uuid PRIMARY KEY,
  average_cycle_days smallint,
  average_period_days smallint,
  reminders_enabled boolean NOT NULL DEFAULT false,
  reminder_days_before smallint NOT NULL DEFAULT 2,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT period_preferences_cycle_range CHECK (average_cycle_days IS NULL OR average_cycle_days BETWEEN 18 AND 60),
  CONSTRAINT period_preferences_duration_range CHECK (average_period_days IS NULL OR average_period_days BETWEEN 1 AND 15),
  CONSTRAINT period_preferences_reminder_range CHECK (reminder_days_before BETWEEN 0 AND 14)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.period_preferences TO authenticated;
GRANT ALL ON public.period_preferences TO service_role;
ALTER TABLE public.period_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own period preferences" ON public.period_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own period preferences" ON public.period_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own period preferences" ON public.period_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own period preferences" ON public.period_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.easyfill_data (
  user_id uuid PRIMARY KEY,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.easyfill_data TO authenticated;
GRANT ALL ON public.easyfill_data TO service_role;
ALTER TABLE public.easyfill_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own EasyFill data" ON public.easyfill_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own EasyFill data" ON public.easyfill_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own EasyFill data" ON public.easyfill_data FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own EasyFill data" ON public.easyfill_data FOR DELETE TO authenticated USING (auth.uid() = user_id);