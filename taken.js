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
  let r;try{r=await fetch(API+p,{method:method||"GET",headers:hdr(),body:body?JSON.stringify(body):undefined,cache:"no-store"})}catch(x){throw Object.assign(Error("Geen verbinding. Er is niets opgeslagen; probeer het zo opnieuw."),{net:true})} /* AZ_FIX */
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw Object.assign(Error(j.fout||r.statusText||"Fout"),{j});
  return j;
}
let TAKEN=null, FILT="open", MED="", AUTO="", DEEL="inkoop", poll=null;
/* TAKEN_WEEK_V1 (t671u): taken_week.js (weekbord, geschiedenis, prullenbak, spoor, concepten) gebruikt deze ingangen */
window.TK_API=api;window.TK_DATA=()=>TAKEN;
window.TK_HERLAAD=async()=>{TAKEN=await api("/taken");if(seg===TAKEN_SEG||seg===WACHT_SEG)tekenLijst();if(seg===VD)takenVandaagBlok();if(typeof window.navWacht==="function")navWacht(wachtAantal());return TAKEN};
function wachtAantal(){return ((TAKEN&&TAKEN.vragen)||[]).filter(v=>v.status==="open").length+((TAKEN&&TAKEN.concepten)||[]).length}
function vandaagSet(data){const v=data&&data.vandaag;return v&&v.vandaag?new Set([...(v.vandaag||[]),...(v.te_laat||[])]):null}
const CK="tk_concept_v1",BEZIG_MET={}; /* AZ_FIX1/2 */

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
  if(FILT==="vandaag"){const S=vandaagSet(data);L=S?L.filter(t=>S.has(t.id)):L.filter(t=>(t.deadline||"").slice(0,10)===v)}
  if(FILT==="te_laat")L=L.filter(isTeLaat);
  if(FILT==="klaar")L=(data.taken||[]).filter(t=>t.status==="klaar");
  if(MED)L=L.filter(t=>(t.voor||"")===MED);
  if(AUTO)L=L.filter(t=>(t.auto||"")===AUTO);
  return {taken:L,vragen:[]};
}

const TK_VAN="De Giessen 1, Dronten";
function tkTijd(t){ /* AZ_FIX5: lokale datum, geen onmogelijke tijden, einde nooit voor begin */
  const p=x=>String(x).padStart(2,"0"),mo=new Date(Date.now()+864e5),morgen=mo.getFullYear()+"-"+p(mo.getMonth()+1)+"-"+p(mo.getDate());
  const d=/^\d{4}-\d{2}-\d{2}/.test(String(t.deadline||""))?String(t.deadline).slice(0,10):morgen,dd=d.replace(/-/g,"");
  const m=String(t.tijdslot||"").match(/(\d{1,2})[:.](\d{2})(?:\s*[-–]\s*(\d{1,2})[:.](\d{2}))?/);
  const ok=(h,mi)=>+h<24&&+mi<60;
  let s=[9,0];if(m&&ok(m[1],m[2]))s=[+m[1],+m[2]];
  let e=(m&&m[3]&&ok(m[3],m[4]))?[+m[3],+m[4]]:[s[0]+1,s[1]];
  if(e[0]*60+e[1]<=s[0]*60+s[1])e=[s[0]+1,s[1]];
  if(e[0]>23)e=[23,59];
  return {s:dd+"T"+p(s[0])+p(s[1])+"00",e:dd+"T"+p(e[0])+p(e[1])+"00"}}
function tkWa(t){const C=(typeof window.ROBIN_V2_CONCEPTEN==="object"&&window.ROBIN_V2_CONCEPTEN)||{
  terugbellen:"Hoi, je had gebeld over een auto. Wanneer komt het je uit dat ik even terugbel? Groet, Robin – BRNS Exclusief",
  afspraak:"Hoi, hierbij de bevestiging van onze afspraak bij BRNS Exclusief, De Giessen 1 in Dronten. Tot dan! Groet, Robin",
  auto_klaar:"Hoi, goed nieuws: de auto staat klaar. Wanneer kom je hem ophalen? Groet, Robin – BRNS Exclusief",
  opvolging:"Hoi, hoe bevalt de auto? Als er iets is hoor ik het graag. Groet, Robin – BRNS Exclusief"};
  const x=t.titel||"";return /opvolging/i.test(x)?C.opvolging:/afleveren|klaar ?zetten|staat klaar/i.test(x)?C.auto_klaar:/afspraak|proefrit|bezichtig/i.test(x)?C.afspraak:C.terugbellen}
function snelActies(t,heeftRoute){
  const T=tkTijd(t),loc=t.adres||"";
  const g="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(t.titel||"Taak")+"&dates="+T.s+"/"+T.e+"&ctz=Europe/Amsterdam"+(loc?"&location="+encodeURIComponent(loc):"")+"&details="+encodeURIComponent((t.auto?"Auto: "+t.auto:"")+"");
  let h=`<a class="tk-btn sec" href="${esc(g)}" target="_blank" rel="noopener">📅 Google Agenda</a><button type="button" class="tk-btn sec" data-ics="${esc(t.id)}">📅 iPhone-agenda</button>`;
  if(loc&&!heeftRoute)h+=`<a class="tk-btn sec" href="${esc("https://maps.apple.com/?saddr="+encodeURIComponent(TK_VAN)+"&daddr="+encodeURIComponent(loc)+"&dirflg=d")}" target="_blank" rel="noopener">🗺 Route</a>`;
  const k=t.klant_dossier||{},txt=tkWa(t);
  if(k.tel)h+=`<a class="tk-btn sec" href="tel:${esc(k.tel)}">📞 Bel ${esc(k.naam||"")}</a>`;
  else if(k.heeft_tel)h+=`<span class="tk-meta">📞 ${esc(k.naam||"klant")}: nummer bekend (log in om te bellen)</span>`;
  h+=`<a class="tk-btn sec" href="${esc("https://wa.me/"+(k.wa?encodeURIComponent(k.wa):"")+"?text="+encodeURIComponent(txt))}" target="_blank" rel="noopener">💬 WhatsApp${k.wa?"":"-concept"}</a>`;
  return h}
function tkIcs(t){const T=tkTijd(t),z=s=>String(s||"").replace(/([,;\\])/g,"\\$1").replace(/\n/g," ");
  const ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//BRNS//Taken//NL","BEGIN:VEVENT","UID:"+t.id+"@brns","DTSTAMP:"+new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z",
    "DTSTART;TZID=Europe/Amsterdam:"+T.s,"DTEND;TZID=Europe/Amsterdam:"+T.e,"SUMMARY:"+z(t.titel),t.adres?"LOCATION:"+z(t.adres):"","END:VEVENT","END:VCALENDAR"].filter(Boolean).join("\r\n");
  const u=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));const a=document.createElement("a");a.href=u;a.download="taak.ics";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},1500)}
function kaart(t){
  const late=isTeLaat(t)?" tk-late":"";
  const meta=[t.auto?`Auto: ${esc(t.auto)}`:"",t.voor?`Voor: ${esc(t.voor)}`:"",t.deadline?`Uiterlijk ${esc(dag(t.deadline))}${t.tijd?" "+esc(t.tijd):""}`:"",t.plaats?esc(t.plaats):""].filter(Boolean).join(" · ");
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
  if(t.status==="klaar")act+=`<button class="tk-btn sec" data-heropen="${esc(t.id)}">↩️ Heropenen</button>`; /* HEROPEN_V1 */
  else{if(t.voortgang!=="bezig")act+=`<button class="tk-btn sec" data-bezig="${esc(t.id)}">Bezig</button>`;
  act+=`<button class="tk-btn prim" data-klaar="${esc(t.id)}">Klaar + notitie</button>`;}
  /* TAKEN_MW_V3 (t668u): wat de medewerker via Telegram meldt */
  const MWS={onderweg:"🚗 Onderweg",ben_er:"📍 Ben er",wacht_onderdelen:"⏳ Wacht op onderdelen"},kd=s=>String(s||"").slice(8,10)+"-"+String(s||"").slice(5,7),kt=s=>String(s||"").slice(11,16);
  let mw="";
  if(t.status!=="klaar"){
    if(t.stand&&MWS[t.stand])mw+=`<span class="tk-chip stand">${MWS[t.stand]}${t.stand_door?" · "+esc(t.stand_door):""}${t.stand_ts?" · "+kt(t.stand_ts):""}</span>`;
    if(t.kan_niet)mw+=`<span class="tk-chip kan">🚫 Kan ${t.kan_niet.dag===new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Amsterdam"})?"vandaag":kd(t.kan_niet.dag)} niet${t.kan_niet.door?" · "+esc(t.kan_niet.door):""}</span>`;
    if(t.verschoven)mw+=`<span class="tk-chip versch">➡️ Verschoven naar ${kd(t.verschoven.naar)}${t.verschoven.door?" · "+esc(t.verschoven.door):""}</span>`;
    if(t.blijft_liggen)mw+=`<span class="tk-chip kan">🌙 Bleef liggen ${kd(t.blijft_liggen.dag)}</span>`;
  }
  const rap=t.aflever||t.overdracht;
  if(rap&&(rap.km!=null||rap.schade||(rap.fotos&&Object.keys(rap.fotos).length)))extra+=`<div class="tk-meta">📋 Rapport${rap.km!=null?" · km "+esc(String(rap.km).replace(/\B(?=(\d{3})+(?!\d))/g,".")):""}${rap.schade?" · schade: "+esc(rap.schade):""}${rap.fotos?" · 📷 "+Object.values(rap.fotos).reduce((a,b)=>a+(+b||0),0):""}</div>`;
  if(t.audio&&t.audio.length)extra+=`<div class="tk-meta"><button type="button" class="tk-link" data-audio="${esc(t.id)}">🎤 ${t.audio.length} spraakbericht${t.audio.length>1?"en":""} afspelen</button></div><div class="tk-audio" id="au-${esc(t.id)}"></div>`;
  const chips=mw+(t.voortgang==="bezig"?`<span class="tk-chip bezig">Bezig${t.bezig_door?" · "+esc(t.bezig_door):""}</span>`:"")+(t.prio==="hoog"?`<span class="tk-chip hoog">Hoog</span>`:"");
  /* TAKEN_EXTRA_V1: checklist per taak (afvinken per punt) + terugkerend-label */
  if(t.checklist&&t.checklist.length){const k=t.checklist.filter(c=>c.klaar).length;extra+=`<div class="tk-meta">☑️ Checklist ${k}/${t.checklist.length}</div><div class="tk-cl">${t.checklist.map((c,i)=>`<button type="button" class="tk-btn sec" style="display:block;width:100%;text-align:left;margin:3px 0" data-clv="${esc(t.id)}" data-i="${i}">${c.klaar?"✅":"⬜"} ${esc(c.tekst)}</button>`).join("")}</div>`}
  if(t.terugkerend_id)extra+=`<div class="tk-meta">🔁 Terugkerende taak</div>`;
  act+=`<button class="tk-btn sec" data-cl="${esc(t.id)}">☑️ Checklist</button>`;
  act+=`<button class="tk-btn sec" data-spoor="${esc(t.id)}">🕘 Spoor</button><button class="tk-btn sec" data-weg="${esc(t.id)}">🗑 Weg</button>`; /* TAKEN_WEEK_V1 */
  /* DOSSIER_V1 punt 4: agenda, route, bellen en WhatsApp direct vanuit de taak (verstuurt niets; Robin tikt zelf) */
  act+=snelActies(t,!!r);
  if(t.notities&&t.notities.length)extra+=t.notities.slice(-3).map(n=>`<div class="tk-meta">🗒 ${esc(n.tekst)}${n.door?" ("+esc(n.door)+")":""}</div>`).join("");
  if(t.fotos&&t.fotos.length)extra+=`<div class="tk-meta"><button type="button" class="tk-link" data-fotos="${esc(t.id)}">📷 ${t.fotos.length} foto${t.fotos.length>1?"'s":""} bekijken</button></div><div class="tk-fotos" id="f-${esc(t.id)}"></div>`;
  const form=`<div class="tk-notitie" id="n-${esc(t.id)}">
    <textarea id="nt-${esc(t.id)}" placeholder="Korte notitie (wordt in het dossier bewaard)"></textarea>
    <div class="tk-row"><button type="button" class="tk-btn tk-mic" data-mic="${esc(t.id)}" title="Inspreken">🎤</button>
    <input id="nv-${esc(t.id)}" placeholder="Optioneel: vervolgtaak">
    <input id="nq-${esc(t.id)}" placeholder="Optioneel: vraag voor Robin"></div>
    <div class="tk-row"><button class="tk-btn prim" data-ok="${esc(t.id)}">Opslaan en afvinken</button>
    <button class="tk-btn sec" data-ann="${esc(t.id)}">Annuleren</button></div>
  </div>`;
  return `<article class="tk-card${late}" data-id="${esc(t.id)}"><h3>${esc(t.titel)} ${chips}</h3>
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
  else if(seg===TAKEN_SEG||seg===WACHT_SEG)tekenLijst();  /* NAV_V1: meteen de bekende lijst, nooit de vorige pagina laten staan */
  laadEnTeken();
}

async function laadEnTeken(stil){
  try{
    TAKEN=await api("/taken");
    if(typeof window.navWacht==="function")navWacht(wachtAantal());
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
    if(tkBezig())return; /* AZ_FIX1: nooit hertekenen terwijl Robin iets invult */
    if(seg===TAKEN_SEG||seg===VD||seg===VR_SEG||seg===AUTO_SEG||seg===WACHT_SEG)
      laadEnTeken(true);
  },5000);
}

/* TAKEN_MW_V3 (t668u): restlijst = wat gisteren (of eerder) bleef liggen of niet kon */
function restBlok(){const R=(TAKEN&&TAKEN.restlijst)||[];if(!R.length)return"";
  return `<section class="tk-wacht tk-rest"><h3>🌙 Bleef liggen <span class="cnt">${R.length}</span></h3>${R.map(x=>`<div class="tk-meta"><b>${esc(x.titel)}</b>${x.voor?" — "+esc(x.voor):""} · ${esc(x.label)} ${esc(x.dag_tekst)}</div>`).join("")}</section>`}
function tekenLijst(){
  const cards=$("#cards");if(!cards||!TAKEN)return;
  const meds=(TAKEN.gebruikers||[]).map(u=>u.naam);
  const autos=[...new Set((TAKEN.taken||[]).map(t=>t.auto).filter(Boolean))];
  const openV=(TAKEN.vragen||[]).filter(v=>v.status==="open");
  if(seg===WACHT_SEG){
    cards.innerHTML=`<div class="tk-wrap"><div class="tk-warn"><b>Wacht op jou (Robin)</b> Antwoorden gaan via Telegram naar de medewerker die de vraag stelde. Geen bundel in de ochtendmail.</div>${window.TK_WEEK?TK_WEEK.conceptBlok(TAKEN,false):""}${wachtBlok(openV,false)}</div>`;
    bind();return;
  }
  const {taken,vragen}=filterItems(TAKEN);
  const fb=[['open','Open'],['vandaag','Vandaag'],['te_laat','Te laat'],['wacht_op_robin','Wacht op jou'],['klaar','Klaar']];
  const filters=fb.map(([k,l])=>`<button class="${FILT===k?"on":""}" data-f="${k}">${l}</button>`).join("");
  const sub=`<div class="tk-sub">
    <select id="tk-med"><option value="">Alle medewerkers</option>${meds.map(n=>`<option ${MED===n?"selected":""}>${esc(n)}</option>`).join("")}</select>
    <select id="tk-auto"><option value="">Alle auto’s</option>${autos.map(n=>`<option ${AUTO===n?"selected":""}>${esc(n)}</option>`).join("")}</select>
  </div>`;
  const vragenHtml=FILT==="wacht_op_robin"?((window.TK_WEEK?TK_WEEK.conceptBlok(TAKEN,false):"")+wachtBlok(openV,false)):(openV.length?wachtBlok(openV,true):"");
  const lijst=(FILT==="wacht_op_robin"?"":taken.map(kaart).join(""))|| (FILT==="wacht_op_robin"?"":`<div class="tk-leeg">Niets in dit filter.</div>`);
  const medBlok=`<div class="tk-med"><b>Medewerkers</b> <button type="button" class="btn sm" onclick="window.RB_TEAM&&RB_TEAM.open()">👤 Medewerker toevoegen</button><br>
    ${(TAKEN.gebruikers||[]).map(gebruikerLabel).join(" · ")}</div>`;
  cards.innerHTML=`<div class="tk-wrap">
    <div class="tk-warn"><b>Openbare site · live van de server</b>${esc(TAKEN.waarschuwing||"Telefoonnummers van bedrijven zijn zichtbaar op deze site. Alleen zakelijke nummers.")}</div>
    ${seintjeBlok()}${restBlok()}${window.TK_WEEK?TK_WEEK.balk(TAKEN):""}${nieuwBlok(meds)}<div class="tk-filters">${filters}</div>${sub}${vragenHtml}${lijst}${tkrBlok()}${medBlok}</div>`;
  bind();conceptTerug();
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
  document.querySelectorAll("[data-ics]").forEach(b=>b.onclick=()=>{const t=((TAKEN&&TAKEN.taken)||[]).find(x=>x.id===b.dataset.ics);if(t)tkIcs(t)});
  document.querySelectorAll("[data-klaar]").forEach(b=>b.onclick=()=>{const id=b.dataset.klaar,el=document.getElementById("n-"+id);if(el)el.classList.add("on")});
  document.querySelectorAll("[data-ann]").forEach(b=>b.onclick=()=>{const el=document.getElementById("n-"+b.dataset.ann);if(el)el.classList.remove("on");conceptWeg(b.dataset.ann)});
  const tkn=document.getElementById("tkn-ok");if(tkn)tkn.onclick=tkNieuw;
  document.querySelectorAll("[data-ok]").forEach(b=>b.onclick=()=>klaar(b.dataset.ok));
  document.querySelectorAll("[data-bezig]").forEach(b=>b.onclick=()=>bezig(b.dataset.bezig));
  document.querySelectorAll("[data-heropen]").forEach(b=>b.onclick=()=>heropen(b.dataset.heropen));
  document.querySelectorAll("[data-fotos]").forEach(b=>b.onclick=()=>fotos(b.dataset.fotos));
  document.querySelectorAll("[data-audio]").forEach(b=>b.onclick=()=>spraakAf(b.dataset.audio));
  document.querySelectorAll("[data-nr]").forEach(b=>b.onclick=()=>nummerAanpassen(b.dataset.nr));
  document.querySelectorAll("[data-mic]").forEach(b=>b.onclick=()=>inspreken(b.dataset.mic));
  document.querySelectorAll("[data-ant]").forEach(b=>b.onclick=()=>antwoord(b.dataset.ant,b.dataset.soort));
  document.querySelectorAll("[data-toew]").forEach(s=>s.onchange=()=>toewijzen(s.dataset.toew,s.value));
  document.querySelectorAll("[data-clv]").forEach(b=>b.onclick=()=>clVink(b.dataset.clv,b.dataset.i));
  document.querySelectorAll("[data-cl]").forEach(b=>b.onclick=()=>clZet(b.dataset.cl));
  document.querySelectorAll("[data-tkr-stop]").forEach(b=>b.onclick=()=>tkrStop(b.dataset.tkrStop));
  const tn=document.getElementById("tkr-nieuw");if(tn)tn.onclick=tkrNieuw;
}
/* TAKEN_EXTRA_V1: checklist en terugkerende taken (alleen Robins ingang; medewerkers vinken af op hun eigen pagina) */
async function clVink(id,i){try{await api("/taken/"+id+"/checklist/"+i,"POST",{});TAKEN=await api("/taken");tekenLijst()}catch(e){alert(e.message)}}
async function clZet(id){
  const t=(TAKEN.taken||[]).find(x=>x.id===id);const nu=((t&&t.checklist)||[]).map(c=>c.tekst).join("; ");
  const p=prompt("Checklist-punten, gescheiden door ; (leeg = checklist weg)",nu);if(p===null)return;
  try{await api("/taken/"+id+"/checklist","POST",{punten:p});TAKEN=await api("/taken");tekenLijst()}catch(e){alert(e.message)}
}
async function tkrNieuw(){
  const titel=prompt("Terugkerende taak, bijv. Showroom stofzuigen");if(!titel)return;
  const ritme=prompt("Hoe vaak? Bijv. elke dag, elke werkdag, elke maandag, elke maand op de 1e","elke maandag");if(!ritme)return;
  const voor=prompt("Voor wie? (leeg = niet toegewezen)","")||"";
  const cl=prompt("Checklist (optioneel), punten gescheiden door ;","")||"";
  try{await api("/taken/terugkerend","POST",{titel,ritme,voor,checklist:cl});TAKEN=await api("/taken");tekenLijst()}catch(e){alert(e.message)}
}
async function tkrStop(id){if(!confirm("Deze terugkerende taak stoppen? Bestaande taken blijven staan."))return;try{await api("/taken/terugkerend/"+id+"/stop","POST",{});TAKEN=await api("/taken");tekenLijst()}catch(e){alert(e.message)}}
function tkrBlok(){
  const R=(TAKEN.terugkerend||[]).filter(r=>r.actief);
  return `<div class="tk-med"><b>🔁 Terugkerende taken</b> <button class="tk-btn sec" id="tkr-nieuw">+ Nieuw</button><br>${R.length?R.map(r=>`${esc(r.titel)} · ${esc(r.ritme_tekst)}${r.voor?" · "+esc(r.voor):""}${(r.checklist||[]).length?" · ☑️ "+r.checklist.length:""} <button type="button" class="tk-link" data-tkr-stop="${esc(r.id)}">stoppen</button>`).join("<br>"):"Nog geen. Ze worden elke ochtend vanzelf als gewone taak klaargezet."}</div>`;
}
function seintjeBlok(){
  const s=TAKEN.seintje_te_laat,v=TAKEN.seintje_stadagen;let h="";
  if(s&&s.items&&s.items.length)h+=`<div class="tk-warn"><b>🔔 ${esc(s.tekst)}</b>${s.items.slice(0,8).map(x=>`<br>${esc(x.titel)} · ${esc(x.voor)} · uiterlijk ${esc(dag(x.deadline))}`).join("")}</div>`;
  if(v&&v.items&&v.items.length)h+=`<div class="tk-warn"><b>🔔 ${esc(v.tekst)}</b>${v.items.slice(0,8).map(x=>`<br>${esc(x.titel)} · ${x.dagen} dagen`).join("")}</div>`;
  return h;
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
  if(BEZIG_MET["a"+id])return; /* AZ_FIX2: dubbel tikken = één antwoord (en één bericht aan de medewerker) */
  BEZIG_MET["a"+id]=1;
  try{
    await api("/taken/vragen/"+id+"/antwoord","POST",body);
    conceptZet("na-"+id,"");
    TAKEN=await api("/taken");tekenLijst();
    if(seg===VD)takenVandaagBlok();
  }catch(e){alert(tkFout(e))}
  finally{delete BEZIG_MET["a"+id]}
}

async function toewijzen(id,voor){
  try{
    await api("/taken/"+id+"/toewijzen","POST",{voor,door:"Robin"});
    TAKEN=await api("/taken");tekenLijst();
  }catch(e){alert(e.message)}
}

async function spraakAf(id){const el=document.getElementById("au-"+id);if(!el)return;if(el.innerHTML){el.innerHTML="";return}
  el.textContent="Laden…";try{const r=await api("/taken/"+id+"/audio");el.innerHTML=(r.audio||[]).map(a=>a.src&&/^data:audio\/(mp4|ogg);base64,[A-Za-z0-9+\/=]+$/.test(a.src)?`<div class="tk-meta">${a.door?esc(a.door)+" · ":""}${esc(String(a.ts||"").slice(11,16))}</div><audio controls preload="none" src="${a.src}"></audio>`:`<span class="tk-meta">(spraakbericht niet meer beschikbaar)</span>`).join("")}catch(e){el.textContent="Afspelen lukte niet: "+e.message}}
async function fotos(id){const el=document.getElementById("f-"+id);if(!el)return;if(el.innerHTML){el.innerHTML="";return}
  el.textContent="Laden…";try{const r=await api("/taken/"+id+"/fotos");el.innerHTML=(r.fotos||[]).map(f=>f.src&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(f.src)?`<img src="${f.src}" alt="foto${f.door?" van "+esc(f.door):""}" loading="lazy">`:`<span class="tk-meta">(foto niet meer beschikbaar)</span>`).join("")}catch(e){el.textContent="Foto's laden lukte niet: "+e.message}}
async function bezig(id){if(BEZIG_MET["b"+id])return;BEZIG_MET["b"+id]=1;setTimeout(()=>delete BEZIG_MET["b"+id],4000);try{await api("/taken/"+id+"/status","POST",{status:"bezig"});TAKEN=await api("/taken");tekenLijst()}catch(e){alert(e.message)}}
async function klaar(id){
  if(BEZIG_MET["k"+id])return; /* AZ_FIX2: dubbel tikken = één keer opslaan */
  const tk=((TAKEN&&TAKEN.taken)||[]).find(x=>x.id===id),open=((tk&&tk.checklist)||[]).filter(c=>!c.klaar); /* HEROPEN_V1: open checklist? eerst vragen */
  if(open.length&&!confirm("Nog "+open.length+(open.length===1?" punt":" punten")+" open:\n"+open.slice(0,6).map(c=>"• "+c.tekst).join("\n")+(open.length>6?"\n…":"")+"\n\nToch klaar?"))return;
  const notitie=(document.getElementById("nt-"+id)||{}).value||"";
  const vervolg=(document.getElementById("nv-"+id)||{}).value||"";
  const vraag=(document.getElementById("nq-"+id)||{}).value||"";
  BEZIG_MET["k"+id]=1;const knop=document.querySelector(`[data-ok="${id}"]`);if(knop){knop.disabled=true;knop.textContent="Opslaan…"}
  try{
    await api("/taken/"+id+"/klaar","POST",{notitie,vervolg,vraag_robin:vraag});
    conceptWeg(id);TAKEN=await api("/taken");tekenLijst();ongedaanBalk(id,tk?tk.titel:"Taak");
  }catch(e){alert(tkFout(e))}
  finally{delete BEZIG_MET["k"+id];const k2=document.querySelector(`[data-ok="${id}"]`);if(k2&&k2.disabled){k2.disabled=false;k2.textContent="Opslaan en afvinken"}}
}
/* HEROPEN_V1 (t654u punt 4): 15 s 'Ongedaan maken' na afvinken; daarna via filter Klaar > Heropenen */
function ongedaanBalk(id,titel){let b=document.getElementById("tk-ongedaan");if(b)b.remove();b=document.createElement("div");b.id="tk-ongedaan";b.setAttribute("role","status");
  b.style.cssText="position:fixed;left:10px;right:10px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:9998;background:#1d2a22;color:#fff;border-radius:12px;padding:10px 12px;display:flex;gap:10px;align-items:center;justify-content:space-between;box-shadow:0 4px 16px rgba(0,0,0,.3)";
  b.innerHTML=`<span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">✅ Afgevinkt: ${esc(titel)}</span><button class="tk-btn prim" style="flex:none">Ongedaan maken</button>`;
  b.querySelector("button").onclick=()=>{b.remove();heropen(id)};document.body.appendChild(b);setTimeout(()=>{if(b.isConnected)b.remove()},15000)}
async function heropen(id){if(BEZIG_MET["h"+id])return;BEZIG_MET["h"+id]=1;
  try{const r=await api("/taken/"+id+"/status","POST",{status:"open",door:"Robin"});TAKEN=await api("/taken");tekenLijst();
    alert("Taak staat weer open."+(r&&r.vervolg_weg?" De automatische vervolgtaak is ook weer weggehaald.":""))}catch(e){alert(tkFout(e))}finally{delete BEZIG_MET["h"+id]}}
/* AZ_FIX1: concepten (half ingevulde notitie, vervolgtaak, vraag, antwoord, nieuwe taak) blijven bewaard,
   ook bij herladen of de app sluiten. Weg na opslaan of Annuleren. */
function conceptAlles(){try{return JSON.parse(localStorage[CK]||"{}")||{}}catch(e){return {}}}
function conceptZet(veld,waarde){const c=conceptAlles();if(waarde&&String(waarde).trim())c[veld]={v:String(waarde).slice(0,4000),t:Date.now()};else delete c[veld];try{localStorage[CK]=JSON.stringify(c)}catch(e){}}
function conceptWeg(id){const c=conceptAlles();["nt-","nv-","nq-","na-"].forEach(p=>delete c[p+id]);try{localStorage[CK]=JSON.stringify(c)}catch(e){}}
function conceptTerug(){
  const c=conceptAlles(),oud=Date.now()-14*864e5;let weg=false;
  Object.keys(c).forEach(k=>{if(!c[k]||c[k].t<oud){delete c[k];weg=true;return}
    const el=document.getElementById(k);if(!el)return;if(!el.value)el.value=c[k].v;
    const m=k.match(/^n[tvq]-(.+)$/);if(m){const f=document.getElementById("n-"+m[1]);if(f)f.classList.add("on")}});
  if(weg)try{localStorage[CK]=JSON.stringify(c)}catch(e){}
}
function tkBezig(){
  const a=document.activeElement;
  if(a&&(a.tagName==="TEXTAREA"||(a.tagName==="INPUT"&&a.type!=="button")||a.tagName==="SELECT")&&a.closest&&a.closest("#cards"))return true;
  if(document.querySelector("#cards .tk-notitie.on"))return true;
  return Object.keys(BEZIG_MET).length>0;
}
function tkFout(e){const m=(e&&e.message)||"";return (e&&e.net)||/fetch|network|netwerk|load failed/i.test(m)?"Geen verbinding. Er is nog niets opgeslagen; je tekst blijft bewaard. Probeer het zo opnieuw.":(m||"Er ging iets mis. Probeer het opnieuw.")}
document.addEventListener("change",e=>{const t=e.target;if(t&&(t.id==="tkn-voor"||t.id==="tkn-dl"))conceptZet(t.id,t.value)});
document.addEventListener("input",e=>{const t=e.target;if(t&&t.id&&/^(nt|nv|nq|na|tkn)-/.test(t.id)&&t.closest&&t.closest("#cards"))conceptZet(t.id,t.value)});
/* AZ_FIX3: Robin kan op de site zelf een gewone taak aanmaken (de knop Taak opende alleen deze lijst) */
function nieuwBlok(meds){
  return `<div class="tk-card tk-nieuw"><h3>➕ Nieuwe taak</h3>
    <input id="tkn-titel" placeholder="Wat moet er gebeuren? Bijv. Banden bestellen voor de M5" maxlength="300" style="width:100%;box-sizing:border-box">
    <div class="tk-row"><select id="tkn-voor"><option value="">Niet toegewezen</option>${meds.map(n=>`<option>${esc(n)}</option>`).join("")}</select>
    <label class="tk-meta">Uiterlijk <input id="tkn-dl" type="date"></label></div>
    <div class="tk-row"><button type="button" class="tk-btn prim" id="tkn-ok">Taak toevoegen</button></div></div>`;
}
async function tkNieuw(){
  if(BEZIG_MET.nieuw)return;
  const ti=document.getElementById("tkn-titel"),titel=((ti&&ti.value)||"").trim();
  if(!titel){alert("Typ eerst wat er moet gebeuren.");if(ti)ti.focus();return}
  const voor=(document.getElementById("tkn-voor")||{}).value||"",deadline=(document.getElementById("tkn-dl")||{}).value||"";
  BEZIG_MET.nieuw=1;const b=document.getElementById("tkn-ok");if(b){b.disabled=true;b.textContent="Opslaan…"}
  try{const it={titel,soort:"taak"};if(voor)it.voor=voor;if(deadline)it.deadline=deadline;
    let r=await api("/taken","POST",{items:[it],bron:"robin-site",check_dubbel:true});
    if(r.dubbel&&r.dubbel.length){if(!confirm(r.dubbel.join("\n")+"\n\nToch toevoegen?"))return;r=await api("/taken","POST",{items:[it],bron:"robin-site"})}
    if(!(r.opgeslagen||[]).length)throw new Error("De taak is niet opgeslagen. Probeer het opnieuw.");
    ["tkn-titel","tkn-voor","tkn-dl"].forEach(k=>conceptZet(k,""));delete BEZIG_MET.nieuw;
    TAKEN=await api("/taken");tekenLijst();if(typeof toast==="function")try{toast("Taak toegevoegd")}catch(e){}
  }catch(e){alert(tkFout(e))}
  finally{delete BEZIG_MET.nieuw;const b2=document.getElementById("tkn-ok");if(b2){b2.disabled=false;b2.textContent="Taak toevoegen"}}
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
    <p class="ihulp">Toevoegen: Meer → 👤 Medewerker toevoegen. Vul de naam in en stuur de link zelf via WhatsApp. De medewerker tikt erop, daarna op Start in Telegram, en is gekoppeld. Geen Telegram? Maak daar een link zonder Telegram. Verwijderen kan ook daar; dan werkt de link niet meer. Chat-id’s en links staan nooit op deze pagina.</p>
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
    const VS=TAKEN.vandaag&&TAKEN.vandaag.vandaag?TAKEN.vandaag:null; /* TAKEN_SPOOR_V1: zelfde Vandaag als Telegram en Team-app */
    const vandaagT=VS?open.filter(t=>VS.vandaag.includes(t.id)):open.filter(t=>(t.deadline||"").slice(0,10)===v);
    const laat=VS?open.filter(t=>(VS.te_laat||[]).includes(t.id)):open.filter(t=>{const d=(t.deadline||"").slice(0,10);return d&&d<v});
    const zdN=VS?(VS.zonder_dag||[]).length:open.filter(t=>!t.deadline).length;
    const vr=(TAKEN.vragen||[]).filter(x=>x.status==="open");
    if(typeof window.navWacht==="function")navWacht(wachtAantal());
    /* NAV_V1 (t615u): "Wacht op jou" als eerste blok bovenaan Vandaag, daarna "Te doen vandaag" */
    let w=document.getElementById("tk-wacht-vd");
    if(!w){w=document.createElement("section");w.id="tk-wacht-vd";w.className="vb";host.insertBefore(w,host.firstChild)}
    let el=document.getElementById("tk-vandaag");
    if(!el){el=document.createElement("section");el.id="tk-vandaag";el.className="vb";w.insertAdjacentElement("afterend",el)}
    const rij=t=>`<li class="vr"><div class="vr-m"><div class="vr-t">${esc(t.titel)}${t.auto?" · "+esc(t.auto):""}</div><div class="vr-s">${t.deadline?"uiterlijk "+esc(dag(t.deadline))+(t.tijd?" "+esc(t.tijd):""):""}${t.voor?" · "+esc(t.voor):""}${isTeLaat(t)?" · te laat":""}</div></div></li>`;
    const lijst=[...laat.map(rij),...vandaagT.map(rij)].join("")||"";
    const vg=TAKEN.voortgang&&TAKEN.voortgang.totaal,vgTxt=vg?`<div class="meta tk-vg">Vandaag: ${vg.klaar_vandaag} klaar · ${vg.bezig} bezig · ${vg.open} open${vg.te_laat?" · "+vg.te_laat+" te laat":""}${Object.keys(TAKEN.voortgang.personen||{}).length>1?`<br>${Object.entries(TAKEN.voortgang.personen).map(([w,p])=>esc(w)+": "+p.klaar_vandaag+" klaar, "+p.bezig+" bezig, "+p.open+" open").join("<br>")}`:""}</div>`:"";
    el.innerHTML=`<h3>Te doen vandaag <span class="cnt">${vandaagT.length+laat.length}</span></h3>${vgTxt}
      ${lijst?`<ul class="vl">${lijst}</ul>`:`<div class="meta">Niets met deadline vandaag.</div>`}
      ${zdN?`<div class="meta">Zonder dag: ${zdN} open taak/taken (staan op het weekbord).</div>`:""}
      <div class="meta"><button type="button" class="btn sm ghost" data-gotab="19" data-ga-route="taken">Open Taken</button></div>`;
    const CN=(TAKEN.concepten||[]).length,cnTxt=CN?(window.TK_WEEK?TK_WEEK.conceptBlok(TAKEN,true):`<div class="meta">📝 ${CN} concept(en) wachten op je Klopt.</div>`):"";
    w.innerHTML=(vr.length||CN)?`<h3>Wacht op jou (Robin) <span class="cnt">${vr.length+CN}</span></h3>${cnTxt}${vr.map(vraagKaart).join("")}`:`<h3>Wacht op jou (Robin)</h3><div class="meta">Geen vragen voor jou.</div>`;
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
