"use strict";
/* HOW ATLAS WORKS  (S43, D4.6)
   The page to send somebody instead of explaining it again.

   Most of what is on it is built from the app's own lists — the categories,
   the release steps, the "?" tips — so it cannot drift out of date when one
   of them changes. Only the prose is written here.

   HTML: vHelp() below. CSS: css/pages/help.css */

Object.assign(S,{help:"start"});

const HELP_PARTS=[["start","Where to start"],["cats","The five categories"],
 ["release","How a release moves"],["red","Red boxes and what they mean"],
 ["late","Overdue, Lapsed and the plum dot"],["away","Days you cannot be booked"],
 ["words","Every “?” in the app"],["ask","Who to ask"]];

function vHelp(){const open=S.help||"start";
 return backBar("Settings","tab",' data-t="settings"')+
 '<div class="ph"><div><h1>How ATLAS works</h1>'+
 '<p class="mut lead">Cartier St.’s workspace, explained once. Nothing here is a setting — it is all just an explanation.</p></div></div>'+
 '<div class="rdp hpp">'+HELP_PARTS.map(([k,label])=>
  '<button class="rdt'+(open===k?" on":"")+'" data-act="helpgo" data-k="'+k+'"><span style="flex:1">'+label+'</span><i class="rdc">'+(open===k?"▴":"▾")+'</i></button>'+
  (open===k?'<div class="rdbody hpb">'+HELP_BODY[k]()+'</div>':"")).join("")+'</div>';}

const hp=t=>'<p>'+t+'</p>';
const hli=l=>'<ul class="hpl">'+l.map(x=>'<li>'+x+'</li>').join("")+'</ul>';

const HELP_BODY={
 start:()=>hp("Home is the five categories. My Day is what is yours today. The Calendar is everything with a date on it. Notifications is what changed while you were away.")+
  hp("Anything you can open, you can open from Search — the magnifying glass sits on every page, so you never have to go back to Home to find something.")+
  hp("You only see what is yours or what you are on. That is not the page being tidy, it is the database: an entry you are not part of is not sent to your browser at all."),

 cats:()=>hp("Everything in ATLAS is one of five things.")+
  '<dl class="hpd">'+ORDER.map(c=>'<dt><span class="ctag" style="--cc:'+CAT[c].c+'">'+CAT[c].pl+'</span></dt><dd>'+H(CAT_INTRO[c])+'</dd>').join("")+'</dl>'+
  hp("A Task is the only one anybody can make for anybody. The rest belong to whoever created them."),

 release:()=>hp("A release walks through these, in order. The step it is on is the line under its title.")+
  '<ol class="hps">'+["For Submission","Submitted/Pitching","Released"].map(st=>
   '<li><b>'+st+'</b>'+((SONG_STATUS[st]||[]).length?'<span>'+(SONG_STATUS[st]||[]).map(H).join(" → ")+'</span>':"")+'</li>').join("")+'</ol>'+
  hp("Two of those moves are not yours to make. <b>Submitted to Cartier St.</b> only goes through once every box in Release Details and the Promotional Plan is filled, and a release cannot reach <b>Submitted/Pitching</b> until an admin has approved it. The page says so and the database refuses it either way, so there is no way to get ahead of the review by accident.")+
  hp("If it comes back, you get a note saying what to fix. Fix those boxes and submit it again — the note stays on the page until you do.")+
  hp("After it is out, the page asks for the Day 7 and Day 28 numbers, and what worked. That is the only record of it, so it is worth five minutes."),

 red:()=>hp("A red box is one Cartier St. needs before the release can be submitted. It is not an error and nothing is broken — it is just not filled in yet.")+
  hli(["The count at the top of Release Details says how many are left.",
   "<b>Go to first empty</b> jumps straight to the next one.",
   "Under each red box is a line saying what to put in it.",
   "The gray text inside an empty box is an example, not an answer. It disappears the moment you type and it is never saved."])+
  hp("A box saves on its own as soon as you leave it. It will say <b>Saved</b>. If your connection drops it says so and keeps trying, and whatever you typed stays on the screen — you never have to type an answer twice."),

 late:()=>hp("Three different marks, three different meanings.")+
  '<dl class="hpd">'+
  '<dt><span class="odue">Overdue</span></dt><dd>Its date has passed and it is not done. Nothing has happened to it — it is just late.</dd>'+
  '<dt><span class="stag">Lapsed</span></dt><dd>A task five days past its date that nobody pressed Done on. Cartier St. is told. It is not a telling-off, it is so that something stuck does not sit there silently.</dd>'+
  '<dt><span class="pdot" aria-hidden="true"></span> plum dot</dt><dd>An admin changed something on this entry. The dot says that it happened and when, never who.</dd>'+
  '</dl>',

 away:()=>hp("<b>Unavailable Dates</b> sits beside + Add on the Calendar. Everyone adds their own; everyone sees everyone’s.")+
  hli(["Add a single day, a run of days, or just a few hours.",
   "There is no title and no reason, by design. It says when you cannot be booked and nothing about why.",
   "Gig and Activity forms check it before they save. Somebody unavailable stops the save, and the form names them and the hours.",
   "An admin can book over it anyway, but only with a note — which is recorded and sent to you.",
   "Blocking time you are already booked into still saves; Cartier St. is told so they can move things."]),

 words:()=>hp("Every "+'<span class="tip" aria-hidden="true">?</span>'+" in the app, in one place.")+
  '<dl class="hpd hptip">'+Object.keys(TIP).map(k=>'<dt>'+H(TIP_LABEL[k]||k)+'</dt><dd>'+H(TIP[k])+'</dd>').join("")+'</dl>',

 ask:()=>hp("Cartier St. are the admins: "+nm(MK.filter(k=>M[k].adm),null).join(" and ")+". They approve releases, set roles, hold the Contacts book and can edit anything.")+
  hp("For anything about a particular release, gig or task, put it in the Comments at the bottom of that entry rather than in a chat. It stays with the thing it is about, and everyone on it gets told.")+
  hp("If something in ATLAS itself looks wrong — a number that cannot be right, a page that will not save — tell an admin what you were doing when it happened. That is usually enough to find it.")};

PAGE_ACTIONS.help=()=>{S.tab="help";S.help="start";S.open=null;S.search=false;scrollTo(0,0)};
/* one section is always open. Closing the last one would leave a page of
   headings and nothing to read, which is not what anybody came here for. */
PAGE_ACTIONS.helpgo=d=>{S.help=d.k};