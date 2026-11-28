/* TAKEN_WEEK_V1 (t671u): weekbord zoals het schrift, geschiedenis met 'niets kwijt'-teller, prullenbak (30 dagen),
   spoor per taak en concepten onder 'Wacht op jou'. Alleen Robin/Rutger (Taken-tab). Verstuurt nooit iets. */
(function(){
const e=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const api=(p,m,b)=>window.TK_API(p,m||"GET",b);
const dg=s=>{s=String(s||"").slice(0,10);return s.length===10?s.slice(8,10)+"-"+s.slice(5,7):s};
const tijd=s=>String(s||"").slice(11,16);
const vandaagIso=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Amsterdam"});
let WEEK_OFF=0,G={soort:"week",dag:null,persoon:""};

function sheet(titel,html){
  let o=document.getElementById("tw-ov");
  if(!o){o=document.createElement("div");o.id="tw-ov";o.className="tw-ov";document.body.appendChild(o);
    o.addEventListener("click",ev=>{if(ev.target===o)sluit()})}
  o.innerHTML=`<div class="tw-sheet" role="dialog" aria-label="${e(titel)}"><div class="tw-kop"><b>${e(titel)}</b><button type="button" class="tw-x" data-tw-x="1" aria-label="Sluiten">✕</button></div><div class="tw-body">${html}</div></div>`;
  o.classList.add("on");document.documentElement.classList.add("tw-open");
}
function sluit(){const o=document.getElementById("tw-ov");if(o){o.classList.remove("on");o.innerHTML=""}document.documentElement.classList.remove("tw-open")}
function melding(t){let b=document.getElementById("tw-toast");if(!b){b=document.createElement("div");b.id="tw-toast";b.className="tw-toast";b.setAttribute("role","status");document.body.appendChild(b)}
  b.innerHTML=t;b.classList.add("on");clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove("on"),7000)}
async function herlaad(){try{if(window.TK_HERLAAD)await window.TK_HERLAAD()}catch(x){}}

/* ---------- balk boven de takenlijst ---------- */
function balk(D){
  const n=D&&D.niets_kwijt,pb=n?n.prullenbak:0;
  const zd=D&&D.vandaag&&D.vandaag.zonder_dag?D.vandaag.zonder_dag.length:0;
  return `<div class="tw-balk"><button type="button" class="tk-btn sec" data-tw="week">📅 Weekbord</button><button type="button" class="tk-btn sec" data-tw="gesch">🕘 Geschiedenis</button><button type="button" class="tk-btn sec" data-tw="prul">🗑 Prullenbak${pb?" ("+pb+")":""}</button></div>
  ${n?`<div class="tw-teller ${n.klopt?"ok":"nok"}">${n.klopt?"✅":"⚠️"} ${e(n.tekst)}${zd?` · <button type="button" class="tk-link" data-tw="week">${zd} zonder dag</button>`:""}</div>`:""}
  ${conceptBlok(D,true)}`;
}

/* ---------- concepten (Wacht op jou) ---------- */
function conceptBlok(D,compact){
  const C=(D&&D.concepten)||[];
  if(!C.length)return compact?"":`<section class="tk-wacht tw-conc"><h3>📝 Concepten</h3><div class="tk-meta">Geen concepten. Alles wat je in Telegram stuurde is bevestigd of weggezet.</div></section>`;
  return `<section class="tk-wacht tw-conc"><h3>📝 Wacht op jou: concepten <span class="cnt">${C.length}</span></h3>
   <div class="tk-meta">Nog niet opgeslagen. Kies wat erin moet; de rest blijft hier staan.</div>
   ${C.map(c=>`<div class="tw-c"><div class="tk-meta">${e(c.door||"")}${c.ts?" · "+dg(c.ts)+" "+tijd(c.ts):""} · ${e(c.bron||"")}</div>
     ${c.items.map((it,i)=>`<div class="tw-ci"><span>${it.soort==="binnenkomend"?"🚚":it.soort==="niet_op_locatie"?"📍":it.soort==="zoekopdracht"?"🔎":it.soort==="regel"?"✏️":"☐"} ${e(it.tekst_kort)}</span>${c.items.length>1&&it.soort!=="regel"?`<button type="button" class="tk-link" data-cop="${e(c.id)}" data-n="${i}">alleen deze</button>`:""}</div>`).join("")}
     <div class="tk-row"><button type="button" class="tk-btn prim" data-cop="${e(c.id)}">✅ Opslaan</button><button type="button" class="tk-btn sec" data-cweg="${e(c.id)}">Weg</button></div></div>`).join("")}</section>`;
}
async function conceptOp(id,n){
  try{const r=await api("/taken/concepten/"+encodeURIComponent(id)+"/opslaan","POST",n==null?{}:{nummers:[+n]});
    melding("✅ "+e(r.tekst||"Opgeslagen")+(r.fouten&&r.fouten.length?"<br>⚠️ "+r.fouten.map(e).join("<br>"):""));await herlaad()}catch(x){alert(x.message)}}
async function conceptWeg(id){
  try{const r=await api("/taken/concepten/"+encodeURIComponent(id)+"/weg","POST",{});await herlaad();
    melding(`Concept weggezet. <button type="button" class="tk-link" data-cterug="${e(r.id||id)}">Ongedaan maken</button>`)}catch(x){alert(x.message)}}

/* ---------- weekbord ---------- */
function rij(t){const k=t.status==="klaar";return `<li class="tw-t${k?" klaar":""}"><span>${k?"✅":"☐"} ${e(t.titel)}${t.auto?` <i>${e(t.auto)}</i>`:""}</span>${t.voor||t.tijd?`<small>${t.tijd?e(t.tijd)+" ":""}${t.voor?e(t.voor):""}</small>`:""}</li>`}
async function weekbord(){
  sheet("Weekbord","<p class='tk-meta'>Laden…</p>");
  let W;try{W=await api("/taken/week","POST",{offset:WEEK_OFF})}catch(x){sheet("Weekbord",`<div class="tk-warn">${e(x.message)}</div>`);return}
  const kol=W.dagen.map(d=>`<div class="tw-dag${d.vandaag?" nu":""}"><h4>${d.naam} <small>${dg(d.dag)}</small></h4><ul>${d.taken.map(rij).join("")||"<li class='tw-leeg'>—</li>"}</ul></div>`).join("");
  const vast=W.vast.length?W.vast.map(v=>`<li>🔁 ${e(v.titel)} <small>${e(v.dagen.join(", ")||v.ritme_tekst)}${v.voor?" · "+e(v.voor):""}</small></li>`).join(""):"<li class='tw-leeg'>Nog geen vaste weektaken.</li>";
  const bk=W.binnenkomend.map(b=>`<li>🚚 ${e(b.auto)} <small>${b.verwacht?"verwacht "+e(dg(b.verwacht)):"dag onbekend"}</small> <button type="button" class="tk-link" data-twb="${e(b.id)}">binnen ✓</button> <button type="button" class="tk-link" data-twv="${e(b.id)}">dag</button></li>`).join("")||"<li class='tw-leeg'>Niets onderweg.</li>";
  const nl=W.niet_op_locatie.map(b=>`<li>📍 ${e(b.auto)}${b.locatie?" → "+e(b.locatie):""} <button type="button" class="tk-link" data-twn="${e(b.id)}">terug ✓</button></li>`).join("")||"<li class='tw-leeg'>Alles op locatie.</li>";
  const zk=W.zoekopdrachten.map(z=>`<li>🔎 ${e(z.naam)}${z.klant?" · "+e(z.klant):""} <small>${e(z.filters.join(" · "))}</small></li>`).join("")||"<li class='tw-leeg'>Geen actieve zoekopdrachten.</li>";
  sheet("Weekbord",`<div class="tw-nav"><button type="button" class="tk-btn sec" data-twoff="-1">◀</button><b>${dg(W.van)} – ${dg(W.tot)}</b><button type="button" class="tk-btn sec" data-twoff="1">▶</button>${WEEK_OFF?`<button type="button" class="tk-link" data-twoff="0">deze week</button>`:""}</div>
    <div class="tw-teller ${W.teller.klopt?"ok":"nok"}">${W.teller.klopt?"✅":"⚠️"} ${e(W.teller.tekst)}</div>
    ${W.concepten?`<div class="tw-teller nok">📝 ${W.concepten} concept-regel(s) wachten op je bevestiging bij Wacht op jou.</div>`:""}
    ${W.te_laat.length?`<div class="tw-blok laat"><h4>Te laat <span class="cnt">${W.te_laat.length}</span></h4><ul>${W.te_laat.map(t=>rij(t).replace("</span>",` <small>${e(dg(t.deadline))}</small></span>`)).join("")}</ul></div>`:""}
    <div class="tw-week">${kol}<div class="tw-dag zd"><h4>Zonder dag <span class="cnt">${W.zonder_dag.length}</span></h4><ul>${W.zonder_dag.map(rij).join("")||"<li class='tw-leeg'>—</li>"}</ul></div></div>
    <div class="tw-blok"><h4>Vaste weektaken</h4><ul>${vast}</ul><button type="button" class="tk-btn sec" data-twvast="1">+ Vaste weektaak</button></div>
    <div class="tw-blok"><h4>Binnenkomend <span class="cnt">${W.binnenkomend.length}</span></h4><ul>${bk}</ul><button type="button" class="tk-btn sec" data-twbn="1">+ Auto komt binnen</button></div>
    <div class="tw-blok"><h4>Niet op locatie <span class="cnt">${W.niet_op_locatie.length}</span></h4><ul>${nl}</ul><button type="button" class="tk-btn sec" data-twnn="1">+ Auto niet op locatie</button></div>
    <div class="tw-blok"><h4>Zoekopdrachten <span class="cnt">${W.zoekopdrachten.length}</span></h4><ul>${zk}</ul></div>`);
}
async function weekPost(p,b){try{await api(p,"POST",Object.assign({offset:WEEK_OFF},b||{}));await weekbord();herlaad()}catch(x){alert(x.message)}}

/* ---------- geschiedenis ---------- */
function gRij(x,extra){return `<li>${e(x.titel)}${x.auto?` <i>${e(x.auto)}</i>`:""} <small>${extra||""}</small></li>`}
async function geschiedenis(){
  if(!G.dag)G.dag=vandaagIso();
  sheet("Geschiedenis","<p class='tk-meta'>Laden…</p>");
  let R;try{R=await api("/taken/spoor/geschiedenis","POST",G)}catch(x){sheet("Geschiedenis",`<div class="tk-warn">${e(x.message)}</div>`);return}
  const tab=[["dag","Dag"],["week","Week"],["maand","Maand"]].map(([k,l])=>`<button type="button" class="${G.soort===k?"on":""}" data-tgs="${k}">${l}</button>`).join("");
  const pers=`<select id="tw-pers"><option value="">Iedereen</option>${(R.personen||[]).map(p=>`<option ${G.persoon===p?"selected":""}>${e(p)}</option>`).join("")}</select>`;
  const blok=(t,L,f)=>`<div class="tw-blok"><h4>${t} <span class="cnt">${L.length}</span></h4><ul>${L.map(f).join("")||"<li class='tw-leeg'>—</li>"}</ul></div>`;
  const pp=Object.entries(R.per_persoon||{});
  sheet("Geschiedenis",`<div class="tk-filters">${tab}</div><div class="tw-nav"><button type="button" class="tk-btn sec" data-tgn="-1">◀</button><b>${R.van===R.tot?dg(R.van):dg(R.van)+" – "+dg(R.tot)}</b><button type="button" class="tk-btn sec" data-tgn="1">▶</button></div>${pers}
    <div class="tw-teller ${R.teller.klopt?"ok":"nok"}">${R.teller.klopt?"✅":"⚠️"} ${e(R.teller.tekst)}</div>
    ${pp.length?`<div class="tk-meta">Gedaan per persoon: ${pp.map(([n,k])=>e(n)+" "+k).join(" · ")}</div>`:""}
    ${blok("✅ Gedaan",R.gedaan,x=>gRij(x,(x.door?e(x.door)+" · ":"")+dg(x.op)+" "+tijd(x.op)))}
    ${blok("⏳ Niet gedaan",R.niet_gedaan,x=>gRij(x,(x.voor?e(x.voor)+" · ":"")+"uiterlijk "+dg(x.op)))}
    ${blok("➡️ Verplaatst",R.verplaatst,x=>gRij(x,(x.van?dg(x.van):"geen dag")+" → "+(x.naar?dg(x.naar):"geen dag")+(x.door?" · "+e(x.door):"")))}
    ${blok("➕ Nieuw",R.nieuw||[],x=>gRij(x,(x.door?e(x.door)+" · ":"")+dg(x.op)))}
    ${blok("🗑 Weggehaald",R.weg||[],x=>gRij(x,(x.door?e(x.door)+" · ":"")+e(x.reden||"")))}`);
  const s=document.getElementById("tw-pers");if(s)s.onchange=()=>{G.persoon=s.value;geschiedenis()};
}
function gSchuif(n){const d=new Date(G.dag+"T12:00:00");if(G.soort==="dag")d.setDate(d.getDate()+n);else if(G.soort==="week")d.setDate(d.getDate()+7*n);else d.setMonth(d.getMonth()+n);G.dag=d.toISOString().slice(0,10);geschiedenis()}

/* ---------- prullenbak + spoor ---------- */
async function prullenbak(){
  sheet("Prullenbak","<p class='tk-meta'>Laden…</p>");
  let R;try{R=await api("/taken/spoor/prullenbak")}catch(x){sheet("Prullenbak",`<div class="tk-warn">${e(x.message)}</div>`);return}
  const L=R.prullenbak||[];
  sheet("Prullenbak",`<div class="tk-meta">Weggehaalde taken blijven 30 dagen staan. Daarna zijn ze echt weg.</div>
   <ul class="tw-pb">${L.map(x=>`<li><div><b>${e(x.titel)}</b>${x.auto?` <i>${e(x.auto)}</i>`:""}<br><small>${e(x.door||"")} · ${dg(x.weg_op)} ${tijd(x.weg_op)} · ${e(x.reden||"")} · nog ${x.nog_dagen} dag(en)</small></div><button type="button" class="tk-btn sec" data-pbt="${e(x.id)}">↩️ Terugzetten</button></li>`).join("")||"<li class='tw-leeg'>De prullenbak is leeg.</li>"}</ul>`);
}
async function terug(id){try{await api("/taken/spoor/prullenbak/"+encodeURIComponent(id)+"/terug","POST",{});melding("↩️ Taak staat er weer.");await herlaad();if(document.getElementById("tw-ov")&&document.getElementById("tw-ov").classList.contains("on"))prullenbak()}catch(x){alert(x.message)}}
async function weg(id){
  const t=((window.TK_DATA&&window.TK_DATA()||{}).taken||[]).find(x=>x.id===id);
  if(!confirm(`Taak '${t?t.titel:""}' weghalen? Hij blijft 30 dagen in de prullenbak.`))return;
  try{await api("/taken/spoor/weg/"+encodeURIComponent(id),"POST",{});await herlaad();
    melding(`🗑 Weggehaald. <button type="button" class="tk-link" data-pbt="${e(id)}">Ongedaan maken</button>`)}catch(x){alert(x.message)}}
const AN={aangemaakt:"➕ Aangemaakt",klaar:"✅ Klaar",heropend:"↩️ Heropend",bezig:"⏳ Bezig",verplaatst:"➡️ Verplaatst",toegewezen:"👤 Toegewezen",tijd:"🕒 Tijd",titel:"✏️ Titel aangepast",verwijderd:"🗑 Weggehaald",teruggezet:"↩️ Teruggezet",status:"Status"};
async function spoor(id){
  sheet("Spoor","<p class='tk-meta'>Laden…</p>");
  let R;try{R=await api("/taken/spoor/taak/"+encodeURIComponent(id))}catch(x){sheet("Spoor",`<div class="tk-warn">${e(x.message)}</div>`);return}
  sheet("Spoor: "+(R.titel||""),`<ul class="tw-sp">${(R.spoor||[]).map(s=>`<li><b>${AN[s.actie]||e(s.actie)}</b>${s.van!==undefined||s.naar!==undefined?` ${s.van?e(dg(s.van)||s.van):"—"} → ${s.naar?e(dg(s.naar)||s.naar):"—"}`:""}${s.reden?" · "+e(s.reden):""}<br><small>${e(s.door||"")} · ${dg(s.ts)} ${tijd(s.ts)}</small></li>`).join("")||"<li class='tw-leeg'>Nog geen spoor.</li>"}</ul>`);
}

/* ---------- klikken (één luisteraar) ---------- */
document.addEventListener("click",ev=>{
  const b=ev.target.closest("[data-tw],[data-tw-x],[data-cop],[data-cweg],[data-cterug],[data-twoff],[data-twb],[data-twv],[data-twn],[data-twbn],[data-twnn],[data-twvast],[data-tgs],[data-tgn],[data-pbt],[data-weg],[data-spoor]");
  if(!b)return;const d=b.dataset;
  if(d.twX){sluit();return}
  if(d.tw==="week"){weekbord();return} if(d.tw==="gesch"){geschiedenis();return} if(d.tw==="prul"){prullenbak();return}
  if(d.cop){conceptOp(d.cop,d.n);return} if(d.cweg){conceptWeg(d.cweg);return}
  if(d.cterug){api("/taken/concepten/"+encodeURIComponent(d.cterug)+"/terug","POST",{}).then(herlaad).then(()=>melding("Concept staat er weer.")).catch(x=>alert(x.message));return}
  if(d.twoff!==undefined){WEEK_OFF=d.twoff==="0"?0:WEEK_OFF+(+d.twoff);weekbord();return}
  if(d.twb){weekPost("/taken/week/binnenkomend/"+d.twb+"/binnen");return}
  if(d.twv){const v=prompt("Verwachte dag (JJJJ-MM-DD, leeg = onbekend)",vandaagIso());if(v!==null)weekPost("/taken/week/binnenkomend/"+d.twv+"/verwacht",{verwacht:v.trim()});return}
  if(d.twn){weekPost("/taken/week/nol/"+d.twn+"/terug");return}
  if(d.twbn){const a=prompt("Welke auto komt binnen?");if(!a)return;const v=prompt("Verwachte dag (JJJJ-MM-DD, leeg = onbekend)","");weekPost("/taken/week/binnenkomend",{auto:a,verwacht:(v||"").trim()});return}
  if(d.twnn){const a=prompt("Welke auto staat niet op locatie?");if(!a)return;const p=prompt("Waar staat hij? (bijv. bij Emin)","");weekPost("/taken/week/nol",{auto:a,plaats:p||""});return}
  if(d.twvast){const t=prompt("Vaste weektaak, bijv. Showroom stofzuigen");if(!t)return;const r=prompt("Hoe vaak? Bijv. elke maandag, elke werkdag","elke maandag");if(!r)return;const v=prompt("Voor wie? (leeg = niet toegewezen)","")||"";
    api("/taken/terugkerend","POST",{titel:t,ritme:r,voor:v}).then(()=>{weekbord();herlaad()}).catch(x=>alert(x.message));return}
  if(d.tgs){G.soort=d.tgs;geschiedenis();return} if(d.tgn){gSchuif(+d.tgn);return}
  if(d.pbt){terug(d.pbt);return} if(d.weg){weg(d.weg);return} if(d.spoor){spoor(d.spoor);return}
});
window.TK_WEEK={balk,conceptBlok,weekbord,geschiedenis,prullenbak,spoor,sluit};
})();
