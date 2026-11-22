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
const CONCEPTEN_STD={terugbellen:"Hoi, je had gebeld over een auto. Wanneer komt het je uit dat ik even terugbel? Groet, Robin – BRNS Exclusief",
  afspraak:"Hoi, hierbij de bevestiging van onze afspraak bij BRNS Exclusief, De Giessen 1 in Dronten. Tot dan! Groet, Robin",
  auto_klaar:"Hoi, goed nieuws: de auto staat klaar. Wanneer kom je hem ophalen? Groet, Robin – BRNS Exclusief",
  opvolging:"Hoi, hoe bevalt de auto? Als er iets is hoor ik het graag. Groet, Robin – BRNS Exclusief"};
const CLAB={terugbellen:"Terugbellen",afspraak:"Afspraak bevestigen",auto_klaar:"Auto staat klaar",opvolging:"Opvolging na verkoop"};
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
  if(host.firstChild!==b)host.insertBefore(b,host.firstChild);
  const r=(V&&V.ritten)||[];
  const vr=(V&&V.voorraad)||{};const w=vr.wijzigingen||{};
  b.innerHTML=`<h3>Snelle knoppen</h3><div class="rb-snel">
    <button type="button" data-rb="taak">➕<span>Taak</span></button><button type="button" data-rb="binnen">🚗<span>Auto binnen</span></button>
    <button type="button" data-rb="verkocht">✅<span>Verkocht</span></button><button type="button" data-rb="rit">🚚<span>Rit plannen</span></button>
    <button type="button" data-rb="bellen">📞<span>Terugbellen</span></button><button type="button" data-rb="whatsapp">💬<span>WhatsApp</span></button>
    <button type="button" data-rb="taxatie">🧮<span>Taxatie</span></button><button type="button" data-rb="voorraad">📦<span>Voorraad</span></button></div>
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
    <div class="row">${b.nummer?`<a class="btn sm" href="tel:${e(b.nummer)}">📞 Bel ${e(b.nummer)}</a>`:""}<a class="btn sm" href="${e(wa(/^Opvolging/i.test(t.titel)?C.opvolging:C.terugbellen))}" target="_blank" rel="noopener">💬 WhatsApp-concept</a>${t.adres?routeKn(t.adres):""}</div></div></article>`};
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
   ${L.slice(0,60).map(k=>`<article class="card"><div class="body"><b>${e(k.naam)}</b> <span class="meta">· ${e(k.bron)}${k.sinds?" · sinds "+e(k.sinds):""}</span>
     <div class="meta">${k.wens?"Zoekt: "+e(k.wens):""}${k.kenteken?" · 🔖 "+e(k.kenteken):""}</div>
     ${(k.autos||[]).map(a=>`<div class="meta">🚗 ${e(a.kenteken)} ${e(a.omschr||"")}${a.apk_tot?" · APK tot "+e(a.apk_tot):""}</div>`).join("")}
     ${(k.notities||[]).slice(-2).map(n=>`<div class="meta">• ${e(n)}</div>`).join("")}
     <div class="row">${DOS.prive?telKn(k,C.terugbellen):(k.heeft_tel?'<span class="meta">📞 nummer bekend (log in om te bellen)</span>':"")}
     <button type="button" class="btn sm ghost" data-tl="klant/${e(k.id)}">🕘 Tijdlijn</button><button type="button" class="btn sm ghost" data-not="${e(k.id)}">✏️ Notitie</button><button type="button" class="btn sm ghost" data-rdw="${e(k.id)}">🔖 Kenteken (RDW)</button></div></div></article>`).join("")||'<div class="meta">Nog geen klanten. Voeg er een toe, of zeg in Telegram: “klant Jan 06… zoekt een Golf”.</div>'}`;
  const qi=document.getElementById("rb-dosq");if(qi)qi.oninput=()=>{DOSQ=qi.value;const p=qi.selectionStart;dosBlok();const n=document.getElementById("rb-dosq");if(n){n.focus();try{n.setSelectionRange(p,p)}catch(x){}}};
  el.querySelectorAll("[data-tl]").forEach(b=>b.onclick=()=>tijdlijn(b.dataset.tl));
  el.querySelectorAll("[data-rdw]").forEach(b=>b.onclick=async()=>{const r=await kentekenRdw(true,b.dataset.rdw);if(r&&r.ok){await laadDos();dosBlok()}});
  el.querySelectorAll("[data-not]").forEach(b=>b.onclick=async()=>{const t=prompt("Notitie bij deze klant");if(!t)return;try{await api("/taken/robin/klant/"+b.dataset.not+"/notitie","POST",{tekst:t});await laadDos();dosBlok();toast2("Notitie opgeslagen (ook in Telegram)")}catch(x){toast2(x.message)}});
  el.querySelectorAll("[data-dos]").forEach(b=>b.onclick=async()=>{
    if(b.dataset.dos==="kent"){const k=prompt("Kenteken, bijv. GB-XL-12");if(k)tijdlijn("kenteken/"+k.replace(/[^A-Za-z0-9]/g,""));return}
    const naam=prompt("Naam klant");if(!naam||!naam.trim())return;const tel=prompt("Telefoon (optioneel)","");if(tel===null)return;const wens=prompt("Zoekt / wil (optioneel)","");if(wens===null)return;const kenteken=prompt("Kenteken (optioneel)","");if(kenteken===null)return; /* AZ_FIX9: Annuleren = niets opslaan */
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
  else{const k=prompt("Kenteken (leeg = overslaan)","");if(!k)return null;body={kenteken:k}}
  if(klant_id)body.klant_id=klant_id;
  try{const r=await api("/taken/robin/kenteken","POST",body);
    if(r.ok)toast2("RDW: "+[r.merk,r.model].filter(Boolean).join(" ")+" · APK tot "+(r.apk_tot||"onbekend")+" · eigenaren: onbekend (niet in RDW open data)");
    else toast2(r.reden||"Niet gevonden");return r}catch(x){toast2(x.message);return null}}
window.ROBIN_V2.kentekenRdw=kentekenRdw;
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
      const rd=await kentekenRdw(true);if(rd&&rd.ok){kenteken=rd.kenteken;voorstel=[rd.merk,rd.model].filter(Boolean).join(" ")}
      else if(rd&&rd.kenteken)kenteken=rd.kenteken; /* AZ_FIX7: getypt kenteken bewaren, ook als de RDW niet antwoordt */
      const auto=prompt("Welke auto is binnen?"+(rd&&rd.ok?"\n(RDW: "+voorstel+", APK tot "+(rd.apk_tot||"onbekend")+")":(rd&&!rd.ok&&rd.kenteken?"\n(Kenteken "+rd.kenteken+" bewaard. "+(rd.reden||"RDW gaf geen gegevens.")+")":"")),voorstel);if(!auto)return;if(!kenteken)kenteken=prompt("Kenteken (optioneel)","")||"";const voor=prompt("Voor welke medewerker? (leeg = niet toegewezen)","")||"";
      const r=await api("/taken/robin/auto-binnen","POST",{auto,kenteken,voor});toast2(((r.resultaat||[]).length)+" taken klaargezet: klaarmaken, foto's, advertentieconcept, verkoopkaart");return}
    if(a==="verkocht"){let A=((typeof VR!=="undefined"&&VR&&VR.autos)||[]).slice(0,60);if(!A.length){try{A=((await api("/taken/robin/voorraad")).autos||[]).slice(0,60)}catch(x){}}
      let keuze=null;if(A.length){const n=prompt("Welke auto is verkocht? Typ het nummer:\n"+A.map((x,i)=>(i+1)+". "+String(x.titel||"").split("|")[0]).join("\n"));if(!n)return;keuze=A[(+n)-1];if(!keuze){toast2("Onbekend nummer");return}}
      else{const t=prompt("Welke auto is verkocht? (titel zoals op de site)");if(!t)return;keuze={titel:t}}
      if(!confirm(String(keuze.titel||"").split("|")[0]+" als VERKOCHT markeren? Er wordt niets naar de klant gestuurd."))return;
      const adres=prompt("Afleveradres (optioneel, voor de rit en route)","")||"";const tijdslot=adres?(prompt("Tijdslot (optioneel), bijv. za 10:00-11:00","")||""):"";
      const r=await api("/taken/robin/auto-verkocht","POST",{url:keuze.url,auto:keuze.titel,adres,tijdslot});
      toast2("Verkocht: "+r.resultaat.auto+". Afleveren, papierwerk en opvolging staan klaar.");try{VR=null}catch(x){}if(typeof render==="function")render();return}
    if(a==="rit"){const soort=confirm("Ophalen? (OK = ophalen, Annuleren = afleveren)")?"ophalen":"afleveren";const auto=prompt("Welke auto?");if(!auto)return;const adres=prompt("Adres, bijv. Kampweg 27, Swifterbant");if(!adres)return;
      const tijdslot=prompt("Tijdslot, bijv. 15:30-16:30","")||"";const voor=prompt("Voor welke medewerker?","")||"";
      await api("/taken/robin/rit","POST",{auto,adres,soort,tijdslot,voor});await laadV();vdBlok();toast2("Rit klaargezet met route en foto-checklist");return}
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
})();
