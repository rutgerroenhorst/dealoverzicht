/* ROBIN_V2 (ontwerp v2, akkoord Rutger t651s2583): Robin · Beheer.
   Vandaag: snelle knoppen, ritten met routeknop (Apple Kaarten / Google Maps vanaf De Giessen 1, Dronten), ochtendbriefing (standaard UIT).
   Klanten: WhatsApp-concepten (wa.me zonder nummer: Robin kiest zelf de klant en verstuurt zelf), terugbellen, opvolging na verkoop.
   Voorraad: Auto binnen / Auto verkocht + "bijgewerkt om HH:MM" (live van de server, elk uur van de eigen site).
   Openbare site: geen privénummers, geen klantnamen uit Telegram. Wordt vóór nav.js geladen. */
(function(){
"use strict";
if(typeof render!=="function")return;
if(typeof KL!=="undefined"&&KL.slug&&KL.slug!=="brns")return; /* alleen de eigen BRNS-site; andere klantsites niet */
const KLANTEN_SEG=26,VD=20,VR_SEG=12;
const API=(typeof KL!=="undefined"&&KL.instellingen_api)||"https://2-31-144-18.sslip.io/api/inst";
const HOST=location.hostname||"";
const LIVE=HOST==="rutgerroenhorst.github.io"||/\.sslip\.io$/.test(HOST);
const VAN="De Giessen 1, Dronten";
const e=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tok=()=>localStorage["inst_token_"+((typeof KL!=="undefined"&&KL.slug)||"brns")]||"";
function hdr(){const h={"Content-Type":"application/json"};if(tok())h.Authorization="Bearer "+tok();else h["X-Klant"]="brns";return h}
async function api(p,method,body){
  if(!LIVE)throw Error("Deze knop werkt op de live site.");
  let r;try{r=await fetch(API+p,{method:method||"GET",headers:hdr(),body:body?JSON.stringify(body):undefined,cache:"no-store"})}catch(x){throw Error("Geen verbinding. Er is niets opgeslagen; probeer het zo opnieuw.")} /* AZ_FIX: Nederlandse melding zonder verbinding */
  const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.reden||j.fout||"Mislukt");return j;
}
const apple=a=>"https://maps.apple.com/?saddr="+encodeURIComponent(VAN)+"&daddr="+encodeURIComponent(a)+"&dirflg=d";
const google=a=>"https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(VAN)+"&destination="+encodeURIComponent(a)+"&travelmode=driving";
const wa=t=>"https://wa.me/?text="+encodeURIComponent(t);
window.ROBIN_V2={apple,google,wa};
const CONCEPTEN_STD={terugbellen:"Hoi {naam}, je had gebeld over {auto}. Wanneer komt het je uit dat ik even terugbel? Groet, Robin – BRNS Exclusief",
  afspraak:"Hoi {naam}, hierbij de bevestiging van onze afspraak bij BRNS Exclusief, De Giessen 1 in Dronten. Tot dan! Groet, Robin",
  auto_klaar:"Hoi {naam}, goed nieuws: {auto} staat klaar. Wanneer kom je hem ophalen? Groet, Robin – BRNS Exclusief",
  opvolging:"Hoi {naam}, hoe bevalt {auto}? Als er iets is hoor ik het graag. Groet, Robin – BRNS Exclusief",
  proefrit:"Hoi {naam}, hoe beviel de proefrit in {auto}? Heb je nog vragen, of zal ik een voorstel maken? Groet, Robin – BRNS Exclusief"};
/* INVULVELDEN_V1 (t662u): {naam} {auto} {prijs} invullen; onbekend = netjes weg (nooit "{naam}" naar een klant) */
function vul(t,c){c=c||{};const au=String(c.auto||"").split("|")[0].trim();const pr=typeof c.prijs==="number"&&c.prijs>0?"€ "+c.prijs.toLocaleString("nl-NL"):(c.prijs||"");
  return String(t||"").split("{naam}").join(String(c.naam||"").trim()).split("{auto}").join(au?"de "+au:"de auto").split("{prijs}").join(pr).replace(/[ \t]+([,.!?])/g,"$1").replace(/[ \t]{2,}/g," ").trim()}
const telNaamKey=n=>"rb3_tn_"+String(n||"").toLowerCase().replace(/\s+/g," ").trim();
function telVanNaam(n){try{return n?(localStorage[telNaamKey(n)]||""):""}catch(x){return ""}}
function bewaarTelNaam(n,t){try{if(n&&t)localStorage[telNaamKey(n)]=t}catch(x){}}
function bekendeNamen(){const L=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith("rb3_tn_"))L.push(k.slice(7))}}catch(x){}return L}

const CLAB={terugbellen:"Terugbellen",afspraak:"Afspraak bevestigen",auto_klaar:"Auto staat klaar",opvolging:"Opvolging na verkoop",proefrit:"Na de proefrit"};
let V=null,TK=null;
async function laadV(){try{V=await api("/taken/robin/vandaag")}catch(x){V=V||null}return V}
async function laadT(){try{TK=await api("/taken")}catch(x){}return TK}
function toast2(t){if(typeof toast==="function")toast(t);else alert(t)}
function routeKn(a){return a?`<a class="btn sm" href="${e(apple(a))}" target="_blank" rel="noopener">🗺️ Route (Apple)</a> <a class="btn sm ghost" href="${e(google(a))}" target="_blank" rel="noopener">Google Maps</a>`:""}

/* ---------- Vandaag ---------- */
function vdBlok(){
  const host=document.querySelector(".vandaag");if(!host)return;
  let b=document.getElementById("rb-vd");
  if(!b){b=document.createElement("section");b.id="rb-vd";b.className="vb rb"}
  const ne=document.getElementById("rb3-eerst");if(ne&&ne.parentNode===host){if(ne.nextSibling!==b)host.insertBefore(b,ne.nextSibling)}else if(host.firstChild!==b)host.insertBefore(b,host.firstChild);
  const r=(V&&V.ritten)||[];
  const vr=(V&&V.voorraad)||{};const w=vr.wijzigingen||{};
  b.innerHTML=`<h3>Snelle knoppen</h3><div class="rb-snel">
    <button type="button" data-rb="taak">➕<span>Taak</span></button><button type="button" data-rb="binnen">🚗<span>Auto binnen</span></button>
    <button type="button" data-rb="verkocht">✅<span>Verkocht</span></button><button type="button" data-rb="rit">🚚<span>Rit plannen</span></button>
    <button type="button" data-rb="klantvraag">📞<span>Klant terugbellen</span></button><button type="button" data-rb="proefrit">🔑<span>Proefrit</span></button><button type="button" data-rb="whatsapp">💬<span>WhatsApp</span></button>
    <button type="button" data-rb="taxatie">🧮<span>Taxatie</span></button><button type="button" data-rb="voorraad">📦<span>Voorraad</span></button><button type="button" data-rb="papier">🧾<span>Papierwerk RDW/BPM</span></button><button type="button" data-rb="week">📊<span>Week</span></button></div>
    ${r.length?`<h3>Ritten <span class="cnt">${r.length}</span></h3>`+r.map(t=>`<div class="rb-rit"><b>${t.rit==="afleveren"?"Afleveren":"Ophalen"}: ${e(t.auto||t.titel)}</b><div class="meta">📍 ${e(t.adres)}${t.tijdslot?" · 🕒 "+e(t.tijdslot):""}${t.voor?" · "+e(t.voor):""}</div><div>${routeKn(t.adres)}</div></div>`).join(""):""}
    <div class="meta">📦 Voorraad: ${vr.te_koop!=null?e(vr.te_koop)+" te koop":"onbekend"} · bijgewerkt ${e(vr.bijgewerkt||"onbekend")}${w&&w.nieuw!=null?` · ${w.nieuw} nieuw, ${w.prijs_gewijzigd||0} prijs gewijzigd, ${w.niet_meer_zichtbaar||0} niet meer zichtbaar`:""}</div>
    <div class="meta">☀️ Ochtendbriefing 08:00: <b>${V&&V.briefing_aan?"AAN":"UIT"}</b> <button type="button" class="btn sm ghost" data-rb="briefing">${V&&V.briefing_aan?"Uitzetten":"Aanzetten"}</button>${V&&V.briefing?`<pre class="rb-brief">${e(V.briefing.tekst)}</pre>`:""}</div>`;
  b.querySelectorAll("[data-rb]").forEach(x=>x.onclick=()=>actie(x.dataset.rb));
}
/* ---------- Voorraad ---------- */
function vrBlok(){
  const c=document.getElementById("cards");if(!c)return;
  let b=document.getElementById("rb-vr");
  if(!b){b=document.createElement("div");b.id="rb-vr";b.className="rb rb-vr"}
  if(c.firstChild!==b)c.insertBefore(b,c.firstChild);
  const vr=(V&&V.voorraad)||{};const w=vr.wijzigingen||{};
  b.innerHTML=`<div class="row"><button type="button" class="btn" data-rb="binnen">🚗 Auto binnen</button><button type="button" class="btn" data-rb="verkocht">✅ Auto verkocht</button></div>
   <div class="meta">🔄 Bijgewerkt om ${e(vr.bijgewerkt||"onbekend")} · elk uur van de eigen site${w&&w.nieuw!=null?` · laatste update: ${w.nieuw} nieuw, ${w.prijs_gewijzigd||0} prijs gewijzigd, ${w.verkocht||0} verkocht, ${w.niet_meer_zichtbaar||0} niet meer zichtbaar`:""}. "Verkocht" alleen via Auto verkocht of als de eigen site het zegt.</div>`;
  b.querySelectorAll("[data-rb]").forEach(x=>x.onclick=()=>actie(x.dataset.rb));
}
/* ---------- Klanten ---------- */
function klanten(){
  const c=document.getElementById("cards");if(!c)return;
  const C=Object.assign({},CONCEPTEN_STD,(V&&V.concepten)||{});
  const open=((TK&&TK.taken)||[]).filter(t=>t.status==="open"||t.status==="bezig");
  const bel=open.filter(t=>t.soort_actie==="bel"||/\b(bel|terugbellen|bellen)\b/i.test(t.titel||""));
  const opv=open.filter(t=>/^Opvolging/i.test(t.titel||""));
  const kaart=t=>{const b=t.bedrijf_info||{};
    return `<article class="card"><div class="body"><b>${e(t.titel)}</b><div class="meta">${t.auto?e(t.auto)+" · ":""}${t.deadline?"uiterlijk "+e(String(t.deadline).slice(0,10)):""}</div>
    <div class="row">${b.nummer?`<a class="btn sm" href="tel:${e(b.nummer)}">📞 Bel ${e(b.nummer)}</a>`:""}<a class="btn sm" href="${e(wa(vul(/^Opvolging/i.test(t.titel)?C.opvolging:C.terugbellen,{auto:t.auto})))}" target="_blank" rel="noopener">💬 WhatsApp-concept</a>${t.adres?routeKn(t.adres):""}</div></div></article>`};
  c.innerHTML=`<div class="rb-kl">
   <article class="card"><div class="body"><h2 class="t">💬 WhatsApp-concepten</h2><div class="meta">Eén tik: WhatsApp opent met de tekst. Jij kiest de klant en verstuurt zelf; het systeem verstuurt nooit iets.</div>
   ${Object.keys(CLAB).map(k=>`<div class="rb-con"><div><b>${CLAB[k]}</b><div class="meta">${e(C[k])}</div></div><div class="row"><a class="btn sm" href="${e(wa(C[k]))}" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="btn sm ghost" data-kop="${k}">Kopieer</button></div></div>`).join("")}</div></article>
   <h3>📞 Terugbellen <span class="cnt">${bel.length}</span></h3>${bel.map(kaart).join("")||'<div class="meta">Geen terugbel-taken.</div>'}
   <h3>🤝 Opvolging na verkoop <span class="cnt">${opv.length}</span></h3>${opv.map(kaart).join("")||'<div class="meta">Geen opvolging open. Wordt klaargezet bij "Auto verkocht".</div>'}
   <div id="rb-dos"></div>
   <div class="meta">🔒 Zonder inlog staan er geen telefoonnummers of adressen op deze site (namen ingekort). Ingelogd als Robin zie je ze wel.</div></div>`;
  dosBlok();
  c.querySelectorAll("[data-kop]").forEach(b=>b.onclick=()=>{try{navigator.clipboard.writeText(C[b.dataset.kop]);toast2("Tekst gekopieerd")}catch(x){prompt("Kopieer:",C[b.dataset.kop])}});
}
/* ---------- DOSSIER_V1: één klantenlijst voor Telegram en site + tijdlijn per klant/kenteken ---------- */
let DOS=null,DOSQ="";
async function laadDos(){try{DOS=await api("/taken/robin/klanten")}catch(x){DOS={fout:x.message,klanten:[]}}return DOS}
function telKn(k,tekst){if(!k.tel)return "";const w=k.wa?`https://wa.me/${encodeURIComponent(k.wa)}?text=${encodeURIComponent(tekst)}`:"";
  return `<a class="btn sm" href="tel:${e(k.tel)}">📞 Bel</a>${w?`<a class="btn sm" href="${e(w)}" target="_blank" rel="noopener">💬 WhatsApp</a>`:""}`}
function dosBlok(){
  const el=document.getElementById("rb-dos");if(!el)return;
  if(!DOS){el.innerHTML='<div class="meta">Klanten laden…</div>';laadDos().then(()=>{if(seg===KLANTEN_SEG)dosBlok()});return}
  const C=Object.assign({},CONCEPTEN_STD,(V&&V.concepten)||{});
  const q=DOSQ.trim().toLowerCase();
  const L=(DOS.klanten||[]).filter(k=>!q||[k.naam,k.wens,k.kenteken].join(" ").toLowerCase().includes(q));
  el.innerHTML=`<h3>👥 Klanten <span class="cnt">${(DOS.klanten||[]).length}</span></h3>
   <div class="meta">Eén lijst: wat je in Telegram (Assistent) of hier invoert, staat meteen op beide plekken.</div>
   <div class="row rb-dosrij"><input id="rb-dosq" type="search" placeholder="Zoek naam, wens of kenteken" value="${e(DOSQ)}"><button type="button" class="btn sm" data-dos="nieuw">➕ Klant</button><button type="button" class="btn sm ghost" data-dos="kent">🕘 Kenteken</button></div>
   ${DOS.fout?`<div class="meta">⚠️ ${e(DOS.fout)}</div>`:""}
   ${L.slice(0,60).map(k=>`<article class="card"><div class="body"><button type="button" class="rb3-knaam" data-kk="${e(k.id)}">${e(k.naam)} ›</button> <span class="meta">· ${e(k.bron)}${k.sinds?" · sinds "+e(k.sinds):""}</span>
     <div class="meta">${k.wens?"Zoekt: "+e(k.wens):""}${k.kenteken?" · 🔖 "+e(k.kenteken):""}</div>
     ${(k.autos||[]).map(a=>`<div class="meta">🚗 ${e(a.kenteken)} ${e(a.omschr||"")}${a.apk_tot?" · APK tot "+e(a.apk_tot):""}</div>`).join("")}
     ${(k.notities||[]).slice(-2).map(n=>`<div class="meta">• ${e(n)}</div>`).join("")}
     <div class="row">${DOS.prive?telKn(k,C.terugbellen):(k.heeft_tel?'<span class="meta">📞 nummer bekend (log in om te bellen)</span>':"")}
     <button type="button" class="btn sm ghost" data-tl="klant/${e(k.id)}">🕘 Tijdlijn</button><button type="button" class="btn sm ghost" data-not="${e(k.id)}">✏️ Notitie</button><button type="button" class="btn sm ghost" data-rdw="${e(k.id)}">🔖 Kenteken (RDW)</button></div></div></article>`).join("")||'<div class="meta">Nog geen klanten. Voeg er een toe, of zeg in Telegram: “klant Jan 06… zoekt een Golf”.</div>'}`;
  const qi=document.getElementById("rb-dosq");if(qi)qi.oninput=()=>{DOSQ=qi.value;const p=qi.selectionStart;dosBlok();const n=document.getElementById("rb-dosq");if(n){n.focus();try{n.setSelectionRange(p,p)}catch(x){}}};
  el.querySelectorAll("[data-tl]").forEach(b=>b.onclick=()=>tijdlijn(b.dataset.tl));
  el.querySelectorAll("[data-kk]").forEach(b=>b.onclick=()=>window.RB3&&window.RB3.klantKaart&&window.RB3.klantKaart(b.dataset.kk));
  el.querySelectorAll("[data-rdw]").forEach(b=>b.onclick=async()=>{const r=await kentekenRdw(true,b.dataset.rdw);if(r&&r.ok){await laadDos();dosBlok()}});
  el.querySelectorAll("[data-not]").forEach(b=>b.onclick=async()=>{const t=prompt("Notitie bij deze klant");if(!t)return;try{await api("/taken/robin/klant/"+b.dataset.not+"/notitie","POST",{tekst:t});await laadDos();dosBlok();toast2("Notitie opgeslagen (ook in Telegram)")}catch(x){toast2(x.message)}});
  el.querySelectorAll("[data-dos]").forEach(b=>b.onclick=async()=>{
    if(b.dataset.dos==="kent"){const k=kentekenVraag("Kenteken, bijv. GB-XL-12");if(k)tijdlijn("kenteken/"+k);return}
    const naam=prompt("Naam klant");if(!naam||!naam.trim())return;const tel=prompt("Telefoon (optioneel)","");if(tel===null)return;const wens=prompt("Zoekt / wil (optioneel)","");if(wens===null)return;const kenteken=kentekenVraag("Kenteken (optioneel)");if(kenteken===null)return; /* AZ_FIX9: Annuleren = niets opslaan */
    try{await api("/taken/robin/klant","POST",{naam,tel,wens,kenteken});await laadDos();dosBlok();toast2("Klant opgeslagen — staat ook in Telegram")}catch(x){toast2(x.message)}});
}
async function tijdlijn(pad){
  let r;try{r=await api("/taken/robin/tijdlijn/"+pad)}catch(x){toast2(x.message);return}
  const ICO={klant:"👤",wens:"🔎",notitie:"✏️",taak:"📝",klaar:"✅",voorraad:"🚗",prijs:"💶",verkocht:"🎉",proefrit:"🛣"};
  const ov=document.createElement("div");ov.className="rb-ov";ov.id="rb-tl";
  const kop=(r.kop&&r.kop.klant&&r.kop.klant.naam)||(r.kop&&r.kop.kenteken)||"Tijdlijn";
  ov.innerHTML=`<div class="rb-ovin"><div class="row"><b>🕘 ${e(kop)}</b><button type="button" class="btn sm ghost" data-x>Sluiten</button></div>
   ${(r.items||[]).map(i=>`<div class="rb-tli"><span>${ICO[i.soort]||"•"}</span><div><div>${e(i.tekst)}</div><div class="meta">${e(String(i.datum||"datum onbekend").replace("T"," ").slice(0,16))}</div></div></div>`).join("")||'<div class="meta">Nog niets gevonden voor dit dossier.</div>'}</div>`;
  ov.onclick=ev=>{if(ev.target===ov||ev.target.hasAttribute("data-x"))ov.remove()};
  const oud=document.getElementById("rb-tl");if(oud)oud.remove();document.body.appendChild(ov);
}
window.ROBIN_V2.tijdlijn=tijdlijn;
/* ---------- KENTEKEN_RDW_V1 (punt 2): foto van kenteken/kentekenkaart of getypt -> RDW (merk, model, APK) ---------- */
function kiesFoto(){return new Promise(res=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.setAttribute("capture","environment");
  i.onchange=()=>{const f=i.files&&i.files[0];if(!f){res(null);return}const img=new Image(),u=URL.createObjectURL(f);
    img.onload=()=>{const m=1600,sc=Math.min(1,m/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL("image/jpeg",0.82))};img.onerror=()=>res(null);img.src=u};i.click()})}
async function kentekenRdw(vraag,klant_id){
  const keuze=vraag?confirm("Kenteken-foto maken (plaat of kentekenkaart)?\nOK = foto, Annuleren = kenteken typen of overslaan"):true;
  let body=null;
  if(keuze){toast2("Foto kiezen…");const f=await kiesFoto();if(!f)return null;toast2("Kenteken lezen en RDW opvragen…");body={foto:f}}
  else{const k=kentekenVraag("Kenteken, bijv. GB-XL-12\n(leeg laten = overslaan, Annuleren = stoppen)");if(k===null)return null;if(!k)return {overslaan:true}; /* KENTEKEN_NL_V1 */
    if(!kentekenCheck(k).ok)return {ok:false,kenteken:k,reden:"Buitenlands/bijzonder kenteken: geen RDW-opvraag."};body={kenteken:k}}
  if(klant_id)body.klant_id=klant_id;
  try{const r=await api("/taken/robin/kenteken","POST",body);
    if(r.ok)toast2("RDW: "+[r.merk,r.model].filter(Boolean).join(" ")+" · APK tot "+(r.apk_tot||"onbekend")+" · eigenaren: onbekend (niet in RDW open data)");
    else toast2(r.reden||"Niet gevonden");return r}catch(x){toast2(x.message);return null}}
window.ROBIN_V2.kentekenRdw=kentekenRdw;
/* ---------- KENTEKEN_NL_V1 (t654u punt 5): zelfde regels als pipeline/kenteken_nl.py ---------- */
const KSC=["LLDDDD","DDDDLL","DDLLDD","LLDDLL","LLLLDD","DDLLLL","DDLLLD","DLLLDD","LLDDDL","LDDDLL","LLLDDL","LDDLLL","DLLDDD","DDDLLD"];
const KGR=[[2,2,2],[2,2,2],[2,2,2],[2,2,2],[2,2,2],[2,2,2],[2,3,1],[1,3,2],[2,3,1],[1,3,2],[3,2,1],[1,2,3],[1,2,3],[3,2,1]];
function kentekenCheck(k){const n=String(k||"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(!n)return{ok:false,norm:"",mooi:"",reden:"Geen kenteken ingevuld."};
  const pat=n.replace(/[A-Z]/g,"L").replace(/[0-9]/g,"D"),i=n.length===6?KSC.indexOf(pat):-1;
  if(i<0)return{ok:false,norm:n,mooi:n,reden:"\u201c"+String(k).trim().slice(0,20)+"\u201d is geen gewoon Nederlands kenteken."};
  let p=0;return{ok:true,norm:n,mooi:KGR[i].map(l=>{const s=n.substr(p,l);p+=l;return s}).join("-"),sidecode:i+1}}
/* null = gestopt, "" = leeg gelaten, anders zonder streepjes in hoofdletters. Buitenlands/onbekend: waarschuwen, met bevestiging toestaan */
function kentekenVraag(label,start){let v=start||"";for(;;){const k=prompt(label,v);if(k===null)return null;if(!k.trim())return "";const c=kentekenCheck(k);if(c.ok)return c.norm;
  if(confirm(c.reden+"\n\nBuitenlands of bijzonder kenteken?\nOK = toch gebruiken ("+c.norm+")\nAnnuleren = opnieuw typen"))return c.norm;v=k}}
window.ROBIN_V2.kentekenCheck=kentekenCheck;
/* ---------- KEUZE_SHEET_V1 (t654u punt 2 en 3): duidelijke knoppen; Annuleren = stoppen, niets opgeslagen ---------- */
function sheet(html,bind){return new Promise(res=>{const ov=document.createElement("div");ov.className="rb-ov";ov.id="rb-sheet";
  ov.innerHTML=`<div class="rb-ovin">${html}</div>`;let klaar=false;const af=v=>{if(klaar)return;klaar=true;ov.remove();res(v)};
  ov.onclick=ev=>{if(ev.target===ov)af(null)};const o=document.getElementById("rb-sheet");if(o)o.remove();document.body.appendChild(ov);
  ov.querySelectorAll("[data-x]").forEach(b=>b.onclick=()=>af(null));bind(ov,af)})}
async function ritSheet(){let meds=[];try{meds=((await api("/taken")).gebruikers||[]).map(u=>u.naam).filter(Boolean)}catch(x){}
  return sheet(`<div class="row"><b>🚚 Rit plannen</b><button type="button" class="btn sm ghost" data-x>Annuleren</button></div>
   <div class="rb-keus" role="group" aria-label="Soort rit"><button type="button" class="rb-k" data-s="ophalen" aria-pressed="false">🚚 Ophalen</button><button type="button" class="rb-k" data-s="afleveren" aria-pressed="false">🏁 Afleveren</button></div>
   <label class="rb-f">Auto<input id="rs-auto" autocomplete="off" placeholder="bijv. VW Golf GB-XL-12"></label>
   <label class="rb-f">Adres<input id="rs-adres" autocomplete="off" placeholder="bijv. Kampweg 27, Swifterbant"></label>
   <label class="rb-f">Tijdslot (optioneel)<input id="rs-tijd" autocomplete="off" placeholder="bijv. 15:30-16:30"></label>
   <label class="rb-f">Voor (optioneel)<select id="rs-voor"><option value="">Niet toegewezen</option>${meds.map(n=>`<option>${e(n)}</option>`).join("")}</select></label>
   <div class="rb-fout" id="rs-fout" role="alert"></div>
   <div class="row rb-knoppen"><button type="button" class="btn ghost" data-x>Annuleren</button><button type="button" class="btn" id="rs-ok">Rit opslaan</button></div>`,(ov,af)=>{
    let soort="";ov.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{soort=b.dataset.s;ov.querySelectorAll("[data-s]").forEach(x=>{x.classList.toggle("aan",x===b);x.setAttribute("aria-pressed",String(x===b))});ov.querySelector("#rs-fout").textContent=""});
    ov.querySelector("#rs-ok").onclick=()=>{const v=s=>ov.querySelector(s).value.trim(),f=ov.querySelector("#rs-fout");
      if(!soort){f.textContent="Kies eerst: Ophalen of Afleveren.";return}if(!v("#rs-auto")){f.textContent="Welke auto?";return}if(!v("#rs-adres")){f.textContent="Vul het adres in.";return}
      af({soort,auto:v("#rs-auto"),adres:v("#rs-adres"),tijdslot:v("#rs-tijd"),voor:ov.querySelector("#rs-voor").value})}})}
function verkochtSheet(A){const nm=x=>String(x.titel||"").split("|")[0].trim(),pr=x=>x.prijs>0?"€ "+Number(x.prijs).toLocaleString("nl-NL"):"prijs onbekend";
  const h=x=>(nm(x)+" "+(x.merk||"")+" "+(x.model||"")+" "+(x.jaar||"")+" "+(x.brandstof||"")).toLowerCase();
  return sheet(`<div class="row"><b>🎉 Welke auto is verkocht?</b><button type="button" class="btn sm ghost" data-x>Annuleren</button></div>
   <input id="vk-zoek" class="rb-zoek" type="search" placeholder="Zoek op merk, model of jaar" autocomplete="off" aria-label="Zoek auto">
   <div id="vk-lijst" class="rb-lijst"></div><div id="vk-bev" hidden></div>`,(ov,af)=>{
    const L=ov.querySelector("#vk-lijst"),Z=ov.querySelector("#vk-zoek"),B=ov.querySelector("#vk-bev");
    const toon=()=>{const q=Z.value.toLowerCase().split(/\s+/).filter(Boolean);const M=A.map((x,i)=>[x,i]).filter(([x])=>q.every(w=>h(x).includes(w)));
      L.innerHTML=M.map(([x,i])=>`<button type="button" class="rb-li" data-i="${i}"><b>${e(nm(x))}</b><span class="meta">${e([x.jaar,x.km>0?Number(x.km).toLocaleString("nl-NL")+" km":"",pr(x)].filter(Boolean).join(" · "))}</span></button>`).join("")||'<div class="meta">Geen auto gevonden. Probeer een ander woord.</div>';
      L.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>kies(A[+b.dataset.i]))};
    const kies=x=>{L.hidden=true;Z.hidden=true;B.hidden=false;
      B.innerHTML=`<div class="rb-bev"><div><b>${e(nm(x))}</b> als <b>VERKOCHT</b> markeren?</div><div class="meta">Hij gaat uit de voorraad. Afleveren, papierwerk en opvolging worden klaargezet. Er wordt niets naar de klant gestuurd.</div>
       <label class="rb-f">Afleveradres (optioneel)<input id="vk-adres" autocomplete="off"></label><label class="rb-f">Tijdslot (optioneel)<input id="vk-tijd" autocomplete="off" placeholder="bijv. za 10:00-11:00"></label>
       <div class="row rb-knoppen"><button type="button" class="btn ghost" id="vk-terug">Andere auto</button><button type="button" class="btn" id="vk-ok">Ja, verkocht</button></div></div>`;
      B.querySelector("#vk-terug").onclick=()=>{B.hidden=true;L.hidden=false;Z.hidden=false};
      B.querySelector("#vk-ok").onclick=()=>af({auto:x,adres:B.querySelector("#vk-adres").value.trim(),tijdslot:B.querySelector("#vk-tijd").value.trim()})};
    Z.oninput=toon;toon()})}
/* ---------- acties ---------- */
async function actie(a){
  try{
    if(a==="taak"){if(window.NAV)NAV.ga("taken");return}
    if(a==="taxatie"){if(window.NAV)NAV.ga("taxatie");return}
    if(a==="voorraad"){if(window.NAV)NAV.ga("voorraad");return}
    if(a==="bellen"||a==="whatsapp"){if(window.NAV)NAV.ga("klanten");return}
    if(a==="briefing"){const aan=!(V&&V.briefing_aan);if(aan&&!confirm("Ochtendbriefing om 08:00 aanzetten? Hij verschijnt alleen hier op je site; er wordt niets verstuurd."))return;
      await api("/taken/robin/briefing","POST",{aan});await laadV();vdBlok();toast2(aan?"Ochtendbriefing staat aan":"Ochtendbriefing staat uit");return}
    if(a==="binnen"){let kenteken="",voorstel="";
      const rd=await kentekenRdw(true);if(rd===null)return; /* Annuleren = stoppen */
      if(rd.ok){kenteken=rd.kenteken;voorstel=[rd.merk,rd.model].filter(Boolean).join(" ")}
      else if(rd.kenteken)kenteken=kentekenCheck(rd.kenteken).norm; /* AZ_FIX7: getypt kenteken bewaren, ook als de RDW niet antwoordt */
      const auto=prompt("Welke auto is binnen?"+(rd.ok?"\n(RDW: "+voorstel+", APK tot "+(rd.apk_tot||"onbekend")+")":(rd.kenteken?"\n(Kenteken "+kentekenCheck(rd.kenteken).mooi+" bewaard. "+(rd.reden||"RDW gaf geen gegevens.")+")":"")),voorstel);if(!auto||!auto.trim())return;
      const voor=prompt("Voor welke medewerker? (leeg = niet toegewezen)","");if(voor===null)return;
      const r=await api("/taken/robin/auto-binnen","POST",{auto,kenteken,voor,bevestigd:!!kenteken&&!kentekenCheck(kenteken).ok});
      const n=(r.resultaat||[]).length,km=kenteken?kentekenCheck(kenteken).mooi:"";
      toast2(n>=4?"4 taken klaargezet: klaarmaken, foto's, advertentieconcept, verkoopkaart":n===0?"Voor "+(km||"deze auto")+" staan de taken al open. Niets dubbel gemaakt.":n+" nieuwe taken klaargezet; de rest stond al open"+(km?" voor "+km:"")+".");return}
    if(a==="verkocht"){let A=((typeof VR!=="undefined"&&VR&&VR.autos)||[]).slice();if(!A.length){try{A=((await api("/taken/robin/voorraad")).autos||[]).slice()}catch(x){}}
      if(!A.length){toast2("De voorraadlijst is nu niet te laden. Er is niets gewijzigd; probeer het zo opnieuw.");return}
      const v=await verkochtSheet(A);if(!v)return; /* VERKOCHT_LIJST_V1: tikken + bevestigen; Annuleren = niets */
      const r=await api("/taken/robin/auto-verkocht","POST",{url:v.auto.url,id:v.auto.id,auto:v.auto.titel,adres:v.adres,tijdslot:v.tijdslot,bevestigd:true});
      toast2("Verkocht: "+r.resultaat.auto+". Afleveren, papierwerk en opvolging staan klaar.");try{VR=null}catch(x){}if(typeof render==="function")render();return}
    if(window.RB3&&window.RB3.actie&&["papier","proefrit","klantvraag","week"].includes(a))return window.RB3.actie(a); /* ROBIN_V3 */
    if(a==="rit"){const v=await ritSheet();if(!v)return; /* RIT_KEUZE_V1 */
      await api("/taken/robin/rit","POST",v);await laadV();vdBlok();toast2((v.soort==="afleveren"?"Afleveren":"Ophalen")+" klaargezet met route en checklist");return}
  }catch(x){toast2(x.message)}
}
/* ---------- kop ---------- */
function kopLabel(){const b=document.querySelector("header.top .brand div");if(b&&!document.getElementById("rb-rol")){const s=document.createElement("small");s.id="rb-rol";s.className="rb-rol";s.textContent="Robin · Beheer";b.insertBefore(s,b.firstChild)}}
/* ---------- render-haak ---------- */
const _r=render;
render=function(){
  if(seg===KLANTEN_SEG){
    seg=8;try{_r.apply(this,arguments)}finally{seg=KLANTEN_SEG}
    const f=document.querySelector(".filters"),br=document.querySelector(".bronnen"),k=document.getElementById("kpis");
    if(f)f.style.display="none";if(br)br.style.display="none";if(k)k.innerHTML="";
    klanten();Promise.all([laadV(),laadT()]).then(()=>{if(seg===KLANTEN_SEG)klanten()});
    return;
  }
  const f=document.querySelector(".filters");if(f)f.style.display="";
  const out=_r.apply(this,arguments);
  kopLabel();
  if(seg===VD){vdBlok();setTimeout(vdBlok,400);laadV().then(()=>{if(seg===VD)vdBlok()})}
  if(seg===VR_SEG){setTimeout(vrBlok,50);setTimeout(vrBlok,800);laadV().then(()=>{if(seg===VR_SEG)vrBlok()})}
  return out;
};
/* verse voorraad live van de server (elk uur bijgewerkt), i.p.v. de laatst gepubliceerde kopie */
if(LIVE)api("/taken/robin/voorraad").then(j=>{if(j&&j.autos){try{VR=j}catch(x){}if(seg===VR_SEG)render()}}).catch(()=>{});
window.RB={api,e,sheet,toast2,kentekenCheck,kentekenVraag,kiesFoto,laadV,laadT,routeKn,wa,LIVE,vul,telVanNaam,bewaarTelNaam,bekendeNamen}; /* ROBIN_V3 gebruikt deze hulpjes */
})();

/* ROBIN_V3 (t657u/t658u/t659u): tijdwinst voor Robin, alles in één scherm. Niets wordt verstuurd; Robin opent WhatsApp/RDW zelf. */
(function(){"use strict";
if(typeof KL!=="undefined"&&KL.slug&&KL.slug!=="brns")return;
if(!window.RB)return;
const R=window.RB,e=R.e,VRS=12;
let SIG=null,SIGT=0,ALLEEN=false;
/* PRIJSVERLOOP_V1 (t662u A5): prijshistorie op de voorraadkaart (alleen Robins site) */
let PV=null;async function laadPV(){if(PV)return PV;try{PV=await R.api("/taken/robin/v3/prijsverloop")}catch(x){}return PV}
const eur=n=>"€ "+Number(n).toLocaleString("nl-NL"),dm=d=>String(d).slice(8,10)+"-"+String(d).slice(5,7);
function pvRegel(v){if(!v||!v.wijzigingen)return ""; /* zonder wijziging toont de kaart al "Prijsverloop: geen wijziging" */
  const vv=v.verschil,s=(vv<0?"−":"+")+eur(Math.abs(vv));
  return `<div class="meta rb3-pv">📈 ${v.verloop.map(x=>`${eur(x.prijs)} <span>(${dm(x.datum)})</span>`).join(" → ")} · ${s} sinds ${dm(v.sinds)}</div>`}
async function laadSig(){if(SIG&&Date.now()-SIGT<120000)return SIG;try{SIG=await R.api("/taken/robin/v3/signalen");SIGT=Date.now()}catch(x){}return SIG}
function kopieer(t,ok){const k=()=>R.toast2(ok||"Gekopieerd");if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(k,()=>{prompt("Kopieer:",t)});else prompt("Kopieer:",t)}
window.RB3={kopieer,klantKaart:(id)=>klantKaart(id)};
/* ---------- SIGNALEN_V1 (feature 4) + PRIJS_DELEN_V1 (feature 6) op de voorraadkaarten ---------- */
function deco(){
  if(typeof seg==="undefined"||seg!==VRS)return;const c=document.getElementById("cards");if(!c||typeof VR==="undefined"||!VR||!VR.autos)return;
  const S=(SIG&&SIG.per_auto)||{};let n=0;
  VR.autos.forEach(a=>{const id=typeof vrId==="function"?vrId(a.url):"";const k=id&&document.getElementById("voorraad-"+id);if(!k)return;
    const L=S[String(a.id||a.url)]||[];if(L.length)n++;
    let b=k.querySelector(".rb3");if(!b){b=document.createElement("div");b.className="rb3";const body=k.querySelector(".body")||k;body.appendChild(b)}
    const pv=PV&&PV.per_auto&&PV.per_auto[String(a.id)],lang=L.some(x=>x.code==="lang");
    const h=`<div class="rb3-sig">${L.map(x=>`<span class="rb3-l ${e(x.niveau)}">${x.code==="lang"?"⏳":x.code==="foto"?"📷":x.code==="prijs"?"€":"🔢"} ${e(x.label)}</span>`).join("")}</div>${pvRegel(pv)}
      ${lang?`<div class="rb3-kn"><button type="button" class="btn sm prim" data-r3="opfris" data-id="${e(a.id)}">🔄 Taak voor team: opfrissen</button></div>`:""}
      <div class="rb3-kn"><button type="button" class="btn sm" data-r3="deel" data-id="${e(a.id)}">💬 Prijs delen</button><button type="button" class="btn sm ghost" data-r3="proefrit" data-id="${e(a.id)}">🔑 Proefrit</button><button type="button" class="btn sm ghost" data-r3="klantvraag" data-id="${e(a.id)}">📞 Klantvraag</button><button type="button" class="btn sm ghost" data-r3="papier" data-id="${e(a.id)}">🧾 Papierwerk</button></div>`;
    if(b.dataset.h!==h){b.innerHTML=h;b.dataset.h=h;b.querySelectorAll("[data-r3]").forEach(x=>x.onclick=()=>actie3(x.dataset.r3,x.dataset.id))}
    k.style.display=ALLEEN&&!L.length?"none":"";});
  let t=document.getElementById("rb3-sigtop");const vr=document.getElementById("rb-vr");
  if(!t&&vr){t=document.createElement("div");t.id="rb3-sigtop";t.className="meta rb3-top";vr.appendChild(t)}
  if(t&&SIG){const T=SIG.telling||{};const h=`<b>Signalen:</b> ⏳ ${T.lang||0} lang staand (${SIG.drempel_dagen}+ dagen in onze meting) · 📷 ${T.foto||0} zonder foto · € ${T.prijs||0} zonder prijs · 🔢 ${T.km||0} zonder km-stand <button type="button" class="btn sm ghost" id="rb3-alleen">${ALLEEN?"Toon alle auto's":"Toon alleen met signaal ("+n+")"}</button>`;
    if(t.dataset.h!==h){t.innerHTML=h;t.dataset.h=h;const bt=document.getElementById("rb3-alleen");if(bt)bt.onclick=()=>{ALLEEN=!ALLEEN;deco()}}}
}
function autoVan(id){return ((typeof VR!=="undefined"&&VR&&VR.autos)||[]).find(a=>String(a.id)===String(id))}
async function deelSheet(id){
  let r;try{r=await R.api("/taken/robin/v3/deel/"+encodeURIComponent(id),"POST",{})}catch(x){R.toast2(x.message);return}
  await R.sheet(`<div class="rb3-rij"><h3>💬 Prijs delen</h3><button type="button" class="btn sm ghost" data-x>Sluiten</button></div>
    <div class="meta">Concept voor WhatsApp. Jij kiest zelf de klant en verstuurt; er gaat niets automatisch.</div>
    <textarea id="rb3-tekst" rows="6" style="width:100%">${e(r.tekst)}</textarea>
    <div class="rb3-rij"><a class="btn prim" id="rb3-wa" href="${e(r.wa)}" target="_blank" rel="noopener">💬 Open WhatsApp</a>
    <button type="button" class="btn" id="rb3-kt">📋 Kopieer tekst</button><button type="button" class="btn ghost" id="rb3-kl">🔗 Kopieer link</button></div>`,(ov,af)=>{
    const ta=ov.querySelector("#rb3-tekst"),w=ov.querySelector("#rb3-wa");ta.oninput=()=>{w.href=R.wa(ta.value)};
    ov.querySelector("#rb3-kt").onclick=()=>kopieer(ta.value,"Tekst gekopieerd");ov.querySelector("#rb3-kl").onclick=()=>kopieer(r.url,"Link gekopieerd")});
}
async function actie3(a,id){
  if(a==="deel")return deelSheet(id);
  if(a==="papier")return papier(id?autoVan(id):null);
  if(a==="proefrit")return proefrit(id?autoVan(id):null);
  if(a==="klantvraag")return klantvraag(id?autoVan(id):null);
  if(a==="week")return weekSheet();
  if(a==="opfris")return opfrisSheet(id);
  R.toast2("Deze knop komt in de volgende stap.");
}
/* ---------- KLAARZET_V1 (t659u): officiële pagina + gegevens om te kopiëren + checklist. Inloggen doet Robin zelf. ---------- */
const KZ={inkoopcheck:"🔎 Inkoopcheck: kenteken + km-stand (NAP)",import:"🇪🇺 Import aanmelden (RDW) + BPM",voorraad:"📥 Inkoop: in bedrijfsvoorraad (RDW)",tenaam:"🧾 Verkoop: op naam klant (RDW)",apk:"🛠️ APK-afspraak (kenteken)",schade:"⚠️ Schadeclaim (afleverrapport)"};
const KZV={import:[["vin","VIN / chassisnummer"],["merk","Merk"],["model","Model / uitvoering"],["det","Datum eerste toelating (dd-mm-jjjj)"],["co2","CO₂ (g/km)"],["norm","CO₂-meetmethode"],["brandstof","Brandstof"],["km","Km-stand"],["kleur","Kleur"],["land","Land van herkomst"],["keur","Verwachte keuringsdatum (leeg = over 14 dagen)"]],
  voorraad:[["kenteken","Kenteken"],["merk","Merk"],["model","Model"],["km","Km-stand (teller)"],["apk_tot","APK tot"]],
  tenaam:[["kenteken","Kenteken"],["merk","Merk"],["model","Model"],["km","Km-stand bij aflevering"],["koper","Naam koper"]],
  apk:[["kenteken","Kenteken"],["merk","Merk"],["model","Model"],["apk_tot","APK tot"],["klant","Voornaam klant (optioneel)"]],
  schade:[["kenteken","Kenteken"],["merk","Merk"],["model","Model"],["datum","Datum aflevering"],["km","Km-stand bij aflevering"],["schade","Schade"],["fotos","Aantal foto's"],["koper","Naam koper"]],
  inkoopcheck:[["kenteken","Kenteken"],["merk","Merk"],["model","Model"],["km","Km-stand (teller)"],["apk_tot","APK tot"],["eerste_toelating","Eerste toelating"]]};
async function papier(auto){
  const soort=await R.sheet(`<div class="rb3-rij"><h3>🧾 Papierwerk</h3><button type="button" class="btn sm ghost" data-x>Annuleren</button></div>
    <div class="meta">Kies wat je gaat doen. Je krijgt de juiste officiële pagina, je gegevens klaar om te kopiëren en een checklist. Inloggen (eHerkenning of RDW-certificaat) doe je zelf; wij bewaren geen inlog.</div>
    ${Object.keys(KZ).map(k=>`<button type="button" class="btn" style="display:block;width:100%;margin:8px 0;text-align:left" data-k="${k}">${KZ[k]}</button>`).join("")}`,(ov,af)=>ov.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>af(b.dataset.k)));
  if(!soort)return;
  const pre={};if(auto){const t=String(auto.titel||"").split("|")[0].trim().split(" ");pre.merk=auto.merk||t[0]||"";pre.model=auto.model||t.slice(1).join(" ");pre.km=auto.km&&/[1-9]/.test(auto.km)?String(auto.km).replace(/\s*km$/i,""):"";}
  const v=await R.sheet(`<div class="rb3-rij"><h3>${KZ[soort]}</h3><button type="button" class="btn sm ghost" data-x>Annuleren</button></div><div class="rb3-form">
    ${KZV[soort].map(([k,l])=>k==="norm"?`<label>${e(l)}</label><select data-v="norm"><option value="">Weet ik niet</option><option>WLTP</option><option>NEDC</option></select>`:k==="brandstof"?`<label>${e(l)}</label><select data-v="brandstof"><option value="">Kies</option>${["Benzine","Diesel","Hybride benzine","Plug-in hybride","Elektrisch"].map(x=>`<option>${x}</option>`).join("")}</select>`:`<label>${e(l)}</label><input data-v="${k}" value="${e(pre[k]||"")}" ${k==="co2"||k==="km"?'inputmode="numeric"':""} autocomplete="off">`).join("")}
    ${soort!=="import"?`<button type="button" class="btn sm ghost" id="rb3-rdw" style="margin-top:8px">🔎 Merk, model en APK uit RDW (kenteken)</button>`:""}
    </div><div class="rb3-rij" style="margin-top:12px"><button type="button" class="btn prim" id="rb3-ok">Toon gegevens en links</button></div>`,(ov,af)=>{
    const lees=()=>{const o={};ov.querySelectorAll("[data-v]").forEach(i=>o[i.dataset.v]=i.value.trim());return o};
    const b=ov.querySelector("#rb3-rdw");if(b)b.onclick=async()=>{const k=ov.querySelector('[data-v=kenteken]').value;if(!k.trim()){R.toast2("Vul eerst het kenteken in.");return}
      b.disabled=true;b.textContent="RDW zoeken…";try{const r=await R.api("/taken/robin/kenteken","POST",{kenteken:k});if(r.ok){[["merk",r.merk],["model",r.model],["apk_tot",r.apk_tot],["eerste_toelating",r.eerste_toelating]].forEach(([f,w])=>{const i=ov.querySelector(`[data-v=${f}]`);if(i&&w)i.value=w});b.textContent="✅ RDW-gegevens ingevuld"}else{b.textContent="RDW gaf geen gegevens: "+(r.reden||"onbekend")}}catch(x){b.textContent=x.message}b.disabled=false};
    ov.querySelector("#rb3-ok").onclick=()=>af(lees())});
  if(!v)return;
  let r;try{r=await R.api("/taken/robin/v3/klaarzet","POST",{soort,velden:v})}catch(x){R.toast2(x.message);return}
  toonKlaarzet(r,{soort,velden:v});
}
function fmtEur(n){return n==null?"onbekend":"€ "+Number(n).toLocaleString("nl-NL")}
async function toonKlaarzet(r,bewaarData){
  const veld=(l,w)=>`<div class="rb3-veld"><div class="w"><small>${e(l)}</small><b>${w==null||w===""?"<i>onbekend</i>":e(w)}</b></div>${w==null||w===""?"":`<button type="button" class="btn sm" data-kop="${e(w)}">📋 Kopieer</button>`}</div>`;
  const B=r.bpm;const st=r.checklist_status||[];
  await R.sheet(`<div class="rb3-rij"><h3>${e(r.titel)}</h3><button type="button" class="btn sm ghost" data-x>Sluiten</button></div>
    <div class="meta">${e(r.uitleg)}</div>
    ${(r.waarschuwingen||[]).map(w=>`<div class="rb3-waarsch">⚠️ ${e(w)}</div>`).join("")}
    ${(r.kopie||[]).map((k,i)=>`<h3>📋 ${e(k.label)}</h3><textarea rows="${Math.min(8,String(k.tekst).split("\n").length+1)}" style="width:100%" data-kt="${i}">${e(k.tekst)}</textarea><div class="rb3-rij"><button type="button" class="btn sm prim" data-kc="${i}">📋 Kopieer</button>${k.wa?`<a class="btn sm" data-kw="${i}" href="${e(R.wa(k.tekst))}" target="_blank" rel="noopener">💬 WhatsApp</a>`:""}</div>`).join("")}
    ${r.links.length?`<h3>Officiële pagina's</h3>${r.links.map(l=>`<a class="btn rb3-link" href="${e(l.url)}" target="_blank" rel="noopener">🔗 ${e(l.label)}</a>`).join("")}`:""}
    <h3>Gegevens om te kopiëren</h3>${r.velden.map(x=>veld(x.label,x.waarde)).join("")}
    ${B?`<h3>BPM (berekend)</h3>${B.rest_bpm!=null?veld("Te betalen BPM (rest-BPM)",String(B.rest_bpm))+veld("Bruto BPM",B.bruto!=null?String(B.bruto):null)+veld("Afschrijvingspercentage (forfaitaire tabel)",B.afschrijving_pct!=null?String(B.afschrijving_pct).replace(".",","):null)+veld("Leeftijd in maanden",B.maanden!=null?String(B.maanden):null)+veld("Uitgerekend voor keuringsdatum",B.keurdatum):""}
      <div class="meta">${e(B.let_op||"")}${B.rest_bpm!=null?` Rest-BPM ${fmtEur(B.rest_bpm)}, zekerheid: ${e(B.zekerheid||"onbekend")}.`:""}</div>${(B.stappen||[]).length?`<details><summary>Hoe berekend</summary><ul>${B.stappen.map(x=>`<li>${e(x)}</li>`).join("")}</ul></details>`:""}`:""}
    <h3>Checklist</h3><div class="rb3-ck">${r.checklist.map((c,i)=>`<label><input type="checkbox" disabled ${st[i]&&st[i].klaar?"checked":""}> <span>${e(c)}</span></label>`).join("")}</div>
    <div class="meta">${r.taak_id?"Afvinken doe je bij de taak op Taken.":"Bewaar dit als taak voor jezelf; dan kun je de punten afvinken op Taken."}</div>
    ${r.taak_id?"":`<div class="rb3-rij"><button type="button" class="btn prim" id="rb3-bw">💾 Bewaar als taak met checklist</button></div>`}`,(ov,af)=>{
    ov.querySelectorAll("[data-kop]").forEach(b=>b.onclick=()=>kopieer(b.dataset.kop,"Gekopieerd: "+b.dataset.kop.slice(0,30)));
    ov.querySelectorAll("[data-kc]").forEach(b=>b.onclick=()=>kopieer(ov.querySelector(`[data-kt="${b.dataset.kc}"]`).value,"Tekst gekopieerd"));
    ov.querySelectorAll("[data-kt]").forEach(t=>t.oninput=()=>{const w=ov.querySelector(`[data-kw="${t.dataset.kt}"]`);if(w)w.href=R.wa(t.value)});
    const bw=ov.querySelector("#rb3-bw");if(bw)bw.onclick=async()=>{bw.disabled=true;try{await R.api("/taken/robin/v3/klaarzet","POST",{...bewaarData,bewaar:true});R.toast2("Taak gemaakt met checklist (alleen voor jou).");af(true);await R.laadT();if(typeof render==="function"&&typeof seg!=="undefined"&&seg===19)render()}catch(x){R.toast2(x.message);bw.disabled=false}}});
}
/* knop "Gegevens en links" bij klaarzet-taken op Taken */
const KZPRE=/^(Import aanmelden|In bedrijfsvoorraad|Op naam zetten|APK-afspraak|Schadeclaim|Inkoopcheck): /;
function kzTaken(){document.querySelectorAll("article.tk-card[data-id]").forEach(k=>{const h=k.querySelector("h3");if(!h||k.querySelector(".rb3-kz"))return;
  if(/^⚠️ Schade bekijken: /.test(h.textContent.trim())){const b=document.createElement("button");b.type="button";b.className="btn sm rb3-kz";b.textContent="⚠️ Schadeclaim: gegevens";b.onclick=async()=>{try{const r=await R.api("/taken/robin/v3/schade/"+encodeURIComponent(k.dataset.id));toonKlaarzet(r,{soort:"schade",velden:Object.fromEntries(r.velden.map(x=>[x.code,x.waarde||""]))})}catch(x){R.toast2(x.message)}};h.insertAdjacentElement("afterend",b);return}
  if(!KZPRE.test(h.textContent.trim()))return;
  const b=document.createElement("button");b.type="button";b.className="btn sm rb3-kz";b.textContent="🧾 Gegevens en links";b.onclick=async()=>{try{toonKlaarzet(await R.api("/taken/robin/v3/klaarzet/"+encodeURIComponent(k.dataset.id)))}catch(x){R.toast2(x.message)}};h.insertAdjacentElement("afterend",b)})}
const mo2=new MutationObserver(()=>{clearTimeout(mo2.t);mo2.t=setTimeout(kzTaken,150)});
const st2=()=>{mo2.observe(document.body,{childList:true,subtree:true});kzTaken()};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",st2);else st2();
/* ---------- KLANTVRAAG_V1 (feature 2) en PROEFRIT_V1 (feature 1) ---------- */
const telKey=id=>"rb3_tel_"+id;
function waNr(t){let d=String(t||"").replace(/[^\d+]/g,"");if(d.startsWith("+"))d=d.slice(1);else if(d.startsWith("00"))d=d.slice(2);else if(d.startsWith("0"))d="31"+d.slice(1);return d.length>=10?d:""}
function autoKeuze(sel){const A=((typeof VR!=="undefined"&&VR&&VR.autos)||[]);return `<select data-v="auto_id"><option value="">${A.length?"Kies de auto":"Voorraad laden…"}</option>${A.map(a=>`<option value="${e(a.id)}" ${sel&&String(sel.id)===String(a.id)?"selected":""}>${e(String(a.titel||"").split("|")[0].trim().slice(0,60))}${a.prijs>0?" · € "+Number(a.prijs).toLocaleString("nl-NL"):""}</option>`).join("")}<option value="__anders">Andere auto (typ hieronder)</option></select><input data-v="auto" placeholder="Andere auto (optioneel)" autocomplete="off">`}
async function zorgVR(){if(typeof VR!=="undefined"&&VR&&VR.autos)return;try{const j=await R.api("/taken/robin/voorraad");if(j&&j.autos){try{VR=j}catch(x){}}}catch(x){}}
const pad2=n=>String(n).padStart(2,"0");
const lok=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
async function klantvraag(auto){
  await zorgVR();const nu=new Date(),m9=new Date(nu);m9.setDate(m9.getDate()+1);m9.setHours(9,0,0,0);const v16=new Date(nu);v16.setHours(16,0,0,0);const u1=new Date(nu.getTime()+3600e3);
  const keuzes=[["Over 1 uur",u1],...(v16>nu?[["Vandaag 16:00",v16]]:[]),["Morgen 9:00",m9]];
  const v=await R.sheet(`<div class="rb3-rij"><h3>📞 Klant terugbellen</h3><button type="button" class="btn sm ghost" data-x>Annuleren</button></div>
    <div class="meta">Klant vraagt naar een auto en je kunt nu niet? Dit maakt een terugbel-taak met tijd, zet het in het klantdossier en maakt een WhatsApp-concept klaar. Er wordt niets verstuurd.</div>
    <div class="rb3-form"><label>Over welke auto</label>${autoKeuze(auto)}<label>Naam klant</label><input data-v="naam" autocomplete="off"><label>Telefoon</label><input data-v="tel" type="tel" inputmode="tel" autocomplete="off" placeholder="06…">
    <label>Wat vraagt de klant? (optioneel)</label><input data-v="vraag" autocomplete="off" placeholder="bijv. inruil, financiering, proefrit"><label>Wanneer terugbellen</label>
    <div class="rb3-rij">${keuzes.map(([l,d])=>`<button type="button" class="btn sm" data-w="${lok(d)}">${l}</button>`).join("")}</div><input type="datetime-local" data-v="wanneer" value="${lok(u1)}"></div>
    <div class="rb3-rij" style="margin-top:12px"><button type="button" class="btn prim" id="rb3-ok">Terugbel-taak maken</button></div>`,(ov,af)=>{
    ov.querySelectorAll("[data-w]").forEach(b=>b.onclick=()=>{ov.querySelector("[data-v=wanneer]").value=b.dataset.w;ov.querySelectorAll("[data-w]").forEach(x=>x.classList.toggle("prim",x===b))});
    ov.querySelector("#rb3-ok").onclick=()=>{const o={};ov.querySelectorAll("[data-v]").forEach(i=>o[i.dataset.v]=i.value.trim());if(o.naam.length<2){R.toast2("Vul de naam in.");return}if(o.auto_id==="__anders")o.auto_id="";af(o)}});
  if(!v)return;
  let r;try{r=await R.api("/taken/robin/v3/terugbellen","POST",v)}catch(x){R.toast2(x.message);return}
  if(v.tel)try{localStorage[telKey(r.taak_id)]=v.tel}catch(x){}
  R.bewaarTelNaam(v.naam,v.tel);if(v.tel&&r.klant_id)try{localStorage["rb3_tk_"+r.klant_id]=v.tel}catch(x){}
  R.toast2("Terugbel-taak gemaakt"+(r.wanneer?" voor "+r.wanneer.replace("T"," "):"")+(r.dossier_fout?" (dossier: "+r.dossier_fout+")":""));
  await belSheet({id:r.taak_id,auto_id:v.auto_id,titel:"Terugbellen: "+v.naam,naam:v.naam,auto:v.auto,concept:"terugbellen"});vdBlok3();
}
async function belSheet(t){
  /* INVULVELDEN_V1: concept kiezen, ingevuld met naam/auto/prijs; WhatsApp opent bij het nummer dat op dit toestel staat */
  if(!CON2)await laadCon();await zorgVR();
  const tel=(()=>{try{return localStorage[telKey(t.id)]||R.telVanNaam(t.naam)||(t.klant_id&&localStorage["rb3_tk_"+t.klant_id])||""}catch(x){return ""}})();
  const A=((typeof VR!=="undefined"&&VR&&VR.autos)||[]).find(a=>t.auto_id&&String(a.id)===String(t.auto_id));
  const ctx={naam:t.naam||"",auto:(A&&A.titel)||t.auto||"",prijs:A&&A.prijs};
  const C=(CON2&&CON2.concepten)||[];let deel=null;
  if(t.auto_id){try{deel=(await R.api("/taken/robin/v3/deel/"+encodeURIComponent(t.auto_id),"POST",{})).tekst}catch(x){}}
  const keus=[...C.map(c=>[c.key,c.label,c.tekst]),...(deel?[["__deel","Prijs + foto's",deel]]:[])];
  let k0=t.concept||"terugbellen";if(!keus.find(x=>x[0]===k0))k0=keus.length?keus[0][0]:"";
  const n=waNr(tel),link=tx=>n?`https://wa.me/${n}?text=${encodeURIComponent(tx)}`:R.wa(tx);
  const start=R.vul((keus.find(x=>x[0]===k0)||[,,""])[2],ctx);
  await R.sheet(`<div class="rb3-rij"><h3>📞 ${e(t.titel||"Terugbellen")}</h3><button type="button" class="btn sm ghost" data-x>Sluiten</button></div>
    ${tel?"":`<div class="meta">Nummer staat niet op deze telefoon. WhatsApp opent zonder nummer; kies daar de klant.</div>`}
    <div class="rb3-rij">${tel?`<a class="btn prim" href="tel:${e(tel.replace(/[^\d+]/g,""))}">📞 Bel ${e(tel)}</a>`:""}<a class="btn" id="rb3-wa" href="${e(link(start))}" target="_blank" rel="noopener">💬 WhatsApp${n?" naar "+e(tel):""}</a>
    ${t.geen_taak?"":`<button type="button" class="btn ghost" id="rb3-gebeld">✅ Gebeld</button>`}</div>
    <div class="rb3-chips">${keus.map(([k,l])=>`<button type="button" class="btn sm ${k===k0?"prim":"ghost"}" data-ck="${e(k)}">${e(l)}</button>`).join("")}</div>
    <textarea id="rb3-btekst" rows="5" style="width:100%">${e(start)}</textarea><div class="meta">Je kunt de tekst hier nog aanpassen. Er wordt niets vanzelf verstuurd.</div>`,(ov,af)=>{
    const ta=ov.querySelector("#rb3-btekst"),wl=ov.querySelector("#rb3-wa");const upd=()=>{wl.href=link(ta.value)};ta.oninput=upd;
    ov.querySelectorAll("[data-ck]").forEach(b=>b.onclick=()=>{const x=keus.find(y=>y[0]===b.dataset.ck);ta.value=R.vul(x[2],ctx);upd();ov.querySelectorAll("[data-ck]").forEach(y=>{y.classList.toggle("prim",y===b);y.classList.toggle("ghost",y!==b)})});
    const gb=ov.querySelector("#rb3-gebeld");if(gb)gb.onclick=async()=>{try{await R.api("/taken/"+encodeURIComponent(t.id)+"/klaar","POST",{notitie:"Gebeld"});try{delete localStorage[telKey(t.id)]}catch(x){}R.toast2("Afgevinkt: gebeld");af(true);vdBlok3()}catch(x){R.toast2(x.message)}}});
}
async function proefrit(auto){
  await zorgVR();const nu=new Date(),e30=new Date(nu.getTime()+1800e3);let foto=null;
  const v=await R.sheet(`<div class="rb3-rij"><h3>🔑 Proefrit</h3><button type="button" class="btn sm ghost" data-x>Annuleren</button></div>
    <div class="rb3-form"><label>Auto</label>${autoKeuze(auto)}<label>Naam bestuurder</label><input data-v="naam" autocomplete="off"><label>Telefoon</label><input data-v="tel" type="tel" inputmode="tel" autocomplete="off" placeholder="06…">
    <label>Rijbewijs</label><button type="button" class="btn" id="rb3-rb">📷 Foto van rijbewijs maken</button><div class="meta" id="rb3-rbst">Nog geen foto. De foto wordt privé bewaard (niet zichtbaar op de site of in de Team-app) en na ${30} dagen gewist.</div>
    <div class="rb3-rij"><div style="flex:1"><label>Start</label><input type="time" data-v="start" value="${pad2(nu.getHours())}:${pad2(nu.getMinutes())}"></div><div style="flex:1"><label>Terug om</label><input type="time" data-v="eind" value="${pad2(e30.getHours())}:${pad2(e30.getMinutes())}"></div></div></div>
    <div class="rb3-rij" style="margin-top:12px"><button type="button" class="btn prim" id="rb3-ok">Proefrit starten</button></div>`,(ov,af)=>{
    ov.querySelector("#rb3-rb").onclick=async()=>{const f=await R.kiesFoto();if(f){foto=f;ov.querySelector("#rb3-rbst").textContent="✅ Rijbewijsfoto klaar (wordt privé bewaard).";}};
    ov.querySelector("#rb3-ok").onclick=()=>{const o={};ov.querySelectorAll("[data-v]").forEach(i=>o[i.dataset.v]=i.value.trim());if(o.naam.length<2){R.toast2("Vul de naam in.");return}if(o.auto_id==="__anders")o.auto_id="";if(!o.auto_id&&!o.auto){R.toast2("Kies de auto.");return}
      if(!foto&&!confirm("Zonder foto van het rijbewijs starten?"))return;if(o.eind&&o.start&&o.eind<o.start){R.toast2("Terug-tijd ligt vóór de start.");return}af(o)}});
  if(!v)return;
  try{const r=await R.api("/taken/robin/v3/proefrit","POST",{...v,rijbewijs:foto||undefined});if(v.tel)try{localStorage[telKey(r.proefrit.id)]=v.tel}catch(x){}R.bewaarTelNaam(v.naam,v.tel);
    R.toast2("Proefrit gestart: "+r.proefrit.auto+", terug om "+String(r.proefrit.eind).slice(11,16));vdBlok3()}catch(x){R.toast2(x.message)}
}
async function terug(id){const km=prompt("Proefrit terug. Km-stand nu? (optioneel, leeg laten mag)","");if(km===null)return;
  try{const r=await R.api("/taken/robin/v3/proefrit/"+encodeURIComponent(id)+"/terug","POST",{km});try{delete localStorage[telKey(id)]}catch(x){}
    R.toast2(r.proefrit&&r.proefrit.opvolg_taak?"Proefrit afgerond. Opvolgtaak staat klaar voor morgen 10:00.":"Proefrit afgerond");vdBlok3()}catch(x){R.toast2(x.message)}}
let V3=null;
/* ---------- KLANTKAART_V1 (t662u A3): één kaart per klant. Nummer alleen van deze telefoon. ---------- */
async function klantKaart(kid){
  let r;try{r=await R.api("/taken/robin/v3/klant/"+encodeURIComponent(kid))}catch(x){R.toast2(x.message);return}
  const k=r.klant||{},vn=String(k.naam||"").split(" ")[0];let tel="";try{tel=localStorage["rb3_tk_"+kid]||R.telVanNaam(k.naam)||""}catch(x){}
  const tm=s=>String(s||"").slice(8,10)+"-"+String(s||"").slice(5,7)+" "+String(s||"").slice(11,16);
  const O=r.open||[],P=r.proefritten||[],TL=r.tijdlijn||[];
  await R.sheet(`<div class="rb3-rij"><h3>📇 ${e(k.naam)}</h3><button type="button" class="btn sm ghost" data-x>Sluiten</button></div>
    ${r.volgende?`<div class="rb3-ne top"><div><b>👉 ${e(r.volgende)}</b></div></div>`:""}
    <div class="meta">${k.wens?"Zoekt: "+e(k.wens):"Nog geen wens genoteerd."}${k.sinds?" · klant sinds "+e(k.sinds):""}</div>
    ${(k.autos||[]).map((a,i)=>`<div class="rb3-rij"><span class="meta">🚗 ${e(a.kenteken)} ${e(a.omschr||"")}${a.apk_tot?" · APK tot "+e(a.apk_tot):""}</span><button type="button" class="btn sm ghost" data-kapk="${i}">🛠️ APK-afspraak</button></div>`).join("")}
    <div class="rb3-rij">${tel?`<a class="btn prim" href="tel:${e(tel.replace(/[^\d+]/g,""))}">📞 Bel</a>`:""}<button type="button" class="btn ${tel?"":"prim"}" data-kka="wa">💬 WhatsApp-concept</button><button type="button" class="btn ghost" data-kka="not">✏️ Notitie</button></div>
    ${tel?"":`<div class="meta">${k.heeft_tel?"Nummer staat in het dossier, maar niet op deze telefoon.":"Geen nummer bekend."}</div>`}
    <h3>Open <span class="cnt">${O.length}</span></h3>${O.length?O.map(t=>`<div class="rb-rit"><b>${e(t.titel)}</b><div class="meta">${t.wanneer?"🕒 "+tm(t.wanneer):t.deadline?"📅 "+e(t.deadline):""}${t.te_laat?' · <b style="color:#991b1b">te laat</b>':""}</div>${t.terugbel?`<button type="button" class="btn sm" data-kkb="${e(t.id)}">📞 Terugbellen</button>`:""}</div>`).join(""):`<div class="meta">Niets open.</div>`}
    ${P.length?`<h3>Proefritten</h3>`+P.map(p=>`<div class="meta">🔑 ${e(p.auto)} · ${tm(p.start)} ${p.terug?"· terug":"· loopt"}</div>`).join(""):""}
    <h3>Tijdlijn</h3>${TL.length?TL.map(x=>`<div class="meta">${e(String(x.datum||"").slice(0,10))} · ${e(x.tekst)}</div>`).join(""):`<div class="meta">Nog niets.</div>`}`,(ov,af)=>{
    ov.querySelectorAll("[data-kkb]").forEach(b=>b.onclick=()=>{const t=O.find(x=>x.id===b.dataset.kkb);af(null);belSheet({...t,naam:vn,klant_id:kid})});
    ov.querySelector("[data-kka=wa]").onclick=()=>{af(null);const t=O.find(x=>x.terugbel);belSheet({id:"kk_"+kid,geen_taak:true,titel:"WhatsApp aan "+k.naam,naam:vn,klant_id:kid,concept:t?t.concept:"opvolging",auto_id:t&&t.auto_id,auto:t&&t.auto})};
    ov.querySelectorAll("[data-kapk]").forEach(b=>b.onclick=async()=>{const a=(k.autos||[])[+b.dataset.kapk];const o=String(a.omschr||"").split(" ");const v={kenteken:a.kenteken||"",merk:o[0]||"",model:o.slice(1).join(" "),apk_tot:a.apk_tot||"",klant:vn};
      af(null);try{toonKlaarzet(await R.api("/taken/robin/v3/klaarzet","POST",{soort:"apk",velden:v}),{soort:"apk",velden:v})}catch(x){R.toast2(x.message)}});
    ov.querySelector("[data-kka=not]").onclick=async()=>{const n=prompt("Notitie bij "+k.naam);if(!n)return;try{await R.api("/taken/robin/klant/"+encodeURIComponent(kid)+"/notitie","POST",{tekst:n});R.toast2("Notitie opgeslagen");af(null);klantKaart(kid)}catch(x){R.toast2(x.message)}}});
}
/* ---------- OPFRIS_V1 (t662u A5): lang staand -> taak voor het team, zonder bedragen ---------- */
const OPFRIS=[["fotos","Nieuwe foto's maken (rondom + interieur)"],["poetsen","Auto wassen en poetsen"],["vooraan","Auto op een zichtbare plek zetten"],["advertentie","Advertentie nalopen: km-stand, opties, foto-volgorde"]];
async function opfrisSheet(id){
  await zorgVR();const a=autoVan(id);let meds=[];try{meds=((await R.api("/taken")).gebruikers||[]).map(u=>u.naam).filter(Boolean)}catch(x){}
  const v=await R.sheet(`<div class="rb3-rij"><h3>🔄 Opfrissen${a?": "+e(String(a.titel).split("|")[0]):""}</h3><button type="button" class="btn sm ghost" data-x>Sluiten</button></div>
    <div class="meta">Het team krijgt een taak met een checklist. Zonder prijzen of bedragen.</div>
    ${OPFRIS.map(([k,l],i)=>`<label class="rb3-chk"><input type="checkbox" value="${k}" ${i<2?"checked":""}> ${e(l)}</label>`).join("")}
    <label class="rb-f">Voor<select id="rb3-ofv"><option value="">Wie het eerst kan</option>${meds.filter(n=>!/^robin$/i.test(n)).map(n=>`<option>${e(n)}</option>`).join("")}</select></label>
    <button type="button" class="btn prim" id="rb3-ofok">Taak maken</button>`,(ov,af)=>{ov.querySelector("#rb3-ofok").onclick=()=>af({wat:[...ov.querySelectorAll(".rb3-chk input:checked")].map(x=>x.value),voor:ov.querySelector("#rb3-ofv").value})});
  if(!v)return;try{const r=await R.api("/taken/robin/v3/opfris/"+encodeURIComponent(id),"POST",v);R.toast2(r.bestond?"Er staat al een opfris-taak voor deze auto.":"Taak gemaakt voor "+(v.voor||"het team"));NE=null;vdEerst()}catch(x){R.toast2(x.message)}}
/* ---------- NU_EERST_V1 (t662u A4): 'Wat nu eerst' bovenaan Vandaag ---------- */
let NE=null;
async function vdEerst(){
  if(typeof seg==="undefined"||seg!==20)return;try{NE=await R.api("/taken/robin/v3/nu_eerst")}catch(x){return}
  const host=document.querySelector(".vandaag");if(!host||seg!==20)return;let b=document.getElementById("rb3-eerst");
  if(!b){b=document.createElement("section");b.id="rb3-eerst";b.className="vb rb rb3-eerst"}
  if(host.firstChild!==b)host.insertBefore(b,host.firstChild);
  if(!host._ne){host._ne=new MutationObserver(()=>{const x=document.getElementById("rb3-eerst");if(x&&x.parentNode===host&&host.firstChild!==x)host.insertBefore(x,host.firstChild)});host._ne.observe(host,{childList:true})}
  const L=NE.items||[];
  b.innerHTML=`<h3>👉 Wat nu eerst</h3>`+(L.length?L.map((x,i)=>`<div class="rb3-ne ${i===0?"top":""}"><div><b>${e(x.titel)}</b><div class="meta">${e(x.waarom||"")}</div></div><button type="button" class="btn sm ${i===0?"prim":""}" data-ne="${i}">${e(x.knop)}</button></div>`).join("")+(NE.meer?`<div class="meta">+ ${NE.meer} meer hieronder</div>`:""):`<div class="meta">✅ Niets dringends. Lekker bezig.</div>`);
  b.querySelectorAll("[data-ne]").forEach(k=>k.onclick=async()=>{const x=L[+k.dataset.ne];
    if(x.soort==="proefrit")return terug(x.id);
    if(x.soort==="bel"){const t=((V3&&V3.terugbellen)||[]).find(y=>y.id===x.id)||{id:x.id,titel:x.titel};return belSheet(t)}
    if(x.soort==="aflever")return afleverSheet(x.id,x.titel);
    if(x.soort==="opfris")return opfrisSheet(x.id);
    if(typeof NAV!=="undefined"&&NAV.ga)NAV.ga("taken");else location.hash="#taken"});
}
async function vdBlok3(){vdEerst();
  if(typeof seg==="undefined"||seg!==20)return;try{V3=await R.api("/taken/robin/v3/vandaag")}catch(x){return}
  const host=document.getElementById("rb-vd");if(!host)return;let b=document.getElementById("rb3-vd");if(!b){b=document.createElement("div");b.id="rb3-vd";host.insertAdjacentElement("afterend",b)}
  const P=V3.proefritten||[],TB=V3.terugbellen||[];const tm=s=>String(s||"").slice(11,16),dg=s=>{const d=String(s||"").slice(0,10);const v=new Date().toISOString().slice(0,10);return d===v?"vandaag":d.slice(8,10)+"-"+d.slice(5,7)};
  b.className=P.length||TB.length?"vb rb":"";
  b.innerHTML=(P.length?`<h3>🔑 Proefrit loopt <span class="cnt">${P.length}</span></h3>`+P.map(p=>`<div class="rb-rit"><b>${e(p.auto)}</b> · ${e(p.klant||"")}<div class="meta">${tm(p.start)}–${tm(p.eind)}${p.te_laat?' · <b style="color:#991b1b">te laat terug</b>':""} · ${p.rijbewijs_gezien?"rijbewijs ✓":"geen rijbewijsfoto"}</div><button type="button" class="btn sm" data-terug="${e(p.id)}">✅ Terug</button></div>`).join(""):"")+
    (TB.length?`<h3>📞 Terugbellen <span class="cnt">${TB.length}</span></h3>`+TB.map(t=>`<div class="rb-rit"><b>${e(t.titel)}</b><div class="meta">🕒 ${dg(t.wanneer)} ${tm(t.wanneer)}${t.te_laat?' · <b style="color:#991b1b">te laat</b>':""}${t.vraag?" · "+e(t.vraag):""}</div><button type="button" class="btn sm" data-bel="${e(t.id)}">📞 Bellen / WhatsApp</button></div>`).join(""):"");
  if(P.length)b.querySelector("h3").insertAdjacentHTML("afterend",'<button type="button" class="btn sm ghost rb3-prlink" data-prlijst>🔑 Alle proefritten (ook afgerond) →</button>');
  b.querySelectorAll("[data-prlijst]").forEach(x=>x.onclick=naarProefritten);
  b.querySelectorAll("[data-terug]").forEach(x=>x.onclick=()=>terug(x.dataset.terug));
  b.querySelectorAll("[data-bel]").forEach(x=>x.onclick=()=>{const t=TB.find(y=>y.id===x.dataset.bel);belSheet(t)});
}
/* ---------- PROEFRIT_LIJST_V1 (t661u): alle proefritten terugvinden onder Klanten. Geen nummers of foto's. ---------- */
let PRL=null;
function naarProefritten(){if(window.NAV)NAV.ga("klanten");let n=0;const z=()=>{const el=document.getElementById("rb3-pr");if(el){el.scrollIntoView({block:"start"});return}if(++n<30)setTimeout(z,150)};setTimeout(z,150)}
async function prBlok(vers){
  if(typeof seg==="undefined"||seg!==26)return;const kl=document.querySelector("#cards .rb-kl");if(!kl)return;
  let b=document.getElementById("rb3-pr");if(!b){b=document.createElement("div");b.id="rb3-pr";const c1=kl.querySelector("article.card");if(c1)c1.insertAdjacentElement("afterend",b);else kl.prepend(b)}
  if(!PRL||vers){b.innerHTML='<h3>🔑 Proefritten</h3><div class="meta">Laden…</div>';try{PRL=await R.api("/taken/robin/v3/proefritten")}catch(x){b.innerHTML='<h3>🔑 Proefritten</h3><div class="meta">Niet te laden: '+e(x.message)+'</div>';return}}
  const tm=s=>String(s||"").slice(11,16),dg=s=>{const d=String(s||"").slice(0,10);return d?d.slice(8,10)+"-"+d.slice(5,7):"?"};
  const L=PRL.lopend||[],K=PRL.klaar||[];
  b.innerHTML=`<h3>🔑 Proefritten <span class="cnt">${L.length+K.length}</span></h3>
   ${L.length?`<h4>Loopt nu</h4>`+L.map(p=>`<div class="rb-rit"><b>${e(p.auto)}</b> · ${e(p.klant||"")}<div class="meta">${dg(p.start)} ${tm(p.start)}–${tm(p.eind)}${p.te_laat?' · <b style="color:#991b1b">te laat terug</b>':""} · ${p.rijbewijs_gezien?"rijbewijs ✓":"geen rijbewijsfoto"}</div><button type="button" class="btn sm" data-prterug="${e(p.id)}">✅ Terug</button></div>`).join(""):'<div class="meta">Er loopt nu geen proefrit.</div>'}
   <h4>Geschiedenis</h4>${K.length?`<ul class="rb3-wk rb3-prh">`+K.map(p=>`<li><b>${e(p.auto)}</b> · ${e(p.klant||"")}<div class="meta">${dg(p.start)} ${tm(p.start)}–${tm(p.terug)}${p.km_na!=null?" · km na rit "+e(String(p.km_na).replace(/\B(?=(\d{3})+(?!\d))/g,".")):""}${p.op_tijd===false?" · later terug dan gepland":""}</div></li>`).join("")+`</ul>`:'<div class="meta">Nog geen afgeronde proefritten.</div>'}
   <div class="meta">🔒 Telefoonnummers en rijbewijsfoto's staan niet op de site. Het rijbewijs wordt na 30 dagen gewist.</div>`;
  b.querySelectorAll("[data-prterug]").forEach(x=>x.onclick=async()=>{await terug(x.dataset.prterug);prBlok(true)});
}
const moK=new MutationObserver(()=>{if(typeof seg!=="undefined"&&seg===26&&!document.getElementById("rb3-pr")){clearTimeout(moK.t);moK.t=setTimeout(()=>prBlok(true),120)}});
const stK=()=>{const c=document.getElementById("cards");if(c)moK.observe(c,{childList:true,subtree:false})};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",stK);else stK();
/* ---------- CONCEPTEN_V2 (t661u): WhatsApp-concepten bewerken, op de server bewaard. Het systeem verstuurt nooit zelf. ---------- */
let CON2=null;
async function laadCon(){try{CON2=await R.api("/taken/robin/v3/concepten")}catch(x){CON2=null}return CON2}
function kopieer(t){try{navigator.clipboard.writeText(t).then(()=>R.toast2("Tekst gekopieerd"),()=>prompt("Kopieer:",t))}catch(x){prompt("Kopieer:",t)}}
let CVX={naam:"",auto:"",prijs:null};
function conRijen(kaart){
  const L=(CON2&&CON2.concepten)||[];const tel=R.telVanNaam(CVX.naam),n=waNr(tel);
  const link=tx=>n?`https://wa.me/${n}?text=${encodeURIComponent(tx)}`:R.wa(tx);
  const box=kaart.querySelector("#rb3-conrijen");if(!box)return;
  box.innerHTML=(CVX.naam?`<div class="meta">${tel?"📱 WhatsApp opent bij "+e(tel)+" (nummer staat op deze telefoon).":"Geen nummer van "+e(CVX.naam)+" op deze telefoon: WhatsApp opent zonder nummer."}</div>`:"")+
   L.map(c=>{const tx=R.vul(c.tekst,CVX);return `<div class="rb3-con"><div><b>${e(c.label)}</b>${c.aangepast?' <span class="rb3-l oranje">eigen tekst</span>':""}${c.eigen?' <span class="rb3-l">eigen concept</span>':""}<div class="meta rb3-ctekst">${e(tx)}</div></div>
     <div class="rb3-rij"><a class="btn sm" href="${e(link(tx))}" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="btn sm ghost" data-ckop="${e(c.key)}">Kopieer</button><button type="button" class="btn sm ghost" data-cbew="${e(c.key)}">✏️ Bewerk</button></div></div>`}).join("");
  box.querySelectorAll("[data-ckop]").forEach(b=>b.onclick=()=>{const c=L.find(x=>x.key===b.dataset.ckop);if(c)kopieer(R.vul(c.tekst,CVX))});
  box.querySelectorAll("[data-cbew]").forEach(b=>b.onclick=()=>conBewerk(L.find(x=>x.key===b.dataset.cbew)));
}
async function conBlok(vers){
  if(typeof seg==="undefined"||seg!==26)return;const kl=document.querySelector("#cards .rb-kl");if(!kl)return;
  const kaart=kl.querySelector("article.card");if(!kaart)return;
  if(!CON2||vers)await laadCon();if(!CON2){return}
  if(seg!==26)return;await zorgVR();
  const A=((typeof VR!=="undefined"&&VR&&VR.autos)||[]);
  kaart.setAttribute("data-con2","1");
  kaart.innerHTML=`<div class="body"><h2 class="t">💬 WhatsApp-concepten</h2><div class="meta">Kies hieronder voor wie en welke auto: de tekst vult zich vanzelf in. ✏️ past een tekst blijvend aan. Jij verstuurt zelf.</div>
   <div class="rb3-form rb3-voor"><label>Voor wie?</label><input data-cv="naam" list="rb3-namen" autocomplete="off" placeholder="Naam klant (mag leeg)" value="${e(CVX.naam)}"><datalist id="rb3-namen">${R.bekendeNamen().map(x=>`<option value="${e(x)}">`).join("")}</datalist>
   <label>Welke auto?</label><select data-cv="auto"><option value="">Geen / algemeen</option>${A.map(a=>`<option value="${e(a.id)}" ${CVX.auto_id===String(a.id)?"selected":""}>${e(String(a.titel||"").split("|")[0].trim().slice(0,60))}</option>`).join("")}</select></div>
   <div id="rb3-conrijen"></div>
   <div class="rb3-rij"><button type="button" class="btn sm" data-cnieuw>➕ Eigen concept</button></div></div>`;
  const ni=kaart.querySelector("[data-cv=naam]"),as=kaart.querySelector("[data-cv=auto]");
  const zet=()=>{CVX.naam=ni.value.trim();const a=A.find(x=>String(x.id)===as.value);CVX.auto_id=as.value;CVX.auto=a?a.titel:"";CVX.prijs=a?a.prijs:null;conRijen(kaart)};
  ni.oninput=zet;as.onchange=zet;zet();
  kaart.querySelector("[data-cnieuw]").onclick=()=>conBewerk(null);
}
async function conPost(body){try{const r=await R.api("/taken/robin/v3/concepten","POST",body);CON2=r;try{R.laadV&&R.laadV()}catch(x){}return true}catch(x){R.toast2(x.message);return false}}
async function conBewerk(c){
  const nieuw=!c;
  await R.sheet(`<div class="rb3-rij"><h3>${nieuw?"➕ Eigen concept":"✏️ "+e(c.label)}</h3><button type="button" class="btn sm ghost" data-x>Annuleren</button></div>
    <div class="rb3-form">${nieuw||c.eigen?`<label>Naam</label><input data-v="label" maxlength="40" value="${nieuw?"":e(c.label)}" placeholder="bijv. Inruil bespreken">`:""}
    <label>Tekst</label><textarea data-v="tekst" rows="6" maxlength="1000">${nieuw?"":e(c.tekst)}</textarea>
    <div class="rb3-chips"><span class="meta">Invoegen:</span><button type="button" class="btn sm ghost" data-ins="{naam}">{naam}</button><button type="button" class="btn sm ghost" data-ins="{auto}">{auto}</button><button type="button" class="btn sm ghost" data-ins="{prijs}">{prijs}</button></div>
    <div class="meta">{naam}, {auto} en {prijs} worden ingevuld als je ze kiest. Onbekend? Dan laten we het netjes weg.</div></div>
    <div class="meta" id="rb3-cteller"></div>
    <div class="rb3-rij"><button type="button" class="btn prim" id="rb3-cok">Opslaan</button>
    ${!nieuw&&!c.eigen&&c.aangepast?'<button type="button" class="btn" id="rb3-cstd">↩︎ Standaardtekst terugzetten</button>':""}
    ${!nieuw&&c.eigen?'<button type="button" class="btn" id="rb3-cdel">🗑 Verwijderen</button>':""}</div>
    ${!nieuw&&!c.eigen?`<div class="meta">Standaardtekst: ${e(c.standaard_tekst||"")}</div>`:""}
    <div class="meta">Er wordt niets verstuurd. De tekst wordt alleen bewaard.</div>`,(ov,af)=>{
    const ta=ov.querySelector("[data-v=tekst]"),tl=ov.querySelector("#rb3-cteller");const tel=()=>tl.textContent=ta.value.length+" / 1000 tekens";ta.oninput=tel;tel();
    ov.querySelectorAll("[data-ins]").forEach(b=>b.onclick=()=>{const s=ta.selectionStart??ta.value.length,x=ta.selectionEnd??s;ta.value=ta.value.slice(0,s)+b.dataset.ins+ta.value.slice(x);ta.focus();ta.selectionStart=ta.selectionEnd=s+b.dataset.ins.length;tel()});
    ov.querySelector("#rb3-cok").onclick=async()=>{const t=ta.value.trim(),lab=ov.querySelector("[data-v=label]");
      if(!t){R.toast2("De tekst mag niet leeg zijn");return}
      if((nieuw||c.eigen)&&!(lab&&lab.value.trim())){R.toast2("Geef het concept een naam");return}
      const ok=await conPost(nieuw?{nieuw:{label:lab.value.trim(),tekst:t}}:{key:c.key,tekst:t,label:lab?lab.value.trim():undefined});
      if(ok){af(null);R.toast2("Bewaard");conBlok()}};
    const sd=ov.querySelector("#rb3-cstd");if(sd)sd.onclick=async()=>{if(!confirm("Standaardtekst terugzetten? Je eigen tekst verdwijnt."))return;if(await conPost({key:c.key,standaard:true})){af(null);R.toast2("Standaardtekst terug");conBlok()}};
    const dl=ov.querySelector("#rb3-cdel");if(dl)dl.onclick=async()=>{if(!confirm("Dit eigen concept verwijderen?"))return;if(await conPost({key:c.key,verwijder:true})){af(null);R.toast2("Verwijderd");conBlok()}};
  });
}
const moC=new MutationObserver(()=>{if(typeof seg!=="undefined"&&seg===26){const k=document.querySelector("#cards .rb-kl article.card");if(k&&!k.hasAttribute("data-con2")){clearTimeout(moC.t);moC.t=setTimeout(()=>conBlok(),60)}}});
const stC=()=>{const c=document.getElementById("cards");if(c)moC.observe(c,{childList:true,subtree:true})};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",stC);else stC();
/* ---------- WEEK_V1 (feature 3): weekoverzicht in de app. Onbekend is niet 0. ---------- */
async function weekSheet(){
  let w;try{w=await R.api("/taken/robin/v3/week")}catch(x){R.toast2(x.message);return}
  const d=s=>s?String(s).slice(8,10)+"-"+String(s).slice(5,7):"?";
  const lijst=(L,f,leeg)=>L&&L.length?`<ul class="rb3-wk">${L.map(f).join("")}</ul>`:`<div class="meta">${leeg}</div>`;
  const sg=(w.voorraad||{}).signalen||{};
  await R.sheet(`<div class="rb3-rij"><h3>📊 Jouw week</h3><button type="button" class="btn sm ghost" data-x>Sluiten</button></div>
    <div class="meta">${d(w.van)} t/m ${d(w.tot)} · gemeten sinds ${e(w.gemeten_sinds)}</div>
    <div class="rb3-kpi"><div><b>${w.verkocht_knop.length}</b><span>verkocht (jouw knop)</span></div><div><b>${w.van_site_af.length}</b><span>van de site af</span></div><div><b>${w.binnen?w.binnen.length:"onbekend"}</b><span>nieuw binnen</span></div>
      <div><b>onbekend</b><span>omzet</span></div><div><b>onbekend</b><span>marge</span></div><div><b>${w.proefritten}</b><span>proefritten</span></div></div>
    <div class="meta">${e(w.omzet_uitleg)}</div>
    <h4>✅ Verkocht</h4>${lijst(w.verkocht_knop,x=>`<li>${e(x.titel)} <span class="meta">${d(x.op)}</span></li>`,"Niets via de knop ‘Verkocht’.")}
    <h4>🚪 Van de site af</h4>${lijst(w.van_site_af,x=>`<li>${e(x.titel)} <span class="meta">${d(x.op)} · ${x.dagen!=null?e(x.dagen)+" dagen gestaan":"statijd onbekend"}</span></li>`,"Niets gemeten.")}
    <h4>⏳ Lang staand (${w.voorraad.lang_n})</h4>${lijst(w.voorraad.lang_staand,x=>`<li>${e(x.titel)} <span class="meta">${e(x.dagen)} dagen</span></li>`,"Geen auto’s boven de drempel (geteld vanaf onze eerste meting).")}
    <div class="meta">Signalen voorraad: ${sg.foto||0}× geen foto’s · ${sg.prijs||0}× geen prijs · ${sg.km||0}× geen km</div>
    <h4>📌 Taken die blijven liggen (${w.taken_liggen_n})</h4>${lijst(w.taken_liggen,x=>`<li>${e(x.titel)} <span class="meta">${x.dagen_open!=null?e(x.dagen_open)+" dagen open":""}${x.voor?" · "+e(x.voor):""}</span></li>`,"Geen taken langer dan een week open.")}
    <div class="meta">📞 Nog terugbellen: ${w.terugbellen_open}</div>
    ${(w.opmerkingen||[]).map(x=>`<div class="rb3-waarsch">${e(x)}</div>`).join("")}`,()=>{});
}
/* ---------- AFLEVER_V1 (feature 5): afleverrapport + alles voor de overdracht in één scherm ---------- */
const AFLPRE=/^\W*Afleveren\b/i;
async function afleverSheet(id,titel){
  let st;try{st=await R.api("/taken/robin/v3/aflever/"+encodeURIComponent(id))}catch(x){R.toast2(x.message);return}
  if(!CON2)await laadCon();const F=st.fotos||{};const klaar=R.vul((CON2&&CON2.samen&&CON2.samen.auto_klaar)||"Hoi {naam}, goed nieuws: {auto} staat klaar. Wanneer kom je hem ophalen? Groet, Robin – BRNS Exclusief",{auto:String(titel).replace(AFLPRE,"").replace(/^[:\s]+/,"")});
  await R.sheet(`<div class="rb3-rij"><h3>📋 Afleverrapport</h3><button type="button" class="btn sm ghost" data-x>Sluiten</button></div><div class="meta">${e(titel)}</div>
    <div class="rb3-form"><label>Km-stand bij aflevering</label><input data-v="km" inputmode="numeric" value="${st.km!=null?e(st.km):""}" placeholder="bijv. 80123">
    <label>Schade of bijzonderheden</label><textarea data-v="schade" rows="2" placeholder="bijv. geen schade, of: kras achterbumper">${e(st.schade||"")}</textarea></div>
    <div class="rb3-rij">${[["km","Km-teller"],["schade","Schade/rondom"],["overdracht","Overdracht"]].map(([k,l])=>`<button type="button" class="btn sm ghost" data-fs="${k}">📷 ${l} (<span>${F[k]||0}</span>)</button>`).join("")}</div>
    <div class="meta" id="rb3-afst">${st.compleet?"✅ Compleet":"Nog nodig: "+e((st.ontbreekt||[]).join(", "))}</div>
    <div class="rb3-rij"><button type="button" class="btn prim" id="rb3-aok">Opslaan</button><button type="button" class="btn" id="rb3-tn">🧾 Op naam zetten (RDW)</button><button type="button" class="btn ghost" id="rb3-sc">⚠️ Schadeclaim</button><a class="btn ghost" href="${e(R.wa(klaar))}" target="_blank" rel="noopener">💬 "Auto staat klaar"</a></div>
    <div class="meta">Foto's en km-stand komen bij de taak en in de tijdlijn van de auto. Medewerkers kunnen dit ook invullen in de Team-app.</div>`,(ov,af)=>{
    const sst=ov.querySelector("#rb3-afst");const zet=r=>{sst.textContent=r.compleet?"✅ Compleet":"Nog nodig: "+(r.ontbreekt||[]).join(", ")};
    ov.querySelectorAll("[data-fs]").forEach(b=>b.onclick=async()=>{const f=await R.kiesFoto();if(!f)return;sst.textContent="Foto opslaan…";
      try{const r=await R.api("/taken/robin/v3/aflever/"+encodeURIComponent(id),"POST",{foto:f,foto_soort:b.dataset.fs});b.querySelector("span").textContent=r.fotos[b.dataset.fs];zet(r)}catch(x){sst.textContent=x.message}});
    ov.querySelector("#rb3-aok").onclick=async()=>{const km=ov.querySelector("[data-v=km]").value.trim(),schade=ov.querySelector("[data-v=schade]").value.trim();
      try{const r=await R.api("/taken/robin/v3/aflever/"+encodeURIComponent(id),"POST",{km,schade});zet(r);R.toast2(r.compleet?"Afleverrapport compleet":"Bewaard")}catch(x){R.toast2(x.message)}};
    ov.querySelector("#rb3-sc").onclick=async()=>{try{const r=await R.api("/taken/robin/v3/schade/"+encodeURIComponent(id));af(null);toonKlaarzet(r,{soort:"schade",velden:Object.fromEntries(r.velden.map(x=>[x.code,x.waarde||""]))})}catch(x){R.toast2(x.message)}};
    ov.querySelector("#rb3-tn").onclick=()=>{const km=ov.querySelector("[data-v=km]").value.trim();af(null);
      const nm=String(titel).replace(AFLPRE,"").replace(/^[:\s]+/,"");const p=nm.split(" ");
      R.api("/taken/robin/v3/klaarzet","POST",{soort:"tenaam",velden:{merk:p[0]||"",model:p.slice(1).join(" "),km}}).then(r=>toonKlaarzet(r,{soort:"tenaam",velden:{merk:p[0]||"",model:p.slice(1).join(" "),km}})).catch(x=>R.toast2(x.message))}});
}
function aflTaken(){document.querySelectorAll("article.tk-card[data-id]").forEach(k=>{const h=k.querySelector("h3");if(!h)return;const t=h.childNodes[0]?h.childNodes[0].textContent.trim():h.textContent.trim();
  if(!AFLPRE.test(t)||k.querySelector(".rb3-afl"))return;const b=document.createElement("button");b.type="button";b.className="btn sm rb3-afl";b.textContent="📋 Afleverrapport";b.onclick=()=>afleverSheet(k.dataset.id,t);h.insertAdjacentElement("afterend",b)})}
const mo3=new MutationObserver(()=>{clearTimeout(mo3.t);mo3.t=setTimeout(aflTaken,160)});
const st3=()=>{mo3.observe(document.body,{childList:true,subtree:true});aflTaken()};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",st3);else st3();
window.RB3.actie=actie3;
const _r=render;
render=function(){const o=_r.apply(this,arguments);if(typeof seg!=="undefined"&&seg===20){setTimeout(vdBlok3,500)}if(typeof seg!=="undefined"&&seg===VRS){setTimeout(deco,80);setTimeout(deco,900);laadSig().then(deco);laadPV().then(deco)}return o};
const mo=new MutationObserver(()=>{if(typeof seg!=="undefined"&&seg===VRS){clearTimeout(mo.t);mo.t=setTimeout(deco,120)}});
const st=()=>{const c=document.getElementById("cards");if(c)mo.observe(c,{childList:true})};if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",st);else st();
})();
/* TEAM_LINK_V1 (t665u): 👤 Medewerker toevoegen — naam invullen, één link maken, zelf versturen via WhatsApp.
   De site verstuurt niets. Lijst zonder chat-id, nummer of link; een nieuwe link staat alleen in dit venster. */
(function(){
"use strict";
if(!window.RB)return;
const R=window.RB,e=R.e;
async function kopieer(t,knop){let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(x){try{const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();ok=document.execCommand("copy");a.remove()}catch(y){}}
  if(knop){const o=knop.textContent;knop.textContent=ok?"✅ Gekopieerd":"Kopiëren lukte niet";setTimeout(()=>knop.textContent=o,1800)}}
const ST={gekoppeld:["✅","ok"],app:["📱","ok"],wacht:["⏳","wacht"],verlopen:["⌛","uit"],nieuw:["•","uit"]};
function linkBlok(r){return `<div class="tl-res" id="tl-res"><b>✅ Link voor ${e(r.naam)} is klaar</b>
  <div class="meta">Eén keer te gebruiken · geldig tot ${e(r.geldig_tot_tekst)}</div>
  <label class="rb-f">Bericht voor ${e(r.naam.split(" ")[0])}<textarea id="tl-tekst" rows="7">${e(r.whatsapp_tekst)}</textarea></label>
  <div class="tl-kn"><a class="btn prim tl-wa" id="tl-wa" href="${e(r.whatsapp_url)}" target="_blank" rel="noopener">💬 WhatsApp</a><button type="button" class="btn" id="tl-kop">📋 Kopieer</button></div>
  <div class="meta">Er is niets verstuurd. ${e(r.naam.split(" ")[0])} tikt op de link, daarna in Telegram op <b>Start</b>, en is meteen gekoppeld.</div>
  <details class="tl-zonder"><summary>Geen Telegram?</summary><div class="meta">Maak een persoonlijke link naar de Team-app. Die toont nooit prijzen of bedragen. Werkt tot je een nieuwe link maakt of ${e(r.naam.split(" ")[0])} verwijdert.</div>
  <button type="button" class="btn" data-app="${e(r.id)}">📱 Link zonder Telegram</button><div id="tl-app"></div></details></div>`}
function appBlok(r){return `<label class="rb-f">Bericht met Team-app-link<textarea id="tl-atekst" rows="7">${e(r.whatsapp_tekst)}</textarea></label>
  <div class="tl-kn"><a class="btn prim tl-wa" href="${e(r.whatsapp_url)}" target="_blank" rel="noopener">💬 WhatsApp</a><button type="button" class="btn" id="tl-akop">📋 Kopieer</button></div>
  <div class="meta">Persoonlijk: deel hem alleen met deze medewerker.</div>`}
function rijen(L){if(!L.length)return `<div class="meta">Nog geen medewerkers.</div>`;
  return L.map(u=>{const s=ST[u.status]||ST.nieuw;return `<div class="tl-rij" data-id="${e(u.id)}"><div class="tl-naam"><b>${e(u.naam)}</b><div class="meta tl-st ${s[1]}">${s[0]} ${e(u.status_tekst)}</div></div>
    <div class="tl-kn"><button type="button" class="btn sm" data-nl="${e(u.id)}">🔗 Nieuwe link</button><button type="button" class="btn sm ghost tl-weg" data-weg="${e(u.id)}">🗑️ Verwijderen</button></div></div>`}).join("")}
async function open_(){
  let L=[];try{L=(await R.api("/taken/team")).team||[]}catch(x){R.toast2(x.message);return}
  await R.sheet(`<div class="rb3-rij"><h3>👤 Medewerker toevoegen</h3><button type="button" class="btn sm ghost" data-x>Sluiten</button></div>
    <div class="meta">Vul de naam in. Je krijgt één link om zelf via WhatsApp te sturen.</div>
    <label class="rb-f">Naam<input id="tl-naam" autocomplete="off" placeholder="bijv. Kees" maxlength="40"></label>
    <button type="button" class="btn prim tl-groot" id="tl-maak">Maak link</button>
    <div id="tl-uit"></div>
    <h3 class="tl-kop">Medewerkers</h3><div id="tl-lijst">${rijen(L)}</div>`,(ov,af)=>{
    const uit=ov.querySelector("#tl-uit");
    const herlaad=async()=>{try{L=(await R.api("/taken/team")).team||[];ov.querySelector("#tl-lijst").innerHTML=rijen(L);bindLijst()}catch(x){}};
    const toon=r=>{uit.innerHTML=linkBlok(r);
      const tx=uit.querySelector("#tl-tekst"),wa=uit.querySelector("#tl-wa");tx.oninput=()=>wa.href=R.wa(tx.value);
      uit.querySelector("#tl-kop").onclick=ev=>kopieer(tx.value,ev.currentTarget);
      uit.querySelector("[data-app]").onclick=async ev=>{const b=ev.currentTarget;b.disabled=true;
        try{const a=await R.api("/taken/team/"+encodeURIComponent(b.dataset.app)+"/app","POST",{});const d=uit.querySelector("#tl-app");d.innerHTML=appBlok(a);
          const at=d.querySelector("#tl-atekst"),aw=d.querySelector(".tl-wa");at.oninput=()=>aw.href=R.wa(at.value);d.querySelector("#tl-akop").onclick=e2=>kopieer(at.value,e2.currentTarget);b.remove();herlaad()}
        catch(x){b.disabled=false;R.toast2(x.message)}};
      uit.scrollIntoView({block:"start",behavior:"smooth"});herlaad()};
    const maak=async()=>{const n=ov.querySelector("#tl-naam").value.trim();if(n.length<2){R.toast2("Vul eerst de naam in.");ov.querySelector("#tl-naam").focus();return}
      const b=ov.querySelector("#tl-maak");b.disabled=true;b.textContent="Link maken…";
      try{toon(await R.api("/taken/team","POST",{naam:n}));ov.querySelector("#tl-naam").value=""}catch(x){R.toast2(x.message)}finally{b.disabled=false;b.textContent="Maak link"}};
    ov.querySelector("#tl-maak").onclick=maak;ov.querySelector("#tl-naam").onkeydown=ev=>{if(ev.key==="Enter")maak()};
    function bindLijst(){
      ov.querySelectorAll("[data-nl]").forEach(b=>b.onclick=async()=>{const u=L.find(x=>x.id===b.dataset.nl)||{};
        if(u.status==="gekoppeld"||u.status==="app"){if(!confirm("Nieuwe link voor "+u.naam+"?\n\nDe oude link en de oude Team-app-link werken dan niet meer (handig bij een nieuwe of kwijtgeraakte telefoon)."))return}
        try{toon(await R.api("/taken/team/"+encodeURIComponent(b.dataset.nl)+"/link","POST",{}))}catch(x){R.toast2(x.message)}});
      ov.querySelectorAll("[data-weg]").forEach(b=>b.onclick=async()=>{const u=L.find(x=>x.id===b.dataset.weg)||{};
        if(!confirm(u.naam+" verwijderen?\n\n"+u.naam+" kan dan niet meer in de Team-app en krijgt geen taken meer via Telegram."))return;
        try{let r=await R.api("/taken/team/"+encodeURIComponent(b.dataset.weg)+"/weg","POST",{});
          if(r.wacht_bevestiging){if(!confirm(u.naam+" heeft nog "+r.open_taken+" open taak/taken. Die worden dan voor niemand.\n\nToch verwijderen?"))return;
            r=await R.api("/taken/team/"+encodeURIComponent(b.dataset.weg)+"/weg","POST",{bevestigd:true})}
          R.toast2(u.naam+" is verwijderd.");uit.innerHTML="";herlaad()}catch(x){R.toast2(x.message)}})}
    bindLijst();
  });
}
window.RB_TEAM={open:open_};
})();
