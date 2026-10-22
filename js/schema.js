// What the admin (and teacher / bursar) can manage. One entry per collection.
// Field types: text, textarea, select, date, number, checkbox, file, image, readonly-capable via `readonly: true`.
import { CLASSES, TERMS, fmtDate, money } from './ui.js';
import { CONFIG } from './config.js';

export const POSITIONS = ['Head Boy', 'Head Girl', 'Assistant Head Boy', 'Assistant Head Girl', 'Senior Prefect', 'Prefect', 'Class Captain'];
export const FEE_CATEGORIES = ['School fee', 'Textbooks and exercise books', 'Uniforms', 'Other'];
const AUDIENCES = [['all', 'Everyone (public)'], ['students', 'Students only'], ['parents', 'Parents only'], ['teachers', 'Teachers only']];
const FILE_AUD = [['all', 'Everyone signed in'], ['students', 'Students'], ['parents', 'Parents'], ['teachers', 'Teachers']];

export const COLS = {
  announcements: {
    label: 'Announcements', one: 'announcement', icon: 'mega', roles: ['admin'],
    title: r => r.title, sub: r => `${fmtDate(r.date)} · ${(AUDIENCES.find(a => a[0] === r.audience) || [])[1] || 'Everyone'}${r.pinned ? ' · Pinned' : ''}`,
    sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'body', label: 'Message', type: 'textarea', required: true },
      { key: 'audience', label: 'Who can see it', type: 'select', options: AUDIENCES, required: true, default: 'all' },
      { key: 'date', label: 'Date', type: 'date', required: true, default: 'today' },
      { key: 'pinned', label: 'Pin to the top', type: 'checkbox' },
      { key: 'file', label: 'Attach a file (optional)', type: 'file' }
    ]
  },
  prefects: {
    label: 'Prefects', one: 'prefect', icon: 'star', roles: ['admin'],
    title: r => r.name, sub: r => `${r.position}${r.class ? ' · ' + r.class : ''}`,
    sort: (a, b) => POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position),
    fields: [
      { key: 'name', label: 'Full name', type: 'text', required: true },
      { key: 'position', label: 'Position', type: 'select', options: POSITIONS, required: true },
      { key: 'class', label: 'Class', type: 'select', options: CLASSES },
      { key: 'photo', label: 'Photo', type: 'image' }
    ]
  },
  staff: {
    label: 'Teachers and staff', one: 'staff member', icon: 'people', roles: ['admin'],
    title: r => r.name, sub: r => [r.role, r.subject].filter(Boolean).join(' · '),
    fields: [
      { key: 'name', label: 'Full name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text', required: true, hint: 'Founder, Proprietress, Head teacher, Teacher, Bursar...' },
      { key: 'subject', label: 'Subject or class (optional)', type: 'text' },
      { key: 'bio', label: 'Short note (optional)', type: 'textarea' },
      { key: 'photo', label: 'Photo', type: 'image' }
    ]
  },
  students: {
    label: 'Students', one: 'student', icon: 'cap', roles: ['admin'],
    title: r => r.name, sub: r => `${r.reg_no} · ${r.class}`,
    sort: (a, b) => String(a.name).localeCompare(String(b.name)),
    idFrom: r => 'stu-' + String(r.reg_no).toUpperCase().replace(/[^A-Z0-9]/g, ''),
    fields: [
      { key: 'name', label: 'Full name', type: 'text', required: true },
      { key: 'reg_no', label: 'Reg. number', type: 'text', required: true, hint: 'Example: AAC/2026/001' },
      { key: 'class', label: 'Class', type: 'select', options: CLASSES, required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male'] },
      { key: 'parentName', label: 'Parent or guardian', type: 'text' },
      { key: 'parentPhone', label: 'Parent phone', type: 'text' }
    ]
  },
  curriculum: {
    label: 'Curriculum', one: 'curriculum entry', icon: 'list', roles: ['admin', 'teacher'],
    title: r => `${r.class}: ${r.subject}`, sub: r => r.term,
    sort: (a, b) => CLASSES.indexOf(a.class) - CLASSES.indexOf(b.class) || String(a.subject).localeCompare(String(b.subject)),
    fields: [
      { key: 'class', label: 'Class level', type: 'select', options: CLASSES, required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'term', label: 'Term', type: 'select', options: [...TERMS, 'Whole session'], required: true },
      { key: 'topics', label: 'Topics', type: 'textarea', required: true, hint: 'One topic per line' },
      { key: 'file', label: 'Curriculum document (optional)', type: 'file' }
    ]
  },
  lessonNotes: {
    label: 'Lesson notes', one: 'lesson note', icon: 'book', roles: ['admin', 'teacher'], ownOnly: true,
    title: r => r.title, sub: r => `${r.class} · ${r.subject}${r.week ? ' · ' + r.week : ''}${r.teacherName ? ' · ' + r.teacherName : ''}`,
    sort: (a, b) => String(b._created || '').localeCompare(String(a._created || '')),
    fields: [
      { key: 'class', label: 'Class level', type: 'select', options: CLASSES, required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'title', label: 'Topic / title', type: 'text', required: true },
      { key: 'week', label: 'Week (optional)', type: 'text', hint: 'Example: Week 3' },
      { key: 'body', label: 'Lesson note', type: 'textarea', required: true },
      { key: 'file', label: 'Attach a file (optional)', type: 'file' }
    ]
  },
  fees: {
    label: 'Fees', one: 'fee item', icon: 'card', roles: ['admin', 'bursar'], needs: ['students'],
    title: r => r.title, sub: (r, c) => `${r.category} · ${money(r.amount)} · ${feeScopeLabel(r, c)}${r.term ? ' · ' + r.term : ''}`,
    sort: (a, b) => String(a.category).localeCompare(String(b.category)),
    fields: [
      { key: 'title', label: 'Fee name', type: 'text', required: true, hint: 'Example: First term school fee' },
      { key: 'category', label: 'Section', type: 'select', options: FEE_CATEGORIES, required: true },
      { key: 'amount', label: 'Amount (₦)', type: 'number', required: true },
      { key: 'scope', label: 'Applies to', type: 'select', options: [['all', 'All students'], ['class', 'One class level'], ['student', 'One student']], required: true, default: 'all' },
      { key: 'targetClass', label: 'Class level', type: 'select', options: CLASSES, required: true, showIf: ['scope', 'class'] },
      { key: 'targetReg', label: 'Student', type: 'select', optionsFrom: 'students', required: true, showIf: ['scope', 'student'] },
      { key: 'session', label: 'Session', type: 'select', options: CONFIG.SESSIONS, required: true },
      { key: 'term', label: 'Term', type: 'select', options: [...TERMS, 'Whole session'] },
      { key: 'due', label: 'Due date', type: 'date' },
      { key: 'note', label: 'Note (optional)', type: 'textarea' }
    ]
  },
  payments: {
    label: 'Payments', one: 'payment', icon: 'wallet', roles: ['admin', 'bursar'], needs: ['students', 'fees', 'payments'],
    title: (r, c) => `${(c.students.find(s => s.reg_no === r.regNo) || {}).name || r.regNo}: ${money(r.amount)}`,
    sub: (r, c) => `${(c.fees.find(f => f.id === r.feeId) || {}).title || 'Fee'} · ${fmtDate(r.date)} · ${r.method} · ${r.receipt}`,
    sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
    extra: r => `<a class="btn btn-ghost btn-sm" href="#/receipt/${encodeURIComponent(r.id)}">Receipt</a>`,
    fields: [
      { key: 'regNo', label: 'Student', type: 'select', optionsFrom: 'students', required: true },
      { key: 'feeId', label: 'Fee being paid', type: 'select', dependsOn: 'regNo', required: true },
      { key: 'amount', label: 'Amount paid (₦)', type: 'number', required: true },
      { key: 'method', label: 'Method', type: 'select', options: ['Cash', 'Bank transfer', 'POS', 'Online'], required: true },
      { key: 'date', label: 'Date paid', type: 'date', required: true, default: 'today' },
      { key: 'note', label: 'Note (optional)', type: 'text' }
    ]
  },
  feedback: {
    label: 'Feedback box', one: 'message', icon: 'mail', roles: ['admin'], noCreate: true,
    title: r => `${r.type}: ${String(r.message || '').slice(0, 60)}`, sub: r => `${r.name || 'Anonymous'} · ${fmtDate(r._created)} · ${r.status || 'New'}`,
    sort: (a, b) => String(b._created || '').localeCompare(String(a._created || '')),
    fields: [
      { key: 'type', label: 'Type', type: 'text', readonly: true }, { key: 'name', label: 'Name', type: 'text', readonly: true },
      { key: 'contact', label: 'Phone or email', type: 'text', readonly: true }, { key: 'message', label: 'Message', type: 'textarea', readonly: true },
      { key: 'status', label: 'Status', type: 'select', options: ['New', 'In progress', 'Resolved'], required: true },
      { key: 'adminNote', label: 'Our note or reply', type: 'textarea' }
    ]
  },
  applications: {
    label: 'Applications', one: 'application', icon: 'form', roles: ['admin'], noCreate: true,
    title: r => `${r.firstName} ${r.surname}: ${r.classApplied}`, sub: r => `${r.ref} · ${r.guardianName} · ${r.phone} · ${r.status || 'New'}`,
    sort: (a, b) => String(b._created || '').localeCompare(String(a._created || '')),
    fields: [
      { key: 'ref', label: 'Reference', type: 'text', readonly: true }, { key: 'firstName', label: 'First name', type: 'text', readonly: true },
      { key: 'surname', label: 'Surname', type: 'text', readonly: true }, { key: 'dob', label: 'Date of birth', type: 'text', readonly: true },
      { key: 'gender', label: 'Gender', type: 'text', readonly: true }, { key: 'classApplied', label: 'Class', type: 'text', readonly: true },
      { key: 'previousSchool', label: 'Previous school', type: 'text', readonly: true }, { key: 'guardianName', label: 'Parent or guardian', type: 'text', readonly: true },
      { key: 'relationship', label: 'Relationship', type: 'text', readonly: true }, { key: 'phone', label: 'Phone', type: 'text', readonly: true },
      { key: 'whatsapp', label: 'WhatsApp', type: 'text', readonly: true }, { key: 'email', label: 'Email', type: 'text', readonly: true },
      { key: 'address', label: 'Address', type: 'textarea', readonly: true },
      { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Form collected', 'Exam scheduled', 'Admitted', 'Declined'], required: true },
      { key: 'adminNote', label: 'Our note', type: 'textarea' }
    ]
  },
  album: {
    label: 'School album', one: 'photo', icon: 'image', roles: ['admin'],
    title: r => r.title, sub: r => `${r.category}${r.date ? ' · ' + fmtDate(r.date) : ''}`,
    sort: (a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || '')),
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['School life', 'Events', 'Sports and activities', 'Graduation', 'Classroom', 'Other'], required: true },
      { key: 'image', label: 'Photo', type: 'image', required: true },
      { key: 'caption', label: 'Caption (optional)', type: 'text' },
      { key: 'date', label: 'Date (optional)', type: 'date' },
      { key: 'featured', label: 'Show in the home page slideshow', type: 'checkbox' }
    ]
  },
  files: {
    label: 'Library and files', one: 'file', icon: 'folder', roles: ['admin', 'teacher'],
    title: r => r.title, sub: r => `${r.category} · ${(FILE_AUD.find(a => a[0] === r.audience) || [])[1] || ''}`,
    sort: (a, b) => String(b._created || '').localeCompare(String(a._created || '')),
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Library book', 'Result sheet', 'Circular', 'Form', 'Past questions', 'Other'], required: true },
      { key: 'audience', label: 'Who can open it', type: 'select', options: FILE_AUD, required: true, default: 'all' },
      { key: 'file', label: 'File', type: 'file', required: true },
      { key: 'description', label: 'Description (optional)', type: 'textarea' }
    ]
  },
  settings: {
    label: 'Site settings', one: 'settings', icon: 'sliders', roles: ['admin'], single: 'site',
    title: () => 'Site settings', sub: () => '',
    fields: [
      { key: 'schoolName', label: 'School name', type: 'text' },
      { key: 'motto', label: 'Motto', type: 'text' },
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'phonesText', label: 'Phone numbers', type: 'textarea', hint: 'One number per line' },
      { key: 'welcomeTitle', label: 'Welcome headline (home page)', type: 'text' },
      { key: 'aboutText', label: 'About the school (public page)', type: 'textarea' },
      { key: 'subjectsText', label: 'Subjects offered', type: 'textarea', hint: 'One per line' },
      { key: 'facilitiesText', label: 'Facilities', type: 'textarea', hint: 'One per line' },
      { key: 'activitiesText', label: 'Activities', type: 'textarea', hint: 'One per line' },
      { key: 'bankName', label: 'Bank name (shown on Fees page)', type: 'text' },
      { key: 'accountName', label: 'Account name', type: 'text' },
      { key: 'accountNumber', label: 'Account number', type: 'text' },
      { key: 'feeNote', label: 'Note shown on the Fees page', type: 'textarea' }
    ]
  }
};
export const ADMIN_ORDER = ['announcements', 'prefects', 'staff', 'students', 'curriculum', 'lessonNotes', 'fees', 'payments', 'feedback', 'applications', 'album', 'files', 'settings'];

function feeScopeLabel(r, c) {
  if (r.scope === 'class') return r.targetClass;
  if (r.scope === 'student') { const s = ((c && c.students) || []).find(x => x.reg_no === r.targetReg); return s ? s.name : r.targetReg; }
  return 'All students';
}
