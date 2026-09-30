"use strict";
/* SHARED COMPONENTS
   The list row, the timeline row, and the Today / This Week / Next Week / Upcoming
   sections used by My Day and the Tasks, Activities and Gigs pages. */
function row(e){const o=nextOcc(e),t=tone(e.status),sub=e.cat==="songs"||e.cat==="tasks"?o.label:ft(o.time);
 return '<button class="row" data-act="open" data-id="'+e.id+'"><i class="bar" style="background:'+CAT[e.cat].c+'"></i><span><span class="t">'+H(e.title)+'</span><span class="m">'+H(mline(e))+'</span><span class="s" style="color:'+t[0]+'">'+H(sline(e))+'</span></span><span class="r">'+fmtS(o.date)+(sub?'<em>'+H(sub)+'</em>':"")+'<br>'+ctag(e.cat)+'</span></button>';}

/* timeline row (time on the left) — the "Your schedule" look, used for Today */
function tlRow(e){const o=nextOcc(e);
 return '<button class="tlr" data-act="open" data-id="'+e.id+'"><span class="tm">'+(o.time?ft(o.time):o.label||"Due")+'</span><i style="width:3px;align-self:stretch;border-radius:9px;background:'+CAT[e.cat].c+'"></i><span class="b"><b>'+H(e.title)+'</b><span class="mut" style="display:block;font-size:14px">'+H(mline(e))+'</span></span>'+ctag(e.cat)+'</button>';}

/* weeks run Sunday–Saturday, the same as the Calendar page */
const weekStart=s=>addD(s,-d2(s).getDay());
function bucket(e){const d=nextOcc(e).date,ws=weekStart(TODAY);
 if(d<TODAY)return"over";if(d===TODAY)return"today";if(d<addD(ws,7))return"week";if(d<addD(ws,14))return"next";return"up";}

/* l = unfinished entries already sorted by date; key = remembers whether Upcoming is open on this page */
function timeSections(l,key){const g={over:[],today:[],week:[],next:[],up:[]};l.forEach(e=>g[bucket(e)].push(e));
 let h='<div class="sec today"><div class="sh"><span>Today</span><span>'+(g.today.length||"")+'</span></div>'+
  (g.today.length?g.today.sort((a,b)=>(nextOcc(a).time||"").localeCompare(nextOcc(b).time||"")).map(tlRow).join(""):'<p class="mut clear">Nothing scheduled or due today.</p>')+'</div>';
 if(g.over.length)h+='<div class="sec over"><div class="sh"><span>Overdue</span><span>'+g.over.length+'</span></div>'+g.over.map(row).join("")+'</div>';
 if(g.week.length)h+='<div class="sec box week"><div class="sh"><span>This Week</span><span>'+g.week.length+'</span></div>'+g.week.map(row).join("")+'</div>';
 if(g.next.length)h+='<div class="sec box next"><div class="sh"><span>Next Week</span><span>'+g.next.length+'</span></div>'+g.next.map(row).join("")+'</div>';
 if(g.up.length){const open=!!S.up[key];
  h+='<div class="sec up"><button class="dd" data-act="uptog" data-k="'+key+'" aria-expanded="'+open+'"><span>Upcoming · '+g.up.length+'</span><span>'+(open?"Hide ▴":"Show ▾")+'</span></button>'+(open?g.up.map(row).join(""):"")+'</div>';}
 return h;}

/* ---- big menu card (Home and My Day) ----
   o = {act, data, cls, icon, title, desc, count, unit, warn, next, color} */
function bigCard(o){
 return '<button class="bcard '+(o.cls||"")+'" data-act="'+o.act+'"'+(o.data||"")+(o.color?' style="--cc:'+o.color+'"':'')+'>'+
  '<span class="c-top"><span class="c-ic">'+sv(o.icon)+'</span><b>'+o.title+'</b></span>'+
  '<span class="c-desc">'+o.desc+'</span>'+
  '<span class="c-num"><strong>'+o.count+'</strong> '+o.unit+'</span>'+
  (o.warn?'<span class="c-warn">'+o.warn+'</span>':'')+
  '<span class="c-next">'+(o.next||"&nbsp;")+'</span>'+
  '<span class="c-go">Open '+sv(I.arr)+'</span></button>';}
const things=n=>n===1?"thing":"things";
/* "← Back to …" bar at the top of every inner page */
const backBar=(label,act,data)=>'<button class="back" data-act="'+act+'"'+(data||"")+'>'+sv('<path d="M19 12H5M11 6l-6 6 6 6"/>')+'<span>Back to '+label+'</span></button>';
/* the Search button shown in page headers */
const searchBtn=()=>'<button class="btn big" data-act="opensearch">'+sv(I.find)+'<span>Search</span></button>';
const addBtn=(label,c)=>'<button class="btn pri big" data-act="'+(c?"newcat":"add")+'"'+(c?' data-c="'+c+'"':'')+'>+ '+label+'</button>';