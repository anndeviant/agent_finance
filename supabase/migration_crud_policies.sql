-- =====================================================================
-- AKTIFKAN FULL CRUD (SELECT, INSERT, UPDATE, DELETE) DI SUPABASE
-- Salin dan jalankan seluruh isi file ini di Supabase > SQL Editor
-- =====================================================================

-- 1. Berikan hak akses penuh untuk tabel transactions ke anon & authenticated
grant all on public.transactions to anon, authenticated;

-- Buat policy INSERT, UPDATE, DELETE untuk transactions jika belum ada
do $$
begin
  -- Policy Insert
  if not exists (
    select 1 from pg_policies where tablename = 'transactions' and policyname = 'Allow public insert transactions'
  ) then
    create policy "Allow public insert transactions"
      on public.transactions
      for insert
      to anon, authenticated
      with check (true);
  end if;

  -- Policy Update
  if not exists (
    select 1 from pg_policies where tablename = 'transactions' and policyname = 'Allow public update transactions'
  ) then
    create policy "Allow public update transactions"
      on public.transactions
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  -- Policy Delete
  if not exists (
    select 1 from pg_policies where tablename = 'transactions' and policyname = 'Allow public delete transactions'
  ) then
    create policy "Allow public delete transactions"
      on public.transactions
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;


-- 2. Berikan hak akses penuh untuk tabel financial_plans ke anon & authenticated
grant all on public.financial_plans to anon, authenticated;

-- Buat policy INSERT & DELETE untuk financial_plans jika belum ada
do $$
begin
  -- Policy Insert
  if not exists (
    select 1 from pg_policies where tablename = 'financial_plans' and policyname = 'Allow public insert financial_plans'
  ) then
    create policy "Allow public insert financial_plans"
      on public.financial_plans
      for insert
      to anon, authenticated
      with check (true);
  end if;

  -- Policy Delete
  if not exists (
    select 1 from pg_policies where tablename = 'financial_plans' and policyname = 'Allow public delete financial_plans'
  ) then
    create policy "Allow public delete financial_plans"
      on public.financial_plans
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;
