"use strict";
/* EVENTS
   Shared click, input and keyboard handling. */
/* ---- events ---- */
const PAGE_ACTIONS={}; // each page file registers its own click actions here

document.addEventListener("input",e=>{const t=e.target;
 if(t.dataset.trk!=null&&S.form){S.form.tracks[+t.dataset.trk]=t.value;return} // a track title row
  if(t.dataset.trk!=null&&S.form){S.form.tracks[+t.dataset.trk]=t.value;return} // a track title row
 if(t.dataset.f&&t.type!=="checkbox"&&t.tagName!=="SELECT")S.form[t.dataset.f]=t.value});
/* a Release Details box: saved when you leave it, so typing is never interrupted (D6.1.10) */
document.addEventListener("change",e=>{const t=e.target,D=t.dataset,k=D.rd,ck=D.rdck;
 if(!k&&!ck&&!D.pp&&!D.ppp&&!D.gd&&!D.ad&&D.pli==null)return;
 const x=live(S.open);if(!x||!canEdit(x,S.user))return;
 if(D.gd){gdWrite(x,D.gd,t.type==="number"?(t.value===""?"":+t.value):t.value);return} // S3
 if(D.ad){adWrite(x,D.ad,t.value);return}                                               // S26
 if(D.pp){ppSave(x,D.pp,t.value);return}                       // Marketing Blurb, Keywords, Artist Bio (D6.1.11)
 if(D.ppp){ppPlatWrite(x,D.ppp,t.value);return}                // one of the six platform parts
 if(D.pli!=null){const l=(x.links||[]).slice(),i=+D.pli;        // a post link (S19)
  l[i]=Object.assign({platform:x.platforms[0]||"",url:""},l[i],{[D.plf]:t.value});
  plWrite(x,l.filter((y,j)=>j<i||String(y.url||"").trim()||j<l.length-1));return}
 if(ck){rdWrite(x,ck,t.checked,null);return}
 const v=t.type==="number"?(t.value===""?"":+t.value):t.value;
 rdWrite(x,k,v,D.pos?+D.pos:null);},true);

document.addEventListener("change",e=>{const t=e.target,f=t.dataset.f,F=S.form;
 if(t.dataset.rd||t.dataset.rdck||t.dataset.pp||t.dataset.ppp||t.dataset.gd||t.dataset.ad||t.dataset.pli!=null)return; // handled above
 if(t.dataset.st){const x=live(S.open);if(!x)return;let st=x.status,sub=x.sub;if(t.dataset.st==="status"){st=t.value;if(x.cat==="songs")sub=SONG_STATUS[st][0]||st}else sub=t.value;
  run(()=>setStatus(x,st,sub)).then(ok=>{if(!ok)return;notify(x,"changed **"+x.title+"** to "+(x.cat==="songs"?sub:st));toast("Status updated · Home, My Day and Calendar refreshed")});return}
 if(!f)return;if(t.type==="checkbox"){const a=F[f]||(F[f]=[]),i=a.indexOf(t.value);t.checked?i<0&&a.push(t.value):i>-1&&a.splice(i,1);return}
 F[f]=t.value;if(f==="venue")F.address=VENUES.find(v=>v[0]===t.value)[1];if(f==="type"&&F.cat==="gigs")F.typeNote=GIG_TYPES.find(g=>g[1].includes(t.value))[0];
 if(f==="status"&&F.cat==="songs")F.sub=SONG_STATUS[t.value][0]||t.value;
 if(f==="type"&&F.cat==="activities")F.ctx=null; // S27: a different type asks a different question
 if(["type","status","venue"].includes(f))render()});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.dataset&&e.target.dataset.trk!=null){e.preventDefault();const a=$('[data-act="trkadd"]');a&&!a.disabled&&a.click();return} // Enter in a track = next track
 if(e.key==="Enter"&&(e.target.id==="em"||e.target.id==="pw"))$('[data-act="login"]').click();
 if(e.key==="Escape"){if(S.form)S.form=null;else if(S.pick||S.link)S.pick=S.link=false;else S.open=null;render()}});
document.addEventListener("click",ev=>{const el=ev.target.closest("[data-act]");if(!el)return;const d=el.dataset;let R=true;
 switch(d.act){
 case"login":{if(S.busy){R=false;break}const em=$("#em").value.trim().toLowerCase(),pw=$("#pw").value;S.em=em;
  if(!em||!pw){S.lgErr="Enter your email and password.";break}S.busy=true;S.lgErr="";
  db.auth.signInWithPassword({email:em,password:pw}).then(({error})=>{S.busy=false;if(error){S.lgErr=error.message==="Invalid login credentials"?"Incorrect email or password.":error.message;render()}});break} // success is handled by onAuth()
 case"google":db.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}}).then(({error})=>{if(error){S.lgErr=error.message;render()}});R=false;break;
 case"tab":S.tab=d.t;S.open=null;S.search=false;if(d.t==="home")S.hcat=null;if(d.t==="myday")S.dview=null;scrollTo(0,0);break;
 case"pdot":toast("Edited by admin, "+fmtM(d.w));R=false;break; // S34 — the date, never the name
 case"foldtog":S.fold[d.k]=!S.fold[d.k];break;
 case"open":S.open=d.id;break;case"close":S.open=null;break;
 case"add":S.pick=true;break;case"closepick":S.pick=false;S.link=null;break;
 case"newcat":S.pick=false;S.form=blank(d.c);break;case"newrel":S.form=blank(d.c,d.id);break;
 case"edit":{const e=live(d.id);if(!canEdit(e,S.user)){toast("Only "+mn(e.by)+" or an admin can change this");R=false;break}const f=JSON.parse(JSON.stringify(e));f.mode="edit";f.errs={};if(f.cat==="songs")f.tracks=(e.tracks||[]).slice();S.form=f;break}
 case"cancel":S.form=null;break;
 /* song form: track type switch and the track editor */
 case"songtype":{const F=S.form,R=TRACK_RULES[d.v];F.type=d.v;delete F.errs.tracks;F.tracks=F.tracks||[];if(R.min>1)while(F.tracks.length<R.min)F.tracks.push("");break}
 case"pastseg":{const F=S.form;F.past=d.v===PAST_OPTS[1];delete F.errs.release; // F5.2
  F.release=F.past?addD(TODAY,-30):addD(TODAY,90);F.final=F.past?"":addD(F.release,-MIN_LEAD);break}
 case"trkadd":{const F=S.form,mx=TRACK_RULES[F.type].max;if(!mx||F.tracks.length<mx){F.tracks.push("");setTimeout(()=>{const l=[...document.querySelectorAll("[data-trk]")].pop();l&&l.focus()})}break}
 case"trkdel":S.form.tracks.splice(+d.i,1);break;
 case"trkmv":{const a=S.form.tracks,i=+d.i,j=i+ +d.d;if(j>=0&&j<a.length)[a[i],a[j]]=[a[j],a[i]];break}
 case"save":save();R=false;break;
 case"del":if(!canEdit(live(d.id),S.user)){toast("Only the owner or an admin can delete this");R=false;break}if(confirm("Delete “"+live(d.id).title+"”? It moves to Trash for 30 days."))del(d.id);R=false;break;
 case"restore":restore(d.id);R=false;break;
 case"linkex":S.link=d.id;break;
 case"dolink":{const a=byId(d.a),b=byId(d.b);S.link=null;run(()=>linkEntries(d.a,d.b)).then(ok=>{if(!ok)return;notify(b,"linked **"+b.title+"** to **"+a.title+"**");toast("Linked to "+b.title)});R=false;break}
 case"unlink":if(confirm("Remove this relationship? Both entries stay exactly as they are."))run(()=>unlinkEntries(d.a,d.b)).then(ok=>ok&&toast("Relationship removed"));R=false;break;
 case"drive":toast("Google Drive isn’t connected yet, so folders can’t be created from here.");R=false;break;
 case"ext":toast("Opens Google Drive in the live build");R=false;break;
 default:if(PAGE_ACTIONS[d.act])R=PAGE_ACTIONS[d.act](d)!==false;}
 if(R)render()});