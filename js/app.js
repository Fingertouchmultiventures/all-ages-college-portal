import { CONFIG } from './config.js';
import * as data from './data.js';
import { COLS, ACTIVITIES } from './schema.js';
import { $, $$, esc, ic, opt, field, selectField, validate, showPw, toast, CLASS_GROUPS, TERMS, today as todayStr } from './ui.js';
import { hubTiles, vManage } from './manage.js';
import * as pt from './portal.js';
import { mountChat } from './chat.js';

const view = $('#view');

/* ---------- roles and dashboards ---------- */
const ROLES = {
  student: { label: 'Student', sub: 'Curriculum, notes and fees', idLabel: 'Reg. number', idHint: 'Example: AAC/2026/001', icon: 'cap', db: 'student' },
  parent: { label: 'Parent', sub: 'Fees, results and notices', idLabel: 'Phone number or email', idHint: 'The one you gave the school', icon: 'people', db: 'parent' },
  teacher: { label: 'Teacher', sub: 'Lesson notes and curriculum', idLabel: 'Staff ID or email', idHint: 'Given to you by the school', icon: 'user', db: 'teacher' },
  payment: { label: 'Payment', sub: 'Parents pay fees. Bursar and admin manage payments', idLabel: 'Phone number, staff ID or email', idHint: 'Parent, bursar or admin account', icon: 'card', db: ['parent', 'student', 'bursar', 'admin'] },
  bursar: { label: 'Bursar', sub: 'Fees, payments and receipts', idLabel: 'Staff ID or email', idHint: 'Given to you by the school', icon: 'wallet', db: 'bursar' },
  admin: { label: 'Admin', sub: 'Manage everything', idLabel: 'Email or staff ID', idHint: 'Given to you by the school', icon: 'shield', db: 'admin' }
};
const SOON = n => [n[0], n[1], null];
const TILES = {
  student: [['My profile and portfolio', 'user', '#/p/profile'], ['Student community', 'people', '#/p/community'], ['Weekly corner', 'mega', '#/p/weekly'], ['Celebrations', 'award', '#/celebrations'], ['Curriculum', 'list', '#/p/curriculum'], ['Lesson notes', 'book', '#/p/notes'], ['Live classes', 'monitor', '#/p/live'], ['Notebooks', 'book', '#/p/notebooks'], ['Practice questions', 'form', '#/p/practice'], ['Assignments', 'task', '#/p/assignments'], ['Tests and exams', 'form', '#/p/tests'], ['Scorecard', 'chart', '#/p/scorecard'], ['Library and files', 'folder', '#/p/library'], ['Fees', 'wallet', '#/p/fees'], ['Announcements', 'mega', '#/announcements'], ['School album', 'image', '#/album'], SOON(['CBT', 'monitor'])],
  parent: [['My child\'s profile', 'user', '#/p/profile'], ['PTA', 'people', '#/p/pta'], ['Celebrations', 'award', '#/celebrations'], ['Fees and payments', 'card', '#/p/pay'], ['Live classes', 'monitor', '#/p/live'], ['Practice questions', 'form', '#/p/practice'], ['Scorecard', 'chart', '#/p/scorecard'], ['Check result', 'award', '#/result'], ['Assignments', 'task', '#/p/assignments'], ['Tests and exams', 'form', '#/p/tests'], ['Notebooks', 'book', '#/p/notebooks'], ['Curriculum', 'list', '#/p/curriculum'], ['Announcements', 'mega', '#/announcements'], ['School album', 'image', '#/album'], ['Feedback box', 'mail', '#/feedback']],
  teacher: [['Teachers forum and class rooms', 'people', '#/p/community'], ['PTA', 'people', '#/p/pta'], ['Weekly corner', 'mega', '#/p/weekly'], ['Student profiles', 'user', '#/p/profile'], ['Live classes', 'monitor', '#/p/live'], ['Enter scores for a class', 'chart', '#/p/scoresheet'], ['Notebooks (student view)', 'book', '#/p/notebooks'], ['Announcements', 'mega', '#/announcements'], ['School album', 'image', '#/album']],
  bursar: [['Payment portal', 'card', '#/p/pay'], ['Celebrations', 'award', '#/celebrations'], ['Fee overview', 'chart', '#/p/debtors'], ['Announcements', 'mega', '#/announcements']],
  admin: [['Community rooms and forums', 'people', '#/p/community'], ['PTA', 'people', '#/p/pta'], ['Weekly corner', 'mega', '#/p/weekly'], ['Student profiles', 'user', '#/p/profile'], ['Live classes', 'monitor', '#/p/live'], ['Payment portal', 'card', '#/p/pay'], ['Accounts and passwords', 'user', '#/accounts'], ['Upload results', 'award', '#/results-import'], ['Enter scores for a class', 'chart', '#/p/scoresheet'], ['Fee overview', 'chart', '#/p/debtors'], ['Announcements page', 'mega', '#/announcements'], ['School album page', 'image', '#/album']]
};

/* ---------- site settings in the page shell ---------- */
async function applySettings() {
  const s = await data.getSettings(true);
  const set = (id, fn) => { const e = $(id); if (e) fn(e); };
  set('#brandName', e => { e.textContent = s.schoolName; }); set('#topName', e => { e.textContent = s.schoolName; });
  set('#brandMotto', e => { e.textContent = s.motto; }); set('#brandAddr', e => { e.textContent = s.address; });
  set('#brandPhones', e => { e.innerHTML = s.phones.map(p => `<a href="tel:${esc(p.tel)}">${esc(p.label)}</a>`).join(' &middot; '); });
  set('#footName', e => { e.textContent = s.schoolName; });
  const root = document.documentElement.style;
  const [wm, hero, logo] = await Promise.all([data.fileSrc(s.watermark), data.fileSrc(s.heroImage), data.fileSrc(s.logo)]);
  wm ? root.setProperty('--wm', `url("${wm}")`) : root.removeProperty('--wm');
  hero ? root.setProperty('--hero', `url("${hero}")`) : root.removeProperty('--hero');
  const lg = $('#siteLogo'); if (lg) lg.src = logo || 'assets/logo.png';
  const first = $('#tabCall'); if (first && s.phones[0]) first.href = 'tel:' + s.phones[0].tel;
}
window.addEventListener('aac:settings', applySettings);
async function refreshBell() {
  const b = $('#bellBadge'); if (!b) return;
  try { const n = await pt.unreadCount(await data.getSession()); b.textContent = n > 9 ? '9+' : String(n); b.hidden = !n; $('#bellBtn').setAttribute('aria-label', n ? `Notifications: ${n} new ${n === 1 ? 'reply' : 'replies'}` : 'Notifications: no new replies'); } catch { /* ignore */ }
}
window.addEventListener('aac:replies', refreshBell); window.addEventListener('aac:login', refreshBell); window.addEventListener('hashchange', () => setTimeout(refreshBell, 300)); setInterval(refreshBell, 120000); setTimeout(refreshBell, 500);

/* ---------- views ---------- */
async function contactBlock() {
  const s = await data.getSettings();
  return `<div class="mobile-contact"><div class="contact-row">${ic('phone')}<span>${s.phones.map(p => `<a href="tel:${esc(p.tel)}">${esc(p.label)}</a>`).join(' &middot; ')}</span></div>
  <div class="contact-row">${ic('pin')}<span>${esc(s.address)}</span></div></div>`;
}

async function vHome() {
  const [s, sPhones] = [await data.getSettings(), null];
  const portals = Object.entries(ROLES).map(([k, r]) => `<a class="portal" href="#/login/${k}"><span class="ico">${ic(r.icon)}</span><span><b>${r.label} portal</b><small>${r.sub}</small></span></a>`).join('');
  const quick = [['#/apply', 'form', 'Apply for admission'], ['#/result', 'award', 'Check result'], ['#/login/payment', 'card', 'Pay school fees'], ['#/login/student', 'cap', 'Student portal'], ['#/album', 'image', 'School album'], ['#/feedback', 'mail', 'Contact us']]
    .map(([h, i, t]) => `<a class="qtile" href="${h}">${ic(i)}<span>${t}</span></a>`).join('');
  const ann = await pt.annCarousel(null);
  const lead = pt.leadershipCards(s); const tst = await pt.testimonialsStrip(3); const hon = await pt.honoursStrip(3);
  return { title: 'Home', nav: 'home', wide: true, html: `
    <section class="hero" aria-label="Welcome">
      <div class="hero-text"><p class="eyebrow">Admissions open · 2026/2027</p><h1>${esc(s.welcomeTitle)}</h1><p>${esc(s.motto)}. Creche, Nursery, Primary, Junior and Senior Secondary in Apete, Ibadan.</p>
        <div class="hero-cta"><a class="btn" href="#/apply">Apply for admission</a><a class="btn btn-ghost" href="#/login/student">Sign in to a portal</a></div></div>
      <div class="hero-pic" role="img" aria-label="Students of the school"><div class="float f2"><small>Classes</small><b>Creche to SSS 3</b></div><div class="float f1"><small>Learning, character and self reliance</small><b>Wisdom and Knowledge</b></div></div>
    </section>
    <nav class="quick" aria-label="Quick actions">${quick}</nav>
    ${ann ? `<section class="sect"><div class="sect-h"><h2>News and announcements</h2><a class="link" href="#/announcements">See all</a></div>${ann}</section>` : ''}
    <section class="sect"><div class="sect-h"><h2>Choose your portal</h2></div><div class="portals">${portals}</div></section>
    <section class="sect"><div class="sect-h"><h2>Life at ${esc(s.schoolName)}</h2><a class="link" href="#/album">Open the album</a></div>${await pt.albumCarousel()}
      <div class="split" style="margin-top:16px"><a class="action action-feedback" href="#/about">${ic('cap')}<b>About the school</b><span>Classes, subjects, teachers, facilities, activities and organogram</span></a>
      <a class="action action-feedback" href="#/feedback">${ic('mail')}<b>Enquiry, complaint or suggestion?</b><span>Open to everyone. Write to the school.</span></a></div></section>
    <section class="sect"><div class="sect-h"><h2>Activities</h2></div><div class="portals">${ACTIVITIES.map(k => `<a class="portal" href="#/activity/${pt.actSlug(k)}"><span class="ico">${ic('cal')}</span><span><b>${k}</b><small>See more</small></span></a>`).join('')}</div></section>
    ${hon ? `<section class="sect"><div class="sect-h"><h2>Celebrants and honours</h2><a class="link" href="#/celebrations">See all</a></div>${hon}</section>` : ''}
    ${tst ? `<section class="sect"><div class="sect-h"><h2>What alumni and parents say</h2><a class="link" href="#/testimonials">See all and share yours</a></div>${tst}</section>` : ''}
    ${lead ? `<section class="sect">${lead}</section>` : ''}
    <section class="sect">${await pt.prefectsStrip()}${await contactBlock()}</section>`,
    bind() { $$('.carousel', view).forEach(c => pt.bindCarousel(c.parentElement)); } };
}

function vLogin(role) {
  const r = ROLES[role]; if (!r) return vHome();
  const tabs = Object.entries(ROLES).map(([k, x]) => `<a href="#/login/${k}" ${k === role ? 'aria-current="page"' : ''}>${x.label}</a>`).join('');
  return { title: r.label + ' sign in', nav: 'home', html: `
    <a class="back" href="#/">${ic('back')} All portals</a>
    <p class="eyebrow">Secure sign in</p><h1 class="h1">${r.label} portal</h1>
    <div class="roles" role="navigation" aria-label="Switch portal">${tabs}</div>
    <form class="card" id="loginForm" novalidate style="margin-top:14px">
      ${field({ id: 'identifier', label: r.idLabel, hint: r.idHint, extra: 'autocomplete="username" autocapitalize="none" spellcheck="false"' })}
      <div class="field" data-field="password"><label for="password">Password</label>
        <div class="pw"><input class="input" id="password" name="password" type="password" required autocomplete="current-password" aria-describedby="password-e"><button type="button" id="pwToggle" aria-pressed="false">Show</button></div>
        <span class="error" id="password-e" role="alert"></span></div>
      <div id="loginErr" class="error" role="alert" style="margin-top:12px"></div>
      <button class="btn btn-block" style="margin-top:18px" type="submit">Sign in ${ic('arrow')}</button>
      <div class="row-between" style="margin-top:16px"><span class="hint">Forgot your password? Call the school office.</span></div>
    </form>
    <p class="hint" style="margin-top:16px">New family? <a class="link" href="#/apply">Apply for admission</a></p>`,
    bind() {
      $('#pwToggle').onclick = e => showPw(e.currentTarget);
      $('#loginForm').onsubmit = async e => {
        e.preventDefault(); const f = e.currentTarget; if (!validate(f)) return;
        const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
        const res = await data.signIn(r.db, f.identifier.value, f.password.value);
        btn.disabled = false;
        if (!res.ok) { $('#loginErr').textContent = res.message; return; }
        window.dispatchEvent(new Event('aac:login')); location.hash = role === 'payment' ? '#/p/pay' : '#/dashboard';
      };
    } };
}

async function vDashboard(s) {
  if (s && s.role === 'admin') { try { const k = 'aac.bdsync'; const t = new Date().toISOString().slice(0, 10); if (localStorage.getItem(k) !== t) { localStorage.setItem(k, t); data.syncBirthdays().catch(() => {}); } } catch { /* ignore */ } }
  const role = s.role === 'payment' ? 'parent' : s.role;
  const mine = (TILES[role] || []).slice(); let tiles = mine;
  if (role === 'admin') tiles = [...hubTiles(s).map(t => [t[0], t[1], t[2]]), ...mine];
  else if (role === 'teacher') tiles = [...hubTiles(s), ...mine];
  else if (role === 'bursar') tiles = [...hubTiles(s), ...mine];
  const html = tiles.map(([n, i, href]) => href ? `<a class="tile" href="${href}">${ic(i)}<b>${esc(n)}</b><small>Open</small></a>`
    : `<div class="tile" aria-disabled="true">${ic(i)}<b>${esc(n)}</b><small><span class="pill">Coming soon</span></small></div>`).join('');
  const anns = (await pt.announcementsFor(s, 3));
  const showPrefects = ['student', 'parent', 'teacher', 'admin'].includes(role);
  return { title: 'Dashboard', nav: 'home', html: `
    ${await pt.albumCarousel()}
    <p class="eyebrow" style="margin-top:18px">${esc(role)} portal</p><h1 class="h1">Welcome, ${esc(s.name)}</h1>
    ${(await pt.announcementsFor(s)).filter(a => a.mandatory).slice(0, 2).map(a => `<div class="mand"><b>${ic('mega')} Mandatory notice: ${esc(a.title)}</b><p>${esc(a.body)}</p></div>`).join('')}
    <div class="tiles" style="margin-top:20px">${html}</div>
    ${anns.length ? `<section style="margin-top:28px"><div class="row-between"><h2 class="h2s">${ic('mega')} Latest announcements</h2><a class="link" href="#/announcements">See all</a></div><div class="anns">${anns.map(pt.annCard).join('')}</div></section>` : ''}
    ${showPrefects ? await pt.prefectsStrip() : ''}
    <button class="btn btn-ghost" id="out" style="margin-top:26px" type="button">${ic('out')} Sign out</button>`,
    bind() { pt.bindCarousel(view); $('#out').onclick = async () => { await data.signOut(); location.hash = '#/'; window.dispatchEvent(new Event('aac:login')); }; } };
}

/* ---- application form ---- */
let appState = {}; let appStep = 1;
const STEPS = ['Child', 'Parent', 'Review'];
function stepper() { return `<ol class="steps" aria-label="Progress">${STEPS.map((s, i) => `<li class="${i + 1 === appStep ? 'on' : i + 1 < appStep ? 'done' : ''}" ${i + 1 === appStep ? 'aria-current="step"' : ''}>${i + 1}. ${s}</li>`).join('')}</ol>`; }

function vApply() {
  const v = appState; const today = todayStr();
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
  $('#view').innerHTML = `<div class="ok-box"><p class="eyebrow" style="color:var(--ok)">Application received</p>
    <h1 class="h1">Thank you, ${esc(a.guardianName.split(' ')[0])}</h1>
    <p>Your reference number for ${esc(a.firstName)} ${esc(a.surname)} (${esc(a.classApplied)}):</p>
    <div class="refno" id="ref">${esc(a.ref)}</div>
    <p class="hint" style="color:var(--ink)">Our admin office will call ${esc(a.phone)}. Keep this number. The entrance examination needs the school form, which you can get at the school or admin office, so bring this reference with you.</p></div>
    <div class="row-between noprint" style="margin-top:18px;justify-content:flex-start;gap:10px"><button class="btn btn-navy" id="copy" type="button">Copy reference</button>
    <button class="btn btn-ghost" id="print" type="button">Print</button><a class="btn btn-ghost" href="#/">Done</a></div>`;
  $('#copy').onclick = async () => { try { await navigator.clipboard.writeText(a.ref); toast('Reference copied'); } catch { toast('Copy failed. Write the number down.'); } };
  $('#print').onclick = () => window.print();
  $('#view').focus(); window.scrollTo(0, 0);
}

/* ---- result ---- */
function vResult() {
  const terms = TERMS;
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
let token = 0;
async function render() {
  const my = ++token;
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const [route = '', a, b] = parts;
  const s = await data.getSession();
  const need = () => { location.hash = '#/login/student'; return null; };
  let v;
  try {
    if (route === 'login') v = vLogin(a);
    else if (route === 'dashboard') v = s ? await vDashboard(s) : need();
    else if (route === 'manage') v = s ? await vManage(a, b, s) : need();
    else if (route === 'p') {
      if (!s) v = need();
      else if (a === 'curriculum') v = await pt.vCurriculum(s);
      else if (a === 'notes') v = await pt.vNotes(s);
      else if (a === 'profile') v = await pt.vProfile(s, b);
      else if (a === 'community') v = await pt.vCommunity(s);
      else if (a === 'pta') v = await pt.vPTA(s);
      else if (a === 'weekly') v = await pt.vWeekly(s);
      else if (a === 'live') v = await pt.vLive(s);
      else if (a === 'practice') v = await pt.vPractice(s);
      else if (a === 'notebooks') v = await pt.vNotebooks(s);
      else if (a === 'assignments') v = await pt.vAssignments(s);
      else if (a === 'tests') v = await pt.vTests(s);
      else if (a === 'scorecard') v = await pt.vScorecard(s);
      else if (a === 'scoresheet') v = ['admin', 'teacher'].includes(s.role) ? await pt.vScoreSheet(s) : null;
      else if (a === 'pay') v = ['admin', 'bursar'].includes(s.role) ? await pt.vPayHub(s) : await pt.vFees(s);
      else if (a === 'library') v = await pt.vLibrary(s);
      else if (a === 'fees') v = await pt.vFees(s);
      else if (a === 'debtors') v = ['admin', 'bursar'].includes(s.role) ? await pt.vDebtors(s) : null;
    }
    else if (route === 'pta-room') v = s ? await pt.vPtaRoom(a, s) : need();
    else if (route === 'live') v = s ? await pt.vLiveRoom(a, s) : need();
    else if (route === 'room') v = s ? await pt.vRoom(a, s) : need();
    else if (route === 'celebrations') v = await pt.vCelebrations();
    else if (route === 'alerts') v = await pt.vAlerts(s);
    else if (route === 'testimonials') v = await pt.vTestimonials();
    else if (route === 'activity') v = await pt.vActivity(a);
    else if (route === 'receipt') v = s ? await pt.vReceipt(a) : need();
    else if (route === 'results-import') v = s && s.role === 'admin' ? await pt.vResultsImport() : need();
    else if (route === 'about') v = await pt.vAbout();
    else if (route === 'accounts') v = s && s.role === 'admin' ? await pt.vAccounts() : need();
    else if (route === 'announcements') v = await pt.vAnnouncements(s);
    else if (route === 'album') v = await pt.vAlbum();
    else if (route === 'feedback') v = pt.vFeedback();
    else if (route === 'replies') v = await pt.vReplies();
    else if (route === 'more') v = pt.vMore(s, (await data.getSettings()).phones);
    else if (route === 'apply') v = vApply();
    else if (route === 'result') v = vResult();
    else v = await vHome();
  } catch (e) { console.error(e); v = { title: 'Error', nav: 'home', html: '<h1 class="h1">Something went wrong</h1><p class="lead">Please refresh the page. If it keeps happening, call the school office.</p>' }; }
  if (my !== token) return;
  if (!v) { if (location.hash.startsWith('#/login')) return; view.innerHTML = '<h1 class="h1">Not available</h1><p class="lead">You do not have access to this page.</p><p><a class="btn" href="#/dashboard">Back</a></p>'; return; }
  document.body.classList.toggle('wide', !!v.wide); document.body.classList.remove('menu-open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  view.innerHTML = v.html; document.title = `${v.title} | ${(await data.getSettings()).schoolName}`;
  $$('[data-nav]').forEach(x => { if (x.dataset.nav === v.nav) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
  const acct = s ? ['#/dashboard', 'Dashboard'] : ['#/', 'Portals'];
  $$('[data-nav="home"]').forEach(x => { x.href = acct[0]; const sp = x.querySelector('span') || x; if (x.classList.contains('t')) sp.textContent = acct[1]; });
  if (v.bind) v.bind();
  await data.hydrate(view);
  if (my !== token) return;
  window.scrollTo(0, 0); view.focus({ preventScroll: true });
}
window.addEventListener('hashchange', render);

/* ---------- demo banner, install, service worker ---------- */
if (!data.isLive) {
  const b = $('#demoBanner'); b.hidden = false;
  b.innerHTML = '<b>Demo mode.</b> Nothing is saved on a server. Demo sign in for any portal: <b>demo</b> / <b>demo1234</b>. Sample result: PIN <b>AAC-DEMO-2026</b>, reg. no. <b>AAC/DEMO/001</b>.';
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
$('#menuBtn').onclick = e => { const o = document.body.classList.toggle('menu-open'); e.currentTarget.setAttribute('aria-expanded', String(o)); };
const closeDD = except => $$('.dd.open').forEach(d => { if (d !== except) { d.classList.remove('open'); $('.dd-btn', d).setAttribute('aria-expanded', 'false'); } });
$$('.dd-btn').forEach(b => b.onclick = e => { e.stopPropagation(); const d = b.parentElement; closeDD(d); const o = d.classList.toggle('open'); b.setAttribute('aria-expanded', String(o)); });
document.addEventListener('click', e => { if (!e.target.closest('.dd')) closeDD(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDD(); });
$$('.dd-menu a, .topnav>a').forEach(a => a.addEventListener('click', () => { closeDD(); document.body.classList.remove('menu-open'); }));
applySettings(); mountChat(); render();
