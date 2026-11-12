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
#inst .lijst{font-size:14px}#inst .lijst div{padding:4px 0;border-top:1px solid var(--line,#eee)}
#inst .ihulp{font-size:13px;opacity:.75;margin:0 0 8px;line-height:1.4}
#inst .ig>summary{font-size:16px}
#inst .ok{color:#157347;font-weight:600}
#inst input[type=text],#inst textarea{width:100%;max-width:100%;font-size:16px;padding:8px;border:1px solid #bbb;border-radius:8px;background:inherit;color:inherit;box-sizing:border-box}
#inst .r label small{margin-top:2px;line-height:1.3}
#inst .bevest{background:#e8f7ee;color:#157347;border-radius:10px;padding:8px 10px;margin:0 0 8px;font-size:14px}
#inst h3{font-size:15px;margin:10px 0 4px}`;document.head.appendChild(st);
const el=document.createElement("div");el.id="inst";document.body.appendChild(el);
function knop(){const h=document.querySelector("header.top");if(!h||document.getElementById("instbtn"))return;const b=document.createElement("button");b.id="instbtn";b.textContent="Instellingen";b.setAttribute("aria-label","Instellingen");b.onclick=open;h.appendChild(b)}
knop();
if(location.hash==="#instellingen")setTimeout(()=>open(),0);
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

const BRON_WEG=new Set(["bat_trends","classicdriver","classic_driver","motorguild"]);
const BRON_LAB={autoscout24:"AutoScout24",marktplaats:"Marktplaats",autotrack:"AutoTrack",rdw:"RDW",AutoScout24:"AutoScout24",Marktplaats:"Marktplaats",AutoTrack:"AutoTrack",RDW:"RDW"};
function teken(){const M=S.marge;
 const bronnen=Object.keys(S.bronnen).filter(b=>typeof S.bronnen[b]==="boolean"&&!BRON_WEG.has(b));
 let h=`<div class="w"><h2>Instellingen <button class="knop" id="ix">Sluiten</button></h2>
<p class="ihulp">Belangrijkste keuzes staan bovenaan. Kansen en Vandaag rekenen direct opnieuw; dealkaarten volgen bij de volgende scan.</p>
<details class="ig" open><summary>Zoekcriteria en marge</summary>
<p class="ihulp">Een auto is een deal als de verwachte marge minstens het hoogste is van het bedrag en het percentage van de vraagprijs.</p>`;
 for(const k of Object.keys(KL_))h+=`<div class="r"><label>${KL_[k]} BRNS<small>Minimumbedrag en percentage van de vraagprijs.</small></label><input type="number" inputmode="numeric" data-p="marge.brns.${k}.abs" value="${M.brns[k].abs}" aria-label="bedrag ${KL_[k]}"><input type="number" inputmode="decimal" style="width:64px" data-p="marge.brns.${k}.pct" value="${M.brns[k].pct}" aria-label="procent ${KL_[k]}">%</div>`;
 h+=N("flips.marge","Flips, minimale marge","Vast minimumbedrag per flip.")+N("flips.prijs_max","Flips, prijsgrens","Auto's duurder dan dit bedrag tellen niet als flip.");
 h+=N("strengheid.pct_onder_mediaan","Procent onder de mediaan","Hoeveel goedkoper dan vergelijkbare auto's een deal minstens moet zijn.")+N("strengheid.min_vergelijkbaar","Minimaal aantal vergelijkbare auto's","Onder dit aantal telt de auto niet als deal.")+B("strengheid.lagere_zekerheid","Ook deals met lagere zekerheid tonen","Toon ook auto's met betrouwbaarheid C.");
 h+=N("profiel.bouwjaar_min","Bouwjaar vanaf","Leeg is geen ondergrens.")+N("profiel.km_max","Maximaal aantal km","Leeg is geen bovengrens.")+N("profiel.prijs_min","Prijs vanaf","Leeg is geen ondergrens.")+N("profiel.prijs_max","Prijs tot","Leeg is geen bovengrens.");
 h+=`</details>
<details class="ig"><summary>Bronnen</summary>
<p class="ihulp">Zet een land of site uit als je die niet wilt meenemen. mobile.de komt alleen binnen via je meldingsmails; die en Gaspedaal worden nooit gescrapet.</p>
${Object.keys(S.landen).map(l=>B("landen."+l,l,"Advertenties uit dit land meenemen.")).join("")}
${bronnen.map(b=>B("bronnen."+b,BRON_LAB[b]||b,"Advertenties van deze bron meenemen.")).join("")}
${N("ophalen_max","Maximale ophaalkosten","0 of leeg is geen grens.")}
</details>
<details class="ig"><summary>Volgorde</summary>
<p class="ihulp">Alleen de volgorde, geen andere marge of fiscale regels.</p>
${B("volgorde.buitenland_eerst","Buitenland eerst","Buitenlandse deals bovenaan bij Inkoopkansen, Nu opvolgen, de Wachtrij en in Telegram. Land onbekend telt niet als buitenland.")}
</details>
<details class="ig"><summary>Meldingen en Telegram</summary>
<p class="ihulp">Bepaalt welke deals de bot stuurt, en wanneer het stil is.</p>
<div class="r"><label for="i_ms">Welke deals<small>Tijdens stille uren komen alleen topdeals door.</small></label><select id="i_ms" data-p="meldingen.soort">${[["top","Alleen topdeals"],["deals","Alle deals"],["deals_en_bijna","Deals en bijna-deals"]].map(([v,t])=>`<option value="${v}" ${S.meldingen.soort===v?"selected":""}>${t}</option>`).join("")}</select></div>
${N("meldingen.top_marge","Topdeal vanaf marge","Zelfde drempel als /drempel in Telegram.")}
${N("meldingen.stil_van","Stil vanaf uur","Uur (0–23) waarop meldingen stilgaan.")}
${N("meldingen.stil_tot","Stil tot uur","Uur (0–23) waarop meldingen weer mogen.")}
${N("meldingen.max_per_dag","Maximaal per dag","0 is geen limiet.")}
</details>
<details class="ig"><summary>Klanten</summary>
<p class="ihulp">Aanvullende filters voor wat je voor klanten zoekt, en hoe mobile.de-kansen worden meegenomen.</p>
<div class="r"><label>Dekking mobile.de<small>Als aanvulling zakken modellen die AutoScout24 al goed dekt. Na opslaan rekent Kansen direct opnieuw.</small></label><select data-p="kansen.modus">${[["aanvulling","mobile.de als aanvulling"],["alles","Alles meenemen"],["exclusief_particulier","Alleen exclusief of particulier"]].map(([v,t])=>`<option value="${v}" ${(get("kansen.modus")||"aanvulling")===v?"selected":""}>${t}</option>`).join("")}</select></div>
<div class="r"><label>Btw-regeling mobile.de<small>Alleen voor kansen uit je mobile.de-mails.</small></label><select data-p="profiel.btw_regeling">${[["alle","Alles (marge voorzichtig gerekend)"],["btw","Alleen btw-auto"],["marge","Alleen margeauto"]].map(([v,t])=>`<option value="${v}" ${get("profiel.btw_regeling")===v?"selected":""}>${t}</option>`).join("")}</select></div>
<div class="r"><label>Verkoper mobile.de<small>Filter op soort verkoper in die mails.</small></label><select data-p="profiel.verkoper">${[["alle","Particulier en handelaar"],["particulier","Particulier"],["bedrijf","Handelaar"]].map(([v,t])=>`<option value="${v}" ${get("profiel.verkoper")===v?"selected":""}>${t}</option>`).join("")}</select></div>
${T("profiel.merken_uit","Merken uit","Komma's ertussen. Deze merken sluit je uit.")}
${T("profiel.modellen_uit","Modellen uit","Bijvoorbeeld: cayenne diesel, x5.")}
${T("profiel.brandstof","Alleen brandstof","Leeg is alles. Bijvoorbeeld: benzine, hybride.")}
${T("profiel.transmissie","Alleen transmissie","Leeg is alles. Bijvoorbeeld: automaat.")}
</details>
<details class="ig"><summary>Weergave</summary>
<p class="ihulp">Alleen op dit toestel. Dit verandert niets aan deals of scans.</p>
<div class="r"><label for="i_thema">Thema<small>Licht, donker, of automatisch met je toestel.</small></label>
<select id="i_thema">${[["auto","Automatisch"],["licht","Licht"],["donker","Donker"]].map(([v,t])=>`<option value="${v}" ${(localStorage.thema||"auto")===v?"selected":""}>${t}</option>`).join("")}</select></div>
</details>
<details class="ig"><summary>Geavanceerd</summary>
<p class="ihulp">Technische en zelden gebruikte instellingen. Kosten gelden bij de volgende scan.</p>
${N("marge.factor_lagere_zekerheid","Factor bij lagere zekerheid","Minimum keer dit getal als er weinig vergelijkbare auto's zijn.")}
${N("marge.factor_particulier","Factor particulier","Minimum keer dit getal bij een particuliere verkoper.")}
<div class="r"><label for="imerk">Per merk<small>Bijvoorbeeld: porsche 3000 6. Eén merk per regel.</small></label></div>
<textarea id="imerk" rows="3">${esc(Object.entries(M.merken||{}).map(([m,r])=>m+" "+r.abs+" "+r.pct).join("\n"))}</textarea>
${T("flips.landen","Flips, alleen deze landen","Leeg is alle landen. Bijvoorbeeld: NL, BE.")}
${Object.keys(S.kosten.transport).map(l=>N("kosten.transport."+l,"Transport "+l,"Vaste transportkosten naar dit land.")).join("")}
${N("kosten.opknap_buffer","Opknapbuffer per auto","Extra bedrag dat je aanhoudt voor opknappen.")}
${N("kosten.stakosten_per_dag","Stakosten per dag","Kosten per dag dat de auto stilstaat.")}
${N("kosten.rente_pct","Rente per jaar in procent","Jaarlijkse rente in de kostencalculatie.")}
<details><summary>Logboek en terugzetten</summary><div id="ilog" class="lijst">Laden...</div></details>
<p><button class="knop" id="istd">Standaardwaarden invullen</button></p>
</details>
</div>
<div class="instbar"><div class="w2"><div class="pv" id="ipv">Geen wijzigingen.</div><button class="knop p" id="isave">Opslaan</button> <button class="knop" id="iher">Bekijk auto's</button></div></div><div id="ilst" class="w lijst"></div>`;
 el.innerHTML=h;el.querySelector("#ix").onclick=close;
 el.querySelectorAll("[data-p]").forEach(i=>i.addEventListener(i.type==="checkbox"||i.tagName==="SELECT"?"change":"input",()=>{const p=i.dataset.p;let v=i.type==="checkbox"?i.checked:i.dataset.l?i.value.split(",").map(s=>s.trim()).filter(Boolean):i.tagName==="SELECT"?i.value:(i.value===""?null:+i.value.replace(",","."));set(p,v);preview()}));
 el.querySelector("#imerk").addEventListener("input",e=>{const o={};e.target.value.split("\n").forEach(l=>{const m=l.trim().match(/^(.+?)\s+(\d+)\s+([\d.,]+)$/);if(m)o[m[1].toLowerCase()]={abs:+m[2],pct:+m[3].replace(",",".")}});S.marge.merken=o;preview()});
 el.querySelector("#istd").onclick=()=>{S=JSON.parse(JSON.stringify(STD));teken();preview()};
 el.querySelector("#isave").onclick=bewaar;el.querySelector("#iher").onclick=()=>preview(true);
 const th=el.querySelector("#i_thema");if(th)th.addEventListener("change",()=>{localStorage.thema=th.value;if(typeof upThema==="function")upThema();const b=document.getElementById("thema");if(b)b.textContent="Weergave: "+{auto:"automatisch",licht:"licht",donker:"donker"}[th.value]});
 logboek()}
function valideer(){const fout=[],num=(p,min,max,lab)=>{const v=get(p);if(v==null||v==="")return;const n=+v;if(!Number.isFinite(n))fout.push(lab+": vul een getal in");else{if(min!=null&&n<min)fout.push(lab+" is te laag");if(max!=null&&n>max)fout.push(lab+" is te hoog")}};
 for(const k of Object.keys(KL_)){num("marge.brns."+k+".abs",0,1e9,KL_[k]+" bedrag");num("marge.brns."+k+".pct",0,100,KL_[k]+" percentage")}
 num("flips.marge",0,1e9,"Flipsmarge");num("flips.prijs_max",0,1e9,"Flips prijsgrens");
 num("strengheid.pct_onder_mediaan",0,100,"Procent onder de mediaan");num("strengheid.min_vergelijkbaar",1,100,"Minimaal aantal vergelijkbare auto's");
 num("profiel.bouwjaar_min",1950,2035,"Bouwjaar vanaf");num("profiel.km_max",0,1e7,"Maximaal aantal km");
 num("profiel.prijs_min",0,1e9,"Prijs vanaf");num("profiel.prijs_max",0,1e9,"Prijs tot");
 const pmin=get("profiel.prijs_min"),pmax=get("profiel.prijs_max");if(pmin!=null&&pmax!=null&&Number.isFinite(+pmin)&&Number.isFinite(+pmax)&&+pmin>+pmax)fout.push("Prijs vanaf is hoger dan prijs tot");
 num("ophalen_max",0,1e9,"Maximale ophaalkosten");
 num("meldingen.top_marge",0,1e9,"Topdeal vanaf marge");num("meldingen.stil_van",0,23,"Stil vanaf uur");num("meldingen.stil_tot",0,23,"Stil tot uur");num("meldingen.max_per_dag",0,1000,"Maximaal per dag");
 num("marge.factor_lagere_zekerheid",0.1,10,"Factor bij lagere zekerheid");num("marge.factor_particulier",0.1,10,"Factor particulier");
 for(const l of Object.keys((S.kosten&&S.kosten.transport)||{}))num("kosten.transport."+l,0,1e9,"Transport "+l);
 num("kosten.opknap_buffer",0,1e9,"Opknapbuffer");num("kosten.stakosten_per_dag",0,1e6,"Stakosten per dag");num("kosten.rente_pct",0,100,"Rente");
 return fout}
function preview(lijst){clearTimeout(tmr);tmr=setTimeout(async()=>{const pv=el.querySelector("#ipv");if(!pv)return;const fout=valideer();if(fout.length){pv.innerHTML=`<span class="fout">${esc(fout.join(". "))}.</span>`;return}
 if(JSON.stringify(S)===ORIG&&!lijst){pv.textContent="Geen wijzigingen.";return}
 try{const r=await api("/voorbeeld","POST",{instellingen:S});const d=r.straks-r.nu;
  pv.textContent=d===0&&!r.extra.length?"Met deze instelling zou je vandaag evenveel deals zien ("+r.nu+").":"Met deze instelling zou je vandaag "+(r.extra.length?r.extra.length+" deals extra":"")+(r.extra.length&&r.minder.length?" en ":"")+(r.minder.length?r.minder.length+" deals minder":"")+" zien ("+r.straks+" in plaats van "+r.nu+").";
  if(lijst){const f=x=>`<div><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.titel)}</a><br>${eur(x.prijs)}${x.marge!=null?" · marge "+eur(x.marge):""}${x.redenen&&x.redenen.length?" · "+esc(x.redenen.join(", ")):""}</div>`;
   el.querySelector("#ilst").innerHTML=`<h3>Herbeoordeling van de auto's van vandaag</h3><p style="font-size:13px">Op basis van ${r.kandidaten} kandidaten uit de laatste scan, inclusief afgewezen auto's. Er wordt niets opnieuw opgehaald.</p><h4>Erbij (${r.extra.length})</h4>${r.extra.map(f).join("")||"<div>Geen</div>"}<h4>Eraf (${r.minder.length})</h4>${r.minder.map(f).join("")||"<div>Geen</div>"}`;el.querySelector("#ilst").scrollIntoView({behavior:"smooth"})}}
 catch(e){pv.innerHTML=`<span class="fout">${esc(e.message)}</span>`}},lijst?0:400)}
async function bewaar(){const pv=el.querySelector("#ipv");const fout=valideer();if(fout.length){pv.innerHTML=`<span class="fout">Niet opgeslagen. ${esc(fout.join(". "))}.</span>`;return}
 try{const r=await api("/instellingen","PUT",{instellingen:S});ORIG=JSON.stringify(S);const tm=new Date().toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Amsterdam"});
  pv.innerHTML=`<span class="bevest">${r.gewijzigd?"Opgeslagen om "+tm+". Kansen en Vandaag rekenen direct opnieuw; dealkaarten volgen bij de volgende scan.":"Opgeslagen om "+tm+". Er was niets gewijzigd."}</span>`;logboek()}
 catch(e){pv.innerHTML=`<span class="fout">Niet opgeslagen. ${esc(e.message)}${e.j&&e.j.details?": "+esc(e.j.details.join(". ")):""}</span>`}}
async function logboek(){const b=el.querySelector("#ilog");if(!b)return;try{const r=await api("/logboek");
 b.innerHTML=r.logboek.map(x=>`<div>${esc(x.tijd)} · ${esc(x.gebruiker)}<br>${esc(x.wat)}${x.soort==="instellingen"?` <button class="knop" data-u="${x.id}">Terugzetten</button>`:""}</div>`).join("")||"Nog geen wijzigingen.";
 b.querySelectorAll("[data-u]").forEach(k=>k.onclick=async()=>{if(!confirm("Deze wijziging terugzetten?"))return;await api("/ongedaan","POST",{id:+k.dataset.u});laad()})}catch(e){b.textContent=e.message}}
if(localStorage[TK])setTimeout(ikSync,1500);
})();
