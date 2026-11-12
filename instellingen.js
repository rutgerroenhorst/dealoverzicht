// Instellingen: opgeslagen op de server (instellingen-API), gelijk op al je apparaten. Ook inkoopprijzen eigen voorraad worden gesynchroniseerd.
(function(){
const API=(typeof KL!=="undefined"&&KL.instellingen_api)||"https://2-31-144-18.sslip.io/api/inst";
const SLUG=(typeof KL!=="undefined"&&KL.slug)||"brns",TK="inst_token_"+SLUG;
const OPEN=SLUG==="brns"&&location.hostname==="rutgerroenhorst.github.io"; // BRNS_OPEN_V1: geen wachtwoordscherm alleen op de echte BRNS-site (niet op localhost)
let S=null,STD=null,ORIG=null,tmr=null;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const eur=n=>n==null?"":"€ "+Math.round(n).toLocaleString("nl-NL");
async function api(p,m,b){const r=await fetch(API+p,{method:m||"GET",headers:Object.assign({"Content-Type":"application/json"},localStorage[TK]?{Authorization:"Bearer "+localStorage[TK]}:(OPEN?{"X-Klant":"brns"}:{})),body:b?JSON.stringify(b):undefined});
 const j=await r.json().catch(()=>({fout:"Geen antwoord van de server"}));if(r.status===401&&p!=="/login"){delete localStorage[TK]}if(!r.ok)throw Object.assign(new Error(j.fout||"Fout"),{j,status:r.status});return j}
// ---------- inkoopprijzen synchroniseren ----------
async function ikSync(){if((!OPEN&&!localStorage[TK])||typeof ikAll!=="function")return;
 try{const lokaal=ikAll();const r=await api("/inkoop","PUT",{inkoop:lokaal});const o=Object.assign({},r.inkoop);localStorage[IKKEY()]=JSON.stringify(o);localStorage["inkoop_gemigreerd_"+SLUG]="1"}catch(e){}}
if(typeof ikSet==="function"){const orig=ikSet;window.ikSet=ikSet=function(u,k,v){orig(u,k,v);if(!OPEN&&!localStorage[TK])return;const r=ikAll()[u]||{inkoop:null,kosten:null,gewijzigd:new Date().toISOString().slice(0,16)};api("/inkoop","PUT",{inkoop:{[u]:r}}).catch(()=>{})}}
// ---------- scherm ----------
const st=document.createElement("style");st.textContent=`
#instbtn{margin-left:auto;background:none;border:1px solid var(--line,#ccc);border-radius:10px;padding:6px 10px;font:inherit;color:inherit;cursor:pointer}
#inst{position:fixed;inset:0;z-index:999;background:var(--bg,#fff);overflow:auto;-webkit-overflow-scrolling:touch;display:none}
#inst .w{max-width:640px;margin:0 auto;padding:12px 14px 120px}
#inst h2{font-size:20px;margin:6px 0 10px;display:flex;align-items:center}#inst h2 button{margin-left:auto}
#inst details{border:1px solid var(--line,#ddd);border-radius:12px;margin:10px 0;padding:0 12px}
#inst summary{padding:12px 0;font-weight:600;cursor:pointer}
#inst .r{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line,#eee)}
#inst .r label{flex:1;font-size:15px}#inst .r small{display:block;opacity:.7}
#inst input[type=number],#inst input[type=text],#inst select{width:110px;font-size:16px;padding:8px;border:1px solid #bbb;border-radius:8px;background:inherit;color:inherit}
#inst input[type=checkbox]{width:22px;height:22px}
#inst .instbar{display:block;position:fixed;left:0;right:0;bottom:0;background:var(--bg,#fff);border-top:1px solid var(--line,#ddd);padding:10px 14px calc(10px + env(safe-area-inset-bottom))}
#inst .instbar .w2{max-width:640px;margin:0 auto;display:block;width:auto}#inst .pv{font-size:14px;margin-bottom:8px}
#inst .knop{font:inherit;font-size:16px;padding:10px 14px;border-radius:10px;border:1px solid #888;background:inherit;color:inherit;cursor:pointer}
#inst .knop.p{background:#1a5;color:#fff;border-color:#1a5}#inst .fout{color:#c22}
#inst .lijst{font-size:14px}#inst .lijst div{padding:4px 0;border-top:1px solid var(--line,#eee)}`;document.head.appendChild(st);
const el=document.createElement("div");el.id="inst";document.body.appendChild(el);
function knop(){const h=document.querySelector("header.top");if(!h||document.getElementById("instbtn"))return;const b=document.createElement("button");b.id="instbtn";b.textContent="Instellingen";b.setAttribute("aria-label","Instellingen");b.onclick=open;h.appendChild(b)}
knop();
function get(p){return p.split(".").reduce((o,k)=>o==null?o:o[k],S)}
function set(p,v){const k=p.split(".");let o=S;k.slice(0,-1).forEach(x=>{o[x]=o[x]||{};o=o[x]});o[k[k.length-1]]=v}
const N=(p,lab,uit)=>`<div class="r"><label for="i_${p}">${lab}${uit?`<small>${uit}</small>`:""}</label><input id="i_${p}" type="number" inputmode="decimal" data-p="${p}" value="${esc(get(p))}"></div>`;
const B=(p,lab,uit)=>`<div class="r"><label for="i_${p}">${lab}${uit?`<small>${uit}</small>`:""}</label><input id="i_${p}" type="checkbox" data-p="${p}" ${get(p)?"checked":""}></div>`;
const T=(p,lab,uit)=>`<div class="r"><label for="i_${p}">${lab}${uit?`<small>${uit}</small>`:""}</label><input id="i_${p}" type="text" data-p="${p}" data-l="1" value="${esc((get(p)||[]).join(", "))}"></div>`;
const KL_={normaal:"Normaal",sport:"Sport",exotisch:"Exotisch",ferrari:"Ferrari-klasse"};
function login(msg){el.innerHTML=`<div class="w"><h2>Instellingen <button class="knop" id="ix">Sluiten</button></h2>
<p>Log in om je instellingen te bekijken en te wijzigen. Je blijft op dit toestel 180 dagen ingelogd.</p>
<div class="r"><label for="lu">Gebruikersnaam</label><input id="lu" type="text" autocapitalize="none" autocomplete="username" style="width:170px"></div>
<div class="r"><label for="lp">Wachtwoord</label><input id="lp" type="password" autocomplete="current-password" style="width:170px"></div>
<p class="fout">${esc(msg||"")}</p><button class="knop p" id="lgo">Inloggen</button></div>`;
 el.querySelector("#ix").onclick=close;el.querySelector("#lgo").onclick=async()=>{try{const r=await api("/login","POST",{klant:SLUG,gebruiker:lu.value,wachtwoord:lp.value});localStorage[TK]=r.token;await ikSync();laad()}catch(e){login(e.message)}}}
async function open(){el.style.display="block";document.body.style.overflow="hidden";if(!OPEN&&!localStorage[TK])return login();laad()}
function close(){el.style.display="none";document.body.style.overflow=""}
window.openInstellingen=open;
async function laad(){el.innerHTML=`<div class="w"><p>Laden...</p></div>`;try{const r=await api("/instellingen");S=r.instellingen;STD=r.standaard;ORIG=JSON.stringify(S);
 if(!localStorage["inkoop_gemigreerd_"+SLUG])ikSync();teken()}catch(e){if(e.status===401&&!OPEN)login("Log opnieuw in.");else if(e.status===401)throw e;else el.innerHTML=`<div class="w"><p class="fout">${esc(e.message)}</p><button class="knop" onclick="document.getElementById('inst').style.display='none'">Sluiten</button></div>`}}
function teken(){const M=S.marge;let h=`<div class="w"><h2>Instellingen <button class="knop" id="ix">Sluiten</button></h2>
<p style="font-size:14px;opacity:.8">Kansen en het dagoverzicht rekenen direct opnieuw; de overige dealkaarten wijzigen bij de volgende scan. Onderaan zie je direct wat het met de auto's van vandaag zou doen.</p>
<details open><summary>Minimale marge</summary><p style="font-size:14px">Een auto is een deal als de verwachte marge minstens het hoogste is van het bedrag en het percentage van de vraagprijs.</p>`;
 for(const k of Object.keys(KL_))h+=`<div class="r"><label>${KL_[k]} BRNS</label><input type="number" inputmode="numeric" data-p="marge.brns.${k}.abs" value="${M.brns[k].abs}" aria-label="bedrag"><input type="number" inputmode="decimal" style="width:64px" data-p="marge.brns.${k}.pct" value="${M.brns[k].pct}" aria-label="procent">%</div>`;
 h+=N("flips.marge","Flips","Vast bedrag per flip");
 h+=`<div class="r"><label>Per merk<small>Bijvoorbeeld: porsche 3000 6. Eén merk per regel.</small></label></div><textarea id="imerk" rows="3" style="width:100%;font-size:16px">${esc(Object.entries(M.merken||{}).map(([m,r])=>m+" "+r.abs+" "+r.pct).join("\n"))}</textarea>
 ${N("marge.factor_lagere_zekerheid","Factor bij lagere zekerheid","Minimum keer dit getal als er weinig vergelijkbare auto's zijn")}${N("marge.factor_particulier","Factor particulier","Minimum keer dit getal bij een particuliere verkoper")}</details>
<details><summary>Strengheid</summary>${N("strengheid.pct_onder_mediaan","Procent onder de mediaan","Hoeveel goedkoper dan vergelijkbare auto's")}${N("strengheid.min_vergelijkbaar","Minimaal aantal vergelijkbare auto's")}${B("strengheid.lagere_zekerheid","Ook deals met lagere zekerheid tonen")}</details>
<details><summary>Kansen</summary><div class="r"><label>Dekking mobile.de</label><select data-p="kansen.modus">${[["aanvulling","mobile.de als aanvulling"],["alles","alles meenemen"],["exclusief_particulier","alleen exclusief/particulier"]].map(([v,t])=>`<option value="${v}" ${(get("kansen.modus")||"aanvulling")===v?"selected":""}>${t}</option>`).join("")}</select></div><p>Als aanvulling zakken modellen die AutoScout24 al goed dekt. Alles meenemen schakelt die straf uit. Exclusief/particulier kiest exclusieve modellen of richt de zoekopdracht alleen op particuliere verkopers. Na opslaan rekent Kansen direct opnieuw.</p></details><details><summary>Profiel</summary>${N("profiel.bouwjaar_min","Bouwjaar vanaf")}${N("profiel.km_max","Maximaal aantal km")}${N("profiel.prijs_min","Prijs vanaf")}${N("profiel.prijs_max","Prijs tot")}
<div class="r"><label>Btw/marge voor mobile.de</label><select data-p="profiel.btw_regeling">${[["alle","Alles (marge voorzichtig gerekend)"],["btw","Alleen btw-auto"],["marge","Alleen margeauto"]].map(([v,t])=>`<option value="${v}" ${get("profiel.btw_regeling")===v?"selected":""}>${t}</option>`).join("")}</select></div><div class="r"><label>Verkoper mobile.de</label><select data-p="profiel.verkoper">${[["alle","Particulier en handelaar"],["particulier","Particulier"],["bedrijf","Handelaar"]].map(([v,t])=>`<option value="${v}" ${get("profiel.verkoper")===v?"selected":""}>${t}</option>`).join("")}</select></div>${T("profiel.merken_uit","Merken uit","Gescheiden door komma's")}${T("profiel.modellen_uit","Modellen uit","Bijvoorbeeld: cayenne diesel, x5")}${T("profiel.brandstof","Alleen brandstof","Leeg is alles. Bijvoorbeeld: benzine, hybride")}${T("profiel.transmissie","Alleen transmissie","Leeg is alles. Bijvoorbeeld: automaat")}</details>
<details><summary>Landen en bronnen</summary>${Object.keys(S.landen).map(l=>B("landen."+l,l)).join("")}${Object.keys(S.bronnen).filter(b=>typeof S.bronnen[b]==="boolean"&&!['bat_trends','classicdriver','classic_driver','motorguild'].includes(b)).map(b=>B("bronnen."+b,b)).join("")}
<p style="font-size:13px;opacity:.75">mobile.de wordt alleen via jouw meldingsmails verwerkt; de tab Kansen geeft de zoekfilters. mobile.de en Gaspedaal worden nooit gescrapet.</p>${N("ophalen_max","Maximale ophaalkosten","0 is geen grens")}</details>
<details><summary>Kosten</summary>${Object.keys(S.kosten.transport).map(l=>N("kosten.transport."+l,"Transport "+l)).join("")}${N("kosten.opknap_buffer","Opknapbuffer per auto")}${N("kosten.stakosten_per_dag","Stakosten per dag")}${N("kosten.rente_pct","Rente per jaar in procent")}</details>
<details><summary>Meldingen in Telegram</summary><div class="r"><label for="i_ms">Welke deals</label><select id="i_ms" data-p="meldingen.soort">${[["top","Alleen topdeals"],["deals","Alle deals"],["deals_en_bijna","Deals en bijna-deals"]].map(([v,t])=>`<option value="${v}" ${S.meldingen.soort===v?"selected":""}>${t}</option>`).join("")}</select></div>
${N("meldingen.top_marge","Topdeal vanaf marge","Zelfde als /drempel in Telegram. Tijdens stille uren komen alleen topdeals door.")}${N("meldingen.stil_van","Stil vanaf uur")}${N("meldingen.stil_tot","Stil tot uur")}${N("meldingen.max_per_dag","Maximaal per dag")}</details>
<details><summary>Flips</summary>${N("flips.prijs_max","Prijsgrens")}${T("flips.landen","Regio, landen","Leeg is alle landen. Bijvoorbeeld: NL, BE")}</details>
<details><summary>Logboek en terugzetten</summary><div id="ilog" class="lijst">Laden...</div></details>
<p><button class="knop" id="istd">Standaardwaarden invullen</button></p></div>
<div class="instbar"><div class="w2"><div class="pv" id="ipv">Geen wijzigingen.</div><button class="knop p" id="isave">Opslaan</button> <button class="knop" id="iher">Bekijk auto's</button></div></div><div id="ilst" class="w lijst"></div>`;
 el.innerHTML=h;el.querySelector("#ix").onclick=close;
 el.querySelectorAll("[data-p]").forEach(i=>i.addEventListener(i.type==="checkbox"||i.tagName==="SELECT"?"change":"input",()=>{const p=i.dataset.p;let v=i.type==="checkbox"?i.checked:i.dataset.l?i.value.split(",").map(s=>s.trim()).filter(Boolean):i.tagName==="SELECT"?i.value:(i.value===""?null:+i.value.replace(",","."));set(p,v);preview()}));
 el.querySelector("#imerk").addEventListener("input",e=>{const o={};e.target.value.split("\n").forEach(l=>{const m=l.trim().match(/^(.+?)\s+(\d+)\s+([\d.,]+)$/);if(m)o[m[1].toLowerCase()]={abs:+m[2],pct:+m[3].replace(",",".")}});S.marge.merken=o;preview()});
 el.querySelector("#istd").onclick=()=>{S=JSON.parse(JSON.stringify(STD));teken();preview()};
 el.querySelector("#isave").onclick=bewaar;el.querySelector("#iher").onclick=()=>preview(true);logboek()}
function preview(lijst){clearTimeout(tmr);tmr=setTimeout(async()=>{const pv=el.querySelector("#ipv");if(JSON.stringify(S)===ORIG&&!lijst){pv.textContent="Geen wijzigingen.";return}
 try{const r=await api("/voorbeeld","POST",{instellingen:S});const d=r.straks-r.nu;
  pv.textContent=d===0&&!r.extra.length?"Met deze instelling zou je vandaag evenveel deals zien ("+r.nu+").":"Met deze instelling zou je vandaag "+(r.extra.length?r.extra.length+" deals extra":"")+(r.extra.length&&r.minder.length?" en ":"")+(r.minder.length?r.minder.length+" deals minder":"")+" zien ("+r.straks+" in plaats van "+r.nu+").";
  if(lijst){const f=x=>`<div><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.titel)}</a><br>${eur(x.prijs)}${x.marge!=null?" · marge "+eur(x.marge):""}${x.redenen&&x.redenen.length?" · "+esc(x.redenen.join(", ")):""}</div>`;
   el.querySelector("#ilst").innerHTML=`<h3>Herbeoordeling van de auto's van vandaag</h3><p style="font-size:13px">Op basis van ${r.kandidaten} kandidaten uit de laatste scan, inclusief afgewezen auto's. Er wordt niets opnieuw opgehaald.</p><h4>Erbij (${r.extra.length})</h4>${r.extra.map(f).join("")||"<div>Geen</div>"}<h4>Eraf (${r.minder.length})</h4>${r.minder.map(f).join("")||"<div>Geen</div>"}`;el.querySelector("#ilst").scrollIntoView({behavior:"smooth"})}}
 catch(e){pv.innerHTML=`<span class="fout">${esc(e.message)}</span>`}},lijst?0:400)}
async function bewaar(){const pv=el.querySelector("#ipv");try{const r=await api("/instellingen","PUT",{instellingen:S});ORIG=JSON.stringify(S);pv.textContent=r.gewijzigd?"Opgeslagen. Geldt vanaf de volgende scan.":"Niets gewijzigd.";logboek()}
 catch(e){pv.innerHTML=`<span class="fout">${esc(e.message)}${e.j&&e.j.details?": "+esc(e.j.details.join(". ")):""}</span>`}}
async function logboek(){const b=el.querySelector("#ilog");if(!b)return;try{const r=await api("/logboek");
 b.innerHTML=r.logboek.map(x=>`<div>${esc(x.tijd)} · ${esc(x.gebruiker)}<br>${esc(x.wat)}${x.soort==="instellingen"?` <button class="knop" data-u="${x.id}">Terugzetten</button>`:""}</div>`).join("")||"Nog geen wijzigingen.";
 b.querySelectorAll("[data-u]").forEach(k=>k.onclick=async()=>{if(!confirm("Deze wijziging terugzetten?"))return;await api("/ongedaan","POST",{id:+k.dataset.u});laad()})}catch(e){b.textContent=e.message}}
if(localStorage[TK])setTimeout(ikSync,1500);
})();
