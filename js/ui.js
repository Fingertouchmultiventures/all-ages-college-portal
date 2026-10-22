// Shared helpers: DOM, icons, form fields, formatting, CSV.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const money = n => '₦' + Number(n || 0).toLocaleString('en-NG');
export const fmtDate = d => { if (!d) return ''; const x = new Date(d); return isNaN(x) ? '' : x.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }); };
export const today = () => new Date().toISOString().slice(0, 10);
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));

export const CLASS_GROUPS = [
  ['Early years', ['Creche', 'Nursery 1', 'Nursery 2']],
  ['Primary', ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6']],
  ['Junior secondary', ['JSS 1', 'JSS 2', 'JSS 3']],
  ['Senior secondary', ['SSS 1', 'SSS 2', 'SSS 3']]
];
export const CLASSES = CLASS_GROUPS.flatMap(g => g[1]);
export const TERMS = ['First Term', 'Second Term', 'Third Term'];

/* ---------- icons ---------- */
export const P = {
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
  out: 'M9 4H4v16h5 M16 8l4 4-4 4 M20 12H9',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z',
  plus: 'M12 5v14 M5 12h14',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
  upload: 'M12 16V4 M7 9l5-5 5 5 M4 20h16',
  download: 'M12 4v12 M7 11l5 5 5-5 M4 20h16',
  file: 'M6 3h9l4 4v14H6z M14 3v5h5',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  sliders: 'M4 6h16 M4 12h16 M4 18h16 M8 4v4 M16 10v4 M10 16v4',
  mail: 'M3 5h18v14H3z M3 7l9 7 9-7',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-4-4',
  send: 'M3 11l18-8-8 18-2-8z',
  close: 'M6 6l12 12 M18 6L6 18',
  print: 'M7 9V3h10v6 M6 17H4v-6h16v6h-2 M7 14h10v7H7z',
  dots: 'M5 12h.01 M12 12h.01 M19 12h.01',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  pin: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01'
};
export const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || ''}"/></svg>`;

/* ---------- forms ---------- */
export const opt = (v, cur, label) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(label ?? v)}</option>`;
export function field({ id, label, type = 'text', value = '', required = true, hint = '', extra = '', opt: optional = false, msg = '' }) {
  return `<div class="field" data-field="${id}">
    <label for="${id}">${label}${optional ? ' <span class="opt">(optional)</span>' : ''}</label>
    <input class="input" id="${id}" name="${id}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${msg ? `data-msg="${esc(msg)}"` : ''} aria-describedby="${id}-e" ${extra}>
    ${hint ? `<span class="hint">${hint}</span>` : ''}<span class="error" id="${id}-e" role="alert"></span></div>`;
}
export function selectField({ id, label, value = '', options, required = true, placeholder = 'Select', msg = '', hint = '' }) {
  return `<div class="field" data-field="${id}"><label for="${id}">${label}</label>
    <select class="input" id="${id}" name="${id}" ${required ? 'required' : ''} ${msg ? `data-msg="${esc(msg)}"` : ''} aria-describedby="${id}-e">
    <option value="">${placeholder}</option>${options}</select>${hint ? `<span class="hint">${hint}</span>` : ''}<span class="error" id="${id}-e" role="alert"></span></div>`;
}
export function validate(form) {
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
export const showPw = btn => { const i = btn.previousElementSibling; const s = i.type === 'password'; i.type = s ? 'text' : 'password'; btn.textContent = s ? 'Hide' : 'Show'; btn.setAttribute('aria-pressed', String(s)); };
export function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 3800);
}

/* ---------- files & csv ---------- */
export function download(filename, text, mime = 'text/csv;charset=utf-8') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
export function toCsv(rows) { return rows.map(r => r.map(csvCell).join(',')).join('\n'); }
export function csvParse(text) {
  const rows = []; let row = [], cell = '', q = false;
  const t = text.replace(/^﻿/, '');
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(x => x.trim() !== '')) rows.push(row); row = []; }
    else cell += c;
  }
  row.push(cell); if (row.some(x => x.trim() !== '')) rows.push(row);
  if (!rows.length) return [];
  const head = rows[0].map(h => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'));
  return rows.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}
