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
const isImg = f => f && String(f.type || '').startsWith('image/') || (f && /\.(jpe?g|png|webp|gif)$/i.test(f.name || f.url || ''));
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
  ${a.image ? `<img class="ann-img" ${data.fileAttr(a.image, 'src')} alt="${esc(a.title)}" loading="lazy">` : ''}<h3>${esc(a.title)}</h3><p>${esc(a.body)}</p>${a.file ? `<a class="link" ${data.fileAttr(a.file)} target="_blank" rel="noopener">${ic('file')} ${esc(a.file.name || 'Attachment')}</a>` : ''}</article>`;

export async function vAnnouncements(s) {
  const list = await announcementsFor(s);
  return { title: 'Announcements', nav: 'more', html: `<p class="eyebrow">School news</p><h1 class="h1">Announcements</h1>
    <div class="anns" style="margin-top:20px">${list.length ? list.map(annCard).join('') : '<p class="hint">No announcements right now.</p>'}</div>${await prefectsStrip()}` };
}

/* ---------- announcements carousel (home page adverts and notices) ---------- */
export async function annCarousel(s) {
  const list = (await announcementsFor(s, 8)); if (!list.length) return '';
  return `<section class="carousel acar" aria-roledescription="carousel" aria-label="Announcements and adverts">
    <div class="slides" tabindex="0">${list.map((a, i) => `<article class="slide aslide ${a.image ? 'has-img' : ''}" aria-roledescription="slide" aria-label="${i + 1} of ${list.length}">
      ${a.image ? `<img ${data.fileAttr(a.image, 'src')} alt="${esc(a.title)}" ${i ? 'loading="lazy"' : ''}>` : ''}
      <div class="atext"><span class="pill">${a.pinned ? 'Pinned' : 'News'} · ${fmtDate(a.date)}</span><h3>${esc(a.title)}</h3><p>${esc(String(a.body || '').slice(0, 180))}${String(a.body || '').length > 180 ? '…' : ''}</p>
      <a class="link" href="#/announcements">Read more</a></div></article>`).join('')}</div>
    ${list.length > 1 ? `<button class="cbtn cprev" type="button" aria-label="Previous">${ic('left')}</button><button class="cbtn cnext" type="button" aria-label="Next">${ic('right')}</button>
    <div class="dots">${list.map((_, i) => `<span class="dot ${i ? '' : 'on'}"></span>`).join('')}</div>` : ''}</section>`;
}

/* ---------- album + carousel ---------- */
export async function albumCarousel() {
  let al = (await data.list('album')).filter(x => x.image && isImg(x.image));
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
    <div class="gallery" id="gallery">${al.map(p => !isImg(p.image) ? `<a class="gitem gdoc" data-cat="${esc(p.category)}" ${data.fileAttr(p.image)} target="_blank" rel="noopener">${ic('file')}<span>${esc(p.title)} (PDF)</span></a>` : `<button class="gitem" type="button" data-cat="${esc(p.category)}" data-i="${esc(p.id)}"><img ${data.fileAttr(p.image, 'src')} alt="${esc(p.caption || p.title)}" loading="lazy"><span>${esc(p.title)}</span></button>`).join('') || '<p class="hint">No photos yet.</p>'}</div>
    <dialog id="lb" class="lb"><button class="lb-x" type="button" aria-label="Close">${ic('close')}</button><img id="lbImg" alt=""><p id="lbCap"></p></dialog>`,
    bind() {
      $$('#albumCats a').forEach(a => a.onclick = e => { e.preventDefault(); $$('#albumCats a').forEach(x => x.removeAttribute('aria-current')); a.setAttribute('aria-current', 'page'); $$('.gitem').forEach(g => { g.hidden = a.dataset.cat && g.dataset.cat !== a.dataset.cat; }); });
      const lb = $('#lb');
      $$('button.gitem').forEach(g => g.onclick = () => { const im = $('img', g); $('#lbImg').src = im.src; $('#lbImg').alt = im.alt; $('#lbCap').textContent = im.alt; lb.showModal(); });
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
          data.trackRef(ref); window.dispatchEvent(new Event('aac:replies'));
          await data.submitPublic('feedback', { type: f.type.value, name: f.name.value.trim(), contact: f.contact.value.trim(), message: f.message.value.trim(), status: 'New', ref });
          $('#view').innerHTML = `<div class="ok-box"><p class="eyebrow" style="color:var(--ok)">Message received</p><h1 class="h1">Thank you</h1><p>Your reference: <b>${esc(ref)}</b></p><p>Replies will show on the bell at the top of this site. <a class="link" href="#/replies">Check replies</a></p><p class="hint" style="color:var(--ink)">The school management will read it. If you left a phone number or email, we may contact you.</p></div><p><a class="btn btn-ghost" href="#/">Back to home</a></p>`;
        } catch { btn.disabled = false; btn.textContent = 'Send message'; $('#fbErr').textContent = 'Could not send. Please try again or call the school.'; }
      };
    } };
}

/* ---------- replies page (opened from the bell) ---------- */
export async function vReplies() {
  const list = await data.getReplies();
  const card = m => `<article class="card reply ${m.unread ? 'reply-new' : ''}"><div class="row-between"><b>${esc(m.type)} · ${esc(m.ref)}</b><span class="pill ${m.status === 'Resolved' ? 'pill-ok' : ''}">${esc(m.status)}${m.unread ? ' · New reply' : ''}</span></div>
    <p class="hint" style="margin:8px 0">Your message: ${esc(String(m.message || '').slice(0, 200))}</p>
    ${m.adminNote ? `<div class="ok-box"><p class="eyebrow" style="color:var(--ok);margin-bottom:6px">Reply from the school</p><p style="margin:0">${esc(m.adminNote)}</p></div>` : '<p class="hint">No reply yet. We will answer as soon as it has been attended to.</p>'}</article>`;
  return { title: 'My replies', nav: 'more', html: `<p class="eyebrow">Feedback box</p><h1 class="h1">Replies to my messages</h1>
    <p class="lead">When the school attends to your enquiry, complaint, request or suggestion, the reply appears here and the bell shows a number.</p>
    <div class="anns" style="margin-top:18px">${list.map(card).join('') || '<p class="hint">No messages tracked on this device yet. <a class="link" href="#/feedback">Write to the school</a> or add a reference below.</p>'}</div>
    <form class="card" id="refForm" style="margin-top:18px"><div class="field" style="margin-top:0"><label for="refIn">Have a reference number from another phone?</label><input class="input" id="refIn" placeholder="Example: FB-1A2B3C4D"></div><button class="btn btn-navy btn-sm" style="margin-top:12px" type="submit">Track it</button></form>`,
    bind() { data.markRepliesSeen(list); window.dispatchEvent(new Event('aac:replies'));
      $('#refForm').onsubmit = e => { e.preventDefault(); data.trackRef($('#refIn').value); window.dispatchEvent(new HashChangeEvent('hashchange')); }; } };
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

/* ---------- library: textbooks, extracts, articles by class, session and subject ---------- */
export async function vLibrary(s) {
  const aud = myAud(s); let files = await data.list('files'); const mine = await myStudents(s);
  files = files.filter(f => s && s.role === 'admin' ? true : f.audience === 'all' || f.audience === aud);
  const cats = [...new Set(files.map(f => f.category))].sort(); const sess = [...new Set(files.map(f => f.session).filter(x => x && x !== 'All sessions'))].sort().reverse();
  const subs = [...new Set(files.map(f => f.subject).filter(Boolean))].sort();
  const start = (mine[0] && mine[0].class) || '';
  const card = f => `<article class="card cur"><div class="row-between"><h3>${esc(f.title)}</h3><span class="pill pill-blue">${esc(f.category)}</span></div>
    <p class="hint" style="margin:4px 0">${esc([f.class, f.session && f.session !== 'All sessions' ? f.session : '', f.subject].filter(Boolean).join(' · '))}</p>${f.description ? `<p>${esc(f.description)}</p>` : ''}
    <div class="row-between" style="justify-content:flex-start;gap:8px;margin-top:10px">${f.file ? `<a class="btn btn-ghost btn-sm" ${data.fileAttr(f.file)} target="_blank" rel="noopener">${ic('download')} Open ${esc(f.file.name || 'file')}</a>` : ''}${f.url ? `<a class="btn btn-ghost btn-sm" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${ic('file')} Open link</a>` : ''}</div></article>`;
  const draw = () => { const c = $('#lc').value, se = $('#ls').value, t = $('#lt').value, su = $('#lsub').value, q = $('#lq').value.toLowerCase();
    const r = files.filter(f => (!c || !f.class || f.class === 'All classes' || f.class === c) && (!se || !f.session || f.session === 'All sessions' || f.session === se) && (!t || f.category === t) && (!su || f.subject === su) && (!q || (f.title + ' ' + (f.description || '') + ' ' + (f.subject || '')).toLowerCase().includes(q)));
    $('#ll').innerHTML = r.map(card).join('') || '<p class="hint">Nothing matches. Try clearing a filter.</p>'; data.hydrate($('#ll')); };
  return { title: 'Library', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Resources</p><h1 class="h1">Library and files</h1>
    <p class="lead">Textbooks, extracts, articles and reference links, sorted by class, session and subject.</p>
    <div class="grid2" style="margin-top:14px"><div class="field"><label for="lc">Class</label><select class="input" id="lc"><option value="">All classes</option>${CLASSES.map(c => opt(c, start)).join('')}</select></div>
    <div class="field"><label for="ls">Session</label><select class="input" id="ls"><option value="">All sessions</option>${sess.map(x => opt(x, '')).join('')}</select></div>
    <div class="field"><label for="lt">Type</label><select class="input" id="lt"><option value="">All types</option>${cats.map(x => opt(x, '')).join('')}</select></div>
    <div class="field"><label for="lsub">Subject</label><select class="input" id="lsub"><option value="">All subjects</option>${subs.map(x => opt(x, '')).join('')}</select></div></div>
    <div class="field"><label for="lq">Search</label><input class="input" id="lq" type="search" placeholder="Title or subject"></div>
    <div class="curlist" id="ll" style="margin-top:14px"></div>`,
    bind() { ['lc', 'ls', 'lt', 'lsub'].forEach(i => { $('#' + i).onchange = draw; }); $('#lq').oninput = draw; draw(); } };
}

/* ---------- fees: choose what to pay, pay, get a receipt ---------- */
import { CONFIG } from './config.js';
const stPill = s => `<span class="pill ${s === 'Paid' ? 'pill-ok' : s === 'Part paid' ? '' : 'pill-red'}">${s}</span>`;
export async function vFees(s) {
  const [students, fees, payments, set] = await Promise.all([myStudents(s), data.list('fees'), data.list('payments'), data.getSettings()]);
  const sessions = [...new Set([...CONFIG.SESSIONS, ...fees.map(f => f.session).filter(Boolean)])];
  const bank = set.accountNumber ? `<div class="card bank"><h3>Pay into this account</h3><dl><dt>Bank</dt><dd>${esc(set.bankName)}</dd><dt>Account name</dt><dd>${esc(set.accountName)}</dd><dt>Account number</dt><dd><b>${esc(set.accountNumber)}</b></dd></dl>
    ${set.feeNote ? `<p>${esc(set.feeNote)}</p>` : ''}</div>` : (set.feeNote ? `<div class="card"><p>${esc(set.feeNote)}</p></div>` : '');
  const block = (st, sess) => {
    const lines = data.feeLines(st, fees, payments).filter(l => !l.fee.session || l.fee.session === sess);
    const due = lines.reduce((a, l) => a + Number(l.fee.amount), 0), paid = lines.reduce((a, l) => a + l.paid, 0);
    const cats = [...new Set([...FEE_CATEGORIES, ...lines.map(l => l.fee.category)])];
    const sec = cats.map(cat => { const L = lines.filter(l => l.fee.category === cat); if (!L.length) return '';
      return `<h3 class="fsec">${esc(cat)}</h3><ul class="paylist">${L.map(l => `<li class="payrow ${l.balance ? '' : 'done'}">
        <label class="check"><input type="checkbox" class="pchk" data-fee="${esc(l.fee.id)}" ${l.balance ? '' : 'disabled'} aria-label="Pay ${esc(l.fee.title)}"><span><b>${esc(l.fee.title)}</b><br><small class="hint">${esc([l.fee.term, 'Fee ' + money(l.fee.amount), l.paid ? 'Paid ' + money(l.paid) : '', l.pending ? 'Awaiting confirmation ' + money(l.pending) : '', l.fee.due ? 'Due ' + fmtDate(l.fee.due) : ''].filter(Boolean).join(' · '))}</small></span></label>
        <div class="payamt">${l.balance ? `<label class="hint" for="a_${esc(st.reg_no)}_${esc(l.fee.id)}">Amount (₦)</label><input class="input pamt" id="a_${esc(st.reg_no)}_${esc(l.fee.id)}" type="number" min="1" max="${l.balance}" step="any" inputmode="decimal" value="${l.balance}" data-fee="${esc(l.fee.id)}">` : stPill('Paid')}</div></li>`).join('')}</ul>`; }).join('');
    const pays = payments.filter(p => p.regNo === st.reg_no);
    const batches = [...new Map(pays.sort((a, b) => String(b.date).localeCompare(String(a.date))).map(p => [p.receipt, p])).values()];
    return `<section class="card paybox" style="margin-top:18px" data-reg="${esc(st.reg_no)}"><div class="row-between"><div><h2 style="font-size:20px">${esc(st.name)}</h2><span class="hint">${esc(st.reg_no)} · ${esc(st.class)} · ${esc(sess)}</span></div></div>
      <div class="sum"><div><small>Total fees</small><b>${money(due)}</b></div><div><small>Paid</small><b>${money(paid)}</b></div><div><small>Balance</small><b>${money(due - paid)}</b></div></div>
      ${sec ? `<p class="hint">Tick what you want to pay now. You may change the amount to pay part of an item.</p>${sec}
      <div class="paybar"><div><small>You are paying</small><b class="ptotal">${money(0)}</b></div>
        <div class="field" style="margin:0"><label for="m_${esc(st.reg_no)}">Payment method</label><select class="input pmeth" id="m_${esc(st.reg_no)}"><option>Bank transfer</option><option>Online</option><option>POS</option><option>Cash at the school office</option></select></div>
        <div class="field" style="margin:0"><label for="r_${esc(st.reg_no)}">Transfer reference or note (optional)</label><input class="input pref" id="r_${esc(st.reg_no)}" type="text"></div>
        <div class="field" style="margin:0"><label for="p_${esc(st.reg_no)}">Proof of payment (optional: jpg, png or pdf)</label><input class="input pproof" id="p_${esc(st.reg_no)}" type="file" accept="image/*,.pdf"></div>
        <div class="error perr" role="alert"></div><button class="btn paybtn" type="button" disabled>Submit payment and get receipt</button></div>` : '<p class="hint">No fees have been set for this class and session yet.</p>'}
      ${batches.length ? `<h3 class="fsec">Receipts</h3><ul class="mlist">${batches.map(p => { const b = pays.filter(x => x.receipt === p.receipt); const tot = b.reduce((a, x) => a + Number(x.amount || 0), 0); const stt = b.every(x => !x.status || x.status === 'Confirmed') ? 'Confirmed' : b.some(x => x.status === 'Pending') ? 'Awaiting confirmation' : 'Rejected';
        return `<li class="mrow"><div class="mrow-main"><b>${money(tot)} · ${esc(p.receipt)}</b><span>${fmtDate(p.date)} · ${esc(p.method)} · ${esc(stt)}</span></div><div class="mrow-actions"><a class="btn btn-ghost btn-sm" href="#/receipt/${encodeURIComponent(p.receipt)}">${ic('download')} Receipt</a></div></li>`; }).join('')}</ul>` : ''}</section>`;
  };
  const sess0 = sessions[0];
  return { title: 'Fees and payments', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Fees</p><h1 class="h1">Fees and payments</h1>
    <p class="lead">Pick the session, tick the fees you want to pay (school fee, textbooks, uniforms or others), pay, and print your receipt.</p>
    <div class="field" style="max-width:240px;margin-top:14px"><label for="fsess">Session</label><select class="input" id="fsess">${sessions.map(x => opt(x, sess0)).join('')}</select></div>
    <div id="fbody">${students.map(st => block(st, sess0)).join('') || '<div class="card" style="margin-top:18px"><p>No student is linked to this account yet. Please call the school office.</p></div>'}</div><div style="margin-top:18px">${bank}</div>`,
    bind() {
      const wire = () => $$('.paybox').forEach(box => {
        const st = students.find(x => x.reg_no === box.dataset.reg); const sess = $('#fsess').value;
        const total = () => { let t = 0; $$('.pchk', box).forEach(c => { if (c.checked) t += Number($('.pamt[data-fee="' + c.dataset.fee + '"]', box).value) || 0; }); $('.ptotal', box).textContent = money(t); $('.paybtn', box).disabled = t <= 0; return t; };
        box.addEventListener('input', total); box.addEventListener('change', total); total();
        $('.paybtn', box).onclick = async () => {
          const btn = $('.paybtn', box), err = $('.perr', box); err.textContent = ''; const lines = data.feeLines(st, fees, payments); const picks = [];
          for (const c of $$('.pchk', box)) if (c.checked) { const l = lines.find(x => x.fee.id === c.dataset.fee); const v = Number($('.pamt[data-fee="' + c.dataset.fee + '"]', box).value);
            if (!l || !(v > 0)) { err.textContent = 'Enter an amount for each ticked item.'; return; } if (v > l.balance) { err.textContent = `${l.fee.title}: the balance is only ${money(l.balance)}.`; return; } picks.push([l, v]); }
          if (!picks.length) return; btn.disabled = true; btn.textContent = 'Submitting…';
          try {
            const proofFile = $('.pproof', box).files[0]; const proof = proofFile ? await data.uploadFile(proofFile, 'proof') : null;
            const receipt = 'RCT-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).toUpperCase().slice(2, 4); const date = new Date().toISOString().slice(0, 10);
            const recs = picks.map(([l, v]) => ({ regNo: st.reg_no, feeId: l.fee.id, feeTitle: l.fee.title, category: l.fee.category, session: l.fee.session || sess, term: l.fee.term || '', amount: v, method: $('.pmeth', box).value, date, receipt, status: 'Pending', note: $('.pref', box).value.trim(), ...(proof ? { proof } : {}), enteredBy: (s && s.name) || 'Parent' }));
            for (const r of recs) await data.save('payments', r);
            location.hash = '#/receipt/' + encodeURIComponent(receipt);
          } catch (e) { err.textContent = e.message || 'Could not submit. Try again.'; btn.disabled = false; btn.textContent = 'Submit payment and get receipt'; }
        };
      });
      wire();
      $('#fsess').onchange = e => { $('#fbody').innerHTML = students.map(st => block(st, e.target.value)).join(''); wire(); };
    } };
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
  const all = await data.list('payments');
  let first = all.find(x => x.receipt === id) || all.find(x => x.id === id);
  if (!first) return { title: 'Receipt', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p>Receipt not found.</p>` };
  const batch = all.filter(x => x.receipt === first.receipt && x.regNo === first.regNo);
  const [students, fees, set] = await Promise.all([data.list('students'), data.list('fees'), data.getSettings()]);
  const st = students.find(x => x.reg_no === first.regNo) || {};
  const lines = batch.map(p => { const f = fees.find(x => x.id === p.feeId) || {}; return { title: p.feeTitle || f.title || 'Fee', category: p.category || f.category || '', term: p.term || f.term || '', session: p.session || f.session || '', amount: Number(p.amount || 0), status: p.status || 'Confirmed' }; });
  const total = lines.reduce((a, l) => a + l.amount, 0);
  const state = lines.every(l => l.status === 'Confirmed') ? 'Confirmed' : lines.some(l => l.status === 'Pending') ? 'Awaiting bursar confirmation' : 'Rejected';
  const ok = state === 'Confirmed';
  return { title: 'Receipt', nav: 'home', html: `<a class="back noprint" href="#/dashboard">${ic('back')} Dashboard</a>
    <div class="card receipt" style="margin-top:12px"><div class="result-head"><div><p class="eyebrow" style="margin:0">${ok ? 'Official payment receipt' : 'Payment receipt (not yet confirmed)'}</p><h1 style="font-size:24px;margin-top:6px">${esc(set.schoolName)}</h1><small class="hint">${esc(set.address)}</small></div><img src="assets/logo.png" alt="" width="64" height="57"></div>
    <div class="meta"><div><span>Receipt no.</span><b>${esc(first.receipt)}</b></div><div><span>Date</span><b>${fmtDate(first.date)}</b></div><div><span>Student</span><b>${esc(st.name || first.regNo)}</b></div><div><span>Reg. number / class</span><b>${esc(first.regNo)} · ${esc(st.class || '')}</b></div>
    <div><span>Parent / guardian</span><b>${esc(st.parentName || '-')}</b></div><div><span>Session</span><b>${esc(lines[0].session || '')}</b></div><div><span>Method</span><b>${esc(first.method)}</b></div><div><span>Status</span><b>${esc(state)}</b></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Description of payment</th><th>Section</th><th class="n">Amount</th></tr></thead><tbody>${lines.map(l => `<tr><td>${esc(l.title)}${l.term ? `<br><small class="hint">${esc(l.term)}</small>` : ''}</td><td>${esc(l.category)}</td><td class="n">${money(l.amount)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="2"><b>Total</b></td><td class="n"><b>${money(total)}</b></td></tr></tfoot></table></div>
    ${first.note ? `<p class="hint">Reference: ${esc(first.note)}</p>` : ''}${first.enteredBy ? `<p class="hint">Recorded by: ${esc(first.enteredBy)}</p>` : ''}
    ${ok ? '' : '<p class="hint"><b>This receipt becomes official once the bursar confirms your payment.</b> Open it again later to print the confirmed copy.</p>'}</div>
    <button class="btn btn-navy noprint" id="pr" style="margin-top:16px" type="button">${ic('download')} Download PDF / Print receipt</button>
    <p class="hint noprint">In the print window choose "Save as PDF" to download it.</p>`,
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
export function leadershipCards(s) {
  const msg = (name, photo, text, role) => name || text ? `<article class="card msgcard">${photo ? `<img class="msg-img" ${data.fileAttr(photo, 'src')} alt="${esc(name)}" loading="lazy">` : ''}<div><p class="eyebrow" style="margin:0">${role}</p><h3>${esc(name)}</h3><p>${esc(text)}</p></div></article>` : '';
  return msg(s.founderName, s.founderPhoto, s.founderMsg, 'Message from the founder') + msg(s.proprietressName, s.proprietressPhoto, s.proprietressMsg, 'Message from the principal');
}
export async function vAbout() {
  const [s, staff] = await Promise.all([data.getSettings(), data.list('staff')]);
  const lvl = r => Number(r.orgLevel) || (/found|propriet|board|chair/i.test(r.role) ? 1 : /princip|head ?teacher|head of school/i.test(r.role) ? 2 : /vice|deputy|hod|head of/i.test(r.role) ? 3 : /bursar|secretary|cleaner|security|driver|gate|cook|nurse/i.test(r.role) ? 5 : 4);
  staff.sort((a, b) => lvl(a) - lvl(b) || String(a.name).localeCompare(b.name));
  const li = a => `<ul class="chk">${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const person = p => `<li class="org-node">${p.photo ? `<img class="pf-img" ${data.fileAttr(p.photo, 'src')} alt="${esc(p.name)}" loading="lazy">` : `<span class="pf-img pf-ini" aria-hidden="true">${esc(initials(p.name))}</span>`}<b>${esc(p.name)}</b><span class="pf-pos">${esc(p.role)}</span>${p.subject ? `<small>${esc(p.subject)}</small>` : ''}</li>`;
  const tiers = [1, 2, 3, 4, 5].map(n => [n, staff.filter(p => lvl(p) === n)]).filter(t => t[1].length);
  const org = s.orgChart ? `<img class="orgimg" ${data.fileAttr(s.orgChart, 'src')} alt="School organogram">` : (tiers.length ? `<div class="org">${tiers.map(([n, L], i) => `${i ? '<div class="org-line" aria-hidden="true"></div>' : ''}<ul class="org-tier">${L.map(person).join('')}</ul>`).join('')}</div>` : '');
  const msg = (name, photo, text, role) => name || text ? `<article class="card msgcard">${photo ? `<img class="msg-img" ${data.fileAttr(photo, 'src')} alt="${esc(name)}" loading="lazy">` : ''}<div><p class="eyebrow" style="margin:0">${role}</p><h3>${esc(name)}</h3><p>${esc(text)}</p></div></article>` : '';
  return { title: 'About the school', nav: 'about', wide: false, html: `${await albumCarousel()}
    <p class="eyebrow">About us</p><h1 class="h1">${esc(s.schoolName)}</h1><p class="lead">${esc(s.motto)}</p>
    <p style="max-width:62ch;margin-top:14px">${esc(s.aboutText)}</p>
    <div class="row-between" style="justify-content:flex-start;gap:10px;margin-top:18px"><a class="btn" href="#/apply">Apply for admission</a><a class="btn btn-ghost" href="#/feedback">Ask a question</a></div>
    ${leadershipCards(s)}
    <section class="infoblock"><h2 class="h2s">${ic('cap')} Classes</h2><div class="cgrid">${CLASS_GROUPS.map(([g, l]) => `<div class="card"><b>${g}</b><p class="hint" style="margin:6px 0 0">${l.join(', ')}</p></div>`).join('')}</div></section>
    <section class="infoblock"><h2 class="h2s">${ic('book')} Subjects and courses</h2>${li(lines(s.subjectsText))}</section>
    <section class="infoblock"><h2 class="h2s">${ic('room')} Facilities</h2>${li(lines(s.facilitiesText))}</section>
    <section class="infoblock"><h2 class="h2s">${ic('cal')} Activities</h2>${li(lines(s.activitiesText))}</section>
    ${org ? `<section class="infoblock" id="organogram"><h2 class="h2s">${ic('people')} School organogram</h2>${org}</section>` : ''}
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
    <div class="card" style="margin-top:18px"><h2 style="font-size:18px;margin-bottom:6px">Create many accounts from a spreadsheet</h2>
      <p class="hint">CSV columns: <b>role, identifier, full_name, password, linked_regs</b> (role: student, parent, teacher, bursar). Leave password empty to generate one. You get a list of IDs and passwords to print or download.</p>
      <p><button class="btn btn-ghost btn-sm" id="actpl" type="button">${ic('download')} Download template</button></p>
      <div class="field"><label for="acfile">CSV file</label><input class="input" id="acfile" type="file" accept=".csv,text/csv" ${live ? '' : 'disabled'}></div><div id="acbp" class="hint" role="status"></div><div class="error" id="acberr" role="alert"></div>
      <button class="btn" id="acbgo" type="button" disabled>Create accounts</button><div id="acbout"></div></div>
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
      $('#actpl').onclick = () => download('accounts-template.csv', 'role,identifier,full_name,password,linked_regs\nstudent,AAC/2026/101,Ada Okafor,,\nparent,08012345678,Mrs Okafor,,AAC/2026/101');
      let bulk = [];
      $('#acfile').onchange = async e => { const f = e.target.files[0]; bulk = []; $('#acberr').textContent = ''; $('#acbgo').disabled = true; if (!f) return;
        bulk = csvParse(await f.text()).filter(r => r.identifier && ['student', 'parent', 'teacher', 'bursar'].includes((r.role || '').toLowerCase()));
        $('#acbp').textContent = `${bulk.length} valid row(s) found.`; $('#acbgo').disabled = !bulk.length; };
      $('#acbgo').onclick = async () => { const b = $('#acbgo'); b.disabled = true; const out = []; let n = 0;
        for (const r of bulk) { n++; b.textContent = `Creating ${n} of ${bulk.length}…`; const pw = r.password || gen();
          const res = await data.adminUsers({ action: 'create', role: r.role.toLowerCase(), full_name: r.full_name || '', identifier: r.identifier, linked_regs: r.linked_regs || '', password: pw });
          out.push([r.role, r.identifier, r.full_name || '', pw, res.error ? 'FAILED: ' + res.error : 'Created']); }
        b.textContent = 'Create accounts'; $('#acbout').innerHTML = `<p class="hint" style="margin-top:12px">${out.filter(o => o[4] === 'Created').length} created, ${out.filter(o => o[4] !== 'Created').length} failed.</p><button class="btn btn-navy" id="acdl" type="button">${ic('download')} Download list with passwords</button>`;
        $('#acdl').onclick = () => download('new-accounts.csv', toCsv([['Role', 'Sign-in ID', 'Name', 'Password', 'Result'], ...out])); };
      $$('[data-reset]').forEach(b => b.onclick = async () => { const pw = gen(); if (!confirm(`Reset password for ${b.dataset.name}? New password will be: ${pw}`)) return;
        const res = await data.adminUsers({ action: 'reset', user_id: b.dataset.reset, password: pw }); if (res.error) return toast(res.error);
        prompt(`New password for ${b.dataset.name} (copy it and give it to them):`, pw); });
      $$('[data-del]').forEach(b => b.onclick = async () => { if (!confirm(`Delete the account of ${b.dataset.name}? This cannot be undone.`)) return;
        const res = await data.adminUsers({ action: 'delete', user_id: b.dataset.del }); if (res.error) return toast(res.error); toast('Account deleted'); window.dispatchEvent(new HashChangeEvent('hashchange')); });
    } };
}
