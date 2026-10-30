-- Jalankan sekali di Supabase Dashboard > SQL Editor.

-- 1. Mencegah update Telegram yang sama diproses dua kali
create table if not exists public.processed_updates (
  update_id  bigint primary key,
  created_at timestamptz not null default now()
);

-- 2. Draft hasil AI sebelum dikonfirmasi
create table if not exists public.drafts (
  id         uuid primary key default gen_random_uuid(),
  transcript text not null default '',
  items      jsonb not null,
  status     text not null default 'pending'
             check (status in ('pending', 'saved', 'cancelled')),
  created_at timestamptz not null default now()
);

-- 3. Transaksi final
create table if not exists public.transactions (
  id          bigint generated always as identity primary key,
  draft_id    uuid not null references public.drafts(id),
  type        text not null check (type in ('income', 'expense')),
  amount      bigint not null check (amount > 0),
  category    text not null,
  description text not null,
  trx_date    date not null,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_trx_date_idx on public.transactions (trx_date);

-- Simpan draft secara atomik: hanya draft 'pending' yang bisa disimpan, sekali saja.
-- Return jumlah transaksi tersimpan, atau -1 jika draft sudah diproses / tidak ada.
create or replace function public.save_draft(p_draft_id uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_items jsonb;
  v_count integer;
begin
  update public.drafts
     set status = 'saved'
   where id = p_draft_id and status = 'pending'
  returning items into v_items;

  if not found then
    return -1;
  end if;

  insert into public.transactions (draft_id, type, amount, category, description, trx_date)
  select p_draft_id,
         x->>'type',
         (x->>'amount')::bigint,
         x->>'category',
         x->>'description',
         (x->>'date')::date
    from jsonb_array_elements(v_items) as x;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Total hari ini dan bulan berjalan
create or replace function public.get_summary(p_today date)
returns table (
  today_income  bigint,
  today_expense bigint,
  month_income  bigint,
  month_expense bigint
)
language sql
stable
set search_path = public
as $$
  select
    coalesce(sum(amount) filter (where type = 'income'  and trx_date = p_today), 0)::bigint,
    coalesce(sum(amount) filter (where type = 'expense' and trx_date = p_today), 0)::bigint,
    coalesce(sum(amount) filter (where type = 'income'), 0)::bigint,
    coalesce(sum(amount) filter (where type = 'expense'), 0)::bigint
  from public.transactions
  where trx_date >= date_trunc('month', p_today)::date
    and trx_date <= p_today;
$$;

-- Keamanan: tabel tertutup untuk akses publik; hanya backend (secret key) yang boleh.
alter table public.processed_updates enable row level security;
alter table public.drafts            enable row level security;
alter table public.transactions      enable row level security;

revoke all on public.processed_updates, public.drafts, public.transactions from anon, authenticated;
grant select, insert, update, delete on public.processed_updates, public.drafts, public.transactions to service_role;
grant usage, select on all sequences in schema public to service_role;

revoke execute on function public.save_draft(uuid), public.get_summary(date) from public, anon, authenticated;
grant execute on function public.save_draft(uuid), public.get_summary(date) to service_role;
