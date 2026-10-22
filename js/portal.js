// Portal screens: announcements, prefects, album, feedback box, curriculum, lesson notes, library, fees, debtors, receipts, results upload.
import * as data from './data.js';
import { POSITIONS, FEE_CATEGORIES } from './schema.js';
import { $, $$, esc, ic, opt, field, selectField, validate, toast, money, fmtDate, norm, CLASSES, CLASS_GROUPS, TERMS, download, toCsv, csvParse } from './ui.js';

const AUD_OF = { student: 'students', parent: 'parents', teacher: 'teachers' };
export const myAud = s => (s ? AUD_OF[s.role] : null);
async function myStudents(s) {
  if (!s) return [];
  const all = await data.list('students'); const regs = (s.regs || []).map(norm);
  return all.filter(x => regs.includes(norm(x.reg_no)));
}
const initials = n => String(n || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

/* ---------- prefects ---------- */
export async function prefectsStrip(title = 'School prefects') {
  const ps = (await data.list('prefects')).sort((a, b) => POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position));
  if (!ps.length) return '';
  return `<section class="prefects" aria-label="${title}"><h2 class="h2s">${ic('star')} ${title}</h2><ul class="pf-row">${ps.map(p => `<li class="pf">
    ${p.photo ? `<img class="pf-img" ${data.fileAttr(p.photo, 'src')} alt="${esc(p.name)}" loading="lazy">` : `<span class="pf-img pf-ini" aria-hidden="true">${esc(initials(p.name))}</span>`}
    <b>${esc(p.name)}</b><span class="pf-pos">${esc(p.position)}</span>${p.class ? `<small>${esc(p.class)}</small>` : ''}</li>`).join('')}</ul></section>`;
}

/* ---------- announcements ---------- */
export async function announcementsFor(s, limit) {
  const aud = myAud(s);
  let a = (await data.list('announcements')).filter(x => s && s.role === 'admin' ? true : (x.audience || 'all') === 'all' || x.audience === aud);
  a.sort((x, y) => (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0) || String(y.date || '').localeCompare(String(x.date || '')));
  return limit ? a.slice(0, limit) : a;
}
export const annCard = a => `<article class="ann ${a.pinned ? 'ann-pin' : ''}"><div class="ann-meta">${a.pinned ? '<span class="pill">Pinned</span> ' : ''}<span>${fmtDate(a.date)}</span></div>
  <h3>${esc(a.title)}</h3><p>${esc(a.body)}</p>${a.file ? `<a class="link" ${data.fileAttr(a.file)} target="_blank" rel="noopener">${ic('file')} ${esc(a.file.name || 'Attachment')}</a>` : ''}</article>`;

export async function vAnnouncements(s) {
  const list = await announcementsFor(s);
  return { title: 'Announcements', nav: 'more', html: `<p class="eyebrow">School news</p><h1 class="h1">Announcements</h1>
    <div class="anns" style="margin-top:20px">${list.length ? list.map(annCard).join('') : '<p class="hint">No announcements right now.</p>'}</div>${await prefectsStrip()}` };
}

/* ---------- album + carousel ---------- */
export async function albumCarousel() {
  let al = (await data.list('album')).filter(x => x.image);
  const f = al.filter(x => x.featured); al = (f.length ? f : al).slice(0, 8);
  if (!al.length) return '';
  return `<section class="carousel" aria-roledescription="carousel" aria-label="School album">
    <div class="slides" tabindex="0">${al.map((p, i) => `<figure class="slide" aria-roledescription="slide" aria-label="${i + 1} of ${al.length}"><img ${data.fileAttr(p.image, 'src')} alt="${esc(p.caption || p.title)}" ${i ? 'loading="lazy"' : ''}>
      <figcaption><b>${esc(p.title)}</b>${p.caption ? `<span>${esc(p.caption)}</span>` : ''}</figcaption></figure>`).join('')}</div>
    ${al.length > 1 ? `<button class="cbtn cprev" type="button" aria-label="Previous photo">${ic('left')}</button><button class="cbtn cnext" type="button" aria-label="Next photo">${ic('right')}</button>
    <div class="dots">${al.map((_, i) => `<span class="dot ${i ? '' : 'on'}"></span>`).join('')}</div>` : ''}</section>`;
}
export function bindCarousel(root = document) {
  const c = $('.carousel', root); if (!c) return; const sl = $('.slides', c); const dots = $$('.dot', c); const n = dots.length;
  const go = i => sl.scrollTo({ left: sl.clientWidth * ((i + n) % n), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const cur = () => Math.round(sl.scrollLeft / sl.clientWidth);
  sl.addEventListener('scroll', () => dots.forEach((d, i) => d.classList.toggle('on', i === cur())), { passive: true });
  const p = $('.cprev', c), nx = $('.cnext', c); if (p) p.onclick = () => go(cur() - 1); if (nx) nx.onclick = () => go(cur() + 1);
  if (n > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let paused = false; ['mouseenter', 'focusin', 'touchstart'].forEach(e => c.addEventListener(e, () => { paused = true; })); ['mouseleave', 'focusout'].forEach(e => c.addEventListener(e, () => { paused = false; }));
    const t = setInterval(() => { if (!document.body.contains(c)) return clearInterval(t); if (!paused) go(cur() + 1); }, 5000);
  }
}

export async function vAlbum() {
  const al = (await data.list('album')).filter(x => x.image).sort((a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || '')));
  const cats = [...new Set(al.map(a => a.category))];
  return { title: 'School album', nav: 'more', html: `<p class="eyebrow">Gallery</p><h1 class="h1">School album</h1>
    ${cats.length > 1 ? `<div class="roles" id="albumCats"><a href="#/album" data-cat="" aria-current="page">All</a>${cats.map(c => `<a href="#/album" data-cat="${esc(c)}">${esc(c)}</a>`).join('')}</div>` : ''}
    <div class="gallery" id="gallery">${al.map(p => `<button class="gitem" type="button" data-cat="${esc(p.category)}" data-i="${esc(p.id)}"><img ${data.fileAttr(p.image, 'src')} alt="${esc(p.caption || p.title)}" loading="lazy"><span>${esc(p.title)}</span></button>`).join('') || '<p class="hint">No photos yet.</p>'}</div>
    <dialog id="lb" class="lb"><button class="lb-x" type="button" aria-label="Close">${ic('close')}</button><img id="lbImg" alt=""><p id="lbCap"></p></dialog>`,
    bind() {
      $$('#albumCats a').forEach(a => a.onclick = e => { e.preventDefault(); $$('#albumCats a').forEach(x => x.removeAttribute('aria-current')); a.setAttribute('aria-current', 'page'); $$('.gitem').forEach(g => { g.hidden = a.dataset.cat && g.dataset.cat !== a.dataset.cat; }); });
      const lb = $('#lb');
      $$('.gitem').forEach(g => g.onclick = () => { const im = $('img', g); $('#lbImg').src = im.src; $('#lbImg').alt = im.alt; $('#lbCap').textContent = im.alt; lb.showModal(); });
      $('.lb-x').onclick = () => lb.close(); lb.onclick = e => { if (e.target === lb) lb.close(); };
    } };
}

/* ---------- feedback box ---------- */
const FB = [['Enquiry', 'Ask us something'], ['Complaint', 'Tell us what went wrong'], ['Feedback', 'Share your experience'], ['Suggestion', 'Help us improve']];
export function vFeedback() {
  return { title: 'Feedback box', nav: 'more', html: `<p class="eyebrow">We are listening</p><h1 class="h1">Enquiry, complaint, feedback or suggestion</h1>
    <p class="lead">Anyone can write to us. Leave a phone number or email if you want a reply.</p>
    <form class="card" id="fbForm" novalidate style="margin-top:20px"><fieldset class="fs"><legend class="legend">What is this about?</legend>
      <div class="fbtypes">${FB.map(([t, d], i) => `<label class="fbtype"><input type="radio" name="type" value="${t}" ${i === 0 ? 'checked' : ''}><span><b>${t}</b><small>${d}</small></span></label>`).join('')}</div></fieldset>
      ${field({ id: 'name', label: 'Your name', required: false, opt: true, extra: 'autocomplete="name"' })}
      ${field({ id: 'contact', label: 'Phone or email', required: false, opt: true, extra: 'autocomplete="tel"' })}
      <div class="field" data-field="message"><label for="message">Your message</label><textarea class="input" id="message" name="message" required minlength="10" data-msg="Please write at least 10 characters" aria-describedby="message-e" style="min-height:140px"></textarea><span class="error" id="message-e" role="alert"></span></div>
      <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <div id="fbErr" class="error" role="alert" style="margin-top:12px"></div><button class="btn btn-block" style="margin-top:18px" type="submit">Send message</button></form>`,
    bind() {
      $('#fbForm').onsubmit = async e => {
        e.preventDefault(); const f = e.currentTarget; if (!validate(f)) return;
        const btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending…';
        if (f.website.value) { $('#view').innerHTML = '<p>Thank you.</p>'; return; }
        const ref = data.newRef('FB');
        try {
          await data.submitPublic('feedback', { type: f.type.value, name: f.name.value.trim(), contact: f.contact.value.trim(), message: f.message.value.trim(), status: 'New', ref });
          $('#view').innerHTML = `<div class="ok-box"><p class="eyebrow" style="color:var(--ok)">Message received</p><h1 class="h1">Thank you</h1><p>Your reference: <b>${esc(ref)}</b></p><p class="hint" style="color:var(--ink)">The school management will read it. If you left a phone number or email, we may contact you.</p></div><p><a class="btn btn-ghost" href="#/">Back to home</a></p>`;
        } catch { btn.disabled = false; btn.textContent = 'Send message'; $('#fbErr').textContent = 'Could not send. Please try again or call the school.'; }
      };
    } };
}

/* ---------- more ---------- */
export function vMore(s, phones) {
  const L = (h, i, t, d) => `<a class="portal" href="${h}"><span class="ico">${ic(i)}</span><span><b>${t}</b><small>${d}</small></span></a>`;
  return { title: 'More', nav: 'more', html: `<p class="eyebrow">Menu</p><h1 class="h1">More</h1><div class="portals">
    ${L('#/announcements', 'mega', 'Announcements', 'School news and notices')}${L('#/album', 'image', 'School album', 'Photos from school life')}
    ${L('#/feedback', 'mail', 'Feedback box', 'Enquiry, complaint, suggestion')}${s ? L('#/dashboard', 'grid', 'My dashboard', 'Back to your portal') : L('#/', 'grid', 'Sign in', 'Choose your portal')}
    ${phones.map(p => L('tel:' + p.tel, 'phone', 'Call ' + p.label, 'School office')).join('')}</div>` };
}

/* ---------- curriculum + lesson notes (read) ---------- */
function classSelect(id, cur) { return `<select class="input" id="${id}" style="max-width:260px">${CLASS_GROUPS.map(([g, l]) => `<optgroup label="${g}">${l.map(c => opt(c, cur)).join('')}</optgroup>`).join('')}</select>`; }
const fileLink = f => f ? `<a class="link" ${data.fileAttr(f)} target="_blank" rel="noopener">${ic('file')} ${esc(f.name || 'File')}</a>` : '';

export async function vCurriculum(s) {
  const mine = await myStudents(s); const all = await data.list('curriculum'); const start = (mine[0] && mine[0].class) || 'JSS 1';
  const draw = cls => { const r = all.filter(x => x.class === cls).sort((a, b) => String(a.subject).localeCompare(String(b.subject)));
    return r.length ? r.map(c => `<article class="card cur"><div class="row-between"><h3>${esc(c.subject)}</h3><span class="pill pill-blue">${esc(c.term)}</span></div>
      <ol>${String(c.topics || '').split('\n').filter(x => x.trim()).map(t => `<li>${esc(t)}</li>`).join('')}</ol>${fileLink(c.file)}</article>`).join('') : `<p class="hint">No curriculum has been added for ${esc(cls)} yet.</p>`; };
  return { title: 'Curriculum', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Learning plan</p><h1 class="h1">Curriculum</h1>
    <div class="field" style="max-width:260px"><label for="cls">Class level</label>${classSelect('cls', start)}</div><div class="curlist" id="cl" style="margin-top:14px">${draw(start)}</div>`,
    bind() { $('#cls').onchange = e => { $('#cl').innerHTML = draw(e.target.value); data.hydrate($('#cl')); }; } };
}
export async function vNotes(s) {
  const mine = await myStudents(s); const all = (await data.list('lessonNotes')).sort((a, b) => String(b._created).localeCompare(String(a._created))); const start = (mine[0] && mine[0].class) || 'JSS 1';
  const draw = (cls, q) => { const r = all.filter(x => x.class === cls && (!q || (x.subject + x.title + x.body).toLowerCase().includes(q.toLowerCase())));
    return r.length ? r.map(n => `<details class="card note"><summary><b>${esc(n.title)}</b><span>${esc(n.subject)}${n.week ? ' · ' + esc(n.week) : ''}</span></summary>
      <div class="note-body">${esc(n.body)}</div>${fileLink(n.file)}<p class="hint">${esc(n.teacherName || '')} ${n._created ? '· ' + fmtDate(n._created) : ''}</p></details>`).join('') : '<p class="hint">No lesson notes found.</p>'; };
  return { title: 'Lesson notes', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Class notes</p><h1 class="h1">Lesson notes</h1>
    <div class="grid2"><div class="field"><label for="cls">Class level</label>${classSelect('cls', start)}</div><div class="field"><label for="nq">Search</label><input class="input" id="nq" type="search" placeholder="Subject or topic"></div></div>
    <div id="nl" style="margin-top:14px">${draw(start, '')}</div>`,
    bind() { const up = () => { $('#nl').innerHTML = draw($('#cls').value, $('#nq').value); data.hydrate($('#nl')); }; $('#cls').onchange = up; $('#nq').oninput = up; } };
}

/* ---------- library ---------- */
export async function vLibrary(s) {
  const aud = myAud(s); let files = await data.list('files');
  files = files.filter(f => s && s.role === 'admin' ? true : f.audience === 'all' || f.audience === aud);
  const cats = [...new Set(files.map(f => f.category))];
  return { title: 'Library', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Resources</p><h1 class="h1">Library and files</h1>
    ${cats.length > 1 ? `<div class="roles" id="lcats"><a href="#/p/library" data-cat="" aria-current="page">All</a>${cats.map(c => `<a href="#/p/library" data-cat="${esc(c)}">${esc(c)}</a>`).join('')}</div>` : ''}
    <div class="curlist" style="margin-top:14px">${files.map(f => `<article class="card cur" data-cat="${esc(f.category)}"><div class="row-between"><h3>${esc(f.title)}</h3><span class="pill pill-blue">${esc(f.category)}</span></div>
      ${f.description ? `<p>${esc(f.description)}</p>` : ''}${f.file ? `<a class="btn btn-ghost btn-sm" ${data.fileAttr(f.file)} target="_blank" rel="noopener" style="margin-top:12px">${ic('download')} Open ${esc(f.file.name || 'file')}</a>` : ''}</article>`).join('') || '<p class="hint">Nothing has been uploaded yet.</p>'}</div>`,
    bind() { $$('#lcats a').forEach(a => a.onclick = e => { e.preventDefault(); $$('#lcats a').forEach(x => x.removeAttribute('aria-current')); a.setAttribute('aria-current', 'page'); $$('.curlist .card').forEach(c => { c.hidden = a.dataset.cat && c.dataset.cat !== a.dataset.cat; }); }); } };
}

/* ---------- fees ---------- */
const stPill = s => `<span class="pill ${s === 'Paid' ? 'pill-ok' : s === 'Part paid' ? '' : 'pill-red'}">${s}</span>`;
export async function vFees(s) {
  const [students, fees, payments, set] = await Promise.all([myStudents(s), data.list('fees'), data.list('payments'), data.getSettings()]);
  const bank = set.accountNumber ? `<div class="card bank"><h3>How to pay</h3><dl><dt>Bank</dt><dd>${esc(set.bankName)}</dd><dt>Account name</dt><dd>${esc(set.accountName)}</dd><dt>Account number</dt><dd><b>${esc(set.accountNumber)}</b></dd></dl>
    <p class="hint">After paying, show your teller or transfer slip to the bursar so your payment is recorded and a receipt issued.</p>${set.feeNote ? `<p>${esc(set.feeNote)}</p>` : ''}</div>` : (set.feeNote ? `<div class="card"><p>${esc(set.feeNote)}</p></div>` : '');
  const blocks = students.map(st => {
    const lines = data.feeLines(st, fees, payments); const due = lines.reduce((a, l) => a + Number(l.fee.amount), 0), paid = lines.reduce((a, l) => a + l.paid, 0);
    const sec = FEE_CATEGORIES.map(cat => { const L = lines.filter(l => l.fee.category === cat); if (!L.length) return '';
      return `<h3 class="fsec">${cat}</h3><div class="tbl-wrap"><table><thead><tr><th>Item</th><th class="n">Amount</th><th class="n">Paid</th><th class="n">Balance</th><th>Status</th></tr></thead><tbody>${L.map(l => `<tr><td>${esc(l.fee.title)}<br><small class="hint">${esc([l.fee.term, l.fee.due ? 'Due ' + fmtDate(l.fee.due) : ''].filter(Boolean).join(' · '))}</small></td><td class="n">${money(l.fee.amount)}</td><td class="n">${money(l.paid)}</td><td class="n"><b>${money(l.balance)}</b></td><td>${stPill(l.status)}</td></tr>`).join('')}</tbody></table></div>`; }).join('');
    const pays = payments.filter(p => p.regNo === st.reg_no).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return `<section class="card" style="margin-top:18px"><div class="row-between"><div><h2 style="font-size:20px">${esc(st.name)}</h2><span class="hint">${esc(st.reg_no)} · ${esc(st.class)}</span></div></div>
      <div class="sum"><div><small>Total fees</small><b>${money(due)}</b></div><div><small>Paid</small><b>${money(paid)}</b></div><div><small>Balance</small><b>${money(due - paid)}</b></div></div>
      ${sec || '<p class="hint">No fees have been set for this class yet.</p>'}
      ${pays.length ? `<h3 class="fsec">Payments made</h3><ul class="mlist">${pays.map(p => `<li class="mrow"><div class="mrow-main"><b>${money(p.amount)}</b><span>${fmtDate(p.date)} · ${esc(p.method)} · ${esc(p.receipt)}</span></div><div class="mrow-actions"><a class="btn btn-ghost btn-sm" href="#/receipt/${encodeURIComponent(p.id)}">Receipt</a></div></li>`).join('')}</ul>` : ''}</section>`; }).join('');
  return { title: 'Fees and payments', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Fees</p><h1 class="h1">Fees and payments</h1>
    <p class="lead">School fee, textbooks and exercise books, uniforms and any other payment the school requests.</p>${blocks || '<div class="card" style="margin-top:18px"><p>No student is linked to this account yet. Please call the school office.</p></div>'}<div style="margin-top:18px">${bank}</div>` };
}

export async function vDebtors() {
  const [students, fees, payments] = await Promise.all([data.list('students'), data.list('fees'), data.list('payments')]);
  const rows = students.map(st => { const L = data.feeLines(st, fees, payments); const due = L.reduce((a, l) => a + Number(l.fee.amount), 0), paid = L.reduce((a, l) => a + l.paid, 0); return { st, due, paid, bal: due - paid }; });
  const draw = cls => { const r = rows.filter(x => !cls || x.st.class === cls).sort((a, b) => b.bal - a.bal);
    return { html: `<tbody>${r.map(x => `<tr><td>${esc(x.st.name)}<br><small class="hint">${esc(x.st.reg_no)}</small></td><td>${esc(x.st.class)}</td><td class="n">${money(x.due)}</td><td class="n">${money(x.paid)}</td><td class="n"><b>${money(x.bal)}</b></td></tr>`).join('') || '<tr><td colspan="5" class="hint">No students.</td></tr>'}</tbody>`, r }; };
  return { title: 'Fee overview', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Bursary</p><h1 class="h1">Fee overview and debtors</h1>
    <div class="row-between" style="margin:16px 0"><div class="field" style="margin:0"><label for="dc">Class</label><select class="input" id="dc" style="max-width:240px"><option value="">All classes</option>${CLASSES.map(c => opt(c, '')).join('')}</select></div><button class="btn btn-ghost btn-sm" id="dexp" type="button">${ic('download')} Export CSV</button></div>
    <div class="sum" id="dsum"></div><div class="card tbl-wrap" style="margin-top:14px"><table><thead><tr><th>Student</th><th>Class</th><th class="n">Due</th><th class="n">Paid</th><th class="n">Balance</th></tr></thead><tbody id="dbody"></tbody></table></div>`,
    bind() {
      const up = () => { const d = draw($('#dc').value); $('#dbody').outerHTML = `<tbody id="dbody">${d.html.slice(7, -8)}</tbody>`;
        const t = d.r.reduce((a, x) => [a[0] + x.due, a[1] + x.paid, a[2] + x.bal], [0, 0, 0]); $('#dsum').innerHTML = `<div><small>Total due</small><b>${money(t[0])}</b></div><div><small>Collected</small><b>${money(t[1])}</b></div><div><small>Outstanding</small><b>${money(t[2])}</b></div>`; };
      $('#dc').onchange = up; up();
      $('#dexp').onclick = () => download('fee-overview.csv', toCsv([['Name', 'Reg no', 'Class', 'Due', 'Paid', 'Balance'], ...draw($('#dc').value).r.map(x => [x.st.name, x.st.reg_no, x.st.class, x.due, x.paid, x.bal])]));
    } };
}

export async function vReceipt(id) {
  const p = (await data.list('payments')).find(x => x.id === id);
  if (!p) return { title: 'Receipt', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p>Receipt not found.</p>` };
  const [students, fees, set] = await Promise.all([data.list('students'), data.list('fees'), data.getSettings()]);
  const st = students.find(x => x.reg_no === p.regNo) || {}; const fee = fees.find(f => f.id === p.feeId) || {};
  return { title: 'Receipt', nav: 'home', html: `<a class="back noprint" href="#/dashboard">${ic('back')} Dashboard</a>
    <div class="card receipt" style="margin-top:12px"><div class="result-head"><div><p class="eyebrow" style="margin:0">Payment receipt</p><h1 style="font-size:24px;margin-top:6px">${esc(set.schoolName)}</h1><small class="hint">${esc(set.address)}</small></div><img src="assets/logo.png" alt="" width="64" height="57"></div>
    <div class="meta"><div><span>Receipt no.</span><b>${esc(p.receipt)}</b></div><div><span>Date</span><b>${fmtDate(p.date)}</b></div><div><span>Student</span><b>${esc(st.name || p.regNo)}</b></div><div><span>Reg. number / class</span><b>${esc(p.regNo)} · ${esc(st.class || '')}</b></div>
    <div><span>Payment for</span><b>${esc(fee.title || '')}</b></div><div><span>Section</span><b>${esc(fee.category || '')}</b></div><div><span>Method</span><b>${esc(p.method)}</b></div><div><span>Received by</span><b>${esc(p.enteredBy || '')}</b></div></div>
    <div class="sum"><div><small>Amount paid</small><b>${money(p.amount)}</b></div></div></div>
    <button class="btn btn-navy noprint" id="pr" style="margin-top:16px" type="button">${ic('print')} Print receipt</button>`,
    bind() { $('#pr').onclick = () => window.print(); } };
}

/* ---------- results upload (admin) ---------- */
export async function vResultsImport() {
  const TPL = 'reg_no,name,class,session,term,subject,ca,exam,remark\nAAC/2026/001,Ada Bello,JSS 2,2026/2027,First Term,Mathematics,27,61,A steady performance\nAAC/2026/001,Ada Bello,JSS 2,2026/2027,First Term,English Language,24,58,';
  return { title: 'Upload results', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Results</p><h1 class="h1">Upload results</h1>
    <p class="lead">Upload a spreadsheet saved as CSV. One row per student per subject. Each student gets an access PIN for result checking.</p>
    <div class="card" style="margin-top:18px"><ol class="steps2"><li>Download the template and fill it in Excel or Google Sheets.</li><li>Save as CSV and choose the file below.</li><li>Check the summary, then press Import.</li></ol>
    <button class="btn btn-ghost" id="tpl" type="button">${ic('download')} Download CSV template</button>
    <div class="field"><label for="csv">CSV file</label><input class="input" id="csv" type="file" accept=".csv,text/csv"></div><div id="prev" class="hint"></div><div id="rerr" class="error" role="alert"></div>
    <button class="btn" id="go" type="button" disabled style="margin-top:14px">Import results</button></div><div id="out"></div>`,
    bind() {
      let rows = [];
      $('#tpl').onclick = () => download('results-template.csv', TPL);
      $('#csv').onchange = async e => { const f = e.target.files[0]; $('#rerr').textContent = ''; if (!f) return;
        rows = csvParse(await f.text()); const need = ['reg_no', 'session', 'term', 'subject', 'ca', 'exam'];
        if (!rows.length || need.some(k => !(k in rows[0]))) { rows = []; $('#go').disabled = true; $('#rerr').textContent = 'This file does not match the template. Required columns: ' + need.join(', '); $('#prev').textContent = ''; return; }
        const ids = new Set(rows.map(r => norm(r.reg_no) + r.session + r.term)); $('#prev').textContent = `${rows.length} rows found for ${ids.size} result sheets.`; $('#go').disabled = false; };
      $('#go').onclick = async () => { const b = $('#go'); b.disabled = true; b.textContent = 'Importing…';
        try { const r = await data.importResults(rows);
          $('#out').innerHTML = `<div class="ok-box" style="margin-top:18px"><p class="eyebrow" style="color:var(--ok)">Import complete</p><p><b>${r.sheets}</b> result sheets saved${r.skipped ? `, ${r.skipped} rows skipped (missing or invalid values)` : ''}. <b>${r.newPins.length}</b> new PINs created.</p></div>
          ${r.newPins.length ? `<div class="card tbl-wrap" style="margin-top:14px"><table><thead><tr><th>Student</th><th>Reg. no</th><th>Term</th><th>PIN</th></tr></thead><tbody>${r.newPins.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.reg_no)}</td><td>${esc(p.term)} ${esc(p.session)}</td><td><b>${esc(p.pin)}</b></td></tr>`).join('')}</tbody></table></div>
          <div class="row-between noprint" style="margin-top:12px;justify-content:flex-start;gap:10px"><button class="btn btn-navy" id="pdl" type="button">${ic('download')} Download PINs (CSV)</button><button class="btn btn-ghost" id="ppr" type="button">${ic('print')} Print</button></div>` : ''}`;
          const pdl = $('#pdl'); if (pdl) { pdl.onclick = () => download('result-pins.csv', toCsv([['Name', 'Reg no', 'Session', 'Term', 'PIN'], ...r.newPins.map(p => [p.name, p.reg_no, p.session, p.term, p.pin])])); $('#ppr').onclick = () => window.print(); }
          b.textContent = 'Import results';
        } catch (e) { $('#rerr').textContent = e.message; b.disabled = false; b.textContent = 'Import results'; } };
    } };
}

/* ---------- public school info page ---------- */
const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
export async function vAbout() {
  const [s, staff] = await Promise.all([data.getSettings(), data.list('staff')]);
  const order = r => /found/i.test(r.role) ? 0 : /proprie/i.test(r.role) ? 1 : /head|princip/i.test(r.role) ? 2 : 3;
  staff.sort((a, b) => order(a) - order(b) || String(a.name).localeCompare(b.name));
  const li = a => `<ul class="chk">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  return { title: 'About the school', nav: 'about', html: `${await albumCarousel()}
    <p class="eyebrow">About us</p><h1 class="h1">${esc(s.schoolName)}</h1><p class="lead">${esc(s.motto)}</p>
    <p style="max-width:62ch;margin-top:14px">${esc(s.aboutText)}</p>
    <div class="row-between" style="justify-content:flex-start;gap:10px;margin-top:18px"><a class="btn" href="#/apply">Apply for admission</a><a class="btn btn-ghost" href="#/feedback">Ask a question</a></div>
    <section class="infoblock"><h2 class="h2s">${ic('cap')} Classes</h2><div class="cgrid">${CLASS_GROUPS.map(([g, l]) => `<div class="card"><b>${g}</b><p class="hint" style="margin:6px 0 0">${l.join(', ')}</p></div>`).join('')}</div></section>
    <section class="infoblock"><h2 class="h2s">${ic('book')} Subjects and courses</h2>${li(lines(s.subjectsText))}</section>
    <section class="infoblock"><h2 class="h2s">${ic('room')} Facilities</h2>${li(lines(s.facilitiesText))}</section>
    <section class="infoblock"><h2 class="h2s">${ic('cal')} Activities</h2>${li(lines(s.activitiesText))}</section>
    ${staff.length ? `<section class="infoblock"><h2 class="h2s">${ic('people')} Our leadership and teachers</h2><ul class="pf-row" style="flex-wrap:wrap">${staff.map(p => `<li class="pf" style="flex:0 0 150px">${p.photo ? `<img class="pf-img" ${data.fileAttr(p.photo, 'src')} alt="${esc(p.name)}" loading="lazy">` : `<span class="pf-img pf-ini" aria-hidden="true">${esc(initials(p.name))}</span>`}<b>${esc(p.name)}</b><span class="pf-pos">${esc(p.role)}</span>${p.subject ? `<small>${esc(p.subject)}</small>` : ''}</li>`).join('')}</ul></section>` : ''}
    ${await prefectsStrip()}
    <section class="infoblock"><h2 class="h2s">${ic('pin')} Visit us</h2><div class="card"><p style="margin:0 0 8px">${esc(s.address)}</p><p style="margin:0">${s.phones.map(p => `<a class="link" href="tel:${esc(p.tel)}">${esc(p.label)}</a>`).join(' &middot; ')}</p></div></section>`,
    bind() { bindCarousel(document); } };
}

/* ---------- accounts (admin) ---------- */
export async function vAccounts() {
  const live = data.isLive; const r = live ? await data.adminUsers({ action: 'list' }) : { users: [] };
  const users = (r.users || []).sort((a, b) => String(a.role).localeCompare(b.role) || String(a.full_name).localeCompare(b.full_name));
  const rl = { admin: 'Admin', teacher: 'Teacher', bursar: 'Bursar', student: 'Student', parent: 'Parent / Payment' };
  return { title: 'Accounts', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Admin</p><h1 class="h1">Accounts and passwords</h1>
    ${live ? '' : '<div class="card" style="margin-top:16px"><p style="margin:0"><b>Demo mode.</b> Accounts can be created after the site is live. For now every portal accepts <b>demo</b> / <b>demo1234</b>.</p></div>'}
    ${r.error ? `<div class="card error" style="margin-top:16px">${esc(r.error)}</div>` : ''}
    <form class="card" id="acForm" novalidate style="margin-top:18px"><h2 style="font-size:18px;margin-bottom:12px">Create an account</h2>
      ${selectField({ id: 'role', label: 'Who is it for?', options: Object.entries(rl).map(([k, v]) => opt(k, '', v)).join('') })}
      ${field({ id: 'full_name', label: 'Full name' })}
      ${field({ id: 'identifier', label: 'Sign-in ID', hint: 'Student: reg. number. Parent: phone number. Staff: staff ID or email.', extra: 'autocapitalize="none" spellcheck="false"' })}
      <div id="regWrap" hidden>${field({ id: 'linked_regs', label: "Child's reg. number(s)", required: false, hint: 'Parent: separate several children with a comma. Must match the reg. number in Students.' })}</div>
      <div class="field" data-field="password"><label for="password">Password</label><div class="pw"><input class="input" id="password" name="password" type="text" required minlength="6" data-msg="At least 6 characters" aria-describedby="password-e"><button type="button" id="gen">Generate</button></div><span class="hint">Write it down and give it to the person. They sign in with the ID above and this password.</span><span class="error" id="password-e" role="alert"></span></div>
      <div id="acErr" class="error" role="alert"></div><div id="acOk" class="ok-box" hidden></div>
      <button class="btn" type="submit" style="margin-top:14px" ${live ? '' : 'disabled'}>Create account</button></form>
    <h2 class="h2s" style="margin-top:28px">${ic('people')} Existing accounts (${users.length})</h2>
    <ul class="mlist">${users.map(u => `<li class="mrow"><div class="mrow-main"><b>${esc(u.full_name || u.email)}</b><span>${esc(rl[u.role] || u.role)} · ${esc(u.email)}${u.reg_no ? ' · ' + esc(u.reg_no) : ''}${(u.linked_regs || []).length ? ' · ' + esc(u.linked_regs.join(', ')) : ''}</span></div>
      <div class="mrow-actions"><button class="btn btn-ghost btn-sm" data-reset="${esc(u.id)}" data-name="${esc(u.full_name || u.email)}" type="button">Reset password</button><button class="btn btn-ghost btn-sm" data-del="${esc(u.id)}" data-name="${esc(u.full_name || u.email)}" type="button" aria-label="Delete ${esc(u.full_name || u.email)}">${ic('trash')}</button></div></li>`).join('') || '<li class="hint">No accounts yet.</li>'}</ul>`,
    bind() {
      const gen = () => Array.from({ length: 8 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('');
      $('#gen').onclick = () => { $('#password').value = gen(); };
      $('#role').onchange = e => { $('#regWrap').hidden = e.target.value !== 'parent'; };
      $('#acForm').onsubmit = async e => { e.preventDefault(); const f = e.currentTarget; if (!validate(f)) return; $('#acErr').textContent = '';
        const res = await data.adminUsers({ action: 'create', role: f.role.value, full_name: f.full_name.value.trim(), identifier: f.identifier.value.trim(), linked_regs: f.linked_regs ? f.linked_regs.value : '', password: f.password.value });
        if (res.error) { $('#acErr').textContent = res.error; return; }
        const ok = $('#acOk'); ok.hidden = false; ok.innerHTML = `Account created. Sign-in ID: <b>${esc(f.identifier.value)}</b> &middot; Password: <b>${esc(f.password.value)}</b> &middot; Portal: <b>${esc(rl[f.role.value])}</b>`; f.reset(); $('#regWrap').hidden = true; };
      $$('[data-reset]').forEach(b => b.onclick = async () => { const pw = gen(); if (!confirm(`Reset password for ${b.dataset.name}? New password will be: ${pw}`)) return;
        const res = await data.adminUsers({ action: 'reset', user_id: b.dataset.reset, password: pw }); if (res.error) return toast(res.error);
        prompt(`New password for ${b.dataset.name} (copy it and give it to them):`, pw); });
      $$('[data-del]').forEach(b => b.onclick = async () => { if (!confirm(`Delete the account of ${b.dataset.name}? This cannot be undone.`)) return;
        const res = await data.adminUsers({ action: 'delete', user_id: b.dataset.del }); if (res.error) return toast(res.error); toast('Account deleted'); window.dispatchEvent(new HashChangeEvent('hashchange')); });
    } };
}
