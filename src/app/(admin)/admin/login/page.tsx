import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { getOptionalSessionProfile } from "@/lib/auth/guards";

export default async function AdminLoginPage() {
  const session = await getOptionalSessionProfile();

  if (session?.profile.role === "admin") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)] lg:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Admin access
          </p>
          <h1 className="mt-6 max-w-xl font-display text-5xl font-semibold leading-[0.96] tracking-[-0.06em] text-balance md:text-6xl">
            Publishing control, without the noise.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Sign in to manage pages, posts, media, messages, SEO, and operational settings from one focused workspace.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Content", "Media", "SEO"].map((item) => (
              <div key={item} className="rounded-[1.1rem] border border-border bg-white/55 px-4 py-3">
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-muted">
                  Workspace
                </p>
                <p className="mt-1 font-display text-xl font-semibold tracking-[-0.04em]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
