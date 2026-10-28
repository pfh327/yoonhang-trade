window.__YH_DISABLE_LEGACY_RECONCILIATION__ = true;
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

/* FINAL V3: canonical leads rendering and strict contact completion */
(function(){
  if(!/\/leads\.html$/.test(location.pathname) || window.__YH_FINAL_V3__) return;
  window.__YH_FINAL_V3__=true;
  const STORE='yhtrade.leads';
  const clean=v=>String(v==null?'':v).trim();
  const norm=v=>clean(v).toLowerCase().replace(/[\s\-_.()·ㆍ]/g,'');
  const alias={골라라:'gollala','gollala inc':'gollala','gollalainc':'gollala',gollala:'gollala'};
  const keyName=v=>alias[norm(v)]||norm(v);
  const esc=v=>clean(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const email=v=>clean(v).toLowerCase();
  const phone=v=>clean(v).replace(/[^0-9+]/g,'');
  const dateOf=r=>clean(r.discoveryDate||r['발굴일']||r.discoveredAt||r.foundDate||r.date||r.createdAt);
  const dateKey=v=>{const m=clean(v).match(/(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/); return m?`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`:''};
  const done=r=>{
    const s=clean(r.status);
    return r.mailSent===true||r.mailConfirmed===true||r.smsSent===true||r.smsConfirmed===true||
      r.mailNotNeeded===true||r.smsNotNeeded===true||['메일 완료','문자 완료','연락 불가','연락 완료'].includes(s);
  };
  function read(){try{const a=JSON.parse(localStorage.getItem(STORE)||'[]'); return Array.isArray(a)?a:[]}catch{return[]}}
  function canonical(){
    const out=[], seen=new Map();
    read().forEach((raw,i)=>{
      const r={...raw}; const name=clean(r.name||r.customer||r.company); if(!name||keyName(name)==='weavnora') return;
      const em=email(r.email), ph=phone(r.phone||r.mobile||r.tel); const k=em?`e:${em}`:ph?`p:${ph}`:`n:${keyName(name)}`;
      if(seen.has(k)){
        const j=seen.get(k), old=out[j];
        out[j]={...old,...r,name: keyName(name)==='gollala'?'골라라':(old.name||name),email: keyName(name)==='gollala'?(old.email||em||'lucia@gollala.com'):(old.email||em),phone:old.phone||ph};
      } else { seen.set(k,out.length); out.push({...r,name:keyName(name)==='gollala'?'골라라':name,email:em,phone:ph,__i:i}); }
    });
    out.sort((a,b)=>{const da=dateKey(dateOf(a)), db=dateKey(dateOf(b)); return (da||'9999').localeCompare(db||'9999') || (a.__i-b.__i)});
    return out.map((r,i)=>({...r,__no:i+1}));
  }
  function render(){
    const rows=canonical(); if(!rows.length) return;
    const contacts=rows.filter(done), candidates=rows.filter(r=>!done(r)&&(r.email||r.phone));
    const dates=rows.map(r=>dateKey(dateOf(r))).filter(Boolean), latest=dates.length?dates.sort().at(-1):'';
    const latestCount=latest?rows.filter(r=>dateKey(dateOf(r))===latest).length:0;
    const set=(sel,val)=>{const e=document.querySelector(sel); if(e)e.textContent=val};
    set('#totalCount',String(rows.length)); set('#contactCount',String(contacts.length)); set('#todayCount',`${latestCount}/${latestCount}`); set('#recommendationCount',String(candidates.length));
    document.querySelectorAll('[data-total-count]').forEach(e=>e.textContent=rows.length);
    const box=document.querySelector('#recommendationRows');
    if(box){box.innerHTML=candidates.map((r,i)=>`<tr><td><strong>${i+1}</strong><br><span class="badge">${done(r)?'고객':'후보'}</span></td><td><strong>${esc(r.name)}</strong></td><td>${esc(r.evidence||r.source||'공개 업체 연락처')}</td><td>${esc(r.interest||r.category||'의류·패션·원단·부자재·OEM·ODM')}</td><td>${r.email?`<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>`:'미등록'}</td><td>${r.phone?`<a href="tel:${esc(r.phone)}">${esc(r.phone)}</a>`:'미등록'}</td><td>${esc(r.source||r.url||'공개 업체 정보')}</td><td><button class="btn recommendation-contact" data-customer="${esc(r.name)}">첫 연락</button></td></tr>`).join('');}
    const legacy=document.querySelector('#leadRows'); if(legacy){legacy.innerHTML=''; const t=legacy.closest('table'); if(t)t.style.display='none';}
  }
  let scheduled=false; const tick=()=>{if(scheduled)return; scheduled=true; requestAnimationFrame(()=>{scheduled=false; render()})};
  tick(); setInterval(tick,500); window.addEventListener('storage',tick); new MutationObserver(tick).observe(document.body,{childList:true,subtree:true});
})();

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

/* AUTHORITATIVE LEADS VIEW: one canonical list and conservative contact state */
(function(){
  if(window.__YH_AUTHORITATIVE_LEADS__) return;
  window.__YH_AUTHORITATIVE_LEADS__ = true;
  window.__YH_FINAL_LEADS_RENDERER__ = true;
  const STORE='yhtrade.leads', CONTACT='yhtrade.contacts';
  const clean=v=>String(v==null?'':v).trim();
 const norm=v=>clean(v).toLowerCase().replace(/[\s()\-_.·,]/g,'');
 const digits=v=>clean(v).replace(/\D/g,'');
  const parse=key=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch(e){return []}};
  const alias=n=>{const x=norm(n);if(/gollala|골라라/.test(x))return '골라라';if(/weavnora/.test(x))return 'weavnora';return clean(n)};
  const identity=r=>({name:alias(r.name||r.company||r.customer||r['고객명']),email:clean(r.email||r.mail||r['이메일']),phone:clean(r.phone||r.mobile||r.tel||r['휴대폰'])});
  const dateOf=r=>clean(r.discoveryDate||r.discoveredAt||r.foundAt||r.createdAt||r.date||r['발굴일']);
 const dateKey=v=>{const m=clean(v).match(/(20\d{2})[-./년](\d{1,2})[-./월](\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`:''};
  const explicitDone=r=>{
    const s=clean(r.status);
    return r.mailSent===true||r.mailConfirmed===true||r.smsSent===true||r.smsConfirmed===true||r.mailNotNeeded===true||r.smsNotNeeded===true||s==='연락 불가'||s==='메일 완료'||s==='문자 완료';
  };
  function canonical(){
    const all=parse(STORE).concat(parse(CONTACT).map(x=>Object.assign({},x,{__fromContact:true})));
    const groups=new Map(), order=[];
    all.forEach((r,i)=>{
      const x=identity(r); if(x.name==='weavnora') return;
      const key=norm(x.email)||digits(x.phone)||norm(x.name); if(!key)return;
      if(!groups.has(key)){const row=Object.assign({},r,{name:x.name,email:x.email,phone:x.phone,__sourceIndex:i});groups.set(key,row);order.push(row)}
      else {const g=groups.get(key); if(!g.email&&x.email)g.email=x.email; if(!g.phone&&x.phone)g.phone=x.phone; if(explicitDone(r))Object.assign(g,{mailSent:g.mailSent||r.mailSent,smsSent:g.smsSent||r.smsSent,mailConfirmed:g.mailConfirmed||r.mailConfirmed,smsConfirmed:g.smsConfirmed||r.smsConfirmed,mailNotNeeded:g.mailNotNeeded||r.mailNotNeeded,smsNotNeeded:g.smsNotNeeded||r.smsNotNeeded,status:r.status||g.status})}
    });
    order.sort((a,b)=>{const na=Number(a.no||a.NO||a.excelNo||a['번호'])||0,nb=Number(b.no||b.NO||b.excelNo||b['번호'])||0;if(na&&nb&&na!==nb)return na-nb;const da=dateKey(dateOf(a)),db=dateKey(dateOf(b));return (da||'9999').localeCompare(db||'9999')||(a.__sourceIndex-b.__sourceIndex)});
    order.forEach((r,i)=>r.__globalNo=i+1);
    try{localStorage.setItem(STORE,JSON.stringify(order))}catch(e){}
    return order;
  }
  const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function set(id,v){const e=document.getElementById(id);if(e)e.textContent=String(v)}
  function render(){
    const rows=canonical(), contacts=rows.filter(explicitDone), candidates=rows.filter(r=>!explicitDone(r)&&(()=>{const x=identity(r);return !!(x.email||digits(x.phone))})());
    const dates=rows.map(r=>dateKey(dateOf(r))).filter(Boolean), latest=dates.slice().sort().pop()||'', today=latest?rows.filter(r=>dateKey(dateOf(r))===latest).length:0;
    set('totalCount',rows.length);set('contactCount',contacts.length);set('todayCount',`${today}/${today}`);set('totalSummary',`전체 ${rows.length}곳`);set('recommendationCount',`${candidates.length}곳`);
    const box=document.getElementById('recommendationRows');if(!box)return;
    const html=candidates.map(r=>{const x=identity(r),type=explicitDone(r)?'고객':'후보';return `<tr><td><span class="seq">${r.__globalNo}</span> <strong>${esc(x.name||'업체')}</strong><br><small>${type}</small></td><td>${esc(r.evidence||r.source||'공개 업체 연락처')}</td><td>${esc(r.interest||r.category||'의류·패션·원단·부자재·OEM·ODM')}</td><td>${x.email?`<a href="mailto:${esc(x.email)}">${esc(x.email)}</a>`:'미등록'}</td><td>${x.phone?`<a href="tel:${esc(x.phone)}">${esc(x.phone)}</a>`:'미등록'}</td><td>${esc(r.source||'공개 업체 정보')}</td><td><button type="button" class="btn recommendation-contact" data-customer="${esc(x.name)}">첫 연락</button></td></tr>`}).join('');
    if(box.innerHTML!==html)box.innerHTML=html;
  }
  const run=()=>{try{render()}catch(e){}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  window.addEventListener('storage',run);setInterval(run,500);
})();

/* FINAL CANONICAL LEADS OVERRIDE: keep one dataset and one set of totals. */
(function(){
  if(!/\/leads\.html$/.test(location.pathname) || window.__YH_FINAL_CANONICAL_LEADS__) return;
  window.__YH_FINAL_CANONICAL_LEADS__=true;
  window.__YH_DISABLE_LEGACY_RECONCILIATION__=true;
  const STORE='yhtrade.leads';
  const clean=v=>String(v??'').trim();
  const norm=v=>clean(v).toLowerCase().replace(/[\s().\-_/\\]+/g,'');
  const dateKey=v=>{const s=clean(v);const m=s.match(/(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`:''};
  const todayKey=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());
  const identity=r=>({
    name:clean(r?.name||r?.customer||r?.company||r?.companyName),
    email:clean(r?.email||r?.mail),
    phone:clean(r?.phone||r?.mobile||r?.tel)
  });
  const dateOf=r=>r?.discoveredAt||r?.discoveredDate||r?.discoveryDate||r?.date||r?.createdAt||r?.발굴일||'';
  const explicitDone=r=>{
    const s=norm(r?.status||r?.state||r?.contactStatus);
    return r?.contactActivityConfirmed===true||r?.firstContactCompleted===true||r?.mailSent===true||r?.mailConfirmed===true||r?.smsSent===true||r?.smsConfirmed===true||r?.mailNotNeeded===true||r?.smsNotNeeded===true||['contacted','연락완료','메일완료','문자완료','연락불가'].includes(s);
  };
  const excluded=r=>norm(identity(r).name)==='weavnora'||norm(identity(r).email)==='postmaster@weavnora.com';
  function canonical(){
    let raw=[]; try{raw=JSON.parse(localStorage.getItem(STORE)||'[]')}catch(e){}
    if(!Array.isArray(raw)) raw=[];
    const groups=[];
    const alias=v=>['골라라','gollalainc','gollala'].includes(norm(v));
    for(const original of raw){
      if(!original||excluded(original)) continue;
      const x=identity(original); if(alias(x.name)){x.name='골라라';x.email='lucia@gollala.com';}
      let g=groups.find(q=>{
        const y=identity(q.row);
        return (x.email&&y.email&&norm(x.email)===norm(y.email))||(x.phone&&y.phone&&norm(x.phone)===norm(y.phone))||(x.name&&y.name&&norm(x.name)===norm(y.name));
      });
      if(!g){g={row:{...original},names:[]};groups.push(g);continue;}
      const y=identity(g.row);
      g.row={...g.row,...original,name:y.name||x.name,email:y.email||x.email,phone:y.phone||x.phone};
      if(explicitDone(original)) g.row={...g.row,...original};
    }
    const rows=groups.map(g=>g.row);
    try{localStorage.setItem(STORE,JSON.stringify(rows))}catch(e){}
    return rows;
  }
  const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let rendering=false;
  function render(){
    if(rendering)return; rendering=true;
    const rows=canonical(),contacts=rows.filter(explicitDone),candidates=rows.filter(r=>!explicitDone(r));
    const addedToday=rows.filter(r=>dateKey(dateOf(r))===todayKey()).length;
    const set=(id,v)=>{const e=document.querySelector(id),s=String(v);if(e&&e.textContent!==s)e.textContent=s};
    set('#totalCount',rows.length);set('#contactCount',contacts.length);set('#todayCount',`${addedToday}/${addedToday}`);set('#totalSummary',`전체 ${rows.length}곳`);set('#recommendationCount',`${candidates.length}곳`);
    const box=document.querySelector('#recommendationRows');
    if(box){
      const html=candidates.map((r,i)=>{const x=identity(r),name=x.name||'업체';return `<tr><td><strong>${i+1} ${esc(name)}</strong><br><small>${r.type==='candidate'?'후보':'고객'}</small></td><td>${esc(r.evidence||r.source||'공개 업체 연락처')}</td><td>${esc(r.interest||r.category||'의류·패션·원단·부자재·OEM·ODM')}</td><td>${esc(x.email||'미등록')}</td><td>${esc(x.phone||'미등록')}</td><td>${esc(r.source||'공개 업체 정보')}</td><td><button class="btn recommendation-contact" data-customer="${esc(name)}">첫 연락</button></td></tr>`}).join('');
      if(box.innerHTML!==html) box.innerHTML=html;
    }
    rendering=false;
  }
  const schedule=()=>setTimeout(render,20);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  window.addEventListener('storage',schedule);setInterval(schedule,500);
})();

/* AUTHORITATIVE LEADS VIEW: one canonical dataset, stable numbering, and real totals. */
(function(){
  if(!/\/leads\.html$/.test(location.pathname) || window.__YH_AUTHORITATIVE_LEADS_V2__) return;
  window.__YH_AUTHORITATIVE_LEADS_V2__=true;
  const STORE='yhtrade.leads';
  const clean=v=>String(v==null?'':v).trim();
  const norm=v=>clean(v).toLowerCase().replace(/[\s\-_.()·ㆍ]/g,'');
  const alias={골라라:'gollala',gollala:'gollala',gollalainc:'gollala'};
  const keyName=v=>alias[norm(v)]||norm(v);
  const email=v=>clean(v).toLowerCase();
  const phone=v=>clean(v).replace(/[^0-9+]/g,'');
  const identity=r=>({name:clean(r.name||r.customer||r.company),email:email(r.email),phone:phone(r.phone||r.mobile||r.tel)});
  const done=r=>r.contactActivityConfirmed===true||r.firstContactCompleted===true||['contacted','연락 완료','메일 완료','문자 완료','연락 불가'].includes(clean(r.status))||r.mailSent===true||r.mailConfirmed===true||r.smsSent===true||r.smsConfirmed===true||r.mailNotNeeded===true||r.smsNotNeeded===true;
  const dateOf=r=>clean(r['발굴일']||r.discoveryDate||r.discoveredAt||r.foundDate||r.date||r.createdAt);
  const dateKey=v=>{const s=clean(v),m=s.match(/(\d{4})\D?(\d{1,2})\D?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`:''};
  const todayKey=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}};
  function canonical(){
    const groups=[];
    for(const raw of read()){
      const r=Object.assign({},raw),i=identity(r),nk=keyName(i.name);
      if(!nk&&!i.email&&!i.phone) continue;
      if(nk==='weavnora'||/weavnora/i.test(i.name)) continue;
      if(nk==='gollala'){r.name='골라라';r.email='lucia@gollala.com';i.email='lucia@gollala.com'}
      const keys=[nk&&`n:${nk}`,i.email&&`e:${i.email}`,i.phone&&`p:${i.phone}`].filter(Boolean);
      let g=groups.find(x=>keys.some(k=>x.keys.has(k)));
      if(!g){g={keys:new Set(keys),row:r}}else{
        keys.forEach(k=>g.keys.add(k));
        for(const f of ['name','customer','company','email','phone','mobile','tel','evidence','source','interest','category','date','발굴일','discoveredAt','discoveryDate','foundDate','createdAt']) if(!clean(g.row[f])&&clean(r[f])) g.row[f]=r[f];
        if(done(r)) g.row.contactActivityConfirmed=true;
        for(const f of ['firstContactCompleted','mailSent','mailConfirmed','smsSent','smsConfirmed','mailNotNeeded','smsNotNeeded']) if(r[f]===true) g.row[f]=true;
      }
    }
    return groups.map(g=>g.row).sort((a,b)=>{
      const da=dateKey(dateOf(a)),db=dateKey(dateOf(b));
      return (da||'9999-99-99').localeCompare(db||'9999-99-99') || identity(a).name.localeCompare(identity(b).name,'ko');
    });
  }
  const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let last='';
  function render(){
    const rows=canonical(),contacts=rows.filter(done),candidates=rows.filter(r=>!done(r));
    const today=rows.filter(r=>dateKey(dateOf(r))===todayKey()).length;
    const sig=JSON.stringify([rows.length,contacts.length,candidates.length,today,rows.map(r=>identity(r).name)]);
    if(sig===last) return; last=sig;
    const set=(id,v)=>{const e=document.querySelector(id);if(e)e.textContent=String(v)};
    set('#totalCount',rows.length);set('#contactCount',contacts.length);set('#todayCount',`${today}/${today}`);set('#totalSummary',`전체 ${rows.length}곳`);set('#recommendationCount',`${candidates.length}곳`);
    const box=document.querySelector('#recommendationRows');
    if(box) box.innerHTML=candidates.map(r=>{const i=identity(r),name=i.name||'업체';return `<tr><td><strong>${rows.indexOf(r)+1} ${esc(name)}</strong><small class="badge">${done(r)?'고객':'후보'}</small></td><td>${esc(r.evidence||r.source||'공개 업체 연락처')}</td><td>${esc(r.interest||r.category||'')}</td><td>${i.email?`<a href="mailto:${esc(i.email)}">${esc(i.email)}</a>`:'미등록'}</td><td>${i.phone?`<a href="tel:${esc(i.phone)}">${esc(i.phone)}</a>`:'미등록'}</td><td>${esc(r.reason||r.link||'')}</td><td><button type="button" onclick="window.yhOpenContact&&window.yhOpenContact(${JSON.stringify(r)})">첫 연락</button></td></tr>`}).join('');
  }
  const run=()=>{render();setTimeout(render,250);setTimeout(render,1000);setTimeout(render,2500)};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  window.addEventListener('storage',run); setInterval(render,3000);
})();

/* Final customer-discovery reconciliation: keep visible totals and rows on one source of truth. */
(function(){
  if(!/\/leads\.html$/i.test(location.pathname)) return;
  function norm(v){return String(v||'').trim().toLowerCase().replace(/[\s()（）.·,，'"_\-]+/g,'');}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function val(o, keys){for(const k of keys){if(o&&o[k]!=null&&String(o[k]).trim()!=='') return String(o[k]).trim();}return '';}
  function dateOf(o){
    const raw=val(o,['date','dateKey','discoveryDate','discoveredAt','createdAt','discoveredDate']);
    const m=raw.match(/(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
    return m ? m[1]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[3]).padStart(2,'0') : '';
  }
  function emailOf(o){return val(o,['email','mail']).toLowerCase();}
  function phoneOf(o){return val(o,['phone','mobile','tel']).replace(/[^\d+]/g,'');}
  function usable(o){return !!emailOf(o) || /^\+?82?10\d{8,9}$/.test(phoneOf(o).replace(/^\+82/,'0')) || /^010\d{8}$/.test(phoneOf(o));}
  function keyOf(o){
    const n=norm(val(o,['name','company','customerName']));
    if(['골라라','gollalainc','gollala'].includes(n)) return 'gollala';
    return n || norm(emailOf(o)) || norm(phoneOf(o));
  }
  function read(){try{const a=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]');return Array.isArray(a)?a:[];}catch(_e){return [];}}
  function rows(){
    const excluded=new Set(['weavnora','대련리스폰','대련리스폰스']);
    const map=new Map();
    read().forEach(o=>{
      if(!o||!val(o,['name','company','customerName'])) return;
      const key=keyOf(o), name=val(o,['name','company','customerName']);
      if(!key||excluded.has(key)||!usable(o)) return;
      const prior=map.get(key);
      if(!prior){map.set(key,Object.assign({},o,{name:name,email:emailOf(o),phone:phoneOf(o),date:dateOf(o)}));return;}
      if(!prior.email) prior.email=emailOf(o);
      if(!prior.phone) prior.phone=phoneOf(o);
      if(!prior.date||dateOf(o)&&dateOf(o)<prior.date) prior.date=dateOf(o);
      if(o.contactActivityConfirmed===true) prior.contactActivityConfirmed=true;
      if(!prior.source) prior.source=val(o,['source','evidence']);
      if(!prior.interest) prior.interest=val(o,['interest','category']);
    });
    return Array.from(map.values());
  }
  function render(){
    const tbody=document.querySelector('#recommendationRows');
    const data=rows();
    if(!tbody && !document.querySelector('#totalCount')) return;
    const latest=data.map(dateOf).filter(Boolean).sort().pop()||'';
    const todayCount=latest ? data.filter(x=>dateOf(x)===latest).length : 0;
    const contacts=data.filter(x=>x.contactActivityConfirmed===true).length;
    const q=String((document.querySelector('#leadSearch')||{}).value||'').trim().toLowerCase();
    const candidates=data.filter(x=>x.contactActivityConfirmed!==true && (!q || [x.name,x.email,x.phone,x.interest,x.source].join(' ').toLowerCase().includes(q)));
    if(tbody){
      if(!candidates.length){tbody.innerHTML='<tr><td colspan="7" class="muted">새 연락처가 확인된 추천 고객이 표시됩니다.</td></tr>';}
      else tbody.innerHTML=candidates.map((c,i)=>{
        const kind=c.email&&c.phone?'고객':'후보';
        const source=val(c,['source','evidence'])||'공개 업체 연락처';
        const interest=val(c,['interest','category'])||'의류·패션·원단·부자재·OEM·ODM';
        return '<tr><td><span class="seq">'+(i+1)+'</span><b>'+esc(c.name)+'</b><br><span class="badge">'+kind+'</span></td><td class="evidence">'+esc(source)+'</td><td>'+esc(interest)+'</td><td>'+(c.email?'<a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>':'<span class="muted">미등록</span>')+'</td><td>'+(c.phone?'<a href="tel:'+esc(c.phone)+'">'+esc(c.phone)+'</a>':'<span class="muted">미등록</span>')+'</td><td>공개 업체 연락처</td><td><button class="btn small recommendation-contact" data-customer="'+esc(c.name)+'">첫 연락</button></td></tr>';
      }).join('');
    }
    const total=document.querySelector('#totalCount'), today=document.querySelector('#todayCount'), contact=document.querySelector('#contactCount'), summary=document.querySelector('#totalSummary'), count=document.querySelector('#recommendationCount');
    if(total) total.textContent=String(data.length);
    if(today) today.textContent=String(todayCount)+'/'+String(todayCount);
    if(contact) contact.textContent=String(contacts);
    if(summary) summary.textContent=' · 전체 '+String(data.length)+'곳';
    if(count) count.textContent='('+String(candidates.length)+'곳)';
  }
  function start(){render();[0,1000,2500,5000,8000].forEach(ms=>setTimeout(render,ms));setInterval(render,1500);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();

/* 연락처 저장만 완료해도 연락관리로 즉시 반영하고, 기존 저장 기록도 한 번 보정합니다. */
window.addEventListener('DOMContentLoaded', function(){
  const saveBtn=document.querySelector('#saveContact');
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')}catch(_e){return fallback}};
  const write=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
  const leads=read('yhtrade.leads',[]);
  const contacts=read('yhtrade.contacts',{});
  let reconciled=false;
  leads.forEach(item=>{
    const name=String(item&&item.name||'').trim();
    const base=name.split(' — ')[0].trim();
    const saved=contacts[name]||contacts[base];
    if(saved&&saved.lastChannel&&item.contactActivityConfirmed!==true){
      item.contactActivityConfirmed=true;
      item.status='연락 완료(작성)';
      item.next='후속 확인';
      item.lastContactAt=item.lastContactAt||saved.lastContactAt||new Date().toISOString();
      reconciled=true;
    }
  });
  if(reconciled)write('yhtrade.leads',leads);
  if(!saveBtn)return;
  saveBtn.onclick=function(){
    const title=document.querySelector('#modalTitle');
    const name=(title?title.textContent:'').replace(/\s*연락처\s*$/,'').trim();
    const email=String((document.querySelector('#contactEmail')||{}).value||'').trim();
    const phone=String((document.querySelector('#contactPhone')||{}).value||'').trim();
    const rows=read('yhtrade.leads',[]);
    let item=rows.find(x=>String(x.name||'').trim()===name||String(x.name||'').split(' — ')[0].trim()===name);
    if(!item){item={name:name,email:'',phone:'',status:'연락 대기',next:'첫 연락'};rows.push(item)}
    item.email=email;item.phone=phone;item.contactActivityConfirmed=true;item.status='연락 완료(작성)';item.next='후속 확인';item.lastContactAt=new Date().toISOString();item.log=(item.log?item.log+' | ':'')+'연락처 저장 처리';
    const saved=read('yhtrade.contacts',{});saved[name]={email,phone,lastChannel:'연락처 저장',lastContactAt:item.lastContactAt};
    write('yhtrade.leads',rows);write('yhtrade.contacts',saved);
    location.href='outreach.html?from=lead';
  };
});

// Keep the first-contact SMS wording consistent with the approved mobile message.
window.addEventListener('DOMContentLoaded', function(){
  window.smsTemplate = function(company, person){
    const greeting = person ? person + ' 대표님' : company + ' 대표님';
    return '안녕하세요. ' + greeting + '\n중국 무역 전문업체 윤항무역 Aimee Park입니다.\n15년 이상 중국 현지 소싱·OEM/ODM 생산을 진행하고 있으며, 이우 현지 사무실을 통해 검품·물류·통관까지 일괄 대행합니다.\n상품 사진이나 원단·부자재 샘플을 보내주셔도 소싱 및 견적 안내가 가능하며, 샘플로 품질 확인도 가능합니다.\n작은 거래부터 좋은 인연으로 이어지길 희망합니다. 편하게 문의 부탁드립니다.\n윤항무역 Aimee Park\n홈페이지: https://www.trade-yh.com\n010-4960-1314';
  };

  // leads.html has an older inline template. Rewrite SMS compose URLs here so
  // every first-contact button opens Phone Link with the approved wording.
  const nativeOpen = window.open;
  window.open = function(url, target, features){
    if(typeof url === 'string' && url.indexOf('sms:') === 0){
      const phone = url.slice(4).split('?')[0];
      const personField = document.querySelector('#recipientName');
      const titleField = document.querySelector('#modalTitle');
      const person = personField ? personField.value.trim() : '';
      let company = titleField ? titleField.textContent.replace(/\s*연락처\s*$/,'').trim() : '';
      if(!company) company = person || '담당자';
      url = 'sms:' + phone + '?body=' + encodeURIComponent(window.smsTemplate(company, person));
    }
    return nativeOpen.call(window, url, target, features);
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

/* 2026-10-28 코리안프렌즈 식별명만 정리합니다.
 * 문자창을 열었다는 이유로 메일 완료/연락 완료로 강제하지 않습니다. */
(function(){
  const variants=new Set(['코리안프렌즈','코리안 프렌즈','Korean Friends'].map(v=>String(v).trim().toLowerCase().replace(/[\s()（）.·,，'"_-]+/g,'')));
  const emailKey='info@koreanfriends.co.kr';
  const norm=v=>String(v||'').trim().toLowerCase().replace(/[\s()（）.·,，'"_-]+/g,'');
  let leads=[];try{leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){leads=[]}
  const item=leads.find(x=>variants.has(norm(x.name))||norm(x.email)===norm(emailKey));
  if(item){item.name='코리안프렌즈';item.email=item.email||emailKey;item.phone=item.phone||'070-4452-5942';localStorage.setItem('yhtrade.leads',JSON.stringify(leads))}
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

  // 문자 작성창을 여는 것과 실제 발송을 분리합니다.
  // leads.html의 기존 인라인 핸들러가 작성창을 열면서 저장값을 먼저 바꾸므로,
  // 작성창만 연 경우에는 저장 전 상태를 즉시 복원합니다.
  if(!window.__yhSmsOpenGuard){
    window.__yhSmsOpenGuard=true;
    document.addEventListener('click',function(e){
      const button=e.target&&e.target.closest?e.target.closest('#sendSms'):null;
      if(!button)return;
      const beforeLeads=localStorage.getItem('yhtrade.leads');
      const beforeContacts=localStorage.getItem('yhtrade.contacts');
      setTimeout(function(){
        if(beforeLeads!==null)localStorage.setItem('yhtrade.leads',beforeLeads);
        if(beforeContacts!==null)localStorage.setItem('yhtrade.contacts',beforeContacts);
      },0);
    },true);
  }

  // 과거에 문자 작성만 했는데 완료로 저장된 기록을 한 번 복구합니다.
  // 실제 발송 완료 로그나 사용자의 명시적 확인이 있는 기록은 건드리지 않습니다.
  try{
    const key='yhtrade.smsDraftOnlyRepairV1';
    if(!localStorage.getItem(key)){
      const raw=localStorage.getItem('yhtrade.leads');
      const leads=raw?JSON.parse(raw):[];
      let changed=false;
      leads.forEach(item=>{
        const log=String(item&&item.log||'');
        const draftOnly=item&&item.smsPrepared===true;
        const actual=item&&item.smsConfirmed===true||log.includes('문자 발송 완료')||log.includes('문자 전송 완료');
        if(draftOnly&&!actual){
          item.smsWritten=false;
          item.smsPrepared=false;
          item.contactActivityConfirmed=false;
          item.status='연락 대기';
          item.next='첫 연락';
          item.lastChannel='문자 작성';
          delete item.lastContactAt;
          changed=true;
        }
      });
      if(changed)localStorage.setItem('yhtrade.leads',JSON.stringify(leads));
      localStorage.setItem(key,'1');
    }
  }catch(_e){}

  // 문자창만 열었거나 저장 중 화면이 갱신되어 양쪽 목록에서 사라진
  // 업체를 고객발굴로 복구합니다. 실제 발송 확인이 없는 경우에만 적용합니다.
  (function missingLeadRestoreV2(){
  if(window.__YH_DISABLE_LEGACY_RECONCILIATION__) return;
    const missing=[
      {name:'코리안프렌즈',email:'info@koreanfriends.co.kr',phone:'070-4452-5942'},
      {name:'에프엔엔',email:'may@friday9.co.kr',phone:'02-542-4866'},
      {name:'이유 인터네셔널',email:'',phone:'010-4750-7448'},
      {name:'티집',email:'teeezip@teeezip.com',phone:''},
      {name:'이에스에르마나',email:'hermanar2024@daum.net',phone:'010-5122-5834'},
      {name:'제이앤케이컴퍼니리미티드',email:'',phone:'010-4823-1422'},
      {name:'굿트러스트',email:'sales@goodtrust.co.kr',phone:'051-526-4018'},
      {name:'FM컴퍼니',email:'fmcompany24@naver.com',phone:'010-4857-2824'}
    ];
    const norm=v=>String(v||'').toLowerCase().replace(/[^0-9a-z가-힣]/g,'');
    const keys=x=>[norm(x.name),norm(x.email),norm(x.phone)].filter(Boolean);
    const hasActual=x=>{
      const log=String(x&&x.log||'');
      return x&&((x.mailConfirmed===true)||(x.smsConfirmed===true)||log.includes('메일 발송 완료')||log.includes('문자 발송 완료')||log.includes('문자 전송 완료'));
    };
    const apply=()=>{
      let leads=[];
      try{leads=JSON.parse(localStorage.getItem('yhtrade.leads')||'[]')}catch(_e){leads=[]}
      let contacts={};
      try{contacts=JSON.parse(localStorage.getItem('yhtrade.contacts')||'{}')}catch(_e){contacts={}}
      let changed=false;
      const leadKeys=new Set(leads.flatMap(keys));
      missing.forEach(src=>{
        let item=leads.find(x=>keys(x).some(k=>keys(src).includes(k)));
        if(!item){
          item={date:'2026-10-28',name:src.name,area:'',interest:'의류·패션·원단·부자재·OEM·ODM',email:src.email,phone:src.phone,evidence:'오늘 확인한 공개 업체 연락처',source:'공식 업체 홈페이지',status:'연락 대기',next:'첫 연락',contactActivityConfirmed:false,smsWritten:false,smsPrepared:false,mailWritten:false};
          leads.push(item); changed=true;
        }else{
          // 사용자가 명시한 8곳은 이번 목록에서 실제 전송되지 않은 누락 업체입니다.
          // 기존에 잘못 남은 작성/완료 상태를 초기화하여 다시 첫 연락 대상으로 둡니다.
          const before=JSON.stringify(item);
          item.name=src.name; item.email=src.email||item.email||''; item.phone=src.phone||item.phone||'';
          item.contactActivityConfirmed=false; item.smsWritten=false; item.smsPrepared=false; item.mailWritten=false;
          item.status='연락 대기'; item.next='첫 연락'; item.lastChannel='';
          delete item.lastContactAt; delete item.mailConfirmed; delete item.smsConfirmed; delete item.smsNotNeeded; delete item.mailNotNeeded;
          if(JSON.stringify(item)!==before)changed=true;
        }
        const matchKeys=new Set(keys(src));
        Object.keys(contacts).forEach(k=>{
          const c=contacts[k]||{};
          if(matchKeys.has(norm(k))||keys(c).some(v=>matchKeys.has(v))){ delete contacts[k]; changed=true; }
        });
      });
      if(changed){
        localStorage.setItem('yhtrade.leads',JSON.stringify(leads));
        localStorage.setItem('yhtrade.contacts',JSON.stringify(contacts));
        if(location.pathname.endsWith('leads.html')&&!sessionStorage.getItem('yhtrade.missingLeadRestoreV2Reload')){
          sessionStorage.setItem('yhtrade.missingLeadRestoreV2Reload','1');
          setTimeout(()=>location.reload(),80);
        }
      }
    };
    [1200,3000,6000].forEach(ms=>setTimeout(apply,ms));
  })();
})();

/* FINAL LEADS RECONCILIATION: keep totals and recommendations derived from one canonical set. */
(function(){
  if(window.__YH_DISABLE_LEGACY_RECONCILIATION__) return;
  if(!/\/leads\.html$/.test(location.pathname)) return;
  const STORE='yhtrade.leads';
  const alias={
    '골라라':'gollala','gollala inc.':'gollala','gollala inc':'gollala','gollala':'gollala'
  };
  const text=v=>String(v==null?'':v).trim();
  const norm=v=>text(v).toLowerCase().replace(/[\s\-_.()·ㆍ]/g,'');
  const nameKey=v=>alias[norm(v)]||norm(v);
  const mail=v=>text(v).toLowerCase();
  const phone=v=>text(v).replace(/[^0-9+]/g,'');
  const dateOf=r=>text(r.date||r.discoveredAt||r.discoveryDate||r.foundDate||r.createdAt);
  const dateKey=d=>{const m=text(d).match(/(\d{4})[^0-9]?(\d{1,2})[^0-9]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`:''};
  const has010=p=>/^010\d{8}$/.test(p.replace(/^\+82/,'0'));
  const isDone=r=>r.contactActivityConfirmed===true||r.firstContactCompleted===true||r.status==='contacted';
  function read(){try{const a=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
  function canonical(){
    const by=new Map(), order=[];
    read().forEach(raw=>{
      const r=Object.assign({},raw);
      const nk=nameKey(r.name||r.customer||r.company); const em=mail(r.email); const ph=phone(r.phone||r.mobile||r.tel);
      if(!nk && !em && !ph) return;
      if(nk==='weavnora' || /weavnora/i.test(text(r.name))) return;
      const done=isDone(r);
      if(!done && !em && !has010(ph)) return;
      if(nk==='gollala') r.name='골라라';
      if(nk==='gollala') r.email='lucia@gollala.com';
      const k=nk||em||ph;
      if(!by.has(k)){by.set(k,r);order.push(k);return;}
      const x=by.get(k);
      ['email','phone','mobile','tel','evidence','source','interest','category','company','name','customer','date','discoveredAt','discoveryDate','foundDate','createdAt'].forEach(f=>{if(!text(x[f])&&text(r[f]))x[f]=r[f]});
      if(done)x.contactActivityConfirmed=true;
      if(r.firstContactCompleted)x.firstContactCompleted=true;
      if(dateKey(dateOf(r)) && (!dateKey(dateOf(x))||dateKey(dateOf(r))<dateKey(dateOf(x)))) x.date=dateOf(r);
    });
    const rows=order.map(k=>by.get(k)).filter(Boolean);
    try{localStorage.setItem(STORE,JSON.stringify(rows))}catch(e){}
    return rows;
  }
  function set(id,v){const e=document.querySelector(id);if(e)e.textContent=String(v)}
  function render(){
    const rows=canonical();
    const contacts=rows.filter(isDone);
    const candidates=rows.filter(r=>!isDone(r) && (mail(r.email)||has010(phone(r.phone||r.mobile||r.tel))));
    const dates=rows.map(r=>dateKey(dateOf(r))).filter(Boolean).sort();
    const latest=dates[dates.length-1]||'';
    set('#totalCount',rows.length); set('#contactCount',contacts.length); set('#todayCount',`${rows.filter(r=>dateKey(dateOf(r))===latest).length}/${rows.filter(r=>dateKey(dateOf(r))===latest).length}`);
    set('#totalSummary',`전체 ${rows.length}곳`); set('#recommendationCount',`${candidates.length}곳`);
    const box=document.querySelector('#recommendationRows'); if(!box)return;
    box.innerHTML=candidates.map((r,i)=>{
      const n=text(r.name||r.customer||r.company)||'업체'; const em=mail(r.email)||'미등록'; const ph=text(r.phone||r.mobile||r.tel)||'미등록';
      const ev=text(r.evidence||r.source||'공개 업체 연락처'); const interest=text(r.interest||r.category||'의류·패션·원단·부자재·OEM·ODM');
      return `<tr><td><strong>${i+1} ${n}</strong><br><small>${r.type==='candidate'?'후보':'고객'}</small></td><td>${ev}</td><td>${interest}</td><td>${em}</td><td>${ph}</td><td>${text(r.source||'공개 업체 정보')}</td><td><button class="btn recommendation-contact" data-customer="${n.replace(/"/g,'&quot;')}">첫 연락</button></td></tr>`;
    }).join('');
  }
  function schedule(){[0,100,300,700,1500,3000,6000].forEach(ms=>setTimeout(render,ms));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule); else schedule();
  setInterval(render,1500);
})();

// LEADS STABLE RECONCILIATION V2
(function(){
  if(window.__YH_DISABLE_LEGACY_RECONCILIATION__) return;
  if(!/\/leads\.html$/.test(location.pathname)) return;
  const STORE='yhtrade.leads';
  const alias={'골라라':'gollala','gollala inc.':'gollala','gollala inc':'gollala','gollala':'gollala'};
  const t=v=>String(v==null?'':v).trim();
  const n=v=>t(v).toLowerCase().replace(/[\s\-_.()·ㆍ]/g,'');
  const keyName=v=>alias[n(v)]||n(v);
  const email=v=>t(v).toLowerCase();
  const phone=v=>t(v).replace(/[^0-9+]/g,'');
  const dateOf=r=>t(r['발굴일']||r.discoveryDate||r.discoveredAt||r.foundDate||r.date||r.createdAt);
  const dateKey=v=>{const s=t(v);let m=s.match(/(\d{4})\D?(\d{1,2})\D?(\d{1,2})/);if(!m){m=s.match(/(\d{4})[-/.](\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,'0')}`:''}return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`};
  const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const has010=p=>/^010\d{8}$/.test(p.replace(/^\+82/,'0'));
  const done=r=>r.contactActivityConfirmed===true||r.firstContactCompleted===true||r.status==='contacted'||r.status==='연락 완료'||r.status==='메일 완료'||r.status==='문자 완료'||r.status==='연락 불가'||r.mailSent===true||r.smsSent===true||r.mailWritten===true||r.smsWritten===true||r.mailNotNeeded===true||r.smsNotNeeded===true;
  function read(){try{const a=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
  function canonical(){
    const by=new Map(),order=[];
    for(const raw of read()){
      const r=Object.assign({},raw),name=t(r.name||r.customer||r.company),nk=keyName(name),em=email(r.email),ph=phone(r.phone||r.mobile||r.tel);
      if(!nk&&!em&&!ph)continue;
      if(nk==='weavnora'||/weavnora/i.test(name))continue;
      if(nk==='gollala'){r.name='골라라';r.email='lucia@gollala.com'}
      const k=nk||em||ph,existing=by.get(k);
      if(!existing){by.set(k,r);order.push(k);continue}
      for(const f of ['email','phone','mobile','tel','evidence','source','interest','category','company','name','customer','date','발굴일','discoveredAt','discoveryDate','foundDate','createdAt'])if(!t(existing[f])&&t(r[f]))existing[f]=r[f];
      if(done(r))existing.contactActivityConfirmed=true;
      if(r.firstContactCompleted===true)existing.firstContactCompleted=true;
    }
    const rows=order.map(k=>by.get(k)).filter(Boolean);try{localStorage.setItem(STORE,JSON.stringify(rows))}catch(e){}return rows;
  }
  const esc=v=>t(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function set(id,v){const e=document.querySelector(id),s=String(v);if(e&&e.textContent!==s)e.textContent=s}
  function render(){
    const rows=canonical(),contacts=rows.filter(done),candidates=rows.filter(r=>!done(r)&&(email(r.email)||phone(r.phone||r.mobile||r.tel))),today=rows.filter(r=>dateKey(dateOf(r))===todayKey()).length;
    const box=document.querySelector('#recommendationRows');
    set('#totalCount',rows.length);set('#contactCount',contacts.length);set('#todayCount',`${today}/${today}`);set('#totalSummary',`전체 ${rows.length}곳`);set('#recommendationCount',`${candidates.length}곳`);
    if(!box)return;
    const html=candidates.map((r,i)=>{const name=t(r.name||r.customer||r.company)||'업체';return `<tr><td><strong>${i+1} ${esc(name)}</strong><br><small>${r.type==='candidate'?'후보':'고객'}</small></td><td>${esc(r.evidence||r.source||'공개 업체 연락처')}</td><td>${esc(r.interest||r.category||'의류·패션·원단·부자재·OEM·ODM')}</td><td>${esc(email(r.email)||'미등록')}</td><td>${esc(t(r.phone||r.mobile||r.tel)||'미등록')}</td><td>${esc(r.source||'공개 업체 정보')}</td><td><button class="btn recommendation-contact" data-customer="${esc(name)}">첫 연락</button></td></tr>`}).join('');
    if(box.innerHTML!==html)box.innerHTML=html;
  }
  const schedule=()=>setTimeout(render,80);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  window.addEventListener('storage',schedule);setInterval(schedule,1000);
})();

/* DEFINITIVE LEADS RECONCILIATION: one canonical list, explicit contact only */
(function(){
  if(!/\/leads\.html$/.test(location.pathname)) return;
  const STORE='yhtrade.leads';
  const clean=v=>String(v==null?'':v).trim();
  const norm=v=>clean(v).toLowerCase().replace(/[\s\-_.()·ㆍ]/g,'');
  const alias={골라라:'gollala','gollalainc':'gollala',gollala:'gollala'};
  const nameKey=v=>alias[norm(v)]||norm(v);
  const email=v=>clean(v).toLowerCase();
  const phone=v=>clean(v).replace(/[^0-9+]/g,'');
  const identity=r=>({name:clean(r.name||r.customer||r.company),email:email(r.email),phone:phone(r.phone||r.mobile||r.tel)});
  const explicitDone=r=>r.contactActivityConfirmed===true||r.firstContactCompleted===true||['contacted','연락 완료','메일 완료','문자 완료','연락 불가'].includes(clean(r.status))||r.mailSent===true||r.mailConfirmed===true||r.smsSent===true||r.smsConfirmed===true||r.mailNotNeeded===true||r.smsNotNeeded===true;
  const dateOf=r=>clean(r['발굴일']||r.discoveryDate||r.discoveredAt||r.foundDate||r.date||r.createdAt);
  const dateKey=v=>{const s=clean(v),m=s.match(/(\d{4})\D?(\d{1,2})\D?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`:''};
  function read(){try{const v=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
  function canonical(){
    const groups=[];
    for(const raw of read()){
      const r=Object.assign({},raw),id=identity(r),nk=nameKey(id.name);
      if(!nk&&!id.email&&!id.phone) continue;
      if(nk==='weavnora'||/weavnora/i.test(id.name)) continue;
      if(nk==='gollala'){r.name='골라라';r.email='lucia@gollala.com';id.email='lucia@gollala.com'}
      const keys=[nk&&`n:${nk}`,id.email&&`e:${id.email}`,id.phone&&`p:${id.phone}`].filter(Boolean);
      let g=groups.find(x=>keys.some(k=>x.keys.has(k)));
      if(!g){g={keys:new Set(keys),row:r};groups.push(g)}else{
        keys.forEach(k=>g.keys.add(k));
        for(const f of ['name','customer','company','email','phone','mobile','tel','evidence','source','interest','category','date','발굴일','discoveredAt','discoveryDate','foundDate','createdAt']) if(!clean(g.row[f])&&clean(r[f])) g.row[f]=r[f];
        if(explicitDone(r)) g.row.contactActivityConfirmed=true;
        if(r.firstContactCompleted===true) g.row.firstContactCompleted=true;
        if(r.mailSent===true) g.row.mailSent=true;
        if(r.smsSent===true) g.row.smsSent=true;
      }
    }
    const rows=groups.map(g=>g.row);
    try{localStorage.setItem(STORE,JSON.stringify(rows))}catch(e){}
    return rows;
  }
  const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let rendering=false;
  function set(id,v){const e=document.querySelector(id),s=String(v);if(e&&e.textContent!==s)e.textContent=s}
  function render(){
    if(rendering)return; rendering=true;
    const rows=canonical(),contacts=rows.filter(explicitDone),candidates=rows.filter(r=>!explicitDone(r)&&(()=>{const i=identity(r);return !!(i.email||i.phone)})());
    const dated=rows.map(r=>dateKey(dateOf(r))).filter(Boolean),latest=dated.sort().pop()||'';
    const latestCount=latest?rows.filter(r=>dateKey(dateOf(r))===latest).length:0;
    set('#totalCount',rows.length);set('#contactCount',contacts.length);set('#todayCount',`${latestCount}/${latestCount}`);set('#totalSummary',`전체 ${rows.length}곳`);set('#recommendationCount',`${candidates.length}곳`);
    const box=document.querySelector('#recommendationRows');
    if(box){
      const html=candidates.map((r,i)=>{const x=identity(r),name=x.name||'업체';return `<tr><td><strong>${i+1} ${esc(name)}</strong><br><small>${r.type==='candidate'?'후보':'고객'}</small></td><td>${esc(r.evidence||r.source||'공개 업체 연락처')}</td><td>${esc(r.interest||r.category||'의류·패션·원단·부자재·OEM·ODM')}</td><td>${esc(x.email||'미등록')}</td><td>${esc(x.phone||'미등록')}</td><td>${esc(r.source||'공개 업체 정보')}</td><td><button class="btn recommendation-contact" data-customer="${esc(name)}">첫 연락</button></td></tr>`}).join('');
      if(box.innerHTML!==html) box.innerHTML=html;
    }
    rendering=false;
  }
  const schedule=()=>setTimeout(render,50);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  window.addEventListener('storage',schedule);setInterval(schedule,800);
  const observer=new MutationObserver(()=>{if(!rendering)schedule()});
  if(document.body) observer.observe(document.body,{childList:true,subtree:true});
})();
