"use strict";
/* ADMIN OVERVIEW  (S46, D0.7, M0.8, D6.13)
   One page that answers "what needs Cartier St. right now?", so an admin does
   not have to walk five category pages to find out. Four counters across the
   top, then the four lists they count.

   Nothing here is new information: it is the same entries everyone else sees,
   gathered by the questions an admin actually asks. There is no new table and
   no new policy — an admin already sees everything, so this page is a view of
   what loadAll() brought back.

   HTML: vAdmin() below. CSS: css/pages/admin.css */

/* ---- the one setting (S46) ----
   How many days a release may sit on the same step before it counts as stuck.
   Change this number and the counter, the list and the wording all follow. */
const STUCK_DAYS=7;
const AHEAD_DAYS=14; // how far ahead the gigs list looks

/* ---- the four questions ---- */
/* 1. waiting for a decision from an admin */
const admReleases=()=>sortByOcc(DB.entries.filter(e=>e.cat==="songs"&&!isPast(e)&&atSubmitted(e)&&!isApproved(e)));
/* S4: posts typed into a Promotional Calendar, waiting to join the Content list */
const admDrafts=()=>sortByOcc(draftPosts());
/* the overrides are not waiting for anything — they are decisions already made
   that an admin should know about, so they sit in the inbox but out of the count */
const admOverrides=()=>DB.overrides.filter(o=>days(o.at.slice(0,10),TODAY)<=30)
 .slice().sort((a,b)=>b.at.localeCompare(a.at));
const admTasks=()=>sortByOcc(DB.entries.filter(e=>taskPending(e)&&!taskReturned(e)));
const admApprovals=()=>admReleases().length+admTasks().length+admDrafts().length;

/* 2. tasks past their date, by the person who owes them */
function admOverdue(){const by={};
 DB.entries.filter(e=>e.cat==="tasks"&&isOverdue(e)).forEach(e=>
  (e.people||[]).filter(p=>!(e.done||[]).includes(p)).forEach(p=>(by[p]=by[p]||[]).push(e)));
 return Object.keys(by).sort((a,b)=>by[b].length-by[a].length||mn(a).localeCompare(mn(b)))
  .map(p=>[p,sortByOcc(by[p])]);}
const admOverdueCount=()=>DB.entries.filter(e=>e.cat==="tasks"&&isOverdue(e)).length;

/* 3. releases that have not moved for a week. entries.updated_at is what the
      database touches on every change, so "moved" means any real edit. */
const admStuck=()=>DB.entries.filter(e=>e.cat==="songs"&&!isPast(e)&&!isFin(e)&&e.moved
  &&days(e.moved.slice(0,10),TODAY)>=STUCK_DAYS)
 .slice().sort((a,b)=>a.moved.localeCompare(b.moved));

/* 4. what is coming up */
const admGigs=()=>sortByOcc(DB.entries.filter(e=>e.cat==="gigs"&&!isFin(e)&&!isCancelled(e)
  &&e.date>=TODAY&&e.date<=addD(TODAY,AHEAD_DAYS)));

/* ---- the page ---- */
function vAdmin(){
 if(!isAdmin(S.user))return '<div class="ph"><div><h1>Admin</h1></div></div>'+
  empty("Admins only","This page gathers what needs a decision from Cartier St.");
 const ap=admApprovals(),od=admOverdueCount(),st=admStuck(),gg=admGigs();
 const cnt=(n,label,warn)=>'<div class="acnt'+(n&&warn?" warn":"")+'"><strong>'+n+'</strong><span>'+label+'</span></div>';
 return '<div class="ph"><div><h1>Admin</h1><p class="mut lead">What needs Cartier St. right now, in one place.</p></div>'+
 '<div class="acts">'+searchBtn()+'</div></div>'+
 '<div class="acnts">'+cnt(ap,"Approvals waiting",1)+cnt(od,"Overdue tasks",1)+
  cnt(st.length,"Releases stuck",1)+cnt(gg.length,"Gigs in "+AHEAD_DAYS+" days",0)+'</div>'+
 vAdmInbox()+vAdmOverdue()+vAdmStuck(st)+vAdmGigs(gg);}

/* ---- 1. the approvals inbox (D6.13) ---- */
function vAdmInbox(){const rel=admReleases(),tsk=admTasks(),dft=admDrafts(),ovr=admOverrides();
 let h=sh("Approvals inbox",admApprovals()||"");
 if(!rel.length&&!tsk.length&&!dft.length)h+='<p class="mut aclear">Nothing is waiting on you.</p>';
 if(rel.length)h+='<p class="asub">Releases submitted to Cartier St.</p>'+rel.map(e=>aRow(e,
  "Submitted "+(ap(e).subAt?fmtM(ap(e).subAt.slice(0,10)):"recently"),"Review")).join("");
 if(tsk.length)h+='<p class="asub">Tasks one person made for another</p>'+tsk.map(e=>aRow(e,
  mn(e.by)+" → "+nm(e.people,S.user).join(", "),"Approve")).join("");
 /* S4: posts typed straight into a Promotional Calendar. Until one is
    approved it is only visible inside that release's plan. */
 if(dft.length)h+='<p class="asub">Draft posts from a Promotional Calendar</p>'+dft.map(e=>{
  const r=relAll(e.id,S.user).find(x=>x.cat==="songs");
  return '<div class="arow">'+ctag(e.cat)+
   '<span class="ab"><b>'+H(e.title)+'</b><span>'+H((r?r.title+" · ":"")+(e.phase||"")+" · "+fmtS(e.date))+'</span></span>'+
   '<button class="btn pri sm" data-act="ppapprove" data-id="'+e.id+'">Approve</button>'+
   '<button class="btn sm" data-act="open" data-id="'+e.id+'">Open</button></div>';}).join("");
 if(ovr.length)h+='<p class="asub">Unavailable time that was overridden</p>'+
  ovr.map(o=>{const e=byId(o.ref);
   return '<div class="arow ovr"><span class="abar" style="background:var(--crit)"></span>'+
   '<span class="ab"><b>'+H(mn(o.who))+' was booked over their own time</b>'+
   '<span>'+(e?H(e.title)+' · ':"")+H(mn(o.by))+' · '+H(fmtM(o.at.slice(0,10)))+'</span>'+
   '<span class="anote">'+H(o.note)+'</span></span>'+
   (e?'<button class="btn sm" data-act="open" data-id="'+e.id+'">Open</button>':"")+'</div>';}).join("");
 return h;}

/* one row in the inbox: what it is, one line of why, and the way in */
const aRow=(e,sub,btn)=>'<div class="arow">'+ctag(e.cat)+
 '<span class="ab"><b>'+H(e.title)+'</b><span>'+H(e.eid+" · "+sub)+'</span></span>'+
 '<button class="btn pri sm" data-act="open" data-id="'+e.id+'">'+btn+'</button></div>';

/* ---- 2. overdue tasks, grouped by person (S46) ---- */
function vAdmOverdue(){const g=admOverdue();
 let h=sh("Overdue tasks",admOverdueCount()||"");
 if(!g.length)return h+'<p class="mut aclear">Nobody is behind.</p>';
 return h+g.map(([p,l])=>'<div class="agrp"><div class="agh">'+av(p,28)+'<b>'+H(mn(p))+'</b><span>'+l.length+' late</span></div>'+
  l.map(e=>row(e)).join("")+'</div>').join("");}

/* ---- 3. releases that have not moved (S46) ---- */
function vAdmStuck(l){let h=sh("Releases not moving",l.length||"");
 if(!l.length)return h+'<p class="mut aclear">Every release has moved in the last '+STUCK_DAYS+' days.</p>';
 return h+'<p class="asub">No change for '+STUCK_DAYS+' days or more. Their current step is on the right.</p>'+
  l.map(e=>{const d=days(e.moved.slice(0,10),TODAY);
   return '<div class="arow">'+ctag(e.cat)+
   '<span class="ab"><b>'+H(e.title)+'</b><span>'+H(e.eid+" · "+nm(e.people,S.user).join(", "))+
    ' · <i class="astale">'+d+' days without a change</i></span></span>'+
   '<span class="astep">'+H(sline(e))+'</span>'+
   '<button class="btn sm" data-act="open" data-id="'+e.id+'">Open</button></div>';}).join("");}

/* ---- 4. gigs in the next fortnight (S46) ---- */
function vAdmGigs(l){let h=sh("Gigs in the next "+AHEAD_DAYS+" days",l.length||"");
 if(!l.length)return h+'<p class="mut aclear">Nothing booked in the next '+AHEAD_DAYS+' days.</p>';
 return h+l.map(e=>row(e,gdReady(e)?"":"warn")).join("")+
  (l.some(e=>!gdReady(e))?'<p class="mut note">A highlighted gig is still missing its call time or contact.</p>':"");}

/* ---- actions ---- */
PAGE_ACTIONS.admin=()=>{S.tab="admin";S.open=null;S.search=false;scrollTo(0,0)};