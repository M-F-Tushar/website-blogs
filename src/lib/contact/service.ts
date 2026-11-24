import "server-only";

import type { z } from "zod";

import {
  buildSubmissionFingerprint,
  ContactRequestError,
  evaluateContactSubmission,
  logContactOperationFailure,
  verifyTurnstileToken,
} from "@/lib/contact/anti-abuse";
import { contactMessageSchema } from "@/lib/content/validators";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { normalizeEmailAddress } from "@/lib/utils";

export type ValidatedContactMessage = z.output<typeof contactMessageSchema>;

interface ContactRequestMetadata {
  sourceIp: string | null;
  userAgent: string | null;
}

async function getContactNotificationRecipient(supabase = createServiceRoleClient()) {
  const explicitRecipient = normalizeEmailAddress(
    process.env.CONTACT_NOTIFICATION_EMAIL,
  );
  if (explicitRecipient) {
    return explicitRecipient;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("contact_email")
    .eq("site_key", "primary")
    .maybeSingle();

  if (error) {
    logContactOperationFailure("contact_notification_recipient", error.code);
    return null;
  }

  return normalizeEmailAddress(data?.contact_email);
}

async function sendContactNotificationEmail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  spamScore: number;
  spamFlags: string[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_NOTIFICATION_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return;
  }

  const recipient = await getContactNotificationRecipient();
  if (!recipient) {
    return;
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipient],
        reply_to: input.email,
        subject: `New contact message: ${input.subject}`,
        text: [
          `From: ${input.name} <${input.email}>`,
          `Spam score: ${input.spamScore}`,
          `Spam flags: ${input.spamFlags.join(", ") || "none"}`,
          "",
          input.message,
        ].join("\n"),
      }),
      cache: "no-store",
    });
  } catch {
    logContactOperationFailure("contact_notification_provider", "network_error");
    return;
  }

  if (!response.ok) {
    logContactOperationFailure(
      "contact_notification_provider",
      `http_${response.status}`,
    );
  }
}

function unavailableContactStorage() {
  return new ContactRequestError(
    "Contact abuse controls are temporarily unavailable.",
    503,
    false,
  );
}

export async function submitContactMessage(
  input: ValidatedContactMessage,
  requestMeta: ContactRequestMetadata,
) {
  const payload = contactMessageSchema.parse(input);
  const canonicalEmail = normalizeEmailAddress(payload.email);

  await verifyTurnstileToken(payload.captchaToken, requestMeta.sourceIp);

  if (!canonicalEmail) {
    throw new ContactRequestError("Enter a valid email address.", 400);
  }

  const supabase = createServiceRoleClient();
  const fingerprint = buildSubmissionFingerprint({
    email: canonicalEmail,
    message: payload.message,
    sourceIp: requestMeta.sourceIp,
    userAgent: requestMeta.userAgent,
  });
  const evaluation = evaluateContactSubmission({
    name: payload.name,
    subject: payload.subject,
    message: payload.message,
    duplicateMessageCount: 0,
    recentEmailCount: 0,
    fingerprintCount: 0,
  });

  if (evaluation.rejectReason) {
    throw new ContactRequestError(evaluation.rejectReason, 400);
  }

  const { data, error } = await supabase.rpc("submit_contact_message_atomic", {
    p_name: payload.name,
    p_email: canonicalEmail,
    p_subject: payload.subject,
    p_message: payload.message,
    p_source_ip: requestMeta.sourceIp ?? "",
    p_user_agent: requestMeta.userAgent ?? "",
    p_fingerprint: fingerprint,
    p_base_score: evaluation.score,
    p_base_flags: evaluation.flags,
  });

  if (error) {
    logContactOperationFailure("contact_atomic_submission", error.code);

    if (error.message === "CONTACT_RATE_LIMIT") {
      throw new ContactRequestError(
        "Too many messages sent recently. Please try again later.",
        429,
      );
    }

    if (error.message === "CONTACT_REJECTED") {
      throw new ContactRequestError(
        "This submission looks automated or abusive. Please revise it and try again.",
        400,
      );
    }

    throw unavailableContactStorage();
  }

  const storedEvaluation = data?.[0];
  if (!storedEvaluation) {
    logContactOperationFailure("contact_atomic_submission", "empty_result");
    throw unavailableContactStorage();
  }

  if (storedEvaluation.spam_score < 40) {
    await sendContactNotificationEmail({
      name: payload.name,
      email: canonicalEmail,
      subject: payload.subject,
      message: payload.message,
      spamScore: storedEvaluation.spam_score,
      spamFlags: storedEvaluation.spam_flags,
    });
  }
}
