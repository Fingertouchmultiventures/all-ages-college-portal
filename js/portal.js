// Portal screens: announcements, prefects, album, feedback box, curriculum, lesson notes, library, fees, debtors, receipts, results upload.
import * as data from './data.js';
import { POSITIONS, FEE_CATEGORIES, ACTIVITIES } from './schema.js';
import { mdToHtml, $, $$, esc, ic, opt, field, selectField, validate, toast, money, fmtDate, norm, CLASSES, CLASS_GROUPS, TERMS, download, toCsv, csvParse } from './ui.js';

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
    <div id="gallery">${(() => { const groups = {}; al.forEach(p => { (groups[p.collection || 'General'] = groups[p.collection || 'General'] || []).push(p); });
      return Object.entries(groups).map(([n, L]) => `<section class="gcoll"><h2 class="h2s">${ic('image')} ${esc(n)} <small class="hint">(${L.length})</small></h2><div class="gallery">${L.map(p => !isImg(p.image) ? `<a class="gitem gdoc" data-cat="${esc(p.category)}" ${data.fileAttr(p.image)} target="_blank" rel="noopener">${ic('file')}<span>${esc(p.title)} (PDF)</span></a>` : `<button class="gitem" type="button" data-cat="${esc(p.category)}" data-i="${esc(p.id)}"><img ${data.fileAttr(p.image, 'src')} alt="${esc(p.caption || p.title)}" loading="lazy"><span>${esc(p.title)}</span></button>`).join('')}</div></section>`).join('') || '<p class="hint">No photos yet.</p>'; })()}</div>
    <dialog id="lb" class="lb"><button class="lb-x" type="button" aria-label="Close">${ic('close')}</button><img id="lbImg" alt=""><p id="lbCap"></p></dialog>`,
    bind() {
      $$('#albumCats a').forEach(a => a.onclick = e => { e.preventDefault(); $$('#albumCats a').forEach(x => x.removeAttribute('aria-current')); a.setAttribute('aria-current', 'page'); $$('.gitem').forEach(g => { g.hidden = a.dataset.cat && g.dataset.cat !== a.dataset.cat; }); $$('.gcoll').forEach(c => { c.hidden = ![...$$('.gitem', c)].some(g => !g.hidden); }); });
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
function notesView(kind, label, eyebrow) {
  return async function (s) {
    const mine = await myStudents(s); const all = (await data.list(kind)).sort((a, b) => String(a.subject).localeCompare(b.subject) || String(a.title).localeCompare(b.title));
    const start = (mine[0] && mine[0].class) || (s && s.role === 'student' ? '' : 'JSS 1');
    const draw = (cls, q, sub) => { const r = all.filter(x => x.class === cls && (!sub || x.subject === sub) && (!q || (x.subject + x.title + (x.body || '')).toLowerCase().includes(q.toLowerCase())));
      return r.length ? r.map(n => `<details class="card note"><summary><b>${esc(n.title)}</b><span>${esc(n.subject)}${n.term ? ' · ' + esc(n.term) : ''}${n.week ? ' · ' + esc(n.week) : ''}</span></summary>
        <div class="note-body nb">${mdToHtml(n.body)}</div>${n.file ? `<p><a class="btn btn-ghost btn-sm" ${data.fileAttr(n.file)} target="_blank" rel="noopener">${ic('download')} Open ${esc(n.file.name || 'file')}</a></p>` : ''}<p class="hint">${esc(n.teacherName || '')} ${n._created ? '· ' + fmtDate(n._created) : ''}</p>
        ${s && ['admin', 'teacher'].includes(s.role) ? `<a class="link" href="#/manage/${kind}/${encodeURIComponent(n.id)}">Edit or replace</a>` : ''}</details>`).join('') : `<p class="hint">No ${label.toLowerCase()} found for this class yet.</p>`; };
    return { title: label, nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">${eyebrow}</p><h1 class="h1">${label}</h1>
      <div class="grid2"><div class="field"><label for="cls">Class level</label>${classSelect('cls', start)}</div><div class="field"><label for="nsub">Subject</label><select class="input" id="nsub"></select></div></div>
      <div class="field"><label for="nq">Search</label><input class="input" id="nq" type="search" placeholder="Topic or word"></div>
      <div id="nl" style="margin-top:14px"></div>`,
      bind() {
        const subs = () => { const cur = $('#nsub').value; $('#nsub').innerHTML = '<option value="">All subjects</option>' + [...new Set(all.filter(x => x.class === $('#cls').value).map(x => x.subject))].sort().map(x => opt(x, cur)).join(''); };
        const up = () => { $('#nl').innerHTML = draw($('#cls').value, $('#nq').value, $('#nsub').value); data.hydrate($('#nl')); };
        $('#cls').onchange = () => { subs(); up(); }; $('#nsub').onchange = up; $('#nq').oninput = up; subs(); up();
      } };
  };
}
export const vNotes = notesView('lessonNotes', 'Lesson notes', 'Class notes');
export const vNotebooks = notesView('notebooks', 'Notebooks', 'Full explanations to learn from');

/* ---------- assignments and tests (students, parents see their class) ---------- */
export function vWork(kind) {
  const L = kind === 'tests' ? ['Tests and exams', 'Upcoming and past tests'] : ['Assignments', 'Homework from your teachers'];
  return async function (s) {
    const mine = await myStudents(s); const classes = [...new Set(mine.map(x => x.class))]; const staff = s && ['admin', 'teacher'].includes(s.role);
    const all = (await data.list(kind)).filter(x => staff || !classes.length || classes.includes(x.class)).sort((a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || '')));
    return { title: L[0], nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">${L[1]}</p><h1 class="h1">${L[0]}</h1>
      ${staff ? `<p><a class="btn btn-sm" href="#/manage/${kind}/new">${ic('plus')} Add</a> <a class="btn btn-ghost btn-sm" href="#/manage/${kind}">Manage</a></p>` : ''}
      <div class="curlist" style="margin-top:14px">${all.map(a => `<article class="card cur"><div class="row-between"><h3>${esc(a.title)}</h3><span class="pill pill-blue">${esc(a.class)}</span></div>
        <p class="hint" style="margin:4px 0">${esc([a.subject, a.kind, a.term, a.date ? fmtDate(a.date) : '', a.due ? 'Due ' + fmtDate(a.due) : '', a.time].filter(Boolean).join(' · '))}</p>
        <p style="white-space:pre-wrap">${esc(a.instructions || a.coverage || '')}</p>${a.file ? `<a class="btn btn-ghost btn-sm" ${data.fileAttr(a.file)} target="_blank" rel="noopener">${ic('download')} Open ${esc(a.file.name || 'file')}</a>` : ''}
        <p class="hint">${esc(a.teacherName || '')}</p></article>`).join('') || `<p class="hint">Nothing posted for your class yet.</p>`}</div>` };
  };
}
export const vAssignments = vWork('assignments'); export const vTests = vWork('tests');

/* ---------- scorecard (student / parent) ---------- */
export async function vScorecard(s) {
  const mine = await myStudents(s); const scores = await data.list('scores');
  const blocks = mine.map(st => {
    const rows = scores.filter(x => norm(x.regNo) === norm(st.reg_no)); const terms = [...new Set(rows.map(r => `${r.session}|${r.term}`))].sort().reverse();
    return `<section class="card" style="margin-top:18px"><h2 style="font-size:20px">${esc(st.name)}</h2><span class="hint">${esc(st.reg_no)} · ${esc(st.class)}</span>
      ${terms.map(t => { const [se, te] = t.split('|'); const R = rows.filter(r => r.session === se && r.term === te); const subs = [...new Set(R.map(r => r.subject))].sort();
        return `<h3 class="fsec">${esc(te)} · ${esc(se)}</h3><div class="tbl-wrap"><table><thead><tr><th>Subject</th><th>Scores</th><th class="n">Total</th></tr></thead><tbody>${subs.map(su => { const Q = R.filter(r => r.subject === su); const tot = Q.reduce((a, r) => a + Number(r.score), 0), mx = Q.reduce((a, r) => a + Number(r.max), 0);
          return `<tr><td>${esc(su)}</td><td>${Q.map(r => `${esc(r.assessment)}: ${r.score}/${r.max}`).join('<br>')}</td><td class="n"><b>${tot}/${mx}</b></td></tr>`; }).join('')}</tbody></table></div>`; }).join('') || '<p class="hint">No scores have been entered yet.</p>'}</section>`; }).join('');
  return { title: 'Scorecard', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Progress</p><h1 class="h1">Scorecard</h1>
    <p class="lead">Continuous assessment, test and assignment scores entered by teachers. Official end-of-term results are on the Check result page.</p>${blocks || '<p class="hint">No student is linked to this account yet.</p>'}` };
}

/* ---------- score sheet (teacher / admin): enter scores for a whole class ---------- */
export async function vScoreSheet(s) {
  const students = (await data.list('students')).sort((a, b) => String(a.name).localeCompare(b.name)); const cur = await data.list('curriculum');
  const sessions = (await import('./config.js')).CONFIG.SESSIONS;
  return { title: 'Enter scores', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Teachers</p><h1 class="h1">Enter scores for a class</h1>
    <form class="card" id="ssf" style="margin-top:16px"><div class="grid2">
      <div class="field"><label for="ssc">Class</label>${classSelect('ssc', '')}</div>
      <div class="field"><label for="sss">Subject</label><input class="input" id="sss" list="subl" placeholder="Example: Mathematics"><datalist id="subl"></datalist></div>
      <div class="field"><label for="ssse">Session</label><select class="input" id="ssse">${sessions.map(x => opt(x, '')).join('')}</select></div>
      <div class="field"><label for="sst">Term</label><select class="input" id="sst">${TERMS.map(x => opt(x, '')).join('')}</select></div>
      <div class="field"><label for="ssa">Assessment</label><input class="input" id="ssa" list="al" placeholder="First CA, Second CA, Exam, Assignment 1"><datalist id="al"><option>First CA</option><option>Second CA</option><option>Exam</option><option>Assignment</option><option>Test</option></datalist></div>
      <div class="field"><label for="ssm">Out of</label><input class="input" id="ssm" type="number" min="1" value="20"></div></div>
      <div id="ssrows" style="margin-top:12px"></div><div id="sserr" class="error" role="alert"></div>
      <button class="btn" id="sssave" type="submit" style="margin-top:14px">Save scores</button></form>`,
    bind() {
      const draw = () => { const cls = $('#ssc').value; const L = students.filter(x => x.class === cls);
        $('#subl').innerHTML = [...new Set(cur.filter(x => x.class === cls).map(x => x.subject))].map(x => `<option>${esc(x)}</option>`).join('');
        $('#ssrows').innerHTML = L.length ? `<div class="tbl-wrap"><table><thead><tr><th>Student</th><th class="n">Score</th></tr></thead><tbody>${L.map(x => `<tr><td>${esc(x.name)}<br><small class="hint">${esc(x.reg_no)}</small></td><td class="n"><input class="input sc" data-reg="${esc(x.reg_no)}" type="number" min="0" step="any" inputmode="decimal" style="width:96px" aria-label="Score for ${esc(x.name)}"></td></tr>`).join('')}</tbody></table></div>` : '<p class="hint">No students in this class yet. Add or import students first.</p>'; };
      $('#ssc').onchange = draw; draw();
      $('#ssf').onsubmit = async e => { e.preventDefault(); const cls = $('#ssc').value, sub = $('#sss').value.trim(), as = $('#ssa').value.trim(), mx = Number($('#ssm').value); $('#sserr').textContent = '';
        if (!sub || !as || !(mx > 0)) { $('#sserr').textContent = 'Enter the subject, assessment and the maximum score.'; return; }
        const recs = [...$$('.sc')].filter(i => i.value !== '').map(i => ({ id: `sc-${norm(i.dataset.reg)}-${cls}-${sub}-${$('#ssse').value}-${$('#sst').value}-${as}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), regNo: i.dataset.reg, class: cls, subject: sub, session: $('#ssse').value, term: $('#sst').value, assessment: as, score: Number(i.value), max: mx, teacherName: s.name, owner: s.id }));
        const bad = recs.find(r => r.score > r.max); if (bad) { $('#sserr').textContent = `${bad.regNo}: score is above ${mx}.`; return; }
        if (!recs.length) { $('#sserr').textContent = 'Type at least one score.'; return; }
        try { await data.saveMany('scores', recs); toast(`${recs.length} scores saved`); } catch (err) { $('#sserr').textContent = err.message; } };
    } };
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
    const gs = {}; r.forEach(f => { (gs[f.collection || 'General'] = gs[f.collection || 'General'] || []).push(f); });
    $('#ll').innerHTML = Object.entries(gs).map(([n, L]) => `<h3 class="fsec" style="grid-column:1/-1">${ic('folder')} ${esc(n)}</h3>${L.map(card).join('')}`).join('') || '<p class="hint">Nothing matches. Try clearing a filter.</p>'; data.hydrate($('#ll')); };
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

/* ---------- payment hub for admin and bursar ---------- */
export async function vPayHub(s) {
  const [students, fees, payments] = await Promise.all([data.list('students'), data.list('fees'), data.list('payments')]);
  let due = 0, paid = 0; students.forEach(st => data.feeLines(st, fees, payments).forEach(l => { due += Number(l.fee.amount); paid += l.paid; }));
  const pend = [...new Map(payments.filter(p => p.status === 'Pending').map(p => [p.receipt, p])).values()];
  const T = (h, i, t, d) => `<a class="tile" href="${h}">${ic(i)}<b>${t}</b><small>${d}</small></a>`;
  return { title: 'Payment portal', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">${s.role === 'admin' ? 'Admin' : 'Bursar'} · payment portal</p><h1 class="h1">Payments</h1>
    <div class="sum" style="margin-top:16px"><div><small>Total fees set</small><b>${money(due)}</b></div><div><small>Confirmed payments</small><b>${money(paid)}</b></div><div><small>Outstanding</small><b>${money(due - paid)}</b></div></div>
    <div class="tiles" style="margin-top:20px">${T('#/manage/fees', 'card', 'Fees and prices', 'Set school fee, textbooks, uniforms by class and session')}${T('#/manage/payments', 'wallet', 'All payments', 'Record, edit, confirm, print receipts')}${T('#/p/debtors', 'chart', 'Fee overview', 'Who has paid and who owes')}${s.role === 'admin' ? T('#/manage/settings', 'sliders', 'Bank account details', 'Shown to parents on the Fees page') : ''}</div>
    <h2 class="h2s" style="margin-top:28px">${ic('wallet')} Waiting for confirmation (${pend.length})</h2>
    <ul class="mlist">${pend.map(p => { const st = students.find(x => x.reg_no === p.regNo) || {}; const tot = payments.filter(x => x.receipt === p.receipt).reduce((a, x) => a + Number(x.amount), 0);
      return `<li class="mrow"><div class="mrow-main"><b>${esc(st.name || p.regNo)}: ${money(tot)}</b><span>${esc(p.receipt)} · ${fmtDate(p.date)} · ${esc(p.method)}${p.note ? ' · ' + esc(p.note) : ''}</span>${p.proof ? `<a class="link" ${data.fileAttr(p.proof)} target="_blank" rel="noopener">${ic('file')} Proof of payment</a>` : ''}</div>
      <div class="mrow-actions"><button class="btn btn-sm" data-ok="${esc(p.receipt)}" type="button">Confirm</button><a class="btn btn-ghost btn-sm" href="#/receipt/${encodeURIComponent(p.receipt)}">Receipt</a></div></li>`; }).join('') || '<li class="hint">Nothing waiting.</li>'}</ul>`,
    bind() { $$('[data-ok]').forEach(b => b.onclick = async () => { b.disabled = true; try { await data.saveMany('payments', payments.filter(x => x.receipt === b.dataset.ok && x.status === 'Pending').map(x => ({ ...x, status: 'Confirmed', enteredBy: s.name }))); toast('Confirmed'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); b.disabled = false; } }); } };
}

export async function vDebtors(sess) {
  const isAdmin = sess && sess.role === 'admin';
  const [students, fees, payments] = await Promise.all([data.list('students'), data.list('fees'), data.list('payments')]);
  const rows = students.map(st => { const L = data.feeLines(st, fees, payments); const due = L.reduce((a, l) => a + Number(l.fee.amount), 0), paid = L.reduce((a, l) => a + l.paid, 0); return { st, due, paid, bal: due - paid }; });
  const draw = cls => { const r = rows.filter(x => !cls || x.st.class === cls).sort((a, b) => b.bal - a.bal);
    return { html: `<tbody>${r.map(x => `<tr><td>${esc(x.st.name)}<br><small class="hint">${esc(x.st.reg_no)}</small></td><td>${esc(x.st.class)}</td><td class="n">${money(x.due)}</td><td class="n">${money(x.paid)}</td><td class="n"><b>${money(x.bal)}</b></td>${isAdmin ? `<td><button class="btn btn-ghost btn-sm" data-delst="${esc(x.st.id)}" data-name="${esc(x.st.name)}" type="button" aria-label="Delete ${esc(x.st.name)}">${ic('trash')}</button></td>` : ''}</tr>`).join('') || '<tr><td colspan="6" class="hint">No students.</td></tr>'}</tbody>`, r }; };
  return { title: 'Fee overview', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Bursary</p><h1 class="h1">Fee overview and debtors</h1>
    <div class="row-between" style="margin:16px 0"><div class="field" style="margin:0"><label for="dc">Class</label><select class="input" id="dc" style="max-width:240px"><option value="">All classes</option>${CLASSES.map(c => opt(c, '')).join('')}</select></div><button class="btn btn-ghost btn-sm" id="dexp" type="button">${ic('download')} Export CSV</button></div>
    <div class="sum" id="dsum"></div><div class="card tbl-wrap" style="margin-top:14px"><table><thead><tr><th>Student</th><th>Class</th><th class="n">Due</th><th class="n">Paid</th><th class="n">Balance</th>${isAdmin ? '<th></th>' : ''}</tr></thead><tbody id="dbody"></tbody></table></div>`,
    bind() {
      const up = () => { const d = draw($('#dc').value); $('#dbody').outerHTML = `<tbody id="dbody">${d.html.slice(7, -8)}</tbody>`;
        const t = d.r.reduce((a, x) => [a[0] + x.due, a[1] + x.paid, a[2] + x.bal], [0, 0, 0]); $('#dsum').innerHTML = `<div><small>Total due</small><b>${money(t[0])}</b></div><div><small>Collected</small><b>${money(t[1])}</b></div><div><small>Outstanding</small><b>${money(t[2])}</b></div>`; };
      const wire = () => $$('[data-delst]').forEach(b => b.onclick = async () => {
        if (!confirm(`Delete ${b.dataset.name} and all their recorded payments? This cannot be undone.`)) return;
        try { const reg = students.find(x => x.id === b.dataset.delst).reg_no; await data.removeMany('payments', payments.filter(p => p.regNo === reg).map(p => p.id)); await data.remove('students', b.dataset.delst); toast('Deleted'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); }
      });
      $('#dc').onchange = () => { up(); wire(); }; up(); wire();
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

/* ---------- testimonials and alumni (public) ---------- */
const isPub = t => t.published === true || t.published === 'true';
export async function testimonialsStrip(n = 3) {
  const t = (await data.list('testimonials')).filter(isPub).slice(0, n); if (!t.length) return '';
  return `<div class="tgrid">${t.map(tcard).join('')}</div>`;
}
const tcard = t => `<article class="card tcard">${t.photo ? `<img class="msg-img" ${data.fileAttr(t.photo, 'src')} alt="${esc(t.name)}" loading="lazy">` : `<span class="msg-img pf-ini" aria-hidden="true">${esc(initials(t.name))}</span>`}
  <div><p style="margin:0 0 8px">&ldquo;${esc(t.message)}&rdquo;</p><b>${esc(t.name)}</b><br><small class="hint">${esc([t.kind, t.setYear, t.now].filter(Boolean).join(' · '))}</small></div></article>`;
export async function vTestimonials() {
  const all = (await data.list('testimonials')).filter(isPub); const kinds = [...new Set(all.map(t => t.kind))];
  return { title: 'Testimonials', nav: 'about', wide: false, html: `<p class="eyebrow">What people say</p><h1 class="h1">Alumni, graduating students and friends of the school</h1>
    ${kinds.length > 1 ? `<div class="roles" id="tk"><a href="#/testimonials" data-k="" aria-current="page">All</a>${kinds.map(k => `<a href="#/testimonials" data-k="${esc(k)}">${esc(k)}</a>`).join('')}</div>` : ''}
    <div class="tgrid" id="tl" style="margin-top:16px">${all.map(t => `<div data-k="${esc(t.kind)}">${tcard(t)}</div>`).join('') || '<p class="hint">Be the first to share your experience below.</p>'}</div>
    <form class="card" id="tf" novalidate style="margin-top:24px"><h2 style="font-size:20px">Share your testimony</h2><p class="hint">Alumni, parents and friends of the school are welcome. The school reviews every message before it appears.</p>
      ${field({ id: 'tname', label: 'Your name' })}
      ${selectField({ id: 'tkind', label: 'You are', options: ['Alumni (past student)', 'Outgoing student (graduating)', 'Parent', 'Visitor / public'].map(x => opt(x, '')).join('') })}
      ${field({ id: 'tyear', label: 'Set or year (optional)', required: false, opt: true })}
      <div class="field" data-field="tmsg"><label for="tmsg">Your testimony</label><textarea class="input" id="tmsg" name="tmsg" required minlength="20" data-msg="Please write at least 20 characters"></textarea><span class="error" id="tmsg-e" role="alert"></span></div>
      <div id="terr" class="error" role="alert"></div><button class="btn" type="submit" style="margin-top:14px">Send for approval</button></form>`,
    bind() {
      $$('#tk a').forEach(a => a.onclick = e => { e.preventDefault(); $$('#tk a').forEach(x => x.removeAttribute('aria-current')); a.setAttribute('aria-current', 'page'); $$('#tl [data-k]').forEach(d => { d.hidden = a.dataset.k && d.dataset.k !== a.dataset.k; }); });
      $('#tf').onsubmit = async e => { e.preventDefault(); const f = e.currentTarget; if (!validate(f)) return;
        try { await data.submitPublic('testimonials', { name: f.tname.value.trim(), kind: f.tkind.value, setYear: f.tyear.value.trim(), message: f.tmsg.value.trim(), published: false, status: 'New' }); f.reset(); toast('Thank you. Your testimony will appear after the school approves it.'); } catch { $('#terr').textContent = 'Could not send. Please try again.'; } };
    } };
}

/* ---------- activities (public pages) ---------- */
const ACT_DEFAULT = {
  'Community service': ['Serving our community', 'Pupils and staff take part in clean-up drives, visits and outreach, learning that education is also about helping others.'],
  'Sports': ['Sports and inter-house competitions', 'Football, athletics, relay and inter-house sports build teamwork, discipline and healthy bodies.'],
  'Phonics and oral class': ['Phonics and oral class', 'Our early readers learn letter sounds, blending and clear spoken English through daily phonics and oral practice.'],
  'School fellowship': ['School fellowship', 'A weekly time of prayer, worship and moral teaching that helps pupils grow in character and faith.'],
  'Music': ['Music', 'Singing, rhythm and instruments help pupils express themselves and perform at school events.'],
  'Excursion': ['Excursions', 'Educational trips take learning outside the classroom to places of interest, with teachers supervising every step.']
};
export const actSlug = k => k.toLowerCase().replace(/[^a-z0-9]+/g, '-');
export async function vActivity(slug) {
  const key = ACTIVITIES.find(k => actSlug(k) === slug);
  if (!key) return { title: 'Activities', nav: 'more', html: `<p class="eyebrow">Activities</p><h1 class="h1">Life outside the classroom</h1><div class="portals" style="margin-top:20px">${ACTIVITIES.map(k => `<a class="portal" href="#/activity/${actSlug(k)}"><span class="ico">${ic('cal')}</span><span><b>${esc(k)}</b><small>${esc(ACT_DEFAULT[k][1].slice(0, 60))}…</small></span></a>`).join('')}</div>` };
  const rec = (await data.list('activities')).find(a => a.key === key) || {}; const d = ACT_DEFAULT[key];
  const album = (await data.list('album')).filter(x => x.image && isImg(x.image) && [x.collection, x.category].some(v => v && v.toLowerCase().includes(key.split(' ')[0].toLowerCase())));
  return { title: key, nav: 'more', html: `<a class="back" href="#/activity">${ic('back')} All activities</a><p class="eyebrow">Activities</p><h1 class="h1">${esc(rec.title || d[0])}</h1>
    ${rec.image ? `<img class="orgimg" style="margin-top:16px" ${data.fileAttr(rec.image, 'src')} alt="${esc(key)}">` : ''}
    <p style="max-width:62ch;margin-top:16px;white-space:pre-wrap">${esc(rec.body || d[1])}</p>${rec.file ? `<p><a class="btn btn-ghost btn-sm" ${data.fileAttr(rec.file)} target="_blank" rel="noopener">${ic('download')} Open ${esc(rec.file.name || 'file')}</a></p>` : ''}
    ${album.length ? `<h2 class="h2s" style="margin-top:24px">${ic('image')} Photos</h2><div class="gallery">${album.map(p => `<figure class="gitem" style="margin:0"><img ${data.fileAttr(p.image, 'src')} alt="${esc(p.title)}" loading="lazy"><span>${esc(p.title)}</span></figure>`).join('')}</div>` : ''}
    <p style="margin-top:24px"><a class="btn" href="#/apply">Apply for admission</a></p>` };
}

/* ---------- live classes ---------- */
export async function vLive(s) {
  const mine = await myStudents(s); const classes = [...new Set(mine.map(x => x.class))]; const staff = s && ['admin', 'teacher'].includes(s.role);
  const all = (await data.list('liveclasses')).filter(x => staff || !classes.length || classes.includes(x.class)).sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const t = new Date().toISOString().slice(0, 10); const up = all.filter(x => (x.date || '') >= t), past = all.filter(x => (x.date || '') < t).reverse();
  const card = x => `<article class="card cur"><div class="row-between"><h3>${esc(x.title)}</h3><span class="pill pill-blue">${esc(x.class)}</span></div><p class="hint" style="margin:4px 0">${esc([x.subject, x.date ? fmtDate(x.date) : '', x.time, x.teacherName].filter(Boolean).join(' · '))}</p>
    ${x.info ? `<p>${esc(x.info)}</p>` : ''}<a class="btn btn-sm" href="#/live/${encodeURIComponent(x.id)}">${ic('monitor')} Enter classroom</a></article>`;
  return { title: 'Live classes', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Online class</p><h1 class="h1">Live classes</h1>
    ${staff ? `<p><a class="btn btn-sm" href="#/manage/liveclasses/new">${ic('plus')} Schedule a live class</a> <a class="btn btn-ghost btn-sm" href="#/manage/liveclasses">Manage</a></p>` : ''}
    <h2 class="h2s" style="margin-top:18px">Upcoming and today</h2><div class="curlist">${up.map(card).join('') || '<p class="hint">No live class is scheduled yet.</p>'}</div>
    ${past.length ? `<h2 class="h2s" style="margin-top:24px">Earlier classes</h2><div class="curlist">${past.slice(0, 10).map(card).join('')}</div>` : ''}` };
}
export async function vLiveRoom(id, s) {
  const lc = (await data.list('liveclasses')).find(x => x.id === id);
  if (!lc) return { title: 'Live class', nav: 'home', html: `<a class="back" href="#/p/live">${ic('back')} Live classes</a><p>That class was not found.</p>` };
  const [nbs, lns] = await Promise.all([data.list('notebooks'), data.list('lessonNotes')]);
  const q = (lc.noteTitle || lc.title || '').toLowerCase();
  const match = [...nbs, ...lns].filter(n => n.class === lc.class && (!lc.subject || n.subject === lc.subject) && (n.title || '').toLowerCase().includes(q.slice(0, 40)) && q);
  const room = 'AllAgesCollege-' + String(lc.id).replace(/[^A-Za-z0-9]/g, '').slice(-20); const name = encodeURIComponent((s && s.name) || 'Guest');
  const link = lc.link || `https://meet.jit.si/${room}`; const key = 'aac.mynotes.' + lc.id; let mine = ''; try { mine = localStorage.getItem(key) || ''; } catch { /* ignore */ }
  return { title: lc.title, nav: 'home', wide: true, html: `<div class="sect" style="padding-top:12px"><a class="back" href="#/p/live">${ic('back')} Live classes</a>
    <div class="row-between"><div><p class="eyebrow">${esc(lc.class)} · ${esc(lc.subject)}</p><h1 class="h1" style="font-size:26px">${esc(lc.title)}</h1></div><a class="btn btn-sm" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${ic('monitor')} Open video class in a new tab</a></div>
    <div class="liveg"><section>${lc.link ? `<div class="card"><p>This class uses its own meeting link. Press the button above to join, then come back to this page to follow the lesson note.</p></div>` : `<iframe class="liveframe" title="Live class video" allow="camera; microphone; fullscreen; display-capture" src="https://meet.jit.si/${room}#userInfo.displayName=%22${name}%22"></iframe><p class="hint">If the video does not load here, use the button above.</p>`}
      <div class="card" style="margin-top:14px"><h2 class="h2s">${ic('book')} My notebook (write while the teacher explains)</h2><textarea class="input" id="mynote" rows="9" placeholder="Type your notes here. They are saved on this device.">${esc(mine)}</textarea>
      <div class="row-between" style="margin-top:10px;justify-content:flex-start;gap:10px"><button class="btn btn-ghost btn-sm" id="dlnote" type="button">${ic('download')} Download my notes</button><span class="hint" id="nsaved"></span></div></div></section>
    <aside><div class="card"><h2 class="h2s">${ic('list')} Today's note</h2>${match.length ? match.map(n => `<div class="nb"><h3 style="margin:8px 0">${esc(n.title)}</h3>${mdToHtml(n.body)}${n.file ? `<p><a class="link" ${data.fileAttr(n.file)} target="_blank" rel="noopener">${ic('file')} ${esc(n.file.name || 'File')}</a></p>` : ''}</div>`).join('<hr>') : `<p class="hint">No lesson note or notebook is linked to this class yet. ${s && ['admin', 'teacher'].includes(s.role) ? 'Add one in Notebooks with the same class, subject and topic, then type the topic in the class setup.' : 'Your teacher will share it.'}</p>`}
      ${lc.info ? `<p class="hint">${esc(lc.info)}</p>` : ''}</div></aside></div></div>`,
    bind() {
      const ta = $('#mynote'); let t; ta.oninput = () => { clearTimeout(t); t = setTimeout(() => { try { localStorage.setItem(key, ta.value); $('#nsaved').textContent = 'Saved'; } catch { $('#nsaved').textContent = 'Could not save on this device'; } }, 500); };
      $('#dlnote').onclick = () => download(`my-notes-${lc.subject}-${lc.title}.txt`.replace(/\s+/g, '-'), `${lc.class} · ${lc.subject} · ${lc.title}\n\n${ta.value}`);
    } };
}

/* ---------- practice questions ---------- */
export async function vPractice(s) {
  const mine = await myStudents(s); const all = await data.list('questions'); const start = (mine[0] && mine[0].class) || 'JSS 1';
  return { title: 'Practice questions', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Assessment</p><h1 class="h1">Practice questions</h1>
    <p class="lead">Practise by class, subject and topic. Objective questions are marked for you. Real past papers uploaded by the school are in the Library under "Past questions".</p>
    <div class="grid2" style="margin-top:14px"><div class="field"><label for="pc">Class</label>${classSelect('pc', start)}</div><div class="field"><label for="ps">Subject</label><select class="input" id="ps"></select></div></div>
    <div class="field"><label for="pt2">Topic</label><select class="input" id="pt2"></select></div><div id="pq" style="margin-top:14px"></div>`,
    bind() {
      const inClass = () => all.filter(x => x.class === $('#pc').value);
      const subs = () => { $('#ps').innerHTML = '<option value="">All subjects</option>' + [...new Set(inClass().map(x => x.subject))].sort().map(x => opt(x, '')).join(''); tops(); };
      const tops = () => { $('#pt2').innerHTML = '<option value="">All topics</option>' + [...new Set(inClass().filter(x => !$('#ps').value || x.subject === $('#ps').value).map(x => x.topic).filter(Boolean))].sort().map(x => opt(x, '')).join(''); draw(); };
      const draw = () => { const L = inClass().filter(x => (!$('#ps').value || x.subject === $('#ps').value) && (!$('#pt2').value || x.topic === $('#pt2').value));
        $('#pq').innerHTML = L.length ? L.map((q, i) => q.type === 'Theory' ? `<article class="card" style="margin-bottom:12px"><b>${i + 1}. ${esc(q.question)}</b><details><summary class="link">Show model answer</summary><p>${esc(q.answer)}</p></details></article>`
          : `<article class="card qcard" style="margin-bottom:12px" data-ans="${esc(String(q.answer).trim().toUpperCase())}"><b>${i + 1}. ${esc(q.question)}</b>${['a', 'b', 'c', 'd'].filter(k => q[k]).map(k => `<label class="check" style="margin-top:8px"><input type="radio" name="q${i}" value="${k.toUpperCase()}"><span>${k.toUpperCase()}. ${esc(q[k])}</span></label>`).join('')}<p class="hint qexp" hidden>${esc(q.explanation || '')}</p></article>`).join('') + `<button class="btn" id="pcheck" type="button">Check my answers</button><p id="pscore" class="h2s" style="margin-top:12px"></p>` : '<p class="hint">No questions for this choice yet.</p>';
        const b = $('#pcheck'); if (b) b.onclick = () => { let ok = 0, n = 0; $$('.qcard').forEach(c => { n++; const sel = c.querySelector('input:checked'); const good = sel && sel.value === c.dataset.ans; if (good) ok++; c.style.borderColor = good ? 'var(--ok)' : 'var(--err)'; c.querySelector('.qexp').hidden = false; c.querySelector('.qexp').textContent = `Correct answer: ${c.dataset.ans}. ${c.querySelector('.qexp').textContent.replace(/^Correct answer: [A-D]\. /, '')}`; }); $('#pscore').textContent = `You scored ${ok} out of ${n}`; }; };
      $('#pc').onchange = subs; $('#ps').onchange = tops; $('#pt2').onchange = draw; subs();
    } };
}

/* ---------- student profile, bio-data and portfolio ---------- */
export async function vProfile(s, regParam) {
  const staff = s && ['admin', 'teacher'].includes(s.role);
  let studs = staff ? (await data.list('students')).filter(x => !regParam || norm(x.reg_no) === norm(regParam)) : await myStudents(s);
  if (staff && !regParam) {
    return { title: 'Student profiles', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Students</p><h1 class="h1">Student profiles</h1>
      <div class="field"><label for="pfq">Search by name or reg. number</label><input class="input" id="pfq" type="search"></div><ul class="mlist" id="pfl" style="margin-top:12px"></ul>`,
      bind() { const draw = () => { const q = $('#pfq').value.toLowerCase(); $('#pfl').innerHTML = studs.filter(x => (x.name + x.reg_no).toLowerCase().includes(q)).slice(0, 60).map(x => `<li class="mrow"><div class="mrow-main"><b>${esc(x.name)}</b><span>${esc(x.reg_no)} · ${esc(x.class)}</span></div><a class="btn btn-ghost btn-sm" href="#/p/profile/${encodeURIComponent(x.reg_no)}">Open</a></li>`).join('') || '<li class="hint">No match.</li>'; }; $('#pfq').oninput = draw; draw(); } };
  }
  const [bios, items] = await Promise.all([data.list('bios'), data.list('portfolio')]);
  const canEdit = s && s.role === 'student';
  const blocks = studs.map(st => {
    const bio = bios.find(b => norm(b.regNo) === norm(st.reg_no)) || {}; const mine = items.filter(i => norm(i.regNo) === norm(st.reg_no)).sort((a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || '')));
    const row = (k, v) => v ? `<div><span>${k}</span><b>${esc(v)}</b></div>` : '';
    return `<section class="card" style="margin-top:18px" data-reg="${esc(st.reg_no)}"><div class="profhead">${bio.photo ? `<img class="msg-img" ${data.fileAttr(bio.photo, 'src')} alt="${esc(st.name)}">` : `<span class="msg-img pf-ini">${esc(initials(st.name))}</span>`}<div><h2 style="font-size:22px">${esc(st.name)}</h2><span class="hint">${esc(st.reg_no)} · ${esc(st.class)}</span></div></div>
      <h3 class="fsec">Bio-data</h3><div class="meta">${row('Gender', st.gender)}${row('Class', st.class)}${row('Parent or guardian', st.parentName)}${row('Parent phone', st.parentPhone)}${row('Parent ID', st.parentId)}${row('Date of birth', bio.dob ? fmtDate(bio.dob) : '')}${row('Home address', bio.address)}${row('Favourite subject', bio.favSubject)}${row('Hobbies', bio.hobbies)}${row('Ambition', bio.ambition)}</div>
      ${bio.about ? `<p style="margin-top:12px">${esc(bio.about)}</p>` : ''}
      ${canEdit ? `<details class="note" style="margin-top:14px"><summary><b>Edit my bio-data</b></summary><form class="bioform" data-reg="${esc(st.reg_no)}">
        <div class="grid2"><div class="field"><label>Date of birth</label><input class="input" name="dob" type="date" value="${esc(bio.dob || '')}"></div><div class="field"><label>Favourite subject</label><input class="input" name="favSubject" value="${esc(bio.favSubject || '')}"></div>
        <div class="field"><label>Hobbies</label><input class="input" name="hobbies" value="${esc(bio.hobbies || '')}"></div><div class="field"><label>Ambition (what I want to become)</label><input class="input" name="ambition" value="${esc(bio.ambition || '')}"></div></div>
        <div class="field"><label>Home address</label><input class="input" name="address" value="${esc(bio.address || '')}"></div><div class="field"><label>About me</label><textarea class="input" name="about">${esc(bio.about || '')}</textarea></div>
        <div class="field"><label>My picture (jpg, png)</label><input class="input" name="photo" type="file" accept="image/*"></div><div class="error berr" role="alert"></div><button class="btn" type="submit" style="margin-top:12px">Save my profile</button></form></details>` : ''}
      <h3 class="fsec">Portfolio (my work, projects, awards and certificates)</h3>
      <div class="curlist">${mine.map(i => `<article class="card cur"><div class="row-between"><h3>${esc(i.title)}</h3><span class="pill pill-blue">${esc(i.category || 'Work')}</span></div><p class="hint">${esc(i.date ? fmtDate(i.date) : '')}</p>${i.description ? `<p>${esc(i.description)}</p>` : ''}
        ${i.file ? (isImg(i.file) ? `<img class="ann-img" ${data.fileAttr(i.file, 'src')} alt="${esc(i.title)}" loading="lazy">` : '') + `<a class="btn btn-ghost btn-sm" ${data.fileAttr(i.file)} target="_blank" rel="noopener">${ic('download')} Open ${esc(i.file.name || 'file')}</a>` : ''}
        ${canEdit ? `<button class="btn btn-ghost btn-sm" data-delitem="${esc(i.id)}" type="button" aria-label="Delete ${esc(i.title)}">${ic('trash')}</button>` : ''}</article>`).join('') || '<p class="hint">Nothing in the portfolio yet.</p>'}</div>
      ${canEdit ? `<details class="note" style="margin-top:14px"><summary><b>Add to my portfolio</b></summary><form class="itemform" data-reg="${esc(st.reg_no)}"><div class="field"><label>Title</label><input class="input" name="title" required></div>
        <div class="field"><label>Type</label><select class="input" name="category">${['Project', 'Assignment', 'Award', 'Certificate', 'Artwork', 'Writing', 'Other'].map(x => `<option>${x}</option>`).join('')}</select></div>
        <div class="field"><label>Description</label><textarea class="input" name="description"></textarea></div><div class="field"><label>File (picture, pdf, doc)</label><input class="input" name="file" type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"></div>
        <div class="error ierr" role="alert"></div><button class="btn" type="submit" style="margin-top:12px">Add</button></form></details>` : ''}</section>`; }).join('');
  return { title: 'My profile', nav: 'home', html: `<a class="back" href="#/${staff ? 'p/profile' : 'dashboard'}">${ic('back')} ${staff ? 'All students' : 'Dashboard'}</a><p class="eyebrow">Profile</p><h1 class="h1">${canEdit ? 'My profile and portfolio' : 'Profile and portfolio'}</h1>${blocks || '<div class="card" style="margin-top:18px"><p>No student is linked to this account yet. Please call the school office.</p></div>'}`,
    bind() {
      $$('.bioform').forEach(f => f.onsubmit = async e => { e.preventDefault(); const reg = f.dataset.reg; const old = bios.find(b => norm(b.regNo) === norm(reg)) || {}; const btn = f.querySelector('button'); btn.disabled = true;
        try { const rec = { ...old, id: 'bio-' + norm(reg), regNo: reg }; ['dob', 'favSubject', 'hobbies', 'ambition', 'address', 'about'].forEach(k => { rec[k] = f.elements[k].value.trim(); });
          if (f.elements.photo.files[0]) rec.photo = await data.uploadFile(f.elements.photo.files[0], 'portfolio'); await data.save('bios', rec); toast('Profile saved'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (err) { f.querySelector('.berr').textContent = err.message; btn.disabled = false; } });
      $$('.itemform').forEach(f => f.onsubmit = async e => { e.preventDefault(); const btn = f.querySelector('button'); btn.disabled = true;
        try { const rec = { regNo: f.dataset.reg, title: f.elements.title.value.trim(), category: f.elements.category.value, description: f.elements.description.value.trim(), date: new Date().toISOString().slice(0, 10) };
          if (f.elements.file.files[0]) rec.file = await data.uploadFile(f.elements.file.files[0], 'portfolio'); await data.save('portfolio', rec); toast('Added'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (err) { f.querySelector('.ierr').textContent = err.message; btn.disabled = false; } });
      $$('[data-delitem]').forEach(b => b.onclick = async () => { if (!confirm('Remove this from the portfolio?')) return; try { await data.remove('portfolio', b.dataset.delitem); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); } });
    } };
}

/* ---------- community rooms (students, teachers, PTA, weekly corner) ---------- */
const cr = s => s ? s.role : '';
async function myClasses(s) { return [...new Set((await myStudents(s)).map(x => x.class))]; }
export async function vCommunity(s) {
  const role = cr(s); const classes = role === 'student' ? await myClasses(s) : role === 'admin' || role === 'teacher' ? CLASSES : [];
  const rooms = (await data.list('rooms')); const members = await data.list('members');
  const fixed = [];
  if (['student', 'teacher', 'admin'].includes(role)) classes.forEach(c => fixed.push([`room-class-${c}`, `${c} class room`, 'Class discussion, assignments and projects']));
  if (['teacher', 'admin'].includes(role)) fixed.push(['room-teachers', 'Teachers forum', 'Teachers and staff only']);
  if (['parent', 'teacher', 'admin'].includes(role)) fixed.push(['room-pta', 'PTA forum', 'Parents, teachers and the PTA committee']);
  const mine = new Set(members.filter(m => m.userId === s.id).map(m => m.room));
  const visible = rooms.filter(r => ['admin', 'teacher'].includes(role) || (role === 'student' && (!r.class || classes.includes(r.class))) || mine.has(r.id));
  const row = (id, name, d, extra = '') => `<li class="mrow"><span class="mthumb mthumb-ic">${ic('people')}</span><div class="mrow-main"><b>${esc(name)}</b><span>${esc(d)}</span></div><div class="mrow-actions">${extra}<a class="btn btn-ghost btn-sm" href="#/room/${encodeURIComponent(id)}">Open</a></div></li>`;
  return { title: 'Community', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Community</p><h1 class="h1">Community rooms</h1>
    <ul class="mlist" style="margin-top:16px">${fixed.map(f => row(...f)).join('') || '<li class="hint">No fixed rooms for this account.</li>'}</ul>
    ${['student', 'teacher', 'admin'].includes(role) ? `<h2 class="h2s" style="margin-top:26px">${ic('star')} Groups: assignments and projects</h2>
    <ul class="mlist">${visible.map(r => row(r.id, r.name, `${r.kind} · ${r.class || 'All classes'} · by ${r.ownerName || ''} · ${members.filter(m => m.room === r.id).length} member(s)`, mine.has(r.id) || ['admin'].includes(role) ? '' : `<button class="btn btn-sm" data-join="${esc(r.id)}" type="button">Join</button>`)).join('') || '<li class="hint">No groups yet. Create one below.</li>'}</ul>
    <form class="card" id="rf" style="margin-top:16px"><h3 style="margin-bottom:6px">Create a group</h3><div class="field" style="margin-top:0"><label for="rn">Group name</label><input class="input" id="rn" required placeholder="Example: JSS 2 science project"></div>
      <div class="grid2"><div class="field"><label for="rk">Purpose</label><select class="input" id="rk"><option>Class discussion</option><option>Assignment group</option><option>Project group</option></select></div><div class="field"><label for="rc">Class</label><select class="input" id="rc"><option value="">All classes</option>${(role === 'student' ? classes : CLASSES).map(c => opt(c, role === 'student' ? classes[0] : '')).join('')}</select></div></div>
      <button class="btn" type="submit" style="margin-top:12px">Create group</button></form>` : ''}`,
    bind() {
      const f = $('#rf'); if (f) f.onsubmit = async e => { e.preventDefault(); const id = 'rm-' + Date.now().toString(36); try { await data.save('rooms', { id, name: $('#rn').value.trim(), kind: $('#rk').value, class: $('#rc').value, ownerId: s.id, ownerName: s.name }); await data.save('members', { id: `mem-${id}-${s.id}`, room: id, userId: s.id, name: s.name, role }); toast('Group created'); location.hash = '#/room/' + id; } catch (err) { toast(err.message); } };
      $$('[data-join]').forEach(b => b.onclick = async () => { try { await data.save('members', { id: `mem-${b.dataset.join}-${s.id}`, room: b.dataset.join, userId: s.id, name: s.name, role }); toast('Joined'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (err) { toast(err.message); } });
    } };
}
export async function vRoom(id, s) {
  const [posts, rooms, members, weekly] = await Promise.all([data.listBy('forum', 'room', id), data.list('rooms'), data.list('members'), id.startsWith('weekly-') ? data.list('weekly') : []]);
  const meta = id === 'room-teachers' ? ['Teachers forum', 'Teachers and staff only'] : id === 'room-pta' ? ['PTA forum', 'Parents, teachers and PTA committee'] : id.startsWith('room-class-') ? [id.slice(11) + ' class room', 'Class discussion, assignments and projects'] : id.startsWith('weekly-') ? ['Weekly corner', 'Everyone contributes'] : [(rooms.find(r => r.id === id) || {}).name || 'Group', 'Group room'];
  const wk = weekly.find(w => 'weekly-' + w.id === id); const isCustom = id.startsWith('rm-'); const joined = members.some(m => m.room === id && m.userId === s.id);
  const tops = posts.filter(p => p.kind !== 'reply').sort((a, b) => String(b._created).localeCompare(String(a._created))); const reps = posts.filter(p => p.kind === 'reply');
  const canDel = p => p.authorId === s.id || ['admin', 'teacher'].includes(s.role);
  const msg = p => `<div class="post"><div class="row-between"><b>${esc(p.authorName || 'Member')} <small class="hint">${esc(p.role || '')}${p.class ? ' · ' + esc(p.class) : ''}</small></b><small class="hint">${fmtDate(p._created)}</small></div>${p.title ? `<h3 style="margin:4px 0">${esc(p.title)}</h3>` : ''}<p style="white-space:pre-wrap;margin:6px 0">${esc(p.body)}</p>
    ${p.file ? (isImg(p.file) ? `<img class="ann-img" ${data.fileAttr(p.file, 'src')} alt="" loading="lazy">` : `<a class="link" ${data.fileAttr(p.file)} target="_blank" rel="noopener">${ic('file')} ${esc(p.file.name || 'File')}</a>`) : ''}${canDel(p) ? ` <button class="btn btn-ghost btn-sm" data-delp="${esc(p.id)}" type="button" aria-label="Delete">${ic('trash')}</button>` : ''}</div>`;
  const back = id.startsWith('weekly-') ? '#/p/weekly' : id === 'room-pta' ? '#/p/pta' : '#/p/community';
  const needJoin = isCustom && !joined && s.role !== 'admin' && s.role !== 'teacher';
  return { title: meta[0], nav: 'home', html: `<a class="back" href="${back}">${ic('back')} Back</a><p class="eyebrow">${esc(meta[1])}</p><h1 class="h1">${esc(wk ? wk.title : meta[0])}</h1>
    ${wk ? `<div class="card" style="margin-top:12px"><p class="eyebrow" style="margin:0 0 6px">${esc(wk.kind)}</p><p style="white-space:pre-wrap;margin:0">${esc(wk.body)}</p>${wk.file ? `<p><a class="link" ${data.fileAttr(wk.file)} target="_blank" rel="noopener">${ic('file')} ${esc(wk.file.name || 'File')}</a></p>` : ''}</div>` : ''}
    ${needJoin ? `<div class="card" style="margin-top:16px"><p>Join this group to read and write.</p><button class="btn" id="joinb" type="button">Join group</button></div>` : `
    <form class="card" id="pf" style="margin-top:16px"><div class="field" style="margin-top:0"><label for="pt3">${wk ? 'My contribution' : 'Message'}</label><textarea class="input" id="pt3" required placeholder="${wk ? 'Share your answer or idea' : 'Write your message'}"></textarea></div>
      <div class="field"><label for="pfile">Attach a picture or file (optional)</label><input class="input" id="pfile" type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"></div><div class="error" id="perr2" role="alert"></div><button class="btn" type="submit" style="margin-top:12px">Post</button></form>
    <div class="posts" style="margin-top:18px">${tops.map(p => `<article class="card" style="margin-bottom:12px">${msg(p)}<div class="replies">${reps.filter(r => r.parent === p.id).sort((a, b) => String(a._created).localeCompare(String(b._created))).map(msg).join('')}</div>
      <form class="repf" data-p="${esc(p.id)}"><input class="input" placeholder="Write a reply" required><button class="btn btn-ghost btn-sm" type="submit">Reply</button></form></article>`).join('') || '<p class="hint">No messages yet. Be the first to write.</p>'}</div>`}`,
    bind() {
      const j = $('#joinb'); if (j) j.onclick = async () => { await data.save('members', { id: `mem-${id}-${s.id}`, room: id, userId: s.id, name: s.name, role: s.role }); window.dispatchEvent(new HashChangeEvent('hashchange')); };
      const base = { room: id, authorId: s.id, authorName: s.name, role: s.role, class: s.role === 'student' ? (posts.find(x => x.authorId === s.id) || {}).class || '' : '' };
      const f = $('#pf'); if (f) f.onsubmit = async e => { e.preventDefault(); const btn = f.querySelector('button'); btn.disabled = true; try { const rec = { ...base, kind: 'post', body: $('#pt3').value.trim() }; const fl = $('#pfile').files[0]; if (fl) rec.file = await data.uploadFile(fl, 'community'); await data.save('forum', rec); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (err) { $('#perr2').textContent = err.message; btn.disabled = false; } };
      $$('.repf').forEach(rf => rf.onsubmit = async e => { e.preventDefault(); try { await data.save('forum', { ...base, kind: 'reply', parent: rf.dataset.p, body: rf.querySelector('input').value.trim() }); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (err) { toast(err.message); } });
      $$('[data-delp]').forEach(b => b.onclick = async () => { if (!confirm('Delete this message?')) return; try { await data.remove('forum', b.dataset.delp); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (err) { toast(err.message); } });
    } };
}

/* ---------- PTA: meetings, committee (parents and school organogram), forum ---------- */
export async function vPTA(s) {
  const [meets, mem] = await Promise.all([data.list('ptameetings'), data.list('ptamembers')]); const t = new Date().toISOString().slice(0, 10);
  const up = meets.filter(m => (m.date || '') >= t).sort((a, b) => String(a.date).localeCompare(b.date)); const past = meets.filter(m => (m.date || '') < t).sort((a, b) => String(b.date).localeCompare(a.date));
  const card = m => { const room = 'AllAgesPTA-' + String(m.id).replace(/[^A-Za-z0-9]/g, '').slice(-16); const virtual = /virtual|both/i.test(m.mode || ''); const link = m.link || (virtual ? `https://meet.jit.si/${room}` : '');
    return `<article class="card cur"><div class="row-between"><h3>${esc(m.title)}</h3><span class="pill pill-blue">${esc(m.mode || 'Physical')}</span></div><p class="hint">${esc(fmtDate(m.date))} ${esc(m.time || '')}${m.venue ? ' · ' + esc(m.venue) : ''}</p>${m.agenda ? `<p style="white-space:pre-wrap">${esc(m.agenda)}</p>` : ''}
      <div class="row-between" style="justify-content:flex-start;gap:8px">${link ? `<a class="btn btn-sm" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${ic('monitor')} Join online meeting</a>` : ''}${m.minutes ? `<a class="btn btn-ghost btn-sm" ${data.fileAttr(m.minutes)} target="_blank" rel="noopener">${ic('file')} Minutes</a>` : ''}</div></article>`; };
  const people = mem.sort((a, b) => String(a.type).localeCompare(b.type));
  const grp = (title, L) => L.length ? `<h3 class="fsec">${title}</h3><ul class="pf-row" style="flex-wrap:wrap">${L.map(p => `<li class="pf" style="flex:0 0 150px">${p.photo ? `<img class="pf-img" ${data.fileAttr(p.photo, 'src')} alt="${esc(p.name)}" loading="lazy">` : `<span class="pf-img pf-ini">${esc(initials(p.name))}</span>`}<b>${esc(p.name)}</b><span class="pf-pos">${esc(p.role)}</span></li>`).join('')}</ul>` : '';
  return { title: 'PTA', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Parents and teachers</p><h1 class="h1">PTA</h1>
    <p><a class="btn" href="#/room/room-pta">${ic('people')} Open the PTA forum</a> ${s.role === 'admin' ? `<a class="btn btn-ghost btn-sm" href="#/manage/ptameetings">Manage meetings</a> <a class="btn btn-ghost btn-sm" href="#/manage/ptamembers">Manage committee</a>` : ''}</p>
    <h2 class="h2s" style="margin-top:20px">${ic('cal')} Upcoming meetings</h2><div class="curlist">${up.map(card).join('') || '<p class="hint">No meeting scheduled.</p>'}</div>
    ${grp('PTA committee: parents', people.filter(p => p.type === 'Parent'))}${grp('School representatives (organogram)', people.filter(p => p.type !== 'Parent'))}
    ${past.length ? `<h2 class="h2s" style="margin-top:24px">Past meetings and minutes</h2><div class="curlist">${past.slice(0, 8).map(card).join('')}</div>` : ''}` };
}

/* ---------- weekly engagement corner ---------- */
export async function vWeekly(s) {
  const mine = await myClasses(s); const all = (await data.list('weekly')).filter(w => ['admin', 'teacher'].includes(s.role) || !w.class || mine.includes(w.class)).sort((a, b) => String(b.date || b._created).localeCompare(String(a.date || a._created)));
  const posts = await data.list('forum'); const n = id => posts.filter(p => p.room === 'weekly-' + id).length;
  return { title: 'Weekly corner', nav: 'home', html: `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a><p class="eyebrow">Everyone takes part</p><h1 class="h1">Weekly engagement corner</h1>
    <p class="lead">A question or curriculum activity for the whole school each week. Students and teachers contribute their answers and ideas.</p>
    ${['admin', 'teacher'].includes(s.role) ? `<p><a class="btn btn-sm" href="#/manage/weekly/new">${ic('plus')} Post this week's question or activity</a></p>` : ''}
    <div class="curlist" style="margin-top:14px">${all.map((w, i) => `<article class="card cur"><div class="row-between"><h3>${esc(w.title)}</h3><span class="pill ${i ? '' : 'pill-ok'}">${i ? esc(fmtDate(w.date)) : 'This week'}</span></div><p class="eyebrow" style="margin:6px 0">${esc(w.kind)}${w.class ? ' · ' + esc(w.class) : ''}</p><p style="white-space:pre-wrap">${esc(w.body)}</p>
      ${['student', 'teacher', 'admin'].includes(s.role) ? `<a class="btn btn-sm" href="#/room/weekly-${encodeURIComponent(w.id)}">${ic('people')} Contribute and read (${n(w.id)})</a>` : ''}</article>`).join('') || '<p class="hint">Nothing posted yet.</p>'}</div>` };
}

/* ---------- celebrations and honours (public) ---------- */
const hcard = h => `<article class="card tcard">${h.photo ? `<img class="msg-img" ${data.fileAttr(h.photo, 'src')} alt="${esc(h.name)}" loading="lazy">` : `<span class="msg-img pf-ini">${esc(initials(h.name))}</span>`}<div><span class="pill">${esc(h.kind)}</span><h3 style="margin:6px 0 2px">${esc(h.name)}</h3><small class="hint">${esc([h.class, h.period].filter(Boolean).join(' · '))}</small>${h.message ? `<p style="margin:8px 0 0">${esc(h.message)}</p>` : ''}</div></article>`;
export async function honoursStrip(n = 3) { const h = (await data.list('honours')).sort((a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || ''))).slice(0, n); return h.length ? `<div class="tgrid">${h.map(hcard).join('')}</div>` : ''; }
export async function vCelebrations() {
  const all = (await data.list('honours')).sort((a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || ''))); const kinds = [...new Set(all.map(h => h.kind))];
  return { title: 'Celebrations', nav: 'about', html: `<p class="eyebrow">Celebrating our people</p><h1 class="h1">Celebrants and school honours</h1>
    ${kinds.length > 1 ? `<div class="roles" id="hk"><a href="#/celebrations" data-k="" aria-current="page">All</a>${kinds.map(k => `<a href="#/celebrations" data-k="${esc(k)}">${esc(k)}</a>`).join('')}</div>` : ''}
    <div class="tgrid" style="margin-top:16px">${all.map(h => `<div data-k="${esc(h.kind)}">${hcard(h)}</div>`).join('') || '<p class="hint">Nothing announced yet.</p>'}</div>`,
    bind() { $$('#hk a').forEach(a => a.onclick = e => { e.preventDefault(); $$('#hk a').forEach(x => x.removeAttribute('aria-current')); a.setAttribute('aria-current', 'page'); $$('.tgrid [data-k]').forEach(d => { d.hidden = a.dataset.k && d.dataset.k !== a.dataset.k; }); }); } };
}

/* ---------- bell alerts ---------- */
const daysTo = d => Math.round((new Date(d + 'T00:00:00') - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00')) / 864e5);
export async function getAlerts(s) {
  const out = []; if (!s) return out; const today = new Date().toISOString().slice(0, 10); const role = s.role;
  const anns = (await announcementsFor(s)).filter(a => a.mandatory);
  anns.forEach(a => out.push({ key: 'ann-' + a.id, level: 'must', icon: 'mega', text: `Mandatory notice: ${a.title}`, sub: String(a.body || '').slice(0, 140), href: '#/announcements' }));
  if (['student', 'parent'].includes(role)) {
    const [studs, fees, pays] = await Promise.all([myStudents(s), data.list('fees'), data.list('payments')]);
    studs.forEach(st => {
      data.feeLines(st, fees, pays).forEach(l => {
        const due = l.fee.due; const first = (st.name || '').split(' ')[0];
        if (l.balance > 0 && due) { const d = daysTo(due); if (d < 0) out.push({ key: `late-${l.fee.id}-${st.reg_no}-${today}`, level: 'late', icon: 'wallet', text: `Late payment: ${first}, ${l.fee.title}`, sub: `${money(l.balance)} was due ${fmtDate(due)} (${-d} day(s) ago)`, href: '#/p/pay' }); else if (d <= 7) out.push({ key: `due-${l.fee.id}-${st.reg_no}`, level: 'due', icon: 'wallet', text: `Payment due ${d === 0 ? 'today' : 'in ' + d + ' day(s)'}: ${first}, ${l.fee.title}`, sub: `${money(l.balance)} outstanding`, href: '#/p/pay' }); }
        else if (l.balance > 0 && !l.paid && !l.pending) out.push({ key: `unpaid-${l.fee.id}-${st.reg_no}`, level: 'due', icon: 'wallet', text: `Unpaid: ${first}, ${l.fee.title}`, sub: `${money(l.balance)} outstanding`, href: '#/p/pay' });
      });
      pays.filter(p => norm(p.regNo) === norm(st.reg_no) && ['Pending', 'Rejected'].includes(p.status)).forEach(p => out.push({ key: `pay-${p.id}-${p.status}`, level: p.status === 'Rejected' ? 'late' : 'info', icon: 'card', text: p.status === 'Rejected' ? `Payment rejected: ${p.feeTitle || 'fee'} (${st.name})` : `Payment awaiting confirmation: ${p.feeTitle || 'fee'} (${st.name})`, sub: `Receipt ${p.receipt}`, href: '#/receipt/' + encodeURIComponent(p.receipt) }));
    });
    const classes = [...new Set(studs.map(x => x.class))];
    const [lcs, asg, tst] = await Promise.all([data.list('liveclasses'), data.list('assignments'), data.list('tests')]);
    lcs.filter(l => classes.includes(l.class) && l.date && daysTo(l.date) >= 0 && daysTo(l.date) <= 1).forEach(l => out.push({ key: 'live-' + l.id, level: 'due', icon: 'monitor', text: `Live class ${daysTo(l.date) === 0 ? 'today' : 'tomorrow'}: ${l.subject}, ${l.title}`, sub: l.time || '', href: '#/live/' + encodeURIComponent(l.id) }));
    lcs.filter(l => classes.includes(l.class) && l.date === today).length || 0;
    asg.filter(a => classes.includes(a.class) && a.due).forEach(a => { const d = daysTo(a.due); if (d < 0 && d >= -7) out.push({ key: `asgl-${a.id}-${today}`, level: 'late', icon: 'task', text: `Assignment past due date: ${a.subject}, ${a.title}`, sub: `Was due ${fmtDate(a.due)}`, href: '#/p/assignments' }); else if (d >= 0 && d <= 3) out.push({ key: 'asg-' + a.id, level: 'due', icon: 'task', text: `Assignment due ${d === 0 ? 'today' : 'in ' + d + ' day(s)'}: ${a.subject}, ${a.title}`, sub: '', href: '#/p/assignments' }); });
    tst.filter(t => classes.includes(t.class) && t.date && daysTo(t.date) >= 0 && daysTo(t.date) <= 3).forEach(t => out.push({ key: 'test-' + t.id, level: 'due', icon: 'form', text: `${t.kind || 'Test'} ${daysTo(t.date) === 0 ? 'today' : 'in ' + daysTo(t.date) + ' day(s)'}: ${t.subject}, ${t.title}`, sub: t.time || '', href: '#/p/tests' }));
  }
  if (['admin', 'bursar'].includes(role)) { const pend = (await data.list('payments')).filter(p => p.status === 'Pending'); const n = new Set(pend.map(p => p.receipt)).size; if (n) out.push({ key: 'pend-' + n, level: 'due', icon: 'wallet', text: `${n} payment(s) waiting for your confirmation`, sub: '', href: '#/p/pay' }); }
  if (role === 'admin') { const apps = (await data.list('applications')).filter(a => (a.status || 'New') === 'New'); if (apps.length) out.push({ key: 'apps-' + apps.length, level: 'info', icon: 'form', text: `${apps.length} new admission application(s)`, sub: '', href: '#/manage/applications' }); const tt = (await data.list('testimonials')).filter(t => !isPub(t)); if (tt.length) out.push({ key: 'tt-' + tt.length, level: 'info', icon: 'star', text: `${tt.length} testimonial(s) waiting for approval`, sub: '', href: '#/manage/testimonials' }); }
  const order = { must: 0, late: 1, due: 2, info: 3 }; return out.sort((a, b) => order[a.level] - order[b.level]);
}
const aSeen = () => { try { return JSON.parse(localStorage.getItem('aac.alertseen') || '{}'); } catch { return {}; } };
export async function unreadCount(s) { const sn = aSeen(); const a = (await getAlerts(s)).filter(x => !sn[x.key]).length; const r = (await data.getReplies()).filter(m => m.unread).length; return a + r; }
export async function vAlerts(s) {
  const alerts = await getAlerts(s); const replies = await data.getReplies(); const sn = aSeen();
  const lvl = { must: ['Mandatory', 'pill-red'], late: ['Late', 'pill-red'], due: ['Due', ''], info: ['Info', 'pill-blue'] };
  return { title: 'Alerts', nav: 'more', html: `<p class="eyebrow">Bell</p><h1 class="h1">Alerts and replies</h1>
    ${s ? '' : '<p class="lead">Sign in to see payment, class and school instructions meant for you.</p>'}
    <ul class="mlist" style="margin-top:16px">${alerts.map(a => `<li class="mrow ${sn[a.key] ? '' : 'reply-new'}"><span class="mthumb mthumb-ic">${ic(a.icon)}</span><div class="mrow-main"><b>${esc(a.text)}</b><span>${esc(a.sub)}</span></div><div class="mrow-actions"><span class="pill ${lvl[a.level][1]}">${lvl[a.level][0]}</span><a class="btn btn-ghost btn-sm" href="${a.href}">Open</a></div></li>`).join('') || (s ? '<li class="hint">You are up to date. Nothing needs your attention.</li>' : '')}</ul>
    <h2 class="h2s" style="margin-top:26px">${ic('mail')} Replies to my messages</h2>
    <div class="anns">${replies.map(m => `<article class="card reply ${m.unread ? 'reply-new' : ''}"><div class="row-between"><b>${esc(m.type)} · ${esc(m.ref)}</b><span class="pill ${m.status === 'Resolved' ? 'pill-ok' : ''}">${esc(m.status)}${m.unread ? ' · New reply' : ''}</span></div><p class="hint" style="margin:8px 0">Your message: ${esc(String(m.message || '').slice(0, 200))}</p>${m.adminNote ? `<div class="ok-box"><p class="eyebrow" style="color:var(--ok);margin-bottom:6px">Reply from the school</p><p style="margin:0">${esc(m.adminNote)}</p></div>` : '<p class="hint">No reply yet.</p>'}</article>`).join('') || '<p class="hint">No messages tracked on this device. <a class="link" href="#/feedback">Write to the school</a>.</p>'}</div>
    <form class="card" id="refForm" style="margin-top:18px"><div class="field" style="margin-top:0"><label for="refIn">Have a reference number from another phone?</label><input class="input" id="refIn" placeholder="Example: FB-1A2B3C4D"></div><button class="btn btn-navy btn-sm" style="margin-top:12px" type="submit">Track it</button></form>`,
    bind() { const n = aSeen(); alerts.forEach(a => { n[a.key] = 1; }); try { localStorage.setItem('aac.alertseen', JSON.stringify(n)); } catch { /* ignore */ } data.markRepliesSeen(replies); window.dispatchEvent(new Event('aac:replies'));
      $('#refForm').onsubmit = e => { e.preventDefault(); data.trackRef($('#refIn').value); window.dispatchEvent(new HashChangeEvent('hashchange')); }; } };
}
