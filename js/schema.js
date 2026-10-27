// What the admin (and teacher / bursar) can manage. One entry per collection.
// Field types: text, textarea, select, date, number, checkbox, file, image, readonly-capable via `readonly: true`.
import { CLASSES, TERMS, fmtDate, money } from './ui.js';
import { CONFIG } from './config.js';

export const POSITIONS = ['Head Boy', 'Head Girl', 'Assistant Head Boy', 'Assistant Head Girl', 'Senior Prefect (Boy)', 'Senior Prefect (Girl)', 'Games Prefect', 'Sports Prefect', 'Library Prefect', 'Dining Hall Prefect', 'Health Prefect', 'Time Keeper', 'Welfare Prefect', 'Social Prefect', 'Disciplinary Prefect', 'Labour Prefect', 'Environment and Sanitation Prefect', 'Chapel / Mosque Prefect', 'Press Prefect', 'Assembly Prefect', 'Boarding / House Prefect', 'Class Prefect', 'Class Captain', 'Assistant Class Captain', 'Prefect'];
export const ORG_LEVELS = [['1', 'Level 1: Proprietor / Board'], ['2', 'Level 2: Principal / Head of school'], ['3', 'Level 3: Vice principal / Heads of section'], ['4', 'Level 4: Teachers and staff'], ['5', 'Level 5: Support staff']];
export const FILE_TYPES = ['Textbook', 'Extract', 'Article', 'Past questions', 'Reference link', 'Circular', 'Form', 'Result sheet', 'Other'];
export const ACTIVITIES = ['Community service', 'Sports', 'Phonics and oral class', 'School fellowship', 'Music', 'Excursion'];
export const HONOURS = ['Birthday celebrant', 'Face of the school', 'Student of the week', 'Student of the term', 'Student of the session', 'Student of the year', 'Teacher of the term', 'Best class of the term', 'Other honour'];
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
      { key: 'mandatory', label: 'Mandatory instruction (alerts everyone on the bell)', type: 'checkbox' },
      { key: 'sms', label: 'Also text this to all parents\' phones right now (SMS, sent when you save a new announcement)', type: 'checkbox' },
      { key: 'image', label: 'Flier / advert picture (shows on home page)', type: 'image' },
      { key: 'file', label: 'Attach a file (jpg, png, pdf...)', type: 'file' }
    ]
  },
  prefects: {
    csv: true,
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
    csv: true,
    label: 'Teachers and staff', one: 'staff member', icon: 'people', roles: ['admin'],
    title: r => r.name, sub: r => [r.role, r.subject].filter(Boolean).join(' · '),
    fields: [
      { key: 'name', label: 'Full name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text', required: true, hint: 'Founder, Proprietress, Head teacher, Teacher, Bursar...' },
      { key: 'subject', label: 'Subject or class (optional)', type: 'text' },
      { key: 'orgLevel', label: 'Position on organogram', type: 'select', options: ORG_LEVELS, default: '4', hint: 'Used to draw the school organogram on the About page' },
      { key: 'reportsTo', label: 'Reports to (name, optional)', type: 'text' },
      { key: 'birthMonth', label: 'Birthday: month (optional, for birthday greetings)', type: 'select', options: [['1','January'],['2','February'],['3','March'],['4','April'],['5','May'],['6','June'],['7','July'],['8','August'],['9','September'],['10','October'],['11','November'],['12','December']] },
      { key: 'birthDay', label: 'Birthday: day of the month (optional)', type: 'number' },
      { key: 'bio', label: 'Short note (optional)', type: 'textarea' },
      { key: 'photo', label: 'Photo', type: 'image' }
    ]
  },
  students: {
    csv: true,
    label: 'Students', one: 'student', icon: 'cap', roles: ['admin'],
    sample: ['Ada Okafor', '', 'JSS 1', 'Female', 'Mrs Okafor', '08012345678', ''],
    title: r => r.name, sub: r => `${r.reg_no} · ${r.class}`,
    sort: (a, b) => String(a.name).localeCompare(String(b.name)),
    idFrom: r => 'stu-' + String(r.reg_no).toUpperCase().replace(/[^A-Z0-9]/g, ''),
    fields: [
      { key: 'name', label: 'Full name', type: 'text', required: true },
      { key: 'reg_no', label: 'Reg. number', type: 'text', hint: 'Leave empty and the next number (AAC/ST/002...) is given automatically' },
      { key: 'class', label: 'Class', type: 'select', options: CLASSES, required: true },
      { key: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male'] },
      { key: 'parentName', label: 'Parent or guardian', type: 'text' },
      { key: 'parentPhone', label: 'Parent phone', type: 'text', hint: 'Children with the same parent phone share one parent ID automatically' },
      { key: 'photo', label: 'Profile picture (shows on their dashboard, posts and messages)', type: 'image' },
      { key: 'parentId', label: 'Parent ID (parent login)', type: 'text', hint: 'Leave empty to assign automatically (AAC/P/002...). Use an existing parent ID to add a child to that parent.' }
    ]
  },
  curriculum: {
    csv: true,
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
    label: 'Lesson notes', one: 'lesson note', icon: 'book', roles: ['admin', 'teacher'],
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
  notebooks: {
    label: 'Notebooks', one: 'notebook', icon: 'book', roles: ['admin', 'teacher'],
    title: r => r.title, sub: r => `${r.class} · ${r.subject}${r.term ? ' · ' + r.term : ''}${r.teacherName ? ' · ' + r.teacherName : ''}`,
    sort: (a, b) => CLASSES.indexOf(a.class) - CLASSES.indexOf(b.class) || String(a.subject).localeCompare(String(b.subject)) || String(a.title).localeCompare(String(b.title)),
    fields: [
      { key: 'class', label: 'Class level', type: 'select', options: CLASSES, required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'term', label: 'Term', type: 'select', options: [...TERMS, 'Whole session'] },
      { key: 'title', label: 'Topic', type: 'text', required: true },
      { key: 'body', label: 'Notebook (full explanation)', type: 'textarea', hint: 'Write the full explanation. Use "# Heading", "## Sub-heading", "- bullet", "1. numbered", and **bold**. Or just attach a PDF below.' },
      { key: 'file', label: 'Or upload the notebook (pdf, doc, jpg...)', type: 'file' }
    ]
  },
  assignments: {
    label: 'Assignments', one: 'assignment', icon: 'task', roles: ['admin', 'teacher'],
    title: r => r.title, sub: r => `${r.class} · ${r.subject}${r.due ? ' · Due ' + fmtDate(r.due) : ''}${r.teacherName ? ' · ' + r.teacherName : ''}`,
    sort: (a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || '')),
    fields: [
      { key: 'class', label: 'Class', type: 'select', options: CLASSES, required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'instructions', label: 'Instructions / questions', type: 'textarea', required: true },
      { key: 'session', label: 'Session', type: 'select', options: CONFIG.SESSIONS },
      { key: 'term', label: 'Term', type: 'select', options: TERMS },
      { key: 'date', label: 'Date given', type: 'date', default: 'today' },
      { key: 'due', label: 'Submission date', type: 'date' },
      { key: 'file', label: 'Attach worksheet (pdf, jpg, doc...)', type: 'file' }
    ]
  },
  tests: {
    label: 'Tests and exams', one: 'test', icon: 'form', roles: ['admin', 'teacher'],
    title: r => r.title, sub: r => `${r.class} · ${r.subject} · ${r.kind || 'Test'}${r.date ? ' · ' + fmtDate(r.date) : ''}`,
    sort: (a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || '')),
    fields: [
      { key: 'class', label: 'Class', type: 'select', options: CLASSES, required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true, hint: 'Example: First CA, Mid-term test, Exam' },
      { key: 'kind', label: 'Kind', type: 'select', options: ['Test', 'Exam', 'Quiz', 'Practical'], default: 'Test' },
      { key: 'session', label: 'Session', type: 'select', options: CONFIG.SESSIONS },
      { key: 'term', label: 'Term', type: 'select', options: TERMS },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'time', label: 'Time / duration', type: 'text' },
      { key: 'coverage', label: 'Topics covered / instructions', type: 'textarea' },
      { key: 'file', label: 'Attach test paper or timetable (optional)', type: 'file' }
    ]
  },
  scores: {
    csv: true, sample: ['AAC/2026/101', 'JSS 1', 'Mathematics', '2026/2027', 'First Term', 'First CA', '15', '20'],
    label: 'Scores (all)', one: 'score', icon: 'chart', roles: ['admin', 'teacher'], needs: ['students'],
    title: (r, c) => `${(c.students.find(s => s.reg_no === r.regNo) || {}).name || r.regNo}: ${r.score}/${r.max}`,
    sub: r => `${r.class} · ${r.subject} · ${r.assessment} · ${r.term} ${r.session}${r.teacherName ? ' · ' + r.teacherName : ''}`,
    sort: (a, b) => String(b._created || '').localeCompare(String(a._created || '')),
    fields: [
      { key: 'regNo', label: 'Reg. number', type: 'text', required: true },
      { key: 'class', label: 'Class', type: 'select', options: CLASSES, required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'session', label: 'Session', type: 'select', options: CONFIG.SESSIONS, required: true },
      { key: 'term', label: 'Term', type: 'select', options: TERMS, required: true },
      { key: 'assessment', label: 'Assessment', type: 'text', required: true, hint: 'First CA, Second CA, Exam, Assignment 1...' },
      { key: 'score', label: 'Score', type: 'number', required: true },
      { key: 'max', label: 'Out of', type: 'number', required: true }
    ]
  },
  fees: {
    csv: true,
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
    sub: (r, c) => `${r.feeTitle || (c.fees.find(f => f.id === r.feeId) || {}).title || 'Fee'} · ${fmtDate(r.date)} · ${r.method} · ${r.receipt}${r.status && r.status !== 'Confirmed' ? ' · ' + r.status.toUpperCase() : ''}`,
    sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
    extra: r => `${r.status === 'Pending' ? `<button class="btn btn-sm" type="button" data-confirm="${r.receipt}">Confirm</button>` : ''}<a class="btn btn-ghost btn-sm" href="#/receipt/${encodeURIComponent(r.receipt || r.id)}">Receipt</a>`,
    fields: [
      { key: 'regNo', label: 'Student', type: 'select', optionsFrom: 'students', required: true },
      { key: 'feeId', label: 'Fee being paid', type: 'select', dependsOn: 'regNo', required: true },
      { key: 'amount', label: 'Amount paid (₦)', type: 'number', required: true },
      { key: 'method', label: 'Method', type: 'select', options: ['Cash', 'Bank transfer', 'POS', 'Online'], required: true },
      { key: 'date', label: 'Date paid', type: 'date', required: true, default: 'today' },
      { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'Pending', 'Rejected'], default: 'Confirmed' },
      { key: 'proof', label: 'Proof of payment (if sent by parent)', type: 'image', accept: 'image/*,application/pdf' },
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
    label: 'Applications', one: 'application', icon: 'form', roles: ['admin'], csv: true, sample: ['','Ada','Okafor','2016-05-01','Female','Primary 3','Little Stars School','Mrs Okafor','Mother','08012345678','08012345678','','Ibadan','New',''],
    title: r => `${r.firstName} ${r.surname}: ${r.classApplied}`, sub: r => `${r.ref} · ${r.guardianName} · ${r.phone} · ${r.status || 'New'}`,
    extra: r => r.status === 'Admitted' ? '' : `<button class="btn btn-sm" type="button" data-admit="${r.id}">Admit</button>`,
    sort: (a, b) => String(b._created || '').localeCompare(String(a._created || '')),
    fields: [
      { key: 'photo', label: 'Passport photograph (optional)', type: 'image' },
      { key: 'ref', label: 'Reference (optional)', type: 'text' }, { key: 'firstName', label: 'First name', type: 'text', required: true },
      { key: 'surname', label: 'Surname', type: 'text', required: true }, { key: 'dob', label: 'Date of birth', type: 'text' },
      { key: 'gender', label: 'Gender', type: 'text' }, { key: 'classApplied', label: 'Class', type: 'select', options: CLASSES, required: true },
      { key: 'previousSchool', label: 'Previous school', type: 'text' }, { key: 'guardianName', label: 'Parent or guardian', type: 'text', required: true },
      { key: 'relationship', label: 'Relationship', type: 'text' }, { key: 'phone', label: 'Phone', type: 'text', required: true },
      { key: 'whatsapp', label: 'WhatsApp', type: 'text' }, { key: 'email', label: 'Email', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Form collected', 'Exam scheduled', 'Admitted', 'Declined'], required: true, default: 'New' },
      { key: 'adminNote', label: 'Our note', type: 'textarea' }
    ]
  },
  testimonials: {
    label: 'Testimonials and alumni', one: 'testimonial', icon: 'star', roles: ['admin'],
    title: r => r.name, sub: r => `${r.kind || 'Alumni'}${r.setYear ? ' · ' + r.setYear : ''} · ${r.published === true || r.published === 'true' ? 'Published' : 'Waiting for approval'}`,
    sort: (a, b) => String(b._created || '').localeCompare(String(a._created || '')),
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'kind', label: 'Who is this?', type: 'select', options: ['Alumni (past student)', 'Outgoing student (graduating)', 'Parent', 'Teacher or staff', 'Visitor / public'], required: true, default: 'Alumni (past student)' },
      { key: 'setYear', label: 'Set / graduation year or class (optional)', type: 'text', hint: 'Example: Set of 2024, SSS 3 2026/2027' },
      { key: 'now', label: 'What they do now / where they are going (optional)', type: 'text', hint: 'Example: 300L Medicine, University of Ibadan' },
      { key: 'message', label: 'Testimony', type: 'textarea', required: true },
      { key: 'photo', label: 'Photo', type: 'image' },
      { key: 'published', label: 'Show on the public website', type: 'checkbox' }
    ]
  },
  activities: {
    label: 'Activities pages', one: 'activity page', icon: 'cal', roles: ['admin'],
    title: r => r.title, sub: r => (r.summary || '').slice(0, 70),
    idFrom: r => 'act-' + String(r.key).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    sort: (a, b) => ACTIVITIES.indexOf(a.key) - ACTIVITIES.indexOf(b.key),
    fields: [
      { key: 'key', label: 'Activity', type: 'select', options: ACTIVITIES, required: true },
      { key: 'title', label: 'Page heading', type: 'text', required: true },
      { key: 'summary', label: 'One-line summary', type: 'text' },
      { key: 'body', label: 'Full description', type: 'textarea', required: true },
      { key: 'image', label: 'Main picture', type: 'image' },
      { key: 'file', label: 'Attach a flier or document (optional)', type: 'file' }
    ]
  },
  liveclasses: {
    label: 'Live classes', one: 'live class', icon: 'monitor', roles: ['admin', 'teacher'],
    title: r => r.title, sub: r => `${r.class} · ${r.subject} · ${r.date ? fmtDate(r.date) : ''} ${r.time || ''}${r.teacherName ? ' · ' + r.teacherName : ''}`,
    sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
    fields: [
      { key: 'class', label: 'Class', type: 'select', options: CLASSES, required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'title', label: 'Topic', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true, default: 'today' },
      { key: 'time', label: 'Start time', type: 'text', hint: 'Example: 10:00 AM' },
      { key: 'link', label: 'Meeting link (optional)', type: 'text', hint: 'Paste a Google Meet or Zoom link. Leave empty to use the built-in classroom (Jitsi).' },
      { key: 'noteTitle', label: 'Lesson note or notebook topic to teach from (optional)', type: 'text', hint: 'Type the topic name exactly as in Lesson notes or Notebooks' },
      { key: 'info', label: 'Instructions for students (optional)', type: 'textarea' }
    ]
  },
  questions: {
    csv: true, sample: ['JSS 1', 'Mathematics', 'Fractions', 'Objective', 'What is 1/2 + 1/4?', '1/4', '2/6', '3/4', '1/8', 'C', '1/2 = 2/4, so 2/4 + 1/4 = 3/4', 'Practice'],
    label: 'Question bank', one: 'question', icon: 'form', roles: ['admin', 'teacher'],
    title: r => String(r.question || '').slice(0, 90), sub: r => `${r.class} · ${r.subject} · ${r.topic || ''} · ${r.type} · ${r.source || ''}`,
    sort: (a, b) => CLASSES.indexOf(a.class) - CLASSES.indexOf(b.class) || String(a.subject).localeCompare(String(b.subject)),
    fields: [
      { key: 'class', label: 'Class', type: 'select', options: CLASSES, required: true },
      { key: 'subject', label: 'Subject', type: 'text', required: true },
      { key: 'topic', label: 'Topic', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: ['Objective', 'Theory'], required: true, default: 'Objective' },
      { key: 'question', label: 'Question', type: 'textarea', required: true },
      { key: 'a', label: 'Option A', type: 'text' }, { key: 'b', label: 'Option B', type: 'text' },
      { key: 'c', label: 'Option C', type: 'text' }, { key: 'd', label: 'Option D', type: 'text' },
      { key: 'answer', label: 'Correct answer (A, B, C or D) or model answer', type: 'text', required: true },
      { key: 'explanation', label: 'Explanation (optional)', type: 'textarea' },
      { key: 'source', label: 'Source', type: 'select', options: ['Practice', 'WAEC-style', 'NECO-style', 'BECE-style', 'Common Entrance style', 'Teacher set'], default: 'Practice' }
    ]
  },
  honours: {
    label: 'Celebrations and honours', one: 'honour', icon: 'award', roles: ['admin'],
    title: r => `${r.name}: ${r.kind}`, sub: r => `${r.period || ''}${r.class ? ' · ' + r.class : ''}`,
    sort: (a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || '')),
    fields: [
      { key: 'kind', label: 'Honour', type: 'select', options: HONOURS, required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'class', label: 'Class (optional)', type: 'text' },
      { key: 'period', label: 'Week, term or session', type: 'text', hint: 'Example: Week 4, First Term 2026/2027, 2026/2027 session' },
      { key: 'date', label: 'Date', type: 'date', default: 'today' },
      { key: 'message', label: 'Citation / message', type: 'textarea' },
      { key: 'photo', label: 'Photo', type: 'image' }
    ]
  },
  weekly: {
    label: 'Weekly engagement corner', one: 'weekly challenge', icon: 'mega', roles: ['admin', 'teacher'],
    title: r => r.title, sub: r => `${r.kind} · ${r.date ? fmtDate(r.date) : ''}${r.class ? ' · ' + r.class : ''}`,
    sort: (a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || '')),
    fields: [
      { key: 'kind', label: 'Kind', type: 'select', options: ['Question of the week', 'Curriculum activity of the week', 'Challenge', 'Project idea'], required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'body', label: 'The question or activity', type: 'textarea', required: true },
      { key: 'class', label: 'For which class (empty = everyone)', type: 'select', options: CLASSES },
      { key: 'date', label: 'Week starting', type: 'date', default: 'today' },
      { key: 'file', label: 'Attach a picture or file (optional)', type: 'file' }
    ]
  },
  ptameetings: {
    label: 'PTA meetings', one: 'PTA meeting', icon: 'people', roles: ['admin'],
    title: r => r.title, sub: r => `${r.date ? fmtDate(r.date) : ''} ${r.time || ''} · ${r.mode || 'Physical'}`,
    sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
    fields: [
      { key: 'title', label: 'Meeting title', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true, default: 'today' },
      { key: 'time', label: 'Time', type: 'text' },
      { key: 'mode', label: 'Meeting type', type: 'select', options: ['Physical', 'Virtual (online)', 'Both'], default: 'Physical' },
      { key: 'venue', label: 'Venue (physical)', type: 'text' },
      { key: 'link', label: 'Online meeting link (virtual)', type: 'text', hint: 'Paste a Google Meet or Zoom link. Leave empty to use the built-in room.' },
      { key: 'agenda', label: 'Agenda', type: 'textarea' },
      { key: 'minutes', label: 'Minutes or documents (optional)', type: 'file' }
    ]
  },
  ptamembers: {
    csv: true, sample: ['Mrs Ade', 'Chairperson', 'Parent', '08031112222'],
    label: 'PTA committee and members', one: 'PTA member', icon: 'people', roles: ['admin'],
    title: r => r.name, sub: r => `${r.role} · ${r.type}`,
    sort: (a, b) => String(a.type).localeCompare(String(b.type)) || String(a.name).localeCompare(String(b.name)),
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'role', label: 'PTA role', type: 'text', required: true, hint: 'Chairperson, Secretary, Treasurer, Member, School representative...' },
      { key: 'type', label: 'Parent or school staff', type: 'select', options: ['Parent', 'School staff (organogram)'], required: true, default: 'Parent' },
      { key: 'phone', label: 'Phone (optional)', type: 'text' },
      { key: 'photo', label: 'Photo', type: 'image' }
    ]
  },
  forum: {
    label: 'Community posts (moderate)', one: 'post', icon: 'mail', roles: ['admin'], noCreate: true,
    title: r => `${r.authorName || ''}: ${String(r.title || r.body || '').slice(0, 60)}`, sub: r => `${r.room} · ${r.role || ''} · ${fmtDate(r._created)}`,
    sort: (a, b) => String(b._created || '').localeCompare(String(a._created || '')),
    fields: [{ key: 'room', label: 'Room', type: 'text', readonly: true }, { key: 'authorName', label: 'Author', type: 'text', readonly: true }, { key: 'body', label: 'Message', type: 'textarea' }]
  },
  album: {
    label: 'School album', one: 'photo', icon: 'image', roles: ['admin'],
    title: r => r.title, sub: r => `${r.category}${r.collection ? ' · ' + r.collection : ''}${r.date ? ' · ' + fmtDate(r.date) : ''}`,
    sort: (a, b) => String(b.date || b._created || '').localeCompare(String(a.date || a._created || '')),
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['School life', 'Events', 'Sports and activities', 'Graduation', 'Classroom', 'Other'], required: true },
      { key: 'collection', label: 'Collection (album name)', type: 'text', hint: 'Example: Sports Day 2026, Graduation 2025, Cultural Day. Photos with the same collection are grouped together.' },
      { key: 'image', label: 'Photo or flier (jpg, png) or PDF', type: 'image', accept: 'image/*,application/pdf', required: true },
      { key: 'caption', label: 'Caption (optional)', type: 'text' },
      { key: 'date', label: 'Date (optional)', type: 'date' },
      { key: 'featured', label: 'Show in the home page slideshow', type: 'checkbox' }
    ]
  },
  files: {
    label: 'Library and files', one: 'file', icon: 'folder', roles: ['admin', 'teacher'],
    title: r => r.title, sub: r => `${r.category}${r.class ? ' · ' + r.class : ''}${r.session && r.session !== 'All sessions' ? ' · ' + r.session : ''}${r.subject ? ' · ' + r.subject : ''} · ${(FILE_AUD.find(a => a[0] === r.audience) || [])[1] || ''}`,
    sort: (a, b) => String(b._created || '').localeCompare(String(a._created || '')),
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Type', type: 'select', options: FILE_TYPES, required: true },
      { key: 'collection', label: 'Collection / shelf (optional)', type: 'text', hint: 'Example: WAEC preparation, JSS 1 Mathematics, Story books' },
      { key: 'class', label: 'Class', type: 'select', options: ['All classes', ...CLASSES] },
      { key: 'session', label: 'Session', type: 'select', options: ['All sessions', ...CONFIG.SESSIONS] },
      { key: 'subject', label: 'Subject / curriculum area (optional)', type: 'text' },
      { key: 'url', label: 'Link (optional, for online books and references)', type: 'text' },
      { key: 'audience', label: 'Who can open it', type: 'select', options: FILE_AUD, required: true, default: 'all' },
      { key: 'file', label: 'File (pdf, jpg, png, doc...)', type: 'file' },
      { key: 'description', label: 'Description (optional)', type: 'textarea' }
    ]
  },
  birthdays: {
    csv: true, sample: ['Ada Okafor', 'Student', 'JSS 1', '3', '15'],
    label: 'Birthdays', one: 'birthday', icon: 'star', roles: ['admin'],
    title: r => r.name, sub: r => `${r.kind || ''}${r.class ? ' · ' + r.class : ''} · ${r.md ? r.md.replace(/^(\d+)-(\d+)$/, (m, a, b) => ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+a] + ' ' + +b) : ''}`,
    sort: (a, b) => String(a.md || '').localeCompare(String(b.md || '')),
    fields: [
      { key: 'name', label: 'Full name', type: 'text', required: true },
      { key: 'kind', label: 'Who', type: 'select', options: ['Student', 'Parent', 'Teacher', 'Staff'], required: true, default: 'Student' },
      { key: 'class', label: 'Class or role (optional)', type: 'text' },
      { key: 'month', label: 'Month of birth', type: 'select', required: true, options: [['1','January'],['2','February'],['3','March'],['4','April'],['5','May'],['6','June'],['7','July'],['8','August'],['9','September'],['10','October'],['11','November'],['12','December']] },
      { key: 'day', label: 'Day of birth', type: 'number', required: true, hint: 'Only the month and day are kept and shown, never the year.' },
      { key: 'photo', label: 'Profile picture', type: 'image' }
    ]
  },
  sms: {
    label: 'Message parents (SMS)', one: 'message', icon: 'mail', roles: ['admin'], noCreate: true, custom: true,
    title: r => r.label || 'Message', sub: r => `${r.status || ''} · ${r.count || 0} of ${r.total || 0} numbers`, fields: []
  },
  userpics: { label: 'Profile pictures', one: 'picture', icon: 'user', roles: ['admin'], noCreate: true, hidden: true, title: r => r.name || r.userId, sub: r => r.role || '', fields: [{ key: 'name', label: 'Name', type: 'text', readonly: true }] },
  smslog: {
    label: 'SMS history', one: 'message', icon: 'mail', roles: ['admin'], noCreate: true, hidden: true,
    title: r => `${r.label || 'Message'}: ${r.status || ''}`, sub: r => `${String(r.date || '').slice(0, 16).replace('T', ' ')} · ${r.count || 0}/${r.total || 0} · ${String(r.message || '').slice(0, 70)}`,
    sort: (a, b) => String(b.date || '').localeCompare(String(a.date || '')),
    fields: [{ key: 'message', label: 'Message', type: 'textarea', readonly: true }, { key: 'status', label: 'Status', type: 'text', readonly: true }]
  },
  settings: {
    label: 'Site settings', one: 'settings', icon: 'sliders', roles: ['admin'], single: 'site',
    title: () => 'Site settings', sub: () => '',
    fields: [
      { key: 'logo', label: 'School logo', type: 'image' },
      { key: 'heroImage', label: 'Home page main picture (hero / underlay)', type: 'image' },
      { key: 'watermark', label: 'Watermark picture (faint background)', type: 'image' },
      { key: 'orgChart', label: 'Organogram picture (optional, overrides the drawn chart)', type: 'image' },
      { key: 'founderName', label: 'Founder / proprietor name', type: 'text' },
      { key: 'founderPhoto', label: 'Founder / proprietor picture', type: 'image' },
      { key: 'founderMsg', label: 'Founder message', type: 'textarea' },
      { key: 'proprietressName', label: 'Principal / proprietress name', type: 'text' },
      { key: 'proprietressPhoto', label: 'Principal / proprietress picture', type: 'image' },
      { key: 'proprietressMsg', label: 'Principal message', type: 'textarea' },
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
export const ADMIN_ORDER = ['announcements', 'prefects', 'staff', 'students', 'curriculum', 'lessonNotes', 'notebooks', 'assignments', 'tests', 'scores', 'liveclasses', 'questions', 'fees', 'payments', 'feedback', 'applications', 'album', 'testimonials', 'honours', 'sms', 'birthdays', 'weekly', 'ptameetings', 'ptamembers', 'forum', 'activities', 'files', 'settings'];

function feeScopeLabel(r, c) {
  if (r.scope === 'class') return r.targetClass;
  if (r.scope === 'student') { const s = ((c && c.students) || []).find(x => x.reg_no === r.targetReg); return s ? s.name : r.targetReg; }
  return 'All students';
}
