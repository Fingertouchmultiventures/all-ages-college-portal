// Supabase Edge Function: sends SMS to parents' phones the moment an ADMIN presses Send.
// Provider: Termii (Nigeria). Secrets needed (Supabase > Edge Functions > Secrets):
//   TERMII_API_KEY   your Termii API key
//   TERMII_SENDER_ID approved sender name (e.g. AllAgesColl). Optional, defaults to "N-Alert"
//   TERMII_CHANNEL   "generic" (default) or "dnd" (reaches DND numbers; needs an approved sender ID)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const normPhone = (p: string) => { const d = String(p || '').replace(/\D/g, ''); if (/^234\d{10}$/.test(d)) return d; if (/^0\d{10}$/.test(d)) return '234' + d.slice(1); if (/^[789]\d{9}$/.test(d)) return '234' + d; return ''; };

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: 'Please sign in again.' }, 401);
    const { data: me } = await admin.from('profiles').select('role').eq('id', u.user.id).single();
    if (me?.role !== 'admin') return json({ error: 'Only an admin can send messages.' }, 403);
    const key = Deno.env.get('TERMII_API_KEY');
    if (!key) return json({ error: 'SMS is not switched on yet. Add TERMII_API_KEY in Supabase > Edge Functions > Secrets.', notConfigured: true }, 200);
    const b = await req.json();
    const message = String(b.message || '').trim();
    if (!message) return json({ error: 'Write a message first.' }, 400);
    const phones = [...new Set((b.phones || []).map(normPhone).filter(Boolean))] as string[];
    if (!phones.length) return json({ error: 'No valid phone numbers to send to.' }, 400);
    let sent = 0; const failed: string[] = []; let balance: unknown = null; let lastErr = '';
    for (let i = 0; i < phones.length; i += 100) {
      const chunk = phones.slice(i, i + 100);
      const r = await fetch('https://api.ng.termii.com/api/sms/send/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: key, to: chunk, from: Deno.env.get('TERMII_SENDER_ID') || 'N-Alert', sms: message, type: 'plain', channel: Deno.env.get('TERMII_CHANNEL') || 'generic' }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && (j.code === 'ok' || j.message_id)) { sent += chunk.length; balance = j.balance ?? balance; } else { failed.push(...chunk); lastErr = j.message || `Provider error ${r.status}`; }
    }
    return json({ ok: failed.length === 0, sent, failed, total: phones.length, balance, error: failed.length ? lastErr : undefined });
  } catch (e) { return json({ error: String(e) }, 500); }
});
