import { config, todayInTz } from './config.js';
import express from 'express';
import { tg, sendMessage, downloadFile } from './telegram.js';
import { extractTransactions } from './gemini.js';
import { categoryLabel } from './categories.js';
import { log } from './logger.js';
import {
  markUpdateProcessed,
  createDraft,
  saveDraft,
  cancelDraft,
  getSummary,
} from './db.js';

const MAX_VOICE_SECONDS = 120;
const MAX_VOICE_BYTES = 5 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HELP = `Halo! Kirim voice atau teks transaksi, contoh:
"Beli makan 25 ribu, bensin 50 ribu, skincare 80 ribu, dapat freelance 300 ribu"

Saya akan menampilkan draft, lalu tekan Simpan atau Batal.

Perintah:
/rekap - total hari ini dan bulan ini`;

const rupiah = (n) => `Rp${new Intl.NumberFormat('id-ID').format(n)}`;

function buildPreview(transcript, items) {
  const lines = items.map((t, i) => {
    const label = t.type === 'income' ? '🟢 Pemasukan' : '🔴 Pengeluaran';
    return `${i + 1}. ${label} ${rupiah(t.amount)}\n   ${categoryLabel(t.category)} · ${t.description} · ${t.date}`;
  });
  const income = items.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return `🧾 Draft transaksi
Transkrip: "${transcript.slice(0, 500)}"

${lines.join('\n')}

Total pemasukan: ${rupiah(income)}
Total pengeluaran: ${rupiah(expense)}

Simpan transaksi ini?`;
}

async function handleMessage(msg, chatId) {
  const text = msg.text?.trim();

  if (text === '/start' || text === '/help') {
    log.info('BOT', `Menampilkan petunjuk bantuan ke chat ${chatId}`);
    return sendMessage(chatId, HELP);
  }

  if (text === '/rekap') {
    log.info('REKAP', `Mengambil ringkasan keuangan untuk chat ${chatId}`);
    const today = todayInTz();
    const s = await getSummary(today);
    return sendMessage(chatId, `📊 Rekap

Hari ini (${today})
Pemasukan: ${rupiah(s.todayIncome)}
Pengeluaran: ${rupiah(s.todayExpense)}
Selisih: ${rupiah(s.todayIncome - s.todayExpense)}

Bulan ini
Pemasukan: ${rupiah(s.monthIncome)}
Pengeluaran: ${rupiah(s.monthExpense)}
Selisih: ${rupiah(s.monthIncome - s.monthExpense)}`);
  }

  if (text?.startsWith('/')) return sendMessage(chatId, HELP);

  const today = todayInTz();
  let result;

  if (msg.voice) {
    if (msg.voice.duration > MAX_VOICE_SECONDS || (msg.voice.file_size ?? 0) > MAX_VOICE_BYTES) {
      log.info('VOICE', `Voice terlalu besar/panjang (${msg.voice.duration}s)`);
      return sendMessage(chatId, 'Voice terlalu panjang. Maksimal 2 menit.');
    }
    log.info('VOICE', `Mengunduh voice note (${msg.voice.duration} detik, ${msg.voice.file_size} bytes)...`);
    const audio = await downloadFile(msg.voice.file_id);
    log.gemini('Mengirim voice audio ke Gemini AI untuk ekstraksi...');
    result = await extractTransactions({
      audioBase64: audio.toString('base64'),
      mimeType: msg.voice.mime_type || 'audio/ogg',
      today,
    });
  } else if (text) {
    log.gemini('Mengirim teks ke Gemini AI untuk ekstraksi...', `"${text}"`);
    result = await extractTransactions({ text, today });
  } else {
    return sendMessage(chatId, HELP);
  }

  log.gemini('Hasil ekstraksi Gemini', `${result.transactions.length} transaksi terdeteksi`);

  if (result.transactions.length === 0) {
    log.info('TRANSAKSI', 'Tidak ada transaksi dengan nominal valid.');
    return sendMessage(
      chatId,
      `Transkrip: "${result.transcript.slice(0, 500)}"\n\nTidak ada transaksi dengan nominal jelas. Coba ulangi dan sebutkan nominalnya.`,
    );
  }

  log.db('Menyimpan draft transaksi sementara ke tabel drafts...');
  const draftId = await createDraft(result.transcript, result.transactions);
  log.db('Draft berhasil dibuat', `ID: ${draftId}`);

  return sendMessage(chatId, buildPreview(result.transcript, result.transactions), {
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Simpan', callback_data: `save:${draftId}` },
        { text: '❌ Batal', callback_data: `cancel:${draftId}` },
      ]],
    },
  });
}

async function handleCallback(cb, chatId) {
  const [action, draftId] = (cb.data || '').split(':');

  log.callback({ from: cb.from, action, draftId });

  if (!UUID_RE.test(draftId || '') || !['save', 'cancel'].includes(action)) {
    return tg('answerCallbackQuery', { callback_query_id: cb.id });
  }

  let status;
  if (action === 'save') {
    log.db('Menyimpan draft secara permanen ke tabel transactions...');
    const count = await saveDraft(draftId);
    if (count >= 0) {
      log.db('Transaksi BERHASIL disimpan', `${count} baris transaksi disalin`);
      status = `✅ Tersimpan (${count} transaksi)`;
    } else {
      log.db('Draft sudah pernah diproses sebelumnya');
      status = 'ℹ️ Draft ini sudah diproses sebelumnya.';
    }
  } else {
    log.db('Membatalkan draft di tabel drafts...');
    const cancelled = await cancelDraft(draftId);
    if (cancelled) {
      log.db('Draft BERHASIL dibatalkan');
      status = '❌ Dibatalkan';
    } else {
      status = 'ℹ️ Draft ini sudah diproses sebelumnya.';
    }
  }

  await tg('answerCallbackQuery', { callback_query_id: cb.id });

  // Edit pesan draft: tambahkan status dan hapus tombol.
  if (cb.message?.text) {
    await tg('editMessageText', {
      chat_id: chatId,
      message_id: cb.message.message_id,
      text: `${cb.message.text}\n\n${status}`,
    });
  }
}

async function handleUpdate(update) {
  const msg = update.message;
  const cb = update.callback_query;
  const from = msg?.from ?? cb?.from;
  const chat = msg?.chat ?? cb?.message?.chat;

  if (!from || !chat || chat.type !== 'private') {
    log.info('UPDATE', 'Mengabaikan pesan grup atau pesan tanpa pengirim valid.');
    return;
  }

  const isAllowed = config.ownerId === 0 || from.id === config.ownerId;

  // Log pesan masuk jika berasal dari teks/voice biasa
  if (msg) {
    const type = msg.voice ? `Voice Note (${msg.voice.duration}s)` : 'Teks';
    const content = msg.text || (msg.voice ? '[Voice Audio]' : '-');
    log.incoming({ from, type, content, isAllowed });
  }

  // Hanya pemilik bot yang boleh memakai bot jika ownerId sudah diset (bukan 0).
  if (config.ownerId !== 0 && from.id !== config.ownerId) {
    if (msg) await sendMessage(chat.id, `Akses ditolak. Telegram user ID Anda: ${from.id}`);
    else await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Akses ditolak' });
    return;
  }

  // Jika ownerId masih 0, beri tahu ID pengguna agar bisa disalin
  if (config.ownerId === 0) {
    log.info('REGISTER', `User ID terdeteksi: ${from.id}. Silakan masukkan angka ini ke TELEGRAM_ALLOWED_USER_ID.`);
    if (msg) {
      await sendMessage(
        chat.id,
        `👋 Halo! Telegram user ID Anda adalah: ${from.id}\n\nSilakan masukkan angka ini ke variabel TELEGRAM_ALLOWED_USER_ID di file .env atau Vercel agar bot terkunci hanya untuk Anda.`,
      );
      return;
    }
  }

  // Cegah update yang dikirim ulang Telegram diproses dua kali.
  if (!(await markUpdateProcessed(update.update_id))) {
    log.info('DUPLIKAT', `Update ID ${update.update_id} sudah pernah diproses, diabaikan.`);
    return;
  }

  try {
    if (cb) await handleCallback(cb, chat.id);
    else if (msg) await handleMessage(msg, chat.id);
  } catch (err) {
    log.error('HANDLER', err);
    await sendMessage(chat.id, '⚠️ Gagal memproses. Silakan coba lagi.').catch(() => {});
  }
}

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('OK - Finance Bot Active'));

app.post('/webhook', async (req, res) => {
  const secretHeader = req.get('x-telegram-bot-api-secret-token');
  if (secretHeader !== config.webhookSecret) {
    log.error('WEBHOOK', 'Secret token tidak cocok atau permintaan tidak sah!');
    return res.sendStatus(401);
  }
  try {
    await handleUpdate(req.body);
  } catch (err) {
    log.error('WEBHOOK', err);
  }
  res.sendStatus(200);
});

export default app;

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    const ownerDisplay = config.ownerId === 0 ? '0 (Mode Cek ID Aktif)' : config.ownerId;
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║               🤖 TELEGRAM FINANCE BOT SERVER AKTIF                ║
║                                                                    ║
║  📍 URL Lokal  : http://localhost:${PORT}                           ║
║  🤖 Bot        : @deviagent_bot                                    ║
║  👤 Owner ID   : ${ownerDisplay.toString().padEnd(50)}║
║  ✨ Status     : Menunggu webhook pesan dari Telegram...           ║
╚════════════════════════════════════════════════════════════════════╝
    `);
  });
}
