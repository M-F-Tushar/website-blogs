# scripts/db — One-Time Database Scripts

The SQL scripts used during the June 2026 production database migration were removed
from the executable tree after they had already been applied. They remain available
in repository history for forensic reference only.

> [!WARNING]
> Do NOT run these scripts again — they are one-time operations and re-running them may
> cause data loss or constraint violations.

The old hand-run scripts are intentionally not present as runnable `.sql` files.

## Official Migrations

Live, tracked migrations are in `supabase/migrations/` and managed by the Supabase CLI.

## Ledger Repair

Because the scripts above were applied by hand, the hosted project's migration history
table does not know about the tracked migrations even though the schema matches them.
Before the next `npx supabase db push`, run `npm run db:check` and
`npx supabase db diff --linked --schema public` against the linked project and
follow Manual Task H in [`docs/manual-operator-guide.md`](../../docs/manual-operator-guide.md)
to mark the already-applied versions as `applied`.
