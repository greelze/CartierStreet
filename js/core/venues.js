"use strict";
/* THE VENUE PICKER  (S38, D4.8, D6.8, 1.9, 1.10)
   The Gig and Activity forms used a fixed dropdown, so a venue that was not
   on the list could not be entered at all. This replaces it with a box you
   type into that offers the venues already in the Contacts book, and accepts
   a name that is not there yet.

   Picking a known venue fills the address. For an admin it also fills the
   gig's contact person and phone from the book, because those are theirs to
   see. A name nobody has used before is saved as a Venue with just a name and
   an address when the form saves; an admin completes the rest later. Nothing
   is ever locked: every box stays editable afterwards.

   HTML: vVenueField() below, used by fld() in forms.js.
   Database: patch 17 (contacts_public, add_venue). */

/* every venue the signed-in person may offer, from the public view (S38) */
const venueNames=()=>VENUES.map(v=>v[0]);
const venueKnown=n=>{const k=String(n||"").trim().toLowerCase();
 return VENUES.find(v=>v[0].toLowerCase()===k)||null;};
/* the full contact row, which only an admin has (D6.8) */
const contactOf=n=>{const k=String(n||"").trim().toLowerCase();
 return CBOOK.find(c=>c.type==="Venue"&&c.name.toLowerCase()===k)||null;};

/* the field itself. A datalist gives type-to-search that the browser filters
   natively, so it keeps up with typing on a phone and never steals the caret. */
function vVenueField(F){const v=F.venue||"",known=venueKnown(v),newOne=!!v.trim()&&!known;
 return '<div class="fld full vfld"><b>Venue</b>'+
  '<input data-f="venue" list="venuelist" autocomplete="off" placeholder="Start typing a venue, or type a new one" value="'+H(v)+'">'+
  '<datalist id="venuelist">'+venueNames().map(n=>'<option value="'+H(n)+'"></option>').join("")+'</datalist>'+
  (newOne?'<p class="hintline vnew">“'+H(v.trim())+'” is not in the Contacts book yet. It will be added as a venue with the address below, and an admin can fill in the rest later.</p>'
        :known?'<p class="hintline">From the Contacts book.</p>'
        :'<p class="hintline">Pick one from the list, or type a name that is not on it.</p>')+
  '</div>';}

/* Called by save() before it writes. A venue nobody has used before is created
   now, so the entry can point at it. add_venue() hands back the row that is
   already there if the name matches one, so this never makes a second copy. */
async function ensureVenue(f){
 if(!["gigs","activities"].includes(f.cat))return;
 const name=String(f.venue||"").trim();
 if(!name||venueKnown(name))return;
 const id=await addVenue(name,f.address);
 if(!id)return;
 VENUES.push([name,String(f.address||"").trim()]);   // so subRow() can resolve it straight away
 VENUES.sort((a,b)=>a[0].localeCompare(b[0]));
 VID[name]=id;VNAME[id]=name;}

/* Picking a venue fills the address for everybody. An admin also gets the
   contact person and the phone, which is why those columns are theirs (D6.8). */
function venuePicked(F,name){const v=venueKnown(name);
 if(v&&v[1])F.address=v[1];}

/* D6.8: the contact person and phone go onto the gig itself, where Gig Details
   shows them. Never over the top of something already typed there. */
async function fillGigContact(e,f){
 if(!e||e.cat!=="gigs"||!isAdmin(S.user))return;
 const c=contactOf(f.venue);if(!c||(!c.person&&!c.phone))return;
 const gd=e.gd||{},set={};
 if(c.person&&!String(gd.cname||"").trim())set.contact_name=c.person;
 if(c.phone&&!String(gd.cphone||"").trim())set.contact_phone=c.phone;
 if(!Object.keys(set).length)return;
 try{await saveGigContact(e.id,set);}catch(err){console.warn("Venue contact not copied:",err.message||err);}}

/* ---- the Contacts book page (S38, D4.8) ---- */
const CONTACT_TYPES=["Venue","Promoter","Photographer","Press","Collaborator","Other"];
const CF=[["name","Name","t"],["type","Type","s"],["address","Address","t"],
 ["person","Contact person","t"],["phone","Phone","t"],["email","Email","t"],["notes","Notes","a"]];
const cEdit=()=>isAdmin(S.user);