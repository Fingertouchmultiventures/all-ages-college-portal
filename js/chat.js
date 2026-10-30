// School assistant: a guide for every visitor and portal user (what, where, which, when, how) that can also
// pass enquiries, complaints, requests and suggestions on to the school office.
// Works on its own (built-in guide + live school data). When the optional ai-chat function has an Anthropic key,
// open questions are answered by AI and the built-in guide adds the right "Open" buttons.
import * as data from './data.js';
import { $, esc, ic, money, fmtDate, norm } from './ui.js';
import { myStudents } from './portal.js';

const hist = [];
const pub = ['', 'student', 'parent', 'teacher', 'bursar', 'admin'];
const ALL = pub;
// Knowledge base. k = keywords (any match scores), r = roles it applies to (omit = everyone), l = buttons.
const KB = [
  { k: ['apply', 'admission', 'admit', 'enrol', 'enroll', 'register my child', 'new student', 'join the school'], a: 'To apply: open "Apply" from the menu (or the red button on the home page), fill in the child and parent details (about 3 minutes) and submit. You get a reference number, and the admin office calls you. We admit from Creche to SSS 3. Once admitted, your child gets a student ID and you get a parent ID, and the school creates your logins.', l: [['Apply now', '#/apply']] },
  { k: ['result', 'pin', 'check result', 'scratch card', 'termly result'], a: 'To check a result: open "Check result", enter the access PIN from your result slip or scratch card, the student\'s reg. number (for example AAC/ST/001), the session and the term. Signed-in parents and students can also open Scorecard. If your PIN is not working, ask the school office.', l: [['Check result', '#/result']] },
  { k: ['scorecard', 'my score', 'my scores', 'grades', 'ca score', 'exam score'], r: ['student', 'parent'], a: 'Open Scorecard to see the scores entered by teachers for each subject and term. Parents see only their own children.', l: [['Open scorecard', '#/p/scorecard']] },
  { k: ['enter score', 'upload score', 'score sheet', 'scoresheet', 'record score', 'mark'], r: ['teacher', 'admin'], a: 'To enter scores: open "Enter scores for a class", choose the class, subject, term and session, type each student\'s scores and save. Admin can also upload whole results from the Upload results page.', l: [['Enter scores', '#/p/scoresheet'], ['Upload results', '#/results-import']] },
  { k: ['fee', 'fees', 'school fee', 'tuition', 'textbook', 'uniform', 'owe', 'balance', 'outstanding', 'debt'], a: 'Fees cover school fee, textbooks and exercise books, uniforms and any other payment the school sets. Parents and students sign in and open Fees to see what applies to each child, what is paid and what is outstanding.', l: [['My fees', '#/p/fees'], ['Payment portal', '#/p/pay']] },
  { k: ['how to pay', 'pay fees', 'make payment', 'payment', 'teller', 'transfer', 'bank', 'account number', 'receipt', 'proof'], a: 'To pay: transfer to the school account, then sign in to the Payment portal, choose the child and the fee, enter the amount and upload your teller or transfer screenshot. The bursar confirms it and your receipt appears under the payment. Pending and rejected payments show on the bell.', l: [['Payment portal', '#/p/pay']] },
  { k: ['confirm payment', 'pending payment', 'bursar', 'add payment', 'record payment'], r: ['bursar', 'admin'], a: 'Open the Payment portal. Payments waiting for you show as Pending: open one and confirm or reject it. To record a payment made at the school, press "Add payment", pick the student and fee, enter the amount and save; a receipt is created.', l: [['Payment portal', '#/p/pay'], ['Fee overview', '#/p/debtors']] },
  { k: ['debtor', 'who owes', 'unpaid', 'fee overview', 'defaulter'], r: ['bursar', 'admin'], a: 'Open "Fee overview" to see every fee, who has paid, part paid or not paid, with totals. Admin can also delete a wrong entry there.', l: [['Fee overview', '#/p/debtors']] },
  { k: ['live class', 'online class', 'video class', 'webcam', 'camera', 'zoom', 'virtual class'], a: 'Live classes: open "Live classes", choose your class\'s session and press "Enter classroom". Use "Check my camera and microphone" first. Joining is recorded as attendance. Teachers schedule classes from the same page.', l: [['Live classes', '#/p/live']] },
  { k: ['assignment', 'homework', 'project'], r: ['student', 'parent', 'teacher', 'admin'], a: 'Open Assignments to see homework by class and subject with due dates. Teachers add assignments from the same page. Overdue and upcoming ones also appear on the bell.', l: [['Assignments', '#/p/assignments']] },
  { k: ['test', 'exam', 'examination', 'cbt', 'quiz'], r: ['student', 'parent', 'teacher', 'admin'], a: 'Open "Tests and exams" for dates, subjects and instructions. For practice, use "Practice questions", where objective questions are marked for you.', l: [['Tests and exams', '#/p/tests'], ['Practice questions', '#/p/practice']] },
  { k: ['practice', 'past question', 'past questions', 'waec', 'neco', 'revision'], a: 'Open "Practice questions", choose your class, subject and topic and answer; objective questions are marked instantly. Real past papers uploaded by the school are in Library and files under "Past questions".', l: [['Practice questions', '#/p/practice'], ['Library', '#/p/library']] },
  { k: ['curriculum', 'scheme of work', 'syllabus', 'nerdc', 'topics'], a: 'Open Curriculum to see the topics for each class, subject and term, following the Nigerian curriculum. Teachers can add or edit entries.', l: [['Curriculum', '#/p/curriculum']] },
  { k: ['lesson note', 'notes', 'notebook', 'study note', 'reading'], a: 'Lesson notes and Notebooks hold the full teaching notes by class and subject. Open Notebooks to read them any time; during a live class, the day\'s note shows beside the video.', l: [['Notebooks', '#/p/notebooks'], ['Lesson notes', '#/p/notes']] },
  { k: ['library', 'file', 'download', 'document', 'textbook pdf', 'past papers'], a: 'Open "Library and files" to find files by class, session and subject (for example past questions and notes). Teachers and admin upload them there.', l: [['Library', '#/p/library']] },
  { k: ['profile', 'bio', 'bio-data', 'portfolio', 'date of birth', 'my picture', 'profile picture', 'photo', 'avatar'], a: 'Your picture: on your dashboard, press "Add my picture" or "Change my picture". Students also complete bio-data and a portfolio under "My profile and portfolio", including date of birth, which is used for birthday greetings (only month and day are shown).', l: [['My profile', '#/p/profile'], ['Dashboard', '#/dashboard']] },
  { k: ['birthday', 'celebrant', 'celebration', 'honour', 'student of the week'], a: 'Birthdays are picked from the bio-data and shown on the home page, the dashboard carousel and the bell on the day. The Celebrations page also shows honours such as Student of the week.', l: [['Celebrations', '#/celebrations']] },
  { k: ['community', 'class room', 'forum', 'discussion', 'chat room', 'group'], a: 'Open "Student community" (students) or "Teachers forum and class rooms" (teachers) to join your class room and groups, post, reply and share files. The school can see all posts.', l: [['Community rooms', '#/p/community']] },
  { k: ['pta', 'parent teacher', 'meeting', 'committee'], a: 'The PTA page lists upcoming meetings, the committee and past minutes. For online meetings press "Join with webcam". The PTA forum is open to parents, teachers and the committee.', l: [['PTA', '#/p/pta'], ['PTA forum', '#/room/room-pta']] },
  { k: ['weekly', 'engagement', 'challenge'], a: 'The Weekly corner has the school\'s weekly challenge, quiz or question; open it and reply in its discussion room.', l: [['Weekly corner', '#/p/weekly']] },
  { k: ['announcement', 'news', 'notice', 'event', 'what is happening'], a: 'Open Announcements for school news. Mandatory notices also appear on the bell and at the top of your dashboard.', l: [['Announcements', '#/announcements']] },
  { k: ['bell', 'alert', 'notification', 'reminder', 'notify'], a: 'The bell at the top shows what needs your attention: mandatory notices, payments due or late, live classes, assignments and tests, messages from the school, birthdays, and replies to your feedback. Open it to read them.', l: [['Open the bell', '#/alerts']] },
  { k: ['album', 'photo gallery', 'pictures', 'gallery', 'picnic'], a: 'The School album shows pictures from school life, in categories and collections.', l: [['School album', '#/album']] },
  { k: ['testimonial', 'alumni', 'review', 'past student'], a: 'Alumni, outgoing students and parents can write a testimonial; it is shown after the school approves it.', l: [['Testimonials', '#/testimonials']] },
  { k: ['activity', 'activities', 'sport', 'music', 'fellowship', 'excursion', 'phonics', 'community service'], a: 'Our activities include community service, sports, phonics and oral class, fellowship, music and excursions. Open the Activities menu for details.', l: [['About the school', '#/about']] },
  { k: ['about', 'founder', 'proprietress', 'organogram', 'staff', 'prefect', 'head boy', 'head girl', 'who runs', 'management'], a: 'The About page has the school story, the Founder (Pst. O. Ajayi), the Proprietress (Pst. Mrs. K. Ajayi), the organogram and the prefects.', l: [['About us', '#/about']] },
  { k: ['contact', 'call', 'phone', 'address', 'where is', 'location', 'directions', 'office hours', 'email'], a: '__contact__', l: [['Contact page', '#/more']] },
  { k: ['class', 'level', 'creche', 'nursery', 'primary', 'jss', 'sss', 'secondary', 'which classes'], a: 'We run Creche, Nursery 1 to 2, Primary 1 to 6, Junior Secondary (JSS 1 to 3) and Senior Secondary (SSS 1 to 3).', l: [] },
  { k: ['login', 'log in', 'sign in', 'cannot login', 'cant login', 'password', 'forgot', 'reset', 'username', 'id number'], a: 'To sign in: on the home page choose your portal (Student, Parent, Teacher, Payment, Bursar or Admin) and enter the ID and password the school gave you (students AAC/ST/###, parents AAC/P/###). Forgotten password? Only the school admin can reset it: call the office, or send a request below.', l: [['Sign in', '#/']], send: true },
  { k: ['install', 'app', 'download app', 'add to home screen', 'pwa', 'phone app'], a: 'You can install this site as an app: on Android Chrome, open the menu and choose "Install app" (or press the Install button when shown); on iPhone Safari, press Share, then "Add to Home Screen".', l: [] },
  { k: ['feedback', 'complain', 'complaint', 'suggest', 'suggestion', 'enquiry', 'inquiry', 'request', 'report a problem', 'message the school', 'reply'], a: 'Use the Feedback box to send an enquiry, complaint, feedback or suggestion. Anyone can use it. You get a reference number, and the school\'s reply shows on the bell. I can also send your message for you: just type it here and press "Send this to the school".', l: [['Feedback box', '#/feedback'], ['My replies', '#/replies']], send: true },
  { k: ['sms', 'text parents', 'whatsapp', 'message parents', 'bulk message'], r: ['admin'], a: 'Open "Message parents (SMS)" on the admin dashboard: choose all parents, one class or chosen students, write the message and send by SMS (needs the SMS key) or WhatsApp (free, one tap per parent). It also appears on the parents\' bell.', l: [['Message parents', '#/manage/sms']] },
  { k: ['add student', 'student list', 'import student', 'csv', 'create login', 'create account', 'student id', 'parent id'], r: ['admin'], a: 'Admin: open Manage > Students to add or import (CSV) students; IDs and parent IDs are assigned automatically and siblings with the same parent phone share one parent ID. Then press "Create logins for students and parents". Accounts and passwords can be reset under Accounts.', l: [['Students', '#/manage/students'], ['Accounts', '#/accounts']] },
  { k: ['admit', 'application list', 'applications'], r: ['admin'], a: 'Admin: open Manage > Applications, tick the applicants (or none for all new) and press "Admit". Each gets a student ID and parent ID, and a CSV of the IDs downloads.', l: [['Applications', '#/manage/applications']] },
  { k: ['settings', 'logo', 'watermark', 'bank details', 'site settings', 'hero', 'change picture on home'], r: ['admin'], a: 'Admin: open Manage > Site settings to change the logo, home picture, watermark, founder and proprietress details, bank details and phone numbers.', l: [['Site settings', '#/manage/settings']] },
  { k: ['moderate', 'delete post', 'community posts', 'inappropriate'], r: ['admin'], a: 'Admin: open Manage > Community posts (moderate) to review everything written in the rooms and forums, edit wording or delete a post.', l: [['Community posts', '#/manage/forum']] },
  { k: ['upload assignment', 'add assignment', 'add test', 'schedule class', 'upload note', 'add notebook', 'teacher upload'], r: ['teacher', 'admin'], a: 'Teachers: open Assignments, Tests and exams, Notebooks or Live classes on your dashboard and press the add button. Choose the class and subject so students see it.', l: [['Assignments', '#/p/assignments'], ['Live classes', '#/p/live']] }
];

const ROLE_CHIPS = {
  '': ['How do I apply?', 'Check a result', 'School fees', 'Contact the school', 'Make a complaint'],
  student: ['My assignments', 'When is my live class?', 'My scores', 'Add my picture', 'Make a request'],
  parent: ['How much do I owe?', 'How do I pay fees?', 'My child\'s scores', 'Next PTA meeting', 'Make a complaint'],
  teacher: ['Add an assignment', 'Enter scores', 'Schedule a live class', 'Teachers forum'],
  bursar: ['Confirm a payment', 'Who owes fees?', 'Payment portal'],
  admin: ['Admit applicants', 'Message parents', 'Reset a password', 'Community posts', 'What needs my attention?']
};

const words = t => t.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ');
function best(q, role) {
  const t = ' ' + words(q) + ' '; let top = null, ts = 0;
  for (const e of KB) {
    if (e.r && !e.r.includes(role)) continue;
    const sc = e.k.reduce((n, k) => n + (t.includes(' ' + k + ' ') || t.includes(' ' + k) && k.length > 4 ? (k.includes(' ') ? 2 : 1) : 0), 0);
    if (sc > ts) { ts = sc; top = e; }
  }
  return { e: top, score: ts };
}

// Live answers from school data (only the signed-in person's own data).
async function live(q, s) {
  const t = words(q); const has = (...w) => w.some(x => t.includes(x)); const role = s ? s.role : ''; const td = new Date().toISOString().slice(0, 10);
  const kids = s && ['student', 'parent'].includes(role) ? await myStudents(s).catch(() => []) : []; const classes = [...new Set(kids.map(x => x.class))];
  if (has('live class', 'online class') && has('when', 'next', 'today', 'time', 'schedule')) {
    const all = (await data.list('liveclasses')).filter(x => (x.date || '') >= td && (!classes.length || classes.includes(x.class))).sort((a, b) => String(a.date).localeCompare(b.date));
    return all.length ? { a: 'Upcoming live classes: ' + all.slice(0, 3).map(x => `${x.subject}, ${x.title} (${x.class}) on ${fmtDate(x.date)}${x.time ? ' at ' + x.time : ''}`).join('; ') + '.', l: [['Open live classes', '#/p/live']] } : { a: 'No live class is scheduled yet. Check again later or ask your teacher.', l: [['Live classes', '#/p/live']] };
  }
  if (has('pta') && has('when', 'next', 'date')) {
    const m = (await data.list('ptameetings')).filter(x => (x.date || '') >= td).sort((a, b) => String(a.date).localeCompare(b.date))[0];
    return m ? { a: `Next PTA meeting: ${m.title}, ${fmtDate(m.date)}${m.time ? ' at ' + m.time : ''}${m.venue ? ', ' + m.venue : ''} (${m.mode || 'Physical'}).`, l: [['PTA page', '#/p/pta']] } : { a: 'No PTA meeting is scheduled yet.', l: [['PTA page', '#/p/pta']] };
  }
  if (has('assignment', 'homework') && has('due', 'when', 'next', 'pending') && classes.length) {
    const a = (await data.list('assignments')).filter(x => classes.includes(x.class) && x.due && x.due >= td).sort((x, y) => String(x.due).localeCompare(y.due));
    return { a: a.length ? 'Upcoming assignments: ' + a.slice(0, 4).map(x => `${x.subject}, ${x.title} (due ${fmtDate(x.due)})`).join('; ') + '.' : 'No assignment is due right now.', l: [['Assignments', '#/p/assignments']] };
  }
  if (has('test', 'exam') && has('when', 'next', 'date') && classes.length) {
    const a = (await data.list('tests')).filter(x => classes.includes(x.class) && x.date && x.date >= td).sort((x, y) => String(x.date).localeCompare(y.date));
    return { a: a.length ? 'Upcoming: ' + a.slice(0, 4).map(x => `${x.kind || 'Test'} ${x.subject} (${fmtDate(x.date)}${x.time ? ', ' + x.time : ''})`).join('; ') + '.' : 'No test is scheduled right now.', l: [['Tests and exams', '#/p/tests']] };
  }
  if (has('owe', 'balance', 'outstanding', 'how much') && has('fee', 'owe', 'balance', 'outstanding', 'pay') && kids.length) {
    const [fees, pays] = await Promise.all([data.list('fees'), data.list('payments')]); const lines = [];
    kids.forEach(k => data.feeLines(k, fees, pays).filter(l => l.balance > 0).forEach(l => lines.push(`${k.name.split(' ')[0]}: ${l.fee.title} ${money(l.balance)}`)));
    return { a: lines.length ? 'Outstanding fees: ' + lines.join('; ') + '.' : 'Good news: no outstanding fees on record.', l: [['Pay now', '#/p/pay'], ['My fees', '#/p/fees']] };
  }
  if (has('birthday') && has('today')) {
    const c = await data.celebrants(0).catch(() => []);
    return { a: c.length ? 'Birthdays today: ' + c.map(x => x.name).join(', ') + '. Happy birthday!' : 'No birthday today.', l: [['Celebrations', '#/celebrations']] };
  }
  if (has('latest', 'new', 'what is happening', 'announcement', 'news')) {
    const a = (await data.list('announcements')).sort((x, y) => String(y.date).localeCompare(x.date)).slice(0, 3);
    if (a.length && has('latest', 'announcement', 'news', 'happening')) return { a: 'Latest announcements: ' + a.map(x => x.title).join('; ') + '.', l: [['Announcements', '#/announcements']] };
  }
  if (role === 'admin' && has('attention', 'pending', 'to do')) {
    const [pay, app, fb] = await Promise.all([data.list('payments'), data.list('applications'), data.list('feedback')]);
    const bits = [`${new Set(pay.filter(p => p.status === 'Pending').map(p => p.receipt)).size} payment(s) to confirm`, `${app.filter(x => (x.status || 'New') === 'New').length} new application(s)`, `${fb.filter(x => (x.status || 'New') === 'New').length} new feedback message(s)`];
    return { a: 'Waiting for you: ' + bits.join(', ') + '.', l: [['Payments', '#/p/pay'], ['Applications', '#/manage/applications'], ['Feedback', '#/manage/feedback']] };
  }
  return null;
}

async function contactText() { const st = await data.getSettings(); return `${st.schoolName}, ${st.address}. Phone: ${st.phones.map(p => p.label).join(', ')}.`; }

async function answer(q, s) {
  const role = s ? s.role : ''; const lv = await live(q, s).catch(() => null); if (lv) return { ...lv, who: 'guide' };
  const { e, score } = best(q, role === 'payment' ? 'parent' : role);
  const wants = /(complain|complaint|suggest|enquir|inquir|request|report|problem|issue|not working|help me|forgot|reset|wrong|error|unhappy|bad)/i.test(q);
  const ctx = { role: role || 'visitor', name: s ? s.name : '', school: (await data.getSettings()).schoolName };
  if (score < 2) { const ai = await data.askAI(hist.slice(-10), ctx); if (ai) return { a: ai, l: e && score ? e.l : [], send: wants, who: 'ai' }; }
  if (e && score >= 1) { const a = e.a === '__contact__' ? await contactText() : e.a; return { a, l: e.l || [], send: e.send || wants, who: 'guide' }; }
  if (/^(hi|hello|hey|good (morning|afternoon|evening))/i.test(q.trim())) return { a: `Hello${s ? ', ' + s.name.split(' ')[0] : ''}! I am the school assistant. Ask me what, where, when or how about anything on this site, or tell me a complaint, request or enquiry and I will send it to the school.`, l: [], who: 'guide' };
  return { a: 'I am not sure I understood that. I can guide you around the site, answer questions about admission, fees, results, classes and portals, or send your message to the school office so a person can reply. ' + await contactText(), l: [['Feedback box', '#/feedback']], send: true, who: 'guide' };
}

export function mountChat() {
  const host = $('#chatMount'); if (!host || host.dataset.on) return; host.dataset.on = '1';
  host.innerHTML = `<button class="fab" id="chatFab" type="button" aria-label="Ask the school assistant">${ic('chat')}<span>Ask us</span></button>
  <dialog class="chat" id="chatBox" aria-label="School assistant"><div class="chat-head"><b>School assistant</b><button type="button" id="chatX" aria-label="Close chat">${ic('close')}</button></div>
  <div class="chat-log" id="chatLog" aria-live="polite"></div><div class="chips" id="chatChips"></div>
  <form class="chat-in" id="chatForm"><input class="input" id="chatQ" placeholder="Ask what, where, when or how, or type a complaint or request" autocomplete="off" aria-label="Your question"><button class="btn btn-sm" type="submit" aria-label="Send">${ic('send')}</button></form></dialog>`;
  const box = $('#chatBox'), log = $('#chatLog'); let lastUser = '';
  const add = (who, t, extra = {}) => {
    const d = document.createElement('div'); d.className = 'msg ' + who; const p = document.createElement('div'); p.textContent = t; d.appendChild(p);
    const acts = document.createElement('div'); acts.className = 'msg-acts';
    (extra.l || []).forEach(([label, href]) => { const a = document.createElement('a'); a.className = 'btn btn-ghost btn-sm'; a.href = href; a.textContent = label; a.onclick = () => box.close(); acts.appendChild(a); });
    if (extra.send) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm'; b.textContent = 'Send this to the school'; b.onclick = () => sendToSchool(b, extra.msg); acts.appendChild(b); }
    if (acts.children.length) d.appendChild(acts);
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  };
  async function sendToSchool(btn, msg) {
    btn.disabled = true; btn.textContent = 'Sending…'; const s = await data.getSession().catch(() => null);
    const type = /complain|unhappy|bad|wrong|problem/i.test(msg) ? 'Complaint' : /suggest/i.test(msg) ? 'Suggestion' : /enquir|inquir|how|when|where|what/i.test(msg) ? 'Enquiry' : 'Request';
    const ref = data.newRef('FB');
    try { data.trackRef(ref); window.dispatchEvent(new Event('aac:replies')); await data.submitPublic('feedback', { type, name: s ? s.name : '', contact: '', message: msg + (s ? `\n(Sent through the assistant by ${s.name}, ${s.role})` : '\n(Sent through the assistant)'), status: 'New', ref }); btn.parentNode.remove();
      add('bot', `Sent to the school as a ${type.toLowerCase()}. Your reference is ${ref}. The reply will show on the bell at the top of the site. If it is urgent, please call the office.`, { l: [['My replies', '#/replies']] });
    } catch { btn.disabled = false; btn.textContent = 'Send this to the school'; add('bot', 'I could not send that just now. Please use the Feedback box or call the school office.', { l: [['Feedback box', '#/feedback']] }); }
  }
  const chips = async () => { const s = await data.getSession().catch(() => null); const r = s ? (s.role === 'payment' ? 'parent' : s.role) : ''; $('#chatChips').innerHTML = (ROLE_CHIPS[r] || ROLE_CHIPS['']).map(c => `<button type="button">${esc(c)}</button>`).join(''); return s; };
  const ask = async q => {
    q = q.trim(); if (!q) return; lastUser = q; add('me', q); hist.push({ role: 'user', content: q }); const w = add('bot', '…');
    try { const s = await data.getSession().catch(() => null); const r = await answer(q, s); hist.push({ role: 'assistant', content: r.a }); w.remove(); add('bot', r.a, { l: r.l, send: r.send, msg: q }); }
    catch { w.textContent = 'Sorry, something went wrong. Please call the school office.'; }
    log.scrollTop = log.scrollHeight;
  };
  $('#chatFab').onclick = async () => { box.showModal(); const s = await chips(); if (!log.children.length) add('bot', `Hello${s ? ', ' + s.name.split(' ')[0] : ''}! I am the school assistant. Ask me what, where, when or how about anything here, or tell me a complaint, request or enquiry and I will send it to the school.`); $('#chatQ').focus(); };
  $('#chatX').onclick = () => box.close(); box.onclick = e => { if (e.target === box) box.close(); };
  $('#chatChips').onclick = e => { if (e.target.tagName === 'BUTTON') ask(e.target.textContent); };
  $('#chatForm').onsubmit = e => { e.preventDefault(); const i = $('#chatQ'); const v = i.value; i.value = ''; ask(v); };
  window.addEventListener('aac:login', () => { chips(); });
}
