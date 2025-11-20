// src/app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/server";
import { TablesInsert } from "@/types/database";

export type AuthFormState = {
  success: boolean
  message: string
}

export async function signInWithEmail(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpWithEmail(
  prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  
  const supabase = await createSupabaseClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Ensure this URL matches your environment configuration
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (authError) {
    return { success: false, message: authError.message }
  }

  if (authData.user) {
    const newProfile: TablesInsert<'profiles'> = {
      id: authData.user.id,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await supabase
        .from("profiles")
        .insert(newProfile);

    if (profileError) {
      return { success: false, message: profileError.message }
    }
  } else {
    // If signup requires email confirmation and no session is created immediately
    return { success: true, message: 'Check your email for the confirmation link.' }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseClient();
  await supabase.auth.signOut();
  
  revalidatePath("/", "layout");
  redirect("/");
}