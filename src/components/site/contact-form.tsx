"use client";

import { type FormEvent, useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<{
    status: "idle" | "submitting" | "success" | "error";
    message?: string;
  }>({ status: "idle" });
  const fieldClassName =
    "rounded-[1.25rem] border border-border bg-white/76 px-4 py-3.5 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/12";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting" });

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to send the message.");
      }

      form.reset();
      setState({
        status: "success",
        message: payload.message ?? "Message sent successfully.",
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while sending the message.",
      });
    }
  }

  return (
    <form className="surface-panel rounded-[2rem] p-6 md:p-8" onSubmit={handleSubmit}>
      <div className="border-b border-border/70 pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="signal-label">Secure intake</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.05em] text-balance">
              Start the conversation
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Use this channel for collaboration, research questions, project ideas, or
              thoughtful technical discussion.
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-border bg-white/60 px-4 py-3 text-xs uppercase tracking-[0.24em] text-muted">
            Thoughtful replies over volume
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-muted">
          Name
          <input name="name" required className={fieldClassName} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          Email
          <input name="email" required type="email" className={fieldClassName} />
        </label>
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm text-muted">
        Subject
        <input name="subject" required className={fieldClassName} />
      </label>

      <label className="mt-5 flex flex-col gap-2 text-sm text-muted">
        Message
        <textarea
          name="message"
          required
          rows={7}
          className={fieldClassName}
        />
      </label>

      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
      />

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          disabled={state.status === "submitting"}
          className="inline-flex items-center justify-center rounded-full bg-surface-dark px-6 py-3.5 text-sm font-medium text-white shadow-[0_20px_45px_rgba(7,19,31,0.22)] transition hover:bg-surface-dark/92 disabled:opacity-60"
        >
          {state.status === "submitting" ? "Sending..." : "Send message"}
        </button>
        {state.message ? (
          <p
            className={
              state.status === "success"
                ? "rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-success"
                : "rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
