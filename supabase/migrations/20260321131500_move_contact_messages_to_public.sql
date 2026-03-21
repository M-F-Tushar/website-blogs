do $$
begin
  if not exists (
    select 1
    from pg_type
    join pg_namespace on pg_namespace.oid = pg_type.typnamespace
    where pg_type.typname = 'contact_message_status'
      and pg_namespace.nspname = 'public'
  ) then
    create type public.contact_message_status as enum ('new', 'reviewed', 'replied', 'archived');
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'private'
      and table_name = 'contact_messages'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'contact_messages'
  ) then
    alter table private.contact_messages set schema public;
  end if;
end
$$;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status public.contact_message_status not null default 'new',
  spam_score integer not null default 0,
  spam_flags text[] not null default array[]::text[],
  source_ip text,
  user_agent text,
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contact_messages'
      and column_name = 'status'
      and udt_schema <> 'public'
  ) then
    alter table public.contact_messages
      alter column status drop default;

    alter table public.contact_messages
      alter column status type public.contact_message_status
      using status::text::public.contact_message_status;

    alter table public.contact_messages
      alter column status set default 'new'::public.contact_message_status;
  end if;
end
$$;

alter table public.contact_messages enable row level security;

drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at
before update on public.contact_messages
for each row
execute function public.set_updated_at();

drop policy if exists "Admins manage contact messages" on public.contact_messages;
create policy "Admins manage contact messages" on public.contact_messages
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
