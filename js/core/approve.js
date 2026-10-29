"use strict";
/* THE CARTIER ST. REVIEW  (W2, W4, W5, W6, F2, F4.1, F4.2, RQ9, F5.2)
   A release reaches "Submitted to Cartier St." only once both blocks are complete.
   An admin then approves it, or returns it with a note. Until it is approved the
   release cannot move on to Submitted/Pitching — in the page and in the database.
   HTML: built by vReview() below. CSS: css/pages/details.css */

Object.assign(S,{ret:null}); // the release being returned, while the note is being typed

const SUBMITTED="Submitted to Cartier St.", ONERPM="Submitted to ONErpm";
const atSubmitted=e=>e.status==="For Submission"&&e.sub===SUBMITTED;

/* ---- the bar at the top of a release page ---- */
function vReview(e){if(e.cat!=="songs"||isPast(e))return"";
 const a=ap(e),adm=isAdmin(S.user),own=e.by===S.user,left=subLeft(e);

 if(S.ret===e.id&&adm)return '<div class="rvw ret"><h5>Return this release</h5>'+
  '<p>Say what needs fixing. '+H(mn(e.by))+' sees this note on the release.</p>'+
  '<textarea id="retnote" rows="3" placeholder="What should they change before resubmitting?"></textarea>'+
  '<div class="rvwa"><button class="btn pri" data-act="dreturn" data-id="'+e.id+'">Send it back</button>'+
  '<button class="btn" data-act="retcancel">Cancel</button></div></div>';

 /* approved (F2.3) */
 if(isApproved(e))return '<div class="rvw ok"><h5>Approved by Cartier St.</h5>'+
  '<p>'+fmtM(a.apAt.slice(0,10))+' at '+ft(a.apAt.slice(11,16))+(a.apBy?' · '+H(mn(a.apBy)):"")+'. '+
  (e.status==="For Submission"?'You can now submit it to ONErpm.':'')+'</p>'+
  (e.status==="For Submission"&&(own||adm)?'<div class="rvwa"><button class="btn pri" data-act="dtoonerpm" data-id="'+e.id+'">Submit to ONErpm</button></div>':"")+'</div>';

 /* returned with a note (W4, F4.2) */
 if(isReturned(e))return '<div class="rvw bad"><h5>Returned by Cartier St.</h5>'+
  '<p class="retn">'+H(a.retNote||"No note was left.")+'</p>'+
  '<p>'+fmtM(a.retAt.slice(0,10))+'. Fix the boxes below, then submit it again.</p></div>';

 /* waiting on Cartier St. */
 if(atSubmitted(e)&&!isApproved(e))return '<div class="rvw wait"><h5>With Cartier St. for review</h5>'+
  '<p>Submitted '+(a.subAt?fmtM(a.subAt.slice(0,10)):"just now")+'. Cartier St. reviews within about 3 days.</p>'+
  (adm?'<div class="rvwa"><button class="btn pri" data-act="dapprove" data-id="'+e.id+'">Approve</button>'+
    '<button class="btn dan" data-act="retopen" data-id="'+e.id+'">Return with note</button></div>':"")+'</div>';

 /* still filling it in (W2) */
 if(e.status==="For Submission"&&(own||adm))return '<div class="rvw todo"><h5>Before you submit to Cartier St.</h5>'+
  '<p>'+(left?left+" box"+(left===1?"":"es")+" still to fill across Release Details and the Promotional Plan."
         :"Everything is filled in. Set the step to “Submitted to Cartier St.” above when you are ready.")+'</p>'+
  (left?'<div class="rvwa"><button class="btn" data-act="rdjump">Show me what is left</button></div>':"")+'</div>';
 return "";}

/* RQ10: Spotify can take a few days after the distributor to show a release.
   From day 5 after ONErpm the artist is asked, here and in their notifications,
   until they say yes. A no on day 10 reaches the admins. */
function vSFA(e){if(e.cat!=="songs"||isPast(e))return"";
 const a=ap(e);if(!a.oneAt||a.sfa)return"";
 const d=days(a.oneAt.slice(0,10),TODAY);if(d<5)return"";
 const can=canEdit(e,S.user);
 return '<div class="rvw '+(d>=10?"bad":"wait")+'"><h5>Is it showing in Spotify for Artists?</h5>'+
  '<p>'+d+' days since it went to ONErpm.'+(d>=10?' Cartier St. has been told it still is not showing.':' Spotify can take a few days to catch up.')+'</p>'+
  (can?'<div class="rvwa"><button class="btn pri" data-act="sfayes" data-id="'+e.id+'">Yes, it is showing</button>'+
    '<button class="btn" data-act="sfano">Not yet</button></div>':"")+'</div>';}

PAGE_ACTIONS.sfayes=d=>{const e=live(d.id);if(!e||!canEdit(e,S.user))return false;
 run(()=>answerSFA(e.id,true)).then(ok=>ok&&toast("Thanks — the Spotify pitch task is open now"));return false};
PAGE_ACTIONS.sfano=()=>{toast("No problem. We will ask again in a few days.");return false};

/* RQ9: the contract deadline cannot move, so the release date has to */
const vLate=e=>isLate(e)&&isAdmin(S.user)
 ? '<div class="rvw bad"><h5>Late</h5><p>'+(ap(e).subAt?"Not with ONErpm by day 21":"Not submitted to Cartier St. by day 24")+
   '. The ONErpm deadline cannot move, so this needs a new release date.</p></div>' : "";

/* ---- actions ---- */
PAGE_ACTIONS.retopen=d=>{S.ret=d.id;setTimeout(()=>{const t=document.getElementById("retnote");t&&t.focus()})};
PAGE_ACTIONS.retcancel=()=>{S.ret=null};

PAGE_ACTIONS.dapprove=d=>{const e=live(d.id);if(!e||!isAdmin(S.user))return false;
 if(!atSubmitted(e)){toast("Only a release sitting at “"+SUBMITTED+"” can be approved");return false}
 run(()=>approveRelease(e.id)).then(ok=>{if(!ok)return;
  notify(e,"approved **"+e.title+"** — you can now submit it to ONErpm",[e.by]); // F4.2
  toast("Approved")});
 return false};

PAGE_ACTIONS.dreturn=d=>{const e=live(d.id),t=document.getElementById("retnote");if(!e||!isAdmin(S.user))return false;
 const note=(t&&t.value||"").trim();
 if(!note){toast("A returned release needs a note saying what to fix");return false} // W4
 run(()=>returnRelease(e.id,note)).then(ok=>{if(!ok)return;S.ret=null;
  notify(e,"returned **"+e.title+"**: "+note,[e.by]); // F4.2
  toast("Sent back to "+mn(e.by));render()});
 return false};

/* W5: the ONErpm submission date is set for you, not typed */
PAGE_ACTIONS.dtoonerpm=d=>{const e=live(d.id);if(!e)return false;
 if(!isApproved(e)){toast("Cartier St. has to approve this first");return false}
 if(!canEdit(e,S.user))return false;
 run(()=>setStatus(e,"Submitted/Pitching",ONERPM)).then(ok=>{if(!ok)return;
  notify(e,"submitted **"+e.title+"** to ONErpm");toast("Submitted to ONErpm")});
 return false};