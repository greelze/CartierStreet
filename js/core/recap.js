"use strict";
/* THE TWO RECAPS  (S45, S47, D6.11, D6.14)
   What happened, written down while anyone still remembers.

   A release that is out collects its Day 7 and Day 28 numbers and a short
   note on what worked. A gig that is finished collects turnout, how it went,
   whether we were paid, and where the photos are. In both cases the engine
   raises a task when the moment arrives — day 7, day 28, the morning after —
   and closes it again the instant the boxes are filled.

   Both blocks reuse rdBox, so they come with the gray examples, the red-box
   lines and the Saved label that every other box in the app has.

   HTML: vRecap() below. CSS: css/pages/details.css
   Database: patch 19. */

/* S45: the numbers worth having, in the order anybody would read them out */
const RC_D7=[["d7s","Streams","n",0],["d7v","Saves","n",0],["d7p","Playlists it landed on","a",0]];
const RC_D28=[["d28s","Streams","n",0],["d28v","Saves","n",0],["d28p","Playlists it landed on","a",0]];
const RC_TEXT=[["worked","What worked","a",0],["change","What to do differently","a",0]];
/* S47: a gig, the morning after */
const RC_GIG=[["turnout","Roughly how many came","n",0],["wentWell","What went well","a",0],
 ["gigChange","What to do differently","a",0],["photos","Photos and video","t",0]];

const rcVal=(e,k)=>(e.rc||{})[k];
/* a window is "done" once anything in it has been answered — the engine reads
   the same thing, so the page and the task never disagree */
const d7Done=e=>!!(e.rc&&e.rc.d7At),d28Done=e=>!!(e.rc&&e.rc.d28At);
const gigDone=e=>!!(e.rc&&e.rc.at);

/* ---- the block on a release page (S45, D6.11) ---- */
function vRecap(e){
 if(e.cat==="gigs")return vGigRecap(e);
 if(e.cat!=="songs"||!(e.status==="Released"&&!isPast(e)))return ""; // F5.2: never on an imported release
 const ed=canEdit(e,S.user),since=days(e.release,TODAY);
 const win=(label,day,fields,done)=>{
  const open=since>=day;
  return '<div class="rcw'+(done?" done":open?" now":" soon")+'">'+
   '<div class="rcwh"><b>Day '+day+'</b>'+
    (done?'<i class="rctick">Filled in</i>':open?'<i class="rcnow">Ready to fill in</i>':
     '<i class="rcsoon">In '+(day-since)+' day'+(day-since===1?"":"s")+'</i>')+'</div>'+
   (open?'<div class="rdg">'+fields.map(f=>rdBox(f,rcVal(e,f[0]),'data-rc="'+f[0]+'"',ed)).join("")+'</div>'
       :'<p class="mut rcwait">Nothing to do yet. The numbers settle after the first week.</p>')+
   '</div>';};
 return '<div class="drc"><h4>How it went</h4>'+
  '<p class="rdnote">Out '+fmtS(e.release)+', '+since+' day'+(since===1?"":"s")+' ago. Cartier St. asks for these so the next release can be planned on something better than memory.</p>'+
  win("Day 7",7,RC_D7,d7Done(e))+win("Day 28",28,RC_D28,d28Done(e))+
  (since>=7?'<div class="rdg rctext">'+RC_TEXT.map(f=>rdBox(f,rcVal(e,f[0]),'data-rc="'+f[0]+'"',ed)).join("")+'</div>':"")+
  '</div>';}

/* ---- the block on a gig page (S47, D6.14) ---- */
function vGigRecap(e){
 if(e.status!=="Completed"||!e.date)return "";
 const ed=canEdit(e,S.user)||isAdmin(S.user),paid=rcVal(e,"paid");
 return '<div class="drc"><h4>How it went</h4>'+
  '<p class="rdnote">'+fmtS(e.date)+'. Worth five minutes now — nobody remembers the turnout in March.</p>'+
  '<div class="rdg">'+RC_GIG.map(f=>rdBox(f,rcVal(e,f[0]),'data-rc="'+f[0]+'"',ed)).join("")+'</div>'+
  '<div class="rcpaid'+(paid===true?" yes":paid===false?" no":"")+'">'+
   '<b>Were we paid?</b>'+
   (ed?'<div class="yn" role="radiogroup" aria-label="Were we paid?">'+
     [["Yes",true],["Not yet",false]].map(o=>'<button type="button" role="radio" aria-checked="'+(paid===o[1])+'" class="'+(paid===o[1]?"on":"")+'" data-act="rcpaid" data-id="'+e.id+'" data-v="'+o[0]+'">'+o[0]+'</button>').join("")+'</div>'
    :'<span>'+(paid===true?"Yes":paid===false?"Not yet":"Not answered")+'</span>')+
   (paid===false?'<p class="rctodo">Cartier St. keeps the payment task open until this says Yes.</p>':"")+
  '</div></div>';}

/* ---- saving ---- */
/* Every box here behaves like a Release Details box: it writes as you leave
   it, keeps what you typed if the write fails, and says which it did (S40). */
function rcWrite(e,key,val){
 e.rc=Object.assign({},e.rc,{[key]:val});
 /* the engine closes the task off the stamp, so the stamp is set the first
    time anything in that window is answered */
 const stamp=["d7s","d7v","d7p"].includes(key)?"d7At":["d28s","d28v","d28p"].includes(key)?"d28At":e.cat==="gigs"?"at":null;
 if(stamp&&!e.rc[stamp]&&filled(val))e.rc[stamp]=new Date().toISOString();
 pushSave("rc:"+key,()=>saveRecap(e,key,val));}

PAGE_ACTIONS.rcpaid=d=>{const e=live(d.id);if(!e)return false;
 if(!canEdit(e,S.user)&&!isAdmin(S.user))return false;
 rcWrite(e,"paid",d.v==="Yes");return false};