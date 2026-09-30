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
const isAdmin=u=>!!(M[u]&&M[u].adm),involved=(e,u)=>(e.people||[]).includes(u)||(e.organizer||[]).includes(u),canSee=(e,u)=>isAdmin(u)||involved(e,u)||e.by===u,canEdit=canSee;
const mn=k=>M[k]?M[k].n:"Former member"; // member name, safe if someone was removed
const visible=u=>DB.entries.filter(e=>canSee(e,u));
function occs(e){if(e.cat==="songs")return[{date:e.final,label:"Final submission"},{date:e.release,label:"Release"}].filter(o=>o.date);
 if(e.cat==="tasks")return e.due?[{date:e.due,label:"Due"}]:[];return e.date?[{date:e.date,time:e.time}]:[];}
const nextOcc=e=>{const o=occs(e);return o.find(x=>x.date>=TODAY)||o[o.length-1]||{date:"2099-01-01"}};
const sline=e=>e.cat==="songs"?e.status+" › "+e.sub:e.status;
const nm=(ks,me)=>ks.map(p=>p===me?"You":mn(p));
function mline(e){if(e.cat==="songs")return e.people.map(mn).join(" · ")+(e.tracks&&e.tracks.length?" · "+e.tracks.length+" tracks":"");
 if(e.cat==="content")return e.platforms.join(" · ");if(e.cat==="tasks")return nm(e.people,S.user).join(" · ")+" · "+e.priority;
 if(e.cat==="activities")return nm(e.people,S.user).slice(0,3).join(" · ")+(e.people.length>3?" +"+(e.people.length-3):"");return e.venue+" · "+e.orgKind;}
const isFin=e=>e.cat==="songs"?e.status==="Released"&&e.sub==="Release":e.status==="Completed"||e.status==="Cancelled";
const sortByOcc=a=>a.slice().sort((x,y)=>{const p=nextOcc(x),q=nextOcc(y);return p.date===q.date?(p.time||"").localeCompare(q.time||""):p.date.localeCompare(q.date)});
const relEntries=(id,u)=>DB.rels.filter(r=>r.a===id||r.b===id).map(r=>byId(r.a===id?r.b:r.a)).filter(e=>e&&canSee(e,u));
const entriesOn=(d,u)=>{const o=[];visible(u).forEach(e=>occs(e).forEach(x=>{if(x.date===d)o.push({e,o:x})}));return o.sort((a,b)=>(a.o.time||"").localeCompare(b.o.time||""))};
const needsAttn=u=>visible(u).filter(e=>{if(!involved(e,u)||isFin(e))return false;const d=days(TODAY,nextOcc(e).date);return d>0&&d<=28&&["Planning/Organizing","For Submission","In Production","Inquiry","Not Started","Blocked","In Progress"].includes(e.status)});
const unread=()=>DB.notifs.filter(n=>n.unread&&byId(n.ref)).length;
const statusOptions=c=>c==="songs"?Object.keys(SONG_STATUS):c==="gigs"?GIG_STATUS:c==="tasks"?TASK_STATUS:EVT_STATUS;
const hay=e=>[e.title,e.eid,e.venue,e.orgName,e.type,e.status,e.sub,e.desc,e.people.map(mn).join(" "),(e.platforms||[]).join(" "),(e.tracks||[]).join(" ")].filter(Boolean).join(" ").toLowerCase();
const ctag=c=>'<span class="tag" style="background:'+CAT[c].t+';color:'+CAT[c].c+'">'+CAT[c].tag+'</span>';
const av=(k,s)=>!M[k]?'':'<span class="av" style="width:'+s+'px;height:'+s+'px;font-size:'+s*.38+'px;background-color:'+M[k].c+(M[k].photo?';background-image:url('+M[k].photo+')':'')+'">'+(M[k].photo?'':k)+'</span>';
const sv=p=>'<svg viewBox="0 0 24 24">'+p+'</svg>';
const I={copy:'<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5.5 15H5A1.5 1.5 0 0 1 3.5 13.5V5A1.5 1.5 0 0 1 5 3.5h8.5A1.5 1.5 0 0 1 15 5v.5"/>',task:'<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',song:'<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',post:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9.2 4.8 2.8-4.8 2.8z"/>',ppl:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.2c2.4-.2 4.1 1.4 4.5 4.3"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',find:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',nxt:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="m10.5 13 3 2.5-3 2.5"/>',arr:'<path d="M5 12h14M13 6l6 6-6 6"/>',home:'<path d="M3 10.4 12 3.2l9 7.2"/><path d="M5.6 9.6V19.4a1.4 1.4 0 0 0 1.4 1.4h10a1.4 1.4 0 0 0 1.4-1.4V9.6"/>',bell:'<path d="M18 8.6a6 6 0 1 0-12 0c0 6.6-2.6 8.4-2.6 8.4h17.2S18 15.2 18 8.6"/><path d="M13.7 20.6a2 2 0 0 1-3.4 0"/>',
 sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.4v2M12 19.6v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.4 12h2M19.6 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"/>',cal:'<rect x="3.2" y="5" width="17.6" height="16" rx="3"/><path d="M3.2 10h17.6M8 3v4M16 3v4"/>',sl:'<path d="M3 6h18M6 12h12M10 18h4"/>'};
const TABS=[["home","Home",I.home],["notifs","Notifications",I.bell],["myday","My Day",I.sun],["cal","Calendar",I.cal],["settings","Settings",I.sl]];
let S={user:null,in:false,loading:true,busy:false,noMember:null,tab:"home",q:"",cats:[],st:"",pp:"",open:null,form:null,link:null,pick:false,toast:null,sel:TODAY,calCats:[],lgErr:"",em:"",hcat:null,cq:"",cst:"",cpp:"",cplat:"",ctype:"",up:{},allTasks:false,dview:null,search:false,sflt:false,cflt:false};
const $=s=>document.querySelector(s),sh=(l,c)=>'<div class="sh"><span>'+l+'</span>'+(c!=null?'<span>'+c+'</span>':'')+'</div>';
const empty=(h,p)=>'<div class="empty"><h3>'+h+'</h3><p class="mut">'+p+'</p></div>';
