"use strict";
/* FORMS
   New-entry picker, link picker, create/edit form, save and delete. */
/* ---- modals ---- */
const CAT_ICON={songs:I.song,content:I.post,activities:I.ppl,gigs:I.mic,tasks:I.task}; // same icons as the Home cards
function vPick(){return '<div class="scrim s2" data-act="closepick"></div><div class="modal sm"><div class="mh"><h3 style="flex:1">What would you like to add?</h3><button class="x" data-act="closepick" aria-label="Close">×</button></div>'+
 ORDER.filter(k=>canCreate(k,S.user)).map(k=>'<button class="opt" data-act="newcat" data-c="'+k+'"><span class="oic" style="--cc:'+CAT[k].c+'">'+sv(CAT_ICON[k])+'</span><span><b>'+CAT[k].label+'</b><span>'+CAT[k].d+'</span></span></button>').join("")+'</div>';}
function vLink(){const src=byId(S.link),linked=DB.rels.filter(r=>r.a===src.id||r.b===src.id).map(r=>r.a===src.id?r.b:r.a);
 const l=sortByOcc(visible(S.user).filter(e=>relOk(src).includes(e.cat)&&e.id!==src.id&&!linked.includes(e.id)&&relOk(e).includes(src.cat)));
 return '<div class="scrim s2" data-act="closepick"></div><div class="modal sm"><div class="mh"><h3 style="flex:1">Link to “'+H(src.title)+'”</h3><button class="x" data-act="closepick" aria-label="Close">×</button></div>'+
 (l.length?l.map(e=>'<button class="opt" data-act="dolink" data-a="'+src.id+'" data-b="'+e.id+'">'+ctag(e.cat)+'<span><b>'+H(e.title)+'</b><span>'+H(e.eid+" · "+sline(e))+'</span></span></button>').join(""):empty("Nothing to link","No other entries you can access are available."))+
 '<p class="mut note" style="padding:0 24px 16px">Only records you can already open appear here.</p></div>';}
const EVT_F=[["date","Date","d"],["time","Time","tm"],["people","Members involved","p",MK],["status","Status","s",EVT_STATUS],["venue","Venue","v"],["address","Venue address","t"]];
const MIN_LEAD=24; // days between submitting to Cartier St. and release day (RQ7)
/* how many tracks each release type holds */
const TRACK_RULES={Single:{min:1,max:1,help:"One track. The title above is the release title."},EP:{min:2,max:6,help:"An EP has 2 to 6 tracks."},Album:{min:7,max:null,help:"An album has 7 tracks or more."}}; // Album max null = no cap (D6.2.2)
const FS={songs:[["past","Adding","pseg",PAST_OPTS],["title","Release title","t"],["type","Track type","seg",["Single","EP","Album"]],["tracks","Tracks","trk"],["people","Artists","p",ARTISTS],["status","Status","s",Object.keys(SONG_STATUS)],["sub","Sub-status","sub"],["release","Release date","d"]],
 /* S18: a post has no venue — a shoot for it is an Activity linked to the post */
 content:[["title","Content title","t"],["type","Type","s",CONTENT_TYPES],["platforms","Platforms","p",PLATFORMS],
  ["account","Account","s",ACCOUNTS],["date","Date","d"],["time","Time","tm"],["people","Members involved","p",MK],
  ["status","Status","s",CONTENT_STATUS]],
 activities:[["title","Name / title","t"],["type","Type","s",ACT_TYPES],["asklink","","ask"],["organizer","Organizer","p",MK]].concat(EVT_F),
 gigs:[["title","Name / title","t"],["type","Type","g"],["orgKind","Organizer","s",ORG_KINDS],["orgName","Organizer name","t"]].concat(EVT_F.map(f=>f[0]==="status"?["status","Status","s",GIG_STATUS]:f)),
 tasks:[["title","Task title","t"],["desc","Description","a"],["people","Assigned to","p",MK],["due","Due date","d"],["dueTime","Time","tm"],["status","Status","s",TASK_STATUS],["priority","Priority","s",PRIORITY]]};
function fld(f){const k=f[0],t=f[2],F=S.form,v=F[k],er=F.errs[k],opt=(x,c)=>"<option"+(x===c?" selected":"")+">"+H(x)+"</option>";let h,o=f[3];
 if(t==="trk"&&F.type==="Single")return"";if(t==="sub"&&!(SONG_STATUS[F.status]||[]).length)return"";
 if(F.cat==="tasks"&&k==="status"&&F.mode!=="edit")return"";              // S31 decides it, so it is not asked
 if(t==="ask"){ // S27: only asked when a new activity of that type is being made
  const a=ASK_LINK[F.type];if(!a||F.mode==="edit")return"";
  const l=sortByOcc(visible(S.user).filter(x=>x.cat===a[0]));
  return '<div class="fld full"><b>'+a[1]+'</b><select data-f="ctx"><option value="">'+H(NO_LINK)+'</option>'+
   l.map(x=>'<option value="'+x.id+'"'+(F.ctx===x.id?" selected":"")+'>'+H(x.title)+'</option>').join("")+'</select>'+
   '<p class="hintline">It will be linked, so the session shows on both.</p></div>';}
 if(F.cat==="songs"&&F.past&&(k==="status"||k==="sub"))return"";           // F5.2: it is already out
 if(t==="pseg"&&F.mode==="edit")return"";                                  // only asked when it is first added
 if(k==="orgName"&&F.orgKind==="Cartier St. Organized")return""; // our own gig: the organizer is us (S14)
 if(k==="status"&&t==="s")o=statusOptions(F.cat,F); // e.g. Awaiting Payment only on booked gigs (S12)
 if(t==="t")h='<input data-f="'+k+'" value="'+H(v)+'">';else if(t==="a"||t==="tr")h='<textarea rows="4" data-f="'+k+'">'+H(v)+'</textarea>';
 else if(t==="d"||t==="tm")h='<input type="'+(t==="d"?"date":"time")+'" data-f="'+k+'"'+(k==="release"&&F.cat==="songs"?(F.past?' max="'+TODAY+'"':' min="'+addD(TODAY,MIN_LEAD)+'"'):"")+' value="'+H(v)+'">';
 else if(t==="seg")h='<div class="seg" role="radiogroup" aria-label="'+f[1]+'">'+o.map(x=>'<button type="button" role="radio" aria-checked="'+(x===v)+'" class="'+(x===v?"on":"")+'" data-act="songtype" data-v="'+x+'">'+x+'</button>').join("")+'</div><p class="hintline">'+TRACK_RULES[v].help+'</p>';
 else if(t==="pseg"){const on=x=>(x===PAST_OPTS[1])===!!F.past; // F5.2
  h='<div class="seg" role="radiogroup" aria-label="'+f[1]+'">'+o.map(x=>'<button type="button" role="radio" aria-checked="'+on(x)+'" class="'+(on(x)?"on":"")+'" data-act="pastseg" data-v="'+x+'">'+x+'</button>').join("")+'</div><p class="hintline">'+(F.past?"It is already out, so it goes straight to Released and skips the Cartier St. review.":"It will go through the usual steps and the Cartier St. review.")+'</p>';}
 else if(t==="trk")h=trackList(F);
 else if(t==="s")h='<select data-f="'+k+'">'+o.map(x=>opt(x,v)).join("")+'</select>';else if(t==="sub")h='<select data-f="sub">'+SONG_STATUS[F.status].map(x=>opt(x,v)).join("")+'</select>';
 else if(t==="v")h='<select data-f="venue">'+VENUES.map(x=>opt(x[0],v)).join("")+'</select>';
 else if(t==="g")h='<select data-f="type">'+GIG_TYPES.map(g=>'<optgroup label="'+g[0]+'">'+g[1].map(x=>opt(x,v)).join("")+'</optgroup>').join("")+'</select>';
 else h='<div class="pk">'+o.map(x=>'<label><input type="checkbox" data-f="'+k+'" value="'+x+'"'+((v||[]).includes(x)?" checked":"")+"><span>"+H(M[x]?M[x].n:x)+"</span></label>").join("")+"</div>";
 return '<div class="fld'+(["s","d","tm","v","sub"].includes(t)?"":" full")+'"><b>'+f[1]+'</b>'+h+(er?'<div class="e">'+er+"</div>":"")+"</div>";}
/* the track editor for EPs and albums: numbered rows, move up / down, remove, add, and a progress bar */
function trackList(F){const R=TRACK_RULES[F.type],mx=R.max,tr=F.tracks||(F.tracks=[]),n=tr.length,full=!!mx&&n>=mx,up=sv('<path d="m7 14 5-5 5 5"/>'),dn=sv('<path d="m7 10 5 5 5-5"/>');
 return tr.map((x,i)=>'<div class="trk"><span class="tn">'+(i+1)+'</span><input data-trk="'+i+'" value="'+H(x)+'" placeholder="Track title" aria-label="Track '+(i+1)+' title">'+
  '<span class="tmv"><button type="button" data-act="trkmv" data-i="'+i+'" data-d="-1" aria-label="Move track '+(i+1)+' up"'+(i===0?" disabled":"")+'>'+up+'</button><button type="button" data-act="trkmv" data-i="'+i+'" data-d="1" aria-label="Move track '+(i+1)+' down"'+(i===n-1?" disabled":"")+'>'+dn+'</button></span>'+
  '<button type="button" class="tdel" data-act="trkdel" data-i="'+i+'" aria-label="Remove track '+(i+1)+'">×</button></div>').join("")+
 '<button type="button" class="tadd" data-act="trkadd"'+(full?" disabled":"")+'>'+(full?"That’s the most "+(F.type==="EP"?"an EP":"an album")+" can have ("+mx+")":"+ Add track")+'</button>'+
 '<div class="tmeter'+(mx&&n>mx?" over":"")+'"><span>'+(mx?n+" of "+mx:n+(n===1?" track":" tracks"))+'</span><i><b style="width:'+Math.min(100,n/(mx||R.min)*100)+'%"></b></i><em>'+F.type.toUpperCase()+'</em></div>';}
function vForm(){const f=S.form,c=CAT[f.cat],ed=f.mode==="edit",ctx=f.ctx&&byId(f.ctx);
 return '<div class="scrim s2" data-act="cancel"></div><div class="modal" role="dialog" aria-label="'+(ed?"Edit ":"New ")+c.label+'"><div class="mh"><h3 style="flex:1">'+(ed?"Edit ":"New ")+c.label.toLowerCase()+'</h3><button class="x" data-act="cancel" aria-label="Close">×</button></div>'+
 (ctx?'<div class="ctx">Will be linked to <b>'+H(ctx.title)+"</b></div>":"")+'<div class="mb">'+FS[f.cat].map(fld).join("")+'</div><div class="mf"><span style="margin-right:auto"></span><button class="btn" data-act="cancel">Cancel</button><button class="btn pri" data-act="save"'+(S.busy?" disabled":"")+'>'+(S.busy?"Saving…":ed?"Save changes":"Create "+c.label.toLowerCase())+"</button></div></div>";}
function blank(cat,ctx){const f={cat,mode:"new",ctx:ctx||null,people:[],title:"",errs:{}},v0=VENUES.find(v=>v[0]==="Cartier St.")||VENUES[0]||["",""],ev={date:S.ppDate||TODAY,time:"18:00",status:"Planning/Organizing",venue:v0[0],address:v0[1]};
 if(cat==="songs")Object.assign(f,{past:false,type:"Single",status:"Not Started",sub:"Not Started",tracks:[],start:TODAY,release:addD(TODAY,90),final:addD(TODAY,90-MIN_LEAD)});
 if(cat==="content")Object.assign(f,ev,{status:"Planning",type:"Video",platforms:[],account:ACCOUNTS[0],phase:S.ppPhase||"",links:[]});if(cat==="activities")Object.assign(f,ev,{type:"Recording Session",organizer:[S.user]});
 if(cat==="gigs")Object.assign(f,ev,{type:"Club/Bar Gig",typeNote:"Performing",orgKind:ORG_KINDS[0],orgName:"Cartier St.",status:"Inquiry"});
 if(cat==="tasks")Object.assign(f,{desc:"",due:addD(TODAY,7),dueTime:"",status:"Not Started",priority:"Medium",need:false});return f;}
function validate(f){const r=f.errs={},all=f.tracks||[],tr=all.filter(x=>x.trim()).length,R=TRACK_RULES[f.type];
 if(!f.title.trim())r.title="Give this a name";if(f.cat==="songs"){if(!f.people.length)r.people="Pick at least one artist";
  if(f.type!=="Single"){const nm=f.type==="EP"?"An EP":"An album";
   if(R.max&&all.length>R.max)r.tracks=nm+" can have up to "+R.max+" tracks. Remove "+(all.length-R.max)+".";
   else if(tr<R.min)r.tracks=nm+" needs at least "+R.min+" tracks. Type a title in each row.";}
  const was=f.mode==="edit"&&live(f.id); // an existing date is left alone; only a new or changed one must clear 24 days
  if(f.past){if(!f.release||f.release>TODAY)r.release="A past release needs a date that has already happened.";} // F5.2
  else if(f.release&&(!was||was.release!==f.release)&&days(TODAY,f.release)<MIN_LEAD)r.release="A release needs "+MIN_LEAD+" days to be submitted and pitched. Pick "+fmtM(addD(TODAY,MIN_LEAD))+" or later.";}
 if(f.cat==="content"){if(!f.platforms.length)r.platforms="Pick at least one platform";if(!f.account)r.account="Pick whose account this goes on";}if(f.cat==="tasks"&&!f.people.length)r.people="Assign this to someone";return!Object.keys(r).length;}
async function save(){const f=S.form;if(S.busy)return;if(!validate(f)){render();return toast("Check the highlighted fields")}
 if(f.cat==="gigs"&&f.orgKind==="Cartier St. Organized")f.orgName="Cartier St."; // S14
 const tr=(f.tracks||[]).map(x=>x.trim()).filter(Boolean),o=Object.assign({},f);["mode","errs","ctx","tracksTxt"].forEach(k=>delete o[k]);if(f.cat==="songs"){o.tracks=f.type==="Single"?[]:tr;o.start=o.start||TODAY;o.final=o.release?addD(o.release,-MIN_LEAD):"";
  if(o.past){o.status="Released";o.sub="Released";}} // empty rows are skipped; start and final submission are set for you (D6.2.2); a past release is already out (F5.2)
 if(f.cat==="tasks"&&f.mode!=="edit"){ // S31
  o.need=needsApproval(S.user,o.people);
  o.status=o.need?"Not Started":(o.people.length===1&&o.people[0]===S.user&&!isAdmin(S.user)?"In Progress":"Not Started");}
 if(f.mode==="edit"){const before=live(f.id)||{people:[],organizer:[]},was=before.people.concat(before.organizer||[]),
   added=o.people.concat(o.organizer||[]).filter(p=>!was.includes(p));
  if(!await run(()=>updateEntry(o)))return;S.form=null;S.open=null;const e=live(f.id); // saved: close the form and the entry page
  if(e){notify(e,"updated **"+o.title+"**",recips(e).filter(k=>!added.includes(k)));if(added.length)notify(e,"added you to **"+o.title+"**",added);}
  return toast(CAT[f.cat].label+" updated");}
 let id;if(!await run(async()=>{id=await createEntry(o,f.ctx)}))return;S.form=null;const e=live(id),ctx=f.ctx&&byId(f.ctx);S.open=e?id:null;
 if(e){notify(e,"added you to **"+o.title+"**",o.people.concat(o.organizer||[]));if(ctx)notify(e,"linked **"+o.title+"** to **"+ctx.title+"**");}
 toast(CAT[f.cat].label+" created"+(f.ctx?" and linked":""));}
async function del(id){const e=live(id);if(!e)return;if(!await run(()=>trashEntry(id)))return;S.open=null;notify(e,"deleted **"+e.title+"**");toast("“"+e.title+"” moved to Trash",id);}
async function restore(id){const e=DB.trash.find(x=>x.id===id);if(e&&!canEdit(e,S.user))return toast("Only "+mn(e.by)+" or an admin can restore this");
 if(await run(()=>restoreEntry(id)))toast("Restored · relationships reconnected");}