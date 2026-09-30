"use strict";
/* SETTINGS PAGE
   HTML: built by vSettings() below. CSS: css/pages/settings.css (shared styles: css/base.css). */
const SOCIALS=[["spotify","Spotify"],["apple_music","Apple Music"],["youtube","YouTube"],["facebook","Facebook"],["instagram","Instagram"],["tiktok","TikTok"]];
Object.assign(S,{elinks:null,ldraft:{}}); // which artist's links are being edited, and the typed values
function vSettings(){const u=S.user,l=visible(u);return '<div class="ph"><h1>Settings</h1></div><div class="prof">'+av(u,64)+'<div><h3 style="font-size:22px">'+H(M[u].n)+'</h3><p class="mut">'+(isAdmin(u)?"Admin":"Artist")+' · Cartier St.</p></div></div>'+
 sh("Visible to you")+ORDER.map(k=>'<div class="kv"><span>'+CAT[k].pl+'</span><b>'+l.filter(e=>e.cat===k).length+'</b></div>').join("")+'<div class="kv"><span>Total</span><b>'+l.length+'</b></div>'+
 '<p class="mut note">'+(isAdmin(u)?"Admins see every record in the collective.":"You only see entries you’re assigned to or involved in.")+'</p>'+
 sh("Trash",DB.trash.length||"Empty")+DB.trash.map(e=>'<div class="tr">'+ctag(e.cat)+'<span class="b"><b>'+H(e.title)+'</b><br><span class="mut" style="font-size:13px">'+H(e.eid)+' · '+Math.max(0,30-Math.floor((Date.now()-Date.parse(e.deletedAt))/864e5))+' days left</span></span><button class="btn sm" data-act="restore" data-id="'+e.id+'">Restore</button><button class="btn sm dan" data-act="purge" data-id="'+e.id+'">Delete</button></div>').join("")+
 '<p class="mut note">Deleted entries stay recoverable for 30 days.</p>'+vArtistLinks()+'<div style="margin-top:30px;display:flex;gap:10px"><button class="btn dan" data-act="logout">Log out</button><button class="btn" data-act="reload">Refresh data</button></div>';}

/* ---- artist links ---- */
function vArtistLinks(){const adm=isAdmin(S.user),
 one=k=>({key:k,name:mn(k),code:k,links:M[k].links||{},id:(M[k].links||{}).id||null,mid:MID[k]}),
 rows=adm?[{key:"label",name:"Cartier St. (the collective)",links:LABEL_LINKS,id:LABEL_LINKS.id||null,mid:null}].concat(ARTISTS.map(one))
        :M[S.user].art?[one(S.user)]:[]; // artists only see their own links
 if(!rows.length)return"";
 return sh(adm?"Artist links":"Your links",adm?rows.length:"")+'<p class="mut note" style="margin:0 0 10px">Tap a button to open that page.'+(adm?" Admins can edit the links here.":" Ask an admin to change them.")+'</p>'+
 rows.map(r=>{const have=SOCIALS.filter(([k])=>r.links[k]),miss=SOCIALS.length-have.length;
  if(S.elinks===r.key)return '<div class="alk edit"><div class="alh"><b>'+H(r.name)+'</b></div>'+
   SOCIALS.map(([k,label])=>'<label class="lkf"><b>'+label+'</b><input type="url" data-lk="'+k+'" value="'+H(S.ldraft[k]||"")+'" placeholder="https://…"></label>').join("")+
   '<div class="rbtns"><button class="btn pri sm" data-act="lsave" data-id="'+(r.id||"")+'" data-m="'+(r.mid||"")+'"'+(S.busy?" disabled":"")+'>'+(S.busy?"Saving…":"Save links")+'</button><button class="btn sm" data-act="lcancel">Cancel</button></div></div>';
  return '<div class="alk">'+(r.code?av(r.code,34):'<span class="av lab" style="width:34px;height:34px;font-size:12px">CS</span>')+
   '<div class="alb"><b>'+H(r.name)+'</b><div class="lks">'+(have.length?have.map(([k,label])=>'<span class="lkw"><a class="lk" href="'+H(r.links[k])+'" target="_blank" rel="noopener noreferrer">'+label+'</a><button class="cpy" data-act="lcopy" data-u="'+H(r.links[k])+'" data-l="'+label+'" title="Copy '+label+' link" aria-label="Copy '+label+' link">'+sv(I.copy)+'</button></span>').join(""):'<span class="mut">No links yet</span>')+
   (miss?'<span class="mut" style="font-size:13px">'+miss+' missing</span>':"")+'</div></div>'+
   (adm?'<button class="btn sm" data-act="ledit" data-k="'+r.key+'">Edit</button>':"")+'</div>';}).join("");}

/* copy a link to the clipboard (the fallback covers browsers without clipboard access) */
function copyText(txt){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(txt).then(()=>true,()=>false);
 try{const a=document.createElement("textarea");a.value=txt;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();const ok=document.execCommand("copy");a.remove();return Promise.resolve(ok)}catch(e){return Promise.resolve(false)}}

/* ---- settings page actions ---- */
PAGE_ACTIONS.lcopy=d=>{copyText(d.u).then(ok=>toast(ok?d.l+" link copied":"Couldn’t copy — tap and hold the link instead"));return false};
PAGE_ACTIONS.ledit=d=>{const l=d.k==="label"?LABEL_LINKS:(M[d.k].links||{});S.elinks=d.k;S.ldraft={};SOCIALS.forEach(([k])=>S.ldraft[k]=l[k]||"")};
PAGE_ACTIONS.lcancel=()=>{S.elinks=null;S.ldraft={}};
PAGE_ACTIONS.lsave=d=>{const draft=Object.assign({},S.ldraft);
 run(()=>saveLinks(d.id||null,d.m||null,draft)).then(ok=>{if(!ok)return;S.elinks=null;S.ldraft={};toast("Links saved")});return false};
PAGE_ACTIONS.logout=()=>{db.auth.signOut();return false}; // onAuth() clears the screen once signed out
PAGE_ACTIONS.reload=()=>{run(async()=>{}).then(ok=>ok&&toast("Up to date"));return false};
PAGE_ACTIONS.purge=d=>{if(confirm("Delete permanently? This removes its relationships and cannot be undone."))run(()=>purgeEntry(d.id)).then(ok=>ok&&toast("Deleted permanently"));return false};