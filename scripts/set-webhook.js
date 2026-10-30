import 'dotenv/config';

// Mendaftarkan webhook dan menu perintah bot. Jalankan: npm run set-webhook
const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, PUBLIC_URL } = process.env;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_WEBHOOK_SECRET || !PUBLIC_URL) {
  console.error('Isi TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, dan PUBLIC_URL di file .env');
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((res) => res.json());

const url = `${PUBLIC_URL.replace(/\/+$/, '')}/webhook`;

console.log('setWebhook:', await api('setWebhook', {
  url,
  secret_token: TELEGRAM_WEBHOOK_SECRET,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
}));

console.log('setMyCommands:', await api('setMyCommands', {
  commands: [
    { command: 'rekap', description: 'Total hari ini dan bulan ini' },
    { command: 'help', description: 'Cara pakai' },
  ],
}));

console.log('getWebhookInfo:', await api('getWebhookInfo', {}));
