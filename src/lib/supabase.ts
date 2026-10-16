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
  role: "student" | "admin";
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

export async function signUpWithPassword(
  email: string,
  password: string,
  profile: { name: string; school: string },
) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: profile },
  });
  if (error) throw error;
  return { user: data.user };
}

export async function signOutUser() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchUserProfiles(): Promise<UserProfileRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("request_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    school: profile.school,
    passwordHash: profile.passwordHash ?? "",
    status: profile.status,
    role: profile.role,
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
    throw error;
  }

  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    school: data.school,
    status: data.status,
    role: data.role,
    requestDate: data.request_date,
  } as UserProfileRow;
}

export async function updateUserProfileStatus(
  userId: string,
  status: UserProfileRow["status"],
) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ status })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("No user profile was updated.");
}

export async function saveStudyData(userId: string, data: Record<string, unknown>) {
  if (!supabase) return null;

  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("user_app_data").upsert(
    { user_id: userId, key: "study_data", value: data, updated_at: updatedAt },
    { onConflict: "user_id,key" },
  );

  if (error) throw error;
  return { id: userId, updatedAt };
}

export async function loadStudyData(
  userId: string,
): Promise<{ value: Record<string, unknown>; updatedAt: string } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_app_data")
    .select("value, updated_at")
    .eq("user_id", userId)
    .eq("key", "study_data")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    value: (data.value as Record<string, unknown> | null) ?? {},
    updatedAt: data.updated_at,
  };
}
