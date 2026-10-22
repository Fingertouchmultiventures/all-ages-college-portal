// Supabase Edge Function: school assistant. Secret needed: ANTHROPIC_API_KEY
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { messages = [], context = {} } = await req.json();
    const msgs = (Array.isArray(messages) ? messages : []).slice(-10)
      .map((m: { role: string; content: string }) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 600) }));
    if (!msgs.length || msgs[0].role !== 'user') return new Response(JSON.stringify({ reply: null }), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    const system = `You are the helpful assistant of ${context.school || 'All Ages College'}, a school in Apete, Ibadan, Nigeria (Creche to SSS 3). Answer briefly and politely about admission (Apply page, then the admin office calls), result checking (PIN + reg number), fees (school fee, textbooks and exercise books, uniforms, other payments, shown in the parent portal), portal sign in, the feedback box, and contacts. School info: ${JSON.stringify(context).slice(0, 1500)}. Never ask for or reveal passwords, PINs or any private student data. If you do not know, tell the person to call the school office.`;
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
