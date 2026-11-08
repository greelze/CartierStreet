"use strict";
/* RELEASE DETAILS BLOCK  (D6.1.10, RQ1, RQ2, RQ4, P2, F1.8, F1.9)
   plus the locks and change requests that come with approval (F3.3, F3.5)
   The four-part checklist on a release page: Release, Tracks, Links, Notes.
   One part is open at a time, with a sticky count of the boxes still to fill.
   Required boxes show red until filled; ISRC, UPC and the ONErpm link are never required.
   Only the owner or an admin can type in it (F3.1) — everyone else reads it.
   Once Cartier St. has approved, the release part and the tracks are read-only and
   changes go through a request the admin approves (F3.5).
   HTML: built by vRD() below. CSS: css/pages/details.css */

Object.assign(S,{rd:"release",rdTip:null,rdEdit:null,rdSave:{}}); // open part, showing tip, the box being re-typed, and what each box is doing (S40)

/* ---- the three things every box in this app now carries (S37, P3, S40) ----
   They live here because Release Details, the Promotional Plan, Gig Details
   and Activity Details all draw their boxes through one of two renderers. */

/* which box a save belongs to, read back out of the attributes it was given */
function saveTag(attr){const k=/data-(rd|pp|ppp|gd|ad|rc|pf)="([^"]+)"/.exec(attr||""),p=/data-pos="(\d+)"/.exec(attr||"");
 return k?k[1]+":"+k[2]+(p?":"+p[1]:""):"";}

/* S37: the gray example, scoped so "notes" can mean two different things */
function egOf(k,attr){const kind=(/data-(rd|pp|ppp|gd|ad|rc|pf)=/.exec(attr||"")||[,""])[1];
 const t=EG[kind+":"+k]||EG[k];return t?' placeholder="'+H(t)+'"':"";}

/* P3: one line beside a red box saying what to do about it */
function todoLine(f){if(TODO[f[0]])return '<p class="rdtodo">'+H(TODO[f[0]])+'</p>';
 /* an abbreviation keeps its capitals (BPM, ISRC, UPC); an ordinary label does not */
 const l=f[1],name=(l===l.toUpperCase()&&/[A-Z]/.test(l))?l:l.toLowerCase();
 return '<p class="rdtodo">Add the '+H(name)+' to continue.</p>';}

/* S40: what this box is doing right now. The text is never taken off the
   screen, whatever the answer is — nobody should have to retype an answer. */
const SAVE_WORD={saving:"Saving…",ok:"Saved",err:"Not saved, trying again",
 fail:"Still not saved — check your connection",theirs:"Just changed by someone else"};
const SAVE_CLS={saving:"wait",ok:"ok",err:"bad",fail:"bad",theirs:"warn"};
function savedMark(tag){const s=tag&&S.rdSave[tag];
 return s?'<i class="sv '+SAVE_CLS[s]+'">'+SAVE_WORD[s]+'</i>':"";}

/* S40: three tries before it gives up, and the typed value stays put either way */
const SAVE_T={};
async function pushSave(tag,fn){S.rdSave[tag]="saving";render();
 for(let i=0;i<3;i++){
  try{await fn();S.rdSave[tag]="ok";render();
   clearTimeout(SAVE_T[tag]);SAVE_T[tag]=setTimeout(()=>{delete S.rdSave[tag];render()},2500);return true}
  catch(err){console.warn("Save failed:",err&&err.message||err);
   S.rdSave[tag]=i<2?"err":"fail";render();
   if(i<2)await new Promise(r=>setTimeout(r,500*(i+1)));}}
 return false;}

/* S40: an admin and the owner in the same box. The last write wins, which the
   database already decides — this only makes sure the page says it happened
   instead of silently swapping the words under someone's eyes. */
const RD_SEEN={id:null,v:{}};
function rdWatch(e){const now={};
 RD_REL.concat(RD_LINKS,[["notes"]]).forEach(f=>now["rd:"+f[0]]=rdVal(e,f[0]));
 (e.trk||[]).forEach(t=>RD_TRACK.forEach(f=>now["rd:"+f[0]+":"+t.pos]=t[f[0]]));
 PP_TEXT.forEach(f=>now["pp:"+f[0]]=ppVal(e,f[0]));
 PP_PLATFORMS.forEach(p=>now["ppp:"+p[0]]=ppPlat(e,p[0]));
 if(RD_SEEN.id===e.id)Object.keys(now).forEach(k=>{
  const a=RD_SEEN.v[k],b=now[k];
  if(String(a==null?"":a)!==String(b==null?"":b)&&!S.rdSave[k]){
   S.rdSave[k]="theirs";clearTimeout(SAVE_T[k]);
   SAVE_T[k]=setTimeout(()=>{delete S.rdSave[k];render()},6000);}});
 RD_SEEN.id=e.id;RD_SEEN.v=now;}

/* S40: the automatic "submit the release" task says how much is actually left */
const autoLeft=e=>{if(e.cat!=="tasks"||e.autoKind!=="submit_cs"||!e.src)return 0;
 const r=live(e.src);return r&&!isPast(r)?subLeft(r):0;};

/* ---- what is still missing (also drives the submit lock, W2) ---- */
const rdVal=(e,k)=>(e.rd||{})[k];
const filled=v=>v!==null&&v!==undefined&&String(v).trim()!=="";
function rdMissing(e){const out=[];
 RD_REL.forEach(f=>{if(f[3]&&!filled(rdVal(e,f[0])))out.push(["release",f[1]])});
 (e.trk||[]).forEach((t,i)=>RD_TRACK.forEach(f=>{
  if(f[3]&&!filled(f[0]==="explicit"?(t.explicit===null?"":t.explicit):t[f[0]]))out.push(["tracks","Track "+(i+1)+" · "+f[1]])}));
 if(!(e.trk||[]).length)out.push(["tracks","At least one track"]);
 RD_LINKS.forEach(f=>{if(f[3]&&!filled(rdVal(e,f[0])))out.push(["links",f[1]])});
 RD_CONFIRM.forEach(c=>{if(!rdVal(e,c[0]))out.push([c[2],c[1]])});
 return out;}
const rdLeft=e=>rdMissing(e).length;
const rdPartLeft=(e,p)=>rdMissing(e).filter(m=>m[0]===p).length;

/* ---- change requests (F3.5) ---- */
const rdReqs=e=>(e.req||[]);
const rdReqOf=(e,k,pos)=>rdReqs(e).find(r=>r.k===k&&(r.pos||null)===(pos||null));
const reqKey=(k,pos)=>k+(pos?":"+pos:"");

/* ---- one box ---- */
const tipBtn=k=>TIP[k]?'<button class="tip" data-act="rdtip" data-k="'+k+'" aria-label="What is this?">?</button>':"";
function rdBox(f,v,attr,ed){const k=f[0],need=f[3],bad=need&&!filled(f[2]==="yn"?(v===null||v===undefined?"":v):v);
 const tag=saveTag(attr),eg=egOf(k,attr);
 const lab='<b>'+f[1]+(need?'<i class="rq">*</i>':"")+tipBtn(k)+savedMark(tag)+'</b>';
 let h;
 if(!ed)h='<p class="rdro">'+(filled(v)?(f[2]==="yn"?(v?"Yes":"No"):H(String(v))):"<em>Empty</em>")+'</p>';
 else if(f[2]==="a")h='<textarea rows="'+(k==="lyrics"||k==="credits"?6:3)+'" '+attr+eg+'>'+H(v==null?"":String(v))+'</textarea>';
 else if(f[2]==="yn")h='<div class="yn" role="radiogroup" aria-label="'+f[1]+'">'+[["Yes",true],["No",false]].map(o=>
   '<button type="button" role="radio" aria-checked="'+(v===o[1])+'" class="'+(v===o[1]?"on":"")+'" data-act="rdyn" '+attr.replace("data-rd","data-set")+' data-v="'+o[0]+'">'+o[0]+'</button>').join("")+'</div>';
 else h='<input type="'+(f[2]==="n"?"number":"text")+'" '+attr+eg+' value="'+H(v==null?"":String(v))+'"'+(RD_LINKS.some(l=>l[0]===k)?' inputmode="url"':"")+'>';
 return '<div class="rdf'+(f[2]==="a"?" wide":"")+(bad?" bad":"")+'">'+lab+h+(bad&&ed?todoLine(f):"")+'</div>';}

/* a box on an approved release: read-only, with a way to ask for a change (F3.3, F3.5) */
function rdCell(e,f,v,attr,ed,pos){const k=f[0];
 if(!ed||!rdLock(e,k))return rdBox(f,v,attr,ed);
 const req=rdReqOf(e,k,pos),open=S.rdEdit===reqKey(k,pos);
 const show=v=>filled(v)?(f[2]==="yn"?(v?"Yes":"No"):H(String(v))):"<em>Empty</em>";
 return '<div class="rdf locked'+(f[2]==="a"?" wide":"")+'"><b>'+f[1]+tipBtn(k)+'<i class="lkd" title="Locked by Cartier St.’s approval">🔒</i></b>'+
  '<p class="rdro">'+show(v)+'</p>'+
  (req?'<p class="rdreq">Change requested: <b>'+show(req.to)+'</b> · waiting for Cartier St. <button class="lnk" data-act="rdunreq" data-k="'+k+'"'+(pos?' data-pos="'+pos+'"':"")+'>Withdraw</button></p>'
   :open?'<div class="rdedit">'+(f[2]==="a"?'<textarea rows="3" id="rdq">'+H(v==null?"":String(v))+'</textarea>':'<input id="rdq" value="'+H(v==null?"":String(v))+'">')+
     '<button class="btn sm pri" data-act="rdsendreq" data-k="'+k+'"'+(pos?' data-pos="'+pos+'"':"")+'>Request</button><button class="btn sm" data-act="rdcancelreq">Cancel</button></div>'
   :'<button class="lnk" data-act="rdaskreq" data-k="'+k+'"'+(pos?' data-pos="'+pos+'"':"")+'>Request a change</button>')+
  '</div>';}

/* ---- the four parts ---- */
function rdRelease(e,ed){
 const ro=(l,v)=>'<div class="rdf done"><b>'+l+'</b><p class="rdro">'+(filled(v)?H(String(v)):"<em>Empty</em>")+'</p></div>';
 return '<p class="rdnote">These four come from the release itself — edit them with the Edit button above.</p><div class="rdg">'+
  ro("Release title",e.title)+ro("Type",e.type)+ro("Primary artist",(e.people||[]).map(mn).join(", "))+ro("Release date",fmtM(e.release))+
  RD_REL.map(f=>rdCell(e,f,rdVal(e,f[0]),'data-rd="'+f[0]+'"',ed)).join("")+'</div>';}

function rdTracks(e,ed){const tr=e.trk||[];
 if(!tr.length)return '<p class="rdnote">No tracks yet. Add them with the Edit button above — a single gets one automatically.</p>';
 return tr.map((t,i)=>'<div class="trow"><h5><span class="rdnum">'+(i+1)+'</span>'+H(t.title||"Track "+(i+1))+'</h5><div class="rdg">'+
   RD_TRACK.map(f=>rdCell(e,f,f[0]==="explicit"?t.explicit:t[f[0]],'data-rd="'+f[0]+'" data-pos="'+t.pos+'"',ed,t.pos)).join("")+'</div></div>').join("")+
  rdConfirm(e,"tracks",ed);}

function rdLinks(e,ed){
 return '<p class="rdnote">Files stay in Google Drive — Plum Room keeps the links. '+tipBtn("files")+'</p><div class="rdg">'+
  RD_LINKS.map(f=>rdBox(f,rdVal(e,f[0]),'data-rd="'+f[0]+'"',ed)).join("")+'</div>'+rdConfirm(e,"links",ed);}

function rdNotes(e,ed){
 return '<div class="rdg">'+rdBox(["notes","Notes","a",0],rdVal(e,"notes"),'data-rd="notes"',ed)+'</div>';}

/* the one tick-box per step the admin checks against Drive during review (RQ2) */
function rdConfirm(e,part,ed){const l=RD_CONFIRM.filter(c=>c[2]===part);if(!l.length)return"";
 return l.map(c=>{const on=!!rdVal(e,c[0]);
  return '<label class="rdck'+(on?" on":" bad")+'"><input type="checkbox"'+(on?" checked":"")+(ed?'':" disabled")+' data-rdck="'+c[0]+'"><span><b>'+c[1]+'</b><i>'+c[3]+'</i>'+
   (!on&&ed?'<i class="rdtodo">'+H(TODO[c[0]]||"Tick this to continue.")+'</i>':"")+'</span></label>'}).join("");}

const RD_BODY={release:rdRelease,tracks:rdTracks,links:rdLinks,notes:rdNotes};

/* ---- the block ---- */
function vRD(e){if(e.cat!=="songs"||isPast(e))return""; // a past release skips the checklist (F5.2)
 const ed=canEdit(e,S.user),left=rdLeft(e),open=S.rd||"release";
 rdWatch(e); // S40: notice anything an admin changed while this page was open
 return '<div class="drd"><div class="rdh"><h4>Release Details</h4>'+
  (ed&&subLeft(e)?'<button class="lnk rdgo" data-act="rdjump">Go to first empty</button>':"")+ // F1.9
  '<span class="rdbar'+(left?"":" ok")+'">'+(left?left+" box"+(left===1?"":"es")+" left":"All boxes filled")+'</span></div>'+
  (ed?"":'<p class="rdnote ro">View only — only '+H(mn(e.by))+' or an admin can fill this in.</p>')+
  vReqPanel(e)+
  '<div class="rdp">'+RD_PARTS.map(p=>{const n=rdPartLeft(e,p[0]),on=p[0]===open;
   return '<button class="rdt'+(on?" on":"")+(n?" bad":"")+'" data-act="rdpart" data-p="'+p[0]+'" aria-expanded="'+on+'"><span>'+p[1]+'</span>'+(n?'<em>'+n+'</em>':'<i class="ok">✓</i>')+'</button>'+
    (on?'<div class="rdbody">'+RD_BODY[p[0]](e,ed)+'</div>':"")}).join("")+'</div></div>';}

/* the admin sees only the edited parts beside the old ones (F3.5) */
function vReqPanel(e){const r=rdReqs(e);if(!r.length)return"";
 const nameOf=k=>{const f=RD_TRACK.find(x=>x[0]===k)||RD_REL.find(x=>x[0]===k)||[k,k];return f[1]};
 const adm=isAdmin(S.user);
 return '<div class="rqp"><h5>'+(adm?"Change requests · "+r.length:"Your change requests · "+r.length)+'</h5>'+
  r.map(x=>'<div class="rqrow"><span class="b"><b>'+H(nameOf(x.k))+(x.pos?" · track "+x.pos:"")+'</b>'+
   '<span class="was">'+(filled(x.from)?H(String(x.from)):"<em>Empty</em>")+'</span><span class="arr">→</span><span class="now">'+H(String(x.to))+'</span></span>'+
   (adm?'<span class="rqa"><button class="btn sm pri" data-act="rqok" data-k="'+x.k+'"'+(x.pos?' data-pos="'+x.pos+'"':"")+'>Approve</button>'+
     '<button class="btn sm" data-act="rqno" data-k="'+x.k+'"'+(x.pos?' data-pos="'+x.pos+'"':"")+'>Decline</button></span>'
    :'<span class="mut" style="font-size:12.5px">waiting</span>')+'</div>').join("")+'</div>';}

/* ---- actions ---- */
PAGE_ACTIONS.rdpart=d=>{S.rd=d.p;S.rdTip=null;S.rdEdit=null};
PAGE_ACTIONS.rdtip=d=>{S.rdTip=S.rdTip===d.k?null:d.k;toast(TIP[d.k]);return false};
PAGE_ACTIONS.rdyn=d=>{const e=live(S.open);if(!e||!canEdit(e,S.user))return false;
 rdWrite(e,d.set,d.v==="Yes",d.pos?+d.pos:null);return false};
/* F1.9, S40: open the part holding the first empty box, then put the cursor in
   it. Opening the part is not enough on a long form — the box has to come to
   the person. The timeout lets the rebuild finish first. */
PAGE_ACTIONS.rdjump=()=>{const e=live(S.open)||{},m=rdMissing(e);
 if(m.length)S.rd=m[0][0];else if(ppLeft(e)){S.pp=ppMissing(e)[0][0];}
 setTimeout(()=>{const n=document.querySelector(".rdf.bad, .rdck.bad, .ppph.bad");if(!n)return;
  if(n.scrollIntoView)n.scrollIntoView({block:"center"}); // not every engine has it
  const f=n.querySelector("input:not([disabled]),textarea,button");f&&f.focus();},30);};

/* change requests (F3.5) */
PAGE_ACTIONS.rdaskreq=d=>{S.rdEdit=reqKey(d.k,d.pos?+d.pos:null);
 setTimeout(()=>{const i=document.getElementById("rdq");i&&i.focus()});};
PAGE_ACTIONS.rdcancelreq=()=>{S.rdEdit=null};
PAGE_ACTIONS.rdsendreq=d=>{const e=live(S.open),i=document.getElementById("rdq");if(!e||!i)return false;
 const pos=d.pos?+d.pos:null,from=pos?(e.trk.find(t=>t.pos===pos)||{})[d.k]:rdVal(e,d.k);
 if(String(i.value)===String(from==null?"":from)){S.rdEdit=null;toast("That is already what it says");return true}
 const r=rdReqs(e).filter(x=>!(x.k===d.k&&(x.pos||null)===pos));
 r.push({k:d.k,pos,from:from==null?"":from,to:i.value,by:S.user,at:iso(new Date())});
 S.rdEdit=null;reqWrite(e,r);notify(e,"asked to change **"+e.title+"**",MK.filter(k=>M[k].adm));
 toast("Sent to Cartier St.");return true};
PAGE_ACTIONS.rdunreq=d=>{const e=live(S.open);if(!e)return false;const pos=d.pos?+d.pos:null;
 reqWrite(e,rdReqs(e).filter(x=>!(x.k===d.k&&(x.pos||null)===pos)));return true};
PAGE_ACTIONS.rqok=d=>{const e=live(S.open);if(!e||!isAdmin(S.user))return false;const pos=d.pos?+d.pos:null;
 const x=rdReqOf(e,d.k,pos);if(!x)return false;
 rdWrite(e,d.k,x.to,pos);reqWrite(e,rdReqs(e).filter(y=>y!==x));
 notify(e,"approved your change to **"+e.title+"**",[e.by]);toast("Change applied");return true};
PAGE_ACTIONS.rqno=d=>{const e=live(S.open);if(!e||!isAdmin(S.user))return false;const pos=d.pos?+d.pos:null;
 reqWrite(e,rdReqs(e).filter(y=>!(y.k===d.k&&(y.pos||null)===pos)));
 notify(e,"declined your change to **"+e.title+"**",[e.by]);toast("Change declined");return true};

/* ---- saving ----
   The box already shows what was typed, so the write goes out quietly and
   only speaks up if it fails (and then puts the old value back). */
/* S40: the typed value stays on screen whatever happens to the save. The old
   behaviour put the previous value back on failure, which meant retyping. */
function rdWrite(e,key,val,pos){
 if(pos==null)e.rd[key]=val;else{const t=e.trk.find(x=>x.pos===pos);if(t)t[key]=val}
 pushSave("rd:"+key+(pos?":"+pos:""),()=>saveRD(e.id,key,val,pos));}

function reqWrite(e,list){const before=rdReqs(e);e.req=list;render();
 runSoft(()=>saveReqs(e.id,list),()=>{e.req=before});}