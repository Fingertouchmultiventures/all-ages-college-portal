// Floating AI assistant. Uses the live AI endpoint when configured, otherwise a built-in school helper.
import * as data from './data.js';
import { $, esc, ic } from './ui.js';

const CHIPS = ['How do I apply?', 'Check a result', 'School fees', 'Contact the school', 'Class levels'];
const hist = [];

async function localAnswer(q) {
  const t = q.toLowerCase(); const s = await data.getSettings(); const ph = s.phones.map(p => p.label).join(', ');
  const has = (...w) => w.some(x => t.includes(x));
  if (has('apply', 'admission', 'register', 'enrol', 'enroll')) return 'To apply, open "Apply" from the menu, fill in the child and parent details (about 3 minutes) and submit. You get a reference number and the admin office will call you. We admit from Creche to SSS 3. Call ' + ph + ' for help.';
  if (has('result', 'pin', 'score')) return 'Go to "Check result". Enter the access PIN from your result slip or scratch card, the student\'s reg. number, the session and the term. If your PIN is not working, ask the school office.';
  if (has('fee', 'pay', 'bursar', 'tuition', 'uniform', 'textbook', 'book', 'bank', 'account')) return 'Fees cover school fee, textbooks and exercise books, uniforms and any other payment the school requests. Parents sign in to see what applies to each child and what is paid. ' + (s.accountNumber ? `Pay to ${s.bankName}, ${s.accountName}, ${s.accountNumber}, then show your teller to the bursar for a receipt.` : 'Ask the bursar for the school account details.');
  if (has('contact', 'call', 'phone', 'number', 'address', 'where', 'location')) return `We are at ${s.address}. Phone: ${ph}.`;
  if (has('class', 'level', 'creche', 'nursery', 'primary', 'jss', 'sss', 'secondary')) return 'We run Creche, Nursery 1 to 2, Primary 1 to 6, JSS 1 to 3 and SSS 1 to 3.';
  if (has('login', 'sign in', 'password', 'forgot', 'portal')) return 'Choose your portal on the home page (Student, Parent, Teacher, Payment, Bursar or Admin) and sign in with the ID and password the school gave you. Forgotten password? Call the school office.';
  if (has('complain', 'suggest', 'feedback', 'enquir', 'inquir')) return 'Use the Feedback box (menu, then More). Anyone can send an enquiry, complaint, feedback or suggestion.';
  if (has('prefect', 'head boy', 'head girl')) return 'Our school prefects are shown on the Announcements page and on student and teacher dashboards.';
  if (has('announce', 'news', 'notice', 'event')) {
    const a = (await data.list('announcements')).slice(0, 3).map(x => x.title);
    return a.length ? 'Latest announcements: ' + a.join('; ') + '. Open Announcements for details.' : 'There are no announcements right now.';
  }
  if (has('curriculum', 'lesson', 'note', 'syllabus')) return 'Students and parents can see the curriculum and lesson notes after signing in. Teachers upload them from the teacher portal.';
  if (has('hello', 'hi', 'hey', 'good')) return `Hello! I can help with admissions, results, fees, sign in and contacts for ${s.schoolName}. What would you like to know?`;
  return `I am not sure about that. You can call the school on ${ph}, or leave a message in the Feedback box.`;
}

async function reply(q) {
  const s = await data.getSettings();
  const ctx = { school: s.schoolName, address: s.address, phones: s.phones.map(p => p.label), feeNote: s.feeNote, announcements: (await data.list('announcements')).slice(0, 5).map(a => a.title) };
  hist.push({ role: 'user', content: q });
  const ai = await data.askAI(hist.slice(-10), ctx);
  const out = ai || await localAnswer(q);
  hist.push({ role: 'assistant', content: out });
  return out;
}

export function mountChat() {
  const host = $('#chatMount'); if (!host || host.dataset.on) return; host.dataset.on = '1';
  host.innerHTML = `<button class="fab" id="chatFab" type="button" aria-label="Ask the school assistant">${ic('chat')}<span>Ask us</span></button>
  <dialog class="chat" id="chatBox" aria-label="School assistant"><div class="chat-head"><b>School assistant</b><button type="button" id="chatX" aria-label="Close chat">${ic('close')}</button></div>
  <div class="chat-log" id="chatLog" aria-live="polite"></div><div class="chips" id="chatChips">${CHIPS.map(c => `<button type="button">${c}</button>`).join('')}</div>
  <form class="chat-in" id="chatForm"><input class="input" id="chatQ" placeholder="Type your question" autocomplete="off" aria-label="Your question"><button class="btn btn-sm" type="submit" aria-label="Send">${ic('send')}</button></form></dialog>`;
  const box = $('#chatBox'), log = $('#chatLog');
  const add = (who, t) => { const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
  const ask = async q => { q = q.trim(); if (!q) return; add('me', q); const w = add('bot', '…'); try { w.textContent = await reply(q); } catch { w.textContent = 'Sorry, something went wrong. Please call the school office.'; } log.scrollTop = log.scrollHeight; };
  $('#chatFab').onclick = () => { box.showModal(); if (!log.children.length) add('bot', 'Hello! Ask me about admission, results, fees, sign in or contacts.'); $('#chatQ').focus(); };
  $('#chatX').onclick = () => box.close(); box.onclick = e => { if (e.target === box) box.close(); };
  $('#chatChips').onclick = e => { if (e.target.tagName === 'BUTTON') ask(e.target.textContent); };
  $('#chatForm').onsubmit = e => { e.preventDefault(); const i = $('#chatQ'); const v = i.value; i.value = ''; ask(v); };
}
