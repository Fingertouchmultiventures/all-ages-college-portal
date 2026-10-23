// Generic manager: list, add, edit, delete, upload. Driven by schema.js.
import * as data from './data.js';
import { buildCurriculum, lessonDraft } from './curriculum-data.js';
import { COLS, ADMIN_ORDER } from './schema.js';
import { CLASSES, TERMS } from './ui.js';
import { $, esc, ic, opt, validate, toast, money, today, norm, toCsv, csvParse, download } from './ui.js';
const ANYFILE = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv';
const snake = t => String(t).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
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
  if (c.single) return vForm(col, c, c.single, s, ctx);
  if (sub === 'new' && !c.noCreate) return vForm(col, c, null, s, ctx);
  if (sub) return vForm(col, c, sub, s, ctx);
  return vList(col, c, s, ctx);
}

/* ---------- list ---------- */
async function vList(col, c, s, ctx) {
  let rows = await data.list(col);
  if (c.ownOnly && s.role === 'teacher') rows = rows.filter(r => r.owner === s.id);
  if (c.sort) rows.sort(c.sort);
  const imgField = c.fields.find(f => f.type === 'image'); const fileField = c.fields.find(f => f.type === 'file');
  const hasFile = !c.single && c.fields.some(f => f.type === 'file' || f.type === 'image');
  const items = rows.map(r => {
    const th = imgField && isImg(r[imgField.key]) ? `<img class="mthumb" ${data.fileAttr(r[imgField.key], 'src')} alt="">` : `<span class="mthumb mthumb-ic">${ic(c.icon)}</span>`;
    const fileField2 = fileField || (imgField && !isImg(r[imgField && imgField.key]) ? imgField : null);
    const ff2 = fileField2 && r[fileField2.key] ? fileField2 : null;
    const fl = ff2 ? `<a class="link" ${data.fileAttr(r[ff2.key])} target="_blank" rel="noopener">${ic('file')} ${esc(r[ff2.key].name || 'File')}</a>` : '';
    return `<li class="mrow">${th}<div class="mrow-main"><b>${esc(c.title(r, ctx))}</b><span>${esc(c.sub(r, ctx))}</span>${fl}</div>
      <div class="mrow-actions">${c.extra ? c.extra(r) : ''}<a class="btn btn-ghost btn-sm" href="#/manage/${col}/${encodeURIComponent(r.id)}">${c.noCreate ? 'Open' : 'Edit'}</a>
      <button class="btn btn-ghost btn-sm del" data-del="${esc(r.id)}" type="button" aria-label="Delete ${esc(c.title(r, ctx))}">${ic('trash')}</button></div></li>`;
  }).join('');
  return {
    title: c.label, nav: 'home', html: `
    <a class="back" href="#/dashboard">${ic('back')} Dashboard</a>
    <div class="row-between" style="margin-top:6px"><div><p class="eyebrow">Manage</p><h1 class="h1">${c.label}</h1></div>
      ${c.noCreate ? '' : `<a class="btn" href="#/manage/${col}/new">${ic('plus')} Add ${c.one}</a>`}</div>
    <div class="row-between" style="margin:18px 0 10px"><div class="searchbox">${ic('search')}<input id="msearch" class="input" type="search" placeholder="Search ${c.label.toLowerCase()}" aria-label="Search"></div>
      <div class="toolbar">${hasFile ? `<button class="btn btn-sm" id="mbulk" type="button">${ic('plus')} Bulk upload files</button>` : ''}${col === 'curriculum' && s.role === 'admin' ? `<button class="btn btn-sm" id="mstd" type="button">${ic('list')} Load Nigerian curriculum (Creche to SSS 3)</button>` : ''}${col === 'lessonNotes' ? `<button class="btn btn-sm" id="mdraft" type="button">${ic('book')} Draft notes from curriculum</button>` : ''}${c.csv ? `<button class="btn btn-sm" id="mcsv" type="button">${ic('plus')} Import CSV</button>` : ''}
      <button class="btn btn-ghost btn-sm" id="mexport" type="button">${ic('download')} Export CSV</button></div></div>
    <div id="mpanel"></div>
    <p class="hint" id="mcount">${rows.length} ${rows.length === 1 ? 'record' : 'records'}</p>
    <ul class="mlist" id="mlist">${items || `<li class="mrow"><span class="hint">Nothing here yet.${c.noCreate ? '' : ' Use "Add ' + c.one + '".'}</span></li>`}</ul>`,
    bind() {
      $('#msearch').oninput = e => { const q = e.target.value.toLowerCase(); let n = 0; document.querySelectorAll('#mlist .mrow').forEach(li => { const on = li.textContent.toLowerCase().includes(q); li.hidden = !on; if (on) n++; }); $('#mcount').textContent = `${n} shown`; };
      $('#mexport').onclick = () => {
        const keys = c.fields.filter(f => f.type !== 'file' && f.type !== 'image').map(f => f.key);
        download(`${col}-${today()}.csv`, toCsv([c.fields.filter(f => keys.includes(f.key)).map(f => f.label), ...rows.map(r => keys.map(k => r[k]))]));
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
  if (c.ownOnly && s.role === 'teacher' && rec.id && rec.owner !== s.id) return { title: c.label, nav: 'home', html: `<a class="back" href="#/manage/${col}">${ic('back')} Back</a><p>You can only edit your own ${c.label.toLowerCase()}.</p>` };
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
          if (c.single) out.id = c.single;
          if (c.idFrom) out.id = c.idFrom(out);
          if (col === 'students') out.reg_norm = norm(out.reg_no);
          if (isNew && col === 'lessonNotes') { out.owner = s.id; out.teacherName = s.name; }
          if (isNew && col === 'payments') { out.receipt = 'RCT-' + Date.now().toString(36).toUpperCase().slice(-6); out.enteredBy = s.name; }
          await data.save(col, out);
          if (col === 'settings') { await data.getSettings(true); window.dispatchEvent(new Event('aac:settings')); }
          toast('Saved');
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
      else { if (c.idFrom) rec.id = c.idFrom(rec); if (col === 'students') rec.reg_norm = norm(rec.reg_no); recs.push(rec); }
    });
    $('#cprev').textContent = `${recs.length} row(s) ready to import${errs.length ? `, ${errs.length} skipped` : ''}.`;
    $('#cErr').textContent = errs.slice(0, 6).join(' | ') + (errs.length > 6 ? ' ...' : '');
    $('#cgo').disabled = !recs.length;
  };
  $('#cgo').onclick = async () => {
    $('#cgo').disabled = true; $('#cgo').textContent = 'Importing…';
    try { const n = await data.saveMany(col, recs); toast(`${n} imported`); window.dispatchEvent(new HashChangeEvent('hashchange')); }
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
