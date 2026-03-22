"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface ContactFormProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  badge?: string;
}

export function ContactForm({
  eyebrow = "Secure intake",
  title = "Start the conversation",
  description = "Use this channel for collaboration, research questions, project ideas, or thoughtful technical discussion.",
  badge = "Thoughtful replies over volume",
}: ContactFormProps) {
  const [state, setState] = useState<{
    status: "idle" | "submitting" | "success" | "error";
    message?: string;
  }>({ status: "idle" });
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const fieldClassName =
    "rounded-[1.25rem] border border-border bg-white/76 px-4 py-3.5 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/12";

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileContainerRef.current) {
      return;
    }

    let active = true;
    let loadHandler: (() => void) | null = null;
    const container = turnstileContainerRef.current;

    const renderWidget = () => {
      if (!active || !container || widgetIdRef.current || !window.turnstile) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: turnstileSiteKey,
        callback: (token) => {
          setCaptchaToken(token);
          setCaptchaReady(true);
        },
        "expired-callback": () => {
          setCaptchaToken("");
          setCaptchaReady(false);
        },
        "error-callback": () => {
          setCaptchaToken("");
          setCaptchaReady(false);
        },
        theme: "light",
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-turnstile-script="true"]',
      );

      loadHandler = () => renderWidget();

      if (existingScript) {
        existingScript.addEventListener("load", loadHandler, { once: true });
      } else {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = "true";
        script.addEventListener("load", loadHandler, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      active = false;

      if (loadHandler) {
        const existingScript = document.querySelector<HTMLScriptElement>(
          'script[data-turnstile-script="true"]',
        );
        existingScript?.removeEventListener("load", loadHandler);
      }

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [turnstileSiteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("captchaToken", captchaToken);

    if (turnstileSiteKey && !captchaToken) {
      setState({
        status: "error",
        message: "Complete the bot protection check before sending your message.",
      });
      return;
    }

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
      setCaptchaToken("");
      setCaptchaReady(false);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
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
            <p className="signal-label">{eyebrow}</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.05em] text-balance">
              {title}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              {description}
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-border bg-white/60 px-4 py-3 text-xs uppercase tracking-[0.24em] text-muted">
            {badge}
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
      <input type="hidden" name="captchaToken" value={captchaToken} />

      {turnstileSiteKey ? (
        <div className="mt-5 rounded-[1.25rem] border border-border bg-white/55 p-4">
          <p className="text-sm text-muted">
            Complete the bot protection check before sending your message.
          </p>
          <div ref={turnstileContainerRef} className="mt-4" />
          {!captchaReady ? (
            <p className="mt-3 text-xs text-muted">
              Bot protection is required for public submissions.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          disabled={state.status === "submitting" || (Boolean(turnstileSiteKey) && !captchaToken)}
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
