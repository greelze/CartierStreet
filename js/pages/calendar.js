"use strict";
/* CALENDAR PAGE
   A large month grid with the chosen day's list underneath (D3.3, D3.4).
   Each day shows its entries by title on a computer, and as coloured dots on a phone (D3.3.3, F1.6).
   HTML: built by vCal() below. CSS: css/pages/calendar.css (shared styles: css/base.css). */
function vCal(){const u=S.user,cur=d2(S.sel),y=cur.getFullYear(),m=cur.getMonth(),pad=new Date(y,m,1).getDay(),act=S.calCats;let cells="";
 const onDay=d=>entriesOn(d,u).filter(x=>!act.length||act.includes(x.e.cat)); // the day's entries, after the category chips
 for(let i=0;i<42;i++){const d0=new Date(y,m,i-pad+1),d=iso(d0);if(i%7===0&&i>0&&d0.getMonth()!==m)break;
  const it=onDay(d),shown=it.slice(0,3);
  cells+='<button class="cd'+(d0.getMonth()!==m?" mu":"")+(d===TODAY?" td":"")+(d===S.sel?" sel":"")+'" data-act="day" data-d="'+d+'">'+
   '<span class="cdd">'+d0.getDate()+'</span><span class="cde">'+
   shown.map(x=>'<i class="ev'+(isCancelled(x.e)?" cx":"")+'" style="--cc:'+CAT[x.e.cat].c+'" title="'+H(x.e.title)+'"><em></em><b>'+H(x.e.title)+'</b></i>').join("")+
   (it.length>shown.length?'<i class="ev more"><em></em><b>+'+(it.length-shown.length)+' more</b></i>':"")+'</span></button>';}
 const it=onDay(S.sel);
 return '<div class="calwrap"><div class="calmain"><div class="calh"><h1>'+MONTHS[m]+" "+y+'</h1>'+
 '<button class="btn sm" data-act="mon" data-n="-1" aria-label="Previous month">‹</button><button class="btn sm" data-act="day" data-d="'+TODAY+'">Today</button><button class="btn sm" data-act="mon" data-n="1" aria-label="Next month">›</button>'+
 '<span class="calacts">'+searchBtn()+addBtn("Add new")+'</span></div>'+ // Search and Add, so nobody has to go back to Home (R2, R3)
 '<p class="mut lead callead">Every date in one place, so nothing sneaks up on you.</p>'+
 '<div class="chips"><button class="chip'+(act.length?"":" on")+'" data-act="calcat" data-c="all">All</button>'+ORDER.map(c=>'<button class="chip'+(act.includes(c)?" on":"")+'" data-act="calcat" data-c="'+c+'">'+CAT[c].pl+'</button>').join("")+'</div>'+
 '<div class="cg">'+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=>'<span class="dw">'+x+'</span>').join("")+cells+'</div></div><div class="calday">'+
 sh(fmtL(S.sel),it.length+" entr"+(it.length===1?"y":"ies"))+(it.length?it.map(x=>row(x.e,isCancelled(x.e)?"cx":"")).join(""):empty("Nothing on this date","Add something to this day.",addBtn("Add new")))+'</div></div>';}

/* ---- calendar page actions ---- */
PAGE_ACTIONS.day=d=>{S.sel=d.d};
PAGE_ACTIONS.mon=d=>{const c=d2(S.sel);c.setDate(1);c.setMonth(c.getMonth()+ +d.n);S.sel=iso(c)};
PAGE_ACTIONS.calcat=d=>{if(d.c==="all")S.calCats=[];else{const i=S.calCats.indexOf(d.c);i>-1?S.calCats.splice(i,1):S.calCats.push(d.c)}};
