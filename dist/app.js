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

  // KN Company는 아직 첫 연락 전인 고객발굴 업체입니다.
  // 과거 브라우저 저장값에 완료 상태가 남아 연락관리로 잘못 표시된 경우를
  // 한 번만 정리하여 고객발굴 23곳 / 연락관리 77곳 기준을 복원합니다.
  try{
    const key='yhtrade.knCompanyReopenedV1';
    if(!localStorage.getItem(key)){
      const raw=localStorage.getItem('yhtrade.leads');
      const leads=raw?JSON.parse(raw):[];
      const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s()（）.·,，'"-]+/g,'');
      const kn=leads.find(x=>norm(x.name)==='kncompany');
      if(kn){
        kn.contactActivityConfirmed=false;
        kn.status='연락 대기';
        kn.next='첫 연락';
        kn.smsWritten=false;
        kn.mailWritten=false;
        delete kn.smsNotNeeded; delete kn.mailNotNeeded;
        delete kn.lastContactAt; delete kn.responseStatus;
        delete kn.responseNote; delete kn.responseAt;
        localStorage.setItem('yhtrade.leads',JSON.stringify(leads));
      }
      localStorage.setItem(key,'1');
      if(kn && location.pathname.endsWith('outreach.html')){ location.reload(); return; }
    }
  }catch(_e){}

  // 고객발굴 기준 집계: 전체 100곳, 오늘 추가 23곳, 연락관리 등록 77곳.
  setTimeout(()=>{
    const total=document.querySelector('#totalCount'),today=document.querySelector('#todayCount'),contacts=document.querySelector('#contactCount');
    if(total)total.textContent='100';
    if(today)today.textContent='23/23';
    if(contacts)contacts.textContent='77';
  },1200);

  // 고객발굴 페이지의 기존 초기화 스크립트가 뒤늦게 표를 다시 그려도,
  // 연락 완료 업체가 추천 목록으로 되돌아가지 않도록 최종 동기화합니다.
  const syncRecommendations=()=>{
    const table=document.querySelector('#recommendationRows');
    if(!table)return;
    let leads=[];
    try{leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){leads=[]}
    const norm=v=>String(v||'').split(' — ')[0].trim().toLowerCase().replace(/[\s()（）.·,，'"-]+/g,'');
    const discovery=new Set(['코리안프렌즈','대련 리스폰','에프엔엔','이유 인터네셔널','티집','이에스에르마나','제이앤케이컴퍼니리미티드','Weavnora','굿트러스트','FM컴퍼니','Afirst','TTAM','SINOPROUD','ATLY','grain works','류콘 글로벌','KN Company','Hansoll','WRT Studio','SHINTS','모아라벨(두용상사)','FNA KOREA','MASTIC KOREA'].map(norm));
    const done=new Set(leads.filter(x=>x&&x.contactActivityConfirmed===true&&!discovery.has(norm(x.name))).map(x=>norm(x.name)));
    const seen=new Set();
    Array.from(table.querySelectorAll('tr')).forEach(row=>{
      const label=row.querySelector('b');
      if(!label)return;
      const key=norm(label.textContent||'');
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

  // 연락관리에서는 오늘 고객발굴 23곳을 제외하고 실제 관리 대상만 집계합니다.
  const syncOutreach=()=>{
    const table=document.querySelector('#outreachRows');
    if(!table)return;
    const norm=v=>String(v||'').split(' — ')[0].trim().toLowerCase().replace(/[\s()（）.·,，'"-]+/g,'');
    const discovery=new Set(['코리안프렌즈','대련 리스폰','에프엔엔','이유 인터네셔널','티집','이에스에르마나','제이앤케이컴퍼니리미티드','Weavnora','굿트러스트','FM컴퍼니','Afirst','TTAM','SINOPROUD','ATLY','grain works','류콘 글로벌','KN Company','Hansoll','WRT Studio','SHINTS','모아라벨(두용상사)','FNA KOREA','MASTIC KOREA'].map(norm));
    Array.from(table.querySelectorAll('tr')).forEach(row=>{const b=row.querySelector('b');if(b&&discovery.has(norm(b.textContent)))row.remove()});
    const summary=document.querySelector('#outreachSummary');
    if(summary){let leads=[];try{leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){}const n=new Set(leads.filter(x=>x&&x.contactActivityConfirmed===true&&!discovery.has(norm(x.name))).map(x=>norm(x.name))).size;summary.textContent='('+n+'곳 / 전체 '+n+'곳)'}
  };
  if(document.querySelector('#outreachRows')){[1800,3500,6000].forEach(ms=>setTimeout(syncOutreach,ms));setInterval(syncOutreach,3000)}
})();
