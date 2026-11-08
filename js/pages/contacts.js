"use strict";
/* THE CONTACTS BOOK  (S38, D4.8)
   Admins only, and the database agrees: patch 17 leaves everyone else with a
   four-column view that has no phone, no email and no notes in it, so there
   is nothing for a policy to leak.

   Reached from Settings. Venues typed into a gig or activity by an artist
   land here as a name and an address for an admin to complete.

   HTML: vContacts() and vCForm() below. CSS: css/pages/contacts.css */

Object.assign(S,{cbq:"",cbtype:"",cform:null}); // the search box, the type filter, the open form

const CTYPE_D={Venue:"Where we play or shoot",Promoter:"Books us or runs the night",
 Photographer:"Shoots stills or video",Press:"Writes about us",
 Collaborator:"Artists, producers and engineers",Other:"Everyone else"};

function vContacts(){
 if(!cEdit())return '<div class="ph"><div><h1>Contacts</h1></div></div>'+
  empty("Admins only","The Contacts book holds phone numbers and emails, so it stays with Cartier St.");
 const q=S.cbq.trim().toLowerCase(),ty=S.cbtype;
 const list=CBOOK.filter(c=>(!ty||c.type===ty)&&(!q||[c.name,c.address,c.person,c.phone,c.email,c.notes]
   .filter(Boolean).join(" ").toLowerCase().includes(q)))
  .sort((a,b)=>CONTACT_TYPES.indexOf(a.type)-CONTACT_TYPES.indexOf(b.type)||a.name.localeCompare(b.name));
 const bare=CBOOK.filter(cThin).length; // venues with nobody to call (S38)
 return backBar("Settings","tab",' data-t="settings"')+
 '<div class="ph"><div><h1>Contacts</h1><p class="mut lead">Venues, promoters, photographers, press and collaborators. Only admins see this.</p></div>'+
 '<div class="acts"><button class="btn pri big" data-act="cnew">+ Add contact</button></div></div>'+
 '<div class="cbbar"><input class="cbq" data-cbq value="'+H(S.cbq)+'" placeholder="Search name, address, phone or email" aria-label="Search contacts"></div>'+
 '<div class="chips"><button class="chip'+(ty?"":" on")+'" data-act="cbtype" data-t="">All · '+CBOOK.length+'</button>'+
  CONTACT_TYPES.map(t=>{const n=CBOOK.filter(c=>c.type===t).length;
   return '<button class="chip'+(ty===t?" on":"")+'" data-act="cbtype" data-t="'+t+'">'+t+(n?" · "+n:"")+'</button>';}).join("")+'</div>'+
 (bare?'<p class="mut note cbnote">'+bare+' venue'+(bare===1?"":"s")+' still '+(bare===1?"has":"have")+' no contact person or phone. A venue an artist typed into a gig arrives here with only a name and an address.</p>':"")+
 (list.length?list.map(cRow).join(""):empty(CBOOK.length?"Nothing matches":"The book is empty",
   CBOOK.length?"Try a different search or type.":"Add a venue, a promoter or anyone else Cartier St. deals with.",
   '<button class="btn pri big" data-act="cnew">+ Add contact</button>'));}

/* a venue with nobody to call: either an artist typed it into a gig, or it has
   simply never been filled in. Either way it is what an admin is here to fix. */
const cThin=c=>c.type==="Venue"&&!c.person&&!c.phone;
function cRow(c){const bits=[c.address,c.person,c.phone,c.email].filter(Boolean);
 const line=bits.length?H(bits.join(" · ")):"",
  miss=cThin(c)?'<i class="cthin">'+(bits.length?" · ":"")+'no contact person or phone</i>'
      :bits.length?"":'<i class="cthin">Name only — nothing else filled in</i>';
 return '<div class="crow"><span class="ctg">'+H(c.type)+'</span>'+
 '<span class="cb"><b>'+H(c.name)+'</b><span>'+line+miss+'</span>'+
 (c.notes?'<span class="cnote">'+H(c.notes)+'</span>':"")+'</span>'+
 '<span class="ca"><button class="btn sm" data-act="cedit" data-id="'+c.id+'">Edit</button>'+
 '<button class="btn sm dan" data-act="cdel" data-id="'+c.id+'">Delete</button></span></div>';}

function vCForm(){const f=S.cform,ed=!!f.id,used=ed?contactUse(f.id):0;
 const fe=k=>f.errs[k]?'<div class="e">'+H(f.errs[k])+"</div>":"";
 const box=([k,label,t])=>'<div class="fld'+(t==="a"||k==="name"||k==="address"?" full":"")+'"><b>'+label+'</b>'+
  (t==="s"?'<select data-cf="type">'+CONTACT_TYPES.map(x=>'<option'+(x===f.type?" selected":"")+'>'+x+'</option>').join("")+'</select>'
   :t==="a"?'<textarea rows="3" data-cf="'+k+'" placeholder="Anything worth remembering — load-in, parking, who to ask for">'+H(f[k]||"")+'</textarea>'
   :'<input data-cf="'+k+'" value="'+H(f[k]||"")+'"'+(k==="email"?' type="email" placeholder="name@example.com"':k==="phone"?' placeholder="09xx xxx xxxx"':'')+'>')+fe(k)+'</div>';
 return '<div class="scrim s2" data-act="ccancel"></div><div class="modal" role="dialog" aria-label="'+(ed?"Edit":"Add")+' contact">'+
 '<div class="mh"><h3 style="flex:1">'+(ed?"Edit contact":"Add contact")+'</h3><button class="x" data-act="ccancel" aria-label="Close">×</button></div>'+
 '<div class="mb">'+CF.map(box).join("")+
  '<p class="mut note full">Only admins ever see the phone, the email and the notes. Everyone else sees the name, the type and the address.</p>'+
 '</div><div class="mf">'+
 (used?'<span class="mut" style="margin-right:auto;font-size:13px">On '+used+' gig'+(used===1?"":"s")+' or activit'+(used===1?"y":"ies")+'</span>':'<span style="margin-right:auto"></span>')+
 '<button class="btn" data-act="ccancel">Cancel</button>'+
 '<button class="btn pri" data-act="csave"'+(S.busy?" disabled":"")+'>'+(S.busy?"Saving…":ed?"Save changes":"Add contact")+'</button></div></div>';}

/* how many gigs and activities point at this contact, so deleting one is not a surprise */
const contactUse=id=>DB.entries.filter(e=>["gigs","activities"].includes(e.cat)&&e.venue&&VID[e.venue]===id).length;

/* ---- actions ---- */
PAGE_ACTIONS.contacts=()=>{S.tab="contacts";S.open=null;S.search=false;scrollTo(0,0)};
PAGE_ACTIONS.cbtype=d=>{S.cbtype=d.t||""};
PAGE_ACTIONS.cnew=()=>{if(!cEdit())return false;
 S.cform={id:null,name:"",type:"Venue",address:"",person:"",phone:"",email:"",notes:"",errs:{}}};
PAGE_ACTIONS.ccancel=()=>{S.cform=null};
PAGE_ACTIONS.cedit=d=>{const c=CBOOK.find(x=>x.id===d.id);if(!c||!cEdit())return false;
 S.cform={id:c.id,name:c.name,type:c.type,address:c.address||"",person:c.person||"",
  phone:c.phone||"",email:c.email||"",notes:c.notes||"",errs:{}}};
PAGE_ACTIONS.cdel=d=>{const c=CBOOK.find(x=>x.id===d.id);if(!c||!cEdit())return false;
 const n=contactUse(c.id);
 if(n&&!confirm("“"+c.name+"” is on "+n+" gig"+(n===1?"":"s")+" or activit"+(n===1?"y":"ies")+". They keep the name and address already saved on them. Remove it from the book?"))return false;
 if(!n&&!confirm("Remove “"+c.name+"” from the Contacts book?"))return false;
 run(()=>delContact(c.id)).then(ok=>ok&&toast("Removed from the Contacts book"));return false};

PAGE_ACTIONS.csave=()=>{const f=S.cform;if(!f||S.busy)return false;
 const r=f.errs={};
 if(!String(f.name||"").trim())r.name="Give this contact a name";
 if(f.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim()))r.email="That does not look like an email address";
 const dupe=CBOOK.find(c=>c.id!==f.id&&c.type===f.type&&c.name.trim().toLowerCase()===String(f.name||"").trim().toLowerCase());
 if(dupe)r.name="There is already a "+f.type.toLowerCase()+" with that name";
 if(Object.keys(r).length){render();toast("Check the highlighted fields");return false}
 const ed=!!f.id;
 run(()=>saveContact(f)).then(ok=>{if(!ok)return;S.cform=null;
  toast(ed?"Contact updated":"Added to the Contacts book");render();});
 return false};