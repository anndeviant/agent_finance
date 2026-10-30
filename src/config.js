import 'dotenv/config';

// Membaca dan memvalidasi environment variables. Diimpor paling awal.
const REQUIRED = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'TELEGRAM_ALLOWED_USER_ID',
  'GEMINI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Environment variable belum diisi: ${missing.join(', ')}`);
}

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  ownerId: Number(process.env.TELEGRAM_ALLOWED_USER_ID),
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
  timezone: process.env.APP_TIMEZONE || 'Asia/Jakarta',
};

// Tanggal hari ini (YYYY-MM-DD) sesuai zona waktu aplikasi.
export function todayInTz() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
