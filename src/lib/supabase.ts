import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  : null;

export type UserProfileRow = {
  id: string;
  name: string;
  email: string;
  school: string;
  passwordHash?: string;
  status: "pending" | "approved" | "denied";
  requestDate: string;
};

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user };
}

export async function signUpWithPassword(email: string, password: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { user: data.user };
}

export async function signOutUser() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function upsertProfile(
  userId: string,
  profile: Omit<UserProfileRow, "id">,
) {
  if (!supabase) return null;

  const { error } = await supabase.from("user_profiles").upsert(
    {
      id: userId,
      name: profile.name,
      email: profile.email,
      school: profile.school,
      status: profile.status,
      request_date: profile.requestDate,
    },
    { onConflict: "id" },
  );

  if (error) throw error;
  return { id: userId };
}

export async function fetchUserProfiles(): Promise<UserProfileRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("request_date", { ascending: false });

  if (error) {
    console.warn("Could not load all Supabase user profiles:", error.message);
    return [];
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    school: profile.school,
    passwordHash: profile.passwordHash ?? "",
    status: profile.status,
    requestDate: profile.request_date,
  })) as UserProfileRow[];
}

export async function loadUserProfile(userId: string): Promise<UserProfileRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Could not load Supabase user profile:", error.message);
    return null;
  }

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    school: data.school,
    status: data.status,
    requestDate: data.request_date,
  } as UserProfileRow;
}

export async function saveStudyData(userId: string, data: Record<string, unknown>) {
  if (!supabase) return null;

  const { error } = await supabase.from("user_app_data").upsert(
    { user_id: userId, key: "study_data", value: data },
    { onConflict: "user_id,key" },
  );

  if (error) throw error;
  return { id: userId };
}

export async function loadStudyData(userId: string): Promise<Record<string, unknown> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_app_data")
    .select("value")
    .eq("user_id", userId)
    .eq("key", "study_data")
    .maybeSingle();

  if (error) {
    console.warn("Could not load Supabase study data:", error.message);
    return null;
  }

  return (data?.value as Record<string, unknown> | null) ?? null;
}
