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
  MID[m.code]=m.id;MUSER[m.code]=m.user_id;MCODE[m.id]=m.code;MK.push(m.code);M[m.code].art=m.is_artist??!m.is_admin;if(M[m.code].art)ARTISTS.push(m.code);}); // Artists list = members marked is_artist

 // social links → M[code].links and LABEL_LINKS (Cartier St. itself)
 clear(LABEL_LINKS);soc.forEach(r=>{const c=MCODE[r.member_id];if(c)M[c].links=r;else Object.assign(LABEL_LINKS,r);});

 // venues → VENUES
 VENUES.length=0;clear(VID);clear(VNAME);
 ven.sort((a,b)=>a.name.localeCompare(b.name)).forEach(v=>{VENUES.push([v.name,v.address]);VID[v.name]=v.id;VNAME[v.id]=v.name;});

 // entries + their detail rows, people and tracklists
 const byEntry=rows=>Object.fromEntries(rows.map(r=>[r.entry_id,r]));
 const sub={songs:byEntry(son),content:byEntry(con),activities:byEntry(act),gigs:byEntry(gig),tasks:byEntry(tsk)};
 const tracks={};trk.sort((a,b)=>a.position-b.position).forEach(t=>(tracks[t.song_id]=tracks[t.song_id]||[]).push(t.title));
 const ppl={};em.forEach(r=>{const x=ppl[r.entry_id]=ppl[r.entry_id]||{people:[],organizer:[]},c=MCODE[r.member_id];if(c)x[r.role==="organizer"?"organizer":"people"].push(c);});
 const ord=a=>a.sort((x,y)=>MK.indexOf(x)-MK.indexOf(y));
 const all=ent.map(r=>{const p=ppl[r.id]||{people:[],organizer:[]};return toEntry(r,sub[r.category][r.id]||{},ord(p.people),ord(p.organizer),tracks[r.id]||[],MCODE);});
 DB.entries=all.filter(e=>!e.deletedAt);
 DB.trash=all.filter(e=>e.deletedAt).sort((a,b)=>b.deletedAt.localeCompare(a.deletedAt));
 DB.rels=lnk.map(l=>({id:l.id,a:l.entry_a,b:l.entry_b}));
 DB.notifs=ntf.map(n=>({id:n.id,actor:MCODE[n.actor_id]||null,ref:n.entry_id,unread:n.is_read?0:1,txt:n.message,g:ngroup(n.created_at),w:nwhen(n.created_at)}));
}

/* one database row → the entry shape the pages already use */
function toEntry(r,s,people,organizer,tracks,MCODE){
 const e={id:r.id,eid:r.eid,cat:r.category,title:r.title,status:r.status,by:MCODE[r.created_by]||null,
  drive:r.drive_status||"none",driveFiles:r.drive_file_count||0,deletedAt:r.deleted_at,people,organizer};
 const ev={date:s.event_date||"",time:hhmm(s.event_time),venue:VNAME[s.venue_id]||"",address:s.address||""};
 if(r.category==="songs")Object.assign(e,{type:s.release_type||"Single",sub:s.sub_status||r.status,start:s.start_date||"",release:s.release_date||"",final:s.final_submission_date||"",tracks});
 if(r.category==="content")Object.assign(e,ev,{type:s.content_type||"Video",platforms:s.platforms||[]});
 if(r.category==="activities")Object.assign(e,ev,{type:s.activity_type||"Other"});
 if(r.category==="gigs")Object.assign(e,ev,{type:s.gig_type||"Other",typeNote:s.gig_group||"",orgKind:s.organizer_kind||"",orgName:s.organizer_name||""});
 if(r.category==="tasks")Object.assign(e,{desc:s.description||"",due:s.due_date||"",priority:s.priority||"Medium"});
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
 return {songs:{release_type:o.type,sub_status:o.sub||o.status,start_date:o.start||null,release_date:o.release||null,final_submission_date:o.final||null},
  content:Object.assign({content_type:o.type,platforms:o.platforms},ev),
  activities:Object.assign({activity_type:o.type},ev),
  gigs:Object.assign({gig_type:o.type,gig_group:o.typeNote,organizer_kind:o.orgKind,organizer_name:o.orgName||null},ev),
  tasks:{description:o.desc||null,due_date:o.due||null,priority:o.priority}}[o.cat];}

/* people on an entry: add the new ones first, then remove the rest (so you never lock yourself out mid-save) */
async function syncMembers(id,o){
 const want=(o.people||[]).map(c=>({entry_id:id,member_id:MID[c],role:"member"})).concat((o.organizer||[]).map(c=>({entry_id:id,member_id:MID[c],role:"organizer"}))).filter(r=>r.member_id);
 if(want.length)must(await db.from("entry_members").upsert(want,{onConflict:"entry_id,member_id,role",ignoreDuplicates:true}));
 for(const role of ["member","organizer"]){const keep=want.filter(r=>r.role===role).map(r=>r.member_id);
  let q=db.from("entry_members").delete().eq("entry_id",id).eq("role",role);if(keep.length)q=q.not("member_id","in","("+keep.join(",")+")");must(await q);}
}
async function syncTracks(id,tracks){must(await db.from("song_tracks").delete().eq("song_id",id));
 if(tracks.length)must(await db.from("song_tracks").insert(tracks.map((t,i)=>({song_id:id,position:i+1,title:t}))));}

/* ---- writes ---- */
async function createEntry(o,ctx){let row,err;
 for(let i=0;i<10;i++){const r=await db.from("entries").insert({eid:nextEid(o.cat,i),category:o.cat,title:o.title.trim(),status:o.status,created_by:MID[S.user]}).select().single();
  row=r.data;err=r.error;if(!err||err.code!=="23505")break;} // 23505 = that ID was just taken; try the next one
 if(err)throw err;
 try{must(await db.from(o.cat).insert(Object.assign({entry_id:row.id},subRow(o))));
  if(o.cat==="songs"&&o.tracks.length)await syncTracks(row.id,o.tracks);
  await syncMembers(row.id,o);
  if(ctx)must(await db.from("entry_links").insert({entry_a:ctx,entry_b:row.id,created_by:MID[S.user]}));
 }catch(e){await db.from("entries").delete().eq("id",row.id);throw e;} // don't leave a half-saved entry behind
 return row.id;}
async function updateEntry(o){
 must(await db.from("entries").update({title:o.title.trim(),status:o.status}).eq("id",o.id));
 must(await db.from(o.cat).upsert(Object.assign({entry_id:o.id},subRow(o))));
 if(o.cat==="songs")await syncTracks(o.id,o.tracks);
 await syncMembers(o.id,o);}
async function setStatus(e,status,sub){must(await db.from("entries").update({status}).eq("id",e.id));
 if(e.cat==="songs")must(await db.from("songs").update({sub_status:sub}).eq("entry_id",e.id));}
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
 const code=MK.find(k=>MUSER[k]===session.user.id);
 if(!code){S.noMember=session.user.email||"This account";render();return;}
 Object.assign(S,{user:code,in:true,lgErr:"",noMember:null});liveUpdates();render();
}
