"use strict";
/* SEARCH PAGE
   Opened from the Search button on Home and My Day. Nothing is listed until you type
   or pick a filter, so the page opens instantly. Filters stay hidden behind "More filters".
   HTML: built by vSearch() below. CSS: css/base.css (search section). */
/* The person filter is S.spp, not S.pp: the Promotional Plan owns S.pp and sets it
   to "write" the moment the app loads, which used to leave Search permanently
   filtered by a person nobody is called — no results, and the panel stuck open. */
const sFiltered=()=>!!(S.cats.length||S.st||S.spp);
/* D5.2.9: finished entries stay out of Search unless you ask for them. The toggle
   sits under the box rather than behind "More filters" — it changes what you get
   back, so it should take one tap, not three. Picking a finished status in the
   filters is itself asking for them, so that works without the toggle. */
const FIN_ST=["Completed","Posted","Released","Lapsed","Cancelled"];
const sFin=()=>S.sfin||FIN_ST.includes(S.st);
function vSearch(){const from=(TABS.find(t=>t[0]===S.tab)||[,"Home"])[1],showF=S.sflt||sFiltered();
 return backBar(from,"closesearch")+
 '<div class="ph"><div><h1 class="ttl">'+sv(I.find)+'Search</h1><p class="mut lead">Looking for something? Type a title, name or venue.</p></div></div>'+
 '<input id="q" class="bigsearch" type="search" placeholder="Start typing to search…" value="'+H(S.q)+'" aria-label="Search">'+
 '<button class="tgl'+(S.sfin?" on":"")+'" data-act="sfin" role="switch" aria-checked="'+!!S.sfin+'"><i></i><span>Include completed items</span></button>'+
 (showF?'<div class="fpanel"><div class="fhead"><b>Filters</b><button class="btn sm" data-act="sclear">Clear filters</button></div>'+
   '<div class="chips">'+ORDER.map(c=>'<button class="chip'+(S.cats.includes(c)?" on":"")+'" data-act="cat" data-c="'+c+'">'+CAT[c].pl+'</button>').join("")+'</div>'+
   '<div class="tb"><select data-flt="st" aria-label="Status"><option value="">Any status</option>'+
   [["Releases",Object.keys(SONG_STATUS)],["Content",CONTENT_STATUS],["Activities",EVT_STATUS],["Gigs / Events",GIG_STATUS],["Tasks",TASK_STATUS]]
    .map(([g,l])=>'<optgroup label="'+g+'">'+l.map(s=>'<option'+(S.st===s?" selected":"")+'>'+H(s)+'</option>').join("")+'</optgroup>').join("")+'</select>'+
   '<select data-flt="spp" aria-label="Person"><option value="">Anyone</option>'+MK.map(k=>'<option value="'+k+'"'+(S.spp===k?" selected":"")+'>'+H(mn(k))+'</option>').join("")+'</select></div></div>'
  :'<button class="linkbtn" data-act="sflt">+ More filters (type, status, person)</button>')+
 '<div id="list">'+searchList()+'</div>';}

function searchList(){const q=S.q.trim().toLowerCase(),fl=sFiltered();
 if(!q&&!fl)return '<div class="hint">'+sv(I.find)+'<p>Results will show up here as you type.</p></div>';
 let l=sortByOcc(visible(S.user));if(!sFin())l=l.filter(e=>!isFin(e));if(q)l=l.filter(e=>hay(e).includes(q)); // D5.2.9
 if(S.cats.length)l=l.filter(e=>S.cats.includes(e.cat));if(S.st)l=l.filter(e=>e.status===S.st);if(S.spp)l=l.filter(e=>involved(e,S.spp));
 const hid=!sFin()&&sortByOcc(visible(S.user)).filter(e=>isFin(e)&&(!q||hay(e).includes(q))&&(!S.cats.length||S.cats.includes(e.cat))&&(!S.spp||involved(e,S.spp))).length;
 return (l.length?sh("Found",l.length)+l.map(e=>row(e,isCancelled(e)?"cx":"")).join("")
   :empty("Nothing found",hid?"Nothing open matches. Turn on “Include completed items” to search finished ones too.":"Check the spelling, or try fewer words or filters."))+
  (l.length&&hid?'<p class="mut fnote">'+hid+' finished '+(hid===1?"entry is":"entries are")+' hidden. Turn on “Include completed items” to see '+(hid===1?"it":"them")+'.</p>':"");}

/* ---- search page actions ---- */
document.addEventListener("input",e=>{if(e.target.id==="q"){S.q=e.target.value;$("#list").innerHTML=searchList()}});
PAGE_ACTIONS.opensearch=()=>{S.search=true;S.open=null;scrollTo(0,0);setTimeout(()=>{const i=$("#q");i&&i.focus()})};
PAGE_ACTIONS.closesearch=()=>{S.search=false};
PAGE_ACTIONS.sflt=()=>{S.sflt=true};
PAGE_ACTIONS.sfin=()=>{S.sfin=!S.sfin}; // D5.2.9
PAGE_ACTIONS.sclear=()=>{Object.assign(S,{sflt:false,cats:[],st:"",spp:""})}; // the toggle is not a filter, so Clear filters leaves it alone
PAGE_ACTIONS.cat=d=>{const i=S.cats.indexOf(d.c);i>-1?S.cats.splice(i,1):S.cats.push(d.c)};
