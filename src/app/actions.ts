// src/app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/server";

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  const supabase = await createSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/?message=${error.message}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  
  const supabase = await createSupabaseClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    },
  });

  if (authError) {
    return redirect(`/?message=${authError.message}`);
  }

  if (authData.user) {
    // NUCLEAR FIX: Cast the builder to 'any' to bypass strict type checks
    const { error: profileError } = await (supabase.from("profiles") as any).insert({
      id: authData.user.id,
      full_name: fullName,
    });

    if (profileError) {
      return redirect(`/?message=${profileError.message}`);
    }
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