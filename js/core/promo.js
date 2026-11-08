"use strict";
/* PROMOTIONAL PLAN BLOCK  (D6.1.11, W8, S4)  +  POST LINKS  (S19)
   The Promotional Plan sits under Release Details on a release page: the three
   written parts, the six platform parts, and a calendar whose rows are real
   Content entries linked to the release — not a filed document.
   The timeline is worked out from the release date; none of it is stored.
   HTML: built by vPP() and vPostLinks() below. CSS: css/pages/details.css */

Object.assign(S,{pp:"write",ppPhase:"",ppDate:"",ppDraft:{}}); // which part is open, what a new post inherits, and what is half-typed per phase

/* ---- the plan's own boxes ---- */
const ppVal=(e,k)=>(e.pp||{})[k];
const ppPlat=(e,k)=>((e.pp||{}).plat||{})[k]||"";
/* every Content entry linked to this release, by phase (W8) */
/* relAll, not relEntries: the Plan is the one place a draft is meant to show (S4) */
const ppPosts=(e,phase)=>relAll(e.id,S.user).filter(x=>x.cat==="content"&&(!phase||x.phase===phase));

function ppMissing(e){const out=[];
 PP_TEXT.forEach(f=>{if(f[3]&&!filled(ppVal(e,f[0])))out.push(["write",f[1]])});
 PHASE_NEED.forEach(p=>{if(!ppPosts(e,p).length)out.push(["cal","A post in "+p])});
 return out;}
const ppLeft=e=>ppMissing(e).length;
const ppPartLeft=(e,p)=>ppMissing(e).filter(m=>m[0]===p).length;

/* ---- the three written parts, shared with Release Details where the doc says so ---- */
function ppTextPart(e,ed){
 return '<p class="rdnote">Song bios and the links live in Release Details above — these three are the plan’s own.</p><div class="rdg">'+
  PP_TEXT.map(f=>rdBox(f,ppVal(e,f[0]),'data-pp="'+f[0]+'"',ed&&!ppLock(e))+
   (f[0]==="bio"?vUseBio(e,ed&&!ppLock(e)):"")).join("")+'</div>';}

/* S42: a release made before the profile existed, or one whose bio was
   cleared, gets the saved bio offered rather than silently filled in. */
function vUseBio(e,ed){if(!ed||filled(ppVal(e,"bio")))return "";
 const b=(M[e.by]||{}).bio;if(!filled(b))return "";
 return '<p class="hintline usebio">'+H(mn(e.by))+' has a bio saved on their profile. '+
  '<button class="lnk" data-act="ppusebio" data-id="'+e.id+'">Use it</button></p>';}

PAGE_ACTIONS.ppusebio=d=>{const e=live(d.id);if(!e||!canEdit(e,S.user))return false;
 const b=(M[e.by]||{}).bio;if(!filled(b))return false;
 ppSave(e,"bio",b);toast("Bio copied in — edit it if this release needs something different");return false};

/* ---- the six platform parts; the ones that do not apply are simply left empty ---- */
function ppPlatforms(e,ed){
 /* 1.7c: the label is the question ONErpm's Priority Pitch form asks, so the
    answer can be copied straight across without being rewritten. */
 return '<p class="rdnote">Fill in only the platforms this release is actually going to use. Each box asks what ONErpm asks.</p><div class="rdg">'+
  PP_PLATFORMS.map(p=>rdBox([p[0],p[1]+" — "+PP_Q[p[0]],"a",0],ppPlat(e,p[0]),'data-ppp="'+p[0]+'"',ed)).join("")+'</div>';}

/* ---- the promotional calendar: every row is a real Content entry (W8, S4) ---- */
function ppCalendar(e,ed){const win=PHASE_WIN(e.release);
 if(!e.release)return '<p class="rdnote">Set a release date first — the timeline is worked out from it.</p>';
 return PHASES.map(ph=>{const w=win[ph],posts=sortByOcc(ppPosts(e,ph)),need=PHASE_NEED.includes(ph),short=need&&!posts.length;
  const when=w[1]?(w[0]===w[1]?fmtM(w[0]):fmtS(w[0])+" – "+fmtS(w[1])):"from "+fmtS(w[0]);
  return '<div class="ppph'+(short?" bad":"")+'"><div class="ppphh"><b>'+ph+(need?'<i class="rq">*</i>':"")+'</b><span>'+when+'</span></div>'+
   (posts.length?posts.map(x=>ppRow(x)).join("")
    :'<p class="ppempty">'+(need?"No post planned yet.":"Nothing planned — that is fine.")+'</p>')+
   (ed?ppComposer(ph,w[0]):"")+'</div>'}).join("");}

/* one row. A draft is still a real entry — you can open it, edit it, link
   things to it — it is only kept out of the lists until it is approved (S4). */
function ppRow(x){
 return '<div class="pprow'+(x.draft?" draft":"")+'">'+
  '<button class="ppopen" data-act="open" data-id="'+x.id+'">'+ctag("content")+
   '<span class="b"><b>'+H(x.title)+(x.draft?'<i class="dtag">Draft</i>':"")+'</b>'+
   '<span>'+H(fmtS(x.date)+" · "+ft(x.time)+((x.platforms||[]).length?" · "+x.platforms.join(", "):""))+'</span></span>'+
   (x.draft?"":'<span class="s" style="color:'+tone(x.status)[0]+'">'+H(x.status)+'</span>')+'</button>'+
  (x.draft&&isAdmin(S.user)?'<button class="btn pri sm ppok" data-act="ppapprove" data-id="'+x.id+'">Approve</button>':"")+
  (x.draft&&!isAdmin(S.user)?'<span class="ppwait">With Cartier St.</span>':"")+
  '</div>';}

/* S4: typed here, saved here. No form in the way — the row is the entry. */
function ppComposer(ph,date){
 return '<div class="ppnew"><input data-ppn="'+ph+'" value="'+H(S.ppDraft[ph]||"")+'" '+
  'placeholder="Type a post and press Enter — e.g. Teaser clip on TikTok" aria-label="Add a post to '+ph+'">'+
  '<button class="btn sm" data-act="ppnew" data-ph="'+ph+'" data-d="'+date+'">Add</button></div>';}

const PP_BODY={write:ppTextPart,plat:ppPlatforms,cal:ppCalendar};
const PP_PARTS=[["write","Blurb, keywords and bio"],["plat","Platforms"],["cal","Promotional Calendar"]];

/* ---- the block ---- */
function vPP(e){if(e.cat!=="songs"||isPast(e))return""; // F5.2
 const ed=canEdit(e,S.user),left=ppLeft(e),open=S.pp||"write";
 return '<div class="drd dpp"><div class="rdh"><h4>Promotional Plan</h4>'+
  '<span class="rdbar'+(left?"":" ok")+'">'+(left?left+" to go":"Plan complete")+'</span></div>'+
  '<div class="rdp">'+PP_PARTS.map(p=>{const n=ppPartLeft(e,p[0]),on=p[0]===open;
   return '<button class="rdt'+(on?" on":"")+(n?" bad":"")+'" data-act="pppart" data-p="'+p[0]+'" aria-expanded="'+on+'"><span>'+p[1]+'</span>'+(n?'<em>'+n+'</em>':'<i class="ok">✓</i>')+'</button>'+
    (on?'<div class="rdbody">'+PP_BODY[p[0]](e,ed)+'</div>':"")}).join("")+'</div></div>';}
/* S4: opening a draft from the plan should say plainly what it is, so nobody
   wonders why it is missing from the Content list. */
function vDraftBar(e){if(e.cat!=="content"||!e.draft)return "";
 const r=relAll(e.id,S.user).find(x=>x.cat==="songs");
 return '<div class="rvw wait"><h5>Draft post</h5>'+
  '<p>Typed into '+(r?'the Promotional Calendar for <b>'+H(r.title)+'</b>':"a Promotional Calendar")+
  '. It stays inside that plan — off the Content list, the Calendar and Search — until Cartier St. approves it.</p>'+
  (isAdmin(S.user)?'<div class="rvwa"><button class="btn pri" data-act="ppapprove" data-id="'+e.id+'">Approve this post</button></div>':"")+
  '</div>';}
/* ---- post links (S19) ----
   One link is required before a post can be Posted, and pasting the first one
   moves it there. Extra links are each labelled with one of the post's platforms. */
function vPostLinks(e){if(e.cat!=="content")return"";
 const ed=canEdit(e,S.user),l=e.links||[],bad=!hasLink(e);
 return '<h4>Post link'+(l.length>1?"s":"")+'</h4>'+
  (bad?'<p class="rdnote '+(ed?"":"ro")+'">A post is only Posted once its link is pasted. Pasting the first one marks it Posted.</p>':"")+
  '<div class="plk'+(bad?" bad":"")+'">'+
  (l.length?l.map((x,i)=>'<div class="plrow">'+
    (e.platforms.length>1?'<select data-pli="'+i+'" data-plf="platform"'+(ed?"":" disabled")+' aria-label="Platform">'+
      e.platforms.map(p=>'<option'+(p===x.platform?" selected":"")+'>'+H(p)+'</option>').join("")+'</select>':'<span class="pltag">'+H(x.platform||e.platforms[0]||"Link")+'</span>')+
    '<input data-pli="'+i+'" data-plf="url" value="'+H(x.url||"")+'" placeholder="https://…" inputmode="url"'+(ed?"":" readonly")+'>'+
    (ed?'<button class="rm" data-act="pldel" data-i="'+i+'" aria-label="Remove this link">×</button>':"")+'</div>').join("")
   :'<div class="plrow"><span class="pltag">'+H(e.platforms[0]||"Link")+'</span><input data-pli="0" data-plf="url" value="" placeholder="https://…" inputmode="url"'+(ed?"":" readonly")+'></div>')+
  (ed&&l.length?'<button class="btn sm" data-act="pladd">+ Add another link</button>':"")+'</div>';}

/* ---- actions ---- */
PAGE_ACTIONS.pppart=d=>{S.pp=d.p};
/* S4: the row becomes a Content entry as soon as it is typed, tagged Draft and
   linked to the release. No form, no decisions about platforms or accounts up
   front — the point of the calendar is to get the plan down quickly. Everything
   else about the post is filled in later by opening it. */
PAGE_ACTIONS.ppnew=d=>{const e=live(S.open);if(!e||!canEdit(e,S.user))return false;
 const title=String(S.ppDraft[d.ph]||"").trim();
 if(!title){toast("Type the post first");return false}
 if(S.busy)return false;
 const o={cat:"content",title:title,status:CONTENT_STATUS[0],type:CONTENT_TYPES[0],
  platforms:[],account:ACCOUNTS[0],phase:d.ph,date:d.d,time:"09:00",links:[],
  people:[e.by],organizer:[],draft:true};
 run(()=>createEntry(o,e.id)).then(ok=>{if(!ok)return;
  S.ppDraft[d.ph]="";
  toast(isAdmin(S.user)?"Added to the plan":"Added as a draft — Cartier St. will approve it");
  render();});
 return false};

PAGE_ACTIONS.ppapprove=d=>{const x=live(d.id);if(!x||!isAdmin(S.user))return false;
 run(()=>setDraft(x.id,false)).then(ok=>{if(!ok)return;
  notify(x,"approved **"+x.title+"** — it is on the Content list now",[x.by]);
  toast("Approved");render();});
 return false};
PAGE_ACTIONS.pladd=()=>{const e=live(S.open);if(!e||!canEdit(e,S.user))return false;
 const l=(e.links||[]).slice();l.push({platform:e.platforms[0]||"",url:""});e.links=l;return true};
PAGE_ACTIONS.pldel=d=>{const e=live(S.open);if(!e||!canEdit(e,S.user))return false;
 const l=(e.links||[]).slice();l.splice(+d.i,1);e.links=l;plWrite(e,l);return true};

/* ---- saving ---- */
/* S40: like Release Details — what was typed stays put, and the box says so */
function ppSave(e,key,val){e.pp[key]=val;
 pushSave("pp:"+key,()=>savePP(e.id,key,val,false));}
function ppPlatWrite(e,key,val){
 e.pp.plat=Object.assign({},e.pp.plat,{[key]:val});
 pushSave("ppp:"+key,()=>savePP(e.id,null,e.pp.plat,true));}
/* the first link pasted also moves the post to Posted (S19) */
function plWrite(e,links){const before=(e.links||[]).slice(),wasPosted=e.status==="Posted";
 e.links=links;
 const nowHas=hasLink(e);
 if(nowHas&&!wasPosted)e.status="Posted";
 if(!nowHas&&wasPosted)e.status="Ready to Post/Scheduled"; // the last link removed: it is no longer proven live
 render();
 runSoft(async()=>{await savePostLinks(e.id,links);
   if(nowHas&&!wasPosted){await setStatus(e,"Posted");notify(e,"posted **"+e.title+"**");toast("Marked as Posted")}
   else if(!nowHas&&wasPosted)await setStatus(e,"Ready to Post/Scheduled");},
  ()=>{e.links=before;e.status=wasPosted?"Posted":e.status});}