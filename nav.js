/* NAV_V1 (t614u/t615u, 12-11-2026): één vaste tabbalk onderin (iPhone-app), geen Inkoop/Bedrijf-keuze en geen tabrijen meer.
   Robin: Vandaag · Kansen · Taken · Voorraad · Meer. Elke tab toont precies zijn eigen pagina, ook na wisselen, terugknop,
   herladen, een directe hash-link en met de service-worker-cache. Oude hash-links worden doorgestuurd.
   Wordt als laatste script geladen: de render-wrapper hieronder is de buitenste. */
(function(){
"use strict";
if(typeof render!=="function")return;
const VD=20,TAKEN_SEG=19,VR_SEG=21,AUTO_SEG=22,WACHT_SEG=23;
const $q=s=>document.querySelector(s);
const heeftD=()=>typeof D!=="undefined"&&D&&D.segmenten;
const segVan=id=>heeftD()?D.segmenten.findIndex(x=>x.id===id):-1;
const nul=()=>Math.max(0,segVan("brns"));
/* route -> seg; t = paginatitel; m = groep in Meer (leeg = in de balk) */
const R={
  vandaag:{s:()=>VD,t:""},
  kansen:{s:nul,t:""},
  taken:{s:()=>TAKEN_SEG,t:""},
  voorraad:{s:()=>12,t:""},
  taxatie:{s:()=>13,t:"Taxatie",m:"Werk",ic:"🧮"},
  "mijn-taxaties":{s:()=>13,t:"Taxatie",m:"Werk",ic:"🗂️",l:"Mijn taxaties",na:()=>{const b=document.getElementById("txmijn");if(b)b.scrollIntoView({block:"start"})}},
  historie:{actie:"historie",m:"Werk",ic:"🔎",l:"Historie (kenteken of link)"},
  wachtrij:{s:()=>25,t:"Wachtrij",m:"Werk",ic:"⏳"},
  meldingen:{s:()=>6,t:"Meldingen",m:"Werk",ic:"🔔"},
  pipeline:{s:()=>11,t:"Mijn pipeline",m:"Werk",ic:"📌"},
  autos:{s:()=>AUTO_SEG,t:"Auto's (kenteken, APK, route)",m:"Werk",ic:"🚗",l:"Auto's (kenteken, APK)"},
  bedrijfsvoorraad:{s:()=>VR_SEG,t:"Voorraadstatus",m:"Werk",ic:"📦",l:"Voorraadstatus (gekocht → verkocht)"},
  markt:{s:()=>10,t:"Markt",m:"Lijsten",ic:"📈"},
  bijna:{s:()=>18,t:"Bijna-deals",m:"Lijsten",ic:"🎯",k:()=>typeof KL==="undefined"||KL.bijna!==false},
  trends:{s:()=>16,t:"Trends",m:"Lijsten",ic:"📊"},
  flips:{s:()=>segVan("flips"),t:"Eigen flips",m:"Lijsten",ic:"🔁",k:()=>segVan("flips")>=0},
  veilingen:{s:()=>14,t:"Veilingen",m:"Lijsten",ic:"🔨"},
  rapport:{s:()=>15,t:"Maandrapport",m:"Lijsten",ic:"🗓️"},
  klantwensen:{s:()=>7,t:"Zoekopdrachten klanten",m:"Lijsten",ic:"🧾"},
  volglijst:{s:()=>17,t:"Volglijst",m:"Lijsten",ic:"👀"},
  kansenlijst:{s:()=>24,t:"Kansenlijst (mobile.de)",m:"Lijsten",ic:"🇩🇪"},
  profiel:{s:()=>9,t:"BRNS-profiel",m:"Lijsten",ic:"🏷️",k:()=>typeof P!=="undefined"&&!!P},
  uitleg:{s:()=>8,t:"Uitleg",m:"Systeem",ic:"ⓘ"},
  instellingen:{actie:"instellingen",m:"Systeem",ic:"⚙️",l:"Instellingen"},
  weergave:{actie:"weergave",m:"Systeem",ic:"🌓",l:"Weergave"}
};
/* oude hash-links -> nieuwe route (redirect, t615u) */
const OUD={inkoop:"vandaag",bedrijf:"taken","wacht-op-robin":"vandaag",wacht:"vandaag","voorraad-bedrijf":"bedrijfsvoorraad",
  prijstrends:"markt",inkoopkansen:"kansen",start:"vandaag",taxaties:"taxatie",profiel:"profiel"};
const BALK=[["vandaag","Vandaag","☀️"],["kansen","Kansen","🚘"],["taken","Taken","✅"],["voorraad","Voorraad","📦"],["meer","Meer","☰"]];
const SPECIAAL=/^(deal-|taxatie-|historie|instellingen$)/;
let WACHT_N=0;

function routeVanSeg(s){
  if(s===WACHT_SEG)return "vandaag";
  if(s===nul())return "kansen";
  for(const k of Object.keys(R)){const r=R[k];if(r.s&&k!=="mijn-taxaties"&&r.s()===s)return k}
  return null;
}
function balkVanRoute(k){return ["vandaag","kansen","taken","voorraad"].includes(k)?k:"meer"}
function hashNaam(){return decodeURIComponent((location.hash||"").replace(/^#/,""))}

function zetSeg(k){
  const r=R[k];if(!r||!r.s)return false;
  seg=r.s();
  try{SH=null;NA=false;sort="standaard";open={}}catch(e){}
  const fm=document.getElementById("f-merk");if(fm)fm.value="";
  return true;
}
function toon(k,opt){
  opt=opt||{};
  if(!heeftD())return;
  const r=R[k];
  if(!r)return;
  if(r.actie){actie(r.actie);return}
  zetSeg(k);
  render();
  if(!opt.geenScroll)scrollTo(0,0);
  if(r.na)setTimeout(r.na,350);
  if(opt.wacht)setTimeout(()=>{const w=document.getElementById("tk-wacht-vd");if(w)w.scrollIntoView({block:"start"})},350);
}
function ga(k){
  sluitMeer();
  const r=R[k];
  if(r&&r.actie){actie(r.actie);return}
  if(hashNaam()===k){toon(k);return}
  location.hash="#"+k;  // hashchange -> toon(); terugknop werkt zo vanzelf
}
function actie(a){
  sluitMeer();
  if(a==="historie"){if(window.HISTORIE&&HISTORIE.open)HISTORIE.open("");return}
  if(a==="instellingen"){if(typeof window.openInstellingen==="function")openInstellingen();return}
  if(a==="weergave"){const b=document.getElementById("thema");if(b)b.click();teken();return}
}

/* ---------- kop ---------- */
function kop(){
  const h=$q("header.top");if(!h)return;
  const t=h.querySelector(".brand h1");
  const naam=(typeof KL!=="undefined"&&(KL.naam||KL.app_naam))||"Dealoverzicht";
  if(t&&t.textContent!==naam)t.textContent=naam;
  if(!document.getElementById("nav-zoek")){
    const b=document.createElement("button");b.id="nav-zoek";b.type="button";b.setAttribute("aria-label","Historie zoeken op kenteken of link");
    b.innerHTML='<span aria-hidden="true">🔎</span><span>Historie</span>';b.onclick=()=>actie("historie");h.appendChild(b);
  }
}
/* ---------- balk onderin ---------- */
function balk(){
  let b=document.getElementById("nav-bar");
  if(!b){
    b=document.createElement("nav");b.id="nav-bar";b.setAttribute("aria-label","Hoofdmenu");
    b.innerHTML=BALK.map(([k,l,ic])=>`<button type="button" data-nav="${k}" aria-label="${l}"><span class="ic" aria-hidden="true">${ic}</span><span>${l}</span></button>`).join("");
    document.body.appendChild(b);
    b.addEventListener("click",e=>{const x=e.target.closest("[data-nav]");if(!x)return;e.preventDefault();
      if(x.dataset.nav==="meer")openMeer();else ga(x.dataset.nav)});
  }
  const akt=balkVanRoute(routeVanSeg(seg)||"vandaag");
  b.querySelectorAll("[data-nav]").forEach(x=>{const on=x.dataset.nav===akt;x.classList.toggle("on",on);if(on)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current")});
  const v=b.querySelector('[data-nav="vandaag"]');
  if(v){let bd=v.querySelector(".bdg");if(WACHT_N>0){if(!bd){bd=document.createElement("span");bd.className="bdg";v.appendChild(bd)}bd.textContent=WACHT_N;v.setAttribute("aria-label","Vandaag, "+WACHT_N+" wacht op jou")}else if(bd)bd.remove()}
}
/* ---------- Meer ---------- */
function meerHtml(){
  const akt=routeVanSeg(seg);
  const groepen={};
  Object.keys(R).forEach(k=>{const r=R[k];if(!r.m)return;if(r.k&&!r.k())return;(groepen[r.m]=groepen[r.m]||[]).push(k)});
  const ur=typeof unread==="function"?unread():0;
  const weergave=({auto:"automatisch",licht:"licht",donker:"donker"})[localStorage.thema||"auto"]||"automatisch";
  return `<div class="bg" data-meer-sluit></div><div class="sh" role="dialog" aria-label="Meer"><div class="grip"></div>${
    Object.keys(groepen).map(g=>`<h4>${g}</h4>`+groepen[g].map(k=>{const r=R[k];
      const lab=k==="weergave"?`Weergave: ${weergave}`:(r.l||r.t);
      const bd=k==="meldingen"&&ur?`<span class="bdg">${ur}</span>`:"";
      return `<button type="button" class="nav-m${akt===k?" on":""}" data-ga="${k}"><span class="ic" aria-hidden="true">${r.ic||"•"}</span><span>${lab}</span>${bd}</button>`}).join("")).join("")
  }<button type="button" class="sluit" data-meer-sluit>Sluiten</button></div>`;
}
function openMeer(){
  let m=document.getElementById("nav-meer");
  if(!m){m=document.createElement("div");m.id="nav-meer";document.body.appendChild(m);
    m.addEventListener("click",e=>{if(e.target.closest("[data-meer-sluit]")){sluitMeer();return}
      const x=e.target.closest("[data-ga]");if(x)ga(x.dataset.ga)})}
  m.innerHTML=meerHtml();m.classList.add("open");document.body.style.overflow="hidden";
}
function sluitMeer(){const m=document.getElementById("nav-meer");if(m&&m.classList.contains("open")){m.classList.remove("open");document.body.style.overflow=""}}
document.addEventListener("keydown",e=>{if(e.key==="Escape")sluitMeer()});

/* ---------- paginatitel en hash gelijk houden met de getoonde pagina ---------- */
function titel(){
  const c=document.getElementById("cards");if(!c)return;
  let t=document.getElementById("nav-titel");
  if(!t){t=document.createElement("h2");t.id="nav-titel";const k=document.getElementById("kpis");(k||c).parentElement.insertBefore(t,k||c)}
  const k=routeVanSeg(seg);const r=k&&R[k];
  const tekst=r&&r.m?(r.t||""):"";
  if(t.textContent!==tekst)t.textContent=tekst;
}
function syncHash(){
  const h=hashNaam();
  if(SPECIAAL.test(h))return;
  const k=routeVanSeg(seg);if(!k)return;
  if(h===k||(h==="mijn-taxaties"&&k==="taxatie"))return;
  try{history.replaceState(history.state,"",location.pathname+location.search+"#"+k)}catch(e){}
}
function teken(){kop();balk();titel();syncHash()}

/* ---------- render-wrapper (buitenste) + uitleg alleen op de eigen tab ---------- */
const _render=render;
render=function(){window.__NAVSEG=seg;const r=_render.apply(this,arguments);try{teken()}catch(e){}return r};
if(typeof window.uitleg==="function"){
  const _u=window.uitleg;
  window.uitleg=function(){
    // Andere pagina's (Vandaag, Taken, Wachtrij, Kansenlijst) renderen tijdelijk als seg 8 en vullen daarna zelf de pagina.
    // Nooit de uitlegkaarten daar tussendoor laten staan.
    if(window.__NAVSEG!==undefined&&window.__NAVSEG!==8){const c=document.getElementById("cards");if(c)c.innerHTML='<div class="nav-laden">Laden…</div>';return}
    return _u.apply(this,arguments);
  };
}
/* startpagina: hash wint; oude hashes doorsturen */
function startRoute(){
  let h=hashNaam();
  if(SPECIAAL.test(h))return null;
  let wacht=false;
  if(OUD[h]&&!R[h]||h==="wacht"||h==="wacht-op-robin"){wacht=(h==="wacht"||h==="wacht-op-robin");const n=OUD[h];try{history.replaceState(null,"",location.pathname+location.search+"#"+n)}catch(e){}h=n}
  if(!h)return {k:"vandaag"};
  return R[h]?{k:h,wacht}:null;
}
if(typeof startSeg==="function"){
  const _s=startSeg;
  startSeg=function(){_s.apply(this,arguments);const r=startRoute();if(r&&!(R[r.k]&&R[r.k].actie))zetSeg(r.k);
    if(r&&r.wacht)setTimeout(()=>{const w=document.getElementById("tk-wacht-vd");if(w)w.scrollIntoView({block:"start"})},900);
    if(r&&R[r.k]&&R[r.k].na)setTimeout(R[r.k].na,900)};
}
addEventListener("hashchange",()=>{
  let h=hashNaam();
  if(SPECIAAL.test(h))return;
  let wacht=false;
  if(OUD[h]&&!R[h]||h==="wacht"||h==="wacht-op-robin"){wacht=(h==="wacht"||h==="wacht-op-robin");const n=OUD[h];try{history.replaceState(null,"",location.pathname+location.search+"#"+n)}catch(e){}h=n}
  if(!h)h="vandaag";
  if(R[h])toon(h,{wacht:wacht&&h==="vandaag"});
});
/* knoppen in pagina's die naar een tab springen ("Open Taken" op Vandaag, data-gotab) */
document.addEventListener("click",e=>{
  const g=e.target.closest&&e.target.closest("[data-gotab],[data-ga-route]");
  if(!g||g.closest("#nav-meer"))return;
  e.preventDefault();e.stopPropagation();
  const k=g.dataset.gaRoute||routeVanSeg(+g.dataset.gotab);
  if(k)ga(k);
},true);
/* badge "Wacht op jou" (open vragen voor Robin) */
window.navWacht=function(n){n=+n||0;if(n!==WACHT_N){WACHT_N=n;try{balk()}catch(e){}}};
window.NAV={ga,toon,routes:R,routeVanSeg,openMeer,sluitMeer};
kop();balk();
if(heeftD())render();
})();
