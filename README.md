# All Ages College portal (PWA)

Static site (HTML/CSS/JS) + Supabase (database, logins, file storage). Hosted on Vercel from GitHub.

## Folders (keep them exactly like this when uploading to GitHub)
index.html, sw.js, manifest.webmanifest, vercel.json, css/, js/, assets/, icons/, supabase/

## Demo mode vs live mode
`js/config.js` has `SUPABASE_ANON_KEY: ''`. While empty the site runs in DEMO mode (nothing saved on a server, sign in with demo / demo1234).
Paste the key to go live. See GO-LIVE.md for the full step-by-step.
