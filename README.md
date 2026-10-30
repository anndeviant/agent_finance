# Telegram Finance Bot

Kirim voice atau teks ke bot Telegram, lalu Gemini mengekstrak pemasukan/pengeluaran. Bot menampilkan draft dengan tombol **Simpan / Batal**, dan transaksi tersimpan di Supabase. Backend: Node.js + Express di Vercel.

## Struktur

```
src/index.js        Express app + webhook + alur bot
src/config.js       Environment variables + tanggal hari ini
src/telegram.js     Pemanggilan Telegram Bot API
src/gemini.js       Voice/teks -> transaksi (Gemini)
src/db.js           Akses Supabase
supabase/schema.sql Tabel + fungsi database
scripts/set-webhook.js  Mendaftarkan webhook ke Telegram
.env.example        Template environment variables
```

## Langkah deploy

### 1. Buat bot Telegram
Chat **@BotFather**, kirim `/newbot`, ikuti instruksi, lalu simpan token sebagai `TELEGRAM_BOT_TOKEN`.

### 2. Buat API key Gemini
Buka https://aistudio.google.com/apikey, buat key, lalu simpan sebagai `GEMINI_API_KEY`.

### 3. Siapkan Supabase
1. Buat project baru di https://supabase.com.
2. Buka **SQL Editor**, paste seluruh isi `supabase/schema.sql`, lalu klik **Run**.
3. Ambil **Project URL** (`SUPABASE_URL`) dan **Secret key** `sb_secret_...` (`SUPABASE_SECRET_KEY`) dari **Connect** atau **Settings > API Keys**.

### 4. Deploy ke Vercel
1. Push folder ini ke repository GitHub (file `.env` tidak ikut karena ada di `.gitignore`).
2. Di Vercel: **Add New > Project**, lalu import repository tersebut. Framework akan terdeteksi sebagai Express.
3. Sebelum Deploy, isi **Environment Variables** sesuai `.env.example` (kecuali `PUBLIC_URL`):
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ALLOWED_USER_ID`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, dan opsional `GEMINI_MODEL` serta `APP_TIMEZONE`.
4. Klik **Deploy**. Buka domain production, misalnya `https://xxx.vercel.app`, dan pastikan halaman menampilkan `OK`.

### 5. Daftarkan webhook (sekali saja, dari komputer Anda)
```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
# isi TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, PUBLIC_URL di .env
npm run set-webhook
```
Pastikan output `setWebhook` menampilkan `"ok": true`.

### 6. Isi user ID Anda
1. Jika `TELEGRAM_ALLOWED_USER_ID` masih `0`, kirim pesan apa saja ke bot. Bot membalas `Telegram user ID Anda: 123456789`.
2. Isi angka tersebut di Vercel Environment Variables.
3. Lakukan **Redeploy**. Perubahan environment variable hanya berlaku pada deployment baru.

### 7. Coba
- Kirim voice: *"beli makan dua puluh lima ribu, bensin lima puluh ribu"*
- Atau teks: `gaji masuk 5 juta`
- Tekan **✅ Simpan**
- Kirim `/rekap`

## Catatan
- Voice dibatasi maksimal 2 menit / 5 MB; maksimal 10 transaksi per pesan.
- Untuk koreksi, tekan **Batal** lalu kirim ulang voice/teks yang benar.
- Gemini free tier: konten dapat digunakan Google untuk peningkatan produk. Jangan kirim data sensitif.
- Mengganti webhook secret: ubah di Vercel, Redeploy, lalu jalankan `npm run set-webhook` lagi.
- Cek error: Vercel > Project > Logs.
