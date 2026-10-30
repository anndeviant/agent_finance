import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

const db = createClient(config.supabaseUrl, config.supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Return true jika update baru; false jika update_id sudah pernah diproses.
export async function markUpdateProcessed(updateId) {
  const { error } = await db.from('processed_updates').insert({ update_id: updateId });
  if (!error) return true;
  if (error.code === '23505') return false; // unique violation = duplikat
  throw error;
}

export async function createDraft(transcript, items) {
  const { data, error } = await db
    .from('drafts')
    .insert({ transcript, items })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// Return jumlah transaksi tersimpan, atau -1 jika draft sudah diproses.
export async function saveDraft(draftId) {
  const { data, error } = await db.rpc('save_draft', { p_draft_id: draftId });
  if (error) throw error;
  return Number(data);
}

// Return true jika berhasil dibatalkan; false jika draft sudah diproses.
export async function cancelDraft(draftId) {
  const { data, error } = await db
    .from('drafts')
    .update({ status: 'cancelled' })
    .eq('id', draftId)
    .eq('status', 'pending')
    .select('id');
  if (error) throw error;
  return data.length > 0;
}

export async function getSummary(today) {
  const { data, error } = await db.rpc('get_summary', { p_today: today });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    todayIncome: Number(row?.today_income ?? 0),
    todayExpense: Number(row?.today_expense ?? 0),
    monthIncome: Number(row?.month_income ?? 0),
    monthExpense: Number(row?.month_expense ?? 0),
  };
}
