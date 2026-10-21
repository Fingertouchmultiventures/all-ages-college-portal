import { CONFIG } from './config.js';
import * as data from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const view = $('#view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- icons ---------- */
const P = {
  cap: 'M2 9l10-5 10 5-10 5z M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20a6 6 0 0 1 12 0 M17 11a3 3 0 0 0 0-5 M21 20a5 5 0 0 0-4-5',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  card: 'M2 6h20v12H2z M2 10h20 M6 15h4',
  wallet: 'M2 7h20v10H2z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4',
  award: 'M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M8.5 12.5L7 21l5-3 5 3-1.5-8.5',
  form: 'M6 3h9l4 4v14H6z M9 13l2 2 4-4',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  back: 'M19 12H5 M11 6l-6 6 6 6',
  room: 'M3 4h18v11H3z M12 15v4 M8 21l4-2 4 2',
  task: 'M9 4h6v3H9z M7 5H5v16h14V5h-2 M9 12h6 M9 16h4',
  book: 'M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z',
  pencil: 'M4 20l1-4L16 5l3 3L8 19z M14 7l3 3',
  monitor: 'M3 4h18v12H3z M8 20h8 M12 16v4',
  chart: 'M4 20V10 M10 20V4 M16 20v-8 M22 20H2',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
  mega: 'M3 11v3h3l8 4V7L6 11z M18 9a4 4 0 0 1 0 6',
  cal: 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4',
  image: 'M3 4h18v16H3z M8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M3 17l5-5 4 4 3-3 6 6',
  folder: 'M3 6h6l2 2h10v11H3z',
  bulb: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  out: 'M9 4H4v16h5 M16 8l4 4-4 4 M20 12H9'
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;

/* ---------- roles ---------- */
const ROLES = {
  student: { label: 'Student', sub: 'Classes, tests and results', idLabel: 'Reg. number', idHint: 'Example: AAC/2026/001', icon: 'cap', db: 'student' },
  parent: { label: 'Parent', sub: 'Fees, results and notices', idLabel: 'Phone number or email', idHint: 'The one you gave the school', icon: 'people', db: 'parent' },
  teacher: { label: 'Teacher', sub: 'Scores, lessons and tests', idLabel: 'Staff ID or email', idHint: 'Given to you by the school', icon: 'user', db: 'teacher' },
  payment: { label: 'Payment', sub: 'Pay school fees', idLabel: 'Phone number or email', idHint: 'The parent account you registered', icon: 'card', db: 'parent' },
  bursar: { label: 'Bursar', sub: 'Fees and receipts', idLabel: 'Staff ID or email', idHint: 'Given to you by the school', icon: 'wallet', db: 'bursar' },
  admin: { label: 'Admin', sub: 'School management', idLabel: 'Email or staff ID', idHint: 'Given to you by the school', icon: 'shield', db: 'admin' }
};
const TILES = {
  student: [['Classroom', 'room'], ['Assignments', 'task'], ['Library', 'book'], ['Tests', 'form'], ['Examination', 'pencil'], ['CBT', 'monitor'], ['Scorecard', 'chart'], ['Announcements', 'mega'], ['Events', 'cal']],
  parent: [['Pay fees', 'card'], ['Results', 'award'], ['Scorecard', 'chart'], ['Announcements', 'mega'], ['PTA', 'people'], ['Events', 'cal'], ['School album', 'image']],
  teacher: [['Classroom', 'room'], ['Assignments', 'task'], ['Tests', 'form'], ['Examination', 'pencil'], ['CBT', 'monitor'], ['Enter scores', 'chart'], ['Coaching and lessons', 'bulb'], ['Library', 'book']],
  bursar: [['Fee records', 'wallet'], ['Payments', 'card'], ['Debtors', 'people'], ['Receipts', 'form'], ['Reports', 'chart']],
  admin: [['Applications', 'form', '#/applications'], ['Students', 'cap'], ['Staff', 'user'], ['Result PINs', 'award'], ['Inventory', 'box'], ['Announcements', 'mega'], ['Events', 'cal'], ['Projects', 'folder'], ['Sessions', 'cal']]
};

const CLASS_GROUPS = [
  ['Early years', ['Creche', 'Nursery 1', 'Nursery 2']],
  ['Primary', ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']],
  ['Junior secondary', ['JSS 1', 'JSS 2', 'JSS 3']],
  ['Senior secondary', ['SSS 1', 'SSS 2', 'SSS 3']]
];

/* ---------- small UI helpers ---------- */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3800);
}
function field({ id, label, type = 'text', value = '', required = true, hint = '', extra = '', opt = false, msg = '' }) {
  return `<div class="field" data-field="${id}">
    <label for="${id}">${label}${opt ? ' <span class="opt">(optional)</span>' : ''}</label>
    <input class="input" id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${msg ? `data-msg="${esc(msg)}"` : ''} aria-describedby="${id}-e" ${extra}>
    ${hint ? `<span class="hint">${hint}</span>` : ''}<span class="error" id="${id}-e" role="alert"></span></div>`;
}
function selectField({ id, label, value = '', options, required = true, placeholder = 'Select', msg = '' }) {
  return `<div class="field" data-field="${id}"><label for="${id}">${label}</label>
    <select class="input" id="${id}" name="${id}" ${required ? 'required' : ''} ${msg ? `data-msg="${esc(msg)}"` : ''} aria-describedby="${id}-e">
    <option value="">${placeholder}</option>${options}</select><span class="error" id="${id}-e" role="alert"></span></div>`;
}
const opt = (v, cur) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(v)}</option>`;

function validate(form) {
  let first = null;
  form.querySelectorAll('.input').forEach(el => {
    const wrap = el.closest('[data-field]'); const err = wrap && wrap.querySelector('.error');
    if (!err) return;
    if (el.checkValidity()) { err.textContent = ''; el.removeAttribute('aria-invalid'); }
    else { err.textContent = el.dataset.msg || el.validationMessage; el.setAttribute('aria-invalid', 'true'); first = first || el; }
  });
  if (first) first.focus();
  return !first;
}
const showPw = btn => { const i = btn.previousElementSibling; const s = i.type === 'password'; i.type = s ? 'text' : 'password'; btn.textContent = s ? 'Hide' : 'Show'; btn.setAttribute('aria-pressed', String(s)); };

/* ---------- views ---------- */
function contactBlock() {
  return `<div class="mobile-contact"><div class="contact-row">${ic('phone')}<span><a href="tel:+2348057394188">0805 739 4188</a> &middot; <a href="tel:+2348102776581">0810 277 6581</a> &middot; <a href="tel:+2348038043666">0803 804 3666</a></span></div>
  <div class="contact-row">${ic('cal')}<span>Zone 2, Papa Olorunsogo, Apete, Ibadan, Oyo State</span></div></div>`;
}

function vHome() {
  const portals = Object.entries(ROLES).map(([k, r]) => `<a class="portal" href="#/login/${k}"><span class="ico">${ic(r.icon)}</span><span><b>${r.label} portal</b><small>${r.sub}</small></span></a>`).join('');
  return { title: 'Portals', nav: 'home', html: `
    <p class="eyebrow">Welcome</p>
    <h1 class="h1">Sign in to your portal</h1>
    <p class="lead">Choose who you are to continue.</p>
    <div class="portals">${portals}</div>
    <div class="actions">
      <a class="action action-red" href="#/apply">${ic('form')}<b>Apply for admission</b><span>Creche to SSS 3, 2026/2027 session</span></a>
      <a class="action action-yellow" href="#/result">${ic('award')}<b>Check result</b><span>Use your PIN and reg. number</span></a>
    </div>${contactBlock()}` };
}

function vLogin(role) {
  const r = ROLES[role]; if (!r) return vHome();
  const tabs = Object.entries(ROLES).map(([k, x]) => `<a href="#/login/${k}" ${k === role ? 'aria-current="page"' : ''}>${x.label}</a>`).join('');
  return { title: r.label + ' sign in', nav: 'home', html: `
    <a class="back" href="#/">${ic('back')} All portals</a>
    <p class="eyebrow">Secure sign in</p>
    <h1 class="h1">${r.label} portal</h1>
    <div class="roles" role="navigation" aria-label="Switch portal">${tabs}</div>
    <form class="card" id="loginForm" novalidate style="margin-top:14px">
      ${field({ id: 'identifier', label: r.idLabel, hint: r.idHint, extra: 'autocomplete="username" autocapitalize="none" spellcheck="false"' })}
      <div class="field" data-field="password"><label for="password">Password</label>
        <div class="pw"><input class="input" id="password" name="password" type="password" required autocomplete="current-password" aria-describedby="password-e"><button type="button" id="pwToggle" aria-pressed="false">Show</button></div>
        <span class="error" id="password-e" role="alert"></span></div>
      <div id="loginErr" class="error" role="alert" style="margin-top:12px"></div>
      <button class="btn btn-block" style="margin-top:18px" type="submit">Sign in ${ic('arrow')}</button>
      <div class="row-between" style="margin-top:16px"><span class="hint">Forgot your password? Call the school office.</span>
        <a class="link" href="tel:+2348057394188">Call 0805 739 4188</a></div>
    </form>
    <p class="hint" style="margin-top:16px">New family? <a class="link" href="#/apply">Apply for admission</a></p>`,
    bind() {
      $('#pwToggle').onclick = e => showPw(e.currentTarget);
      $('#loginForm').onsubmit = async e => {
        e.preventDefault(); const f = e.currentTarget; if (!validate(f)) return;
        const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.firstChild.textContent = 'Signing in… ';
        const res = await data.signIn(r.db, f.identifier.value, f.password.value);
        btn.disabled = false; btn.firstChild.textContent = 'Sign in ';
        if (!res.ok) { $('#loginErr').textContent = res.message; return; }
        location.hash = '#/dashboard';
      };
    } };
}

async function vDashboard() {
  const s = await data.getSession();
  if (!s) { location.hash = '#/login/student'; return null; }
  const role = s.role === 'payment' ? 'parent' : s.role;
  const tiles = (TILES[role] || []).map(([n, i, href]) => href
    ? `<a class="tile" href="${href}">${ic(i)}<b>${n}</b><small>Open</small></a>`
    : `<div class="tile" aria-disabled="true">${ic(i)}<b>${n}</b><small><span class="pill">Coming soon</span></small></div>`).join('');
  return { title: 'Dashboard', nav: 'home', html: `
    <p class="eyebrow">${esc(role)} portal</p>
    <h1 class="h1">Welcome, ${esc(s.name)}</h1>
    <p class="lead">You are signed in. These are the modules for your portal. The ones marked "Coming soon" are being added.</p>
    <div class="tiles">${tiles}</div>
    <button class="btn btn-ghost" id="out" style="margin-top:26px" type="button">${ic('out')} Sign out</button>`,
    bind() { $('#out').onclick = async () => { await data.signOut(); location.hash = '#/'; }; } };
}

async function vApplications() {
  const s = await data.getSession();
  if (!s || (s.role !== 'admin')) { location.hash = '#/login/admin'; return null; }
  const rows = await data.listApplications();
  const body = rows.length ? rows.map(a => `<tr><td>${esc(a.ref)}</td><td>${esc(a.firstName)} ${esc(a.surname)}</td><td>${esc(a.classApplied)}</td><td>${esc(a.guardianName)}<br><a class="link" href="tel:${esc(a.phone)}">${esc(a.phone)}</a></td></tr>`).join('')
    : `<tr><td colspan="4" class="hint">No applications yet.</td></tr>`;
  return { title: 'Applications', nav: 'home', html: `
    <a class="back" href="#/dashboard">${ic('back')} Dashboard</a>
    <h1 class="h1">Applications</h1>
    <p class="lead">${rows.length} received${data.isLive ? '' : ' (demo mode: saved on this device only)'}.</p>
    <div class="card tbl-wrap" style="margin-top:20px"><table><thead><tr><th>Ref</th><th>Child</th><th>Class</th><th>Parent</th></tr></thead><tbody>${body}</tbody></table></div>` };
}

/* ---- application form ---- */
let appState = {}; let appStep = 1;
const STEPS = ['Child', 'Parent', 'Review'];
function stepper() { return `<ol class="steps" aria-label="Progress">${STEPS.map((s, i) => `<li class="${i + 1 === appStep ? 'on' : i + 1 < appStep ? 'done' : ''}" ${i + 1 === appStep ? 'aria-current="step"' : ''}>${i + 1}. ${s}</li>`).join('')}</ol>`; }

function vApply() {
  const v = appState; const today = new Date().toISOString().slice(0, 10);
  let inner = '';
  if (appStep === 1) {
    const classOpts = CLASS_GROUPS.map(([g, list]) => `<optgroup label="${g}">${list.map(c => opt(c, v.classApplied)).join('')}</optgroup>`).join('');
    inner = `<fieldset class="fs"><legend class="legend" style="font:600 18px var(--head);margin-bottom:4px">Child's details</legend>
      <div class="grid2">${field({ id: 'firstName', label: 'First name', value: v.firstName, extra: 'autocomplete="off"' })}${field({ id: 'surname', label: 'Surname', value: v.surname })}</div>
      ${field({ id: 'otherNames', label: 'Other names', value: v.otherNames, required: false, opt: true })}
      <div class="grid2">${selectField({ id: 'gender', label: 'Gender', options: ['Female', 'Male'].map(g => opt(g, v.gender)).join('') })}
      ${field({ id: 'dob', label: 'Date of birth', type: 'date', value: v.dob, extra: `max="${today}" min="2000-01-01"`, msg: 'Enter a valid date of birth' })}</div>
      ${selectField({ id: 'classApplied', label: 'Class applying for', options: classOpts, msg: 'Choose a class' })}
      ${field({ id: 'previousSchool', label: 'Previous school', value: v.previousSchool, required: false, opt: true })}</fieldset>`;
  } else if (appStep === 2) {
    inner = `<fieldset class="fs"><legend class="legend" style="font:600 18px var(--head);margin-bottom:4px">Parent or guardian</legend>
      ${field({ id: 'guardianName', label: 'Full name', value: v.guardianName, extra: 'autocomplete="name"' })}
      ${selectField({ id: 'relationship', label: 'Relationship to the child', options: ['Mother', 'Father', 'Guardian', 'Other'].map(g => opt(g, v.relationship)).join('') })}
      <div class="grid2">${field({ id: 'phone', label: 'Phone number', type: 'tel', value: v.phone, hint: 'The school will call this number', msg: 'Enter a valid Nigerian number, e.g. 08012345678', extra: 'inputmode="tel" autocomplete="tel" pattern="(\\+?234|0)[789][01][0-9]{8}"' })}
      ${field({ id: 'whatsapp', label: 'WhatsApp number', type: 'tel', value: v.whatsapp, required: false, opt: true, msg: 'Enter a valid Nigerian number', extra: 'inputmode="tel" pattern="(\\+?234|0)[789][01][0-9]{8}"' })}</div>
      ${field({ id: 'email', label: 'Email', type: 'email', value: v.email, required: false, opt: true })}
      <div class="field" data-field="address"><label for="address">Home address</label>
        <textarea class="input" id="address" name="address" required aria-describedby="address-e" autocomplete="street-address">${esc(v.address)}</textarea><span class="error" id="address-e" role="alert"></span></div>
      ${selectField({ id: 'heardFrom', label: 'How did you hear about us? (optional)', required: false, placeholder: 'Select', options: ['Flier', 'Social media', 'Friend or family', 'Church', 'Passing by the school', 'Other'].map(g => opt(g, v.heardFrom)).join('') })}</fieldset>`;
  } else {
    const row = (k, val) => `<dt>${k}</dt><dd>${esc(val) || '–'}</dd>`;
    inner = `<div class="review"><h2 style="font-size:18px">Check your details</h2>
      <h3>Child</h3><dl>${row('Name', [v.firstName, v.otherNames, v.surname].filter(Boolean).join(' '))}${row('Gender', v.gender)}${row('Date of birth', v.dob)}${row('Class', v.classApplied)}${row('Previous school', v.previousSchool)}</dl>
      <h3>Parent or guardian</h3><dl>${row('Name', v.guardianName)}${row('Relationship', v.relationship)}${row('Phone', v.phone)}${row('WhatsApp', v.whatsapp)}${row('Email', v.email)}${row('Address', v.address)}</dl></div>
      <label class="check"><input type="checkbox" id="consent" required> <span>I confirm these details are correct. The school may contact me about admission.</span></label>
      <span class="error" id="consent-e" role="alert"></span>`;
  }
  return { title: 'Apply for admission', nav: 'apply', html: `
    <p class="eyebrow">Admission 2026/2027</p>
    <h1 class="h1">Apply to All Ages College</h1>
    <p class="lead">Creche to SSS 3. It takes about 3 minutes.</p>
    ${stepper()}
    <form class="card" id="applyForm" novalidate style="margin-top:12px">${inner}
      <div id="applyErr" class="error" role="alert" style="margin-top:12px"></div>
      <div class="row-between" style="margin-top:22px">
        ${appStep > 1 ? '<button class="btn btn-ghost" type="button" id="prev">Back</button>' : '<span></span>'}
        <button class="btn" type="submit">${appStep === 3 ? 'Submit application' : 'Continue'}</button></div>
    </form>`,
    bind() {
      const form = $('#applyForm');
      const save = () => { new FormData(form).forEach((val, k) => { appState[k] = String(val); }); };
      const prev = $('#prev'); if (prev) prev.onclick = () => { save(); appStep--; render(); };
      form.onsubmit = async e => {
        e.preventDefault();
        if (appStep < 3) { if (!validate(form)) return; save(); appStep++; render(); return; }
        const c = $('#consent'); if (!c.checked) { $('#consent-e').textContent = 'Please tick the box to continue.'; c.focus(); return; }
        const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending…';
        const res = await data.submitApplication(appState);
        if (!res.ok) { btn.disabled = false; btn.textContent = 'Submit application'; $('#applyErr').textContent = res.message; return; }
        const done = { ...appState, ref: res.ref }; appState = {}; appStep = 1; renderDone(done);
      };
    } };
}
function renderDone(a) {
  document.title = 'Application received | All Ages College';
  view.innerHTML = `<div class="ok-box"><p class="eyebrow" style="color:var(--ok)">Application received</p>
    <h1 class="h1">Thank you, ${esc(a.guardianName.split(' ')[0])}</h1>
    <p>Your reference number for ${esc(a.firstName)} ${esc(a.surname)} (${esc(a.classApplied)}):</p>
    <div class="refno" id="ref">${esc(a.ref)}</div>
    <p class="hint" style="color:var(--ink)">Our admin office will call ${esc(a.phone)}. Keep this number. The entrance examination needs the school form, which you can get at the school or admin office, so bring this reference with you.</p></div>
    <div class="row-between noprint" style="margin-top:18px;justify-content:flex-start;gap:10px"><button class="btn btn-navy" id="copy" type="button">Copy reference</button>
    <button class="btn btn-ghost" id="print" type="button">Print</button><a class="btn btn-ghost" href="#/">Done</a></div>`;
  $('#copy').onclick = async () => { try { await navigator.clipboard.writeText(a.ref); toast('Reference copied'); } catch { toast('Copy failed. Write the number down.'); } };
  $('#print').onclick = () => window.print();
  view.focus(); window.scrollTo(0, 0);
}

/* ---- result ---- */
function vResult() {
  const terms = ['First Term', 'Second Term', 'Third Term'];
  return { title: 'Check result', nav: 'result', html: `
    <p class="eyebrow">Result checking</p>
    <h1 class="h1">Check your result</h1>
    <p class="lead">Enter the PIN on your scratch card or result slip, with the student's reg. number.</p>
    <form class="card" id="resForm" novalidate style="margin-top:22px">
      ${field({ id: 'pin', label: 'Access PIN', extra: 'autocomplete="off" autocapitalize="characters" spellcheck="false"', msg: 'Enter your PIN' })}
      ${field({ id: 'reg', label: 'Student reg. number', hint: 'Example: AAC/2026/001', extra: 'autocomplete="off" autocapitalize="characters" spellcheck="false"', msg: 'Enter the reg. number' })}
      <div class="grid2">${selectField({ id: 'session', label: 'Session', options: CONFIG.SESSIONS.map(s => opt(s, CONFIG.SESSIONS[0])).join('') })}
      ${selectField({ id: 'term', label: 'Term', options: terms.map(t => opt(t, '')).join('') })}</div>
      <div id="resErr" class="error" role="alert" style="margin-top:12px"></div>
      <button class="btn btn-block" style="margin-top:18px" type="submit">View result</button>
    </form><div id="resOut"></div>`,
    bind() {
      $('#resForm').onsubmit = async e => {
        e.preventDefault(); const f = e.currentTarget; $('#resErr').textContent = ''; $('#resOut').innerHTML = '';
        if (!validate(f)) return;
        const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Checking…';
        const res = await data.checkResult({ pin: f.pin.value, reg: f.reg.value, session: f.session.value, term: f.term.value });
        btn.disabled = false; btn.textContent = 'View result';
        if (!res.ok) { $('#resErr').textContent = res.message; return; }
        $('#resOut').innerHTML = resultCard(res.data, res.demo); $('#resOut').scrollIntoView({ behavior: 'smooth', block: 'start' });
        $('#printRes').onclick = () => window.print();
      };
    } };
}
function resultCard(d, demo) {
  const rows = d.subjects.map(s => { const t = Number(s.ca) + Number(s.exam); return { ...s, t, g: s.grade || data.gradeFor(t) }; });
  const total = rows.reduce((a, r) => a + r.t, 0); const avg = rows.length ? total / rows.length : 0;
  return `<div class="card" style="margin-top:20px">
    <div class="result-head"><div><p class="eyebrow" style="margin:0">${esc(d.term)} &middot; ${esc(d.session)}</p><h2 style="font-size:22px;margin-top:6px">${esc(d.student)}</h2></div>
    <img src="assets/logo.png" alt="" width="64" height="57"></div>
    ${demo ? '<p><span class="pill">Sample result, demo only</span></p>' : ''}
    <div class="meta"><div><span>Reg. number</span><b>${esc(d.reg_no)}</b></div><div><span>Class</span><b>${esc(d.class)}</b></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Subject</th><th class="n">CA</th><th class="n">Exam</th><th class="n">Total</th><th class="n">Grade</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${esc(r.subject)}</td><td class="n">${r.ca}</td><td class="n">${r.exam}</td><td class="n"><b>${r.t}</b></td><td class="n"><b>${esc(r.g)}</b></td></tr>`).join('')}</tbody></table></div>
    <div class="sum"><div><small>Total score</small><b>${total}</b></div><div><small>Average</small><b>${avg.toFixed(1)}</b></div></div>
    ${d.remark ? `<p style="margin:16px 0 0"><b>Remark:</b> ${esc(d.remark)}</p>` : ''}
    <button class="btn btn-navy noprint" id="printRes" style="margin-top:18px" type="button">Print result</button></div>`;
}

/* ---------- router ---------- */
async function render() {
  const [route = '', arg] = location.hash.replace(/^#\/?/, '').split('/');
  let v;
  if (route === 'login') v = vLogin(arg);
  else if (route === 'dashboard') v = await vDashboard();
  else if (route === 'applications') v = await vApplications();
  else if (route === 'apply') v = vApply();
  else if (route === 'result') v = vResult();
  else v = vHome();
  if (!v) return;
  view.innerHTML = v.html; document.title = `${v.title} | All Ages College`;
  document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === v.nav) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (v.bind) v.bind();
  window.scrollTo(0, 0); view.focus({ preventScroll: true });
}
window.addEventListener('hashchange', render);

/* ---------- demo banner, install, service worker ---------- */
if (!data.isLive) {
  const b = $('#demoBanner'); b.hidden = false;
  b.innerHTML = '<b>Demo mode.</b> Nothing is saved on a server. Demo sign in: <b>demo</b> / <b>demo1234</b>. Sample result: PIN <b>AAC-DEMO-2026</b>, reg. no. <b>AAC/DEMO/001</b>.';
}
let deferred;
const installBtn = $('#installBtn');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if (!standalone) installBtn.hidden = false; });
window.addEventListener('appinstalled', () => { installBtn.hidden = true; toast('App installed'); });
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone) installBtn.hidden = false;
installBtn.onclick = async () => {
  if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; installBtn.hidden = true; }
  else toast('On iPhone: tap Share, then "Add to Home Screen".');
};
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
}
render();
