# Go-live checklist
1. Supabase > SQL Editor > New query > paste ALL of `supabase/schema.sql` > Run. (Once.)
2. Supabase > Authentication > Users > Add user > Create new user: your admin email + password, tick Auto Confirm User.
3. Supabase > SQL Editor, run (replace the email):
   insert into public.profiles (id, role, full_name) select id, 'admin', 'School Admin' from auth.users where email = 'YOUR-EMAIL';
4. Supabase > Edge Functions > deploy `admin-users` (paste supabase/functions/admin-users/index.ts). Optional: `ai-chat` + secret ANTHROPIC_API_KEY.
5. Supabase > Project Settings > API: copy the anon public key into js/config.js (SUPABASE_ANON_KEY). Commit on GitHub; Vercel redeploys.
6. Open the site > Admin portal > sign in with the admin email + password > Accounts and passwords.
