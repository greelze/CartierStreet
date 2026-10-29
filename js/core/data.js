"use strict";
/* DATA
   Categories, statuses and the dropdown lists. ("songs" stays the internal name for Releases.) Members, venues and entries load from Supabase (api.js). */
const TODAY=(d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"))(new Date()); // today's date on this device
const M={},MK=[],ARTISTS=[]; // members — filled from Supabase by loadAll() in api.js
const LABEL_CODE="CS"; // the Cartier St. label itself: an artist you can credit, not a person
const CAT={songs:{tag:"RELEASE",label:"Release",pl:"Releases",c:"#5B5BD6",t:"#EEEEFB",d:"A single, EP or album"},content:{tag:"CONTENT",label:"Content",pl:"Content",c:"#B4690E",t:"#FBF1E2",d:"A post for one or more platforms"},
 activities:{tag:"ACTIVITY",label:"Activity",pl:"Activities",c:"#0E8C7F",t:"#E4F4F1",d:"A Cartier St. session, birthday, hangout or trip"},gigs:{tag:"GIG",label:"Gig / Event",pl:"Gigs / Events",c:"#C2255C",t:"#FBE9EF",d:"Performance, mixer or invite"},
 tasks:{tag:"TASK",label:"Task",pl:"Tasks",c:"#5F6B7A",t:"#EEF1F4",d:"Something that needs doing"}};
const ORDER=Object.keys(CAT);
const REL_OK={songs:["content","activities","gigs","tasks"],content:["songs","activities","gigs","tasks"],activities:["songs","content","gigs","tasks"],gigs:["songs","content","activities","tasks"],tasks:["songs","content","activities","gigs"]}; // gigs↔songs is narrowed to Release/Listening Party by relOk() (S13)
const SONG_STATUS={"Not Started":[],"In Production":["Conceptualizing","Producing Beat","Writing Lyrics","To Record","Mixing Vocals","Mastering Track"],
 "For Submission":["Finalizing Metadata","Finalizing Visuals","Planning Promotions","Finalizing Track Masterfile Document"],
 "Submitted/Pitching":["ONErpm Priority Pitched","Pitched for Spotify Playlist (SFA)","Pitched for ONErpm Playlist (Dashboard)"],
 "Released":["Waiting on Release Day","Initial Press Release Emailed","Released"],"Limbo":["Shelved","Next Release"]};
const EVT_STATUS=["Planning/Organizing","Confirmed","Postponed","Limbo","Cancelled","Completed"]; // activities (S23)
const GIG_STATUS=["Inquiry","Planning/Organizing","Confirmed","Awaiting Payment","Postponed","Limbo","Cancelled","Completed"]; // S12; Awaiting Payment is for Booked gigs only
const CONTENT_STATUS=["Planning","Ready to Post/Scheduled","Limbo","Cancelled","Posted"]; // S17
const TASK_STATUS=["Not Started","In Progress","Completed","Lapsed","Cancelled"]; // S28
const ALLST=[...new Set([...Object.keys(SONG_STATUS),...GIG_STATUS,...CONTENT_STATUS,...TASK_STATUS,...EVT_STATUS])];
const PIPE=Object.keys(SONG_STATUS).slice(0,5),PRIORITY=["Low","Medium","High","Urgent"];
const PLATFORMS=["YouTube","TikTok","Instagram","Facebook","YouTube Short","Instagram Reel","Email"];
const ACT_TYPES=["Recording Session","Creative Session","Rehearsal","Photo/Video Shoot","Meeting","Birthday","Party/Hangout","Trip/Vacation","Other"]; // S24, all internal to Cartier St.
const GIG_TYPES=[ // S10: Performing = we are on the bill, Attending = someone invited us
 ["Performing",["Club/Bar Gig","Cafe/Restaurant Gig","Festival/Concert","Private Event/Invite Only","Release/Listening Party","Showcase/Open Mic/Contest","School, Corporate or Brand Event","Street or Mall Show","Radio, TV or Online Guesting","Other Performance"]],
 ["Attending",["Industry Mixer/Conference","Session Invite","Shoot Invite","Masterclass/Talk/Workshop","Press or Media Event","Afterparty","Fashion Show/Art Opening","Awards Night","Fellow Artist's Show","Other Event"]]];
const ORG_KINDS=["Cartier St. Organized","Co-Organized","Booked (Paid Performance)","Invited/Guest"],CONTENT_TYPES=["Video","Image","Text"];
const TONE={Confirmed:["#137547"],Released:["#137547"],Posted:["#137547"],"Planning/Organizing":["#9A6200"],Planning:["#9A6200"],Postponed:["#9A6200"],"Awaiting Payment":["#9A6200"],Cancelled:["#B42318"],Lapsed:["#B42318"],"In Production":["#1F6FEB"],"In Progress":["#1F6FEB"],"Ready to Post/Scheduled":["#1F6FEB"],"For Submission":["#1F6FEB"],"Submitted/Pitching":["#1F6FEB"]};

/* ---- Content: account, phase and post links (S18, S19, S20) ---- */
const ACCOUNTS=["Cartier St.","Artist Account Only","Collaboration"]; // S18
/* ---- Promotional Plan block (D6.1.11, W8, S4) ----
   The timeline is worked out from the release date; nothing about it is stored.
   Pre-Release -14…-8 · Release Week -7…-1 · Release Day 0 · Post-Release +1…+28 · Sustained +29 onwards */
const PHASES=["Pre-Release","Release Week","Release Day","Post-Release","Sustained"];
const PHASE_NEED=["Pre-Release","Release Week","Post-Release"]; // each needs at least one post (D6.1.11)
const PHASE_WIN=r=>!r?{}:{"Pre-Release":[addD(r,-14),addD(r,-8)],"Release Week":[addD(r,-7),addD(r,-1)],
 "Release Day":[r,r],"Post-Release":[addD(r,1),addD(r,28)],"Sustained":[addD(r,29),""]};
const PP_TEXT=[["blurb","Marketing Blurb","a",1],["keywords","Release Keywords","a",1],["bio","Artist Bio","a",1]];
const PP_PLATFORMS=[["dsps","DSPs"],["spotify","Spotify"],["apple","Apple Music"],["tiktok","TikTok"],
 ["meta","Facebook and Instagram"],["youtube","YouTube"]]; // parts that do not apply are left empty (D6.1.11)
const PP_COL={blurb:"blurb",keywords:"keywords",bio:"artist_bio"};
const PAST_OPTS=["New release","Past release (already out)"]; // F5.2

/* ---- Gig Details block (S3) ----
   Three groups, no field removed. The four new boxes are the editable ones;
   the rest come from the gig itself and are changed with the Edit button.
   Confirmed stays shut until the call time and the contact are filled. */
const GD_NEW=[["call","Call time","tm",1],["fee","Fee","n",0],["cname","Contact person","t",1],
 ["cphone","Contact number","t",1],["poster","Poster or event link","t",0]];
const GD_NEED=["call","cname","cphone"]; // what Confirmed waits for
const GD_COL={call:"call_time",fee:"fee",cname:"contact_name",cphone:"contact_phone",poster:"poster_link"};
/* ---- Activity Details block (S26) ---- both optional, filled in only when they are wanted */
const AD_F=[["notes","Notes","a",0],["folder","Folder link","t",0]];
const AD_COL={notes:"notes",folder:"folder_link"};
/* S27: which activity types are asked what they belong to, and the opt-out */
const ASK_LINK={"Recording Session":["songs","Which release is this for?"],"Photo/Video Shoot":["content","Which post is this shoot for?"]};
const NO_LINK="No Existing Release";
/* ---- Release Details block (D6.1.10, RQ1, RQ2, RQ4, P2) ----
   Each box is [key, label, kind, required, ...]. Kinds: t text · n number · a long text · yn yes/no.
   ISRC, UPC and the ONErpm link are never required (D6.1.10). Featuring and Subgenre are
   optional too, because a solo track has no feature and not every genre has a subgenre. */
const TIP={ // the one-line "?" help tips (P2, RQ1)
 distributor:"The company that delivers your music to Spotify and the others. ONErpm is the default.",
 bpm:"How fast your song is, in beats per minute.",
 key:"The musical key your song is in, like C major.",
 isrc:"A code that identifies your song. Leave it blank until it is distributed, we will add it then.",
 upc:"A code that identifies your whole release. Leave it blank until it is distributed.",
 dur:"How long the track runs, like 3:24.",
 files:"Artwork: JPG, PNG or PSD at 3000×3000. Audio: WAV and MP3, plus an FLP ZIP for loop-based projects. Video: MP4 at least 1080p, with the official audio and the lyric video as separate videos unless they are combined."};
const RD_REL=[["distributor","Distributor","t",1]]; // title, type, artist and release date fill themselves in
const RD_TRACK=[["title","Track title","t",1],["feat","Featuring","t",0],["bio","Song bio","a",1],["lyrics","Lyrics","a",1],
 ["genre","Genre","t",1],["subgenre","Subgenre","t",0],["bpm","BPM","n",1],["key","Key","t",1],["dur","Duration","t",1],
 ["explicit","Explicit","yn",1],["isrc","ISRC","t",0],["upc","UPC","t",0],["credits","Credits","a",1]];
const RD_LINKS=[["listen","Public Listening Link","t",1],["photos","Artist Photos Link","t",1],["visuals","Visual Resources Link","t",1],
 ["press","Press Release DOCX Link","t",1],["onerpm","ONErpm Link","t",0]]; // RQ4; all of them stay editable at all times
const RD_CONFIRM=[["cAudio","My final audio is in the Drive folder.","tracks","Finalizing Release Details"],
 ["cVis","My artwork and videos are in the Drive folder.","links","Finalizing Visuals"]]; // RQ2
const RD_PARTS=[["release","Release"],["tracks","Tracks"],["links","Links"],["notes","Notes"]];
const RD_COL={distributor:"distributor",notes:"notes",cAudio:"confirm_audio",cVis:"confirm_visuals",
 listen:"link_listen",photos:"link_photos",visuals:"link_visuals",press:"link_press",onerpm:"link_onerpm"};
const RDT_COL={title:"title",feat:"featuring",bio:"song_bio",lyrics:"lyrics",genre:"genre",subgenre:"subgenre",
 bpm:"bpm",key:"music_key",dur:"duration",explicit:"explicit",isrc:"isrc",upc:"upc",credits:"credits"};
const tone=s=>TONE[s]||["#5A5A63"];
const VENUES=[]; // [name, address] — filled from Supabase
let DB={entries:[],rels:[],notifs:[],trash:[]};
