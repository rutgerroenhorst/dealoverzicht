/* HISTORIE_V1: advertentiehistorie per kenteken/VIN, live van de server (niet via gh-pages).
   Eén bestand voor de site (Robin/Rutger) en de medewerkerpagina /bedrijf/<token>.
   Medewerkers krijgen van de server geen inkoop, marges, biedingen, taxaties of deals. */
(function(){
const BEDRIJF=location.pathname.indexOf("/bedrijf/")>=0;
const API=BEDRIJF?"/api/inst":((typeof KL!=="undefined"&&KL.instellingen_api)||"https://2-31-144-18.sslip.io/api/inst");
const HOST=location.hostname||"";
const LIVE=BEDRIJF||HOST==="rutgerroenhorst.github.io"||/\.sslip\.io$/.test(HOST);
const SLUG=(typeof KL!=="undefined"&&KL.slug)||"brns";
const TOKEN=(()=>{if(!BEDRIJF)return"";const p=location.pathname.split("/bedrijf/")[1];return p?decodeURIComponent(p.split("/")[0]):(new URLSearchParams(location.search).get("t")||"")})();
const e=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const eur=n=>n==null||n===""?"":"€ "+Number(n).toLocaleString("nl-NL",{maximumFractionDigits:0});
const dag=s=>{if(!s)return"";const d=String(s).slice(0,10).split("-");return d.length===3?d[2]+"-"+d[1]+"-"+d[0]:s};
function hdr(json){const h={};if(json)h["Content-Type"]="application/json";
  if(BEDRIJF){h["X-Taken-Token"]=TOKEN;return h}
  const t=localStorage["inst_token_"+SLUG];if(t)h.Authorization="Bearer "+t;else if(SLUG==="brns")h["X-Klant"]="brns";return h}
const R=p=>API+(BEDRIJF?"/historie/bedrijf"+p:"/historie"+p);
async function haal(p,opt){
  if(!LIVE)throw Error("De historie komt live van de server; deze pagina is een lokale test.");
  const r=await fetch(R(p),Object.assign({cache:"no-store",headers:hdr(opt&&opt.body)},opt||{}));
  const j=await r.json().catch(()=>({}));if(!r.ok||j.ok===false)throw Error(j.fout||"Niet gelukt");return j}

function css(){if(document.getElementById("hi-css"))return;const s=document.createElement("style");s.id="hi-css";s.textContent=`
#hi-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;justify-content:center;align-items:flex-start;overflow:auto}
#hi-p{background:var(--bg,#f5f6f8);color:var(--ink,#14161a);width:100%;max-width:720px;min-height:100%;padding:14px 14px 40px;box-sizing:border-box;font:15px/1.4 -apple-system,system-ui,sans-serif}
#hi-p h2{font-size:19px;margin:4px 0 10px;display:flex;justify-content:space-between;align-items:center}
#hi-p .hi-x{border:0;background:var(--chip,#eef0f3);border-radius:10px;padding:6px 12px;font-size:15px}
#hi-p form{display:flex;gap:8px;margin-bottom:12px}#hi-p input{flex:1;min-width:0;padding:10px;border:1px solid var(--line,#e3e6eb);border-radius:10px;font-size:16px;background:var(--card,#fff);color:inherit}
#hi-p button.hi-b{padding:10px 14px;border:0;border-radius:10px;background:var(--acc,#2563eb);color:#fff;font-weight:600;font-size:15px}
#hi-p button.hi-s{background:var(--chip,#eef0f3);color:var(--ink,#14161a)}
.hi-k{background:var(--card,#fff);border:1px solid var(--line,#e3e6eb);border-radius:14px;padding:12px;margin:10px 0}
.hi-k h3{margin:0 0 6px;font-size:16px}.hi-m{color:var(--mute,#5d6470);font-size:13px}
.hi-g{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:14px}.hi-g b{font-weight:600}
.hi-t{list-style:none;padding:0;margin:0;border-left:2px solid var(--line,#e3e6eb);margin-left:6px}
.hi-t li{position:relative;padding:0 0 12px 14px}.hi-t li:before{content:"";position:absolute;left:-6px;top:5px;width:10px;height:10px;border-radius:50%;background:var(--acc,#2563eb)}
.hi-t li.rec:before{background:#a855f7}.hi-t li.rdw:before,.hi-t li.apk:before,.hi-t li.tenaamstelling:before{background:#16a34a}.hi-t li.weg:before{background:#dc2626}
.hi-d{font-weight:600;font-size:13px;color:var(--mute,#5d6470)}.hi-pr{font-weight:700}
.hi-badge{display:inline-block;font-size:11px;padding:1px 7px;border-radius:9px;background:#f3e8ff;color:#7e22ce;margin-left:6px;vertical-align:1px}
.hi-sig{background:var(--warnbg,#fff1e6);color:var(--warn,#c2410c);border-radius:12px;padding:8px 10px;margin:8px 0;font-size:14px}
.hi-btn{margin-left:6px}a.hi-l{color:var(--acc,#2563eb);font-size:12px;text-decoration:none}
.hi-deal{background:#eef6ff;border-color:#bfdbfe}`;document.head.appendChild(s)}

let HUIDIG=null,POLL=null;
function open(q){css();sluit();const ov=document.createElement("div");ov.id="hi-ov";
  ov.innerHTML=`<div id="hi-p"><h2>Advertentiehistorie <button class="hi-x" type="button">Sluiten</button></h2>
  <form id="hi-f"><input id="hi-q" placeholder="Kenteken, VIN of advertentielink" autocomplete="off" autocapitalize="characters" value="${e(q||"")}"><button class="hi-b">Zoek</button></form>
  <div id="hi-r"><div class="hi-m">Zoek op kenteken (bijv. 7-ZRZ-07), VIN of een advertentielink.</div></div></div>`;
  document.body.appendChild(ov);document.body.style.overflow="hidden";
  ov.querySelector(".hi-x").onclick=sluit;ov.onclick=x=>{if(x.target===ov)sluit()};
  ov.querySelector("#hi-f").onsubmit=x=>{x.preventDefault();zoek(ov.querySelector("#hi-q").value)};
  if(q)zoek(q)}
function sluit(){const o=document.getElementById("hi-ov");if(o)o.remove();document.body.style.overflow="";if(POLL){clearInterval(POLL);POLL=null}}
async function zoek(q){const r=document.getElementById("hi-r");if(!r)return;r.innerHTML='<div class="hi-m">Zoeken…</div>';
  try{HUIDIG=await haal("?q="+encodeURIComponent(q.trim()));teken()}catch(x){r.innerHTML=`<div class="hi-sig">${e(x.message)}</div>`}}

function teken(){const d=HUIDIG,r=document.getElementById("hi-r");if(!d||!r)return;
  const rd=d.rdw||{},A=d.advertenties||[],T=d.tijdlijn||[];let h="";
  h+=`<div class="hi-k"><h3>${e(d.kenteken_opmaak||d.kenteken||d.vin||"Onbekend")} ${rd.gevonden?"· "+e([rd.merk,rd.model].filter(Boolean).join(" ")):""}</h3>`;
  if(rd.gevonden)h+=`<div class="hi-g"><span>Kleur (RDW)</span><b>${e(rd.kleur||"—")}</b><span>Eerste toelating</span><b>${e(dag(rd.datum_eerste_toelating)||"—")}</b>
    <span>Import NL</span><b>${e(dag(rd.datum_eerste_tenaamstelling_nl)||"—")}</b><span>Laatste tenaamstelling</span><b>${e(dag(rd.datum_tenaamstelling)||"—")}</b>
    <span>APK tot</span><b>${e(dag(rd.vervaldatum_apk)||"—")}</b><span>Tellerstand</span><b>${e(rd.tellerstandoordeel||"—")}${rd.jaar_laatste_tellerstand?" (laatst "+e(rd.jaar_laatste_tellerstand)+")":""}</b></div>
    <div class="hi-m" style="margin-top:6px">Bron: <a class="hi-l" href="${e(rd.bron_url)}" target="_blank" rel="noopener">${e(rd.bron)}</a></div>`;
  else h+=`<div class="hi-m">${e(rd.reden||"Geen RDW-gegevens")}</div>`;
  h+=`</div>`;
  if(d.deal)h+=`<div class="hi-k hi-deal"><h3>In ons dealsysteem</h3><div>${e(d.deal.titel||"")}${d.deal.marge!=null?" · marge "+eur(d.deal.marge):""}</div><div class="hi-m">Alleen zichtbaar voor Robin en Rutger.</div></div>`;
  (d.signalen||[]).forEach(s=>h+=`<div class="hi-sig">${e(s.tekst)}</div>`);
  h+=`<div class="hi-k"><h3>Tijdlijn</h3>`+(T.length?`<ul class="hi-t">${T.slice().reverse().map(t=>`<li class="${t.gereconstrueerd?"rec":e(t.soort)}"><div class="hi-d">${e(dag(t.datum))}${t.gereconstrueerd?'<span class="hi-badge">gereconstrueerd</span>':""}</div>
    <div>${e(t.tekst)}${t.prijs!=null?` · <span class="hi-pr">${eur(t.prijs)}</span>`:""}</div>
    <div>${t.link?`<a class="hi-l" href="${e(t.link)}" target="_blank" rel="noopener">${e(t.bron)}</a>`:`<span class="hi-m">${e(t.bron)}</span>`}</div></li>`).join("")}</ul>`:`<div class="hi-m">Nog geen gebeurtenissen.</div>`)+`</div>`;
  h+=`<div class="hi-k"><h3>Advertenties in ons archief (${A.length})</h3>`+(A.length?A.map(a=>`<div style="margin:6px 0 10px"><div><b>${e(a.bron)}</b>${a.dealer?" · "+e(a.dealer):""} · ${e(a.status)}</div>
    <div class="hi-m">Te koop sinds ${e(dag(a.online_sinds||a.eerst_gezien))} · laatst gezien ${e(dag(a.laatst_gezien))}${a.dagen_online!=null?" · "+e(a.dagen_online)+" dagen online":""}${a.km?" · "+Number(a.km).toLocaleString("nl-NL")+" km":""}</div>
    <div>${(a.prijzen||[]).map(p=>`${e(dag(p.datum))}: <b>${eur(p.prijs)}</b>`).join(" → ")}</div><a class="hi-l" href="${e(a.url)}" target="_blank" rel="noopener">Open advertentie</a></div>`).join("")
    :`<div class="hi-m">Niet gezien in ons eigen archief (loopt vanaf ${e(dag((d.archief||{}).vanaf))}).</div>`)+`</div>`;
  const tz=d.terugzoeken;
  h+=`<div class="hi-k"><h3>Zoek oudere historie</h3><div class="hi-m">Via de openbare Wayback-zoekindex (archive.org), in een laag tempo en alleen voor deze auto. Gevonden punten krijgen het label "gereconstrueerd" en hebben gaten.</div>
    ${tz?`<div class="hi-m" style="margin-top:6px">Laatst gezocht ${e(String(tz.ts||"").replace("T"," "))}: ${e(tz.treffers)} treffers, ${e(tz.bekeken)} archiefpagina's bekeken.</div>`:""}
    <div style="display:flex;gap:8px;margin-top:8px"><input id="hi-hint" placeholder="Optioneel: link naar advertentie of dealersite" style="flex:1;min-width:0;padding:9px;border:1px solid var(--line,#e3e6eb);border-radius:10px;font-size:15px"><button class="hi-b hi-s" id="hi-terug" type="button"${d.kenteken?"":" disabled"}>Zoek</button></div><div id="hi-st" class="hi-m" style="margin-top:6px"></div></div>
    <div class="hi-m">${e((d.archief||{}).uitleg||"")}</div>`;
  r.innerHTML=h;const b=document.getElementById("hi-terug");if(b)b.onclick=terug}
async function terug(){const d=HUIDIG;if(!d||!d.kenteken)return;const st=document.getElementById("hi-st");
  try{await haal("/terugzoeken",{method:"POST",body:JSON.stringify({kenteken:d.kenteken,hint:(document.getElementById("hi-hint")||{}).value||""})});
    st.textContent="Bezig… (dit duurt een paar minuten, in een laag tempo)";if(POLL)clearInterval(POLL);
    POLL=setInterval(async()=>{try{const s=await haal("/status?k="+encodeURIComponent(d.kenteken));
      if(s.status==="bezig"){st.textContent="Bezig: "+(s.stap||"…");return}
      clearInterval(POLL);POLL=null;st.textContent=s.status==="fout"?(s.fout||"Mislukt"):"Klaar";zoek(d.kenteken)}catch(x){}},4000)}
  catch(x){st.textContent=x.message}}

/* Knoppen: dealkaarten, autodossiers, kopbalk; medewerkerpagina: tab + autokaarten */
function knop(q,klein){const b=document.createElement(klein?"button":"button");b.type="button";b.className=(BEDRIJF?"btn":"sec")+" hi-btn";b.textContent="Historie";b.dataset.hi=q;b.onclick=x=>{x.preventDefault();x.stopPropagation();open(q)};return b}
const KRX=/Kenteken\s+([0-9A-Z]{1,3}-?[0-9A-Z]{2,3}-?[0-9A-Z]{1,3})/i;
function verrijk(){
  if(!BEDRIJF){
    document.querySelectorAll('article.card[id^="deal-"]').forEach(c=>{if(c.querySelector("[data-hi]"))return;
      const a=c.querySelector('.act a.btn[href^="http"]');if(!a)return;a.parentElement.appendChild(knop(a.href))});
    if(!document.getElementById("hi-kop")){const t=document.getElementById("tk-delen")||document.getElementById("tabs");
      if(t){const b=knop("");b.id="hi-kop";b.textContent="Historie zoeken";b.style.margin="6px 0 6px 8px";t.parentElement.insertBefore(b,t)}}
  }else{
    const nav=document.querySelector("header nav");if(nav&&!nav.querySelector("[data-hi]")){const b=document.createElement("button");b.dataset.hi="";b.textContent="Historie";b.onclick=()=>open("");nav.appendChild(b)}
  }
  document.querySelectorAll(BEDRIJF?"article.card":"article.tk-card").forEach(c=>{
    if(c.querySelector("[data-hi]"))return;
    const m=(c.textContent||"").match(KRX);if(!m||/^onbekend$/i.test(m[1]))return;
    const rij=c.querySelector(BEDRIJF?".row":".tk-acties")||c;const b=knop(m[1]);if(!BEDRIJF)b.className="tk-btn sec hi-btn";rij.appendChild(b)});
}
window.HISTORIE={open,zoek};
let wacht=null;new MutationObserver(()=>{if(wacht)return;wacht=setTimeout(()=>{wacht=null;verrijk()},150)}).observe(document.documentElement,{childList:true,subtree:true});
function hash(){const m=location.hash.match(/^#historie(?:=(.+))?$/);if(m)open(decodeURIComponent(m[1]||""))}
addEventListener("hashchange",hash);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{verrijk();hash()});else{verrijk();hash()}
})();
