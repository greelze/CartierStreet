"use strict";
/* HOME PAGE
   Big buttons, one per category. Each opens its own page:
   My Tasks, Activities, Gigs/Events → Today / This Week / Next Week / Upcoming
   Songs → grouped by status · Content → planned posts (search hidden behind a button).
   HTML: built by vHome() below. CSS: css/pages/home.css (shared styles: css/base.css). */
const HUB=[
 ["tasks","My Tasks",I.task,"Things you need to get done."],
 ["songs","Songs",I.song,"Every song, grouped by where it is in the process."],
 ["content","Content",I.post,"Posts and videos being planned."],
 ["activities","Activities",I.ppl,"Sessions, birthdays, hangouts and trips."],
 ["gigs","Gigs / Events",I.mic,"Shows, performances and events."]];
const SONG_SECS=["Released","Submitted/Pitching","For Submission","In Production","Not Started","Limbo"];

/* entries for one category page. My Tasks = tasks you're assigned to (admins can switch to everyone's). */
function catItems(c){const u=S.user;let l=visible(u).filter(e=>e.cat===c);if(c==="tasks"&&!(isAdmin(u)&&S.allTasks))l=l.filter(e=>involved(e,u));return l;}
const nextUp=l=>sortByOcc(l).find(e=>nextOcc(e).date>=TODAY&&nextOcc(e).date<"2099");
const whenTxt=d=>d===TODAY?"today":d===addD(TODAY,1)?"tomorrow":fmtS(d);

function vHome(){if(S.hcat)return vCatPage(S.hcat);const u=S.user;
 return '<div class="ph"><div><p class="mut">'+fmtL(TODAY)+'</p><h1>Hello, '+H(mn(u))+'</h1><p class="mut lead">What would you like to look at?</p></div><div class="acts">'+searchBtn()+addBtn("Add new")+'</div></div>'+
 '<div class="cards">'+HUB.map(([c,label,icon,desc])=>{const open=catItems(c).filter(e=>!isFin(e)),nx=nextUp(open);
  return bigCard({act:"hcat",data:' data-c="'+c+'"',icon,title:label,desc,color:CAT[c].c,count:open.length,unit:c==="songs"?"in progress":"open",
   next:nx?"Next: "+H(nx.title)+" · "+whenTxt(nextOcc(nx).date):"Nothing coming up"});}).join("")+'</div>';}

const CAT_INTRO={tasks:"Tasks assigned to you, sorted by when they’re due.",songs:"Every song, grouped by where it is in the process.",content:"Posts and videos that are being planned.",
 activities:"Sessions, birthdays, hangouts and trips, sorted by date.",gigs:"Shows and events, sorted by date."};

function vCatPage(c){const l=catItems(c),h=HUB.find(x=>x[0]===c);let body;
 if(c==="songs")body=songSections(l);
 else if(c==="content")body=contentTools()+'<div id="clist">'+contentList()+'</div>';
 else{const open=sortByOcc(l.filter(e=>!isFin(e))),fin=l.length-open.length;
  body=(l.length?timeSections(open,c):empty("Nothing here yet","Tap “+ Add "+CAT[c].label.toLowerCase()+"” above to add the first one."))+
   (fin?'<p class="mut note">'+fin+' completed or cancelled '+(fin===1?CAT[c].label.toLowerCase()+" is":CAT[c].pl.toLowerCase()+" are")+' not shown. Use Search to find them.</p>':"");}
 return backBar("Home","hcat",' data-c=""')+
 '<div class="ph"><div><h1 class="ttl" style="--cc:'+CAT[c].c+'">'+sv(h[2])+h[1]+'</h1><p class="mut lead">'+(c==="tasks"&&S.allTasks?"Everyone’s tasks, sorted by when they’re due.":CAT_INTRO[c])+'</p></div><div class="acts">'+addBtn("Add "+CAT[c].label.toLowerCase(),c)+'</div></div>'+
 (c==="tasks"&&isAdmin(S.user)?'<div class="chips"><button class="chip'+(S.allTasks?"":" on")+'" data-act="alltasks" data-v="">Only mine</button><button class="chip'+(S.allTasks?" on":"")+'" data-act="alltasks" data-v="1">Everyone’s tasks</button></div>':"")+body;}

/* Songs: one list per status */
function songSections(l){if(!l.length)return empty("No songs yet","Tap “+ Add song” above to add the first one.");
 return SONG_SECS.map(st=>{let it=l.filter(e=>e.status===st);if(!it.length)return"";
  it=st==="Released"?it.slice().sort((a,b)=>(b.release||"").localeCompare(a.release||"")):sortByOcc(it); // newest release first
  return sh(st,it.length)+it.map(row).join("")}).join("");}

/* Content: the list shows straight away; search + filters stay hidden until "Search or filter" is tapped */
const cFiltered=()=>!!(S.cq.trim()||S.cst||S.cplat||S.ctype||S.cpp);
function contentTools(){const openP=S.cflt||cFiltered(),o=(k,v,lab)=>'<option value="'+H(v)+'"'+(S[k]===v?" selected":"")+'>'+H(lab)+'</option>';
 if(!openP)return '<button class="btn big" data-act="cflt">'+sv(I.find)+'<span>Search or filter content</span></button>';
 return '<div class="fpanel"><div class="fhead"><b>Search or filter content</b><button class="btn sm" data-act="cclear">Clear &amp; close</button></div><div class="tb"><input id="cq" type="search" placeholder="Type a title, platform or name…" value="'+H(S.cq)+'" aria-label="Search content">'+
 '<select data-flt="cst" aria-label="Status">'+o("cst","","Any status")+EVT_STATUS.map(s=>o("cst",s,s)).join("")+'</select>'+
 '<select data-flt="cplat" aria-label="Platform">'+o("cplat","","Any platform")+PLATFORMS.map(s=>o("cplat",s,s)).join("")+'</select>'+
 '<select data-flt="ctype" aria-label="Type">'+o("ctype","","Any type")+CONTENT_TYPES.map(s=>o("ctype",s,s)).join("")+'</select>'+
 '<select data-flt="cpp" aria-label="Person">'+o("cpp","","Anyone")+MK.map(k=>o("cpp",k,mn(k))).join("")+'</select></div></div>';}
function contentList(){const q=S.cq.trim().toLowerCase(),fl=cFiltered();let l=sortByOcc(catItems("content"));const hid=l.filter(isFin).length;
 l=q||S.cst?l:l.filter(e=>!isFin(e));if(q)l=l.filter(e=>hay(e).includes(q));
 if(S.cst)l=l.filter(e=>e.status===S.cst);if(S.cplat)l=l.filter(e=>(e.platforms||[]).includes(S.cplat));if(S.ctype)l=l.filter(e=>e.type===S.ctype);if(S.cpp)l=l.filter(e=>involved(e,S.cpp));
 if(!l.length)return empty(fl?"Nothing matches":"No planned content",fl?"Try different words, or tap “Clear & close”.":"Tap “+ Add content” above to plan the first post.");
 return sh(fl?"Matching content":"Planned content",l.length)+l.map(row).join("")+(hid&&!q&&!S.cst?'<p class="mut note">'+hid+' completed or cancelled '+(hid===1?"post is":"posts are")+' not shown. Search still finds them.</p>':"");}

/* ---- home page actions ---- */
document.addEventListener("input",e=>{if(e.target.id==="cq"){S.cq=e.target.value;$("#clist").innerHTML=contentList()}});
document.addEventListener("change",e=>{const k=e.target.dataset.flt;if(k){S[k]=e.target.value;render()}}); // filter dropdowns (Content and Search)
PAGE_ACTIONS.hcat=d=>{S.hcat=d.c||null;scrollTo(0,0)};
PAGE_ACTIONS.alltasks=d=>{S.allTasks=!!d.v};
PAGE_ACTIONS.cflt=()=>{S.cflt=true;setTimeout(()=>{const i=$("#cq");i&&i.focus()})};
PAGE_ACTIONS.cclear=()=>{Object.assign(S,{cflt:false,cq:"",cst:"",cplat:"",ctype:"",cpp:""})};
