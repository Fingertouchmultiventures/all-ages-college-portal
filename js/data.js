// Data layer. DEMO mode keeps everything in this browser (localStorage + IndexedDB).
// LIVE mode (config.js filled in) uses Supabase: one generic `records` table + a Storage bucket `uploads`.
import { CONFIG } from './config.js';
import { norm, uid, today } from './ui.js';

const BASE = String(CONFIG.SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
export const isLive = Boolean(BASE && CONFIG.SUPABASE_ANON_KEY);

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked or full */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};

let sbPromise;
function sb() {
  if (!sbPromise) sbPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm').then(m => m.createClient(BASE, CONFIG.SUPABASE_ANON_KEY));
  return sbPromise;
}

/* ---------- site settings ---------- */
const DEFAULTS = {
  schoolName: 'All Ages College', motto: 'Education and self reliance: the best legacy',
  address: 'Zone 2, Papa Olorunsogo, Apete, Ibadan, Oyo State',
  phonesText: '0805 739 4188\n0810 277 6581\n0803 804 3666',
  welcomeTitle: 'Learning, character and self reliance',
  aboutText: 'All Ages College is a government approved school in Apete, Ibadan, built on the belief that education and self reliance are the best legacy. We teach from Creche to SSS 3 in a caring, disciplined environment.',
  facilitiesText: 'Classrooms\nPlayground and sports field\nLibrary corner\nComputer studies\nSchool portal for parents and students',
  activitiesText: 'Sports and inter-house competitions\nCultural day\nCoaching and extra lessons\nSummer lessons\nEvents and parties',
  subjectsText: 'English Language\nMathematics\nBasic Science\nCivic Education\nComputer Studies\nYoruba\nSocial Studies\nCreative Arts', bankName: '', accountName: '', accountNumber: '', feeNote: ''
};
let settingsCache = null;
export async function getSettings(force = false) {
  if (settingsCache && !force) return settingsCache;
  let row = {};
  try { row = (await list('settings')).find(r => r.id === 'site') || {}; } catch { /* use defaults */ }
  const s = { ...DEFAULTS };
  Object.entries(row).forEach(([k, v]) => { if (v !== undefined && v !== '') s[k] = v; });
  s.phones = String(s.phonesText).split('\n').map(x => x.trim()).filter(Boolean).map(p => ({ label: p, tel: '+234' + p.replace(/\D/g, '').replace(/^234/, '').replace(/^0/, '') }));
  settingsCache = s; return s;
}

/* ---------- generic records ---------- */
const KEY = c => 'aac.col.' + c;
function seedDemo() {
  if (store.get('aac.seeded.v3', false)) return;
  const now = new Date().toISOString(); const d = today();
  const put = (c, rows) => store.set(KEY(c), rows.map(r => ({ _created: now, ...r })));
  put('announcements', [
    { id: 'seed-a1', title: 'Welcome to the new session (sample)', body: 'This is a sample announcement. Sign in as admin to edit or delete it.', audience: 'all', pinned: true, date: d },
    { id: 'seed-a2', title: 'Sample PTA meeting notice', body: 'Parents will see this one only after they sign in.', audience: 'parents', date: d }
  ]);
  put('prefects', ['Head Boy', 'Head Girl', 'Assistant Head Boy', 'Assistant Head Girl'].map((p, i) => ({ id: 'seed-p' + i, name: 'Sample name', position: p, class: 'SSS 3' })));
  put('students', [
    { id: 'stu-AACDEMO001', name: 'Demo Student', reg_no: 'AAC/DEMO/001', reg_norm: 'AACDEMO001', class: 'JSS 2', gender: 'Female', parentName: 'Demo Parent', parentPhone: '08000000000' },
    { id: 'stu-AACDEMO002', name: 'Sample Pupil', reg_no: 'AAC/DEMO/002', reg_norm: 'AACDEMO002', class: 'Primary 3', gender: 'Male', parentName: 'Sample Parent', parentPhone: '08000000001' }
  ]);
  put('fees', [
    { id: 'seed-f1', title: 'First term school fee (sample)', category: 'School fee', amount: 45000, scope: 'class', targetClass: 'JSS 2', session: '2026/2027', term: 'First Term', due: d },
    { id: 'seed-f2', title: 'JSS 2 textbooks (sample)', category: 'Textbooks and exercise books', amount: 12000, scope: 'class', targetClass: 'JSS 2', session: '2026/2027', term: 'First Term' },
    { id: 'seed-f3', title: 'School uniform (sample)', category: 'Uniforms', amount: 8500, scope: 'all', session: '2026/2027', term: 'Whole session' },
    { id: 'seed-f4', title: 'Excursion (sample)', category: 'Other', amount: 3000, scope: 'student', targetReg: 'AAC/DEMO/001', session: '2026/2027', term: 'First Term' }
  ]);
  put('payments', [{ id: 'seed-pay1', regNo: 'AAC/DEMO/001', feeId: 'seed-f1', amount: 20000, method: 'Bank transfer', date: d, receipt: 'RCT-DEMO1', enteredBy: 'Demo Bursar' }]);
  put('curriculum', [{ id: 'seed-c1', class: 'JSS 2', subject: 'Mathematics (sample)', term: 'First Term', topics: 'Number bases\nAlgebraic expressions\nSimple equations\nAngles and lines' }]);
  put('lessonNotes', [{ id: 'seed-n1', class: 'JSS 2', subject: 'Mathematics (sample)', title: 'Sample lesson note: Number bases', week: 'Week 1', body: 'This is a sample lesson note. Teachers write or paste their notes here and can attach a file.', teacherName: 'Demo Teacher', owner: 'demo' }]);
  put('album', [
    { id: 'seed-al1', title: 'Our school family', category: 'School life', image: { url: 'assets/album-1.jpg', name: 'album-1.jpg', type: 'image/jpeg' }, caption: 'Students, teachers and parents at the school building', featured: true },
    { id: 'seed-al2', title: 'Cheerful class', category: 'School life', image: { url: 'assets/album-2.jpg', name: 'album-2.jpg', type: 'image/jpeg' }, caption: 'Pupils with the school building behind them', featured: true },
    { id: 'seed-al3', title: 'Black and white portrait', category: 'School life', image: { url: 'assets/album-3.jpg', name: 'album-3.jpg', type: 'image/jpeg' }, caption: 'A class in front of the school wall', featured: true },
    { id: 'seed-al4', title: 'Pupils at the school gate', category: 'School life', image: { url: 'assets/album-4.jpg', name: 'album-4.jpg', type: 'image/jpeg' }, caption: 'Smiles from the senior pupils', featured: true },
    { id: 'seed-al5', title: 'Sports day: little ones', category: 'Sports', image: { url: 'assets/album-5.jpg', name: 'album-5.jpg', type: 'image/jpeg' }, caption: 'Our youngest in their football kits', featured: true },
    { id: 'seed-al6', title: 'Sports day: team photo', category: 'Sports', image: { url: 'assets/album-6.jpg', name: 'album-6.jpg', type: 'image/jpeg' }, caption: 'Girls in their jerseys', featured: true },
    { id: 'seed-al7', title: 'Sports day: girls', category: 'Sports', image: { url: 'assets/album-7.jpg', name: 'album-7.jpg', type: 'image/jpeg' }, caption: 'Posing before the match', featured: true },
    { id: 'seed-al8', title: 'Sports day: boys', category: 'Sports', image: { url: 'assets/album-8.jpg', name: 'album-8.jpg', type: 'image/jpeg' }, caption: 'The boys team', featured: true },
    { id: 'seed-al10', title: 'Inter-house sports', category: 'Sports', image: { url: 'assets/album-10.jpg', name: 'album-10.jpg', type: 'image/jpeg' }, caption: 'Teams in their colours', featured: false },
    { id: 'seed-al13', title: 'Sports day: whole school', category: 'Sports', image: { url: 'assets/album-13.jpg', name: 'album-13.jpg', type: 'image/jpeg' }, caption: 'Everyone together at sports day', featured: false },
    { id: 'seed-al14', title: 'Sports day: blue team', category: 'Sports', image: { url: 'assets/album-14.jpg', name: 'album-14.jpg', type: 'image/jpeg' }, caption: 'The blue team', featured: false },
    { id: 'seed-al16', title: 'Face painting', category: 'Activities', image: { url: 'assets/album-16.jpg', name: 'album-16.jpg', type: 'image/jpeg' }, caption: 'Pupils enjoying a creative activity', featured: false }
  ]);
  put('staff', [
    { id: 'seed-st1', name: 'Pst. O. Ajayi', role: 'Founder', bio: 'Founder of the school.' },
    { id: 'seed-st2', name: 'Pst. Mrs. K. Ajayi', role: 'Proprietress', bio: 'Proprietress of the school.' },
    { id: 'seed-st3', name: 'Sample Teacher', role: 'Teacher', subject: 'Mathematics', bio: 'Sample entry. Replace in Admin > Teachers and staff.' }
  ]);
  put('results', [{
    id: 'res-AACDEMO001|2026/2027|First Term', student: 'Demo Student (sample only)', reg_no: 'AAC/DEMO/001', reg_norm: 'AACDEMO001', class: 'JSS 2', session: '2026/2027', term: 'First Term',
    subjects: [{ subject: 'English Language', ca: 24, exam: 58 }, { subject: 'Mathematics', ca: 27, exam: 61 }, { subject: 'Basic Science', ca: 22, exam: 49 }, { subject: 'Civic Education', ca: 26, exam: 55 }, { subject: 'Computer Studies', ca: 28, exam: 60 }, { subject: 'Yoruba', ca: 23, exam: 47 }],
    remark: 'A steady performance. Keep it up.'
  }]);
  put('pins', [{ id: 'pin-demo', pin: 'AAC-DEMO-2026', pin_norm: 'AACDEMO2026', reg_no: 'AAC/DEMO/001', reg_norm: 'AACDEMO001', session: '2026/2027', term: 'First Term', uses: 0, max_uses: 999 }]);
  store.set('aac.seeded.v3', true);
}
export function resetDemo() { Object.keys(localStorage).filter(k => k.startsWith('aac.')).forEach(k => localStorage.removeItem(k)); }

export async function list(col) {
  if (!isLive) { seedDemo(); return store.get(KEY(col), []); }
  const c = await sb();
  const { data, error } = await c.from('records').select('id,data,created_at').eq('collection', col).order('created_at', { ascending: false }).limit(1000);
  if (error) { console.warn('list', col, error.message); return []; }
  return data.map(r => ({ ...r.data, id: r.id, _created: r.created_at }));
}
export async function save(col, rec) {
  const id = rec.id || uid(); const { id: _i, _created, ...data } = rec;
  if (!isLive) {
    seedDemo(); const all = store.get(KEY(col), []); const i = all.findIndex(x => x.id === id);
    const row = { ...data, id, _created: i >= 0 ? all[i]._created : new Date().toISOString() };
    if (i >= 0) all[i] = row; else all.unshift(row);
    store.set(KEY(col), all); return row;
  }
  const c = await sb();
  const { error } = await c.from('records').upsert({ id, collection: col, data, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  return { ...data, id };
}
export async function remove(col, id) {
  if (!isLive) { store.set(KEY(col), store.get(KEY(col), []).filter(x => x.id !== id)); return; }
  const c = await sb(); const { error } = await c.from('records').delete().eq('id', id).eq('collection', col);
  if (error) throw new Error(error.message);
}
// For the public boxes (feedback, applications): anyone may add, nobody but admin may read back.
// Save many records at once (bulk import). Returns how many were written.
export async function saveMany(col, recs) {
  if (!recs.length) return 0;
  if (!isLive) { for (const r of recs) await save(col, r); return recs.length; }
  const c = await sb(); const now = new Date().toISOString();
  const rows = recs.map(r => { const id = r.id || uid(); const { id: _i, _created, ...d } = r; return { id, collection: col, data: d, updated_at: now }; });
  for (let i = 0; i < rows.length; i += 200) { const { error } = await c.from('records').upsert(rows.slice(i, i + 200)); if (error) throw new Error(error.message); }
  return recs.length;
}
export async function submitPublic(col, rec) {
  const id = uid();
  if (!isLive) return save(col, { ...rec, id });
  const c = await sb(); const { error } = await c.from('records').insert({ id, collection: col, data: rec });
  if (error) throw new Error(error.message);
  return { ...rec, id };
}
export function newRef(prefix = 'AAC') {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.random().toString(36).toUpperCase().slice(2, 5)}`;
}

/* ---------- files ---------- */
function idb() {
  return new Promise((res, rej) => { const r = indexedDB.open('aac-files', 1); r.onupgradeneeded = () => r.result.createObjectStore('blobs'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function idbPut(k, blob) { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('blobs', 'readwrite'); tx.objectStore('blobs').put(blob, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
async function idbGet(k) { const db = await idb(); return new Promise((res, rej) => { const q = db.transaction('blobs').objectStore('blobs').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); }

async function shrinkImage(file, max = 1600) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file); const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.82));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch { return file; }
}
export async function uploadFile(file, prefix = '') {
  const f = await shrinkImage(file); const limit = 15 * 1024 * 1024;
  if (f.size > limit) throw new Error('File is too big. Maximum is 15 MB.');
  const safe = f.name.replace(/[^A-Za-z0-9._-]+/g, '_');
  if (!isLive) { const fid = 'f_' + uid(); await idbPut(fid, f); return { fid, name: f.name, type: f.type, size: f.size }; }
  const c = await sb(); const path = `${prefix ? prefix + '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`;
  const { error } = await c.storage.from('uploads').upload(path, f, { contentType: f.type || 'application/octet-stream' });
  if (error) throw new Error('Upload failed: ' + error.message);
  return { fid: path, path, name: f.name, type: f.type, size: f.size };
}
export function fileUrl(f) {
  if (!f) return ''; if (f.url) return f.url;
  if (isLive && f.path) return `${BASE}/storage/v1/object/public/uploads/${encodeURI(f.path)}`;
  return '';
}
// Attribute string for <img>/<a>. In demo mode the real blob URL is filled in by hydrate() after render.
export function fileAttr(f, attr = 'href') {
  const u = fileUrl(f);
  return `${attr}="${String(u).replace(/"/g, '&quot;')}" ${!u && f && f.fid ? `data-fid="${f.fid}" data-fattr="${attr}"` : ''}`;
}
// Resolve a stored file to a usable URL (works for demo-mode blobs too). Used for CSS backgrounds.
export async function fileSrc(f) {
  if (!f) return ''; const u = fileUrl(f); if (u) return u;
  try { const b = f.fid && await idbGet(f.fid); return b ? URL.createObjectURL(b) : ''; } catch { return ''; }
}
export async function hydrate(root) {
  for (const el of root.querySelectorAll('[data-fid]')) {
    try { const b = await idbGet(el.dataset.fid); if (b) el.setAttribute(el.dataset.fattr || 'href', URL.createObjectURL(b)); } catch { /* ignore */ }
  }
}

/* ---------- auth ---------- */
const DEMO_LOGIN = { id: 'demo', pw: 'demo1234' };
export function loginEmail(role, identifier) {
  const id = identifier.trim(); if (id.includes('@')) return id.toLowerCase();
  return `${id.toLowerCase().replace(/[^a-z0-9]/g, '')}@${role}.allages.app`;
}
export async function signIn(role, identifier, password) {
  if (!isLive) {
    if (identifier.trim().toLowerCase() === DEMO_LOGIN.id && password === DEMO_LOGIN.pw) {
      const s = { role, name: 'Demo ' + role[0].toUpperCase() + role.slice(1), id: 'demo', regs: ['AAC/DEMO/001'] };
      store.set('aac.session', s); return { ok: true, session: s };
    }
    return { ok: false, message: 'Wrong details. In demo mode use "demo" and "demo1234".' };
  }
  const c = await sb();
  const { data, error } = await c.auth.signInWithPassword({ email: loginEmail(role, identifier), password });
  if (error) return { ok: false, message: 'Wrong details. Check your ID and password and try again.' };
  const s = await profileSession(c, data.user);
  if (!s || (s.dbRole !== role && s.dbRole !== 'admin')) { await c.auth.signOut(); return { ok: false, message: `This account is not registered as ${role}. Choose the right portal.` }; }
  return { ok: true, session: s };
}
async function profileSession(c, user) {
  const { data: p } = await c.from('profiles').select('role, full_name, reg_no, linked_regs').eq('id', user.id).single();
  if (!p) return null;
  return { role: p.role, dbRole: p.role, name: p.full_name || user.email, id: user.id, regs: [...(p.linked_regs || []), ...(p.reg_no ? [p.reg_no] : [])] };
}
export async function getSession() {
  if (!isLive) return store.get('aac.session', null);
  const c = await sb(); const { data } = await c.auth.getSession();
  return data.session ? profileSession(c, data.session.user) : null;
}
export async function signOut() { store.del('aac.session'); if (isLive) { const c = await sb(); await c.auth.signOut(); } }

/* ---------- fees ---------- */
export function feeApplies(fee, student) {
  if (!student) return false;
  if (fee.scope === 'class') return fee.targetClass === student.class;
  if (fee.scope === 'student') return fee.targetReg === student.reg_no;
  return true;
}
export function feeLines(student, fees, payments) {
  return fees.filter(f => feeApplies(f, student)).map(f => {
    const mine = payments.filter(p => p.regNo === student.reg_no && p.feeId === f.id);
    const pending = mine.filter(p => p.status === 'Pending').reduce((a, p) => a + Number(p.amount || 0), 0);
    const paid = mine.filter(p => !p.status || p.status === 'Confirmed').reduce((a, p) => a + Number(p.amount || 0), 0);
    const balance = Math.max(0, Number(f.amount) - paid);
    return { fee: f, paid, pending, balance, status: balance === 0 ? 'Paid' : paid > 0 ? 'Part paid' : 'Unpaid' };
  });
}

/* ---------- feedback replies (bell) ---------- */
export const trackedRefs = () => store.get('aac.myfb', []);
export function trackRef(ref) { const r = String(ref || '').trim().toUpperCase(); if (!r) return; const a = trackedRefs(); if (!a.includes(r)) { a.push(r); store.set('aac.myfb', a); } }
const seen = () => store.get('aac.fbseen', {});
const fbKey = m => (m.respondedAt || '') + '|' + (m.status || '') + '|' + (m.adminNote || '').length;
export async function getReplies() {
  const refs = trackedRefs(); if (!refs.length) return [];
  let rows = [];
  if (!isLive) rows = (await list('feedback')).filter(r => refs.includes(String(r.ref).toUpperCase()));
  else { const c = await sb(); const { data, error } = await c.rpc('check_feedback', { p_refs: refs }); if (!error && Array.isArray(data)) rows = data; }
  const sn = seen();
  return rows.map(r => ({ ref: r.ref, type: r.type, message: r.message, status: r.status || 'New', adminNote: r.adminNote || '', respondedAt: r.respondedAt || '', unread: Boolean((r.adminNote || (r.status && r.status !== 'New')) && sn[r.ref] !== fbKey(r)) }))
    .sort((a, b) => Number(b.unread) - Number(a.unread));
}
export function markRepliesSeen(list) { const sn = seen(); list.forEach(m => { sn[m.ref] = fbKey(m); }); store.set('aac.fbseen', sn); }

/* ---------- admissions ---------- */
export async function submitApplication(form) {
  const ref = newRef('AAC');
  try { await submitPublic('applications', { ...form, ref, status: 'New' }); return { ok: true, ref }; }
  catch { return { ok: false, message: 'We could not send your application. Please try again or call the school.' }; }
}

/* ---------- results ---------- */
export function gradeFor(t) { return t >= 70 ? 'A' : t >= 60 ? 'B' : t >= 50 ? 'C' : t >= 45 ? 'D' : t >= 40 ? 'E' : 'F'; }
export async function checkResult({ pin, reg, session, term }) {
  if (!isLive) {
    const pins = await list('pins'); const p = pins.find(x => x.pin_norm === norm(pin) && x.reg_norm === norm(reg) && x.session === session && x.term === term);
    if (!p) return { ok: false, message: 'Invalid PIN, reg. number, session or term. In demo mode use PIN AAC-DEMO-2026 and reg. number AAC/DEMO/001.' };
    if ((p.uses || 0) >= (p.max_uses || 5)) return { ok: false, message: 'This PIN has reached its maximum number of uses.' };
    const r = (await list('results')).find(x => x.reg_norm === p.reg_norm && x.session === session && x.term === term);
    if (!r) return { ok: false, message: 'This result has not been published yet.' };
    await save('pins', { ...p, uses: (p.uses || 0) + 1 });
    return { ok: true, demo: r.reg_norm === 'AACDEMO001', data: r };
  }
  const c = await sb();
  const { data, error } = await c.rpc('check_result', { p_pin: pin.trim(), p_reg: reg.trim(), p_session: session, p_term: term });
  if (error || !data || data.error) return { ok: false, message: (data && data.error) || 'No result found. Check your PIN, reg. number, session and term.' };
  return { ok: true, data };
}
// rows: [{reg_no,name,class,session,term,subject,ca,exam,remark}] -> saves result sheets, students, and new PINs
export async function importResults(rows) {
  const groups = new Map(); let skipped = 0;
  rows.forEach(r => {
    const ok = r.reg_no && r.session && r.term && r.subject && r.ca !== '' && r.exam !== '' && !isNaN(Number(r.ca)) && !isNaN(Number(r.exam));
    if (!ok) { skipped++; return; }
    const key = `${norm(r.reg_no)}|${r.session}|${r.term}`;
    if (!groups.has(key)) groups.set(key, { student: r.name || r.reg_no, reg_no: r.reg_no, reg_norm: norm(r.reg_no), class: r.class || '', session: r.session, term: r.term, subjects: [], remark: r.remark || '' });
    const g = groups.get(key); g.subjects.push({ subject: r.subject, ca: Number(r.ca), exam: Number(r.exam) }); if (r.remark) g.remark = r.remark;
  });
  const pins = await list('pins'); const students = await list('students'); const newPins = [];
  for (const [key, g] of groups) {
    await save('results', { id: 'res-' + key, ...g });
    if (!students.find(s => s.reg_norm === g.reg_norm)) await save('students', { id: 'stu-' + g.reg_norm, name: g.student, reg_no: g.reg_no, reg_norm: g.reg_norm, class: g.class });
    if (!pins.find(p => p.reg_norm === g.reg_norm && p.session === g.session && p.term === g.term)) {
      const pin = 'AAC' + Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
      await save('pins', { id: 'pin-' + key, pin, pin_norm: pin, reg_no: g.reg_no, reg_norm: g.reg_norm, session: g.session, term: g.term, uses: 0, max_uses: 5 });
      newPins.push({ pin, reg_no: g.reg_no, name: g.student, session: g.session, term: g.term });
    }
  }
  return { sheets: groups.size, skipped, newPins };
}

/* ---------- AI assistant ---------- */
export async function askAI(messages, context) {
  if (!CONFIG.AI_ENDPOINT) return null;
  try {
    const res = await fetch(CONFIG.AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY }, body: JSON.stringify({ messages, context }) });
    if (!res.ok) return null; const j = await res.json(); return j.reply || null;
  } catch { return null; }
}

/* ---------- accounts (admin only, live mode) ---------- */
export async function adminUsers(body) {
  if (!isLive) return { error: 'Accounts are created in live mode. In demo mode use demo / demo1234.' };
  const c = await sb(); const { data: s } = await c.auth.getSession();
  try {
    const r = await fetch(`${BASE}/functions/v1/admin-users`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + (s.session ? s.session.access_token : '') }, body: JSON.stringify(body) });
    return await r.json();
  } catch { return { error: 'Could not reach the account service. Check that the admin-users function is deployed.' }; }
}
