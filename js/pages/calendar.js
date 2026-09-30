"use strict";
/* CALENDAR PAGE
   HTML: built by vCal() below. CSS: css/pages/calendar.css (shared styles: css/base.css). */
function vCal(){const u=S.user,cur=d2(S.sel),y=cur.getFullYear(),m=cur.getMonth(),pad=new Date(y,m,1).getDay(),act=S.calCats;let cells="";
 for(let i=0;i<42;i++){const d0=new Date(y,m,i-pad+1),d=iso(d0);if(i%7===0&&i>0&&d0.getMonth()!==m)break;
  let cs=ORDER.filter(c=>entriesOn(d,u).some(x=>x.e.cat===c));if(act.length)cs=cs.filter(c=>act.includes(c));
  cells+='<button class="cd'+(d0.getMonth()!==m?" mu":"")+(d===TODAY?" td":"")+(d===S.sel?" sel":"")+'" data-act="day" data-d="'+d+'"><span>'+d0.getDate()+'</span><span>'+cs.map(c=>'<i style="background:'+CAT[c].c+'"></i>').join("")+'</span></button>';}
 let it=entriesOn(S.sel,u);if(act.length)it=it.filter(x=>act.includes(x.e.cat));
 return '<div class="calwrap"><div class="calmain"><div class="calh"><h1>'+MONTHS[m]+" "+y+'</h1><button class="btn sm" data-act="mon" data-n="-1" aria-label="Previous month">‹</button><button class="btn sm" data-act="day" data-d="'+TODAY+'">Today</button><button class="btn sm" data-act="mon" data-n="1" aria-label="Next month">›</button></div>'+
 '<div class="chips"><button class="chip'+(act.length?"":" on")+'" data-act="calcat" data-c="all">All</button>'+ORDER.map(c=>'<button class="chip'+(act.includes(c)?" on":"")+'" data-act="calcat" data-c="'+c+'">'+CAT[c].pl+'</button>').join("")+'</div>'+
 '<div class="cg">'+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>'<span class="dw">'+x+'</span>').join("")+cells+'</div></div><div class="calday">'+
 sh(fmtL(S.sel),it.length+" entr"+(it.length===1?"y":"ies"))+(it.length?it.map(x=>row(x.e)).join(""):empty("Nothing on this date","Use “+ Add new” on Home to add something."))+'</div></div>';}

/* ---- calendar page actions ---- */
PAGE_ACTIONS.day=d=>{S.sel=d.d};
PAGE_ACTIONS.mon=d=>{const c=d2(S.sel);c.setDate(1);c.setMonth(c.getMonth()+ +d.n);S.sel=iso(c)};
PAGE_ACTIONS.calcat=d=>{if(d.c==="all")S.calCats=[];else{const i=S.calCats.indexOf(d.c);i>-1?S.calCats.splice(i,1):S.calCats.push(d.c)}};