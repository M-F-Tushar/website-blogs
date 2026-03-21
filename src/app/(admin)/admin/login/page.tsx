import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { getOptionalSessionProfile } from "@/lib/auth/guards";

export default async function AdminLoginPage() {
  const session = await getOptionalSessionProfile();

  if (session?.profile.role === "admin") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Admin access
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[0.96] font-semibold tracking-[-0.06em] text-balance">
            Sign in to manage the platform.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            The admin panel is intentionally focused on content, structure, SEO,
            media, and operational control. Design system and security logic stay in code.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
