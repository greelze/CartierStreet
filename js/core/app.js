"use strict";
/* APP SHELL
   render(), toasts, sign-in screen and sidebar. */
/* ---- render ---- */
function render(){const a=$("#app");document.body.style.cursor=S.busy?"progress":"";
 if(S.loading&&!S.in){a.innerHTML=vSkeleton();return}
 if(!S.in){a.innerHTML=vLogin();return}
 a.innerHTML='<div class="app">'+vSide()+'<main class="main'+(["home","myday","cal"].includes(S.tab)?" wide":"")+'">'+(S.search?vSearch():({home:vHome,notifs:vNotifs,myday:vMyDay,cal:vCal,settings:vSettings}[S.tab])())+'</main></div>'+(S.open?vDrawer():"")+(S.pick?vPick():"")+(S.link?vLink():"")+(S.form?vForm():"")+
 (S.in&&!S.open&&!S.form&&!S.pick&&!S.link&&!S.search?'<button class="fab" data-act="add" aria-label="Add something">+</button>':"")+
 (S.toast?'<div class="toast" role="status"><span>'+H(S.toast.msg)+'</span>'+(S.toast.undo?'<button data-act="restore" data-id="'+S.toast.undo+'">Undo</button>':'')+'</div>':"");}
let TT;function toast(msg,undo){S.toast={msg,undo};render();clearTimeout(TT);TT=setTimeout(()=>{S.toast=null;const t=$(".toast");t&&t.remove()},4200)}
function vLogin(){const left='<div class="l"><div><div class="mk">LOGO</div><h1>Cartier St.</h1><p class="room">Plum Room</p><p>Our music. Our label. Our place.</p></div></div>';
 if(S.noMember)return '<div class="lg">'+left+'<div class="r"><div class="lf"><h2>Almost there</h2><p class="mut">'+H(S.noMember)+' signed in, but it isn’t linked to a Cartier St. member yet. Ask an admin to link your account, then sign in again.</p><button class="btn w" data-act="logout">Sign out</button></div></div></div>';
 return '<div class="lg">'+left+'<div class="r"><div class="lf"><h2>Welcome back</h2><p class="mut">Sign in to the Cartier St. workspace.</p><button class="btn w" data-act="google">Continue with Google</button>'+
 '<label class="mut">Email<input id="em" type="email" value="'+H(S.em)+'" autocomplete="username"></label><label class="mut">Password<input id="pw" type="password" autocomplete="current-password"></label>'+
 (S.lgErr?'<div class="err">'+H(S.lgErr)+'</div>':'')+'<button class="btn pri w" data-act="login"'+(S.busy?" disabled":"")+'>'+(S.busy?"Signing in…":"Sign in")+'</button></div></div></div>';}
const SIDE_MAIN=["home","myday","cal","notifs"]; // desktop order (D0.1); the phone bar reorders these in CSS
function vSide(){const un=unread(),T=k=>TABS.find(t=>t[0]===k)||[k,k,""],
 nav=(k,cls)=>{const t=T(k),on=S.tab===k&&!S.search&&!(k==="home"&&S.hcat);
  return '<button class="nav '+cls+(on?" on":"")+'" data-act="tab" data-t="'+k+'">'+sv(t[2])+'<span>'+t[1]+'</span>'+(k==="notifs"&&un?'<i class="n">'+un+'</i>':"")+'</button>';};
 return '<aside class="side"><div class="logo"><div class="mk">LOGO</div><span><b>CARTIER ST.</b><i>Plum Room</i></span></div>'+
 SIDE_MAIN.map(k=>nav(k,"top")).join("")+
 '<div class="navdiv"></div>'+ // the five categories get their own group (D0.6)
 ORDER.map(c=>'<button class="nav cat'+(S.tab==="home"&&!S.search&&S.hcat===c?" on":"")+'" data-act="sidecat" data-c="'+c+'">'+sv(CAT_ICON[c])+'<span>'+CAT[c].pl+'</span></button>').join("")+
 '<div class="me"><label>Signed in as</label><b style="display:block">'+H(mn(S.user))+'</b><span class="mut" style="font-size:13px">'+([isAdmin(S.user)?"Admin":"",M[S.user].art?"Artist":""].filter(Boolean).join(" · ")||"Member")+'</span></div>'+
 nav("settings","set")+'</aside>';}
/* grey placeholder shapes shown while the workspace loads */
function vSkeleton(){const card='<div class="bcard skc"><i class="sk" style="width:44px;height:44px;border-radius:12px"></i><i class="sk" style="width:55%;height:22px"></i><i class="sk" style="width:85%"></i><i class="sk" style="width:30%;height:30px;margin-top:14px"></i></div>';
 return '<div class="app" aria-busy="true"><aside class="side"><div class="logo"><div class="mk">LOGO</div><span><b>CARTIER ST.</b><i>Plum Room</i></span></div>'+'<i class="sk skn"></i>'.repeat(5)+'</aside>'+
 '<main class="main wide"><span class="sr">Loading your workspace…</span><i class="sk" style="width:170px"></i><i class="sk" style="width:340px;max-width:80%;height:38px;margin:12px 0 30px"></i><div class="cards">'+card.repeat(5)+'</div></main></div>';}