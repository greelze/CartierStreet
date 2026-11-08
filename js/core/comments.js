"use strict";
/* COMMENTS ON AN ENTRY  (S39, D6.6)
   A short thread at the bottom of every entry page — release, content,
   activity, gig and task alike — so a decision stays with the thing it is
   about instead of scrolling away in the group chat.

   Newest last, like a conversation. Each note carries a name and a time. You
   can take back your own; the person who made the entry, and any admin, can
   take back anyone's. Nothing can be edited after the fact: a comment is
   something somebody said at a time.

   Who sees the thread is not decided here. Every policy in patch 18 goes
   through can_see_entry(), so the thread is visible exactly when the entry is.

   HTML: vComments() below. CSS: css/pages/comments.css
   Database: patch 18 (comments). */

Object.assign(S,{cmt:""}); // what is being typed, kept across redraws

const cmtsOn=id=>DB.comments.filter(c=>c.ref===id); // already in time order from api.js
/* D6.6: your own, or anything on an entry you made, or anything at all if admin */
const cmtDel=(c,e)=>c.who===S.user||isAdmin(S.user)||(e&&e.by===S.user);

/* a time that reads the way a person would say it */
function cmtWhen(ts){const t=new Date(ts),mins=Math.floor((Date.now()-t)/6e4),n=days(iso(t),TODAY);
 if(mins<1)return"just now";
 if(n<=0)return mins<60?mins+" min ago":Math.floor(mins/60)+(Math.floor(mins/60)===1?" hour ago":" hours ago");
 if(n===1)return"Yesterday at "+ft(String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0"));
 return fmtS(iso(t))+" at "+ft(String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0"));}

/* The database already keeps a thread to the people who can open the entry.
   This is the same rule said again on the page, so a thread can never be drawn
   next to something the person was not meant to be looking at. */
function vComments(e){if(!e||!canSee(e,S.user))return"";
 const l=cmtsOn(e.id);
 return '<h4>Comments'+(l.length?" · "+l.length:"")+'</h4>'+
 (l.length?'<div class="cml">'+l.map(c=>vComment(c,e)).join("")+'</div>'
         :'<p class="mut cmempty">Nothing here yet. Notes on this '+CAT[e.cat].label.toLowerCase()+' stay with it, so they are still here next month.</p>')+
 '<div class="cmnew">'+av(S.user,32)+
 '<div class="cmb"><textarea data-cmt rows="2" placeholder="Add a note about this '+CAT[e.cat].label.toLowerCase()+'…" aria-label="Write a comment">'+H(S.cmt)+'</textarea>'+
 '<div class="cmact"><span class="mut cmwho">Everyone who can see this '+CAT[e.cat].label.toLowerCase()+' can read it.</span>'+
 /* the button stays live while you type: greying it out would need a redraw on
   every keystroke, and a redraw takes the caret with it. */
'<button class="btn pri sm" data-act="cmsend" data-id="'+e.id+'"'+(S.busy?" disabled":"")+'>'+(S.busy?"Posting…":"Post")+'</button></div></div></div>';}

function vComment(c,e){
 return '<div class="cm'+(c.who===S.user?" me":"")+'">'+av(c.who,32)+
 '<div class="cmb"><div class="cmh"><b>'+H(mn(c.who))+(c.who===S.user?" (you)":"")+'</b><span>'+H(cmtWhen(c.at))+'</span>'+
 (cmtDel(c,e)?'<button class="cmx" data-act="cmdel" data-id="'+c.id+'" aria-label="Delete this comment">×</button>':"")+
 '</div><p>'+H(c.body)+'</p></div></div>';}

/* ---- actions ---- */
PAGE_ACTIONS.cmsend=d=>{const e=live(d.id),body=S.cmt.trim();
 if(!e||S.busy)return false;
 if(!body){toast("Write something first");return false}
 if(!canSee(e,S.user)){toast("You cannot comment on this");return false}
 run(()=>addComment(e.id,body)).then(ok=>{if(!ok)return;S.cmt="";
  /* D6.6: the owner and everyone on it hear about it. Not every admin —
     a comment is not an approval, and the inbox is noisy enough. */
  notify(e,"commented on **"+e.title+"**",
   [...new Set([e.by,...(e.people||[]),...(e.organizer||[])])].filter(Boolean));
  toast("Comment added");render();});
 return false};

PAGE_ACTIONS.cmdel=d=>{const c=DB.comments.find(x=>x.id===d.id);if(!c)return false;
 const e=live(c.ref);
 if(!cmtDel(c,e)){toast("Only "+mn(c.who)+", the owner or an admin can remove this");return false}
 if(!confirm("Remove this comment? It cannot be undone."))return false;
 run(()=>delComment(c.id)).then(ok=>ok&&toast("Comment removed"));return false};