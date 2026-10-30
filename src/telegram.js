import { config } from './config.js';
import { log } from './logger.js';

const API = `https://api.telegram.org/bot${config.telegramToken}`;

// Memanggil method Telegram Bot API.
export async function tg(method, body) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Telegram ${method} gagal: ${json.description}`);
  return json.result;
}

export function sendMessage(chatId, text, extra = {}) {
  log.outgoing(chatId, text);
  return tg('sendMessage', { chat_id: chatId, text, ...extra });
}

// Mengunduh file (voice) dari Telegram menggunakan file_id.
export async function downloadFile(fileId) {
  const file = await tg('getFile', { file_id: fileId });
  const res = await fetch(
    `https://api.telegram.org/file/bot${config.telegramToken}/${file.file_path}`,
  );
  if (!res.ok) throw new Error(`Download file gagal: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
