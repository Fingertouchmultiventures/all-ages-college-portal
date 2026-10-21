# All Ages College PWA

Portal chooser, 6 sign-in screens (student, parent, teacher, payment, bursar, admin), admission application form and result-check page. Installable on phones and works offline for the screens themselves.

## Try it now (demo mode)
Open `index.html` through any web server (a PWA needs `http://localhost` or `https`):

    cd all-ages-pwa
    python3 -m http.server 8080      # then open http://localhost:8080

Demo mode keeps everything in the browser. Sign in with `demo` / `demo1234`. Sample result: PIN `AAC-DEMO-2026`, reg. number `AAC/DEMO/001`. Applications you submit show up under Admin > Applications on the same device.

## Go live (real data)
1. Create a free project at supabase.com. In **SQL Editor** paste and run `supabase/schema.sql`.
2. In **Project settings > API** copy the Project URL and the `anon` public key into `js/config.js`.
3. Create users in **Authentication > Users** using the pseudo-email rule below, then add a row for each in the `profiles` table (id, role, full_name).
   - Email users sign in with their email.
   - Students and staff without email: the app turns the ID into `<id lowercase, letters and digits only>@<role>.allages.app`. Example: student `AAC/2026/001` becomes `aac2026001@student.allages.app`.
4. Add students, results and result PINs in their tables (Table Editor, or build the admin screens next).
5. Host the folder on Vercel, Netlify or Cloudflare Pages (drag and drop works). HTTPS is required for install.
6. Whenever you change a file, bump `VERSION` in `sw.js` so phones pick up the update.

## Put it on GitHub and launch
The site is plain static files, so it needs no server of its own. The only "server" is Supabase (database and sign-in), which is already set up by `supabase/schema.sql`.

1. On GitHub, signed in as the Fingertouchmultiventures account, create an empty repo, e.g. `all-ages-college-portal` (no README).
2. From this folder:

       git remote add origin https://github.com/Fingertouchmultiventures/all-ages-college-portal.git
       git push -u origin main

3. Host it (pick one, all free to start):
   - **Vercel** (recommended): vercel.com > Add New > Project > import the repo > Deploy. `vercel.json` is already set up.
   - **GitHub Pages**: repo Settings > Pages > Source = GitHub Actions. The included workflow publishes on every push.
   - **Netlify / Cloudflare Pages**: import the repo, no build command, publish directory `/`.
4. Add your own domain in the host's Domains settings (e.g. portal.yourschool.ng) and point the DNS records they show you.
5. Before you share the link: fill `js/config.js` (Supabase), create the admin user, and bump `VERSION` in `sw.js` after any later change.

## What is built and what is not
Built: portal chooser, sign-in, role dashboards (tiles), admission form with review step, admin applications list, result checking and print, install button, offline shell.
Not built yet (shown as "Coming soon" tiles): classroom, assignments, library, tests, CBT, scorecard, fee payments, PTA, inventory, album and the other modules.

## Files
- `index.html`, `css/styles.css`: layout and look
- `js/app.js`: screens and routing. `js/data.js`: demo and Supabase data layer. `js/config.js`: your settings
- `manifest.webmanifest`, `sw.js`, `icons/`: PWA install and offline
- `supabase/schema.sql`: database, security rules and the result-check function

## Notes
- Fonts load from Google Fonts. Offline, phones fall back to the system font.
- The logo and photos come from the school fliers and photos. Replace files in `assets/` to change them (keep the names).
