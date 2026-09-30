"use strict";
/* MY DAY PAGE
   Three big buttons: Today, This Week, Next Week.
   Today opens category cards (like Home); tapping a card lists that category's items for today.
   This Week / Next Week list items grouped by day.
   Which date counts:  Songs → Final submission · Content, Activities, Gigs → Date · Tasks → Due date.
   A Filter button narrows everything on My Day to certain categories and/or one person.
   HTML: built by vMyDay() below. CSS: css/pages/my-day.css (shared styles: css/base.css). */
Object.assign(S,{dcat:null,mcats:[],mpp:"",mflt:false}); // My Day's own state: open category, filters
const PERIODS={today:"Today",week:"This Week",next:"Next Week"};
const MD_DESC={tasks:"Tasks due today.",songs:"Songs with a final submission today.",content:"Posts scheduled for today.",activities:"Activities happening today.",gigs:"Gigs and events today."};
const PRE_SUBMIT=["Not Started","In Production","For Submission"]; // a song's final submission only matters before it's submitted

/* the one date My Day uses for each category */
const dayDate=e=>e.cat==="songs"?e.final||"":e.cat==="tasks"?e.due||"":e.date||"";
const whenLabel=e=>e.cat==="songs"?"Final submission":e.cat==="tasks"?"Due":ft(e.time)||"";

/* the dates each period covers (weeks run Sunday–Saturday, like the Calendar) */
function range(k){const ws=weekStart(TODAY);return k==="today"?[TODAY,TODAY]:k==="week"?[addD(TODAY,1),addD(ws,6)]:[addD(ws,7),addD(ws,13)];}
const shortDay=s=>{const d=d2(s);return DOW[d.getDay()]+", "+d.getDate()+" "+MONTHS[d.getMonth()];};
const rangeTxt=k=>{const[a,b]=range(k);return k==="today"?shortDay(a):a>b?"This week ends today":fmtS(a)+" – "+fmtS(b);};

/* everything you can see that isn't finished, after filters, split by its My Day date */
const mdFiltered=()=>!!(S.mcats.length||S.mpp);
function dayGroups(){const g={over:[],today:[],week:[],next:[]},[w0,w1]=range("week"),[n0,n1]=range("next");
 visible(S.user).filter(e=>!isFin(e)&&(!S.mcats.length||S.mcats.includes(e.cat))&&(!S.mpp||involved(e,S.mpp))).forEach(e=>{const d=dayDate(e);if(!d)return;
  if(d<TODAY){if(e.cat!=="songs"||PRE_SUBMIT.includes(e.status))g.over.push(e);}
  else if(d===TODAY)g.today.push(e);else if(d>=w0&&d<=w1)g.week.push(e);else if(d>=n0&&d<=n1)g.next.push(e);});
 const byDate=(a,b)=>dayDate(a).localeCompare(dayDate(b))||(a.time||"").localeCompare(b.time||"");for(const k in g)g[k].sort(byDate);return g;}

/* list rows showing the My Day date (not the song's release date) */
function mRow(e){const t=tone(e.status),w=whenLabel(e);
 return '<button class="row" data-act="open" data-id="'+e.id+'"><i class="bar" style="background:'+CAT[e.cat].c+'"></i><span><span class="t">'+H(e.title)+'</span><span class="m">'+H(mline(e))+'</span><span class="s" style="color:'+t[0]+'">'+H(sline(e))+'</span></span><span class="r">'+fmtS(dayDate(e))+(w?'<em>'+H(w)+'</em>':"")+'<br>'+ctag(e.cat)+'</span></button>';}
function mTl(e){return '<button class="tlr" data-act="open" data-id="'+e.id+'"><span class="tm">'+H(whenLabel(e)||"Today")+'</span><i style="width:3px;align-self:stretch;border-radius:9px;background:'+CAT[e.cat].c+'"></i><span class="b"><b>'+H(e.title)+'</b><span class="mut" style="display:block;font-size:14px">'+H(mline(e))+'</span></span>'+ctag(e.cat)+'</button>';}

/* ---- Filter button + panel (shared by every My Day screen) ---- */
function mdFilterBtn(){const n=S.mcats.length+(S.mpp?1:0);
 return '<button class="btn big'+(n?" fon":"")+'" data-act="mflt" aria-expanded="'+S.mflt+'">'+sv('<path d="M4 6h16M7 12h10M10 18h4"/>')+'<span>Filter'+(n?" · "+n:"")+'</span></button>';}
function mdFilterPanel(){
 if(S.mflt)return '<div class="fpanel"><div class="fhead"><b>Show only…</b><span style="display:flex;gap:8px"><button class="btn sm" data-act="mclear">Clear filters</button><button class="btn sm pri" data-act="mflt">Done</button></span></div>'+
  '<div class="chips">'+ORDER.map(c=>'<button class="chip'+(S.mcats.includes(c)?" on":"")+'" data-act="mcat" data-c="'+c+'">'+CAT[c].pl+'</button>').join("")+'</div>'+
  '<div class="tb"><select data-flt="mpp" aria-label="Person"><option value="">Anyone</option>'+MK.map(k=>'<option value="'+k+'"'+(S.mpp===k?" selected":"")+'>'+H(mn(k))+'</option>').join("")+'</select></div></div>';
 if(!mdFiltered())return"";
 return '<div class="fsum"><span>Showing only: <b>'+[S.mcats.map(c=>CAT[c].pl).join(", "),S.mpp?mn(S.mpp):""].filter(Boolean).join(" · ")+'</b></span><button class="linkbtn" data-act="mclear">Clear</button></div>';}

/* ---- screens ---- */
function vMyDay(){if(S.dview==="today"&&S.dcat)return vTodayCat(S.dcat);if(S.dview==="today")return vToday();if(S.dview)return vPeriod(S.dview);
 const g=dayGroups(),first=g.today[0],wk=g.week[0],nx=g.next[0];
 return '<div class="ph"><div><p class="mut">My Day</p><h1>'+shortDay(TODAY)+'</h1><p class="mut lead">Pick a time to see what’s planned.</p></div><div class="acts">'+searchBtn()+mdFilterBtn()+'</div></div>'+mdFilterPanel()+
 '<div class="cards days">'+
 bigCard({act:"dview",data:' data-k="today"',cls:"today",icon:I.sun,title:"Today",desc:"Everything happening or due today.",count:g.today.length,unit:things(g.today.length),
  warn:g.over.length?g.over.length+" past due, not done yet":"",next:first?"First: "+H(whenLabel(first)||"Today")+" · "+H(first.title):"Nothing planned today"})+
 bigCard({act:"dview",data:' data-k="week"',cls:"week",icon:I.cal,title:"This Week",desc:rangeTxt("week"),count:g.week.length,unit:things(g.week.length),
  next:wk?"Next: "+H(wk.title)+" · "+whenTxt(dayDate(wk)):"Nothing else this week"})+
 bigCard({act:"dview",data:' data-k="next"',cls:"next",icon:I.nxt,title:"Next Week",desc:rangeTxt("next"),count:g.next.length,unit:things(g.next.length),
  next:nx?"First: "+H(nx.title)+" · "+whenTxt(dayDate(nx)):"Nothing planned yet"})+'</div>';}

/* Today: one card per category, the same look as Home */
function vToday(){const g=dayGroups(),cats=HUB.filter(h=>!S.mcats.length||S.mcats.includes(h[0]));
 return backBar("My Day","dview",' data-k=""')+
 '<div class="pband today"><div><h1>Today</h1><p>'+rangeTxt("today")+' · '+g.today.length+' '+things(g.today.length)+(g.over.length?' · '+g.over.length+' past due':'')+'</p></div>'+mdFilterBtn()+'</div>'+mdFilterPanel()+
 '<div class="cards">'+cats.map(([c,label,icon])=>{const t=g.today.filter(e=>e.cat===c),o=g.over.filter(e=>e.cat===c);
  return bigCard({act:"dcat",data:' data-c="'+c+'"',icon,title:c==="tasks"?"Tasks":label,desc:MD_DESC[c],color:CAT[c].c,count:t.length,unit:"today",
   warn:o.length?o.length+" past due":"",next:t[0]?"First: "+H(whenLabel(t[0])||"Today")+" · "+H(t[0].title):"Nothing today"});}).join("")+'</div>';}

/* Today → one category: its past-due items, then everything today */
function vTodayCat(c){const g=dayGroups(),t=g.today.filter(e=>e.cat===c),o=g.over.filter(e=>e.cat===c),h=HUB.find(x=>x[0]===c),label=c==="tasks"?"Tasks":h[1];
 return backBar("Today","dcat",' data-c=""')+
 '<div class="ph"><div><h1 class="ttl" style="--cc:'+CAT[c].c+'">'+sv(h[2])+label+' today</h1><p class="mut lead">'+t.length+' '+(t.length===1?"item":"items")+' today'+(o.length?' · '+o.length+' past due':'')+'.</p></div></div>'+
 (o.length?'<div class="sec over"><div class="sh"><span>Past due, not done yet</span><span>'+o.length+'</span></div>'+o.map(mRow).join("")+'</div>':"")+
 (t.length?sh("Today",t.length)+t.map(mTl).join(""):empty("Nothing today",o.length?"Only the past-due items above need attention.":"Nothing in "+label.toLowerCase()+" is planned for today."));}

/* This Week / Next Week: grouped by day */
function vPeriod(k){const l=dayGroups()[k];let body;
 if(!l.length)body=empty(k==="week"&&range(k)[0]>range(k)[1]?"This week ends today":"Nothing planned yet",mdFiltered()?"Try clearing the filters.":k==="week"?"Check Next Week to see what’s coming.":"Nothing is scheduled for next week yet.");
 else{const ds=[...new Set(l.map(dayDate))].sort();
  body=ds.map(d=>{const it=l.filter(e=>dayDate(e)===d);return sh(shortDay(d)+(d===addD(TODAY,1)?" · Tomorrow":""),it.length)+it.map(mRow).join("")}).join("");}
 return backBar("My Day","dview",' data-k=""')+
  '<div class="pband '+k+'"><div><h1>'+PERIODS[k]+'</h1><p>'+rangeTxt(k)+' · '+l.length+' '+things(l.length)+'</p></div>'+mdFilterBtn()+'</div>'+mdFilterPanel()+body;}

/* ---- my-day page actions ---- */
PAGE_ACTIONS.dview=d=>{S.dview=d.k||null;S.dcat=null;scrollTo(0,0)};
PAGE_ACTIONS.dcat=d=>{S.dcat=d.c||null;scrollTo(0,0)};
PAGE_ACTIONS.mflt=()=>{S.mflt=!S.mflt};
PAGE_ACTIONS.mcat=d=>{const i=S.mcats.indexOf(d.c);i>-1?S.mcats.splice(i,1):S.mcats.push(d.c)};
PAGE_ACTIONS.mclear=()=>{S.mcats=[];S.mpp="";S.mflt=false};