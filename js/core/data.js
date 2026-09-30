"use strict";
/* DATA
   Categories, statuses and the dropdown lists. Members, venues and entries load from Supabase (api.js). */
const TODAY=(d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"))(new Date()); // today's date on this device
const M={},MK=[],ARTISTS=[]; // members — filled from Supabase by loadAll() in api.js
const CAT={songs:{tag:"SONG",label:"Song",pl:"Songs",c:"#5B5BD6",t:"#EEEEFB",d:"Track, EP or album"},content:{tag:"CONTENT",label:"Content",pl:"Content",c:"#B4690E",t:"#FBF1E2",d:"A post for one or more platforms"},
 activities:{tag:"ACTIVITY",label:"Activity",pl:"Activities",c:"#0E8C7F",t:"#E4F4F1",d:"Session, birthday, hangout or trip"},gigs:{tag:"GIG",label:"Gig / Event",pl:"Gigs / Events",c:"#C2255C",t:"#FBE9EF",d:"Performance, mixer or invite"},
 tasks:{tag:"TASK",label:"Task",pl:"Tasks",c:"#5F6B7A",t:"#EEF1F4",d:"Something that needs doing"}};
const ORDER=Object.keys(CAT);
const REL_OK={songs:["content","activities","tasks"],content:["songs","activities","gigs","tasks"],activities:["songs","content","gigs","tasks"],gigs:["content","activities","tasks"],tasks:["songs","content","activities","gigs"]};
const SONG_STATUS={"Not Started":[],"In Production":["Conceptualizing","Producing Beat","Writing Lyrics","To Record","Mixing Vocals","Mastering Track"],
 "For Submission":["Finalizing Metadata","Finalizing Visuals","Planning Promotions","Finalizing Track Masterfile Document"],
 "Submitted/Pitching":["ONErpm Priority Pitched","Pitched for Spotify Playlist (SFA)","Pitched for ONErpm Playlist (Dashboard)"],
 "Released":["Waiting on Release Day","Initial Press Release Emailed","Release"],"Limbo":["Shelved","Next Song"]};
const EVT_STATUS=["Planning/Organizing","Confirmed","Completed","Postponed","Cancelled","Limbo"],GIG_STATUS=["Inquiry"].concat(EVT_STATUS),TASK_STATUS=["Not Started","In Progress","Blocked","Completed","Cancelled"];
const ALLST=[...new Set([...Object.keys(SONG_STATUS),...GIG_STATUS,...TASK_STATUS])];
const PIPE=Object.keys(SONG_STATUS).slice(0,5),PRIORITY=["Low","Medium","High","Urgent"];
const PLATFORMS=["YouTube","TikTok","Instagram","Facebook","YouTube Short","Instagram Reel","Email"];
const ACT_TYPES=["Birthday","Recording Session","Creative Session","Vacation","Party/Hangout","Other"];
const GIG_TYPES=[["Gig / Performance",["Club/Bar Gig","Cafe/Restaurant Gig","Festival/Concert","Private Event/Invite Only","Release/Listening Party"]],["Event / Non-Performance",["Industry Mixer","Showcase/Open Mic","Session Invite","Masterclass/Talks","Afterparties","Fashion Shows","Other"]]];
const ORG_KINDS=["Cartier St. Organized","Co-Organized","Booked (Paid Performance)","Invited/Guest"],CONTENT_TYPES=["Video","Image","Text"];
const TONE={Confirmed:["#137547"],Released:["#137547"],"Planning/Organizing":["#9A6200"],Postponed:["#9A6200"],Blocked:["#9A6200"],Cancelled:["#B42318"],"In Production":["#1F6FEB"],"In Progress":["#1F6FEB"],"For Submission":["#1F6FEB"],"Submitted/Pitching":["#1F6FEB"]};
const tone=s=>TONE[s]||["#5A5A63"];
const VENUES=[]; // [name, address] — filled from Supabase
let DB={entries:[],rels:[],notifs:[],trash:[]};
