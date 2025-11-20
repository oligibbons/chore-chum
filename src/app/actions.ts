// src/app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/server";

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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`,
      // FIXED: Pass the name here so the Postgres Trigger can grab it
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    return { success: false, message: authError.message }
  }

  // REMOVED: The manual insert into 'profiles'. 
  // The Postgres Trigger 'on_auth_user_created' now handles this automatically 
  // with superuser privileges, bypassing the RLS error completely.

  if (!authData.session) {
    // If no session, it means email confirmation is required
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