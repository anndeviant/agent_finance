-- =====================================================================
-- SKRIP UPDATE SUPABASE: POLICY TRANSAKSI & TABEL 5 FINANCIAL PLANS
-- Salin dan jalankan seluruh isi file ini di Supabase > SQL Editor
-- =====================================================================

-- 1. Berikan izin baca (SELECT) publik untuk tabel transactions agar dashboard web bisa membaca data
grant select on public.transactions to anon, authenticated;

-- Buat policy jika belum ada
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'transactions' and policyname = 'Allow public read transactions'
  ) then
    create policy "Allow public read transactions"
      on public.transactions
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;


-- 2. Buat tabel financial_plans (5 Plan Anak Kost & Money Management)
create table if not exists public.financial_plans (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  type           text not null check (type in ('budget', 'goal')),
  target_amount  bigint not null check (target_amount > 0),
  current_amount bigint not null default 0 check (current_amount >= 0),
  category_tag   text not null,
  icon           text default 'wallet',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Pengaturan keamanan RLS untuk financial_plans
alter table public.financial_plans enable row level security;

-- Berikan izin akses ke tabel financial_plans
grant select, update on public.financial_plans to anon, authenticated;
grant all on public.financial_plans to service_role;

-- Policy agar dashboard publik bisa membaca dan memperbarui nominal target
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'financial_plans' and policyname = 'Allow public read financial_plans'
  ) then
    create policy "Allow public read financial_plans"
      on public.financial_plans
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'financial_plans' and policyname = 'Allow public update financial_plans'
  ) then
    create policy "Allow public update financial_plans"
      on public.financial_plans
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;
end $$;


-- 3. Masukkan 5 Data Plan Awal Khas Anak Kost (Hanya jika tabel masih kosong)
insert into public.financial_plans (name, type, target_amount, current_amount, category_tag, icon)
select 'Sewa Kost & Utilitas', 'budget', 1500000, 0, 'kost', 'home'
where not exists (select 1 from public.financial_plans where name = 'Sewa Kost & Utilitas');

insert into public.financial_plans (name, type, target_amount, current_amount, category_tag, icon)
select 'Jatah Makan & Minum', 'budget', 1500000, 0, 'makanan', 'utensils'
where not exists (select 1 from public.financial_plans where name = 'Jatah Makan & Minum');

insert into public.financial_plans (name, type, target_amount, current_amount, category_tag, icon)
select 'Kebutuhan Kost & Laundry', 'budget', 400000, 0, 'kebutuhan', 'shopping-bag'
where not exists (select 1 from public.financial_plans where name = 'Kebutuhan Kost & Laundry');

insert into public.financial_plans (name, type, target_amount, current_amount, category_tag, icon)
select 'Dana Darurat Anak Kost', 'goal', 5000000, 500000, 'darurat', 'shield'
where not exists (select 1 from public.financial_plans where name = 'Dana Darurat Anak Kost');

insert into public.financial_plans (name, type, target_amount, current_amount, category_tag, icon)
select 'Tabungan Impian / Self-Reward', 'goal', 3000000, 300000, 'tabungan', 'sparkles'
where not exists (select 1 from public.financial_plans where name = 'Tabungan Impian / Self-Reward');
