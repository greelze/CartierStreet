"use strict";
/* MY PROFILE  (S42, D4.7)
   An artist bio gets asked for on every single release. It is the same bio
   every time. This keeps it once, where the artist can edit it, and the
   Promotional Plan starts from it instead of asking again.

   Everyone edits their own. An admin can edit anyone's, because somebody has
   to be able to fix a bio the night before a pitch goes out.

   HTML: vProfile() below. CSS: css/pages/help.css
   Database: patch 20 (members.bio, members.photos_link). */

Object.assign(S,{prof:null}); // whose profile is open, when an admin is looking at someone else's

const PF=[["bio","Artist bio","a"],["photos","Press photos folder","t"]];
const pfOf=c=>({bio:(M[c]||{}).bio||"",photos:(M[c]||{}).photos||""});
const pfEdit=c=>c===S.user||isAdmin(S.user);

function vProfile(){const who=S.prof||S.user,p=pfOf(who),ed=pfEdit(who),mine=who===S.user;
 const others=isAdmin(S.user)?MK.filter(k=>k!==S.user&&M[k].art):[];
 return backBar("Settings","tab",' data-t="settings"')+
 '<div class="ph"><div><h1>'+(mine?"My profile":H(mn(who))+"’s profile")+'</h1>'+
 '<p class="mut lead">Written once here, used on every release. The Promotional Plan starts from this bio rather than asking for it again.</p></div></div>'+
 (others.length?'<div class="chips"><button class="chip'+(mine?" on":"")+'" data-act="pfwho" data-c="'+S.user+'">Me</button>'+
   others.map(k=>'<button class="chip'+(who===k?" on":"")+'" data-act="pfwho" data-c="'+k+'">'+H(mn(k).split(" ")[0])+'</button>').join("")+'</div>':"")+
 '<div class="pfcard">'+av(who,46)+'<div><b>'+H(mn(who))+'</b><span>'+
  (isAdmin(who)?"Admin":isArtist(who)?"Artist":"Member")+'</span></div></div>'+
 '<div class="rdg pfg">'+PF.map(f=>rdBox([f[0],f[1],f[2],0],p[f[0]],'data-pf="'+f[0]+'" data-who="'+who+'"',ed)).join("")+'</div>'+
 (ed?'<p class="mut note">Only you and the admins can change this. Everyone can read it, because it goes out with the music.</p>'
   :'<p class="mut note">Only '+H(mn(who))+' and the admins can change this.</p>')+
 vProfileUse(who);}

/* where this bio is actually being used, so editing it is not a shot in the dark */
function vProfileUse(who){
 const live_=DB.entries.filter(e=>e.cat==="songs"&&!isPast(e)&&e.by===who&&!filled((e.pp||{}).bio));
 if(!live_.length)return "";
 return sh("Releases still missing a bio",live_.length)+
  '<p class="mut asub">These have an empty Artist Bio in their Promotional Plan. Opening one gives you a button to drop this bio straight in.</p>'+
  live_.map(e=>row(e)).join("");}

/* S42: a brand new release starts with the owner's bio already in the plan,
   so the commonest box on the form is answered before anybody opens it. */
async function seedBio(e){
 if(!e||e.cat!=="songs")return;
 const b=(M[e.by]||{}).bio;
 if(!filled(b)||filled((e.pp||{}).bio))return;
 try{await savePP(e.id,"bio",b,false);e.pp=Object.assign({},e.pp,{bio:b});}
 catch(err){console.warn("Bio not copied into the plan:",err&&err.message||err);}}

PAGE_ACTIONS.profile=()=>{S.tab="profile";S.prof=null;S.open=null;S.search=false;scrollTo(0,0)};
PAGE_ACTIONS.pfwho=d=>{S.prof=d.c===S.user?null:d.c};