"use strict";
/* UNAVAILABLE DATES  (S41, D3.6.x, M3.6.x, D6.9)
   Its own page, laid out like the Calendar, reached from the button beside
   + Add there. Everyone adds their own times; everyone sees everyone's; only
   the owner and an admin change one. There is no title and no reason — a
   block says when somebody cannot be booked and nothing about why.

   This file also holds the clash check the Gig and Activity forms call before
   they save, and the admin override that goes with it.

   HTML: vUnav() and vUForm() below. CSS: css/pages/unavailable.css
   Database: patch 16 (unavailable, schedule_overrides). */

Object.assign(S,{usel:TODAY,uform:null,ucats:[]}); // the chosen day, the open form, the people filter

/* the button that sits beside + Add on the Calendar (D3.6.1) */
const unavBtn=()=>'<button class="btn big" data-act="unavopen">'+sv(I.busy)+'<span>Unavailable Dates</span></button>';

/* ---- the page ---- */
function vUnav(){const cur=d2(S.usel),y=cur.getFullYear(),m=cur.getMonth(),pad=new Date(y,m,1).getDay(),act=S.ucats;
 const onDay=d=>unavOn(d).filter(x=>!act.length||act.includes(x.who));
 let cells="";
 for(let i=0;i<42;i++){const d0=new Date(y,m,i-pad+1),d=iso(d0);if(i%7===0&&i>0&&d0.getMonth()!==m)break;
  const it=onDay(d),shown=it.slice(0,3);
  cells+='<button class="cd'+(d0.getMonth()!==m?" mu":"")+(d===TODAY?" td":"")+(d===S.usel?" sel":"")+'" data-act="uday" data-d="'+d+'">'+
   '<span class="cdd">'+d0.getDate()+'</span><span class="cde">'+
   shown.map(x=>'<i class="ev" style="--cc:'+(M[x.who]?M[x.who].c:"#8A8A94")+'" title="'+H(mn(x.who)+" · "+unavSpan(x))+'"><em></em><b>'+H(mn(x.who).split(" ")[0])+'</b></i>').join("")+
   (it.length>shown.length?'<i class="ev more"><em></em><b>+'+(it.length-shown.length)+' more</b></i>':"")+'</span></button>';}
 const it=onDay(S.usel),mine=DB.unav.filter(x=>x.who===S.user).length;
 return '<div class="calwrap unavpage">'+backBar("Calendar","tab",' data-t="cal"')+
 '<div class="calmain"><div class="calh"><h1>'+MONTHS[m]+" "+y+'</h1>'+
 '<button class="btn sm" data-act="umon" data-n="-1" aria-label="Previous month">‹</button><button class="btn sm" data-act="uday" data-d="'+TODAY+'">Today</button><button class="btn sm" data-act="umon" data-n="1" aria-label="Next month">›</button>'+
 '<span class="calacts"><button class="btn pri big" data-act="unew">+ Add unavailable time</button></span></div>'+
 '<p class="mut lead callead">When each of us cannot be booked. Everyone sees everyone’s, and gig and activity forms check it before they save.</p>'+
 '<div class="chips"><button class="chip'+(act.length?"":" on")+'" data-act="ucat" data-c="all">Everyone</button>'+
  MK.map(c=>'<button class="chip'+(act.includes(c)?" on":"")+'" data-act="ucat" data-c="'+c+'">'+H(mn(c).split(" ")[0])+'</button>').join("")+'</div>'+
 '<div class="cg">'+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>'<span class="dw">'+x+'</span>').join("")+cells+'</div></div>'+
 '<div class="calday">'+sh(fmtL(S.usel),it.length?it.length+" unavailable":"")+
 (it.length?it.map(uRow).join(""):empty("Everyone is free","Nobody has blocked this date.",'<button class="btn pri big" data-act="unew">+ Add unavailable time</button>'))+
 '<p class="mut note unavnote">'+(mine?"You have "+mine+" block"+(mine===1?"":"s")+" saved.":"You have not blocked any time yet.")+' A block has no title and no reason — only when.</p>'+
 '</div></div>';}

/* one row in the chosen day's list */
function uRow(x){const ed=unavEdit(x);
 return '<div class="urow"><span class="ub" style="background:'+(M[x.who]?M[x.who].c:"#8A8A94")+'"></span>'+av(x.who,34)+
 '<span class="ut"><b>'+H(mn(x.who))+(x.who===S.user?" (you)":"")+'</b><span>'+H(unavWhen(x))+'</span></span>'+
 (ed?'<span class="ua"><button class="btn sm" data-act="uedit" data-id="'+x.id+'">Edit</button><button class="btn sm dan" data-act="udel" data-id="'+x.id+'">Delete</button></span>':"")+
 '</div>';}

/* ---- the add / edit form ---- */
function vUForm(){const f=S.uform,ed=!!f.id,clash=f.all||(f.st&&f.en)?bookedInside(f.who,f.from,f.to,f.all,f.st,f.en):[];
 const fe=k=>f.errs[k]?'<div class="e">'+H(f.errs[k])+"</div>":"";
 return '<div class="scrim s2" data-act="ucancel"></div><div class="modal sm" role="dialog" aria-label="'+(ed?"Edit":"Add")+' unavailable time">'+
 '<div class="mh"><h3 style="flex:1">'+(ed?"Edit":"Add")+' unavailable time</h3><button class="x" data-act="ucancel" aria-label="Close">×</button></div>'+
 '<div class="mb">'+
  (f.who!==S.user?'<div class="ctx">For <b>'+H(mn(f.who))+'</b></div>':"")+
  '<div class="fld"><b>From</b><input type="date" data-u="from" value="'+H(f.from)+'">'+fe("from")+'</div>'+
  '<div class="fld"><b>To</b><input type="date" data-u="to" value="'+H(f.to)+'">'+fe("to")+'</div>'+
  '<div class="fld full"><label class="uall"><input type="checkbox" data-u="all"'+(f.all?" checked":"")+'><span><b>All day</b><i>The whole of every day in the range.</i></span></label></div>'+
  (f.all?"":'<div class="fld"><b>Start time</b><input type="time" data-u="st" value="'+H(f.st)+'">'+fe("st")+'</div>'+
   '<div class="fld"><b>End time</b><input type="time" data-u="en" value="'+H(f.en)+'">'+fe("en")+'</div>')+
  (clash.length?'<div class="uwarn full"><h5>You are already booked in this time</h5><ul>'+
   clash.map(e=>'<li>'+H(e.title)+' · '+H(fmtS(e.date)+(e.time?" · "+ft(e.time):""))+'</li>').join("")+
   '</ul><p>You can still save this. Cartier St. will be told so they can move things around.</p></div>':"")+
 '</div>'+
 '<div class="mf"><span style="margin-right:auto"></span><button class="btn" data-act="ucancel">Cancel</button>'+
 '<button class="btn pri" data-act="usave"'+(S.busy?" disabled":"")+'>'+(S.busy?"Saving…":ed?"Save changes":"Add it")+'</button></div></div>';}

/* ---- actions ---- */
PAGE_ACTIONS.unavopen=()=>{S.tab="unav";S.open=null;S.search=false;S.usel=S.sel||TODAY;scrollTo(0,0)};
PAGE_ACTIONS.uday=d=>{S.usel=d.d};
PAGE_ACTIONS.umon=d=>{const c=d2(S.usel);c.setDate(1);c.setMonth(c.getMonth()+ +d.n);S.usel=iso(c)};
PAGE_ACTIONS.ucat=d=>{if(d.c==="all")S.ucats=[];else{const i=S.ucats.indexOf(d.c);i>-1?S.ucats.splice(i,1):S.ucats.push(d.c)}};
PAGE_ACTIONS.unew=()=>{S.uform={id:null,who:S.user,from:S.usel,to:S.usel,all:true,st:"18:00",en:"22:00",errs:{}}};
PAGE_ACTIONS.ucancel=()=>{S.uform=null};
PAGE_ACTIONS.uedit=d=>{const x=DB.unav.find(u=>u.id===d.id);if(!x)return false;
 if(!unavEdit(x)){toast("Only "+mn(x.who)+" or an admin can change this");return false}
 S.uform={id:x.id,who:x.who,from:x.from,to:x.to,all:x.all,st:x.st||"18:00",en:x.en||"22:00",errs:{}}};
PAGE_ACTIONS.udel=d=>{const x=DB.unav.find(u=>u.id===d.id);if(!x)return false;
 if(!unavEdit(x)){toast("Only "+mn(x.who)+" or an admin can delete this");return false}
 if(!confirm("Remove this unavailable time?"))return false;
 run(()=>delUnav(x.id)).then(ok=>ok&&toast("Unavailable time removed"));return false};

PAGE_ACTIONS.usave=()=>{const f=S.uform;if(!f||S.busy)return false;
 const r=f.errs={};
 if(!f.from)r.from="Pick a start date";if(!f.to)r.to="Pick an end date";
 if(f.from&&f.to&&f.to<f.from)r.to="The end date cannot be before the start date";
 if(!f.all){if(!f.st)r.st="Pick a start time";if(!f.en)r.en="Pick an end time";
  if(f.st&&f.en&&f.en<=f.st)r.en="The end time has to be after the start time";}
 if(Object.keys(r).length){render();toast("Check the highlighted fields");return false}
 const clash=bookedInside(f.who,f.from,f.to,f.all,f.st,f.en),was=!!f.id;
 run(()=>saveUnav(f)).then(ok=>{if(!ok)return;S.uform=null;
  clash.forEach(e=>notify(e,"is unavailable over **"+e.title+"**",MK.filter(k=>M[k].adm))); // D6.9
  toast(was?"Unavailable time updated":clash.length?"Saved · Cartier St. has been told about the clash":"Unavailable time added");
  render();});
 return false};

/* ---- the clash check the Gig and Activity forms use (D6.9) ---- */
/* The panel shown at the top of the form once a clash is found. An artist sees
   why it will not save; an admin sees the same list and a box for the note that
   lets them go ahead anyway. */
function vClash(f){if(!f.unav||!f.unav.length)return"";const adm=isAdmin(S.user);
 return '<div class="uclash full"><h5>'+(adm?"Someone is unavailable":"This cannot be saved yet")+'</h5><ul>'+
  f.unav.map(h=>'<li>'+H(unavSay(h[0],h[1]))+'</li>').join("")+'</ul>'+
  (adm?'<p>You can book them anyway. Write a short note saying why — it is recorded on the entry and they are told.</p>'+
    '<textarea rows="2" data-ov placeholder="Why this goes ahead anyway">'+H(f.ovNote||"")+'</textarea>'+
    (f.ovErr?'<div class="e">'+H(f.ovErr)+'</div>':""):
   '<p>Change the date or the time, or take them off this, and it will save. An admin can book them anyway if it really has to happen.</p>')+
  '</div>';}

/* Called by save() before it writes. false = do not save.
   It stores what it found on the form object so vClash() can show it. */
function clashOk(f){
 if(!["gigs","activities"].includes(f.cat))return true;
 const who=(f.people||[]).concat(f.organizer||[]),hits=unavHits(who,f.date,f.time);
 f.unav=hits;f.ovErr="";
 if(!hits.length){f.ovNote="";return true}
 if(!isAdmin(S.user))return false;                       // the artist has to change something
 if(!String(f.ovNote||"").trim()){f.ovErr="A note is needed to book someone over their unavailable time.";return false}
 return true;}

/* the record, written after the entry itself saved (D6.9) */
async function recordOverride(e,list,note){
 try{await logOverride(e.id,list,note);}catch(err){console.warn("Override not recorded:",err.message||err);}
 notify(e,"booked you for **"+e.title+"** over your unavailable time — "+note,list);}