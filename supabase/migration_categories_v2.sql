-- =====================================================================
-- MIGRASI KATEGORI V2 (14 kategori lama -> 9 kategori baru)
-- Jalankan SEKALI di Supabase > SQL Editor. Aman dijalankan ulang.
--
-- Pengeluaran : makanan, kost, transportasi, kebutuhan, tagihan, kesehatan, lainnya
-- Pemasukan   : gaji, lainnya_masuk
--
-- Pemetaan otomatis:
--   keperluan_kost, laundry, belanja -> kebutuhan
--   hiburan, pendidikan              -> lainnya
--   freelance, bonus                 -> lainnya_masuk
-- =====================================================================

begin;

-- 1. Koreksi per transaksi (salah kategori menurut aturan baru).
--    Dicek juga kategori lamanya, jadi tidak menimpa yang sudah diedit manual.
update public.transactions t
   set category = v.new_category
  from (values
    (6,   'belanja',        'kesehatan'),  -- face wash
    (194, 'belanja',        'kesehatan'),  -- skincare g2g moist ungu
    (39,  'belanja',        'lainnya'),    -- buku
    (73,  'keperluan_kost', 'kesehatan'),  -- hand body lotion
    (104, 'keperluan_kost', 'kesehatan'),  -- parfum
    (213, 'lainnya',        'kesehatan'),  -- tawas deodoran
    (172, 'lainnya',        'kebutuhan')   -- benang jahit sol sepatu
  ) as v(id, old_category, new_category)
 where t.id = v.id
   and t.category = v.old_category;

-- 2. Pemetaan otomatis kategori lama.
update public.transactions
   set category = case category
         when 'keperluan_kost' then 'kebutuhan'
         when 'laundry'        then 'kebutuhan'
         when 'belanja'        then 'kebutuhan'
         when 'hiburan'        then 'lainnya'
         when 'pendidikan'     then 'lainnya'
         when 'freelance'      then 'lainnya_masuk'
         when 'bonus'          then 'lainnya_masuk'
       end
 where category in ('keperluan_kost', 'laundry', 'belanja', 'hiburan', 'pendidikan', 'freelance', 'bonus');

-- 3. Kategori yang tidak cocok dengan tipenya (atau tidak dikenal) -> default.
update public.transactions
   set category = 'lainnya'
 where type = 'expense'
   and category not in ('makanan', 'kost', 'transportasi', 'kebutuhan', 'tagihan', 'kesehatan', 'lainnya');

update public.transactions
   set category = 'lainnya_masuk'
 where type = 'income'
   and category not in ('gaji', 'lainnya_masuk');

-- 4. Draft bot yang masih pending: ubah kategori di dalam JSON-nya juga,
--    supaya tombol "Simpan" pada draft lama tidak gagal oleh constraint di bawah.
update public.drafts d
   set items = (
     select jsonb_agg(
              case
                when x->>'category' in ('keperluan_kost', 'laundry', 'belanja')
                  then jsonb_set(x, '{category}', '"kebutuhan"')
                when x->>'category' in ('hiburan', 'pendidikan')
                  then jsonb_set(x, '{category}', '"lainnya"')
                when x->>'category' in ('freelance', 'bonus')
                  then jsonb_set(x, '{category}', '"lainnya_masuk"')
                else x
              end
              order by ord)
       from jsonb_array_elements(d.items) with ordinality as e(x, ord)
   )
 where d.status = 'pending'
   and jsonb_typeof(d.items) = 'array'
   and jsonb_array_length(d.items) > 0;

-- 5. Plan: tag kategori lama -> baru.
update public.financial_plans
   set category_tag = 'kebutuhan',
       updated_at   = now()
 where category_tag in ('keperluan_kost', 'laundry', 'belanja');

update public.financial_plans
   set name       = 'Kebutuhan Kost & Laundry',
       updated_at = now()
 where name = 'Keperluan Kost & Laundry';

update public.financial_plans
   set category_tag = 'darurat',
       updated_at   = now()
 where category_tag = 'tabungan_darurat';

-- 6. Kunci daftar kategori di database (kategori harus cocok dengan tipenya).
alter table public.transactions drop constraint if exists transactions_category_check;
alter table public.transactions add constraint transactions_category_check check (
  (type = 'expense' and category in ('makanan', 'kost', 'transportasi', 'kebutuhan', 'tagihan', 'kesehatan', 'lainnya'))
  or
  (type = 'income'  and category in ('gaji', 'lainnya_masuk'))
);

commit;

-- 7. Cek hasil (harus hanya berisi 9 kategori baru).
select type, category, count(*) as jumlah, sum(amount) as total
  from public.transactions
 group by type, category
 order by type, total desc;
