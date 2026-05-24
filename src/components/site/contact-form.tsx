"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Send } from "lucide-react";

import type { ContactBotProtectionMode } from "@/lib/supabase/env";

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

export interface ContactFormCopy {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  requiredMarker: string;
  submitLabel: string;
  submittingLabel: string;
  captchaPrompt: string;
  captchaRequired: string;
  captchaMissingError: string;
  misconfiguredError: string;
  genericError: string;
  successFallback: string;
}

const DEFAULT_COPY: ContactFormCopy = {
  eyebrow: "Secure intake",
  title: "Start the conversation",
  description:
    "Use this channel for collaboration, research questions, project ideas, or thoughtful technical discussion.",
  badge: "Thoughtful replies over volume",
  nameLabel: "Your Name",
  namePlaceholder: "John Doe",
  emailLabel: "Email Address",
  emailPlaceholder: "john@example.com",
  subjectLabel: "Subject",
  subjectPlaceholder: "Project inquiry",
  messageLabel: "Message",
  messagePlaceholder: "Tell me about your project or inquiry...",
  requiredMarker: "*",
  submitLabel: "Send Message",
  submittingLabel: "Sending...",
  captchaPrompt: "Complete the bot protection check before sending your message.",
  captchaRequired: "Bot protection is required for public submissions.",
  captchaMissingError: "Complete the bot protection check before sending your message.",
  misconfiguredError:
    "This form is temporarily unavailable because bot protection is not configured correctly.",
  genericError: "Something went wrong while sending the message.",
  successFallback: "Message sent successfully.",
};

interface ContactFormProps {
  copy?: Partial<ContactFormCopy>;
  botProtectionMode?: ContactBotProtectionMode;
  turnstileSiteKey?: string | null;
}

export function ContactForm({
  copy: copyOverrides,
  botProtectionMode = "disabled",
  turnstileSiteKey = null,
}: ContactFormProps) {
  const copy: ContactFormCopy = { ...DEFAULT_COPY, ...copyOverrides };
  const [state, setState] = useState<{
    status: "idle" | "submitting" | "success" | "error";
    message?: string;
  }>({ status: "idle" });
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const reactId = useId();
  const nameId = `${reactId}-name`;
  const emailId = `${reactId}-email`;
  const subjectId = `${reactId}-subject`;
  const messageId = `${reactId}-message`;
  const statusId = `${reactId}-status`;
  const requiresBotProtection =
    botProtectionMode === "required" && Boolean(turnstileSiteKey);
  const botProtectionMisconfigured = botProtectionMode === "misconfigured";
  const fieldClassName =
    "rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/30 focus:bg-white/7 focus-visible:ring-2 focus-visible:ring-sky-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";
  const requiredMark = (
    <span aria-hidden className="ml-1 text-sky-400">
      {copy.requiredMarker}
    </span>
  );

  useEffect(() => {
    if (!requiresBotProtection || !turnstileSiteKey || !turnstileContainerRef.current) {
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
        theme: "dark",
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
  }, [requiresBotProtection, turnstileSiteKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "submitting" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("captchaToken", captchaToken);

    if (botProtectionMisconfigured) {
      setState({ status: "error", message: copy.misconfiguredError });
      return;
    }

    if (requiresBotProtection && !captchaToken) {
      setState({ status: "error", message: copy.captchaMissingError });
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? copy.genericError);
      }

      form.reset();
      setCaptchaToken("");
      setCaptchaReady(false);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      setState({
        status: "success",
        message: payload.message ?? copy.successFallback,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : copy.genericError,
      });
    }
  }

  const hasError = state.status === "error";
  const describedBy = state.message ? statusId : undefined;

  return (
    <form
      className="surface-panel rounded-[1.8rem] p-6 md:p-8"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="signal-label">{copy.eyebrow}</p>
          <h2 className="mt-4 font-display text-[2.4rem] font-semibold leading-[1.02] tracking-[-0.05em] text-white">
            {copy.title}
          </h2>
          <p className="mt-3 max-w-2xl text-[0.98rem] leading-8 text-slate-400">
            {copy.description}
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-400">
          {copy.badge}
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2 text-sm text-slate-300">
          <label htmlFor={nameId}>
            {copy.nameLabel}
            {requiredMark}
          </label>
          <input
            id={nameId}
            name="name"
            required
            autoComplete="name"
            className={fieldClassName}
            placeholder={copy.namePlaceholder}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
          />
        </div>
        <div className="flex flex-col gap-2 text-sm text-slate-300">
          <label htmlFor={emailId}>
            {copy.emailLabel}
            {requiredMark}
          </label>
          <input
            id={emailId}
            name="email"
            required
            type="email"
            autoComplete="email"
            className={fieldClassName}
            placeholder={copy.emailPlaceholder}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm text-slate-300">
        <label htmlFor={subjectId}>
          {copy.subjectLabel}
          {requiredMark}
        </label>
        <input
          id={subjectId}
          name="subject"
          required
          className={fieldClassName}
          placeholder={copy.subjectPlaceholder}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm text-slate-300">
        <label htmlFor={messageId}>
          {copy.messageLabel}
          {requiredMark}
        </label>
        <textarea
          id={messageId}
          name="message"
          required
          rows={7}
          className={fieldClassName}
          placeholder={copy.messagePlaceholder}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
        />
      </div>

      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-px w-px overflow-hidden opacity-0"
      />
      <input type="hidden" name="captchaToken" value={captchaToken} />

      {requiresBotProtection ? (
        <div className="mt-5 rounded-[1.25rem] border border-white/8 bg-white/4 p-4">
          <p className="text-sm text-slate-400">{copy.captchaPrompt}</p>
          <div ref={turnstileContainerRef} className="mt-4" />
          {!captchaReady ? (
            <p className="mt-3 text-xs text-slate-500">{copy.captchaRequired}</p>
          ) : null}
        </div>
      ) : null}

      {botProtectionMisconfigured ? (
        <div className="mt-5 rounded-[1.25rem] border border-amber-400/20 bg-amber-400/10 p-4">
          <p className="text-sm text-amber-200">{copy.misconfiguredError}</p>
          <p className="mt-2 text-xs text-amber-100/80">
            Add both `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in non-local environments.
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <button
          type="submit"
          disabled={
            state.status === "submitting" ||
            botProtectionMisconfigured ||
            (requiresBotProtection && !captchaToken)
          }
          className="inline-flex items-center justify-center gap-2 rounded-[1.15rem] bg-sky-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden />
          {state.status === "submitting" ? copy.submittingLabel : copy.submitLabel}
        </button>
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={
            state.message
              ? state.status === "success"
                ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300"
                : "rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300"
              : "sr-only"
          }
        >
          {state.message ?? ""}
        </p>
      </div>
    </form>
  );
}
