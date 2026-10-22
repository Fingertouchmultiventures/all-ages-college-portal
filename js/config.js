// DEMO MODE: while SUPABASE_ANON_KEY is empty the site works fully in the browser (nothing is saved on a server).
// To go live later: paste your Supabase "anon public" key between the quotes below.
export const CONFIG = {
  SUPABASE_URL: 'https://kmkuoahlkbaqczlhvbkz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3VvYWhsa2JhcWN6bGh2Ymt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NzMxODksImV4cCI6MjEwODE0OTE4OX0.qThb2BEh-hYDbyqhfV3AElg8k1xPWTcLEVEe-D3rPOU',
  AI_ENDPOINT: '', // after deploying the ai-chat function: https://kmkuoahlkbaqczlhvbkz.supabase.co/functions/v1/ai-chat
  SCHOOL_NAME: 'All Ages College',
  SESSIONS: ['2026/2027', '2025/2026'],
  PHONES: ['+2348057394188', '+2348102776581', '+2348038043666']
};
