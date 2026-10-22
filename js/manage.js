// Generic manager: list, add, edit, delete, upload. Driven by schema.js.
import * as data from './data.js';
import { COLS, ADMIN_ORDER } from './schema.js';
import { $, esc, ic, opt, validate, toast, money, today, norm, toCsv, download } from './ui.js';

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
  const items = rows.map(r => {
    const th = imgField && r[imgField.key] ? `<img class="mthumb" ${data.fileAttr(r[imgField.key], 'src')} alt="">` : `<span class="mthumb mthumb-ic">${ic(c.icon)}</span>`;
    const fl = fileField && r[fileField.key] ? `<a class="link" ${data.fileAttr(r[fileField.key])} target="_blank" rel="noopener">${ic('file')} ${esc(r[fileField.key].name || 'File')}</a>` : '';
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
      <button class="btn btn-ghost btn-sm" id="mexport" type="button">${ic('download')} Export CSV</button></div>
    <p class="hint" id="mcount">${rows.length} ${rows.length === 1 ? 'record' : 'records'}</p>
    <ul class="mlist" id="mlist">${items || `<li class="mrow"><span class="hint">Nothing here yet.${c.noCreate ? '' : ' Use "Add ' + c.one + '".'}</span></li>`}</ul>`,
    bind() {
      $('#msearch').oninput = e => { const q = e.target.value.toLowerCase(); let n = 0; document.querySelectorAll('#mlist .mrow').forEach(li => { const on = li.textContent.toLowerCase().includes(q); li.hidden = !on; if (on) n++; }); $('#mcount').textContent = `${n} shown`; };
      $('#mexport').onclick = () => {
        const keys = c.fields.filter(f => f.type !== 'file' && f.type !== 'image').map(f => f.key);
        download(`${col}-${today()}.csv`, toCsv([c.fields.filter(f => keys.includes(f.key)).map(f => f.label), ...rows.map(r => keys.map(k => r[k]))]));
      };
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
    const curHtml = cur ? `<div class="filecur">${f.type === 'image' ? `<img class="mthumb" ${data.fileAttr(cur, 'src')} alt="">` : ''}<a class="link" ${data.fileAttr(cur)} target="_blank" rel="noopener">${esc(cur.name || 'Current file')}</a>
      <label class="check mini"><input type="checkbox" name="__rm_${f.key}"> Remove</label></div>` : '';
    ctl = `${curHtml}<input class="input" type="file" id="${id}" name="__file_${f.key}" ${f.type === 'image' ? 'accept="image/*"' : ''} ${f.required && !cur ? 'required' : ''} aria-describedby="${id}-e">`;
  } else ctl = `<input class="input" id="${id}" name="${f.key}" type="${f.type}" value="${esc(v)}" ${f.required ? 'required' : ''} ${f.type === 'number' ? 'min="0" step="any" inputmode="decimal"' : ''} aria-describedby="${id}-e">`;
  return `<div class="field" data-field="${f.key}" ${wrap}>${lab}${ctl}${hint}${err}</div>`;
}

async function vForm(col, c, id, s, ctx) {
  let rec = {};
  if (id) { rec = (await data.list(col)).find(r => r.id === id) || {}; if (!rec.id && !c.single) return { title: c.label, nav: 'home', html: `<a class="back" href="#/manage/${col}">${ic('back')} Back</a><p>That record was not found.</p>` }; }
  if (c.ownOnly && s.role === 'teacher' && rec.id && rec.owner !== s.id) return { title: c.label, nav: 'home', html: `<a class="back" href="#/manage/${col}">${ic('back')} Back</a><p>You can only edit your own ${c.label.toLowerCase()}.</p>` };
  const isNew = !rec.id;
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
