import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useUser as useDemoUser } from "@/lib/store";

export type CloudUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
};

type CloudAuthValue = { user: CloudUser | null; loading: boolean };
const CloudAuthContext = createContext<CloudAuthValue>({ user: null, loading: true });
export type AppUser = CloudUser & { role: "patient" | "admin"; isDemo: boolean; isCloud: boolean };

export function CloudAuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<CloudAuthValue>({ user: null, loading: true });

  useEffect(() => {
    let alive = true;
    let revision = 0;

    const loadProfile = async (authUser: AuthUser | null) => {
      const currentRevision = ++revision;
      if (!authUser) {
        if (alive) setAuth({ user: null, loading: false });
        return;
      }
      const { data } = await supabase.from("profiles").select("full_name, phone").eq("id", authUser.id).maybeSingle();
      if (!alive || currentRevision !== revision) return;
      setAuth({
        user: {
          id: authUser.id,
          email: authUser.email ?? "",
          name: data?.full_name || authUser.user_metadata?.["full_name"] || authUser.email || "Patient",
          phone: data?.phone || authUser.user_metadata?.["phone"] || "",
        },
        loading: false,
      });
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void Promise.resolve().then(() => loadProfile(session?.user ?? null));
    });
    void supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user ?? null));

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return <CloudAuthContext.Provider value={auth}>{children}</CloudAuthContext.Provider>;
}

export function useCloudAuth() {
  return useContext(CloudAuthContext);
}

export function useAppUser() {
  const { user: cloudUser, loading } = useCloudAuth();
  const demoUser = useDemoUser();
  const user: AppUser | null = cloudUser
    ? { ...cloudUser, role: "patient", isDemo: false, isCloud: true }
    : demoUser ? { id: `demo:${demoUser.email}`, ...demoUser, isDemo: true, isCloud: false } : null;
  return { user, loading };
}

export async function signOutCloud() {
  await supabase.auth.signOut();
}