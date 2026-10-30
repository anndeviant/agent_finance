const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function timestamp() {
  return new Date().toLocaleTimeString('id-ID', { hour12: false });
}

export const log = {
  info: (tag, msg) => {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}${colors.bright}[${tag}]${colors.reset} ${msg}`);
  },
  incoming: ({ from, type, content, isAllowed }) => {
    const name = `${from.first_name || ''} ${from.last_name || ''}`.trim() || 'Pengguna';
    const userStr = `${colors.bright}${name}${colors.reset} ${colors.gray}(@${from.username || '-'} | ID: ${from.id})${colors.reset}`;
    console.log('\n' + '─'.repeat(55));
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.green}${colors.bright}📩 [PESAN MASUK DARI TELEGRAM]${colors.reset}`);
    console.log(`   👤 Pengirim : ${userStr}`);
    console.log(`   📦 Tipe     : ${type}`);
    console.log(`   💬 Isi      : ${colors.bright}"${content}"${colors.reset}`);
    if (!isAllowed) {
      console.log(`   ⛔ Status   : ${colors.red}${colors.bright}AKSES DITOLAK (ID ${from.id} belum terdaftar!)${colors.reset}`);
    } else {
      console.log(`   ✅ Status   : ${colors.green}AKSES DITERIMA (Owner ID cocok)${colors.reset}`);
    }
    console.log('─'.repeat(55));
  },
  callback: ({ from, action, draftId }) => {
    const actLabel = action === 'save' ? `${colors.green}✅ [SIMPAN DRAFT]` : `${colors.yellow}❌ [BATALKAN DRAFT]`;
    const name = `${from.first_name || ''} ${from.last_name || ''}`.trim() || 'Pengguna';
    console.log('\n' + '─'.repeat(55));
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.magenta}${colors.bright}🔘 [KLIK TOMBOL OLEH USER]${colors.reset}`);
    console.log(`   👤 Pengguna : ${colors.bright}${name}${colors.reset} ${colors.gray}(ID: ${from.id})${colors.reset}`);
    console.log(`   🎯 Tombol   : ${colors.bright}${actLabel}${colors.reset}`);
    console.log(`   🆔 Draft ID : ${colors.dim}${draftId}${colors.reset}`);
    console.log('─'.repeat(55));
  },
  outgoing: (chatId, text) => {
    const firstLine = text.split('\n')[0].slice(0, 60);
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.blue}${colors.bright}📤 [BOT MEMBALAS]${colors.reset} Chat ID: ${chatId} ➔ "${firstLine}..."`);
  },
  gemini: (status, details = '') => {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.yellow}${colors.bright}🤖 [GEMINI AI]${colors.reset} ${status} ${colors.dim}${details}${colors.reset}`);
  },
  db: (action, details = '') => {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}${colors.bright}💾 [SUPABASE]${colors.reset} ${action} ${colors.dim}${details}${colors.reset}`);
  },
  error: (tag, err) => {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.red}${colors.bright}❌ [ERROR: ${tag}]${colors.reset} ${err.message || err}`);
  },
};
