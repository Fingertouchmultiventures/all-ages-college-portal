-- All Ages College: database for the PWA. Run once in Supabase > SQL Editor.
-- Nothing is readable by the public except through the two safe doors below:
--   1) anyone can INSERT an admission application (but never read them back)
--   2) anyone can call check_result() with a valid PIN + reg. number

create extension if not exists pgcrypto;

-- people who can sign in (one row per Supabase auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','parent','teacher','bursar','admin')),
  full_name text,
  created_at timestamptz default now()
);

create table if not exists public.students (
  reg_no text primary key,            -- e.g. AAC/2026/001
  full_name text not null,
  class_name text not null
);

create table if not exists public.results (
  id bigint generated always as identity primary key,
  reg_no text not null references public.students(reg_no) on delete cascade,
  session text not null,              -- e.g. 2026/2027
  term text not null,                 -- First Term | Second Term | Third Term
  subject text not null,
  ca numeric not null default 0,
  exam numeric not null default 0,
  grade text,
  remark text,
  unique (reg_no, session, term, subject)
);

create table if not exists public.result_pins (
  pin text primary key,               -- store UPPERCASE, no spaces or dashes
  reg_no text not null references public.students(reg_no) on delete cascade,
  session text not null,
  term text not null,
  uses int not null default 0,
  max_uses int not null default 5
);

create table if not exists public.applications (
  id bigint generated always as identity primary key,
  ref text unique not null,
  first_name text not null, surname text not null, other_names text,
  gender text, dob date, class_applied text not null, previous_school text,
  guardian_name text not null, relationship text, phone text not null,
  whatsapp text, email text, address text, heard_from text,
  status text not null default 'new',
  created_at timestamptz default now()
);

alter table public.profiles    enable row level security;
alter table public.students    enable row level security;
alter table public.results     enable row level security;
alter table public.result_pins enable row level security;
alter table public.applications enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- profiles: you can read your own row; admins can read/write all
create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "admin manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- students / results / pins: admins only (teachers and bursar policies can be added later)
create policy "admin students" on public.students    for all using (public.is_admin()) with check (public.is_admin());
create policy "admin results"  on public.results     for all using (public.is_admin()) with check (public.is_admin());
create policy "admin pins"     on public.result_pins for all using (public.is_admin()) with check (public.is_admin());

-- applications: the public may submit, only admins may read or manage
create policy "public can apply" on public.applications for insert to anon, authenticated with check (true);
create policy "admin read applications" on public.applications for select using (public.is_admin());
create policy "admin update applications" on public.applications for update using (public.is_admin());

-- Result checking door. Returns one JSON object, or {"error": "..."}.
create or replace function public.check_result(p_pin text, p_reg text, p_session text, p_term text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_pin text := upper(regexp_replace(coalesce(p_pin,''), '[^A-Za-z0-9]', '', 'g'));
  v_reg text := upper(regexp_replace(coalesce(p_reg,''), '[^A-Za-z0-9]', '', 'g'));
  rp public.result_pins%rowtype;
  st public.students%rowtype;
begin
  select * into rp from public.result_pins
   where upper(regexp_replace(pin,'[^A-Za-z0-9]','','g')) = v_pin
     and upper(regexp_replace(reg_no,'[^A-Za-z0-9]','','g')) = v_reg
     and session = p_session and term = p_term;
  if not found then return json_build_object('error','Invalid PIN, reg. number, session or term.'); end if;
  if rp.uses >= rp.max_uses then return json_build_object('error','This PIN has reached its maximum number of uses.'); end if;
  select * into st from public.students where reg_no = rp.reg_no;
  update public.result_pins set uses = uses + 1 where pin = rp.pin;
  return (
    select json_build_object(
      'student', st.full_name, 'reg_no', st.reg_no, 'class', st.class_name, 'session', p_session, 'term', p_term,
      'remark', max(r.remark),
      'subjects', coalesce(json_agg(json_build_object('subject', r.subject, 'ca', r.ca, 'exam', r.exam, 'grade', r.grade) order by r.subject) filter (where r.subject is not null), '[]'::json))
    from public.results r where r.reg_no = st.reg_no and r.session = p_session and r.term = p_term);
end $$;
grant execute on function public.check_result(text,text,text,text) to anon, authenticated;
