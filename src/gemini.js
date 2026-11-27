import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { CATEGORIES, categoryPromptSection, resolveCategory } from './categories.js';
import { cleanDescription } from './description.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });


const SCHEMA = {
  type: 'object',
  properties: {
    transcript: { type: 'string' },
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['income', 'expense'] },
          amount: { type: 'integer' },
          category: { type: 'string', enum: CATEGORIES },
          description: { type: 'string' },
          date: { type: 'string' },
        },
        required: ['type', 'amount', 'category', 'description', 'date'],
      },
    },
  },
  required: ['transcript', 'transactions'],
};

function buildPrompt(today, isAudio) {
  return `Kamu adalah pencatat keuangan pribadi berbahasa Indonesia untuk seorang anak kost.
Hari ini adalah ${today}.
${isAudio ? 'Transkripsikan audio apa adanya ke field "transcript".' : 'Salin teks pengguna apa adanya ke field "transcript".'}
Lalu ekstrak setiap transaksi ke "transactions" dengan aturan:
- type: "income" untuk pemasukan, "expense" untuk pengeluaran.
- amount: bilangan bulat rupiah. Contoh: "dua puluh lima ribu" = 25000, "25rb" = 25000, "1,5 juta" = 1500000.
- JANGAN menebak nominal. Lewati transaksi yang nominalnya tidak jelas.
${categoryPromptSection()}
- description: HANYA nama barang/jasa, ringkas, maksimal 8 kata.
  JANGAN tulis nominal/harga (mis. "15rb", "Rp20.000", "dua puluh ribu") dan JANGAN tulis tanggal/waktu
  (mis. "25 nov", "tgl 3", "kemarin", "tadi pagi"), karena keduanya sudah masuk ke field amount dan date.
  Contoh: "nasi padang 15rb tgl 25 nov" -> description "nasi padang", amount 15000, date tanggal 25 November.
- date: format YYYY-MM-DD.
  * Kata relatif ("kemarin", "tadi pagi", "2 hari lalu") dihitung dari tanggal hari ini.
  * Tanggal yang disebut pengguna ("25 nov", "tgl 25 november", "25/11") WAJIB dipakai: tahun = tahun ini;
    jika hanya tanggal tanpa bulan ("tgl 3"), bulan = bulan ini.
  * Tanggal tidak boleh melewati hari ini; jika hasilnya di masa depan, mundurkan ke bulan/tahun sebelumnya.
  * Tanggal berlaku untuk semua transaksi dalam kalimat yang sama kecuali disebut lain.
  * Jika tidak disebut sama sekali, pakai ${today}.
- Jika tidak ada transaksi, kembalikan array kosong.`;
}

function isValidDate(value, today) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime())
    && parsed.toISOString().slice(0, 10) === value
    && value <= today;
}

// Membersihkan satu transaksi hasil AI. Return null jika tidak valid.
export function normalizeTransaction(item, today) {
  const amount = Number(item?.amount);
  if (!['income', 'expense'].includes(item?.type)) return null;
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000_000_000_000) return null;

  return {
    type: item.type,
    amount,
    category: resolveCategory(item.type, item.category),
    description: cleanDescription(item.description).slice(0, 200) || '-',
    date: isValidDate(item.date, today) ? item.date : today,
  };
}

// Input: { audioBase64, mimeType } untuk voice, atau { text } untuk teks.
export async function extractTransactions({ audioBase64, mimeType, text, today }) {
  const isAudio = Boolean(audioBase64);
  const contents = [buildPrompt(today, isAudio)];

  if (isAudio) {
    contents.push({
      inlineData: {
        data: audioBase64,
        mimeType: mimeType || 'audio/ogg',
      },
    });
  } else {
    contents.push(`Teks pengguna: ${text}`);
  }

  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
    },
  });

  const data = JSON.parse(response.text);
  const transactions = (Array.isArray(data.transactions) ? data.transactions : [])
    .map((item) => normalizeTransaction(item, today))
    .filter(Boolean)
    .slice(0, 10);

  return {
    transcript: String(data.transcript ?? '').trim().slice(0, 2000),
    transactions,
  };
}
