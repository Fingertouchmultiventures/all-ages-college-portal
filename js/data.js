// Data layer. DEMO mode keeps everything in localStorage.
// LIVE mode (config.js filled in) talks to Supabase. The UI never needs to know which one is active.
import { CONFIG } from './config.js';

export const isLive = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};

let sbPromise;
function sb() {
  if (!sbPromise) {
    sbPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm')
      .then(m => m.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY));
  }
  return sbPromise;
}

/* ---------- helpers ---------- */
export function newRef() {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `AAC-${t}${r}`;
}
// Students and staff without email sign in with a reg. number / staff ID. We map it to a private pseudo-email.
export function loginEmail(role, identifier) {
  const id = identifier.trim();
  if (id.includes('@')) return id.toLowerCase();
  return `${id.toLowerCase().replace(/[^a-z0-9]/g, '')}@${role}.allages.app`;
}

/* ---------- auth ---------- */
const DEMO_LOGIN = { id: 'demo', pw: 'demo1234' };

export async function signIn(role, identifier, password) {
  if (!isLive) {
    if (identifier.trim().toLowerCase() === DEMO_LOGIN.id && password === DEMO_LOGIN.pw) {
      const s = { role, name: 'Demo ' + role[0].toUpperCase() + role.slice(1), id: 'demo' };
      store.set('aac.session', s);
      return { ok: true, session: s };
    }
    return { ok: false, message: 'Wrong details. In demo mode use "demo" and "demo1234".' };
  }
  const c = await sb();
  const { data, error } = await c.auth.signInWithPassword({ email: loginEmail(role, identifier), password });
  if (error) return { ok: false, message: 'Wrong details. Check your ID and password and try again.' };
  const { data: p } = await c.from('profiles').select('role, full_name').eq('id', data.user.id).single();
  if (!p || (p.role !== role && p.role !== 'admin')) {
    await c.auth.signOut();
    return { ok: false, message: `This account is not registered as ${role}. Choose the right portal.` };
  }
  const s = { role: p.role === 'admin' ? role : p.role, name: p.full_name || identifier, id: data.user.id };
  return { ok: true, session: s };
}

export async function getSession() {
  if (!isLive) return store.get('aac.session', null);
  const c = await sb();
  const { data } = await c.auth.getSession();
  if (!data.session) return null;
  const { data: p } = await c.from('profiles').select('role, full_name').eq('id', data.session.user.id).single();
  return p ? { role: p.role, name: p.full_name || data.session.user.email, id: data.session.user.id } : null;
}

export async function signOut() {
  store.del('aac.session');
  if (isLive) { const c = await sb(); await c.auth.signOut(); }
}

/* ---------- admission applications ---------- */
export async function submitApplication(form) {
  const ref = newRef();
  const row = { ...form, ref, created_at: new Date().toISOString() };
  if (!isLive) {
    const all = store.get('aac.applications', []);
    all.unshift(row);
    store.set('aac.applications', all);
    return { ok: true, ref };
  }
  const c = await sb();
  const { error } = await c.from('applications').insert({
    ref, first_name: form.firstName, surname: form.surname, other_names: form.otherNames || null,
    gender: form.gender, dob: form.dob, class_applied: form.classApplied, previous_school: form.previousSchool || null,
    guardian_name: form.guardianName, relationship: form.relationship, phone: form.phone,
    whatsapp: form.whatsapp || null, email: form.email || null, address: form.address, heard_from: form.heardFrom || null
  });
  if (error) return { ok: false, message: 'We could not send your application. Please try again or call the school.' };
  return { ok: true, ref };
}

export async function listApplications() {
  if (!isLive) return store.get('aac.applications', []);
  const c = await sb();
  const { data } = await c.from('applications').select('*').order('created_at', { ascending: false }).limit(200);
  return (data || []).map(r => ({
    ref: r.ref, firstName: r.first_name, surname: r.surname, classApplied: r.class_applied,
    guardianName: r.guardian_name, phone: r.phone, created_at: r.created_at
  }));
}

/* ---------- result checking ---------- */
const DEMO_RESULT = {
  pin: 'AACDEMO2026', reg: 'AACDEMO001',
  data: {
    student: 'Demo Student (sample only)', reg_no: 'AAC/DEMO/001', class: 'JSS 2', session: '2026/2027', term: 'First Term',
    subjects: [
      { subject: 'English Language', ca: 24, exam: 58 }, { subject: 'Mathematics', ca: 27, exam: 61 },
      { subject: 'Basic Science', ca: 22, exam: 49 }, { subject: 'Civic Education', ca: 26, exam: 55 },
      { subject: 'Computer Studies', ca: 28, exam: 60 }, { subject: 'Yoruba', ca: 23, exam: 47 }
    ],
    remark: 'A steady performance. Keep it up.'
  }
};
const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export function gradeFor(total) {
  if (total >= 70) return 'A'; if (total >= 60) return 'B'; if (total >= 50) return 'C';
  if (total >= 45) return 'D'; if (total >= 40) return 'E'; return 'F';
}

export async function checkResult({ pin, reg, session, term }) {
  if (!isLive) {
    if (norm(pin) === DEMO_RESULT.pin && norm(reg) === DEMO_RESULT.reg) {
      return { ok: true, demo: true, data: { ...DEMO_RESULT.data, session, term } };
    }
    return { ok: false, message: 'No result found. In demo mode use PIN AAC-DEMO-2026 and reg. number AAC/DEMO/001.' };
  }
  const c = await sb();
  const { data, error } = await c.rpc('check_result', { p_pin: pin.trim(), p_reg: reg.trim(), p_session: session, p_term: term });
  if (error || !data || data.error) {
    return { ok: false, message: (data && data.error) || 'No result found. Check your PIN, reg. number, session and term.' };
  }
  return { ok: true, data };
}
