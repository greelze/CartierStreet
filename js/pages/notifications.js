"use strict";
/* NOTIFICATIONS PAGE
   HTML: built by vNotifs() below. CSS: css/pages/notifications.css (shared styles: css/base.css). */
function vNotifs(){const u=S.user,mine=DB.notifs.filter(n=>byId(n.ref)),un=unread();
 return '<div class="ph"><div><h1>Notifications</h1><p class="mut lead">News about your releases, gigs and tasks.</p>'+(un?'<p class="mut" style="margin-top:6px">'+un+' unread</p>':"")+'</div><div class="acts">'+searchBtn()+(un?'<button class="btn big" data-act="readall">Mark all read</button>':"")+'</div></div>'+
 (mine.length?["Today","Yesterday","This week","Older"].map(g=>{const it=mine.filter(n=>n.g===g);return it.length?sh(g)+it.map(n=>{const e=byId(n.ref);
  const t=H(n.txt).replace("{a}",n.actor?"<b>"+H(mn(n.actor))+"</b>":"").replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
  return '<button class="nr'+(n.unread?" un":"")+'" data-act="notif" data-id="'+n.id+'"><span class="dot'+(n.unread?"":" z")+'"></span>'+(n.actor?av(n.actor,34):"")+'<span><span style="display:block">'+t+'</span>'+ctag(e.cat)+' <span class="mut" style="font-size:13px">'+n.w+'</span></span></button>'}).join(""):""}).join(""):empty("Nothing new","You’ll hear from us when someone adds you to something, changes a status or date, or a deadline gets close."));}

/* ---- notifications page actions ---- */
PAGE_ACTIONS.notif=d=>{const n=DB.notifs.find(x=>x.id===d.id);if(!n)return;if(n.unread){n.unread=0;markRead(n.id)}S.open=n.ref};
PAGE_ACTIONS.readall=()=>{DB.notifs.forEach(n=>n.unread=0);markAllRead()};
