const AUTH_KEY='yhtrade.auth';
function showNotice(message,type='error'){const el=document.querySelector('#notice');if(!el)return;el.textContent=message;el.className=`notice show ${type}`}
function goAfterLogin(){location.href='index.html'}
function isSignedIn(){return localStorage.getItem(AUTH_KEY)==='signed-in'}
function requireLogin(){if(!isSignedIn())location.href='login.html'}
document.addEventListener('DOMContentLoaded',()=>{
 const publicPages=['login.html','signup.html','find-id.html','find-password.html'];
 if(!publicPages.some(p=>location.pathname.endsWith(p)))requireLogin();
 const login=document.querySelector('#loginForm');
 if(login)login.addEventListener('submit',e=>{e.preventDefault();const id=document.querySelector('#loginId').value.trim();const pw=document.querySelector('#loginPw').value.trim();if(!id||!pw){showNotice('아이디와 비밀번호를 입력해 주세요.');return}localStorage.setItem(AUTH_KEY,'signed-in');localStorage.setItem('yhtrade.user',id);showNotice('로그인되었습니다. 잠시 후 대시보드로 이동합니다.','ok');setTimeout(goAfterLogin,500)});
 const signout=document.querySelector('#signout');if(signout)signout.addEventListener('click',()=>{localStorage.removeItem(AUTH_KEY);localStorage.removeItem('yhtrade.user');location.href='login.html'});
 const findId=document.querySelector('#findIdForm');if(findId)findId.addEventListener('submit',e=>{e.preventDefault();showNotice('등록된 연락처를 확인한 뒤 아이디 안내를 준비합니다. 실제 발송 기능은 관리자 계정 연결 후 활성화됩니다.','ok')});
 const findPw=document.querySelector('#findPwForm');if(findPw)findPw.addEventListener('submit',e=>{e.preventDefault();showNotice('등록된 이메일로 비밀번호 재설정 안내를 준비합니다. 실제 메일 발송은 서버 연결 후 활성화됩니다.','ok')});
 const signup=document.querySelector('#signupForm');if(signup)signup.addEventListener('submit',e=>{e.preventDefault();const name=document.querySelector('#signupName').value.trim();const email=document.querySelector('#signupEmail').value.trim();const id=document.querySelector('#signupId').value.trim();const pw=document.querySelector('#signupPw').value;const confirm=document.querySelector('#signupPwConfirm').value;const terms=document.querySelector('#signupTerms').checked;if(!name||!email||!id||!pw||!confirm){showNotice('필수 항목을 모두 입력해 주세요.');return}if(pw.length<8){showNotice('비밀번호는 8자 이상으로 설정해 주세요.');return}if(pw!==confirm){showNotice('비밀번호가 일치하지 않습니다.');return}if(!terms){showNotice('이용 약관에 동의해 주세요.');return}localStorage.setItem('yhtrade.pendingUser',JSON.stringify({name,email,id,createdAt:new Date().toISOString()}));showNotice('가입 신청이 저장되었습니다. 관리자 확인 후 로그인할 수 있습니다.','ok');setTimeout(()=>location.href='login.html',900)});
});
