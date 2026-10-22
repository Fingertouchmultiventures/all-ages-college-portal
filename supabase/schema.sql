-- All Ages College portal: database. Run ONCE in Supabase > SQL Editor (paste this whole file, press Run).
-- Safe to run again: it drops and recreates the policies.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','teacher','bursar','student','parent')),
  full_name text,
  reg_no text,                      -- a student's own reg. number
  linked_regs text[] default '{}'   -- a parent's children (reg. numbers)
);

create table if not exists public.records (
  id text primary key,
  collection text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists records_collection_idx on public.records (collection, created_at desc);

alter table public.profiles enable row level security;
alter table public.records  enable row level security;

-- helpers (security definer so policies can read profiles safely)
create or replace function public.my_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.my_regs() returns text[] language sql stable security definer set search_path = public as
$$ select coalesce((select linked_regs || case when reg_no is null then '{}'::text[] else array[reg_no] end from public.profiles where id = auth.uid()), '{}') $$;
create or replace function public.is_admin() returns boolean language sql stable as $$ select public.my_role() = 'admin' $$;
create or replace function public.can_write(col text) returns boolean language sql stable as
$$ select case public.my_role()
     when 'admin' then true
     when 'teacher' then col in ('curriculum','lessonNotes','files')
     when 'bursar' then col in ('fees','payments')
     else false end $$;

-- profiles
drop policy if exists profiles_self on public.profiles;
drop policy if exists profiles_admin on public.profiles;
create policy profiles_self  on public.profiles for select using (id = auth.uid());
create policy profiles_admin on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- records: read
drop policy if exists records_read on public.records;
create policy records_read on public.records for select using (
  public.is_admin()
  or collection in ('settings','prefects','album','staff')
  or (collection = 'announcements' and (data->>'audience' is null or data->>'audience' in ('all','')))
  or (collection = 'files'         and (data->>'audience' is null or data->>'audience' in ('all','')))
  or (auth.uid() is not null and public.can_write(collection))
  or (auth.uid() is not null and collection in ('announcements','files')
        and data->>'audience' = case public.my_role() when 'student' then 'students' when 'parent' then 'parents' when 'teacher' then 'teachers' else 'all' end)
  or (auth.uid() is not null and collection in ('curriculum','lessonNotes','fees'))
  or (collection = 'students' and public.my_role() in ('teacher','bursar'))
  or (collection = 'students' and public.my_role() in ('student','parent') and upper(regexp_replace(data->>'reg_no','[^A-Za-z0-9]','','g')) = any (select upper(regexp_replace(x,'[^A-Za-z0-9]','','g')) from unnest(public.my_regs()) x))
  or (collection = 'payments' and public.my_role() = 'bursar')
  or (collection = 'payments' and public.my_role() in ('student','parent') and upper(regexp_replace(data->>'regNo','[^A-Za-z0-9]','','g')) = any (select upper(regexp_replace(x,'[^A-Za-z0-9]','','g')) from unnest(public.my_regs()) x))
);

-- records: staff write
drop policy if exists records_ins on public.records;
drop policy if exists records_upd on public.records;
drop policy if exists records_del on public.records;
create policy records_ins on public.records for insert with check (
  public.can_write(collection)
  or (collection in ('feedback','applications') and coalesce(data->>'status','New') = 'New')   -- public boxes: anyone may add
);
create policy records_upd on public.records for update
  using (public.can_write(collection) and (public.my_role() <> 'teacher' or collection <> 'lessonNotes' or data->>'owner' = auth.uid()::text))
  with check (public.can_write(collection));
create policy records_del on public.records for delete
  using (public.can_write(collection) and (public.my_role() <> 'teacher' or collection <> 'lessonNotes' or data->>'owner' = auth.uid()::text));

-- result checking: safe door, needs PIN + reg. number + session + term
create or replace function public.check_result(p_pin text, p_reg text, p_session text, p_term text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pin_row public.records; res jsonb; rp text := upper(regexp_replace(coalesce(p_pin,''),'[^A-Za-z0-9]','','g'));
  rr text := upper(regexp_replace(coalesce(p_reg,''),'[^A-Za-z0-9]','','g'));
begin
  select * into pin_row from public.records where collection='pins' and data->>'pin_norm'=rp and data->>'reg_norm'=rr and data->>'session'=p_session and data->>'term'=p_term limit 1;
  if not found then return jsonb_build_object('error','Invalid PIN, reg. number, session or term.'); end if;
  if coalesce((pin_row.data->>'uses')::int,0) >= coalesce((pin_row.data->>'max_uses')::int,5) then return jsonb_build_object('error','This PIN has reached its maximum number of uses.'); end if;
  select data into res from public.records where collection='results' and data->>'reg_norm'=rr and data->>'session'=p_session and data->>'term'=p_term limit 1;
  if res is null then return jsonb_build_object('error','This result has not been published yet.'); end if;
  update public.records set data = jsonb_set(data,'{uses}', to_jsonb(coalesce((data->>'uses')::int,0)+1)) where id = pin_row.id;
  return res;
end $$;
revoke all on function public.check_result(text,text,text,text) from public;
grant execute on function public.check_result(text,text,text,text) to anon, authenticated;

-- file storage (photos, notes, PDFs)
insert into storage.buckets (id, name, public) values ('uploads','uploads', true) on conflict (id) do update set public = true;
drop policy if exists uploads_read on storage.objects;
drop policy if exists uploads_ins on storage.objects;
drop policy if exists uploads_del on storage.objects;
create policy uploads_read on storage.objects for select using (bucket_id = 'uploads');
create policy uploads_ins  on storage.objects for insert with check (bucket_id = 'uploads' and public.my_role() in ('admin','teacher','bursar'));
create policy uploads_del  on storage.objects for delete using (bucket_id = 'uploads' and public.my_role() in ('admin','teacher'));
