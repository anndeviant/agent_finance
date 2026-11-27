// Satu-satunya sumber kategori untuk bot. Prompt Gemini, validasi, dan label
// draft semuanya dibangun dari daftar ini. Jika menambah/mengubah kategori,
// sesuaikan juga dashboard/src/lib/categories.js dan constraint di Supabase.

export const EXPENSE_CATEGORIES = [
  {
    key: 'makanan',
    label: 'Makan & Minum',
    scope: 'Semua yang dimakan/diminum, termasuk pesan antar',
    examples:
      'makan siang/malam, sarapan, warteg, warmindo, nasi padang, nasi kuning, nasi uduk, bakso, mie ayam, seblak, ayam geprek, sate, bubur, gorengan, roti, snack, jajan, cemilan, kopi, es teh, boba, jus, air mineral botol, minuman di Indomaret/Alfamart, cafe, nongkrong ngopi, resto, McD, KFC, GoFood, GrabFood, ShopeeFood, catering, beras, telur, mie instan, bahan masak, buah',
  },
  {
    key: 'kost',
    label: 'Kost & Utilitas',
    scope: 'Biaya tempat tinggal',
    examples:
      'sewa/bayar kost, uang kamar, deposit kost, token listrik, pulsa listrik, listrik kost, air/PDAM, iuran wifi kost, iuran sampah, iuran kebersihan, uang keamanan',
  },
  {
    key: 'transportasi',
    label: 'Transportasi',
    scope: 'Biaya perjalanan dan kendaraan',
    examples:
      'KRL, MRT, LRT, TransJakarta, busway, angkot, bus, kereta, tiket pesawat, travel, pulang kampung, GoRide, GrabBike, GoCar, GrabCar, Maxim, ojek, taksi, bensin, Pertalite, Pertamax, parkir, tol, e-toll, isi saldo kartu transport, servis motor, ganti oli, ban, tambal ban, cuci motor, sparepart, pajak kendaraan, SIM/STNK',
  },
  {
    key: 'kebutuhan',
    label: 'Kebutuhan & Barang',
    scope: 'Barang habis pakai rutin, perlengkapan kost, laundry, dan barang lainnya',
    examples:
      'sabun mandi, sampo, odol, sikat gigi, siwak, deterjen, pewangi pakaian, sabun cuci piring, pembersih lantai, pel, sikat, tisu, kapas, pembalut, galon/isi ulang air, gas LPG, obat nyamuk, pewangi ruangan, sapu, gantungan, ember, kasur, bantal, rak, lampu, colokan, alat makan, tumbler, laundry, cuci setrika, dry clean, pakaian, baju, kaos, celana, sepatu, sandal, tas, aksesori, benang/jahit, charger, kabel, earphone, gadget, alat tulis, belanja Shopee/Tokopedia (barang)',
  },
  {
    key: 'tagihan',
    label: 'Tagihan & Langganan',
    scope: 'Komunikasi, langganan digital, dan biaya rutin pribadi',
    examples:
      'pulsa HP, paket data, kuota, IndiHome/Biznet pribadi, Netflix, Spotify, YouTube Premium, Disney+, iCloud, Google One, ChatGPT/Claude, langganan aplikasi, biaya admin bank, biaya transfer, biaya top-up, cicilan, paylater, BPJS',
  },
  {
    key: 'kesehatan',
    label: 'Kesehatan & Perawatan Diri',
    scope: 'Obat, medis, dan perawatan wajah/badan',
    examples:
      'obat, Paracetamol, Promag, vitamin, suplemen, apotek, dokter, klinik, puskesmas, rumah sakit, cek lab, gigi, kacamata, lensa, softlens, masker, skincare, facial wash, sabun muka, toner, serum, moisturizer, sunscreen, sunblock, lip balm, body lotion, hand body, masker wajah, acne patch, deodoran, tawas, parfum, waxing, potong rambut, barbershop, salon, gym, olahraga, sewa lapangan',
  },
  {
    key: 'lainnya',
    label: 'Lainnya',
    scope: 'Semua pengeluaran yang tidak cocok di atas',
    examples:
      'hiburan, bioskop, konser, game, top-up game, mainan, karaoke, liburan, wisata, tiket masuk tempat wisata, buku, kursus, fotokopi, print, jilid, biaya kuliah/UKT, seminar, hadiah, kado, kondangan, donasi, zakat, sedekah, infak, kirim uang ke keluarga, traktir orang, pinjamkan uang, bayar utang, menabung/investasi, denda, GoSend',
  },
];

export const INCOME_CATEGORIES = [
  {
    key: 'gaji',
    label: 'Gaji',
    scope: 'Penghasilan rutin dari pekerjaan utama',
    examples: 'gaji, gajian, salary, penghasilan bulanan, uang saku bulanan, THR, bonus kantor, lembur, insentif, tunjangan',
  },
  {
    key: 'lainnya_masuk',
    label: 'Pemasukan Lain',
    scope: 'Semua uang masuk selain gaji',
    examples:
      'freelance, project, fee, komisi, jualan, jual barang bekas, kiriman ortu, transfer masuk, beasiswa, hadiah uang, angpao, cashback, refund, uang kembali, dibayar utang, bunga bank, dividen, menang lomba',
  },
];

export const RULES = [
  'Kategori ditentukan oleh BARANGNYA, bukan tokonya. "Indomaret beli aqua dan sabun" dipecah jadi 2 transaksi: makanan dan kebutuhan. Jika hanya nama toko tanpa barang, pakai kebutuhan.',
  'Pesan antar ikut isinya: GoFood/GrabFood = makanan; GoRide/GoCar = transportasi; GoSend = lainnya. Ongkir ikut kategori barangnya.',
  'Sabun mandi, sampo, odol = kebutuhan. Sabun muka/facial wash dan semua produk perawatan wajah/kulit/badan = kesehatan.',
  'Galon/isi ulang air untuk kost = kebutuhan. Air botol yang langsung diminum = makanan. Air PDAM = kost.',
  'Wifi yang dibayar sebagai iuran kost = kost. Paket data/pulsa HP/IndiHome pribadi = tagihan.',
  'Token/pulsa listrik dan listrik kost selalu kost.',
  'Langganan digital = tagihan. Membership gym = kesehatan. Top-up game = lainnya.',
  'Yang dibeli di cafe = makanan. Tiket hiburan/wisata (bioskop, karaoke, taman) = lainnya.',
  'Belanja online ditentukan dari barangnya; jika barang tidak disebut = kebutuhan.',
  'Bonus dari kantor = gaji. Hadiah/cashback/bonus lain = lainnya_masuk.',
  'Jika ragu: pengeluaran = lainnya, pemasukan = lainnya_masuk. Jangan menebak kategori spesifik.',
];

export const DEFAULT_CATEGORY = { expense: 'lainnya', income: 'lainnya_masuk' };

const BY_TYPE = {
  expense: EXPENSE_CATEGORIES.map((c) => c.key),
  income: INCOME_CATEGORIES.map((c) => c.key),
};

export const CATEGORIES = [...BY_TYPE.expense, ...BY_TYPE.income];

const LABELS = Object.fromEntries(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.key, c.label]),
);

export const categoryLabel = (key) => LABELS[key] ?? key;

// Kategori harus cocok dengan tipenya (mis. "gaji" tidak boleh untuk expense).
export function resolveCategory(type, category) {
  return BY_TYPE[type]?.includes(category) ? category : DEFAULT_CATEGORY[type];
}

const describe = (list) =>
  list.map((c) => `  * ${c.key} (${c.label}): ${c.scope}. Contoh: ${c.examples}`).join('\n');

export function categoryPromptSection() {
  return `- category untuk type "expense", pilih salah satu:
${describe(EXPENSE_CATEGORIES)}
- category untuk type "income", pilih salah satu:
${describe(INCOME_CATEGORIES)}
- Aturan penentu kategori:
${RULES.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}`;
}
