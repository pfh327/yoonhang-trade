-- 아이디를 입력하면 연결된 이메일을 찾아 Supabase 로그인에 사용합니다.
create or replace function public.get_login_email(p_username text)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_login_email(text) to anon, authenticated;

-- 이메일 또는 휴대폰 번호로 연결된 아이디를 조회합니다.
create or replace function public.get_login_username(p_contact text)
returns text
language sql
security definer
set search_path = public, auth
as $$
  select p.username
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_contact))
     or regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') = regexp_replace(trim(p_contact), '[^0-9]', '', 'g')
  limit 1;
$$;

grant execute on function public.get_login_username(text) to anon, authenticated;