// Membersihkan deskripsi dari nominal dan tanggal yang sudah diekstrak ke field
// amount/date, supaya deskripsi hanya berisi nama barang/jasa.
// Contoh: "nasi padang 15rb tgl 25 nov" -> "nasi padang".
// Angka yang bukan uang (mis. "500gb", "36 kwh", "1.5L", "2 porsi") tetap dipertahankan.

const NUM_WORD =
  'nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|seribu|sejuta|setengah|belas|puluh|ratus|se';
const MONEY_UNIT = 'ribu|rebu|rb|k|juta|jt|perak|rupiah';
const MONTH =
  'jan(?:uari|uary)?|feb(?:ruari|ruary)?|mar(?:et|ch)?|apr(?:il)?|mei|may|jun(?:i|e)?|jul(?:i|y)?|agu(?:stus)?|ags|aug(?:ust)?|sep(?:t(?:ember)?)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?';

const PATTERNS = [
  // Rp 15.000 / rp15rb / IDR 20000
  /(?:\brp\.?|\bidr)\s*\d[\d.,]*\s*(?:ribu|rebu|rb|k|juta|jt)?\b/gi,
  // 15rb, 15 ribu, 1,5 juta, 20k, 2.5jt
  new RegExp(`\\b\\d+(?:[.,]\\d+)*\\s*(?:${MONEY_UNIT})\\b`, 'gi'),
  // lima belas ribu, dua puluh lima ribu, sejuta
  new RegExp(`\\b(?:(?:${NUM_WORD})\\s*)+(?:ribu|rebu|juta)\\b|\\b(?:seribu|sejuta)\\b`, 'gi'),
  // 2026-11-25, 25/11, 25/11/2026
  /\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,
  // (tanggal) 25 nov (2026), tgl 3 november
  new RegExp(`(?:\\b(?:tanggal|tgl)\\.?\\s*)?\\b\\d{1,2}\\s*(?:${MONTH})\\b(?:\\s*\\d{4}\\b)?`, 'gi'),
  // tanggal 25 / tgl. 3
  /\b(?:tanggal|tgl)\.?\s*\d{1,2}\b/gi,
  // kata waktu relatif
  /\b(?:kemarin\s+lusa|kemarin|kemaren|hari\s+ini|barusan|tadi(?:\s+(?:pagi|siang|sore|malam))?|semalam|minggu\s+lalu|pekan\s+lalu)\b/gi,
  // angka uang tanpa satuan: 15000, 15.000, 1.500.000
  /\b\d{1,3}(?:\.\d{3})+\b|\b\d{4,}\b/g,
];

// Kata sambung yang tertinggal di tepi setelah nominal/tanggal dibuang.
const FILLER = new Set([
  'seharga', 'harga', 'sebesar', 'senilai', 'sejumlah', 'total', 'habis', 'abis',
  'pada', 'tanggal', 'tgl', 'di', 'on', 'at', '@', 'sekitar', 'sebanyak', 'dengan', 'dan', '+',
]);

const bare = (w) => w.toLowerCase().replace(/^[,.;:()]+|[,.;:()]+$/g, '');

export function cleanDescription(raw) {
  const original = String(raw ?? '').replace(/\s+/g, ' ').trim();
  let s = original;
  for (const re of PATTERNS) s = s.replace(re, ' ');

  const words = s.split(/\s+/).filter((w) => w && bare(w) !== '');
  while (words.length && FILLER.has(bare(words[words.length - 1]))) words.pop();
  while (words.length && FILLER.has(bare(words[0]))) words.shift();

  s = words
    .join(' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/^[\s,.;:@+\-–]+|[\s,.;:@+\-–]+$/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Jika semuanya terhapus (mis. deskripsi hanya "25rb"), pakai teks asli.
  return s || original;
}
