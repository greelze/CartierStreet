"use strict";
/* START
   Connects to Supabase, then shows the sign-in screen or the workspace. */

/* supabase */
const supabaseUrl='https://wrnrhcuxbfmvrwvxggnv.supabase.co';
const supabaseKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndybnJoY3V4YmZtdnJ3dnhnZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTk5ODYsImV4cCI6MjEwNTI5NTk4Nn0.rVSiMNRWLUXniyjWuJaPmXLvc7fhFO-wv5iBhja3Y58';
const db=supabase.createClient(supabaseUrl,supabaseKey);

render(); // "Loading…" until Supabase says whether someone is signed in
db.auth.onAuthStateChange((ev,session)=>{setTimeout(()=>onAuth(ev,session),0)}); // setTimeout: Supabase asks that no other calls run inside this callback
window.addEventListener("focus",()=>refresh()); // catch up when you come back to the tab
