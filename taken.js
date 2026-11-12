/* Taken-tab (seg 19): volwaardige werkomgeving. Site blijft openbaar zonder login.
   Zakelijke nummers mogen zichtbaar zijn; privénummers komen niet mee uit de API. */
(function(){
const TAKEN_SEG=19, VD=20;
const API=(typeof KL!=="undefined"&&KL.instellingen_api)||"https://2-31-144-18.sslip.io/api/inst";
const OPEN=((typeof KL!=="undefined"&&KL.slug)||"brns")==="brns"&&location.hostname==="rutgerroenhorst.github.io";
const tok=()=>localStorage["inst_token_"+((typeof KL!=="undefined"&&KL.slug)||"brns")]||"";
function hdr(){const h={"Content-Type":"application/json"};if(tok())h.Authorization="Bearer "+tok();else if(OPEN||true)h["X-Klant"]="brns";return h}
async function api(p,method,body){
  const r=await fetch(API+p,{method:method||"GET",headers:hdr(),body:body?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw Object.assign(Error(j.fout||r.statusText||"Fout"),{j});
  return j;
}
let TAKEN=null, FILT="open", MED="", AUTO="", klaarId=null;

function takenTabs(){
  const t=document.querySelector("#tabs");if(!t)return;
  let b=t.querySelector(`[data-i="${TAKEN_SEG}"]`);
  if(!b){
    const sl=t.scrollLeft;
    const html=`<button class="${seg===TAKEN_SEG?"on":""}" data-i="${TAKEN_SEG}">Taken</button>`;
    const vd=t.querySelector(`[data-i="${VD}"]`);
    if(vd)vd.insertAdjacentHTML("afterend",html);
    else t.insertAdjacentHTML("afterbegin",html);
    t.scrollLeft=sl;
  }
  if(seg===TAKEN_SEG){
    t.querySelectorAll("button").forEach(x=>x.classList.toggle("on",+x.dataset.i===seg));
  }
  if(typeof tabZichtbaar==="function") tabZichtbaar();
}

const _renderTaken=typeof render==="function"?render:function(){};
render=function(){
  if(seg!==TAKEN_SEG){_renderTaken();takenTabs();takenInstel();return}
  // Eerst de gewone tabbalk opbouwen (zelfde patroon als tab Vandaag), anders blijft bij #taken alleen Taken over.
  const was=seg;seg=8;
  try{_renderTaken()}finally{seg=was}
  const f=document.querySelector(".filters"),br=document.querySelector(".bronnen");
  if(f)f.style.display="none";if(br)br.style.display="none";
  const sb=document.getElementById("sbox");if(sb)sb.remove();
  takenTabs();takenRender();
};
const _startTaken=typeof startSeg==="function"?startSeg:function(){};
if(typeof startSeg==="function"){
  startSeg=function(){const h=location.hash||"";_startTaken();if(h==="#taken")seg=TAKEN_SEG};
}

function dag(iso){if(!iso)return "";const d=String(iso).slice(0,10).split("-");return d.length===3?d[2]+"-"+d[1]:iso}
function isTeLaat(t){const d=(t.deadline||"").slice(0,10);if(!d)return false;const v=new Date();const vandaag=v.toLocaleDateString("sv-SE",{timeZone:"Europe/Amsterdam"});return d<vandaag}

function filterItems(data){
  const vragen=data.vragen||[];
  if(FILT==="wacht_op_robin")return {taken:[],vragen:vragen.filter(v=>v.status==="open")};
  let L=(data.taken||[]).filter(t=>t.status==="open"||t.status==="bezig");
  const v=new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Amsterdam"});
  if(FILT==="vandaag")L=L.filter(t=>(t.deadline||"").slice(0,10)===v);
  if(FILT==="te_laat")L=L.filter(isTeLaat);
  if(FILT==="klaar")L=(data.taken||[]).filter(t=>t.status==="klaar");
  if(MED)L=L.filter(t=>(t.voor||"")===MED);
  if(AUTO)L=L.filter(t=>(t.auto||"")===AUTO);
  return {taken:L,vragen:FILT==="wacht_op_robin"?vragen.filter(v=>v.status==="open"):[]};
}

function kaart(t){
  const late=isTeLaat(t)?" tk-late":"";
  const meta=[t.auto?`Auto: ${esc(t.auto)}`:"",t.voor?`Voor: ${esc(t.voor)}`:"",t.deadline?`Uiterlijk ${esc(dag(t.deadline))}`:"",t.plaats?esc(t.plaats):""].filter(Boolean).join(" · ");
  let act="",extra="";
  const b=t.bedrijf_info,r=t.route,rdw=t.rdw;
  if(t.soort_actie==="bel"){
    if(b&&b.nummer)act+=`<a class="tk-btn prim" href="tel:${esc(b.nummer)}">Bel ${esc(b.nummer)}</a>`;
    else act+=`<span class="tk-meta">${esc((b&&b.nummer_tekst)||"nummer niet gevonden, toevoegen")}</span>`;
    act+=`<button class="tk-btn sec" data-nr="${esc(t.id)}">Nummer aanpassen</button>`;
    if(b&&b.adres)extra+=`<div class="tk-meta">${esc(b.adres)}</div>`;
    if(b&&b.openingstijden)extra+=`<div class="tk-meta">Openingstijden: ${esc(b.openingstijden)}</div>`;
    if(b&&b.bron)extra+=`<div class="tk-bron">Bron: ${esc(b.bron)}${b.bron_url?` · <a href="${esc(b.bron_url)}" target="_blank" rel="noopener">OpenStreetMap</a>`:""}</div>`;
  }
  if(r){
    const tijd=r.reistijd_tekst||(r.afstand_km!=null?(r.afstand_km+" km vanaf De Giessen 1"):"Route vanaf De Giessen 1, Dronten");
    act+=`<a class="tk-btn prim" href="${esc(r.route_maps)}" target="_blank" rel="noopener">Route (${esc(tijd)})</a>`;
    if(r.route_osm)act+=`<a class="tk-btn sec" href="${esc(r.route_osm)}" target="_blank" rel="noopener">OpenStreetMap</a>`;
    if(r.bron)extra+=`<div class="tk-bron">Reistijd: ${esc(r.bron)}</div>`;
  }
  if(t.dossier_url)act+=`<a class="tk-btn sec" href="${esc(t.dossier_url)}">Autodossier</a>`;
  if(rdw){
    if(rdw.gevonden)extra+=`<div class="tk-meta">Kenteken ${esc(rdw.kenteken||"—")} · APK tot ${esc(dag(rdw.vervaldatum_apk)||"onbekend")}</div>`;
    else extra+=`<div class="tk-meta">${esc(rdw.reden||"APK niet gevonden in RDW open data")}</div>`;
    if(rdw.bron)extra+=`<div class="tk-bron">Bron: ${esc(rdw.bron)}</div>`;
  }
  act+=`<button class="tk-btn prim" data-klaar="${esc(t.id)}">Klaar + notitie</button>`;
  const form=`<div class="tk-notitie" id="n-${esc(t.id)}">
    <textarea id="nt-${esc(t.id)}" placeholder="Korte notitie (wordt in het dossier bewaard)"></textarea>
    <div class="tk-row"><button type="button" class="tk-btn tk-mic" data-mic="${esc(t.id)}" title="Inspreken">🎤</button>
    <input id="nv-${esc(t.id)}" placeholder="Optioneel: vervolgtaak">
    <input id="nq-${esc(t.id)}" placeholder="Optioneel: vraag voor Robin"></div>
    <div class="tk-row"><button class="tk-btn prim" data-ok="${esc(t.id)}">Opslaan en afvinken</button>
    <button class="tk-btn sec" data-ann="${esc(t.id)}">Annuleren</button></div>
  </div>`;
  return `<article class="tk-card${late}" data-id="${esc(t.id)}"><h3>${esc(t.titel)}</h3>
    <div class="tk-meta">${meta}</div>${extra}<div class="tk-acties">${act}</div>${form}</article>`;
}

function vraagKaart(v){
  return `<article class="tk-card tk-vraag"><h3>Vraag voor Robin</h3>
    <div class="tk-meta">${esc(v.tekst)}${v.auto?" · "+esc(v.auto):""}${v.door?" — van "+esc(v.door):""}</div></article>`;
}

function takenRender(){
  const k=$("#kpis");if(k)k.innerHTML="";
  const sort=$("#sort");if(sort)sort.innerHTML="";
  const cards=$("#cards");if(!cards)return;
  cards.innerHTML=`<div class="tk-wrap"><p class="tk-leeg">Taken laden…</p></div>`;
  laadEnTeken();
}

async function laadEnTeken(){
  const cards=$("#cards");if(!cards)return;
  try{
    TAKEN=await api("/taken");
  }catch(e){
    cards.innerHTML=`<div class="tk-wrap"><div class="tk-warn"><b>Taken niet geladen.</b>${esc(e.message)}</div></div>`;
    return;
  }
  tekenLijst();
}

function tekenLijst(){
  const cards=$("#cards");if(!cards||!TAKEN)return;
  const meds=(TAKEN.gebruikers||[]).map(u=>u.naam);
  const autos=[...new Set((TAKEN.taken||[]).map(t=>t.auto).filter(Boolean))];
  const {taken,vragen}=filterItems(TAKEN);
  const fb=[['open','Open'],['vandaag','Vandaag'],['te_laat','Te laat'],['wacht_op_robin','Wacht op Robin'],['klaar','Klaar']];
  const filters=fb.map(([k,l])=>`<button class="${FILT===k?"on":""}" data-f="${k}">${l}</button>`).join("");
  const sub=`<div class="tk-sub">
    <select id="tk-med"><option value="">Alle medewerkers</option>${meds.map(n=>`<option ${MED===n?"selected":""}>${esc(n)}</option>`).join("")}</select>
    <select id="tk-auto"><option value="">Alle auto’s</option>${autos.map(n=>`<option ${AUTO===n?"selected":""}>${esc(n)}</option>`).join("")}</select>
  </div>`;
  const lijst=vragen.map(vraagKaart).join("")+taken.map(kaart).join("")||`<div class="tk-leeg">Niets in dit filter.</div>`;
  const medBlok=`<div class="tk-med"><b>Medewerkers</b> (zonder chat-id, de site is openbaar). Nieuwe collega’s nodig? Dat gaat via de BRNS-bot: <code>nieuwe medewerker …</code><br>
    ${(TAKEN.gebruikers||[]).map(u=>`${esc(u.naam)} (${esc(u.rol)}${u.gekoppeld?", gekoppeld":", nog niet gekoppeld"})`).join(" · ")}</div>`;
  cards.innerHTML=`<div class="tk-wrap">
    <div class="tk-warn"><b>Openbare site</b>${esc(TAKEN.waarschuwing||"Telefoonnummers van bedrijven zijn zichtbaar op deze site. Alleen zakelijke nummers. Nummers van privépersonen staan niet hier, alleen in Telegram.")}</div>
    <div class="tk-filters">${filters}</div>${sub}${lijst}${medBlok}</div>`;
  bind();
}

function bind(){
  document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{FILT=b.dataset.f;tekenLijst()});
  const med=document.getElementById("tk-med"),au=document.getElementById("tk-auto");
  if(med)med.onchange=()=>{MED=med.value;tekenLijst()};
  if(au)au.onchange=()=>{AUTO=au.value;tekenLijst()};
  document.querySelectorAll("[data-klaar]").forEach(b=>b.onclick=()=>{const id=b.dataset.klaar,el=document.getElementById("n-"+id);if(el)el.classList.add("on")});
  document.querySelectorAll("[data-ann]").forEach(b=>b.onclick=()=>{const el=document.getElementById("n-"+b.dataset.ann);if(el)el.classList.remove("on")});
  document.querySelectorAll("[data-ok]").forEach(b=>b.onclick=()=>klaar(b.dataset.ok));
  document.querySelectorAll("[data-nr]").forEach(b=>b.onclick=()=>nummerAanpassen(b.dataset.nr));
  document.querySelectorAll("[data-mic]").forEach(b=>b.onclick=()=>inspreken(b.dataset.mic));
}

async function klaar(id){
  const notitie=(document.getElementById("nt-"+id)||{}).value||"";
  const vervolg=(document.getElementById("nv-"+id)||{}).value||"";
  const vraag=(document.getElementById("nq-"+id)||{}).value||"";
  try{
    await api("/taken/"+id+"/klaar","POST",{notitie,vervolg,vraag_robin:vraag});
    TAKEN=await api("/taken");tekenLijst();
  }catch(e){alert(e.message)}
}

async function nummerAanpassen(id){
  const t=(TAKEN.taken||[]).find(x=>x.id===id);
  const naam=(t&&t.bedrijf_info&&t.bedrijf_info.naam)||(t&&t.bedrijf)||prompt("Bedrijfsnaam?");
  if(!naam)return;
  const nummer=prompt("Zakelijk telefoonnummer (leeg = niet gevonden). Alleen een zakelijk nummer wordt op de site getoond.",(t.bedrijf_info&&t.bedrijf_info.nummer)||"");
  if(nummer===null)return;
  const zakelijk=confirm("Is dit een zakelijk nummer? OK = ja, zichtbaar op de site. Annuleren = privé, alleen in Telegram.");
  try{
    await api("/taken/contact","POST",{naam,nummer,zakelijk,taak_id:id});
    TAKEN=await api("/taken");tekenLijst();
  }catch(e){alert(e.message)}
}

function inspreken(id){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const ta=document.getElementById("nt-"+id);if(!ta)return;
  if(!SR){alert("Inspreken is op dit toestel niet beschikbaar. Typ de notitie.");return}
  const r=new SR();r.lang="nl-NL";r.onresult=e=>{ta.value=((ta.value||"")+" "+e.results[0][0].transcript).trim()};
  r.onerror=()=>{};r.start();
}

function takenInstel(){
  const box=document.querySelector("#ilog");
  if(!box)return;
  const w=box.closest("div.w")||box.parentElement;
  if(!w||document.getElementById("tk-medewerkers-inst"))return;
  const d=document.createElement("details");
  d.id="tk-medewerkers-inst";
  d.innerHTML=`<summary>Medewerkers</summary>
    <p class="ihulp">De site is openbaar: hier staan alleen namen en rollen, geen chat-id’s of uitnodigcodes. Medewerkers toevoegen of verwijderen gaat via de BRNS-bot (<code>nieuwe medewerker …</code>). Medewerkers mogen taken en vragen gebruiken, geen instellingen, geen biedingen.</p>
    <div id="tk-med-lijst">Laden…</div>`;
  box.parentElement.insertBefore(d,box.parentElement.querySelector("summary")?null:box);
  // zet vóór logboek-details
  const log=box.closest("details");
  if(log&&log.parentElement)log.parentElement.insertBefore(d,log);
  api("/taken").then(j=>{
    const el=document.getElementById("tk-med-lijst");if(!el)return;
    el.innerHTML=(j.gebruikers||[]).map(u=>`<div>${esc(u.naam)} — ${esc(u.rol)}${u.gekoppeld?" (gekoppeld)":" (nog niet gekoppeld)"}</div>`).join("")||"Nog niemand.";
  }).catch(e=>{const el=document.getElementById("tk-med-lijst");if(el)el.textContent=e.message});
}

document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("#tabs button");
  // takenTabs blijft in sync via render
},true);

if(typeof startSeg==="function"){/* already wrapped */}
if(location.hash==="#taken"){try{seg=TAKEN_SEG}catch(e){}}
window.takenTab=takenRender;
})();
