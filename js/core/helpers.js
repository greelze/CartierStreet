"use strict";
/* HELPERS
   Dates, permissions, sorting, icons, and the shared state object S. */
/* ---- helpers ---- */
const byId=i=>DB.entries.find(e=>e.id===i)||DB.trash.find(e=>e.id===i),live=i=>DB.entries.find(e=>e.id===i),inTrash=i=>DB.trash.some(e=>e.id===i);
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"],DOW=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const d2=s=>new Date(s+"T00:00:00"),iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const addD=(s,n)=>{const d=d2(s);d.setDate(d.getDate()+n);return iso(d)},days=(a,b)=>Math.round((d2(b)-d2(a))/864e5);
const fmtS=s=>MONTHS[d2(s).getMonth()].slice(0,3)+" "+d2(s).getDate(),fmtM=s=>s?d2(s).getDate()+" "+MONTHS[d2(s).getMonth()]+" "+d2(s).getFullYear():"";
const fmtL=s=>DOW[d2(s).getDay()]+", "+fmtM(s);
const ft=t=>{if(!t)return"";let p=t.split(":"),h=+p[0];return(h%12||12)+":"+p[1]+" "+(h>=12?"PM":"AM")};
/* ---- roles (D7.2.1-3) ----
   admin  = sees and edits everything
   artist = owns their own entries; sees the collective's social activities
   member = neither; follows releases, and joins activities and tasks they are on */
const isAdmin=u=>!!(M[u]&&M[u].adm),isArtist=u=>!!(M[u]&&M[u].art),isMember=u=>!!M[u]&&!M[u].adm&&!M[u].art;
const involved=(e,u)=>(e.people||[]).includes(u)||(e.organizer||[]).includes(u);
const SOCIAL_ACT=["Birthday","Party/Hangout","Trip/Vacation"]; // team life: open to the artists (S25)
/* who may open an entry (F3.2, S25, D7.2.3) */
const canSee=(e,u)=>isAdmin(u)||e.by===u
 ||(involved(e,u)&&!taskPending(e))  // a task waiting for an admin is hidden from the people on it (S31)
 ||(e.cat==="songs"&&isMember(u)) // members follow every release, view only
 ||(e.cat==="activities"&&SOCIAL_ACT.includes(e.type)&&isArtist(u));
/* only the person who made it, or an admin, may change it (F3.1, S11, S21, S25) */
const canEdit=(e,u)=>isAdmin(u)||(e.by===u&&!e.auto); // the system owns its own tasks (S30)
/* members cannot start releases, content or gigs (D7.2.3) */
const canCreate=(c,u)=>!isMember(u)||["activities","tasks"].includes(c);
const mn=k=>M[k]?M[k].n:"Former member"; // member name, safe if someone was removed
/* ---- the plum dot (S34) ----
   e.aed is {field: date} — which fields an admin changed on someone else's entry.
   The dot says only that an admin changed it, and when; never who. */
const aedAt=(e,k)=>{const a=e.aed;if(!a)return"";if(k==="dt")return a.date||a.time||"";return a[k]||""};
const aedAny=e=>{const a=e.aed;return a?Object.values(a).sort().pop()||"":""};
const pdot=w=>w?'<i class="pdot" data-act="pdot" data-w="'+w+'" title="Edited by admin, '+fmtM(w)+'"></i>':"";
const visible=u=>DB.entries.filter(e=>canSee(e,u));
function occs(e){if(e.cat==="songs")return[{date:e.final,label:"Final submission"},{date:e.release,label:"Release"}].filter(o=>o.date);
 if(e.cat==="tasks")return e.due?[{date:e.due,time:e.dueTime||"",label:"Due"}]:[];return e.date?[{date:e.date,time:e.time}]:[];}
const nextOcc=e=>{const o=occs(e);return o.find(x=>x.date>=TODAY)||o[o.length-1]||{date:"2099-01-01"}};
const sline=e=>e.cat==="songs"&&e.sub&&e.sub!==e.status?e.status+" › "+e.sub:e.status; // no "Released › Released"
const nm=(ks,me)=>ks.map(p=>p===me?"You":mn(p));
function mline(e){if(e.cat==="songs")return e.people.map(mn).join(" · ")+(e.tracks&&e.tracks.length?" · "+e.tracks.length+" tracks":"");
 if(e.cat==="content")return e.platforms.join(" · ");
 if(e.cat==="tasks")return (e.auto?"Automatic · ":"")+nm(e.people,S.user).join(" · ")+" · "+e.priority+(e.people.length>1&&(e.done||[]).length?" · "+e.done.length+" of "+e.people.length+" done":"");
 if(e.cat==="activities")return nm(e.people,S.user).slice(0,3).join(" · ")+(e.people.length>3?" +"+(e.people.length-3):"");return e.venue+" · "+e.orgKind;}
const isFin=e=>e.cat==="songs"?e.status==="Released"&&(e.sub==="Released"||e.sub==="Release") // "Release" is the old name of the last sub-step
 :e.cat==="content"?e.status==="Posted"||e.status==="Cancelled" // S17
 :e.cat==="tasks"?["Completed","Lapsed","Cancelled"].includes(e.status) // S28
 :e.status==="Completed"||e.status==="Cancelled";
/* within a day, timed things come first and untimed ones after (S35) */
const byTime=o=>o.time||"99:99"; // an hour that cannot happen, so untimed sorts last whatever the collation
const sortByOcc=a=>a.slice().sort((x,y)=>{const p=nextOcc(x),q=nextOcc(y);return p.date===q.date?byTime(p).localeCompare(byTime(q)):p.date.localeCompare(q.date)});
const relEntries=(id,u)=>DB.rels.filter(r=>r.a===id||r.b===id).map(r=>byId(r.a===id?r.b:r.a)).filter(e=>e&&canSee(e,u));
const entriesOn=(d,u)=>{const o=[];visible(u).forEach(e=>occs(e).forEach(x=>{if(x.date===d)o.push({e,o:x})}));return o.sort((a,b)=>(a.o.time||"").localeCompare(b.o.time||""))};
const needsAttn=u=>visible(u).filter(e=>{if(!involved(e,u)||isFin(e))return false;const d=days(TODAY,nextOcc(e).date);return d>0&&d<=28&&["Planning/Organizing","For Submission","In Production","Inquiry","Not Started","Blocked","In Progress"].includes(e.status)});
const unread=()=>DB.notifs.filter(n=>n.unread&&byId(n.ref)).length;
/* e is optional: a gig only offers Awaiting Payment when it is a booked, paid one (S12) */
/* a post carries at least one link once it is up (S19); the first one proves it is live */
const postLinks=e=>(e.links||[]).filter(l=>l&&String(l.url||"").trim());
const hasLink=e=>postLinks(e).length>0;
/* S20: a post whose time has passed with no link yet. It clears when a link is pasted,
   or when the post moves to a new date, to Limbo or to Cancelled. */
const isOverdue=e=>e.cat==="content"?["Planning","Ready to Post/Scheduled"].includes(e.status)&&!hasLink(e)
   &&(e.date<TODAY||(e.date===TODAY&&(e.time||"23:59")<hhnow()))
 :e.cat==="tasks"?!isFin(e)&&!!e.due&&(e.due<TODAY||(e.due===TODAY&&!!e.dueTime&&e.dueTime<hhnow())) // S35
 :false;
const hhnow=()=>{const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
/* ---- the Cartier St. review (W2, W4, F2, F3.3, RQ9) ----
   A release is approved when an admin has approved it since the last time it was returned. */
const ap=e=>e.ap||{};
const isApproved=e=>{const a=ap(e);return !!a.apAt&&(!a.retAt||a.apAt>a.retAt)};
const isReturned=e=>{const a=ap(e);return !!a.retAt&&(!a.apAt||a.retAt>a.apAt)};
const isPast=e=>!!ap(e).past; // a release that was already out when it was added (F5.2)
/* W2: Submitted to Cartier St. stays shut until every required box in both blocks is filled */
const subLeft=e=>rdLeft(e)+ppLeft(e);
const canSubmit=e=>subLeft(e)===0;
/* RQ9: day 24 to submit to Cartier St., day 21 to submit to ONErpm. Shown to admins. */
const isLate=e=>e.cat==="songs"&&!isPast(e)&&!!e.release&&!isFin(e)&&(
  (!ap(e).subAt&&days(TODAY,e.release)<24)||(isApproved(e)&&!ap(e).oneAt&&days(TODAY,e.release)<21));
/* F3.3: what is frozen once Cartier St. has approved. An admin can always correct. */
function rdLock(e,key){if(isAdmin(S.user)||isPast(e)||!isApproved(e))return false;
 if(RD_LINKS.some(l=>l[0]===key))return false;        // links stay editable at all times (RQ4, W2)
 if(key==="isrc"||key==="upc")return e.status==="Released"; // editable until the release is out
 if(key==="distributor"||key==="notes")return false;  // not part of the approved record
 return true;}                                        // the release part and every track box
/* the blurb, keywords and bio close once the release is on its way out (F3.3) */
const ppLock=e=>!isAdmin(S.user)&&!isPast(e)&&["Submitted/Pitching","Released"].includes(e.status);
/* the sub-steps on offer: the Cartier St. step opens only when the checklist is done (W2) */
const subOptions=(e,st)=>(SONG_STATUS[st]||[]).filter(x=>x!=="Submitted to Cartier St."||isPast(e)||canSubmit(e)||e.sub===x);
const statusOptions=(c,e)=>c==="songs"?Object.keys(SONG_STATUS).filter(s=>s!=="Submitted/Pitching"||!e||isPast(e)||isApproved(e)||e.status===s) // F2.1, W4
 :c==="content"?CONTENT_STATUS.filter(s=>s!=="Posted"||!e||hasLink(e)) // Posted stays blocked until a link is pasted (S19)
 :c==="tasks"?TASK_STATUS.filter(s=>s!=="Cancelled"||!e||!e.auto) // an automatic task cannot be cancelled (S30)
 :c==="gigs"?GIG_STATUS.filter(s=>(s!=="Awaiting Payment"||(e&&e.orgKind==="Booked (Paid Performance)"))
   &&(s!=="Confirmed"||!e||gdReady(e)||e.status==="Confirmed")):EVT_STATUS; // S12, S3
/* S13: a release party belongs to its release; other gig types still cannot link to one */
const relOk=e=>e.cat==="gigs"&&e.type!=="Release/Listening Party"?REL_OK.gigs.filter(c=>c!=="songs"):REL_OK[e.cat];
const isCancelled=e=>e.status==="Cancelled"; // hidden from Home and My Day, struck through on the Calendar (S16, S23)
const hay=e=>[e.title,e.eid,e.venue,e.orgName,e.type,e.status,e.sub,e.desc,e.people.map(mn).join(" "),(e.platforms||[]).join(" "),(e.tracks||[]).join(" ")].filter(Boolean).join(" ").toLowerCase();
const ctag=c=>'<span class="tag" style="background:'+CAT[c].t+';color:'+CAT[c].c+'">'+CAT[c].tag+'</span>';
const av=(k,s)=>!M[k]?'':'<span class="av" style="width:'+s+'px;height:'+s+'px;font-size:'+s*.38+'px;background-color:'+M[k].c+(M[k].photo?';background-image:url('+M[k].photo+')':'')+'">'+(M[k].photo?'':k)+'</span>';
const sv=p=>'<svg viewBox="0 0 24 24">'+p+'</svg>';
const I={copy:'<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5.5 15H5A1.5 1.5 0 0 1 3.5 13.5V5A1.5 1.5 0 0 1 5 3.5h8.5A1.5 1.5 0 0 1 15 5v.5"/>',task:'<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',song:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',post:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9.2 4.8 2.8-4.8 2.8z"/>',ppl:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c2.4-.2 4.1 1.4 4.5 4.3"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',find:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',nxt:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m10.5 13 3 2.5-3 2.5"/>',arr:'<path d="M5 12h14M13 6l6 6-6 6"/>',home:'<path d="M3 10.4 12 3.2l9 7.2"/><path d="M5.6 9.6V19.4a1.4 1.4 0 0 0 1.4 1.4h10a1.4 1.4 0 0 0 1.4-1.4V9.6"/>',bell:'<path d="M18 8.6a6 6 0 1 0-12 0c0 6.6-2.6 8.4-2.6 8.4h17.2S18 15.2 18 8.6"/><path d="M13.7 20.6a2 2 0 0 1-3.4 0"/>',
 sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2M12 19.6v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.4 12h2M19.6 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/>',cal:'<rect x="3.2" y="5" width="17.6" height="16" rx="3"/><path d="M3.2 10h17.6M8 3v4M16 3v4"/>',sl:'<path d="M3 6h18M6 12h12M10 18h4"/>'};
const TABS=[["home","Home",I.home],["notifs","Notifications",I.bell],["myday","My Day",I.sun],["cal","Calendar",I.cal],["settings","Settings",I.sl]];
let S={user:null,in:false,loading:true,busy:false,noMember:null,tab:"home",q:"",cats:[],st:"",pp:"",open:null,form:null,link:null,pick:false,toast:null,sel:TODAY,calCats:[],lgErr:"",em:"",hcat:null,cq:"",cst:"",cpp:"",cplat:"",ctype:"",fold:{},allTasks:false,dview:null,search:false,sflt:false,cflt:false};
const $=s=>document.querySelector(s),sh=(l,c)=>'<div class="sh"><span>'+l+'</span>'+(c!=null?'<span>'+c+'</span>':'')+'</div>';
const empty=(h,p,btn)=>'<div class="empty"><h3>'+h+'</h3><p class="mut">'+p+'</p>'+(btn?'<div class="eact">'+btn+'</div>':"")+'</div>'; // btn: optional button, see P4
