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
.hi-deal{background:#eef6ff;border-color:#bfdbfe}
.hi-kop{font-size:17px;margin:2px 0 8px}.hi-sam .hi-st{display:inline-block;font-weight:700;font-size:13px;padding:3px 10px;border-radius:10px;margin-bottom:8px}
.hi-st.ok{background:var(--okbg,#e8f7ee);color:var(--ok,#16a34a)}.hi-st.verk{background:var(--warnbg,#fff1e6);color:var(--warn,#c2410c)}.hi-st.weg{background:var(--chip,#eef0f3);color:var(--mute,#5d6470)}
.hi-prijs{font-size:22px;margin:2px 0}.hi-prijs span{color:var(--mute,#5d6470);font-size:18px}.hi-daling{color:var(--bad,#dc2626);font-weight:700;margin-bottom:8px}
.hi-pw{width:100%;border-collapse:collapse;font-size:14px}.hi-pw td{padding:5px 4px;border-top:1px solid var(--line,#e3e6eb);vertical-align:top}.hi-pw tr:first-child td{border-top:0}
.hi-pw td:first-child{white-space:nowrap;color:var(--mute,#5d6470);width:1%}.hi-pw td:last-child{width:1%;text-align:right}.hi-vs{color:var(--bad,#dc2626);white-space:nowrap;text-align:right}
.hi-pw tr.rec td:first-child:before,.hi-dot:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--acc,#2563eb);margin-right:5px;vertical-align:1px}
.hi-pw tr.rec td:first-child:before,.hi-dot.rec:before{background:#a855f7}.hi-dot{display:inline-block}
a.hi-src{display:inline-block;font-size:12px;line-height:1;padding:3px 6px;border-radius:8px;background:var(--chip,#eef0f3);color:var(--acc,#2563eb);text-decoration:none}
.hi-det summary{font-weight:700;font-size:16px;cursor:pointer;list-style-position:inside}.hi-det summary .hi-m{font-weight:400;margin-left:4px}.hi-alle td:nth-child(2){font-size:13px}
`;document.head.appendChild(s)}

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

const bronL=(l,b)=>l?`<a class="hi-src" href="${e(l)}" target="_blank" rel="noopener" title="${e(b||"Bron")}" aria-label="Bron: ${e(b||"")}">↗</a>`:"";
const pct=n=>n==null?"":Number(n).toLocaleString("nl-NL",{maximumFractionDigits:1})+"%";
function teken(){const d=HUIDIG,r=document.getElementById("hi-r");if(!d||!r)return;
  const rd=d.rdw||{},A=d.advertenties||[],T=d.tijdlijn||[],S=d.samenvatting||{},P=d.prijswijzigingen||[];let h="";
  h+=`<div class="hi-kop"><b>${e(d.kenteken_opmaak||d.kenteken||d.vin||"Onbekend")}</b>${rd.gevonden?" · "+e([rd.merk,rd.model].filter(Boolean).join(" "))+(rd.kleur?" · "+e(rd.kleur):""):""}</div>`;
  const kl=S.status==="Nog te koop"?"ok":S.status==="Waarschijnlijk verkocht"?"verk":"weg";
  h+=`<div class="hi-k hi-sam"><div class="hi-st ${kl}">${e(S.status_tekst||S.status||"Onbekend")}</div>`;
  if(S.eerste_prijs!=null){h+=`<div class="hi-prijs"><span>${eur(S.eerste_prijs)}</span>${S.laatste_prijs!==S.eerste_prijs?` → <b>${eur(S.laatste_prijs)}</b>`:""}</div>`;
    if(S.daling_eur)h+=`<div class="hi-daling">${S.daling_eur>0?"−":"+"}${eur(Math.abs(S.daling_eur))} (${S.daling_eur>0?"−":"+"}${pct(Math.abs(S.daling_pct))})</div>`}
  h+=`<div class="hi-g"><span>Te koop sinds</span><b>${e(dag(S.te_koop_sinds)||"—")}</b><span>Dagen te koop</span><b>${S.dagen_te_koop!=null?e(S.dagen_te_koop)+" dagen":"—"}${S.dagen_te_koop!=null&&S.dagen_tot?` <span class="hi-m">(tot ${e(S.dagen_tot)})</span>`:""}</b>
    <span>Dealer</span><b>${e(S.dealer||"—")}</b></div>`;
  if(S.gereconstrueerd)h+=`<div class="hi-m" style="margin-top:6px"><span class="hi-badge">deels gereconstrueerd</span> uit openbare archieven, met gaten.</div>`;
  h+=`</div>`;
  if(d.deal)h+=`<div class="hi-k hi-deal"><h3>In ons dealsysteem</h3><div>${e(d.deal.titel||"")}${d.deal.marge!=null?" · marge "+eur(d.deal.marge):""}</div><div class="hi-m">Alleen zichtbaar voor Robin en Rutger.</div></div>`;
  h+=`<div class="hi-k"><h3>Prijswijzigingen</h3>`+(P.length?`<table class="hi-pw">${P.slice().reverse().map(p=>`<tr class="${p.gereconstrueerd?"rec":""}"><td>${e(dag(p.datum))}</td><td class="hi-pr">${eur(p.prijs)}</td><td class="hi-vs">${p.verschil?(p.verschil<0?"−":"+")+eur(Math.abs(p.verschil)):"start"}</td><td>${bronL(p.link,p.bron)}</td></tr>`).join("")}</table>
    <div class="hi-m" style="margin-top:4px"><span class="hi-dot rec"></span> gereconstrueerd (archive.org) · <span class="hi-dot"></span> eigen archief · ↗ bron</div>`:`<div class="hi-m">Geen prijzen bekend.</div>`)+`</div>`;
  if(rd.gevonden&&rd.check){h+=`<details class="hi-k hi-det"><summary>Kentekencheck <span class="hi-m">RDW open data</span></summary><div class="hi-g" style="margin-top:8px">${rd.check.map(c=>`<span>${e(c.veld)}</span><b>${c.waarde==null||c.waarde===""?'<span class="hi-m">niet in RDW-data</span>':(/catalogusprijs/i.test(c.veld)?eur(c.waarde):/^\d{4}-\d{2}-\d{2}$/.test(String(c.waarde))?e(dag(c.waarde)):e(c.waarde))}</b>`).join("")}</div>
    ${(rd.apk_meldingen||[]).length?`<div style="margin-top:8px"><b>APK-meldingen</b>${rd.apk_meldingen.slice().reverse().map(a=>`<div class="hi-m">${e(dag(a.datum))} · ${e(a.soort||"keuring")} · geldig tot ${e(dag(a.geldig_tot))}</div>`).join("")}</div>`:""}
    <div class="hi-m" style="margin-top:6px">Bron: <a class="hi-l" href="${e(rd.bron_url)}" target="_blank" rel="noopener">${e(rd.bron)}</a>${rd.opgehaald?" · opgehaald "+e(String(rd.opgehaald).replace("T"," ")):""}</div></details>`}
  else if(!rd.gevonden)h+=`<div class="hi-k hi-m">${e(rd.reden||"Geen RDW-gegevens")}</div>`;
  const tz=d.terugzoeken;
  h+=`<details class="hi-k hi-det"><summary>Meer info <span class="hi-m">tijdlijn, advertenties, bronnen</span></summary>`;
  (d.signalen||[]).forEach(s=>h+=`<div class="hi-sig">${e(s.tekst)}</div>`);
  h+=`<h3 style="margin-top:10px">Alle punten</h3>`+(T.length?`<table class="hi-pw hi-alle">${T.slice().reverse().map(t=>`<tr class="${t.gereconstrueerd?"rec":""}"><td>${e(dag(t.datum))}</td><td>${e(t.tekst)}${t.prijs!=null?` · <b>${eur(t.prijs)}</b>`:""}</td><td>${bronL(t.link,t.bron)}</td></tr>`).join("")}</table>`:`<div class="hi-m">Nog geen punten.</div>`);
  h+=`<h3 style="margin-top:12px">Advertenties in ons archief (${A.length})</h3>`+(A.length?A.map(a=>`<div style="margin:4px 0 8px"><b>${e(a.bron)}</b>${a.dealer?" · "+e(a.dealer):""} · ${e(a.status)} ${bronL(a.url,"Open advertentie")}
    <div class="hi-m">Sinds ${e(dag(a.online_sinds||a.eerst_gezien))} · laatst gezien ${e(dag(a.laatst_gezien))}${a.dagen_online!=null?" · "+e(a.dagen_online)+" dagen":""}${a.km?" · "+Number(a.km).toLocaleString("nl-NL")+" km":""}</div></div>`).join("")
    :`<div class="hi-m">Niet gezien in ons eigen archief (loopt vanaf ${e(dag((d.archief||{}).vanaf))}).</div>`);
  h+=`<h3 style="margin-top:12px">Zoek oudere historie</h3><div class="hi-m">Via de openbare Wayback-index (archive.org), in een laag tempo en alleen voor deze auto. Gevonden punten zijn "gereconstrueerd".</div>
    ${tz?`<div class="hi-m" style="margin-top:4px">Laatst gezocht ${e(String(tz.ts||"").replace("T"," "))}: ${e(tz.treffers)} treffers, ${e(tz.bekeken)} archiefpagina's.</div>`:""}
    <div style="display:flex;gap:8px;margin-top:8px"><input id="hi-hint" placeholder="Optioneel: link naar advertentie of dealer" style="flex:1;min-width:0;padding:9px;border:1px solid var(--line,#e3e6eb);border-radius:10px;font-size:15px"><button class="hi-b hi-s" id="hi-terug" type="button"${d.kenteken?"":" disabled"}>Zoek</button></div><div id="hi-st" class="hi-m" style="margin-top:6px"></div>
    <div class="hi-m" style="margin-top:8px">${e((d.archief||{}).uitleg||"")}</div></details>`;
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
