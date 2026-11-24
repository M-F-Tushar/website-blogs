"use server";

import { redirect } from "next/navigation";

import { createAuthenticatedServerClient } from "@/lib/supabase/server";
import { normalizeEmailAddress } from "@/lib/utils";

export interface SignInActionState {
  error: string | null;
}

export async function signInAction(
  _previousState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const email = normalizeEmailAddress(formData.get("email"));
  const passwordEntry = formData.get("password");
  const password = typeof passwordEntry === "string" ? passwordEntry : "";

  if (!email || !password) {
    return {
      error: "Enter a valid email address and password.",
    };
  }

  const supabase = await createAuthenticatedServerClient();

  if (!supabase) {
    return {
      error:
        "Admin sign-in is not connected yet. Add the Supabase public keys to .env.local and restart the dev server.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  redirect("/admin/dashboard");
}
