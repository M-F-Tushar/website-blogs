"use client";

import { type FormEvent, useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<{
    status: "idle" | "submitting" | "success" | "error";
    message?: string;
  }>({ status: "idle" });

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
    <form className="surface-panel rounded-[1.75rem] p-6 md:p-8" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-muted">
          Name
          <input
            name="name"
            required
            className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-foreground outline-none transition focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          Email
          <input
            name="email"
            required
            type="email"
            className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-foreground outline-none transition focus:border-accent"
          />
        </label>
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm text-muted">
        Subject
        <input
          name="subject"
          required
          className="rounded-2xl border border-border bg-white/70 px-4 py-3 text-foreground outline-none transition focus:border-accent"
        />
      </label>

      <label className="mt-5 flex flex-col gap-2 text-sm text-muted">
        Message
        <textarea
          name="message"
          required
          rows={7}
          className="rounded-[1.25rem] border border-border bg-white/70 px-4 py-3 text-foreground outline-none transition focus:border-accent"
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
          className="inline-flex items-center justify-center rounded-full bg-surface-dark px-5 py-3 text-sm font-medium text-white transition hover:bg-surface-dark/90 disabled:opacity-60"
        >
          {state.status === "submitting" ? "Sending..." : "Send message"}
        </button>
        {state.message ? (
          <p
            className={
              state.status === "success" ? "text-sm text-success" : "text-sm text-red-600"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
