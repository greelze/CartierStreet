"use strict";
/* PROMOTIONAL PLAN BLOCK  (D6.1.11, W8, S4)  +  POST LINKS  (S19)
   The Promotional Plan sits under Release Details on a release page: the three
   written parts, the six platform parts, and a calendar whose rows are real
   Content entries linked to the release — not a filed document.
   The timeline is worked out from the release date; none of it is stored.
   HTML: built by vPP() and vPostLinks() below. CSS: css/pages/details.css */

Object.assign(S,{pp:"write",ppPhase:"",ppDate:""}); // which part is open, and what a new post inherits

/* ---- the plan's own boxes ---- */
const ppVal=(e,k)=>(e.pp||{})[k];
const ppPlat=(e,k)=>((e.pp||{}).plat||{})[k]||"";
/* every Content entry linked to this release, by phase (W8) */
const ppPosts=(e,phase)=>relEntries(e.id,S.user).filter(x=>x.cat==="content"&&(!phase||x.phase===phase));

function ppMissing(e){const out=[];
 PP_TEXT.forEach(f=>{if(f[3]&&!filled(ppVal(e,f[0])))out.push(["write",f[1]])});
 PHASE_NEED.forEach(p=>{if(!ppPosts(e,p).length)out.push(["cal","A post in "+p])});
 return out;}
const ppLeft=e=>ppMissing(e).length;
const ppPartLeft=(e,p)=>ppMissing(e).filter(m=>m[0]===p).length;

/* ---- the three written parts, shared with Release Details where the doc says so ---- */
function ppTextPart(e,ed){
 return '<p class="rdnote">Song bios and the links live in Release Details above — these three are the plan’s own.</p><div class="rdg">'+
  PP_TEXT.map(f=>rdBox(f,ppVal(e,f[0]),'data-pp="'+f[0]+'"',ed&&!ppLock(e))).join("")+'</div>';}

/* ---- the six platform parts; the ones that do not apply are simply left empty ---- */
function ppPlatforms(e,ed){
 return '<p class="rdnote">Fill in only the platforms this release is actually going to use.</p><div class="rdg">'+
  PP_PLATFORMS.map(p=>rdBox([p[0],p[1],"a",0],ppPlat(e,p[0]),'data-ppp="'+p[0]+'"',ed)).join("")+'</div>';}

/* ---- the promotional calendar: every row is a real Content entry (W8, S4) ---- */
function ppCalendar(e,ed){const win=PHASE_WIN(e.release);
 if(!e.release)return '<p class="rdnote">Set a release date first — the timeline is worked out from it.</p>';
 return PHASES.map(ph=>{const w=win[ph],posts=sortByOcc(ppPosts(e,ph)),need=PHASE_NEED.includes(ph),short=need&&!posts.length;
  const when=w[1]?(w[0]===w[1]?fmtM(w[0]):fmtS(w[0])+" – "+fmtS(w[1])):"from "+fmtS(w[0]);
  return '<div class="ppph'+(short?" bad":"")+'"><div class="ppphh"><b>'+ph+(need?'<i class="rq">*</i>':"")+'</b><span>'+when+'</span></div>'+
   (posts.length?posts.map(x=>'<button class="pprow" data-act="open" data-id="'+x.id+'">'+ctag("content")+
     '<span class="b"><b>'+H(x.title)+'</b><span>'+H(fmtS(x.date)+" · "+ft(x.time)+" · "+(x.platforms||[]).join(", "))+'</span></span>'+
     '<span class="s" style="color:'+tone(x.status)[0]+'">'+H(x.status)+'</span></button>').join("")
    :'<p class="ppempty">'+(need?"No post planned yet.":"Nothing planned — that is fine.")+'</p>')+
   (ed?'<button class="btn sm" data-act="ppadd" data-ph="'+ph+'" data-d="'+w[0]+'">+ Add post</button>':"")+'</div>'}).join("");}

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
/* a calendar row opens the ordinary new-post form, already linked to the release (W8, S4) */
PAGE_ACTIONS.ppadd=d=>{const e=live(S.open);if(!e||!canEdit(e,S.user))return false;
 S.ppPhase=d.ph;S.ppDate=d.d;S.form=blank("content",e.id);S.ppPhase="";S.ppDate="";
 S.form.title=e.title+" — "+d.ph;return true};
PAGE_ACTIONS.pladd=()=>{const e=live(S.open);if(!e||!canEdit(e,S.user))return false;
 const l=(e.links||[]).slice();l.push({platform:e.platforms[0]||"",url:""});e.links=l;return true};
PAGE_ACTIONS.pldel=d=>{const e=live(S.open);if(!e||!canEdit(e,S.user))return false;
 const l=(e.links||[]).slice();l.splice(+d.i,1);e.links=l;plWrite(e,l);return true};

/* ---- saving ---- */
function ppSave(e,key,val){const before=ppVal(e,key);e.pp[key]=val;render();
 runSoft(()=>savePP(e.id,key,val,false),()=>{e.pp[key]=before});}
function ppPlatWrite(e,key,val){const before=Object.assign({},e.pp.plat);
 e.pp.plat=Object.assign({},e.pp.plat,{[key]:val});render();
 runSoft(()=>savePP(e.id,null,e.pp.plat,true),()=>{e.pp.plat=before});}
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
