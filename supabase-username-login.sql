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
