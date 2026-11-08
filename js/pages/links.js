"use strict";
/* LABEL LINKS  (S48, D4.9)
   The three things somebody asks for the link to every week. Everyone reads
   them; admins change them.

   HTML: vLinks() below. CSS: css/pages/help.css
   Database: patch 20 (label_links). */

const LL=[["resources","Resources","Logos, fonts, templates, the brand kit — anything you need to make something that looks like Cartier St."],
 ["tracks","Tracks","The masters and stems, as they are delivered."],
 ["showmixes","Showmixes","Backing tracks and set mixes, ready to play."]];

function vLinks(){const ed=isAdmin(S.user);
 return backBar("Settings","tab",' data-t="settings"')+
 '<div class="ph"><div><h1>Label Links</h1><p class="mut lead">The three folders everybody asks for. '+
  (ed?"You can change them here.":"Ask an admin if one of these is wrong.")+'</p></div></div>'+
 '<div class="llg">'+LL.map(([k,name,what])=>{const url=(LABEL_FOLDERS[k]||{}).url||"",note=(LABEL_FOLDERS[k]||{}).note||"";
  return '<div class="llc'+(url?"":" empty")+'"><h4>'+name+'</h4><p>'+what+'</p>'+
   (note?'<p class="llnote">'+H(note)+'</p>':"")+
   (url?'<a class="btn pri" href="'+H(url)+'" target="_blank" rel="noopener">Open '+name+'</a>'
      :'<span class="llmiss">No link yet</span>')+
   (ed?'<div class="llf"><label><b>Link</b><input type="url" data-ll="url" data-k="'+k+'" value="'+H(url)+'" placeholder="https://drive.google.com/…"></label>'+
     '<label><b>Note</b><input data-ll="note" data-k="'+k+'" value="'+H(note)+'" placeholder="e.g. Ask Peter before moving anything in here"></label>'+
     savedMark("ll:"+k)+'</div>':"")+
   '</div>';}).join("")+'</div>'+
 (ed?'<p class="mut note">A link saves as soon as you leave the box. Everyone sees the change on their next refresh.</p>':"");}

PAGE_ACTIONS.links=()=>{S.tab="links";S.open=null;S.search=false;scrollTo(0,0)};