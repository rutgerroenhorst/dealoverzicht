/* Taken-tab (seg 19): volwaardige werkomgeving. Site blijft openbaar zonder login.
   Zakelijke nummers mogen zichtbaar zijn; privénummers komen niet mee uit de API.
   Taken en vragen komen live van de server (geen gh-pages). Navigatie: Inkoop | Bedrijf. */
(function(){
const TAKEN_SEG=19, VD=20, VR_SEG=21, AUTO_SEG=22, WACHT_SEG=23;
const BEDRIJF_I=new Set([TAKEN_SEG,VR_SEG,AUTO_SEG]);
const API=(typeof KL!=="undefined"&&KL.instellingen_api)||"https://2-31-144-18.sslip.io/api/inst";
const HOST=location.hostname||"";
const LIVE=HOST==="rutgerroenhorst.github.io"||/\.sslip\.io$/.test(HOST)||HOST==="2-31-144-18.sslip.io";
const OPEN=((typeof KL!=="undefined"&&KL.slug)||"brns")==="brns"&&LIVE;
const tok=()=>localStorage["inst_token_"+((typeof KL!=="undefined"&&KL.slug)||"brns")]||"";
function hdr(){const h={"Content-Type":"application/json"};/* geen Cache-Control-kop: niet toegestaan door CORS (preflight faalde), fetch gebruikt al cache:no-store */if(tok())h.Authorization="Bearer "+tok();else if(OPEN)h["X-Klant"]="brns";return h}
async function api(p,method,body){
  if(!LIVE) throw Object.assign(Error("Taken komen live van de server; deze pagina is een lokale test."),{offline:true});
  const r=await fetch(API+p,{method:method||"GET",headers:hdr(),body:body?JSON.stringify(body):undefined,cache:"no-store"});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw Object.assign(Error(j.fout||r.statusText||"Fout"),{j});
  return j;
}
let TAKEN=null, FILT="open", MED="", AUTO="", DEEL="inkoop", poll=null;

function gebruikerLabel(u){
  if(!u)return "";
  if(u.werkt_op==="site"||u.status==="werkt op de site")return esc(u.naam)+" ("+esc(u.rol)+", werkt op de site)";
  return esc(u.naam)+" ("+esc(u.rol)+(u.gekoppeld?", gekoppeld":", nog niet gekoppeld")+")";
}

function deelBalk(){
  const tabs=document.querySelector("#tabs");if(!tabs)return;
  let b=document.getElementById("tk-delen");
  if(!b){
    b=document.createElement("div");
    b.id="tk-delen";
    b.className="tk-delen";
    b.innerHTML=`<button type="button" data-deel="inkoop">Inkoop</button><button type="button" data-deel="bedrijf">Bedrijf</button>`;
    tabs.parentElement.insertBefore(b,tabs);
    b.querySelectorAll("[data-deel]").forEach(x=>x.onclick=()=>kiesDeel(x.dataset.deel));
  }
  b.querySelectorAll("[data-deel]").forEach(x=>x.classList.toggle("on",x.dataset.deel===DEEL));
}

function kiesDeel(d){
  DEEL=d==="bedrijf"?"bedrijf":"inkoop";
  if(DEEL==="bedrijf"&&!BEDRIJF_I.has(seg))seg=TAKEN_SEG;
  if(DEEL==="inkoop"&&BEDRIJF_I.has(seg))seg=VD;
  try{location.hash=DEEL==="bedrijf"?"#taken":"#vandaag"}catch(e){}
  filterTabs();
  if(typeof render==="function")render();
}

function filterTabs(){
  deelBalk();
  const t=document.querySelector("#tabs");if(!t)return;
  const extra=[[TAKEN_SEG,"Taken"],[VR_SEG,"Voorraad"],[AUTO_SEG,"Auto's"]];
  // Nooit verborgen tabknoppen in #tabs laten staan (tabs-scroll-test klikt alle knoppen).
  [TAKEN_SEG,VR_SEG,AUTO_SEG,WACHT_SEG].forEach(i=>{
    const b=t.querySelector(`[data-i="${i}"]`);
    if(!b)return;
    const houden=(DEEL==="bedrijf"&&BEDRIJF_I.has(i))||(DEEL==="inkoop"&&i===WACHT_SEG);
    if(!houden)b.remove();
  });
  if(DEEL==="inkoop"&&!t.querySelector(`[data-i="${WACHT_SEG}"]`)){
    const html=`<button class="${seg===WACHT_SEG?"on":""}" data-i="${WACHT_SEG}">Wacht op jou</button>`;
    const vd=t.querySelector(`[data-i="${VD}"]`);
    if(vd)vd.insertAdjacentHTML("afterend",html);else t.insertAdjacentHTML("afterbegin",html);
  }
  if(DEEL==="bedrijf"){
    extra.forEach(([i,l])=>{
      if(!t.querySelector(`[data-i="${i}"]`))
        t.insertAdjacentHTML("beforeend",`<button class="${seg===i?"on":""}" data-i="${i}">${l}</button>`);
    });
  }
  t.querySelectorAll("button[data-i]").forEach(b=>b.classList.toggle("on",+b.dataset.i===seg));
  if(typeof tabZichtbaar==="function") tabZichtbaar();
}

function takenTabs(){
  if(BEDRIJF_I.has(seg)||seg===WACHT_SEG)DEEL=BEDRIJF_I.has(seg)?"bedrijf":"inkoop";
  if(seg===WACHT_SEG)DEEL="inkoop";
  filterTabs();
}

const _renderTaken=typeof render==="function"?render:function(){};
render=function(){
  if(seg===TAKEN_SEG||seg===VR_SEG||seg===AUTO_SEG||seg===WACHT_SEG){
    const was=seg;seg=8;
    try{_renderTaken()}finally{seg=was}
    const f=document.querySelector(".filters"),br=document.querySelector(".bronnen");
    if(f)f.style.display="none";if(br)br.style.display="none";
    const sb=document.getElementById("sbox");if(sb)sb.remove();
    takenTabs();
    if(was===TAKEN_SEG||was===WACHT_SEG)takenRender();
    else if(was===VR_SEG)tekenVoorraad();
    else tekenAutos();
    startPoll();
    return;
  }
  if(BEDRIJF_I.has(seg)){DEEL="bedrijf"}
  else if(seg===VD||seg===WACHT_SEG){DEEL=seg===WACHT_SEG?"inkoop":DEEL}
  _renderTaken();takenTabs();takenInstel();
};

const _startTaken=typeof startSeg==="function"?startSeg:function(){};
if(typeof startSeg==="function"){
  startSeg=function(){
    const h=location.hash||"";
    _startTaken();
    if(h==="#taken"||h==="#bedrijf"){seg=TAKEN_SEG;DEEL="bedrijf"}
    if(h==="#voorraad-bedrijf"){seg=VR_SEG;DEEL="bedrijf"}
    if(h==="#autos"){seg=AUTO_SEG;DEEL="bedrijf"}
    if(h==="#wacht-op-robin"||h==="#wacht"){seg=WACHT_SEG;DEEL="inkoop"}
    if(h==="#inkoop"){seg=VD;DEEL="inkoop"}
  };
}

function dag(iso){if(!iso)return "";const d=String(iso).slice(0,10).split("-");return d.length===3?d[2]+"-"+d[1]:iso}
function isTeLaat(t){const d=(t.deadline||"").slice(0,10);if(!d)return false;const v=new Date();const vandaag=v.toLocaleDateString("sv-SE",{timeZone:"Europe/Amsterdam"});return d<vandaag}

function filterItems(data){
  const vragen=(data.vragen||[]).filter(v=>v.status==="open");
  if(FILT==="wacht_op_robin"||seg===WACHT_SEG)return {taken:[],vragen};
  let L=(data.taken||[]).filter(t=>t.status==="open"||t.status==="bezig");
  const v=new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Amsterdam"});
  if(FILT==="vandaag")L=L.filter(t=>(t.deadline||"").slice(0,10)===v);
  if(FILT==="te_laat")L=L.filter(isTeLaat);
  if(FILT==="klaar")L=(data.taken||[]).filter(t=>t.status==="klaar");
  if(MED)L=L.filter(t=>(t.voor||"")===MED);
  if(AUTO)L=L.filter(t=>(t.auto||"")===AUTO);
  return {taken:L,vragen:[]};
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
  const meds=(TAKEN.gebruikers||[]).filter(u=>u.werkt_op!=="site");
  const toew=`<label class="tk-toew">Toewijzen <select data-toew="${esc(t.id)}"><option value="">Niet toegewezen</option>${meds.map(u=>`<option value="${esc(u.naam)}" ${t.voor===u.naam?"selected":""}>${esc(u.naam)}</option>`).join("")}</select></label>`;
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
    <div class="tk-meta">${meta}</div>${extra}${toew}<div class="tk-acties">${act}</div>${form}</article>`;
}

function vraagKaart(v){
  if(v.status!=="open"){
    return `<article class="tk-card tk-vraag"><h3>Beantwoord</h3>
      <div class="tk-meta">${esc(v.tekst)}${v.auto?" · "+esc(v.auto):""}${v.door?" — van "+esc(v.door):""}</div>
      <div class="tk-meta">Antwoord: ${esc(v.antwoord||"")}</div></article>`;
  }
  return `<article class="tk-card tk-vraag" data-vraag="${esc(v.id)}">
    <h3>Wacht op jou (Robin)</h3>
    <div class="tk-meta">${esc(v.tekst)}${v.auto?" · "+esc(v.auto):""}${v.door?" — van "+esc(v.door):""}</div>
    <div class="tk-acties">
      <button class="tk-btn prim" data-ant="${esc(v.id)}" data-soort="ja">Ja</button>
      <button class="tk-btn prim" data-ant="${esc(v.id)}" data-soort="nee">Nee</button>
      <button class="tk-btn sec" data-ant="${esc(v.id)}" data-soort="max">Max €</button>
      <button class="tk-btn sec" data-ant="${esc(v.id)}" data-soort="bel_me">Bel me</button>
    </div>
    <div class="tk-row"><input id="na-${esc(v.id)}" placeholder="Of typ een korte notitie">
      <button class="tk-btn prim" data-ant="${esc(v.id)}" data-soort="notitie">Stuur notitie</button></div>
  </article>`;
}

function wachtBlok(vragen, compact){
  const vr=(vragen||[]).filter(v=>v.status==="open");
  if(!vr.length&&compact)return "";
  if(compact){
    return `<section class="tk-wacht" id="tk-wacht">
      <h3>Wacht op jou (Robin) <span class="cnt">${vr.length}</span></h3>
      ${vr.map(vraagKaart).join("")}
    </section>`;
  }
  return vr.map(vraagKaart).join("")||`<div class="tk-leeg">Geen open vragen.</div>`;
}

function takenRender(){
  const k=$("#kpis");if(k)k.innerHTML="";
  const sort=$("#sort");if(sort)sort.innerHTML="";
  const cards=$("#cards");if(!cards)return;
  if(!TAKEN)cards.innerHTML=`<div class="tk-wrap"><p class="tk-leeg">Taken laden…</p></div>`;
  laadEnTeken();
}

async function laadEnTeken(stil){
  try{
    TAKEN=await api("/taken");
  }catch(e){
    const cards=$("#cards");
    if(cards&&!stil)cards.innerHTML=`<div class="tk-wrap"><div class="tk-warn"><b>Taken niet geladen.</b>${esc(e.message)}</div></div>`;
    return;
  }
  if(seg===TAKEN_SEG||seg===WACHT_SEG)tekenLijst();
  else if(seg===VR_SEG)tekenVoorraad();
  else if(seg===AUTO_SEG)tekenAutos();
  if(seg===VD)takenVandaagBlok();
}

function startPoll(){
  if(poll)return;
  poll=setInterval(()=>{
    if(document.hidden)return;
    if(seg===TAKEN_SEG||seg===VD||seg===VR_SEG||seg===AUTO_SEG||seg===WACHT_SEG)
      laadEnTeken(true);
  },5000);
}

function tekenLijst(){
  const cards=$("#cards");if(!cards||!TAKEN)return;
  const meds=(TAKEN.gebruikers||[]).map(u=>u.naam);
  const autos=[...new Set((TAKEN.taken||[]).map(t=>t.auto).filter(Boolean))];
  const openV=(TAKEN.vragen||[]).filter(v=>v.status==="open");
  if(seg===WACHT_SEG){
    cards.innerHTML=`<div class="tk-wrap"><div class="tk-warn"><b>Wacht op jou (Robin)</b> Antwoorden gaan via Telegram naar de medewerker die de vraag stelde. Geen bundel in de ochtendmail.</div>${wachtBlok(openV,false)}</div>`;
    bind();return;
  }
  const {taken,vragen}=filterItems(TAKEN);
  const fb=[['open','Open'],['vandaag','Vandaag'],['te_laat','Te laat'],['wacht_op_robin','Wacht op jou'],['klaar','Klaar']];
  const filters=fb.map(([k,l])=>`<button class="${FILT===k?"on":""}" data-f="${k}">${l}</button>`).join("");
  const sub=`<div class="tk-sub">
    <select id="tk-med"><option value="">Alle medewerkers</option>${meds.map(n=>`<option ${MED===n?"selected":""}>${esc(n)}</option>`).join("")}</select>
    <select id="tk-auto"><option value="">Alle auto’s</option>${autos.map(n=>`<option ${AUTO===n?"selected":""}>${esc(n)}</option>`).join("")}</select>
  </div>`;
  const vragenHtml=FILT==="wacht_op_robin"?wachtBlok(openV,false):(openV.length?wachtBlok(openV,true):"");
  const lijst=(FILT==="wacht_op_robin"?"":taken.map(kaart).join(""))|| (FILT==="wacht_op_robin"?"":`<div class="tk-leeg">Niets in dit filter.</div>`);
  const medBlok=`<div class="tk-med"><b>Medewerkers</b> (zonder chat-id of sitelink, de site is openbaar). Nieuwe collega’s via de BRNS-bot: <code>nieuwe medewerker …</code><br>
    ${(TAKEN.gebruikers||[]).map(gebruikerLabel).join(" · ")}</div>`;
  cards.innerHTML=`<div class="tk-wrap">
    <div class="tk-warn"><b>Openbare site · live van de server</b>${esc(TAKEN.waarschuwing||"Telefoonnummers van bedrijven zijn zichtbaar op deze site. Alleen zakelijke nummers.")}</div>
    <div class="tk-filters">${filters}</div>${sub}${vragenHtml}${lijst}${medBlok}</div>`;
  bind();
}

function tekenVoorraad(){
  const cards=$("#cards");if(!cards)return;
  const host=()=>{if(!TAKEN){cards.innerHTML=`<div class="tk-wrap"><p class="tk-leeg">Voorraad laden…</p></div>`;laadEnTeken();return}
    const ST=["gezocht","gekocht","onderweg","binnen","werkplaats","online","verkocht"];
    const LAB={gezocht:"Gezocht",gekocht:"Gekocht",onderweg:"Onderweg",binnen:"Binnen",werkplaats:"Werkplaats",online:"Online",verkocht:"Verkocht"};
    const dos=TAKEN.dossiers||[];
    const rijen=dos.map(d=>{
      const kn=ST.map(s=>`<button class="tk-btn ${d.status===s?"prim":"sec"}" data-dos="${esc(d.id)}" data-st="${s}">${LAB[s]}</button>`).join("");
      const taken=(TAKEN.taken||[]).filter(t=>t.dossier_id===d.id&&t.status==="open");
      const tl=taken.length?`<div class="tk-meta">Open taken: ${taken.map(t=>esc(t.titel)).join(", ")}</div>`:"";
      return `<div class="tk-card"><h3>${esc(d.titel||"Auto")}</h3>
        <div class="tk-meta">Status: ${esc(LAB[d.status]||d.status||"—")}${d.niet_op_locatie?" · niet op locatie":""}</div>
        <div class="tk-acties">${kn}</div>${tl}</div>`;
    }).join("")||`<div class="tk-meta">Nog geen auto's in de voorraadstatus.</div>`;
    cards.innerHTML=`<div class="tk-wrap"><h2 class="t">Voorraad</h2>
      <div class="tk-meta">Bij 'Gekocht' worden automatisch de standaardtaken gezet (transport, APK-check, poetsen, online zetten).</div>${rijen}</div>`;
    cards.querySelectorAll("[data-dos]").forEach(b=>b.onclick=async()=>{
      try{await api("/taken/dossier","POST",{id:b.dataset.dos,status:b.dataset.st});TAKEN=await api("/taken");tekenVoorraad()}catch(e){alert(e.message)}
    });
  };
  host();
}

function tekenAutos(){
  const cards=$("#cards");if(!cards)return;
  if(!TAKEN){cards.innerHTML=`<div class="tk-wrap"><p class="tk-leeg">Auto's laden…</p></div>`;laadEnTeken();return}
  const dos=TAKEN.dossiers||[];
  const rijen=dos.map(d=>{
    const taken=(TAKEN.taken||[]).filter(t=>t.dossier_id===d.id&&t.status==="open");
    const t0=taken[0]||(TAKEN.taken||[]).find(t=>t.auto&&t.auto===(d.titel||d.auto));
    const rdw=t0&&t0.rdw,r=t0&&t0.route,b=t0&&t0.bedrijf_info;
    let act="";
    if(b&&b.nummer)act+=`<a class="tk-btn prim" href="tel:${esc(b.nummer)}">Bel ${esc(b.nummer)}</a>`;
    if(r&&r.route_maps)act+=`<a class="tk-btn prim" href="${esc(r.route_maps)}" target="_blank" rel="noopener">Route (${esc(r.reistijd_tekst||"")})</a>`;
    return `<article class="tk-card"><h3>${esc(d.titel||"Auto")}</h3>
      <div class="tk-meta">Status: ${esc(d.status||"—")} · Kenteken ${esc((rdw&&rdw.kenteken)||"onbekend")} · APK ${rdw&&rdw.gevonden?("tot "+esc(dag(rdw.vervaldatum_apk)||"onbekend")):esc((rdw&&rdw.reden)||"niet in RDW of geen kenteken")}</div>
      ${taken.length?`<div class="tk-meta">Open taken: ${taken.map(t=>esc(t.titel)).join(", ")}</div>`:""}
      ${r&&r.reistijd_tekst?`<div class="tk-meta">${esc(r.reistijd_tekst)} vanaf De Giessen 1, Dronten</div>`:""}
      <div class="tk-acties">${act}</div></article>`;
  }).join("")||`<div class="tk-leeg">Nog geen auto's. Zet een auto op 'Gekocht' om een dossier te maken.</div>`;
  cards.innerHTML=`<div class="tk-wrap"><h2 class="t">Auto's</h2>
    <div class="tk-meta">Kenteken, APK (RDW), open taken, route en belknop (alleen zakelijke nummers). Live van de server, zonder inkoopprijzen of marges in dit blok.</div>${rijen}</div>`;
}

function bind(){
  document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{FILT=b.dataset.f;if(FILT==="wacht_op_robin"){/* zelfde tab */}tekenLijst()});
  const med=document.getElementById("tk-med"),au=document.getElementById("tk-auto");
  if(med)med.onchange=()=>{MED=med.value;tekenLijst()};
  if(au)au.onchange=()=>{AUTO=au.value;tekenLijst()};
  document.querySelectorAll("[data-klaar]").forEach(b=>b.onclick=()=>{const id=b.dataset.klaar,el=document.getElementById("n-"+id);if(el)el.classList.add("on")});
  document.querySelectorAll("[data-ann]").forEach(b=>b.onclick=()=>{const el=document.getElementById("n-"+b.dataset.ann);if(el)el.classList.remove("on")});
  document.querySelectorAll("[data-ok]").forEach(b=>b.onclick=()=>klaar(b.dataset.ok));
  document.querySelectorAll("[data-nr]").forEach(b=>b.onclick=()=>nummerAanpassen(b.dataset.nr));
  document.querySelectorAll("[data-mic]").forEach(b=>b.onclick=()=>inspreken(b.dataset.mic));
  document.querySelectorAll("[data-ant]").forEach(b=>b.onclick=()=>antwoord(b.dataset.ant,b.dataset.soort));
  document.querySelectorAll("[data-toew]").forEach(s=>s.onchange=()=>toewijzen(s.dataset.toew,s.value));
}

async function antwoord(id,soort){
  let body={soort,door:"Robin"};
  if(soort==="max"){
    const n=prompt("Maximaal bedrag in euro's?");
    if(n===null)return;
    body.bedrag=n;
  }else if(soort==="notitie"){
    body.antwoord=((document.getElementById("na-"+id)||{}).value||"").trim();
    if(!body.antwoord){alert("Typ eerst een korte notitie.");return}
  }
  try{
    await api("/taken/vragen/"+id+"/antwoord","POST",body);
    TAKEN=await api("/taken");tekenLijst();
    if(seg===VD)takenVandaagBlok();
  }catch(e){alert(e.message)}
}

async function toewijzen(id,voor){
  try{
    await api("/taken/"+id+"/toewijzen","POST",{voor,door:"Robin"});
    TAKEN=await api("/taken");tekenLijst();
  }catch(e){alert(e.message)}
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
    <p class="ihulp">Robin werkt op de site (geen Telegram). Medewerkers werken via Telegram en een persoonlijke Open-link (geen wachtwoord). Chat-id’s en links staan niet op deze openbare pagina. Toevoegen of verwijderen gaat via de BRNS-bot (<code>nieuwe medewerker …</code>). Een verwijderde medewerker verliest ook die link.</p>
    <div id="tk-med-lijst">Laden…</div>`;
  const log=box.closest("details");
  if(log&&log.parentElement)log.parentElement.insertBefore(d,log);
  api("/taken").then(j=>{
    const el=document.getElementById("tk-med-lijst");if(!el)return;
    el.innerHTML=(j.gebruikers||[]).map(u=>`<div>${gebruikerLabel(u)}</div>`).join("")||"Nog niemand.";
  }).catch(e=>{const el=document.getElementById("tk-med-lijst");if(el)el.textContent=e.message});
}

if(location.hash==="#taken"||location.hash==="#bedrijf"){try{seg=TAKEN_SEG;DEEL="bedrijf"}catch(e){}}
if(location.hash==="#wacht-op-robin"){try{seg=WACHT_SEG;DEEL="inkoop"}catch(e){}}
window.takenTab=takenRender;

/* --- Te doen vandaag + Wacht op jou (tab Vandaag, Inkoop) --- */
const _vandaagTaken=typeof vandaag==="function"?vandaag:null;
if(_vandaagTaken){
  vandaag=function(){_vandaagTaken();takenVandaagBlok();startPoll()};
}
function takenVandaagBlok(){
  const host=document.querySelector(".vandaag");
  if(!host)return;
  const teken=j=>{
    TAKEN=j||TAKEN;
    const v=new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Amsterdam"});
    const open=(TAKEN.taken||[]).filter(t=>t.status==="open"||t.status==="bezig");
    const vandaagT=open.filter(t=>(t.deadline||"").slice(0,10)===v);
    const laat=open.filter(t=>{const d=(t.deadline||"").slice(0,10);return d&&d<v});
    const vr=(TAKEN.vragen||[]).filter(x=>x.status==="open");
    let el=document.getElementById("tk-vandaag");
    if(!el){el=document.createElement("section");el.id="tk-vandaag";el.className="vb";host.insertBefore(el,host.firstChild)}
    const rij=t=>`<li class="vr"><div class="vr-m"><div class="vr-t">${esc(t.titel)}${t.auto?" · "+esc(t.auto):""}</div><div class="vr-s">${t.deadline?"uiterlijk "+esc(dag(t.deadline)):""}${t.voor?" · "+esc(t.voor):""}${isTeLaat(t)?" · te laat":""}</div></div></li>`;
    const lijst=[...laat.map(rij),...vandaagT.map(rij)].join("")||"";
    el.innerHTML=`<h3>Te doen vandaag <span class="cnt">${vandaagT.length+laat.length}</span></h3>
      ${lijst?`<ul class="vl">${lijst}</ul>`:`<div class="meta">Niets met deadline vandaag.</div>`}
      <div class="meta"><button class="btn sm ghost" data-gotab="19">Open Taken</button></div>`;
    let w=document.getElementById("tk-wacht-vd");
    if(!w){w=document.createElement("section");w.id="tk-wacht-vd";w.className="vb";el.insertAdjacentElement("afterend",w)}
    w.innerHTML=vr.length?`<h3>Wacht op jou (Robin) <span class="cnt">${vr.length}</span></h3>${vr.map(vraagKaart).join("")}`:`<h3>Wacht op jou (Robin)</h3><div class="meta">Geen open vragen.</div>`;
    w.querySelectorAll("[data-ant]").forEach(b=>b.onclick=()=>antwoord(b.dataset.ant,b.dataset.soort));
  };
  if(TAKEN)teken(TAKEN);
  api("/taken").then(teken).catch(()=>{});
}

/* --- Voorraadstatus per auto (Mijn pipeline blijft Inkoop; dit blok is extra zichtbaar) --- */
const _pipelineTaken=typeof pipeline==="function"?pipeline:null;
if(_pipelineTaken){
  pipeline=function(){_pipelineTaken();takenPipelineBlok()};
}
function takenPipelineBlok(){
  const cards=document.getElementById("cards");
  if(!cards)return;
  api("/taken").then(j=>{
    TAKEN=j;
    let el=document.getElementById("tk-pipeline");
    if(!el){el=document.createElement("article");el.id="tk-pipeline";el.className="card wide";
      const first=cards.querySelector("article");
      if(first)cards.insertBefore(el,first.nextSibling);else cards.insertBefore(el,cards.firstChild)}
    const ST=["gezocht","gekocht","onderweg","binnen","werkplaats","online","verkocht"];
    const LAB={gezocht:"Gezocht",gekocht:"Gekocht",onderweg:"Onderweg",binnen:"Binnen",werkplaats:"Werkplaats",online:"Online",verkocht:"Verkocht"};
    const dos=j.dossiers||[];
    const rijen=dos.map(d=>{
      const kn=ST.map(s=>`<button class="tk-btn ${d.status===s?"prim":"sec"}" data-dos="${esc(d.id)}" data-st="${s}">${LAB[s]}</button>`).join("");
      const taken=(j.taken||[]).filter(t=>t.dossier_id===d.id&&t.status==="open");
      const tl=taken.length?`<div class="tk-meta">Open taken: ${taken.map(t=>esc(t.titel)).join(", ")}</div>`:"";
      return `<div class="tk-card" style="margin:8px 0"><h3>${esc(d.titel||"Auto")}</h3>
        <div class="tk-meta">Status: ${esc(LAB[d.status]||d.status||"—")}${d.niet_op_locatie?" · niet op locatie":""}</div>
        <div class="tk-acties">${kn}</div>${tl}</div>`;
    }).join("")||`<div class="tk-meta">Nog geen auto's in de voorraadstatus. Zet een auto op 'Gekocht' via de bot (“de M5 is gekocht”) of hier als er een dossier is.</div>`;
    el.innerHTML=`<div class="body"><h2 class="t">Voorraadstatus per auto</h2>
      <div class="meta">Bij 'Gekocht' worden automatisch de standaardtaken gezet (transport, APK-check, poetsen, online zetten). Dit komt live van de server, niet via GitHub Pages.</div>
      ${rijen}</div>`;
    el.querySelectorAll("[data-dos]").forEach(b=>b.onclick=async()=>{
      try{
        await api("/taken/dossier","POST",{id:b.dataset.dos,status:b.dataset.st});
        takenPipelineBlok();
      }catch(e){alert(e.message)}
    });
  }).catch(()=>{});
}

})();
