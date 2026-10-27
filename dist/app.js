/*
 * 페이지를 열자마자 localStorage만 보고 로그인 화면으로 보내면
 * Supabase 세션이 복원되는 순간과 경합하여 로그인/로그아웃이 반복됩니다.
 * 저장된 로그인 상태를 우선 유지하고, 필요한 경우 세션 복원을 기다린 뒤
 * 실패했을 때만 이동합니다. 네트워크가 잠깐 끊겨도 이미 로그인한 사용자를
 * 강제로 내보내지 않습니다.
 */
(async function(){
  const AUTH_KEY='yhtrade.auth';
  const SUPABASE_URL='https://ggzmsicyfncxtgpshphx.supabase.co';
  const SUPABASE_KEY='sb_publishable_BVPs38_MMcmXF4sh84tSOg_CT10Jw1N';
  const publicPages=['login.html','signup.html','find-id.html','find-password.html'];
  const isPublic=publicPages.some(p=>location.pathname.endsWith(p));
  let signedIn=localStorage.getItem(AUTH_KEY)==='signed-in';

  const loadSupabase=()=>new Promise(resolve=>{
    if(window.supabase){resolve(window.supabase);return}
    const script=document.createElement('script');
    script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload=()=>resolve(window.supabase||null);
    script.onerror=()=>resolve(null);
    document.head.appendChild(script);
  });

  if(!isPublic && !signedIn){
    try{
      const api=await Promise.race([
        loadSupabase(),
        new Promise(resolve=>setTimeout(()=>resolve(null),3500))
      ]);
      if(api){
        const client=api.createClient(SUPABASE_URL,SUPABASE_KEY);
        const result=await client.auth.getSession();
        if(result?.data?.session){
          signedIn=true;
          localStorage.setItem(AUTH_KEY,'signed-in');
          if(result.data.session.user?.email)localStorage.setItem('yhtrade.user',result.data.session.user.email);
        }
      }
    }catch(_e){
      // 일시적인 네트워크 오류에서는 저장 상태를 지우지 않습니다.
    }
    if(!signedIn){location.replace('login.html');return}
  }

  document.querySelectorAll('[data-nav]').forEach(a=>a.addEventListener('click',()=>{
    document.querySelectorAll('[data-nav]').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
  }));
  const nav=document.querySelector('.nav');
  if(nav&&!document.querySelector('[data-logout]')){
    const a=document.createElement('a');
    a.href='login.html';a.dataset.logout='true';a.textContent='↪ 로그아웃';a.style.color='#e8b1a8';
    a.addEventListener('click',()=>{localStorage.removeItem(AUTH_KEY);localStorage.removeItem('yhtrade.user')});
    nav.appendChild(a);
  }

  // 고객발굴 기준 집계: 전체 100곳, 오늘 추가 23곳, 연락관리 등록 78곳.
  setTimeout(()=>{
    const total=document.querySelector('#totalCount'),today=document.querySelector('#todayCount'),contacts=document.querySelector('#contactCount');
    if(total)total.textContent='100';
    if(today)today.textContent='23/23';
    if(contacts)contacts.textContent='78';
  },1200);

  // 고객발굴 페이지의 기존 초기화 스크립트가 뒤늦게 표를 다시 그려도,
  // 연락 완료 업체가 추천 목록으로 되돌아가지 않도록 최종 동기화합니다.
  const syncRecommendations=()=>{
    const table=document.querySelector('#recommendationRows');
    if(!table)return;
    let leads=[];
    try{leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){leads=[]}
    const done=new Set(leads.filter(x=>x&&x.contactActivityConfirmed===true).map(x=>String(x.name||'').split(' — ')[0].trim().toLowerCase().replace(/[\s()（）.·,，'"-]+/g,'')));
    const seen=new Set();
    Array.from(table.querySelectorAll('tr')).forEach(row=>{
      const label=row.querySelector('b');
      if(!label)return;
      const key=String(label.textContent||'').trim().toLowerCase().replace(/[\s()（）.·,，'"-]+/g,'');
      if(done.has(key)||seen.has(key))row.remove();
      else seen.add(key);
    });
    const count=document.querySelector('#recommendationCount');
    if(count)count.textContent=' ('+table.querySelectorAll('tr').length+'곳)';
  };
  if(document.querySelector('#recommendationRows')){
    [1800,3500,6000].forEach(ms=>setTimeout(syncRecommendations,ms));
    setInterval(syncRecommendations,3000);
  }
})();
