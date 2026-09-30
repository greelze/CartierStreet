"use strict";
/* ENTRY PANEL
   The full-screen entry page: status, Edit / Delete, Drive, details, relationships. */
/* ---- drawer ---- */
const DET={songs:[["Track ID","eid"],["Type","type"],["Artist","people"],["Tracklist","tracks"],["Start date","start"],["Release date","release"],["Final submission","final"]],
 content:[["Content ID","eid"],["Type","type"],["Platforms","platforms"],["Date & time","dt"],["Members","people"],["Venue","venue"],["Address","address"]],
 activities:[["Activity ID","eid"],["Type","type"],["Organizer","organizer"],["Date & time","dt"],["Members","people"],["Venue","venue"],["Address","address"]],
 gigs:[["Gig / event ID","eid"],["Type","type"],["Organizer","orgKind"],["Organizer name","orgName"],["Date & time","dt"],["Members","people"],["Venue","venue"],["Address","address"]],
 tasks:[["Task ID","eid"],["Description","desc"],["Assigned to","people"],["Due date","due"],["Priority","priority"],["Created by","by"]]};
function dv(e,k){const v=e[k];if(k==="dt")return fmtM(e.date)+" · "+ft(e.time);if(k==="people"||k==="organizer")return(v||[]).map(x=>H(mn(x))).join(", ");if(k==="by")return v?H(mn(v)):"";
 if(["start","release","final","due"].includes(k))return fmtM(v);if(k==="platforms")return H((v||[]).join(", "));
 if(k==="tracks")return v&&v.length?'<ol class="tl">'+v.map(x=>"<li>"+H(x)+"</li>").join("")+"</ol>":"";return H(v)}
function driveCard(e){const s=e.drive,c=(t,sub,btn)=>'<div class="card'+(s==="error"?" err":"")+'"><span><b>Google Drive</b><br><span class="mut" style="font-size:13px">'+sub+'</span></span>'+btn+'</div>',
 b=(l,a)=>'<button class="btn sm" data-act="'+a+'" data-id="'+e.id+'">'+l+'</button>';
 return s==="ok"?c(0,"Folder connected · "+e.driveFiles+" files",'<button class="btn sm" data-act="ext">Open folder</button>'):s==="creating"?c(0,"Creating folder…",""):s==="error"?c(0,"Couldn’t create the folder — access expired",b("Retry","drive")):c(0,"No folder yet",b("Create folder","drive"));}
function vRels(e){const u=S.user,r=relEntries(e.id,u),ed=canEdit(e,u);let h='<h4>Relationships'+(r.length?" · "+r.length+" linked":"")+'</h4>';
 if(!r.length)h+='<p class="mut">Nothing linked yet.</p>';
 ORDER.forEach(k=>r.filter(x=>x.cat===k).forEach(x=>{const dead=inTrash(x.id),o=nextOcc(x);
  h+='<div class="rel'+(dead?" dead":"")+'">'+ctag(x.cat)+'<div class="b"'+(dead?"":' data-act="open" data-id="'+x.id+'"')+'><b>'+H(x.title)+'</b><span>'+(dead?"In Trash · link paused":H(fmtS(o.date)+(o.time?" · "+ft(o.time):"")+" · "+sline(x)))+'</span></div>'+
  (ed&&!dead?'<button class="rm" data-act="unlink" data-a="'+e.id+'" data-b="'+x.id+'" aria-label="Remove link">×</button>':"")+'</div>'}));
 return h+(ed?'<div class="rbtns">'+REL_OK[e.cat].map(k=>'<button class="btn sm" data-act="newrel" data-c="'+k+'" data-id="'+e.id+'">+ New '+CAT[k].label.toLowerCase()+'</button>').join("")+'<button class="btn sm" data-act="linkex" data-id="'+e.id+'">Link existing…</button></div>':"");}
function vDrawer(){const e=live(S.open);if(!e)return"";const c=CAT[e.cat],t=tone(e.status),ed=canEdit(e,S.user),dd=days(TODAY,nextOcc(e).date),
 cd=dd===0?"Today":dd>0&&dd<=120?"In "+dd+" day"+(dd===1?"":"s"):dd<0?"Passed":"",
 sel=(k,v,o)=>'<select class="ss" data-st="'+k+'" aria-label="'+k+'">'+o.map(x=>"<option"+(x===v?" selected":"")+">"+H(x)+"</option>").join("")+"</select>";
 const stat=ed?sel("status",e.status,statusOptions(e.cat))+(e.cat==="songs"&&SONG_STATUS[e.status].length?sel("sub",e.sub,SONG_STATUS[e.status]):""):'<b style="color:'+t[0]+'">'+H(sline(e))+'</b>';
 const idx=PIPE.indexOf(e.status);
 const from=S.search?"Search":(TABS.find(t=>t[0]===S.tab)||[,"Home"])[1];
 return '<aside class="drawer" style="--cc:'+c.c+'" role="dialog" aria-modal="true" aria-label="'+H(e.title)+'">'+
 '<div class="dtop"><button class="back" data-act="close">'+sv('<path d="M19 12H5M11 6l-6 6 6 6"/>')+'<span>Back to '+from+'</span></button></div>'+
 '<div class="dwrap"><div class="dh">'+ctag(e.cat)+'<span class="eid">'+H(e.eid)+'</span><h2>'+H(e.title)+'</h2>'+
 '<div class="stat">'+stat+(cd?'<span class="cdn">'+cd+'</span>':"")+'</div>'+(e.cat==="songs"?'<div class="pipe">'+PIPE.map((s,i)=>'<i style="background:'+(i<=idx?t[0]:"#E4E1E8")+'"></i>').join("")+'</div>':"")+
 (ed?'<div class="acts"><button class="btn pri" data-act="edit" data-id="'+e.id+'">Edit</button><button class="btn dan" data-act="del" data-id="'+e.id+'">Delete</button></div>':'<div class="ro">View only — you are not on this entry.</div>')+'</div>'+
 '<div class="db"><div class="dfiles"><h4>Files &amp; resources</h4>'+driveCard(e)+'</div>'+
 '<div class="ddet"><h4>Details</h4><dl class="dl">'+DET[e.cat].map(f=>{const v=dv(e,f[1]);return v?"<dt>"+f[0]+"</dt><dd>"+v+"</dd>":""}).join("")+'</dl></div>'+
 '<div class="drel">'+vRels(e)+'</div></div></div></aside>';}