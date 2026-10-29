"use strict";
/* API
   Everything that talks to Supabase: sign-in, loading, saving, deleting,
   linking, notifications and live updates. The pages still read from DB;
   this file fills DB from Supabase and writes every change back. */

const MID={},MUSER={},VID={},VNAME={},LABEL_LINKS={}; // …and Cartier St.’s own social links
const EID_PFX={songs:"CS",content:"CT",activities:"ACT",gigs:"GE",tasks:"TSK"};
const clear=o=>Object.keys(o).forEach(k=>delete o[k]);
const hhmm=t=>t?String(t).slice(0,5):"";
function must(r){if(r.error)throw r.error;return r.data;}

/* ---- load everything the signed-in member is allowed to see ---- */
async function loadAll(){
 const q=t=>db.from(t).select("*");
 const res=await Promise.all([q("members"),q("venues"),q("entries"),q("songs"),q("song_tracks"),q("content"),q("activities"),q("gigs"),q("tasks"),q("entry_members"),q("entry_links"),q("artist_links"),
  db.from("notifications").select("*").order("created_at",{ascending:false}).limit(200)]);
  const [mem,ven,ent,son,trk,con,act,gig,tsk,em,lnk,soc,ntf]=res.map(must);

 // members → M, MK, ARTISTS (filled in place so the form field lists stay connected)
 clear(M);clear(MID);clear(MUSER);MK.length=0;ARTISTS.length=0;const MCODE={};
 mem.sort((a,b)=>a.is_admin-b.is_admin||a.full_name.localeCompare(b.full_name)).forEach(m=>{
  M[m.code]={n:m.full_name,c:m.color,adm:m.is_admin?1:0};if(m.photo_url)M[m.code].photo=m.photo_url;
  MID[m.code]=m.id;MUSER[m.code]=m.user_id;MCODE[m.id]=m.code;M[m.code].art=m.is_artist??!m.is_admin;if(m.code!==LABEL_CODE)MK.push(m.code);if(M[m.code].art)ARTISTS.push(m.code);}); // Artists list = members marked is_artist

 // social links → M[code].links and LABEL_LINKS (Cartier St. itself)
 clear(LABEL_LINKS);soc.forEach(r=>{const c=MCODE[r.member_id];if(c)M[c].links=r;else Object.assign(LABEL_LINKS,r);});

 // venues → VENUES
 VENUES.length=0;clear(VID);clear(VNAME);
 ven.sort((a,b)=>a.name.localeCompare(b.name)).forEach(v=>{VENUES.push([v.name,v.address]);VID[v.name]=v.id;VNAME[v.id]=v.name;});

 // entries + their detail rows, people and tracklists
 const byEntry=rows=>Object.fromEntries(rows.map(r=>[r.entry_id,r]));
 const sub={songs:byEntry(son),content:byEntry(con),activities:byEntry(act),gigs:byEntry(gig),tasks:byEntry(tsk)};
 const tracks={};trk.sort((a,b)=>a.position-b.position).forEach(t=>(tracks[t.song_id]=tracks[t.song_id]||[]).push(t)); // full rows: the Release Details block needs every column
 const ppl={};em.forEach(r=>{const x=ppl[r.entry_id]=ppl[r.entry_id]||{people:[],organizer:[],done:[]},c=MCODE[r.member_id];
  if(c){x[r.role==="organizer"?"organizer":"people"].push(c);if(r.done_at)x.done.push(c);}}); // done_at = this person pressed Done (S29)
 const ord=a=>a.sort((x,y)=>MK.indexOf(x)-MK.indexOf(y));
 const all=ent.map(r=>{const p=ppl[r.id]||{people:[],organizer:[],done:[]};
  const x=toEntry(r,sub[r.category][r.id]||{},ord(p.people),ord(p.organizer),tracks[r.id]||[],MCODE);x.done=ord(p.done);return x;});
 DB.entries=all.filter(e=>!e.deletedAt);
 DB.trash=all.filter(e=>e.deletedAt).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));
 DB.rels=lnk.map(l=>({id:l.id,a:l.entry_a,b:l.entry_b}));
 DB.notifs=ntf.map(n=>({id:n.id,actor:MCODE[n.actor_id]||null,ref:n.entry_id,unread:n.is_read?0:1,txt:n.message,g:ngroup(n.created_at),w:nwhen(n.created_at)}));
}

/* the Release Details boxes that live on the release itself, and one per track (D6.1.10) */
const toRD=s=>({distributor:s.distributor||"",notes:s.notes||"",cAudio:!!s.confirm_audio,cVis:!!s.confirm_visuals,
 listen:s.link_listen||"",photos:s.link_photos||"",visuals:s.link_visuals||"",press:s.link_press||"",onerpm:s.link_onerpm||""});
/* where a release stands with Cartier St. (W4, W5, F2.3, F5.2) */
const toAP=(s,MCODE)=>({subAt:s.submitted_at||"",apAt:s.approved_at||"",apBy:(MCODE&&MCODE[s.approved_by])||"",
 retAt:s.returned_at||"",retNote:s.returned_note||"",oneAt:s.onerpm_submitted_at||"",past:!!s.is_past,
 sfa:s.sfa_seen_at||""}); // RQ10: the artist has said it is showing in Spotify for Artists

/* the Promotional Plan boxes (D6.1.11). The timeline is worked out from the release date, never stored. */
const toPP=s=>({blurb:s.blurb||"",keywords:s.keywords||"",bio:s.artist_bio||"",
 plat:(s.promo_platforms&&typeof s.promo_platforms==="object")?s.promo_platforms:{}});
const toTrack=t=>({pos:t.position,title:t.title||"",feat:t.featuring||"",bio:t.song_bio||"",lyrics:t.lyrics||"",
 genre:t.genre||"",subgenre:t.subgenre||"",bpm:t.bpm==null?"":t.bpm,key:t.music_key||"",dur:t.duration||"",
 explicit:t.explicit==null?null:!!t.explicit,isrc:t.isrc||"",upc:t.upc||"",credits:t.credits||""});

/* one database row → the entry shape the pages already use */
function toEntry(r,s,people,organizer,tracks,MCODE){
 const e={id:r.id,eid:r.eid,cat:r.category,title:r.title,status:r.status,by:MCODE[r.created_by]||null,
  drive:r.drive_status||"none",driveFiles:r.drive_file_count||0,deletedAt:r.deleted_at,made:r.created_at||"",aed:r.admin_edits||null,people,organizer}; // made = when it was created (D1.0.5); aed = admin-edited fields (S34)
 const ev={date:s.event_date||"",time:hhmm(s.event_time),venue:VNAME[s.venue_id]||"",address:s.address||""};
 if(r.category==="songs")Object.assign(e,{type:s.release_type||"Single",sub:s.sub_status||r.status,start:s.start_date||"",release:s.release_date||"",final:s.final_submission_date||"",
  tracks:tracks.map(t=>t.title),trk:tracks.map(toTrack),rd:toRD(s),pp:toPP(s),ap:toAP(s,MCODE),
  req:Array.isArray(s.edit_requests)?s.edit_requests:[]}); // rd = Release Details (D6.1.10); pp = the plan (D6.1.11); ap = the review (W4); req = change requests (F3.5)
 if(r.category==="content")Object.assign(e,ev,{type:s.content_type||"Video",platforms:s.platforms||[],
  account:s.account||ACCOUNTS[0],phase:s.phase||"",links:Array.isArray(s.post_links)?s.post_links:[]}); // S18, S19
 if(r.category==="activities")Object.assign(e,ev,{type:s.activity_type||"Other",
  ad:{notes:s.notes||"",folder:s.folder_link||""}}); // S26
 if(r.category==="gigs")Object.assign(e,ev,{type:s.gig_type||"Other",typeNote:s.gig_group||"",orgKind:s.organizer_kind||"",orgName:s.organizer_name||"",
  gd:{call:hhmm(s.call_time),fee:s.fee==null?"":s.fee,cname:s.contact_name||"",cphone:s.contact_phone||"",poster:s.poster_link||""}}); // S3
 if(r.category==="tasks")Object.assign(e,{desc:s.description||"",due:s.due_date||"",priority:s.priority||"Medium",
  dueTime:hhmm(s.due_time),need:!!s.needs_approval,auto:!!s.is_auto,     // S35, S31, S30
  autoKind:s.auto_kind||"",src:s.source_entry||"",                       // S30: what it belongs to
  ap:{apAt:s.approved_at||"",apBy:(MCODE&&MCODE[s.approved_by])||"",retAt:s.returned_at||"",retNote:s.returned_note||""}});
 return e;
}

/* notification time labels, worked out from created_at */
function ngroup(ts){const d=iso(new Date(ts)),n=days(d,TODAY);return n<=0?"Today":n===1?"Yesterday":n<7?"This week":"Older";}
function nwhen(ts){const t=new Date(ts),mins=Math.floor((Date.now()-t)/6e4),n=days(iso(t),TODAY);
 if(mins<1)return"now";if(n<=0)return mins<60?mins+"m":Math.floor(mins/60)+"h";if(n===1)return"Yesterday";if(n<7)return DOW[t.getDay()];return t.getDate()+" "+MONTHS[t.getMonth()];}

/* next display ID, e.g. TSK26014. bump skips ahead if someone else just took one. */
function nextEid(cat,bump){const p=EID_PFX[cat]+TODAY.slice(2,4),re=new RegExp("^"+p+"(\\d{3,})$");let mx=0;
 DB.entries.concat(DB.trash).forEach(e=>{const m=re.exec(e.eid);if(m)mx=Math.max(mx,+m[1]);});return p+String(mx+1+bump).padStart(3,"0");}

/* the detail-table row for a form object */
function subRow(o){const ev={event_date:o.date||null,event_time:o.time||null,venue_id:VID[o.venue]||null,address:o.address||null};
 return {songs:{release_type:o.type,sub_status:o.sub||o.status,start_date:o.start||null,release_date:o.release||null,final_submission_date:o.final||null,is_past:!!o.past},
  content:Object.assign({content_type:o.type,platforms:o.platforms,account:o.account||null,phase:o.phase||null,post_links:o.links||[]},ev),
  activities:Object.assign({activity_type:o.type},ev),
  gigs:Object.assign({gig_type:o.type,gig_group:o.typeNote,organizer_kind:o.orgKind,organizer_name:o.orgName||null},ev),
  tasks:{description:o.desc||null,due_date:o.due||null,due_time:o.dueTime||null,priority:o.priority,needs_approval:!!o.need}}[o.cat];}

/* people on an entry: add the new ones first, then remove the rest (so you never lock yourself out mid-save) */
async function syncMembers(id,o){
 const want=(o.people||[]).map(c=>({entry_id:id,member_id:MID[c],role:"member"})).concat((o.organizer||[]).map(c=>({entry_id:id,member_id:MID[c],role:"organizer"}))).filter(r=>r.member_id);
 if(want.length)must(await db.from("entry_members").upsert(want,{onConflict:"entry_id,member_id,role",ignoreDuplicates:true}));
 for(const role of ["member","organizer"]){const keep=want.filter(r=>r.role===role).map(r=>r.member_id);
  let q=db.from("entry_members").delete().eq("entry_id",id).eq("role",role);if(keep.length)q=q.not("member_id","in","("+keep.join(",")+")");must(await q);}
}
/* The tracklist is matched by position rather than wiped and rebuilt, so the
   Release Details typed against track 2 stays with track 2. A single gets one
   track named after the release (D6.1.10). */
async function syncTracks(id,titles,relTitle){
 const want=(titles&&titles.length?titles:[relTitle]).map((t,i)=>({position:i+1,title:(t||"").trim()||relTitle}));
 const have=must(await db.from("song_tracks").select("id,position").eq("song_id",id));
 for(const w of want){const row=have.find(h=>h.position===w.position);
  if(row)must(await db.from("song_tracks").update({title:w.title}).eq("id",row.id));
  else must(await db.from("song_tracks").insert({song_id:id,position:w.position,title:w.title}));}
 const extra=have.filter(h=>h.position>want.length).map(h=>h.id);
 if(extra.length)must(await db.from("song_tracks").delete().in("id",extra));}

/* one Promotional Plan box → the database (D6.1.11).
   The six platform parts live together in one jsonb column, so that one is merged, not replaced. */
async function savePP(id,key,val,plat){
 if(plat)must(await db.from("songs").update({promo_platforms:val}).eq("entry_id",id));
 else must(await db.from("songs").update({[PP_COL[key]]:val===""?null:val}).eq("entry_id",id));}

/* a post's links (S19) */
async function savePostLinks(id,links){must(await db.from("content").update({post_links:links}).eq("entry_id",id));}

/* one Release Details box → the database (D6.1.10) */
async function saveRD(id,key,val,pos){
 if(pos==null)must(await db.from("songs").update({[RD_COL[key]]:val===""?null:val}).eq("entry_id",id));
 else must(await db.from("song_tracks").update({[RDT_COL[key]]:val===""?null:val}).eq("song_id",id).eq("position",pos));}

/* ---- writes ---- */
async function createEntry(o,ctx){let row,err;
 for(let i=0;i<10;i++){const r=await db.from("entries").insert({eid:nextEid(o.cat,i),category:o.cat,title:o.title.trim(),status:o.status,created_by:MID[S.user]}).select().single();
  row=r.data;err=r.error;if(!err||err.code!=="23505")break;} // 23505 = that ID was just taken; try the next one
 if(err)throw err;
 try{must(await db.from(o.cat).insert(Object.assign({entry_id:row.id},subRow(o))));
  if(o.cat==="songs")await syncTracks(row.id,o.tracks,o.title.trim());
  await syncMembers(row.id,o);
  if(ctx)must(await db.from("entry_links").insert({entry_a:ctx,entry_b:row.id,created_by:MID[S.user]}));
 }catch(e){await db.from("entries").delete().eq("id",row.id);throw e;} // don't leave a half-saved entry behind
 return row.id;}
/* S34: when an admin changes an entry someone else made, note the fields and the day */
const AED_KEYS=["title","status","sub","type","people","organizer","tracks","start","release","final",
 "date","time","venue","address","platforms","orgKind","orgName","desc","due","priority"];
function adminEdits(before,ch){
 if(!before||!isAdmin(S.user)||before.by===S.user)return null;
 const same=(a,b)=>JSON.stringify(a===undefined||a===null?"":a)===JSON.stringify(b===undefined||b===null?"":b);
 const today=iso(new Date()),out=Object.assign({},before.aed||{});let any=false;
 AED_KEYS.forEach(k=>{if(k in ch&&!same(before[k],ch[k])){out[k]=today;any=true}});
 return any?out:null;}

async function updateEntry(o){const aed=adminEdits(live(o.id),o);
 must(await db.from("entries").update(Object.assign({title:o.title.trim(),status:o.status},aed?{admin_edits:aed}:{})).eq("id",o.id));
 must(await db.from(o.cat).upsert(Object.assign({entry_id:o.id},subRow(o))));
 if(o.cat==="songs")await syncTracks(o.id,o.tracks,o.title.trim());
 await syncMembers(o.id,o);}
async function setStatus(e,status,sub){const ch={status};if(e.cat==="songs")ch.sub=sub;const aed=adminEdits(e,ch);
 must(await db.from("entries").update(Object.assign({status},aed?{admin_edits:aed}:{})).eq("id",e.id));
 if(e.cat!=="songs")return;
 const row={sub_status:sub},now=new Date().toISOString(),a=e.ap||{};
 if(sub==="Submitted to Cartier St."&&!a.subAt)row.submitted_at=now;      // W5
 if(sub==="Submitted to ONErpm"&&!a.oneAt)row.onerpm_submitted_at=now;    // W5: Date Submitted
 must(await db.from("songs").update(row).eq("entry_id",e.id));}

/* the Cartier St. review (W4). Only an admin reaches these — the database checks that too (F2.2). */
const approveRelease=async id=>must(await db.from("songs")
 .update({approved_at:new Date().toISOString(),approved_by:MID[S.user],returned_at:null,returned_note:null}).eq("entry_id",id));
const returnRelease=async(id,note)=>must(await db.from("songs")
 .update({returned_at:new Date().toISOString(),returned_note:note}).eq("entry_id",id));

/* one person pressing Done, or taking it back (S29) */
const setDone=async(id,code,on)=>must(await db.from("entry_members")
 .update({done_at:on?new Date().toISOString():null}).eq("entry_id",id).eq("member_id",MID[code]).eq("role","member"));

/* a task one artist made for another (S31). Only an admin reaches these; the database checks that too. */
const approveTask=async id=>must(await db.from("tasks")
 .update({approved_at:new Date().toISOString(),approved_by:MID[S.user],returned_at:null,returned_note:null}).eq("entry_id",id));
const returnTask=async(id,note)=>must(await db.from("tasks")
 .update({returned_at:new Date().toISOString(),returned_note:note}).eq("entry_id",id));
const askTaskAgain=async id=>must(await db.from("tasks")
 .update({returned_at:null,returned_note:null}).eq("entry_id",id));

/* one Gig Details box (S3) and one Activity Details box (S26) */
const saveGD=async(id,key,val)=>must(await db.from("gigs").update({[GD_COL[key]]:val===""?null:val}).eq("entry_id",id));
const saveAD=async(id,key,val)=>must(await db.from("activities").update({[AD_COL[key]]:val===""?null:val}).eq("entry_id",id));

/* RQ10: the artist's answer to "is it showing in Spotify for Artists?" */
const answerSFA=async(id,seen)=>{const r=await db.rpc("answer_sfa",{p_entry:id,p_seen:seen});if(r.error)throw r.error;};

/* change requests held aside until Cartier St. decides (F3.5) */
const saveReqs=async(id,list)=>must(await db.from("songs").update({edit_requests:list}).eq("entry_id",id));
const trashEntry=async id=>must(await db.from("entries").update({deleted_at:new Date().toISOString()}).eq("id",id));
const restoreEntry=async id=>must(await db.from("entries").update({deleted_at:null}).eq("id",id));
const purgeEntry=async id=>must(await db.from("entries").delete().eq("id",id));
const linkEntries=async(a,b)=>must(await db.from("entry_links").insert({entry_a:a,entry_b:b,created_by:MID[S.user]}));
const unlinkEntries=async(a,b)=>must(await db.from("entry_links").delete().or("and(entry_a.eq."+a+",entry_b.eq."+b+"),and(entry_a.eq."+b+",entry_b.eq."+a+")"));

/* save one artist's links (or Cartier St.'s, with memberId null) */
async function saveLinks(rowId,memberId,vals){const clean={};SOCIALS.forEach(([k])=>clean[k]=(vals[k]||"").trim()||null);
 return rowId?must(await db.from("artist_links").update(clean).eq("id",rowId))
             :must(await db.from("artist_links").insert(Object.assign({member_id:memberId},clean)));}

/* ---- notifications (sent in the background; a failed one never blocks a save) ---- */
const recips=e=>[...new Set([...(e.people||[]),...(e.organizer||[]),...MK.filter(k=>M[k].adm)])].filter(k=>k!==S.user&&MID[k]);
async function notify(e,txt,to){const rc=[...new Set(to||recips(e))].filter(k=>k!==S.user&&MID[k]);if(!rc.length)return;
 const r=await db.from("notifications").insert(rc.map(k=>({recipient_id:MID[k],actor_id:MID[S.user],entry_id:e.id,message:"{a} "+txt})));
 if(r.error)console.warn("Notification not sent:",r.error.message);}
async function markRead(id){const r=await db.from("notifications").update({is_read:true}).eq("id",id);if(r.error)console.warn(r.error.message);}
async function markAllRead(){const r=await db.from("notifications").update({is_read:true}).eq("recipient_id",MID[S.user]).eq("is_read",false);if(r.error)console.warn(r.error.message);}

/* ---- run a write, reload, redraw; shows the error if it fails ---- */
async function run(fn){if(S.busy)return false;S.busy=true;render();
 try{await fn();await loadAll();}catch(e){console.error(e);S.busy=false;toast("Couldn’t save: "+(e.message||e));return false;}
 S.busy=false;render();return true;}

/* ---- a quiet save, for the boxes in the detail blocks ----
   The box already shows the new value, so this writes in the background and
   only speaks up if it fails, putting the old value back. */
async function runSoft(fn,undo){try{await fn()}catch(err){console.error(err);if(undo)undo();render();toast("Couldn’t save: "+(err.message||err))}}

/* ---- live updates: reload when anyone changes something ---- */
let RT=null,LT=null;
function liveUpdates(){if(RT)return;
 RT=db.channel("cartier-os").on("postgres_changes",{event:"*",schema:"public"},()=>{clearTimeout(LT);LT=setTimeout(refresh,500);}).subscribe();}
async function refresh(){if(!S.in||S.busy)return;try{await loadAll();}catch(e){console.warn(e);return;}
 const a=document.activeElement,typing=a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
 if(!S.form&&!S.link&&!typing)render();} // never redraw under someone who is typing

/* ---- sign-in state ---- */
let AUTHING=false;
async function onAuth(ev,session){
 if(!session){if(RT){db.removeChannel(RT);RT=null;}Object.assign(S,{in:false,user:null,loading:false,open:null,form:null,link:null,pick:false,tab:"home",hcat:null,dview:null,search:false,noMember:null});render();return;}
 if(S.in||AUTHING)return;AUTHING=true;S.loading=true;render();
 try{await loadAll();}catch(e){AUTHING=false;S.loading=false;S.lgErr=/fetch/i.test(String(e.message||e))?"Couldn’t reach Supabase. Check your internet connection, then reload the page.":"Couldn’t load data: "+(e.message||e);render();return;}
 AUTHING=false;S.loading=false;
 const code=Object.keys(M).find(k=>MUSER[k]===session.user.id); // every member, including ones kept out of the people pickers
 if(!code){S.noMember=session.user.email||"This account";render();return;}
 Object.assign(S,{user:code,in:true,lgErr:"",noMember:null});liveUpdates();render();
 runAutomations();
}

/* ---- the automatic tasks (S5, S30) ----
   The database runs this every hour on its own. The app asks for one run when it
   opens too, so a task that has just come due appears straight away rather than
   at the top of the hour. It is idempotent, so asking twice costs nothing. */
let AUTORAN=false;
async function runAutomations(){if(AUTORAN)return;AUTORAN=true;
 try{const r=await db.rpc("run_automations");if(r.error)throw r.error;await loadAll();render();}
 catch(e){console.warn("Automatic tasks:",e.message||e);} // never block sign-in over this
}
