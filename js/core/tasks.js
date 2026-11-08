"use strict";
/* TASKS: Start and Done buttons (S29), and approval for a task one artist
   hands to another (S31).
   Done is personal: with several people assigned, each presses their own and the
   task only becomes Completed after the last one. Undo takes a press back until then.
   A task an artist makes for someone else waits for an admin, and the person it is
   for does not see it until then.
   HTML: built by vTaskBar() and vWaiting() below. CSS: css/pages/details.css */

/* S30: what actually closes each automatic task, said plainly */
const AUTO_WHY={
 submit_cs:"This closes when you set the release to “Submitted to Cartier St.”",
 fix_returned:"This closes when you send the release back to Cartier St.",
 review_release:"This closes when you approve the release or return it.",
 submit_onerpm:"This closes when the release is submitted to ONErpm.",
 add_codes:"This closes when every track has its ISRC and UPC.",
 paste_onerpm:"This closes when the ONErpm link is pasted into Release Details.",
 priority_pitch:"This closes when the release reaches ONErpm Priority Pitched.",
 sfa_pitch:"This closes when the release reaches Pitched for Spotify Playlist (SFA).",
 collect_payment:"This closes when the gig is set to Completed."};

/* ---- who has pressed Done (S29) ---- */
const doneBy=e=>e.done||[];
const iAmDone=(e,u)=>doneBy(e).includes(u);
const assignees=e=>e.people||[];
const allDone=e=>assignees(e).length>0&&assignees(e).every(k=>iAmDone(e,k));

/* ---- approval (S31) ---- */
const taskApproved=e=>{const a=e.ap||{};return !!a.apAt&&(!a.retAt||a.apAt>a.retAt)};
const taskReturned=e=>{const a=e.ap||{};return !!a.retAt&&(!a.apAt||a.retAt>a.apAt)};
/* a task that needed an admin and has not had one yet: hidden from the people on it */
const taskPending=e=>e.cat==="tasks"&&!!e.need&&!taskApproved(e);
/* an artist handing work to someone else needs an admin to agree (S31) */
const needsApproval=(by,people)=>!isAdmin(by)&&(people||[]).some(k=>k!==by);

/* ---- the bar on a task page ---- */
function vTaskBar(e){if(e.cat!=="tasks")return"";
 const u=S.user,adm=isAdmin(u),own=e.by===u,mine=assignees(e).includes(u),a=e.ap||{};

 if(S.tret===e.id&&adm)return '<div class="rvw ret"><h5>Return this task</h5>'+
  '<p>Say why. '+H(mn(e.by))+' sees this note on the task.</p>'+
  '<textarea id="tretnote" rows="3" placeholder="Why is this not going ahead?"></textarea>'+
  '<div class="rvwa"><button class="btn pri" data-act="tdoreturn" data-id="'+e.id+'">Send it back</button>'+
  '<button class="btn" data-act="tretcancel">Cancel</button></div></div>';

 if(taskPending(e)){
  if(taskReturned(e))return '<div class="rvw bad"><h5>Returned by Cartier St.</h5>'+
   '<p class="retn">'+H(a.retNote||"No note was left.")+'</p>'+
   '<p>'+fmtM(a.retAt.slice(0,10))+'. Change it and ask again, or delete it.</p>'+
   (own||adm?'<div class="rvwa"><button class="btn" data-act="tagain" data-id="'+e.id+'">Ask again</button></div>':"")+'</div>';
  return '<div class="rvw wait"><h5>Waiting for admin approval</h5>'+
   '<p>'+H(nm(assignees(e),u).join(", "))+' will not see this until an admin agrees.</p>'+
   (adm?'<div class="rvwa"><button class="btn pri" data-act="tapprove" data-id="'+e.id+'">Approve and assign</button>'+
     '<button class="btn dan" data-act="tretopen" data-id="'+e.id+'">Return with note</button></div>':"")+'</div>';}

 /* S30: the system made this one, and the system closes it. No Start, no Done —
    instead, what will actually close it, and a way straight to the release or gig. */
 if(e.auto){const src=e.src&&byId(e.src);
  return '<div class="rvw auto"><h5><i class="atag">Automatic</i>'+H(AUTO_WHY[e.autoKind]||"This closes by itself when the step is done.")+'</h5>'+
   (src?'<p>Part of '+H(src.title)+'.</p><div class="rvwa"><button class="btn pri" data-act="open" data-id="'+src.id+'">Open '+CAT[src.cat].label.toLowerCase()+'</button></div>'
       :'<p>Its release or gig is no longer here.</p>')+'</div>';}
 if(isFin(e)||isCancelled(e))return"";
 if(!mine)return"";           // the buttons belong to the people the task is for

 const n=doneBy(e).length,tot=assignees(e).length,me=iAmDone(e,u);
 return '<div class="tbar">'+
  (e.status==="Not Started"?'<button class="btn pri big" data-act="tstart" data-id="'+e.id+'">Start</button>':"")+
  (me?'<span class="tdone">✓ You marked this done</span><button class="lnk" data-act="tundo" data-id="'+e.id+'">Undo</button>'
    :'<button class="btn ok big" data-act="tdone" data-id="'+e.id+'">Done</button>')+
  (tot>1?'<span class="tcount">'+n+' of '+tot+' done'+(n?' · '+H(nm(doneBy(e),u).join(", ")):"")+'</span>':"")+
  '</div>';}

/* the admins' queue at the top of the Tasks page (S31) */
function vWaiting(){if(!isAdmin(S.user))return"";
 const l=sortByOcc(DB.entries.filter(e=>e.cat==="tasks"&&taskPending(e)&&!taskReturned(e)));
 if(!l.length)return"";
 return '<div class="twait">'+sh("Waiting for approval",l.length)+
  l.map(e=>'<button class="pprow" data-act="open" data-id="'+e.id+'">'+ctag("tasks")+
   '<span class="b"><b>'+H(e.title)+'</b><span>'+H(mn(e.by)+" → "+assignees(e).map(mn).join(", ")+" · due "+fmtS(e.due))+'</span></span>'+
   '<span class="s" style="color:var(--blue)">Review</span></button>').join("")+'</div>';}

/* ---- actions ---- */
PAGE_ACTIONS.tstart=d=>{const e=live(d.id);if(!e||!assignees(e).includes(S.user))return false;
 run(()=>setStatus(e,"In Progress")).then(ok=>ok&&toast("Started"));return false};

PAGE_ACTIONS.tdone=d=>{const e=live(d.id);if(!e||!assignees(e).includes(S.user))return false;
 const now=[...doneBy(e),S.user],last=assignees(e).every(k=>now.includes(k));
 run(async()=>{await setDone(e.id,S.user,true);if(last)await setStatus(e,"Completed");}).then(ok=>{if(!ok)return;
  if(last){notify(e,"finished **"+e.title+"**");toast("Task completed")}
  else toast("Marked done · waiting on "+assignees(e).filter(k=>!now.includes(k)).map(mn).join(", "))});
 return false};

PAGE_ACTIONS.tundo=d=>{const e=live(d.id);if(!e)return false;
 run(()=>setDone(e.id,S.user,false)).then(ok=>ok&&toast("Taken back"));return false};

/* approval (S31), the same shape as a release */
PAGE_ACTIONS.tretopen=d=>{S.tret=d.id;setTimeout(()=>{const t=document.getElementById("tretnote");t&&t.focus()})};
PAGE_ACTIONS.tretcancel=()=>{S.tret=null};
PAGE_ACTIONS.tapprove=d=>{const e=live(d.id);if(!e||!isAdmin(S.user))return false;
 run(()=>approveTask(e.id)).then(ok=>{if(!ok)return;
  notify(e,"assigned you **"+e.title+"**",assignees(e));
  notify(e,"approved **"+e.title+"** and assigned it",[e.by]);
  toast("Approved and assigned")});
 return false};
PAGE_ACTIONS.tdoreturn=d=>{const e=live(d.id),t=document.getElementById("tretnote");if(!e||!isAdmin(S.user))return false;
 const note=(t&&t.value||"").trim();
 if(!note){toast("A returned task needs a note saying why");return false}
 run(()=>returnTask(e.id,note)).then(ok=>{if(!ok)return;S.tret=null;
  notify(e,"returned **"+e.title+"**: "+note,[e.by]);toast("Sent back to "+mn(e.by));render()});
 return false};
PAGE_ACTIONS.tagain=d=>{const e=live(d.id);if(!e)return false;
 run(()=>askTaskAgain(e.id)).then(ok=>{if(!ok)return;
  notify(e,"asked again about **"+e.title+"**",MK.filter(k=>M[k].adm));toast("Sent to the admins")});
 return false};