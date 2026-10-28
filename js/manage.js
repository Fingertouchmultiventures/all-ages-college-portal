// Generic manager: list, add, edit, delete, upload. Driven by schema.js.
import * as data from './data.js';
import { buildCurriculum, lessonDraft } from './curriculum-data.js';
import { SAMPLE_NOTEBOOKS } from './notebooks-data.js';
import { SAMPLE_QUESTIONS } from './questions-data.js';
import { COLS, ADMIN_ORDER } from './schema.js';
import { CLASSES, TERMS } from './ui.js';
import { $, esc, ic, opt, validate, toast, money, today, norm, toCsv, csvParse, download } from './ui.js';
const ANYFILE = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';
const snake = t => String(t).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
const pad2 = n => String(n).padStart(2, '0');
const bdFix = r => { if (r.month && r.day) { r.md = pad2(r.month) + '-' + pad2(r.day); } delete r.month; delete r.day; return r; };
const isImg = f => f && String(f.type || '').startsWith('image/');

export const allowed = (col, s) => Boolean(COLS[col] && s && (s.role === 'admin' || COLS[col].roles.includes(s.role)));
const pairs = o => o.map(x => Array.isArray(x) ? x : [x, x]);

async function loadCtx(c) {
  const ctx = { students: [], fees: [], payments: [] };
  const need = new Set([...(c.needs || []), ...c.fields.filter(f => f.optionsFrom).map(f => f.optionsFrom)]);
  for (const n of need) ctx[n] = await data.list(n);
  return ctx;
}

export function hubTiles(s) {
  const cols = s.role === 'admin' ? ADMIN_ORDER : Object.keys(COLS).filter(k => COLS[k].roles.includes(s.role) && k !== 'settings');
  return cols.map(k => [COLS[k].label, COLS[k].icon, `#/manage/${k}`]);
}

export async function vManage(col, sub, s) {
  if (!allowed(col, s)) return null;
  const c = COLS[col]; const ctx = await loadCtx(c);
  if (col === 'sms') return vSms(s);
  if (c.single) return vForm(col, c, c.single, s, ctx);
  if (sub === 'new' && !c.noCreate) return vForm(col, c, null, s, ctx);
  if (sub) return vForm(col, c, sub, s, ctx);
  return vList(col, c, s, ctx);
}

/* ---------- list ---------- */
async function vList(col, c, s, ctx) {
  let rows = await data.list(col);
  if (c.sort) rows.sort(c.sort);
  const imgField = c.fields.find(f => f.type === 'image'); const fileField = c.fields.find(f => f.type === 'file');
  const hasFile = !c.single && c.fields.some(f => f.type === 'file' || f.type === 'image');
  const items = rows.map(r => {
    const th = imgField && isImg(r[imgField.key]) ? `<img class="mthumb" ${data.fileAttr(r[imgField.key], 'src')} alt="">` : `<span class="mthumb mthumb-ic">${ic(c.icon)}</span>`;
    const fileField2 = fileField || (imgField && !isImg(r[imgField && imgField.key]) ? imgField : null);
    const ff2 = fileField2 && r[fileField2.key] ? fileField2 : null;
    const fl = ff2 ? `<a class="link" ${data.fileAttr(r[ff2.key])} target="_blank" rel="noopener">${ic('file')} ${esc(r[ff2.key].name || 'File')}</a>` : '';
    return `<li class="mrow">${c.noDelete ? '' : `<input type="checkbox" class="msel" data-id="${esc(r.id)}" aria-label="Select ${esc(c.title(r, ctx))}">`}${th}<div class="mrow-main"><b>${esc(c.title(r, ctx))}</b><span>${esc(c.sub(r, ctx))}</span>${fl}</div>
      <div class="mrow-actions">${c.extra ? c.extra(r) : ''}<a class="btn btn-ghost btn-sm" href="#/manage/${col}/${encodeURIComponent(r.id)}">${c.noCreate ? 'Open' : 'Edit'}</a>
      <button class="btn btn-ghost btn-sm del" data-del="${esc(r.id)}" type="button" aria-label="Delete ${esc(c.title(r, ctx))}">${ic('trash')}</button></div></li>`;
  }).join('');
  return {
    title: c.label, nav: 'home', html: `
    <a class="back" href="#/dashboard">${ic('back')} Dashboard</a>
    <div class="row-between" style="margin-top:6px"><div><p class="eyebrow">Manage</p><h1 class="h1">${c.label}</h1></div>
      ${c.noCreate ? '' : `<a class="btn" href="#/manage/${col}/new">${ic('plus')} Add ${c.one}</a>`}</div>
    <div class="row-between" style="margin:18px 0 10px"><div class="searchbox">${ic('search')}<input id="msearch" class="input" type="search" placeholder="Search ${c.label.toLowerCase()}" aria-label="Search"></div>
      <div class="toolbar">${hasFile ? `<button class="btn btn-sm" id="mbulk" type="button">${ic('plus')} Bulk upload files</button>` : ''}${col === 'curriculum' && s.role === 'admin' ? `<button class="btn btn-sm" id="mstd" type="button">${ic('list')} Load Nigerian curriculum (Creche to SSS 3)</button>` : ''}${col === 'students' ? `<button class="btn btn-sm" id="mlogins" type="button">${ic('user')} Create logins for students and parents</button>` : ''}${col === 'applications' ? `<button class="btn btn-sm" id="madmitall" type="button">${ic('cap')} Admit selected (or all new)</button>` : ''}${col === 'birthdays' ? `<button class="btn btn-sm" id="mbdsync" type="button">${ic('star')} Pick from bio-data (students, applications, staff)</button>` : ''}${col === 'forum' ? `<button class="btn btn-sm" id="mforum" type="button">${ic('plus')} Load sample posts</button>` : ''}${col === 'questions' ? `<button class="btn btn-sm" id="mq" type="button">${ic('form')} Load sample questions</button>` : ''}${col === 'notebooks' ? `<button class="btn btn-sm" id="mnb" type="button">${ic('book')} Load sample notebooks</button>` : ''}${col === 'lessonNotes' ? `<button class="btn btn-sm" id="mdraft" type="button">${ic('book')} Draft notes from curriculum</button>` : ''}${c.csv ? `<button class="btn btn-sm" id="mcsv" type="button">${ic('plus')} Import CSV</button>` : ''}
      ${rows.length ? `<label class="check mini" style="margin:0"><input type="checkbox" id="msall"> Select all shown</label><button class="btn btn-ghost btn-sm" id="mdelsel" type="button" hidden>${ic('trash')} Delete selected (<span id="mselN">0</span>)</button>` : ''}
      <button class="btn btn-ghost btn-sm" id="mexport" type="button">${ic('download')} Export CSV</button></div></div>
    ${col === 'forum' ? `<div class="card" style="margin:0 0 14px"><h2 class="h2s">${ic('mail')} What is this page for?</h2>
      <p style="margin:6px 0">This is where you <b>watch over what people write</b> in the school's discussion rooms: each class room (students), the Teachers forum, the PTA forum and the Weekly corner. Nothing is written here directly. Posts appear on their own when students, teachers and parents post in <a class="link" href="#/p/community">Community rooms</a>.</p>
      <ul style="margin:6px 0 10px 18px"><li><b>Open</b> a post to correct or remove words that are not suitable.</li><li><b>Delete</b> (bin icon) removes a post for everyone. Select several to delete in one go.</li><li>Use <b>Search</b> to find a person, room or word.</li></ul>
      <p class="hint" style="margin:0">Press <b>Load sample posts</b> to place a friendly welcome post in each room. Members will see them and can reply. You can edit or delete them any time.</p></div>` : ''}
    ${col === 'forum' ? `<div class="card" style="margin:0 0 14px"><h2 class="h2s">${ic('people')} What is this page?</h2>
      <p style="margin:6px 0">This is where you <b>watch over what people write</b> in the school's discussion rooms: each <b>class room</b> (students), the <b>Teachers forum</b>, the <b>PTA forum</b>, student groups, and the <b>Weekly corner</b>. Every post and reply appears here automatically. You can open a post to correct its wording or delete anything inappropriate.</p>
      <p style="margin:6px 0" class="hint">It is empty until someone posts. To write a post yourself, open <b>Community rooms and forums</b> on the dashboard. Press the button below to put a friendly welcome post, with house rules, in every room so people have something to reply to. You can edit or delete these samples.</p>
      <button class="btn btn-sm" id="mforumsample" type="button">${ic('plus')} Load sample posts</button></div>` : ''}
    <div id="mpanel"></div>
    <p class="hint" id="mcount">${rows.length} ${rows.length === 1 ? 'record' : 'records'}</p>
    <ul class="mlist" id="mlist">${items || `<li class="mrow"><span class="hint">Nothing here yet.${c.noCreate ? '' : ' Use "Add ' + c.one + '".'}</span></li>`}</ul>`,
    bind() {
      $('#msearch').oninput = e => { const q = e.target.value.toLowerCase(); let n = 0; document.querySelectorAll('#mlist .mrow').forEach(li => { const on = li.textContent.toLowerCase().includes(q); li.hidden = !on; if (on) n++; }); $('#mcount').textContent = `${n} shown`; };
      $('#mexport').onclick = () => {
        const keys = c.fields.filter(f => f.type !== 'file' && f.type !== 'image').map(f => f.key);
        download(`${col}-${today()}.csv`, toCsv([c.fields.filter(f => keys.includes(f.key)).map(f => f.label), ...rows.map(r => keys.map(k => r[k]))]));
      };
      const sels = () => [...document.querySelectorAll('.msel')].filter(x => x.checked && !x.closest('li').hidden);
      const upd = () => { const n = sels().length; const b = $('#mdelsel'); if (b) { b.hidden = !n; $('#mselN').textContent = n; } };
      document.querySelectorAll('.msel').forEach(x => { x.onchange = upd; });
      if ($('#msall')) $('#msall').onchange = e => { document.querySelectorAll('.msel').forEach(x => { if (!x.closest('li').hidden) x.checked = e.target.checked; }); upd(); };
      if ($('#mdelsel')) $('#mdelsel').onclick = async () => {
        const ids = sels().map(x => x.dataset.id); if (!ids.length || !confirm(`Delete ${ids.length} ${c.label.toLowerCase()}? This cannot be undone.`)) return;
        try { await data.removeMany(col, ids); toast(`${ids.length} deleted`); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); }
      };
      document.querySelectorAll('[data-confirm]').forEach(b => b.onclick = async () => {
        const all = rows.filter(x => x.receipt === b.dataset.confirm && x.status === 'Pending'); b.disabled = true;
        try { await data.saveMany('payments', all.map(x => ({ ...x, status: 'Confirmed', enteredBy: s.name }))); toast(`Confirmed ${all.length} item(s)`); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); b.disabled = false; }
      });
      if ($('#mstd')) $('#mstd').onclick = async () => {
        if (!confirm('Load the standard Nigerian scheme of work for every class from Creche to SSS 3? Entries you already have are kept; matching standard entries are refreshed.')) return;
        $('#mstd').disabled = true; $('#mstd').textContent = 'Loading…';
        try { const n = await data.saveMany('curriculum', buildCurriculum()); toast(`${n} curriculum entries loaded`); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); $('#mstd').disabled = false; }
      };
      if ($('#mlogins')) $('#mlogins').onclick = () => loginsPanel();
      const admit = async apps => {
        if (!apps.length) return toast('No applications to admit');
        if (!confirm(`Admit ${apps.length} applicant(s)? Each gets the next student ID and a parent ID (siblings share one parent ID), and appears in Students.`)) return;
        try { const st = await data.admitApplications(apps, s.name); download('admitted-ids.csv', toCsv([['Name', 'Class', 'Student ID', 'Parent ID', 'Parent phone'], ...st.map(r => [r.name, r.class, r.reg_no, r.parentId, r.parentPhone || ''])])); toast(`${st.length} admitted`); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); }
      };
      document.querySelectorAll('[data-admit]').forEach(b => b.onclick = () => admit(rows.filter(r => r.id === b.dataset.admit)));
      if ($('#madmitall')) $('#madmitall').onclick = () => { const ids = sels().map(x => x.dataset.id); admit(rows.filter(r => ids.length ? ids.includes(r.id) : (r.status || 'New') !== 'Admitted' && r.status !== 'Declined').filter(r => r.status !== 'Admitted')); };
      if ($('#mbdsync')) $('#mbdsync').onclick = async () => { try { const n = await data.syncBirthdays(); toast(n ? `${n} birthday(s) picked from bio-data` : 'No new birthdays found. Students add theirs under My profile; staff under Teachers and staff.'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); } };
      if ($('#mforum')) $('#mforum').onclick = async () => {
        try {
          const studs = await data.list('students'); const cls = [...new Set(studs.map(x => x.class).filter(Boolean))]; const rooms = (cls.length ? cls : ['JSS 1', 'SSS 1']).map(c => [`room-class-${c}`, `Welcome to the ${c} class room! This is your space to ask questions about lessons, share ideas and help one another. Be kind, respectful and use clear English. Your teachers are here to help. Let us learn together!`]);
          const base = { authorId: s.id, authorName: s.name || 'School Admin', role: s.role, kind: 'post', sample: true };
          const posts = [...rooms.map(([room, body], i) => ({ ...base, id: 'sample-' + room, room, title: 'Welcome', body })),
            { ...base, id: 'sample-room-teachers', room: 'room-teachers', title: 'Welcome teachers', body: 'Welcome to the Teachers forum. Please use this space to share lesson plans, teaching tips, deadlines for scores and any support you need. Remember to keep student matters private and professional.' },
            { ...base, id: 'sample-room-pta', room: 'room-pta', title: 'Welcome parents and teachers', body: 'Welcome to the PTA forum. This is where parents and teachers talk about the progress of our children, upcoming meetings and school events. Please be courteous. For personal matters about your child, use the Feedback box or speak to the school office.' }];
          const n = await data.saveMany('forum', posts); toast(`${n} sample posts loaded`); window.dispatchEvent(new HashChangeEvent('hashchange'));
        } catch (e) { toast(e.message); }
      };
      if ($('#mforumsample')) $('#mforumsample').onclick = async () => {
        const rules = '\n\nHouse rules: be kind and respectful, use clean language, keep to school matters, and never share passwords or private phone numbers. The school can see and remove posts that break these rules.';
        const mk = (room, body, role = 'admin') => ({ id: 'sample-' + room, room, kind: 'post', sample: true, authorId: s.id, authorName: s.name || 'School Admin', role, body });
        const weeklies = await data.list('weekly').catch(() => []);
        const recs = [
          ...CLASSES.map(c => ({ ...mk('room-class-' + c, `Welcome to the ${c} class room! 🎓 Use this space to ask questions about lessons, share ideas for projects and remind each other about assignments and tests. Reply below and say hello to your classmates.${rules}`), class: c })),
          mk('room-teachers', `Welcome, teachers. This forum is for staff only: share lesson ideas, resources, timetable changes and questions about class management. Please post meeting notes and reminders here too.${rules}`),
          mk('room-pta', `Welcome to the PTA forum. Parents, teachers and the PTA committee can discuss school progress, meetings, events and suggestions here. Please check the PTA page for the next meeting and join online if you cannot come in person.${rules}`),
          ...weeklies.slice(0, 5).map(w => mk('weekly-' + w.id, 'Share your thoughts on this week\'s challenge. Every honest answer is welcome. Reply below!' + rules))
        ];
        try { const n = await data.saveMany('forum', recs); toast(`${n} sample posts loaded`); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); }
      };
      if ($('#mq')) $('#mq').onclick = async () => { try { const n = await data.saveMany('questions', SAMPLE_QUESTIONS); toast(`${n} sample questions loaded`); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); } };
      if ($('#mnb')) $('#mnb').onclick = async () => { try { const n = await data.saveMany('notebooks', SAMPLE_NOTEBOOKS.map(x => ({ ...x, owner: s.id }))); toast(`${n} sample notebooks loaded`); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); } };
      if ($('#mdraft')) $('#mdraft').onclick = () => draftPanel(s);
      if ($('#mbulk')) $('#mbulk').onclick = () => bulkPanel(col, c, s, ctx);
      if ($('#mcsv')) $('#mcsv').onclick = () => csvPanel(col, c, s, ctx);
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
        if (!confirm(`Delete this ${c.one}? This cannot be undone.`)) return;
        try { await data.remove(col, b.dataset.del); toast('Deleted'); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { toast(e.message); }
      });
    }
  };
}

/* ---------- form ---------- */
function optionsFor(f, cur, ctx) {
  if (f.optionsFrom === 'students') return ctx.students.slice().sort((a, b) => a.name.localeCompare(b.name)).map(x => opt(x.reg_no, cur, `${x.name} (${x.reg_no})`)).join('');
  if (f.options) return pairs(f.options).map(([v, l]) => opt(v, cur, l)).join('');
  return '';
}
function fieldHtml(f, rec, ctx) {
  const v = rec[f.key] ?? (f.default === 'today' ? today() : f.default ?? '');
  const id = 'f_' + f.key; const wrap = f.showIf ? `data-showif="${f.showIf[0]}:${f.showIf[1]}"` : '';
  const lab = `<label for="${id}">${f.label}${f.required || f.readonly ? '' : ' <span class="opt">(optional)</span>'}</label>`;
  const err = `<span class="error" id="${id}-e" role="alert"></span>`; const hint = f.hint ? `<span class="hint">${f.hint}</span>` : '';
  if (f.readonly) return `<div class="ro" ${wrap}><span>${f.label}</span><b>${esc(v) || '–'}</b></div>`;
  if (f.type === 'checkbox') return `<label class="check" ${wrap}><input type="checkbox" id="${id}" name="${f.key}" ${v ? 'checked' : ''}> <span>${f.label}</span></label>`;
  let ctl;
  if (f.type === 'textarea') ctl = `<textarea class="input" id="${id}" name="${f.key}" ${f.required ? 'required' : ''} aria-describedby="${id}-e">${esc(v)}</textarea>`;
  else if (f.type === 'select') ctl = `<select class="input" id="${id}" name="${f.key}" ${f.required ? 'required' : ''} aria-describedby="${id}-e"><option value="">Select</option>${f.dependsOn ? '' : optionsFor(f, v, ctx)}</select>`;
  else if (f.type === 'file' || f.type === 'image') {
    const cur = rec[f.key];
    const curHtml = cur ? `<div class="filecur">${isImg(cur) ? `<img class="mthumb" ${data.fileAttr(cur, 'src')} alt="">` : ''}<a class="link" ${data.fileAttr(cur)} target="_blank" rel="noopener">${esc(cur.name || 'Current file')}</a>
      <label class="check mini"><input type="checkbox" name="__rm_${f.key}"> Remove</label></div>` : '';
    ctl = `${curHtml}<input class="input" type="file" id="${id}" name="__file_${f.key}" accept="${f.accept || (f.type === 'image' ? 'image/*' : ANYFILE)}" ${f.required && !cur ? 'required' : ''} aria-describedby="${id}-e">`;
  } else ctl = `<input class="input" id="${id}" name="${f.key}" type="${f.type}" value="${esc(v)}" ${f.required ? 'required' : ''} ${f.type === 'number' ? 'min="0" step="any" inputmode="decimal"' : ''} aria-describedby="${id}-e">`;
  return `<div class="field" data-field="${f.key}" ${wrap}>${lab}${ctl}${hint}${err}</div>`;
}

async function vForm(col, c, id, s, ctx) {
  let rec = {};
  if (c.single) { const cur = await data.getSettings(true); const { phones, ...rest } = cur; rec = { ...rest, id: c.single }; }
  else if (id) { rec = (await data.list(col)).find(r => r.id === id) || {}; if (!rec.id && !c.single) return { title: c.label, nav: 'home', html: `<a class="back" href="#/manage/${col}">${ic('back')} Back</a><p>That record was not found.</p>` }; }
  if (col === 'birthdays' && rec.md) { const [m, d] = rec.md.split('-'); rec.month = String(+m); rec.day = +d; }
  const isNew = !rec.id || (c.single && false);
  return {
    title: (isNew ? 'Add ' : 'Edit ') + c.one, nav: 'home', html: `
    ${c.single ? `<a class="back" href="#/dashboard">${ic('back')} Dashboard</a>` : `<a class="back" href="#/manage/${col}">${ic('back')} ${c.label}</a>`}
    <p class="eyebrow">${c.single ? 'Manage' : isNew ? 'Add' : 'Edit'}</p><h1 class="h1">${c.single ? c.label : (isNew ? 'Add ' : 'Edit ') + c.one}</h1>
    <form class="card" id="mform" novalidate style="margin-top:18px">${c.fields.map(f => fieldHtml(f, rec, ctx)).join('')}
      <div id="mErr" class="error" role="alert" style="margin-top:12px"></div>
      <div class="row-between" style="margin-top:22px"><button class="btn" type="submit">Save</button>${c.single ? '<span></span>' : `<a class="btn btn-ghost" href="#/manage/${col}">Cancel</a>`}</div></form>`,
    bind() {
      const form = $('#mform');
      const showIf = () => form.querySelectorAll('[data-showif]').forEach(w => {
        const [k, val] = w.dataset.showif.split(':'); const on = form.elements[k].value === val;
        w.hidden = !on; w.querySelectorAll('input,select,textarea').forEach(x => { x.disabled = !on; });
      });
      showIf(); form.addEventListener('change', showIf);
      // payments: fee list depends on the chosen student
      if (col === 'payments') {
        const sel = form.elements.feeId; const amt = form.elements.amount; let lines = [];
        const fill = () => {
          const st = ctx.students.find(x => x.reg_no === form.elements.regNo.value);
          lines = st ? data.feeLines(st, ctx.fees, ctx.payments.filter(p => p.id !== rec.id)) : [];
          const cur = sel.value || rec.feeId || '';
          sel.innerHTML = '<option value="">Select</option>' + lines.map(l => opt(l.fee.id, cur, `${l.fee.title}: balance ${money(l.balance)}`)).join('');
        };
        form.elements.regNo.addEventListener('change', () => { sel.value = ''; fill(); });
        sel.addEventListener('change', () => { const l = lines.find(x => x.fee.id === sel.value); if (l && (!amt.value || amt.dataset.auto)) { amt.value = l.balance; amt.dataset.auto = '1'; } });
        amt.addEventListener('input', () => { delete amt.dataset.auto; });
        fill();
      }
      form.onsubmit = async e => {
        e.preventDefault(); $('#mErr').textContent = '';
        if (!validate(form)) return;
        const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Saving…';
        try {
          const out = { ...rec };
          for (const f of c.fields) {
            if (f.readonly) continue;
            if (f.showIf && form.elements[f.showIf[0]].value !== f.showIf[1]) { delete out[f.key]; continue; }
            if (f.type === 'file' || f.type === 'image') {
              const inp = form.elements['__file_' + f.key];
              if (inp.files[0]) { btn.textContent = 'Uploading…'; out[f.key] = await data.uploadFile(inp.files[0]); }
              else if (form.elements['__rm_' + f.key] && form.elements['__rm_' + f.key].checked) delete out[f.key];
            } else if (f.type === 'checkbox') out[f.key] = form.elements[f.key].checked;
            else if (f.type === 'number') out[f.key] = Number(form.elements[f.key].value);
            else out[f.key] = form.elements[f.key].value.trim();
          }
          if (col === 'feedback') out.respondedAt = new Date().toISOString();
          if (col === 'applications' && !out.ref) out.ref = data.newRef('AAC');
          if (col === 'students') { const ex = (await data.list('students')).filter(x => x.id !== rec.id); data.assignIds([out], ex); }
          if (c.single) out.id = c.single;
          if (c.idFrom && col !== 'students') out.id = c.idFrom(out);
          if (col === 'students') out.reg_norm = norm(out.reg_no);
          if (isNew && ['lessonNotes', 'notebooks', 'assignments', 'tests', 'liveclasses', 'questions'].includes(col)) { out.owner = s.id; out.teacherName = s.name; }
          if (isNew && col === 'payments') { out.receipt = 'RCT-' + Date.now().toString(36).toUpperCase().slice(-6); out.enteredBy = s.name; }
          if (col === 'birthdays') { if (+out.day < 1 || +out.day > 31) throw new Error('Enter a day between 1 and 31.'); bdFix(out); out.key = out.key || norm(out.name); }
          const wasNew = isNew; let smsDone = false; const saved = await data.save(col, out);
          if (col === 'students' && out.photo) await data.setUserPic({ regNo: out.reg_no, name: out.name, role: 'student', photo: out.photo }).catch(() => {});
          if (col === 'staff') { const md = out.birthMonth && out.birthDay ? pad2(out.birthMonth) + '-' + pad2(out.birthDay) : ''; if (md) await data.saveBirthday({ id: 'bd-staff-' + saved.id, key: saved.id, name: out.name, kind: 'Teacher', class: out.role, md, photo: out.photo }); }
          if (col === 'announcements' && wasNew && out.sms && ['all', 'parents'].includes(out.audience)) {
            smsDone = true;
            try {
              const sts = await data.list('students'); const { phones } = data.parentPhones(sts);
              const r = await data.sendSms({ phones, message: `All Ages College: ${out.title}. ${out.body}`.slice(0, 450), label: 'Announcement: ' + out.title, by: s.name });
              await data.saveNotice({ title: out.title, message: out.body, audience: 'all', by: s.name });
              toast(r.error ? 'Announcement saved. SMS: ' + r.error : `Announcement saved and texted to ${r.sent} parent number(s)`);
            } catch (e2) { toast('Announcement saved. SMS not sent: ' + e2.message); }
          }
          if (col === 'settings') { await data.getSettings(true); window.dispatchEvent(new Event('aac:settings')); }
          if (!smsDone) toast('Saved');
          if (c.single) { btn.disabled = false; btn.textContent = 'Save'; } else location.hash = `#/manage/${col}`;
        } catch (err) { btn.disabled = false; btn.textContent = 'Save'; $('#mErr').textContent = err.message || 'Could not save. Try again.'; }
      };
    }
  };
}

/* ---------- bulk upload: many files at once, one record per file ---------- */
function bulkPanel(col, c, s, ctx) {
  const ff = c.fields.find(f => (f.type === 'file' || f.type === 'image') && f.required) || c.fields.find(f => f.type === 'file' || f.type === 'image');
  const common = c.fields.filter(f => f.type !== 'file' && f.type !== 'image' && f.key !== 'title' && !f.readonly && !f.showIf && !f.dependsOn && !f.optionsFrom && f.type !== 'textarea');
  const host = $('#mpanel');
  host.innerHTML = `<form class="card bulk" id="bform" novalidate><h2 class="h2">Bulk upload ${esc(c.label.toLowerCase())}</h2>
    <p class="hint">Choose many files at once. Each file becomes its own ${esc(c.one)}, titled with the file name (you can rename later). The settings below apply to every file.</p>
    ${common.map(f => fieldHtml(f, {}, ctx)).join('')}
    <div class="field"><label for="bfiles">Files (jpg, png, pdf, doc...)</label><input class="input" id="bfiles" type="file" multiple accept="${ff.accept || ANYFILE}"></div>
    <div id="bprog" class="hint" role="status"></div><div class="error" id="bErr" role="alert"></div>
    <div class="row-between" style="margin-top:14px"><button class="btn" type="submit">Upload all</button><button class="btn btn-ghost" type="button" id="bcancel">Close</button></div></form>`;
  $('#bcancel').onclick = () => { host.innerHTML = ''; };
  $('#bform').onsubmit = async e => {
    e.preventDefault(); const form = e.target; const files = [...$('#bfiles').files]; $('#bErr').textContent = '';
    if (!files.length) { $('#bErr').textContent = 'Choose at least one file.'; return; }
    if (!validate(form)) return;
    const btn = form.querySelector('button[type=submit]'); btn.disabled = true; let ok = 0; const bad = [];
    for (const [i, f] of files.entries()) {
      $('#bprog').textContent = `Uploading ${i + 1} of ${files.length}: ${f.name}`;
      try {
        const rec = {};
        for (const k of common) rec[k.key] = k.type === 'checkbox' ? form.elements[k.key].checked : k.type === 'number' ? Number(form.elements[k.key].value) : form.elements[k.key].value.trim();
        rec[ff.key] = await data.uploadFile(f); rec.title = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
        if (col === 'lessonNotes') { rec.owner = s.id; rec.teacherName = s.name; }
        if (col === 'files' && !rec.audience) rec.audience = 'all';
        await data.save(col, rec); ok++;
      } catch (err) { bad.push(`${f.name}: ${err.message}`); }
    }
    toast(`${ok} uploaded${bad.length ? ', ' + bad.length + ' failed' : ''}`);
    if (bad.length) { btn.disabled = false; $('#bErr').textContent = bad.join(' | '); $('#bprog').textContent = ''; if (ok) setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 2500); }
    else window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
}

/* ---------- CSV import: students, curriculum, fees, staff, prefects ---------- */
function csvPanel(col, c, s, ctx) {
  const cols = c.fields.filter(f => f.type !== 'file' && f.type !== 'image' && !f.readonly);
  const host = $('#mpanel');
  host.innerHTML = `<div class="card bulk"><h2 class="h2">Import ${esc(c.label.toLowerCase())} from a spreadsheet</h2>
    <p class="hint">Save your spreadsheet as CSV (Excel: File, Save As, CSV). The first row must hold these column names: <b>${cols.map(f => esc(f.label)).join(', ')}</b>. Existing records with the same ${col === 'students' ? 'Reg. number' : 'details'} are updated, new ones are added.</p>
    <p><button class="btn btn-ghost btn-sm" id="ctpl" type="button">${ic('download')} Download blank template</button></p>
    <div class="field"><label for="cfile">CSV file</label><input class="input" id="cfile" type="file" accept=".csv,text/csv"></div>
    <div id="cprev" class="hint" role="status"></div><div class="error" id="cErr" role="alert"></div>
    <div class="row-between" style="margin-top:14px"><button class="btn" id="cgo" type="button" disabled>Import</button><button class="btn btn-ghost" type="button" id="cclose">Close</button></div></div>`;
  $('#cclose').onclick = () => { host.innerHTML = ''; };
  $('#ctpl').onclick = () => download(`${col}-template.csv`, toCsv([cols.map(f => f.label), ...(c.sample ? [c.sample] : [])]));
  let recs = [];
  const norm1 = (f, v) => { // match select values loosely
    if (f.type === 'select' && f.options) { const m = pairs(f.options).find(([val, lab]) => snake(val) === snake(v) || snake(lab) === snake(v)); return m ? m[0] : v; }
    return v;
  };
  $('#cfile').onchange = async e => {
    recs = []; $('#cErr').textContent = ''; $('#cgo').disabled = true; const file = e.target.files[0]; if (!file) return;
    const rows = csvParse(await file.text()); const errs = [];
    rows.forEach((r, i) => {
      const rec = {};
      for (const f of cols) {
        let v = r[snake(f.label)] ?? r[snake(f.key)] ?? '';
        if (f.type === 'number') v = Number(String(v).replace(/[^0-9.]/g, '')) || 0; else v = norm1(f, v);
        if (f.type === 'checkbox') v = /^(y|yes|true|1)$/i.test(String(v));
        rec[f.key] = v;
      }
      const miss = cols.filter(f => f.required && !f.showIf && (rec[f.key] === '' || rec[f.key] === undefined)).map(f => f.label);
      const badSel = cols.filter(f => f.type === 'select' && f.options && rec[f.key] && !pairs(f.options).some(([v]) => v === rec[f.key])).map(f => `${f.label} "${rec[f.key]}"`);
      if (miss.length) errs.push(`Row ${i + 2}: missing ${miss.join(', ')}`); else if (badSel.length) errs.push(`Row ${i + 2}: not recognised: ${badSel.join(', ')}`);
      else { if (c.idFrom && col !== 'students' && col !== 'activities') rec.id = c.idFrom(rec); if (col === 'applications' && !rec.ref) rec.ref = data.newRef('AAC'); if (col === 'birthdays') { if (!(+rec.day >= 1 && +rec.day <= 31)) { errs.push(`Row ${i + 2}: day must be 1 to 31`); return; } bdFix(rec); rec.key = norm(rec.name); rec.id = 'bd-' + norm(rec.name); } recs.push(rec); }
    });
    $('#cprev').textContent = `${recs.length} row(s) ready to import${errs.length ? `, ${errs.length} skipped` : ''}.`;
    $('#cErr').textContent = errs.slice(0, 6).join(' | ') + (errs.length > 6 ? ' ...' : '');
    $('#cgo').disabled = !recs.length;
  };
  $('#cgo').onclick = async () => {
    $('#cgo').disabled = true; $('#cgo').textContent = 'Importing…';
    try {
      if (col === 'students') { data.assignIds(recs, await data.list('students')); }
      const n = await data.saveMany(col, recs); toast(`${n} imported`);
      if (col === 'students') { download('new-student-ids.csv', toCsv([['Name', 'Class', 'Student ID (reg. no.)', 'Parent ID', 'Parent name', 'Parent phone'], ...recs.map(r => [r.name, r.class, r.reg_no, r.parentId, r.parentName || '', r.parentPhone || ''])])); }
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
    catch (err) { $('#cErr').textContent = err.message; $('#cgo').disabled = false; $('#cgo').textContent = 'Import'; }
  };
}

/* ---------- lesson note drafts generated from the curriculum ---------- */
async function draftPanel(s) {
  const cur = await data.list('curriculum'); const classes = [...new Set(cur.map(x => x.class))].sort((a, b) => CLASSES.indexOf(a) - CLASSES.indexOf(b));
  const host = $('#mpanel');
  host.innerHTML = `<form class="card bulk" id="dform"><h2 class="h2">Draft lesson notes from the curriculum</h2>
    <p class="hint">Creates one editable draft note per topic for the class (and subject) you choose, as "${esc(s.name)}". Open each draft to edit it, or attach your own PDF. ${cur.length ? '' : '<b>Load the curriculum first (Curriculum page).</b>'}</p>
    <div class="field"><label for="dcls">Class</label><select class="input" id="dcls">${classes.map(c => `<option>${esc(c)}</option>`).join('')}</select></div>
    <div class="field"><label for="dsub">Subject</label><select class="input" id="dsub"></select></div>
    <div class="field"><label for="dterm">Term</label><select class="input" id="dterm"><option value="">All terms</option>${TERMS.map(t => `<option>${t}</option>`).join('')}</select></div>
    <div id="dmsg" class="hint" role="status"></div>
    <div class="row-between" style="margin-top:14px"><button class="btn" type="submit" ${cur.length ? '' : 'disabled'}>Create drafts</button><button class="btn btn-ghost" type="button" id="dclose">Close</button></div></form>`;
  const fillSub = () => { $('#dsub').innerHTML = '<option value="">All subjects</option>' + [...new Set(cur.filter(x => x.class === $('#dcls').value).map(x => x.subject))].sort().map(x => `<option>${esc(x)}</option>`).join(''); };
  $('#dcls').onchange = fillSub; fillSub(); $('#dclose').onclick = () => { host.innerHTML = ''; };
  $('#dform').onsubmit = async e => {
    e.preventDefault(); const cls = $('#dcls').value, sub = $('#dsub').value, term = $('#dterm').value; const notes = [];
    for (const r of cur.filter(x => x.class === cls && (!sub || x.subject === sub) && (!term || x.term === term))) {
      String(r.topics || '').split('\n').map(t => t.trim()).filter(Boolean).forEach((t, i) => notes.push({ ...lessonDraft(cls, r.subject, r.term, t, i + 1), owner: s.id, teacherName: s.name, draft: true, id: `ln-${s.id}-${cls}-${r.subject}-${r.term}-${i}`.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
    }
    if (!notes.length) { $('#dmsg').textContent = 'No topics found for that choice.'; return; }
    $('#dmsg').textContent = `Creating ${notes.length} drafts…`;
    try { await data.saveMany('lessonNotes', notes); toast(`${notes.length} drafts created`); window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (err) { $('#dmsg').textContent = err.message; }
  };
}

/* ---------- create sign-in accounts for every student and parent that has none ---------- */
async function loginsPanel() {
  const host = $('#mpanel');
  if (!data.isLive) { host.innerHTML = '<div class="card bulk"><p>Logins are created on the live site (demo mode has one demo login).</p></div>'; return; }
  host.innerHTML = '<div class="card bulk"><p class="hint">Checking accounts…</p></div>';
  const [students, ur] = await Promise.all([data.list('students'), data.adminUsers({ action: 'list' })]);
  const have = new Set((ur.users || []).map(u => String(u.email).toLowerCase()));
  const need = []; const parents = new Map();
  for (const st of students) {
    if (st.reg_no && !have.has(data.loginEmail('student', st.reg_no))) need.push({ role: 'student', id: st.reg_no, name: st.name, regs: st.reg_no });
    if (st.parentId) { const p = parents.get(st.parentId) || { role: 'parent', id: st.parentId, name: st.parentName || 'Parent', regs: [] }; p.regs.push(st.reg_no); parents.set(st.parentId, p); }
  }
  parents.forEach(p => { if (!have.has(data.loginEmail('parent', p.id))) need.push({ ...p, regs: p.regs.join(',') }); });
  host.innerHTML = `<div class="card bulk"><h2 class="h2">Create logins</h2><p class="hint">${need.length ? `${need.length} account(s) are missing: ${need.filter(x => x.role === 'student').length} student(s) and ${need.filter(x => x.role === 'parent').length} parent(s). Students sign in with their reg. number, parents with their Parent ID. Passwords are generated for you to hand out.` : 'Every student and parent already has a login.'}</p>
    <div id="lgout" class="hint" role="status"></div><div class="row-between" style="margin-top:12px"><button class="btn" id="lgo" type="button" ${need.length ? '' : 'disabled'}>Create ${need.length} account(s)</button><button class="btn btn-ghost" id="lgx" type="button">Close</button></div></div>`;
  $('#lgx').onclick = () => { host.innerHTML = ''; };
  $('#lgo').onclick = async () => {
    const out = []; $('#lgo').disabled = true; let n = 0;
    for (const a of need) { n++; $('#lgout').textContent = `Creating ${n} of ${need.length}…`;
      const pw = Array.from({ length: 8 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('');
      const r = await data.adminUsers({ action: 'create', role: a.role, full_name: a.name, identifier: a.id, linked_regs: a.role === 'parent' ? a.regs : '', password: pw });
      out.push([a.role, a.id, a.name, pw, r.error ? 'FAILED: ' + r.error : 'Created']); }
    download('new-logins.csv', toCsv([['Role', 'Sign-in ID', 'Name', 'Password', 'Result'], ...out]));
    $('#lgout').textContent = `${out.filter(o => o[4] === 'Created').length} created, ${out.filter(o => o[4] !== 'Created').length} failed. The list with passwords has been downloaded: print it and give each family their login.`;
  };
}


/* ---------- message parents by SMS ---------- */
async function vSms(s) {
  const students = (await data.list('students')).sort((a, b) => a.name.localeCompare(b.name));
  const log = (await data.list('smslog')).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 25);
  const classes = [...new Set(students.map(x => x.class).filter(Boolean))];
  const TPL = [['Fees reminder', 'Dear Parent, this is a reminder that school fees for the term are due. Please pay at the school or through the portal. Thank you. All Ages College.'],
    ['School closes / resumes', 'Dear Parent, school closes on [date] and resumes on [date]. Please ensure your child is present and in full uniform. All Ages College.'],
    ['PTA meeting', 'Dear Parent, there will be a PTA meeting on [date] at [time] ([venue or online]). Your attendance is important. All Ages College.'],
    ['Emergency', 'Dear Parent, please call the school on 08057394188 as soon as you receive this message. All Ages College.']];
  return {
    title: 'Message parents', nav: 'home', html: `
    <a class="back" href="#/dashboard">${ic('back')} Dashboard</a>
    <p class="eyebrow">Manage</p><h1 class="h1">Message parents (SMS)</h1>
    <div class="card" style="margin-top:14px"><p class="hint" style="margin:0">Texts go straight to the parent phone numbers saved on each student, the moment you press Send. Brothers and sisters with the same parent phone get one text. You can also tick <b>"Also text this to all parents"</b> when adding an announcement.</p></div>
    <form class="card" id="smsf" style="margin-top:14px" novalidate>
      <div class="field"><label for="smsAud">Send to</label><select class="input" id="smsAud"><option value="all">All parents</option>${classes.length ? '<option value="class">Parents of one class</option>' : ''}<option value="pick">Parents of chosen students</option></select></div>
      <div class="field" id="smsClsW" hidden><label for="smsCls">Class</label><select class="input" id="smsCls">${classes.map(c => `<option>${esc(c)}</option>`).join('')}</select></div>
      <div class="field" id="smsPickW" hidden><label for="smsQ">Choose students</label><input class="input" id="smsQ" type="search" placeholder="Search by name or ID">
        <ul class="mlist" id="smsPick" style="max-height:220px;overflow:auto;margin-top:8px">${students.map(x => `<li class="mrow"><input type="checkbox" class="smsp" value="${esc(x.id)}" aria-label="${esc(x.name)}"><div class="mrow-main"><b>${esc(x.name)}</b><span>${esc(x.class || '')} · ${esc(x.reg_no || '')} · ${esc(x.parentPhone || 'no parent phone')}</span></div></li>`).join('') || '<li class="mrow"><span class="hint">No students yet.</span></li>'}</ul></div>
      <div class="field"><label for="smsT">Quick message</label><select class="input" id="smsT"><option value="">Choose a template (optional)</option>${TPL.map((t, i) => `<option value="${i}">${esc(t[0])}</option>`).join('')}</select></div>
      <div class="field"><label for="smsM">Message</label><textarea class="input" id="smsM" maxlength="450" required placeholder="Type your message to parents"></textarea><span class="hint" id="smsN"></span></div>
      <div id="smsE" class="error" role="alert"></div>
      <div class="row-between" style="margin-top:14px"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="submit" id="smsGo">${ic('mail')} Send SMS now</button><button class="btn btn-navy" type="button" id="waGo">${ic('people')} Send via WhatsApp (free)</button></div><span class="hint" id="smsSum"></span></div>
    </form>
    <div id="waPanel" class="card" style="margin-top:14px" hidden></div>
    <h2 class="h2" style="margin-top:26px">Sent messages</h2>
    <ul class="mlist">${log.map(r => `<li class="mrow"><span class="mthumb mthumb-ic">${ic('mail')}</span><div class="mrow-main"><b>${esc(r.label || 'Message')} · ${esc(r.status || '')}</b><span>${esc(String(r.date || '').slice(0, 16).replace('T', ' '))} · ${r.count || 0} of ${r.total || 0} numbers · ${esc(String(r.message || '').slice(0, 90))}</span></div></li>`).join('') || '<li class="mrow"><span class="hint">Nothing sent yet.</span></li>'}</ul>`,
    bind() {
      const aud = $('#smsAud'), m = $('#smsM');
      const chosen = () => aud.value === 'all' ? students : aud.value === 'class' ? students.filter(x => x.class === $('#smsCls').value) : students.filter(x => [...document.querySelectorAll('.smsp:checked')].some(c => c.value === x.id));
      const upd = () => {
        $('#smsClsW').hidden = aud.value !== 'class'; $('#smsPickW').hidden = aud.value !== 'pick';
        const { phones, skipped } = data.parentPhones(chosen());
        $('#smsSum').textContent = `${phones.length} parent number(s)${skipped.length ? ` · ${skipped.length} student(s) have no valid parent phone` : ''}`;
        const n = m.value.length; $('#smsN').textContent = `${n}/450 characters · about ${Math.max(1, Math.ceil(n / 153))} SMS page(s) per number`;
      };
      ['change', 'input'].forEach(ev => $('#smsf').addEventListener(ev, upd)); upd();
      $('#smsT').onchange = e => { if (e.target.value !== '') { m.value = TPL[e.target.value][1]; upd(); } };
      $('#smsQ').oninput = e => { const q = e.target.value.toLowerCase(); document.querySelectorAll('#smsPick li').forEach(li => { li.hidden = !li.textContent.toLowerCase().includes(q); }); };
      $('#waGo').onclick = async () => {
        $('#smsE').textContent = ''; const msg = m.value.trim(); if (!msg) { $('#smsE').textContent = 'Write a message first.'; return; }
        const by = new Map(); chosen().forEach(st => { const n = data.normPhone(st.parentPhone); if (!n) return; const o = by.get(n) || { n, parent: st.parentName || 'Parent', kids: [] }; o.kids.push(st.name); by.set(n, o); });
        const list = [...by.values()]; if (!list.length) { $('#smsE').textContent = 'No parent phone numbers in this selection.'; return; }
        const P = $('#waPanel'); P.hidden = false;
        P.innerHTML = `<h2 class="h2s">${ic('people')} WhatsApp: ${list.length} parent(s)</h2><p class="hint">Tap "Open WhatsApp" for each parent. The message is already typed; just press Send in WhatsApp, then come back. Done ones turn green.</p>
          <ul class="mlist">${list.map((o, i) => `<li class="mrow" id="wa${i}"><div class="mrow-main"><b>${esc(o.parent)}</b><span>Parent of ${esc(o.kids.join(', '))} · +${o.n}</span></div><a class="btn btn-sm" target="_blank" rel="noopener noreferrer" data-i="${i}" href="https://wa.me/${o.n}?text=${encodeURIComponent(msg)}">Open WhatsApp</a></li>`).join('')}</ul>`;
        P.querySelectorAll('a[data-i]').forEach(a => a.addEventListener('click', () => { const li = $('#wa' + a.dataset.i); li.style.background = '#e8f7ee'; a.textContent = 'Opened ✓'; }));
        try {
          const regsSel = aud.value === 'pick' ? chosen().map(x => x.reg_no) : [];
          await data.save('smslog', { label: 'WhatsApp: ' + (aud.value === 'all' ? 'All parents' : aud.value === 'class' ? 'Class ' + $('#smsCls').value : 'Chosen students'), message: msg, count: list.length, total: list.length, status: 'WhatsApp (sent by you)', date: new Date().toISOString(), by: s.name });
          await data.saveNotice({ title: 'Message from the school', message: msg, audience: aud.value, cls: aud.value === 'class' ? $('#smsCls').value : '', regs: regsSel, by: s.name });
        } catch { /* log is best-effort */ }
        P.scrollIntoView({ behavior: 'smooth' });
      };
      $('#smsf').onsubmit = async e => {
        e.preventDefault(); $('#smsE').textContent = '';
        const msg = m.value.trim(); const { phones } = data.parentPhones(chosen());
        if (!msg) { $('#smsE').textContent = 'Write a message first.'; return; }
        if (!phones.length) { $('#smsE').textContent = 'No parent phone numbers in this selection.'; return; }
        if (!confirm(`Send this message now to ${phones.length} parent number(s)?`)) return;
        const b = $('#smsGo'); b.disabled = true; b.textContent = 'Sending…';
        try {
          const r = await data.sendSms({ phones, message: msg, label: aud.value === 'all' ? 'All parents' : aud.value === 'class' ? 'Class ' + $('#smsCls').value : 'Chosen students', by: s.name });
          { const regsSel = aud.value === 'pick' ? chosen().map(x => x.reg_no) : []; await data.saveNotice({ title: 'Message from the school', message: msg, audience: aud.value, cls: aud.value === 'class' ? $('#smsCls').value : '', regs: regsSel, by: s.name }); }
          toast(r.error ? r.error : r.demo ? `Demo: ${r.sent} message(s) logged, nothing really sent` : `Sent to ${r.sent} parent number(s)`);
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        } catch (err) { $('#smsE').textContent = err.message; b.disabled = false; b.innerHTML = `${ic('mail')} Send SMS now`; }
      };
    }
  };
}
