"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PropsWithChildren,
} from "react";

import {
  initialAdminActionState,
  type AdminActionState,
  type AdminFormAction,
} from "@/features/admin/action-state";

export function AdminActionForm({
  action,
  children,
  className,
  pendingMessage = "Saving changes...",
}: PropsWithChildren<{
  action: AdminFormAction;
  className?: string;
  pendingMessage?: string;
}>) {
  const [state, formAction, isPending] = useActionState<
    AdminActionState,
    FormData
  >(action, initialAdminActionState);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [submittedValues, setSubmittedValues] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (state.status === "error") {
      const form = formRef.current;
      if (form) {
        form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          "input[name], textarea[name], select[name]",
        ).forEach((control) => {
          const values = submittedValues[control.name];
          if (!values || control instanceof HTMLInputElement && control.type === "file") {
            return;
          }

          if (control instanceof HTMLInputElement && control.type === "checkbox") {
            control.checked = values.includes(control.value || "on");
          } else if (
            control instanceof HTMLInputElement &&
            control.type === "radio"
          ) {
            control.checked = values.includes(control.value);
          } else {
            control.value = values.at(-1) ?? "";
          }
        });
      }

      alertRef.current?.focus();
    }
  }, [state, submittedValues]);

  function rememberSubmittedValues(event: FormEvent<HTMLFormElement>) {
    const nextValues: Record<string, string[]> = {};

    for (const [name, entry] of new FormData(event.currentTarget)) {
      if (typeof entry !== "string") {
        continue;
      }

      (nextValues[name] ??= []).push(entry);
    }

    event.currentTarget
      .querySelectorAll<HTMLInputElement>(
        'input[name][type="checkbox"], input[name][type="radio"]',
      )
      .forEach((control) => {
        nextValues[control.name] ??= [];
      });

    setSubmittedValues(nextValues);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={rememberSubmittedValues}
      className={className}
      aria-busy={isPending}
    >
      <fieldset disabled={isPending} className="contents">
        {children}
      </fieldset>

      {isPending ? (
        <p role="status" className="text-sm text-muted">
          {pendingMessage}
        </p>
      ) : null}

      {state.status === "error" && state.message ? (
        <p
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 focus-visible:outline-none"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
