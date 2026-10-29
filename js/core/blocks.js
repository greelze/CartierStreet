"use strict";
/* GIG DETAILS (S3) and ACTIVITY DETAILS (S26)
   Gig Details is the same idea as Release Details, in three groups with nothing
   removed: What · When and where · Who and money. The four new boxes are the ones
   you type in; the rest come from the gig and change with the Edit button.
   Confirmed stays shut until the call time and the contact are filled (S3).
   Activity Details is two optional boxes, for the plan and the folder (S26).
   HTML: built by vGD() and vAD() below. CSS: css/pages/details.css */

/* ---- what Confirmed is waiting for (S3) ---- */
const gdVal=(e,k)=>(e.gd||{})[k];
const gdMissing=e=>GD_NEW.filter(f=>GD_NEED.includes(f[0])&&!filled(gdVal(e,f[0]))).map(f=>f[1]);
const gdReady=e=>gdMissing(e).length===0;
const adVal=(e,k)=>(e.ad||{})[k];

/* ---- one box ---- */
function bBox(f,v,attr,ed){const k=f[0],bad=f[3]&&!filled(v);
 let h;
 if(!ed)h='<p class="rdro">'+(filled(v)?H(k==="call"?ft(String(v)):String(v)):"<em>Empty</em>")+'</p>';
 else if(f[2]==="a")h='<textarea rows="3" '+attr+'>'+H(v==null?"":String(v))+'</textarea>';
 else if(f[2]==="tm")h='<input type="time" '+attr+' value="'+H(v==null?"":String(v))+'">';
 else h='<input type="'+(f[2]==="n"?"number":"text")+'" '+attr+' value="'+H(v==null?"":String(v))+'"'+
   (k==="fee"?' min="0" step="0.01" placeholder="0.00"':k==="poster"||k==="folder"?' placeholder="https://…" inputmode="url"':"")+'>';
 return '<div class="rdf'+(f[2]==="a"?" wide":"")+(bad?" bad":"")+'"><b>'+f[1]+(f[3]?'<i class="rq">*</i>':"")+'</b>'+h+'</div>';}
/* a value the gig already holds, shown here so the three groups are complete */
const bRo=(l,v)=>'<div class="rdf done"><b>'+l+'</b><p class="rdro">'+(filled(v)?H(String(v)):"<em>Empty</em>")+'</p></div>';
const gdNew=(e,k,ed)=>{const f=GD_NEW.find(x=>x[0]===k);return bBox(f,gdVal(e,k),'data-gd="'+k+'"',ed)};

/* ---- the gig block (S3) ---- */
function vGD(e){if(e.cat!=="gigs")return"";
 const ed=canEdit(e,S.user),miss=gdMissing(e),booked=e.orgKind==="Booked (Paid Performance)";
 return '<div class="drd dgd"><div class="rdh"><h4>Gig Details</h4>'+
  '<span class="rdbar'+(miss.length?"":" ok")+'">'+(miss.length?miss.length+" box"+(miss.length===1?"":"es")+" left":"All boxes filled")+'</span></div>'+
  (ed?"":'<p class="rdnote ro">View only — only '+H(mn(e.by))+' or an admin can fill this in.</p>')+
  (miss.length&&ed?'<p class="rdnote">Confirmed stays shut until '+H(miss.join(" and "))+' '+(miss.length===1?"is":"are")+' filled.</p>':"")+
  '<div class="rdp open">'+
   '<div class="gdg"><h5>What</h5><div class="rdg">'+
    bRo("Name",e.title)+bRo("Type",e.type+(e.typeNote?" · "+e.typeNote:""))+bRo("Status",e.status)+'</div></div>'+
   '<div class="gdg"><h5>When and where</h5><div class="rdg">'+
    bRo("Date",fmtM(e.date))+bRo("Time",ft(e.time))+gdNew(e,"call",ed)+bRo("Venue",e.venue)+bRo("Venue address",e.address)+'</div></div>'+
   '<div class="gdg"><h5>Who and money</h5><div class="rdg">'+
    bRo("Organizer",e.orgKind)+bRo("Organizer name",e.orgName)+bRo("Members involved",(e.people||[]).map(mn).join(", "))+
    (booked?gdNew(e,"fee",ed):"")+gdNew(e,"cname",ed)+gdNew(e,"cphone",ed)+'</div></div>'+
   '<div class="gdg"><h5>The public details</h5><div class="rdg">'+gdNew(e,"poster",ed)+'</div></div>'+
  '</div></div>';}

/* ---- the activity block (S26) ---- */
function vAD(e){if(e.cat!=="activities")return"";
 const ed=canEdit(e,S.user),any=AD_F.some(f=>filled(adVal(e,f[0])));
 if(!ed&&!any)return""; // nothing written and nothing to write: no empty block
 return '<div class="drd dad"><div class="rdh"><h4>Activity Details</h4></div>'+
  (ed?'<p class="rdnote">What you are doing, what to bring, and where the files live. Both are optional.</p>':"")+
  '<div class="rdp open"><div class="gdg"><div class="rdg">'+
   AD_F.map(f=>bBox(f,adVal(e,f[0]),'data-ad="'+f[0]+'"',ed)).join("")+'</div></div></div></div>';}

/* ---- saving ---- */
function gdWrite(e,key,val){const before=gdVal(e,key);e.gd[key]=val;render();
 runSoft(()=>saveGD(e.id,key,val),()=>{e.gd[key]=before});}
function adWrite(e,key,val){const before=adVal(e,key);e.ad[key]=val;render();
 runSoft(()=>saveAD(e.id,key,val),()=>{e.ad[key]=before});}
