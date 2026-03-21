import { AdminPageIntro, AdminPanel, AdminSelect, StatusPill } from "@/components/admin/primitives";
import { getAdminMessages } from "@/lib/content/admin-queries";
import { formatDisplayDate } from "@/lib/utils";
import { updateMessageStatusAction } from "@/features/admin/content-actions";

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

              <form
                action={updateMessageStatusAction}
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
              </form>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
