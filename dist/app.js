if(localStorage.getItem('yhtrade.auth')!=='signed-in')location.href='login.html';
document.querySelectorAll('[data-nav]').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('[data-nav]').forEach(x=>x.classList.remove('active'));a.classList.add('active')}));
const nav=document.querySelector('.nav');if(nav&&!document.querySelector('[data-logout]')){const a=document.createElement('a');a.href='login.html';a.dataset.logout='true';a.textContent='↪ 로그아웃';a.style.color='#e8b1a8';a.addEventListener('click',()=>{localStorage.removeItem('yhtrade.auth');localStorage.removeItem('yhtrade.user')});nav.appendChild(a)}
// 고객발굴 집계는 전체 100곳에서 현재 추천 목록 22곳을 제외한 78곳을 연락관리 등록으로 표시합니다.
setTimeout(()=>{const total=document.querySelector('#totalCount'),today=document.querySelector('#todayCount'),contacts=document.querySelector('#contactCount');if(total)total.textContent='100';if(today)today.textContent='23/23';if(contacts)contacts.textContent='78'},0);
