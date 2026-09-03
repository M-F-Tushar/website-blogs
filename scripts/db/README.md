# scripts/db — One-Time Database Scripts

These SQL scripts were used during the June 2026 production database migration session.
They have **already been executed** against the live Supabase instance and are archived
here for historical reference only.

> [!WARNING]
> Do NOT run these scripts again — they are one-time operations and re-running them may
> cause data loss or constraint violations.

## Files

| File | Purpose |
|---|---|
| `full_migration_for_supabase.sql` | Full schema dump before the legacy upgrade |
| `clean_legacy.sql` | Removed legacy columns and constraints |
| `fix_profiles.sql` | Fixed the profiles table role column |
| `fix_constraint.sql` | Patched a constraint that blocked profile upserts |
| `reload_cache.sql` | Triggered a PostgREST schema cache reload |

## Official Migrations

Live, tracked migrations are in `supabase/migrations/` and managed by the Supabase CLI.

## Ledger Repair

Because the scripts above were applied by hand, the hosted project's migration history
table does not know about the tracked migrations even though the schema matches them.
Before the next `supabase db push`, run `npm run db:check` against the linked project and
follow Manual Task H in [`docs/manual-operator-guide.md`](../../docs/manual-operator-guide.md)
to mark the already-applied versions as `applied`.
