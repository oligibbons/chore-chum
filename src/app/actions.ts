"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/?message=${error.message}`);
  }

  // FIX: Redirect to dashboard on successful sign-in
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  // FIX: Get full_name from form
  const fullName = formData.get("full_name") as string;
  const supabase = createClient();

  // First, sign up the user in the auth schema
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

  // FIX: If auth user is created, create the corresponding public profile
  if (authData.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: fullName,
      // avatar_url can be added later
    });

    if (profileError) {
      // If profile creation fails, we should ideally delete the auth user
      // or at least inform them. For now, show the error.
      return redirect(`/?message=${profileError.message}`);
    }
  }

  // FIX: Redirect to dashboard on successful sign-up
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// FIX: Added the missing signOut function
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  
  // Revalidate all paths and redirect to the root (login page)
  revalidatePath("/", "layout");
  redirect("/");
}