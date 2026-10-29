"use strict";
/* HOME PAGE
   Big buttons, one per category. Each opens its own page:
   Tasks → Overdue / Today / This week / Later · Activities and Gigs → the four time sections
   Releases → grouped by status · Content → planned posts (search hidden behind a button).
   Each page folds its finished items into a section at the bottom (R4).
   HTML: built by vHome() below. CSS: css/pages/home.css (shared styles: css/base.css). */
const HUB=[
 ["tasks","Tasks",I.task,"Things you need to get done."],
 ["songs","Releases",I.song,"Every release, grouped by where it is in the process."],
 ["content","Content",I.post,"Posts and videos being planned."],
 ["activities","Activities",I.ppl,"Cartier St. internal events such as sessions, birthdays, hangouts, trips, etc."],
 ["gigs","Gigs / Events",I.mic,"Shows, performances and events."]];
const SONG_SECS=["Released","Submitted/Pitching","For Submission","In Production","Not Started","Limbo"];

/* entries for one category page. Tasks = tasks you're assigned to (admins can switch to everyone's). */
function catItems(c){const u=S.user;let l=visible(u).filter(e=>e.cat===c);if(c==="tasks"&&!(isAdmin(u)&&S.allTasks))l=l.filter(e=>involved(e,u));return l;}
const nextUp=l=>sortByOcc(l).find(e=>nextOcc(e).date>=TODAY&&nextOcc(e).date<"2099");
const whenTxt=d=>d===TODAY?"today":d===addD(TODAY,1)?"tomorrow":fmtS(d);

function vHome(){if(S.hcat)return vCatPage(S.hcat);const u=S.user;
 return '<div class="ph"><div><p class="mut">'+fmtL(TODAY)+'</p><h1>Hello, '+H(mn(u))+'</h1><p class="mut lead">Your music, gigs and plans, all in one place.</p></div><div class="acts">'+searchBtn()+addBtn("Add new")+'</div></div>'+
 '<div class="cards">'+HUB.map(([c,label,icon,desc])=>{const open=catItems(c).filter(e=>!isFin(e)),nx=nextUp(open);
  return bigCard({act:"hcat",data:' data-c="'+c+'"',icon,title:label,desc,color:CAT[c].c,count:open.length,unit:c==="songs"?"in progress":"open",
   next:nx?"Next: "+H(nx.title)+" · "+whenTxt(nextOcc(nx).date):"Nothing coming up"});}).join("")+'</div>'+vCountdown()+vRecent();}

/* "Countdown til your next release" — shows once a release is Submitted/Pitching (D1.0.6, W6) */
/* W6: it starts at Submitted to ONErpm, the first Submitted/Pitching step. A past release is never counted down (F5.2). */
function vCountdown(){const l=visible(S.user).filter(e=>e.cat==="songs"&&e.status==="Submitted/Pitching"&&!isPast(e)&&e.release&&e.release>=TODAY)
  .sort((a,b)=>a.release.localeCompare(b.release));
 if(!l.length)return"";const e=l[0],n=days(TODAY,e.release);
 return sh("Countdown til your next release")+'<button class="cdown" data-act="open" data-id="'+e.id+'"><span class="n">'+(n===0?"Today":n)+'</span><span class="b"><b>'+H(e.title)+'</b><span>'+(n===0?"Out today":(n===1?"1 day to go":n+" days to go")+" · "+fmtM(e.release))+'</span></span>'+ctag("songs")+'</button>';}

/* "Recently added" — what you just made, and what others added you to (D1.0.5) */
function vRecent(){const u=S.user,l=visible(u).filter(e=>e.made&&(e.by===u||involved(e,u)))
  .sort((a,b)=>b.made.localeCompare(a.made)).slice(0,6);
 if(!l.length)return"";
 return sh("Recently added",l.length)+'<div class="minis">'+l.map(miniCard).join("")+'</div>';}

const CAT_INTRO={tasks:"Things to get done. Tick them off one by one.",songs:"Your singles, EPs and albums, from idea to release day.",content:"Posts you are planning. Keep your fans watching.",
 activities:"Cartier St. sessions, birthdays, hangouts and trips.",gigs:"Shows and events, ours and yours."};

function vCatPage(c){const l=catItems(c),h=HUB.find(x=>x[0]===c);let body;
 if(c==="songs")body=songSections(l);
 else if(c==="content")body=contentTools()+'<div id="clist">'+contentList()+'</div>';
 else{const open=sortByOcc(l.filter(e=>!isFin(e))),fin=sortByOcc(l.filter(isFin));
  body=(open.length?timeSections(open,c,c==="tasks"?"tasks":""):empty("No "+CAT[c].pl.toLowerCase()+" yet","Add your first one.",addBtn("Add "+CAT[c].label.toLowerCase(),c)))+
   (c==="tasks"?foldSection(fin.filter(e=>e.status==="Lapsed"),"tasks-lapsed","Lapsed","done")+foldSection(fin.filter(e=>e.status!=="Lapsed"),"tasks-done","Completed","done")
    :foldSection(fin,c+"-done",finLabel(c),"done"));} // Lapsed sits above Completed (S28)
 if(c==="tasks")body=vWaiting()+body; // S31
 return backBar("Home","hcat",' data-c=""')+
 '<div class="ph"><div><h1 class="ttl" style="--cc:'+CAT[c].c+'">'+sv(h[2])+h[1]+'</h1><p class="mut lead">'+(c==="tasks"&&S.allTasks?"Everyone’s tasks, sorted by when they’re due.":CAT_INTRO[c])+'</p></div><div class="acts">'+searchBtn()+addBtn("Add "+CAT[c].label.toLowerCase(),c)+'</div></div>'+
 (c==="tasks"&&isAdmin(S.user)?'<div class="chips"><button class="chip'+(S.allTasks?"":" on")+'" data-act="alltasks" data-v="">Only mine</button><button class="chip'+(S.allTasks?" on":"")+'" data-act="alltasks" data-v="1">Everyone’s tasks</button></div>':"")+body;}

/* Releases: one list per status */
const finLabel=c=>c==="songs"?"Released":"Completed"; // what the folded section at the bottom is called (R4)
function songSections(l){if(!l.length)return empty("No releases yet","Add your first one.",addBtn("Add release","songs"));
 const out=l.filter(isFin).slice().sort((a,b)=>(b.release||"").localeCompare(a.release||"")); // finished releases, newest first
 return SONG_SECS.map(st=>{let it=l.filter(e=>e.status===st&&!isFin(e));if(!it.length)return"";
  it=st==="Released"?it.slice().sort((a,b)=>(b.release||"").localeCompare(a.release||"")):sortByOcc(it);
  return sh(st,it.length)+it.map(row).join("")}).join("")+foldSection(out,"songs-done","Released","done");}

/* Content: the list shows straight away; search + filters stay hidden until "Search or filter" is tapped */
const cFiltered=()=>!!(S.cq.trim()||S.cst||S.cplat||S.ctype||S.cpp);
function contentTools(){const openP=S.cflt||cFiltered(),o=(k,v,lab)=>'<option value="'+H(v)+'"'+(S[k]===v?" selected":"")+'>'+H(lab)+'</option>';
 if(!openP)return '<button class="btn big" data-act="cflt">'+sv(I.find)+'<span>Search or filter content</span></button>';
 return '<div class="fpanel"><div class="fhead"><b>Search or filter content</b><button class="btn sm" data-act="cclear">Clear &amp; close</button></div><div class="tb"><input id="cq" type="search" placeholder="Type a title, platform or name…" value="'+H(S.cq)+'" aria-label="Search content">'+
 '<select data-flt="cst" aria-label="Status">'+o("cst","","Any status")+CONTENT_STATUS.map(s=>o("cst",s,s)).join("")+'</select>'+
 '<select data-flt="cplat" aria-label="Platform">'+o("cplat","","Any platform")+PLATFORMS.map(s=>o("cplat",s,s)).join("")+'</select>'+
 '<select data-flt="ctype" aria-label="Type">'+o("ctype","","Any type")+CONTENT_TYPES.map(s=>o("ctype",s,s)).join("")+'</select>'+
 '<select data-flt="cpp" aria-label="Person">'+o("cpp","","Anyone")+MK.map(k=>o("cpp",k,mn(k))).join("")+'</select></div></div>';}
function contentList(){const q=S.cq.trim().toLowerCase(),fl=cFiltered();let l=sortByOcc(catItems("content"));
 l=q||S.cst?l:l.filter(e=>!isFin(e));if(q)l=l.filter(e=>hay(e).includes(q));
 if(S.cst)l=l.filter(e=>e.status===S.cst);if(S.cplat)l=l.filter(e=>(e.platforms||[]).includes(S.cplat));if(S.ctype)l=l.filter(e=>e.type===S.ctype);if(S.cpp)l=l.filter(e=>involved(e,S.cpp));
 if(!l.length)return empty(fl?"Nothing matches":"No content yet",fl?"Try different words, or tap “Clear & close”.":"Plan your first post.",fl?"":addBtn("Add content","content"));
 return sh(fl?"Matching content":"Planned content",l.length)+l.map(row).join("")+(fl?"":foldSection(sortByOcc(catItems("content").filter(isFin)),"content-done","Completed","done"));}

/* ---- home page actions ---- */
document.addEventListener("input",e=>{if(e.target.id==="cq"){S.cq=e.target.value;$("#clist").innerHTML=contentList()}});
document.addEventListener("change",e=>{const k=e.target.dataset.flt;if(k){S[k]=e.target.value;render()}}); // filter dropdowns (Content and Search)
PAGE_ACTIONS.hcat=d=>{S.hcat=d.c||null;scrollTo(0,0)};
PAGE_ACTIONS.sidecat=d=>{Object.assign(S,{tab:"home",hcat:d.c,search:false,open:null});scrollTo(0,0)}; // the five category links in the sidebar
PAGE_ACTIONS.alltasks=d=>{S.allTasks=!!d.v};
PAGE_ACTIONS.cflt=()=>{S.cflt=true;setTimeout(()=>{const i=$("#cq");i&&i.focus()})};
PAGE_ACTIONS.cclear=()=>{Object.assign(S,{cflt:false,cq:"",cst:"",cplat:"",ctype:"",cpp:""})};
