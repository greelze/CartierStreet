"use strict";
/* SEARCH PAGE
   Opened from the Search button on Home and My Day. Nothing is listed until you type
   or pick a filter, so the page opens instantly. Filters stay hidden behind "More filters".
   HTML: built by vSearch() below. CSS: css/base.css (search section). */
const sFiltered=()=>!!(S.cats.length||S.st||S.pp);
function vSearch(){const from=(TABS.find(t=>t[0]===S.tab)||[,"Home"])[1],showF=S.sflt||sFiltered();
 return backBar(from,"closesearch")+
 '<div class="ph"><div><h1 class="ttl">'+sv(I.find)+'Search</h1><p class="mut lead">Looking for something? Type a title, name or venue.</p></div></div>'+
 '<input id="q" class="bigsearch" type="search" placeholder="Start typing to search…" value="'+H(S.q)+'" aria-label="Search">'+
 (showF?'<div class="fpanel"><div class="fhead"><b>Filters</b><button class="btn sm" data-act="sclear">Clear filters</button></div>'+
   '<div class="chips">'+ORDER.map(c=>'<button class="chip'+(S.cats.includes(c)?" on":"")+'" data-act="cat" data-c="'+c+'">'+CAT[c].pl+'</button>').join("")+'</div>'+
   '<div class="tb"><select data-flt="st" aria-label="Status"><option value="">Any status</option>'+
   [["Releases",Object.keys(SONG_STATUS)],["Content",CONTENT_STATUS],["Activities",EVT_STATUS],["Gigs / Events",GIG_STATUS],["Tasks",TASK_STATUS]]
    .map(([g,l])=>'<optgroup label="'+g+'">'+l.map(s=>'<option'+(S.st===s?" selected":"")+'>'+H(s)+'</option>').join("")+'</optgroup>').join("")+'</select>'+
   '<select data-flt="pp" aria-label="Person"><option value="">Anyone</option>'+MK.map(k=>'<option value="'+k+'"'+(S.pp===k?" selected":"")+'>'+H(mn(k))+'</option>').join("")+'</select></div></div>'
  :'<button class="linkbtn" data-act="sflt">+ More filters (type, status, person)</button>')+
 '<div id="list">'+searchList()+'</div>';}

function searchList(){const q=S.q.trim().toLowerCase(),fl=sFiltered();
 if(!q&&!fl)return '<div class="hint">'+sv(I.find)+'<p>Results will show up here as you type.</p></div>';
 let l=sortByOcc(visible(S.user));l=q||S.st?l:l.filter(e=>!isFin(e));if(q)l=l.filter(e=>hay(e).includes(q));
 if(S.cats.length)l=l.filter(e=>S.cats.includes(e.cat));if(S.st)l=l.filter(e=>e.status===S.st);if(S.pp)l=l.filter(e=>involved(e,S.pp));
 return l.length?sh("Found",l.length)+l.map(row).join(""):empty("Nothing found","Check the spelling, or try fewer words or filters.");}

/* ---- search page actions ---- */
document.addEventListener("input",e=>{if(e.target.id==="q"){S.q=e.target.value;$("#list").innerHTML=searchList()}});
PAGE_ACTIONS.opensearch=()=>{S.search=true;S.open=null;scrollTo(0,0);setTimeout(()=>{const i=$("#q");i&&i.focus()})};
PAGE_ACTIONS.closesearch=()=>{S.search=false};
PAGE_ACTIONS.sflt=()=>{S.sflt=true};
PAGE_ACTIONS.sclear=()=>{Object.assign(S,{sflt:false,cats:[],st:"",pp:""})};
PAGE_ACTIONS.cat=d=>{const i=S.cats.indexOf(d.c);i>-1?S.cats.splice(i,1):S.cats.push(d.c)};
