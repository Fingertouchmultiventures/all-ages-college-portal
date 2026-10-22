// Supabase Edge Function: lets an ADMIN create accounts, reset passwords and delete accounts from the portal.
// Uses the project's built-in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (set automatically). No extra secrets needed.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const ROLES = ['admin', 'teacher', 'bursar', 'student', 'parent'];
const loginEmail = (role: string, id: string) => id.includes('@') ? id.trim().toLowerCase() : `${id.toLowerCase().replace(/[^a-z0-9]/g, '')}@${role}.allages.app`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: 'Please sign in again.' }, 401);
    const { data: me } = await admin.from('profiles').select('role').eq('id', u.user.id).single();
    if (me?.role !== 'admin') return json({ error: 'Only an admin can do this.' }, 403);

    const b = await req.json(); const action = b.action;
    if (action === 'create') {
      const role = String(b.role || ''); const id = String(b.identifier || '').trim(); const pw = String(b.password || '');
      if (!ROLES.includes(role) || !id) return json({ error: 'Choose a role and enter the ID, phone or email.' }, 400);
      if (pw.length < 6) return json({ error: 'Password must be at least 6 characters.' }, 400);
      const email = loginEmail(role, id);
      const { data, error } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true });
      if (error) return json({ error: error.message.includes('already') ? 'That ID or email already has an account.' : error.message }, 400);
      const regs = String(b.linked_regs || '').split(/[,\n]/).map((x: string) => x.trim()).filter(Boolean);
      const { error: pe } = await admin.from('profiles').insert({ id: data.user.id, role, full_name: String(b.full_name || ''), reg_no: role === 'student' ? (String(b.reg_no || id).trim()) : null, linked_regs: role === 'parent' ? regs : [] });
      if (pe) { await admin.auth.admin.deleteUser(data.user.id); return json({ error: pe.message }, 400); }
      return json({ ok: true, email });
    }
    if (action === 'reset') {
      const pw = String(b.password || ''); if (pw.length < 6) return json({ error: 'Password must be at least 6 characters.' }, 400);
      const { error } = await admin.auth.admin.updateUserById(String(b.user_id), { password: pw });
      return error ? json({ error: error.message }, 400) : json({ ok: true });
    }
    if (action === 'delete') {
      if (b.user_id === u.user.id) return json({ error: 'You cannot delete your own account.' }, 400);
      const { error } = await admin.auth.admin.deleteUser(String(b.user_id));
      return error ? json({ error: error.message }, 400) : json({ ok: true });
    }
    if (action === 'list') {
      const { data: ps } = await admin.from('profiles').select('id, role, full_name, reg_no, linked_regs');
      const { data: us } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const em = new Map((us?.users || []).map((x) => [x.id, x.email]));
      return json({ users: (ps || []).map((p) => ({ ...p, email: em.get(p.id) || '' })) });
    }
    return json({ error: 'Unknown action' }, 400);
  } catch (e) { return json({ error: String(e) }, 500); }
});
