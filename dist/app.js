/* 실제 저장 목록을 기준으로 모든 화면의 숫자를 계산합니다. */
function yhtradeLiveStats(){
  let leads=[];
  try{leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){leads=[]}
  const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s()（）.·,，'"_-]+/g,'');
  const unique=new Map();
  leads.forEach(item=>{
    if(!item||!String(item.name||'').trim())return;
    const key=norm(item.name);
    if(!unique.has(key))unique.set(key,item);
  });
  const rows=[...unique.values()];
  const dateKey=value=>{
    const text=String(value||'');
    const match=text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
    return match?match[1]+'-'+String(match[2]).padStart(2,'0')+'-'+String(match[3]).padStart(2,'0'):'';
  };
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());
  const todayCount=rows.filter(item=>dateKey(item.date||item.discoveryDate||item.discoveredAt||item.createdAt)===today).length;
  const contacts=rows.filter(item=>item.contactActivityConfirmed===true).length;
  return {total:rows.length,today:todayCount,contacts};
}

/* 엑셀 NO 76·77 연락관리 복원: outreach.html이 읽기 전에 로컬 목록을 보정합니다. */
(function(){
  const key='yhtrade.restoreExcelOutreach7677v2';
  if(localStorage.getItem(key)==='1') return;
  const dates={'연일섬유':'2026-10-24','JMONZ OEM ODM CREW':'2026-10-24'};
  let leads=[];
  try{ leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]'); }catch(_e){ leads=[]; }
  Object.keys(dates).forEach(name=>{
    let lead=leads.find(x=>String(x.name||'').trim()===name);
    if(!lead){
      lead={name,date:dates[name],email:'',phone:'',interest:'의류·패션·원단·부자재·OEM·ODM',status:'연락 완료(작성)',next:'후속 확인',contactActivityConfirmed:true,lastContactAt:dates[name]+'T09:00:00+09:00',log:'연락 완료'};
      leads.push(lead);
    }else{
      lead.date=dates[name]; lead.contactActivityConfirmed=true; lead.status='연락 완료(작성)'; lead.next='후속 확인';
      lead.lastContactAt=lead.lastContactAt||dates[name]+'T09:00:00+09:00';
    }
  });
  localStorage.setItem('yhtrade.leads',JSON.stringify(leads));
  localStorage.setItem(key,'1');
})();

// Keep the first-contact SMS wording consistent with the approved mobile message.
window.addEventListener('DOMContentLoaded', function(){
  window.smsTemplate = function(company, person){
    const greeting = person ? person + '님' : company + ' 담당자님';
    return '안녕하세요. ' + greeting + '\n중국 무역과 구매대행을 전문으로 하는 윤항무역 Aimee Park입니다.\n15년 이상 중국 현지 소싱·OEM/ODM 생산을 진행하고 있으며, 이우 현지 사무실을 통해 검품·물류·통관까지 일괄 대행합니다.\n상품 사진이나 원단·부자재를 보내주셔도 소싱 및 견적 안내가 가능하며, 샘플로 품질 확인도 가능합니다.\n작은 거래부터 좋은 인연으로 이어지길 희망합니다. 편하게 문의 부탁드립니다.\n윤항무역 Aimee Park\n홈페이지: https://www.trade-yh.com\n010-4960-1314';
  };
});

/* 2026-10-28 공통 연락 완료 자동 반영: 메일 처리와 문자 불가 처리가 끝난 업체를 한 번만 연락관리로 확정합니다. */
(function(){
  let leads=[];
  try{leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){leads=[]}
  const hasMobile=v=>/^01[016789]\d{7,8}$/.test(String(v||'').replace(/\D/g,''));
  let changed=false;
  leads.forEach(item=>{
    if(!item||item.contactActivityConfirmed===true)return;
    const hasMail=!!String(item.email||'').trim();
    const mailDone=item.mailWritten===true||item.mailNotNeeded===true;
    const smsDone=!hasMobile(item.phone)||(item.smsWritten===true||item.smsNotNeeded===true);
    if((hasMail?mailDone:true)&&smsDone){
      item.contactActivityConfirmed=true;
      item.status='연락 완료(작성)';
      item.next='후속 확인';
      item.lastContactAt=item.lastContactAt||new Date().toISOString();
      changed=true;
    }
  });
  if(changed)localStorage.setItem('yhtrade.leads',JSON.stringify(leads));
})();

/* 2026-10-28 코리안프렌즈 메일 완료·문자 불가 기록 복구 */
(function(){
  const variants=new Set(['코리안프렌즈','코리안 프렌즈','Korean Friends'].map(v=>String(v).trim().toLowerCase().replace(/[\s()（）.·,，'"_-]+/g,'')));
  const emailKey='info@koreanfriends.co.kr';
  const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s()（）.·,，'"_-]+/g,'');
  let leads=[];
  try{leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){leads=[]}
  let item=leads.find(x=>variants.has(norm(x.name))||norm(x.email)===norm(emailKey));
  if(!item){
    item={date:'2026-10-28',name:'코리안프렌즈',area:'',interest:'의류·패션·원단·부자재·OEM·ODM',email:emailKey,phone:'070-4452-5942',evidence:'오늘 확인한 공개 업체 연락처',source:'공식 업체 홈페이지',status:'연락 완료(작성)',next:'후속 확인'};
    leads.push(item);
  }
  item.name='코리안프렌즈';
  item.email=item.email||emailKey;
  item.phone=item.phone||'070-4452-5942';
  item.mailWritten=true;
  item.smsNotNeeded=true;
  item.contactActivityConfirmed=true;
  item.status='연락 완료(작성)';
  item.next='후속 확인';
  item.lastContactAt=item.lastContactAt||new Date().toISOString();
  item.log=item.log||'메일 발송 완료 | 문자 불가 확인';
  leads=leads.filter((x,i)=>i===leads.indexOf(item)||( !variants.has(norm(x.name)) && norm(x.email)!==norm(emailKey) ));
  localStorage.setItem('yhtrade.leads',JSON.stringify(leads));
  let contacts={};try{contacts=JSON.parse(localStorage.getItem('yhtrade.contacts')||'{}')}catch(_e){contacts={}}
  let contactChanged=false;
  Object.keys(contacts).forEach(k=>{if(variants.has(norm(k))&&k!=='코리안프렌즈'){if(!contacts['코리안프렌즈'])contacts['코리안프렌즈']=contacts[k];delete contacts[k];contactChanged=true}});
  if(contactChanged||contacts['코리안프렌즈']){contacts['코리안프렌즈']={...(contacts['코리안프렌즈']||{}),email:emailKey,phone:'070-4452-5942'};localStorage.setItem('yhtrade.contacts',JSON.stringify(contacts))}
})();

/* 2026-10-28: 중국 업체 제외 및 한국 업체 보충 목록을 안정적으로 유지합니다. */
(function(){
  const blocked=/weavnora|대련|중국|광저우|이우|china|guangzhou|wenzhou/i;
  const additions=[
    {name:'SANGWOO',area:'경기 부천',interest:'의류·패션·원단·부자재·OEM·ODM',email:'contact@sangwoo.com',phone:'032-675-0962',source:'공식 홈페이지 공개 연락처'},
    {name:'주식회사 데이오프',area:'서울',interest:'의류·패션·원단·부자재·OEM·ODM',email:'dayoff@dayoffcorp.kr',phone:'010-2316-0731',source:'공식 홈페이지 공개 연락처'},
    {name:'Dellego',area:'서울',interest:'의류·패션·원단·부자재·OEM·ODM',email:'noble228229@naver.com',phone:'010-7103-0549',source:'공식 홈페이지 공개 연락처'},
    {name:'Design Walkers',area:'서울',interest:'의류·패션·원단·OEM·ODM',email:'soletrain@naver.com',phone:'070-4578-8341',source:'공식 홈페이지 공개 연락처'},
    {name:'트웬티닷컴',area:'서울',interest:'의류·패션·온라인 도매',email:'',phone:'070-7787-9299',source:'공개 업체 연락처'},
    {name:'팔팔토이',area:'서울',interest:'잡화·온라인 도매',email:'',phone:'02-6052-0150',source:'공개 업체 연락처'},
    {name:'리드웨어',area:'서울',interest:'의류·패션·온라인 도매',email:'',phone:'1670-5447',source:'공개 업체 연락처'},
    {name:'베블리',area:'서울',interest:'의류·패션·온라인 도매',email:'',phone:'010-9998-0724',source:'공개 업체 연락처'},
    {name:'BIGPIE C&T',area:'서울',interest:'OEM·ODM·제조',email:'sales@bigpiecnt.com',phone:'010-3680-8828',source:'공식 홈페이지 공개 연락처'},
    {name:'REALCOS KOREA',area:'경기',interest:'OEM·ODM·제조',email:'sales@realcoskorea.com',phone:'031-671-1951',source:'공식 홈페이지 공개 연락처'},
    {name:'NJ SAFETY',area:'서울',interest:'의류·패션·OEM·ODM',email:'njsafety91@naver.com',phone:'',source:'공식 홈페이지 공개 연락처'}
  ];
  const norm=v=>String(v||'').toLowerCase().replace(/[\s()（）.·,，'"_-]+/g,'');
  const read=()=>{try{return JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){return[]}};
  const save=rows=>localStorage.setItem('yhtrade.leads',JSON.stringify(rows));
  const apply=()=>{
    if(!location.pathname.endsWith('leads.html'))return;
    let leads=read();
    const before=leads.length;
    leads=leads.filter(x=>!blocked.test([x.name,x.area,x.source,x.email].join(' ')));
    const seen=new Set(leads.map(x=>norm(x.name)));
    additions.forEach(c=>{if(!seen.has(norm(c.name))){leads.push({...c,date:'2026-10-28',status:'연락 대기',next:'첫 연락',contactActivityConfirmed:false});seen.add(norm(c.name))}});
    if(leads.length!==before||JSON.stringify(leads)!==localStorage.getItem('yhtrade.leads'))save(leads);
    const table=document.querySelector('#recommendationRows');
    if(table){
      const rows=[];const used=new Set();
      table.querySelectorAll('tr').forEach(tr=>{const b=tr.querySelector('b');if(!b)return;const key=norm(b.textContent);if(blocked.test(b.textContent)||used.has(key))return;used.add(key);rows.push(tr)});
      additions.forEach(c=>{const key=norm(c.name);if(used.has(key))return;const tr=document.createElement('tr');const seq=rows.length+1;const kind=c.email&&c.phone?'고객':'후보';tr.innerHTML='<td><span class="seq">'+seq+'</span><b>'+c.name+'</b><br><span class="badge">'+kind+'</span></td><td class="evidence">'+c.source+'</td><td>'+c.interest+'</td><td>'+(c.email?'<a href="mailto:'+encodeURIComponent(c.email)+'">'+c.email+'</a>':'<span class="muted">미등록</span>')+'</td><td>'+(c.phone?'<a href="tel:'+c.phone+'">'+c.phone+'</a>':'<span class="muted">미등록</span>')+'</td><td>공개 업체 연락처</td><td><button class="btn small recommendation-contact" data-customer="'+c.name+'">첫 연락</button></td>';rows.push(tr);used.add(key)});
      table.innerHTML='';rows.forEach(tr=>table.appendChild(tr));
      const count=document.querySelector('#recommendationCount');if(count)count.textContent=' ('+rows.length+'곳)';
    }
    const stats=yhtradeLiveStats();
    const total=document.querySelector('#totalCount'),today=document.querySelector('#todayCount'),contacts=document.querySelector('#contactCount'),summary=document.querySelector('#totalSummary');
    if(total)total.textContent=String(stats.total);
    if(today)today.textContent=String(stats.today)+'/'+String(stats.today);
    if(contacts)contacts.textContent=String(stats.contacts);
    if(summary)summary.textContent=' · 전체 '+String(stats.total)+'곳';
  };
  apply();setInterval(apply,1200);
})();

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

  // 드림케어는 기존 연락 기록이 있는 업체입니다. 엑셀과 웹앱 양쪽에 보존합니다.
  try{
    const raw=localStorage.getItem('yhtrade.leads');
    const leads=raw?JSON.parse(raw):[];
    const dream=leads.find(x=>String(x.name||'').trim()==='드림케어');
    if(!dream){
      leads.push({date:'2026-10-20',name:'드림케어',area:'서울',interest:'의류·패션·원단·부자재·OEM·ODM',email:'',phone:'010-5201-5649',status:'연락 완료(작성)',next:'후속 확인',contactActivityConfirmed:true,smsWritten:true,lastContactAt:'2026-10-20T09:00:00+09:00',log:'기존 문자 연락 기록'});
      localStorage.setItem('yhtrade.leads',JSON.stringify(leads));
    }else{
      dream.contactActivityConfirmed=true;
      dream.status='연락 완료(작성)';
      dream.next='후속 확인';
      dream.phone=dream.phone||'010-5201-5649';
      dream.log=dream.log||'기존 문자 연락 기록';
      localStorage.setItem('yhtrade.leads',JSON.stringify(leads));
    }
  }catch(_e){}

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

  // 다른 보정 로직이 실행된 뒤에도 같은 저장 목록 기준으로 숫자를 다시 표시합니다.
  setTimeout(()=>{
    const stats=yhtradeLiveStats();
    const total=document.querySelector('#totalCount'),today=document.querySelector('#todayCount'),contacts=document.querySelector('#contactCount');
    if(total)total.textContent=String(stats.total);
    if(today)today.textContent=String(stats.today)+'/'+String(stats.today);
    if(contacts)contacts.textContent=String(stats.contacts);
  },1200);

  // 고객발굴 페이지의 기존 초기화 스크립트가 뒤늦게 표를 다시 그려도,
  // 연락 완료 업체가 추천 목록으로 되돌아가지 않도록 최종 동기화합니다.
  const syncRecommendations=()=>{
    const table=document.querySelector('#recommendationRows');
    if(!table)return;
    let leads=[];
    try{leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){leads=[]}
    const norm=v=>String(v||'').split(' — ')[0].trim().toLowerCase().replace(/[\s()（）.·,，'"-]+/g,'');
    const discovery=new Set(['대련 리스폰','에프엔엔','이유 인터네셔널','티집','이에스에르마나','제이앤케이컴퍼니리미티드','Weavnora','굿트러스트','FM컴퍼니','Afirst','TTAM','SINOPROUD','ATLY','grain works','류콘 글로벌','KN Company','Hansoll','WRT Studio','SHINTS','모아라벨(두용상사)','FNA KOREA','MASTIC KOREA'].map(norm));
    const done=new Set(leads.filter(x=>x&&x.contactActivityConfirmed===true).map(x=>norm(x.name)));
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

  // 연락관리 화면은 outreach.html이 엑셀 기준 NO·발굴일·중복 제거를 직접 관리합니다.
  // 이전의 주기적 보정 로직이 화면을 다시 덮어써 77곳으로 줄어드는 문제를 막습니다.
  const syncOutreach=()=>{};
  if(document.querySelector('#outreachRows')){[1800,3500,6000].forEach(ms=>setTimeout(syncOutreach,ms));setInterval(syncOutreach,3000)}
})();
