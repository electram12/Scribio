import {
  supabase,
  supabaseConfigured,
  signInWithPassword as supabaseSignIn,
  signUpWithPassword as supabaseSignUp,
  signOutUser,
  updateUserProfileStatus as supabaseUpdateUserProfileStatus,
  updateAccountProfile as supabaseUpdateAccountProfile,
  updateAccountPassword as supabaseUpdateAccountPassword,
  loadUserProfile,
  saveStudyData,
  loadStudyData,
  fetchUserProfiles as supabaseFetchUserProfiles,
} from "./supabase";

type FirebaseCompatUser = { uid: string; email?: string | null };

export const firebaseConfigured = supabaseConfigured;
export const firebaseAuth = supabase
  ? {
    onIdTokenChanged: (callback: (user: FirebaseCompatUser | null) => void) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        callback(user ? { uid: user.id, email: user.email } : null);
      });
      return () => subscription.unsubscribe();
    },
    currentUser: null,
  }
  : null;
export const firebaseApp = null;
export const firebaseDb = null;

export async function signInWithPassword(email: string, password: string) {
  const { user } = await supabaseSignIn(email, password);
  if (!user) throw new Error("Supabase did not return an authenticated user.");
  return { user: { uid: user.id, email: user.email } };
}

export async function signUpWithPassword(
  email: string,
  password: string,
  profile: { name: string; school: string },
) {
  const { user } = await supabaseSignUp(email, password, profile);
  if (!user) throw new Error("Supabase did not create a user.");
  return { user: { uid: user.id, email: user.email } };
}

export type FirebaseUserProfile = {
  name: string;
  email: string;
  school: string;
  passwordHash: string;
  status: "pending" | "approved" | "denied";
  requestDate: string;
};

export {
  signOutUser,
  loadUserProfile,
  saveStudyData,
  loadStudyData,
};

export async function fetchUserProfiles() {
  return supabase ? supabaseFetchUserProfiles() : [];
}

export function updateUserProfileStatus(
  userId: string,
  status: "pending" | "approved" | "denied",
) {
  return supabaseUpdateUserProfileStatus(userId, status);
}

export function updateAccountProfile(
  userId: string,
  profile: { name: string; school: string },
) {
  return supabaseUpdateAccountProfile(userId, profile);
}

export function updateAccountPassword(password: string) {
  return supabaseUpdateAccountPassword(password);
}
