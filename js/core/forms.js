"use strict";
/* FORMS
   New-entry picker, link picker, create/edit form, save and delete. */
/* ---- modals ---- */
const CAT_ICON={songs:I.song,content:I.post,activities:I.ppl,gigs:I.mic,tasks:I.task}; // same icons as the Home cards
function vPick(){return '<div class="scrim s2" data-act="closepick"></div><div class="modal sm"><div class="mh"><h3 style="flex:1">What would you like to add?</h3><button class="x" data-act="closepick" aria-label="Close">×</button></div>'+
 ORDER.map(k=>'<button class="opt" data-act="newcat" data-c="'+k+'"><span class="oic" style="--cc:'+CAT[k].c+'">'+sv(CAT_ICON[k])+'</span><span><b>'+CAT[k].label+'</b><span>'+CAT[k].d+'</span></span></button>').join("")+'</div>';}
function vLink(){const src=byId(S.link),linked=DB.rels.filter(r=>r.a===src.id||r.b===src.id).map(r=>r.a===src.id?r.b:r.a);
 const l=sortByOcc(visible(S.user).filter(e=>REL_OK[src.cat].includes(e.cat)&&e.id!==src.id&&!linked.includes(e.id)));
 return '<div class="scrim s2" data-act="closepick"></div><div class="modal sm"><div class="mh"><h3 style="flex:1">Link to “'+H(src.title)+'”</h3><button class="x" data-act="closepick" aria-label="Close">×</button></div>'+
 (l.length?l.map(e=>'<button class="opt" data-act="dolink" data-a="'+src.id+'" data-b="'+e.id+'">'+ctag(e.cat)+'<span><b>'+H(e.title)+'</b><span>'+H(e.eid+" · "+sline(e))+'</span></span></button>').join(""):empty("Nothing to link","No other entries you can access are available."))+
 '<p class="mut note" style="padding:0 24px 16px">Only records you can already open appear here.</p></div>';}
const EVT_F=[["date","Date","d"],["time","Time","tm"],["people","Members involved","p",MK],["status","Status","s",EVT_STATUS],["venue","Venue","v"],["address","Venue address","t"]];
/* how many songs each release type holds */
const TRACK_RULES={Single:{min:1,max:1,help:"One song. The title above is the song’s name."},EP:{min:2,max:6,help:"An EP has 2 to 6 songs."},Album:{min:7,max:12,help:"An album has 7 to 12 songs."}};
const FS={songs:[["title","Track / release title","t"],["type","Track type","seg",["Single","EP","Album"]],["tracks","Tracks","trk"],["people","Artists","p",ARTISTS],["status","Status","s",Object.keys(SONG_STATUS)],["sub","Sub-status","sub"],["start","Start date","d"],["release","Release date","d"],["final","Final submission","d"]],
 content:[["title","Content title","t"],["type","Type","s",CONTENT_TYPES],["platforms","Platforms","p",PLATFORMS]].concat(EVT_F),
 activities:[["title","Name / title","t"],["type","Type","s",ACT_TYPES],["organizer","Organizer","p",MK]].concat(EVT_F),
 gigs:[["title","Name / title","t"],["type","Type","g"],["orgKind","Organizer","s",ORG_KINDS],["orgName","Organizer name","t"]].concat(EVT_F.map(f=>f[0]==="status"?["status","Status","s",GIG_STATUS]:f)),
 tasks:[["title","Task title","t"],["desc","Description","a"],["people","Assigned to","p",MK],["due","Due date","d"],["status","Status","s",TASK_STATUS],["priority","Priority","s",PRIORITY]]};
function fld(f){const k=f[0],t=f[2],o=f[3],F=S.form,v=F[k],er=F.errs[k],opt=(x,c)=>"<option"+(x===c?" selected":"")+">"+H(x)+"</option>";let h;
 if(t==="trk"&&F.type==="Single")return"";if(t==="sub"&&!(SONG_STATUS[F.status]||[]).length)return"";
 if(t==="t")h='<input data-f="'+k+'" value="'+H(v)+'">';else if(t==="a"||t==="tr")h='<textarea rows="4" data-f="'+k+'">'+H(v)+'</textarea>';
 else if(t==="d"||t==="tm")h='<input type="'+(t==="d"?"date":"time")+'" data-f="'+k+'" value="'+H(v)+'">';
 else if(t==="seg")h='<div class="seg" role="radiogroup" aria-label="'+f[1]+'">'+o.map(x=>'<button type="button" role="radio" aria-checked="'+(x===v)+'" class="'+(x===v?"on":"")+'" data-act="songtype" data-v="'+x+'">'+x+'</button>').join("")+'</div><p class="hintline">'+TRACK_RULES[v].help+'</p>';
 else if(t==="trk")h=trackList(F);
 else if(t==="s")h='<select data-f="'+k+'">'+o.map(x=>opt(x,v)).join("")+'</select>';else if(t==="sub")h='<select data-f="sub">'+SONG_STATUS[F.status].map(x=>opt(x,v)).join("")+'</select>';
 else if(t==="v")h='<select data-f="venue">'+VENUES.map(x=>opt(x[0],v)).join("")+'</select>';
 else if(t==="g")h='<select data-f="type">'+GIG_TYPES.map(g=>'<optgroup label="'+g[0]+'">'+g[1].map(x=>opt(x,v)).join("")+'</optgroup>').join("")+'</select>';
 else h='<div class="pk">'+o.map(x=>'<label><input type="checkbox" data-f="'+k+'" value="'+x+'"'+((v||[]).includes(x)?" checked":"")+"><span>"+H(M[x]?M[x].n:x)+"</span></label>").join("")+"</div>";
 return '<div class="fld'+(["s","d","tm","v","sub"].includes(t)?"":" full")+'"><b>'+f[1]+'</b>'+h+(er?'<div class="e">'+er+"</div>":"")+"</div>";}
/* the track editor for EPs and albums: numbered rows, move up / down, remove, add, and a progress bar */
function trackList(F){const R=TRACK_RULES[F.type],tr=F.tracks||(F.tracks=[]),n=tr.length,full=n>=R.max,up=sv('<path d="m7 14 5-5 5 5"/>'),dn=sv('<path d="m7 10 5 5 5-5"/>');
 return tr.map((x,i)=>'<div class="trk"><span class="tn">'+(i+1)+'</span><input data-trk="'+i+'" value="'+H(x)+'" placeholder="Track title" aria-label="Track '+(i+1)+' title">'+
  '<span class="tmv"><button type="button" data-act="trkmv" data-i="'+i+'" data-d="-1" aria-label="Move track '+(i+1)+' up"'+(i===0?" disabled":"")+'>'+up+'</button><button type="button" data-act="trkmv" data-i="'+i+'" data-d="1" aria-label="Move track '+(i+1)+' down"'+(i===n-1?" disabled":"")+'>'+dn+'</button></span>'+
  '<button type="button" class="tdel" data-act="trkdel" data-i="'+i+'" aria-label="Remove track '+(i+1)+'">×</button></div>').join("")+
 '<button type="button" class="tadd" data-act="trkadd"'+(full?" disabled":"")+'>'+(full?"That’s the most "+(F.type==="EP"?"an EP":"an album")+" can have ("+R.max+")":"+ Add track")+'</button>'+
 '<div class="tmeter'+(n>R.max?" over":"")+'"><span>'+n+" of "+R.max+'</span><i><b style="width:'+Math.min(100,n/R.max*100)+'%"></b></i><em>'+F.type.toUpperCase()+'</em></div>';}
function vForm(){const f=S.form,c=CAT[f.cat],ed=f.mode==="edit",ctx=f.ctx&&byId(f.ctx);
 return '<div class="scrim s2" data-act="cancel"></div><div class="modal" role="dialog" aria-label="'+(ed?"Edit ":"New ")+c.label+'"><div class="mh"><h3 style="flex:1">'+(ed?"Edit ":"New ")+c.label.toLowerCase()+'</h3><button class="x" data-act="cancel" aria-label="Close">×</button></div>'+
 (ctx?'<div class="ctx">Will be linked to <b>'+H(ctx.title)+"</b></div>":"")+'<div class="mb">'+FS[f.cat].map(fld).join("")+'</div><div class="mf"><span style="margin-right:auto"></span><button class="btn" data-act="cancel">Cancel</button><button class="btn pri" data-act="save"'+(S.busy?" disabled":"")+'>'+(S.busy?"Saving…":ed?"Save changes":"Create "+c.label.toLowerCase())+"</button></div></div>";}
function blank(cat,ctx){const f={cat,mode:"new",ctx:ctx||null,people:[],title:"",errs:{}},v0=VENUES.find(v=>v[0]==="Cartier St.")||VENUES[0]||["",""],ev={date:TODAY,time:"18:00",status:"Planning/Organizing",venue:v0[0],address:v0[1]};
 if(cat==="songs")Object.assign(f,{type:"Single",status:"Not Started",sub:"Not Started",tracks:[],start:TODAY,release:addD(TODAY,90),final:addD(TODAY,60)});
 if(cat==="content")Object.assign(f,ev,{type:"Video",platforms:[]});if(cat==="activities")Object.assign(f,ev,{type:"Creative Session",organizer:[S.user]});
 if(cat==="gigs")Object.assign(f,ev,{type:"Club/Bar Gig",typeNote:"Gig / Performance",orgKind:ORG_KINDS[0],orgName:"Cartier St.",status:"Inquiry"});
 if(cat==="tasks")Object.assign(f,{desc:"",due:addD(TODAY,7),status:"Not Started",priority:"Medium"});return f;}
function validate(f){const r=f.errs={},all=f.tracks||[],tr=all.filter(x=>x.trim()).length,R=TRACK_RULES[f.type];
 if(!f.title.trim())r.title="Give this a name";if(f.cat==="songs"){if(!f.people.length)r.people="Pick at least one artist";
  if(f.type!=="Single"){const nm=f.type==="EP"?"An EP":"An album";
   if(all.length>R.max)r.tracks=nm+" can have up to "+R.max+" songs. Remove "+(all.length-R.max)+".";
   else if(tr<R.min)r.tracks=nm+" needs at least "+R.min+" songs. Type a title in each row.";}}
 if(f.cat==="content"&&!f.platforms.length)r.platforms="Pick at least one platform";if(f.cat==="tasks"&&!f.people.length)r.people="Assign this to someone";return!Object.keys(r).length;}
async function save(){const f=S.form;if(S.busy)return;if(!validate(f)){render();return toast("Check the highlighted fields")}
 const tr=(f.tracks||[]).map(x=>x.trim()).filter(Boolean),o=Object.assign({},f);["mode","errs","ctx","tracksTxt"].forEach(k=>delete o[k]);if(f.cat==="songs")o.tracks=f.type==="Single"?[]:tr; // empty rows are skipped
 if(f.mode==="edit"){const before=live(f.id)||{people:[],organizer:[]},was=before.people.concat(before.organizer||[]),
   added=o.people.concat(o.organizer||[]).filter(p=>!was.includes(p));
  if(!await run(()=>updateEntry(o)))return;S.form=null;S.open=null;const e=live(f.id); // saved: close the form and the entry page
  if(e){notify(e,"updated **"+o.title+"**",recips(e).filter(k=>!added.includes(k)));if(added.length)notify(e,"added you to **"+o.title+"**",added);}
  return toast(CAT[f.cat].label+" updated");}
 let id;if(!await run(async()=>{id=await createEntry(o,f.ctx)}))return;S.form=null;const e=live(id),ctx=f.ctx&&byId(f.ctx);S.open=e?id:null;
 if(e){notify(e,"added you to **"+o.title+"**",o.people.concat(o.organizer||[]));if(ctx)notify(e,"linked **"+o.title+"** to **"+ctx.title+"**");}
 toast(CAT[f.cat].label+" created"+(f.ctx?" and linked":""));}
async function del(id){const e=live(id);if(!e)return;if(!await run(()=>trashEntry(id)))return;S.open=null;notify(e,"deleted **"+e.title+"**");toast("“"+e.title+"” moved to Trash",id);}
async function restore(id){if(await run(()=>restoreEntry(id)))toast("Restored · relationships reconnected");}