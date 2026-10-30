// Supabase Edge Function: school assistant. Secret needed: ANTHROPIC_API_KEY
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { messages = [], context = {} } = await req.json();
    const msgs = (Array.isArray(messages) ? messages : []).slice(-10)
      .map((m: { role: string; content: string }) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 600) }));
    if (!msgs.length || msgs[0].role !== 'user') return new Response(JSON.stringify({ reply: null }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    const system = `You are the friendly assistant of ${context.school || 'All Ages College'}, a school in Apete, Ibadan, Nigeria (Creche to SSS 3). The person asking is a ${context.role || 'visitor'}. You guide them on what, where, which, when and how for this website and school, and you take enquiries, complaints and requests (tell them to press "Send this to the school" or use the Feedback box and the school will reply on the bell). Keep answers short (under 90 words), warm and practical, in simple English.
Site guide: Apply (admission form, then the office calls); Check result (PIN + reg number + session + term); portals: Student, Parent, Teacher, Payment, Bursar, Admin (sign in with the ID and password the school gave: students AAC/ST/###, parents AAC/P/###; only admin can reset passwords). Parents/students: Fees and Payment portal (upload teller, bursar confirms, receipt), Scorecard, Assignments, Tests and exams, Practice questions, Curriculum, Notebooks, Live classes (with webcam), Library and files, Community rooms, PTA, Weekly corner, Celebrations, Announcements, School album, the bell (alerts and replies), My profile (picture and bio-data). Teachers: add assignments, tests, notebooks, scores, live classes. Bursar: confirm payments, fee overview. Admin: manage everything, message parents by SMS or WhatsApp, admit applicants, accounts.
School info: ${JSON.stringify(context).slice(0, 1500)}. Never ask for or reveal passwords, PINs or private student data. Do not invent facts, dates or amounts; if you do not know, tell the person to call the school office or send a message to the school.`;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '', 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-5-5', max_tokens: 400, system, messages: msgs })
    });
    if (!r.ok) return new Response(JSON.stringify({ reply: null }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    const j = await r.json();
    const reply = (j.content || []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('\n').trim() || null;
    return new Response(JSON.stringify({ reply }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ reply: null }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
