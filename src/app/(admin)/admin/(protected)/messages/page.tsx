import Link from "next/link";

import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageIntro, AdminPanel, AdminSelect, StatusPill } from "@/components/admin/primitives";
import { getAdminMessages } from "@/lib/content/admin-queries";
import { formatDisplayDate } from "@/lib/utils";
import { updateMessageStatusFormAction } from "@/features/admin/content-actions";

export default async function AdminMessagesPage() {
  const messages = await getAdminMessages();

  return (
    <div className="space-y-8">
      <AdminPageIntro
        eyebrow="System"
        title="Contact inbox"
        description="Private inbound messages with lightweight spam scoring and status tracking."
      />

      <AdminPanel>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-border bg-white/45 p-6">
              <h2 className="font-display text-xl font-semibold text-foreground">
                The inbox is clear
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                New contact messages will appear here with their spam and handling status.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-white"
              >
                Open contact page
              </Link>
            </div>
          ) : null}
          {messages.map((message) => (
            <div
              key={message.id}
              className="rounded-[1.25rem] border border-border bg-white/55 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">
                    {message.subject} · {message.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">{message.email}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted">
                    {formatDisplayDate(message.createdAt)}
                  </p>
                </div>
                <StatusPill
                  tone={message.status === "new" ? "warning" : "success"}
                >
                  {message.status}
                </StatusPill>
              </div>

              <p className="mt-4 text-sm leading-7 text-foreground">{message.message}</p>

              <AdminActionForm
                action={updateMessageStatusFormAction}
                className="mt-5 flex flex-wrap items-center gap-3"
              >
                <input type="hidden" name="id" value={message.id} />
                <AdminSelect name="status" defaultValue={message.status}>
                  <option value="new">new</option>
                  <option value="reviewed">reviewed</option>
                  <option value="replied">replied</option>
                  <option value="archived">archived</option>
                </AdminSelect>
                <button
                  type="submit"
                  className="inline-flex rounded-full bg-surface-dark px-4 py-2 text-sm font-medium text-white"
                >
                  Update status
                </button>
              </AdminActionForm>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
