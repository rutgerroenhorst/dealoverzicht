// BUITENLAND_EERST_V1 + BIED_APART_V1 (12-11-2026). Alleen volgorde en zichtbaarheid: geen marge- of fiscale regel.
// - Buitenland eerst (standaard aan; Instellingen > Volgorde, of de knop "Buitenland eerst" bij Inkoopkansen): buitenlandse deals bovenaan,
//   binnen elke groep de bestaande sortering. Land onbekend telt als onbekend, niet als buitenland.
// - Bied-/veilingadvertenties (Marktplaats "Bieden vanaf", veilingkavels, "Gebote", "prijs op aanvraag") staan apart onderaan onder
//   "Bieden / veiling": het startbod is geen vaste prijs. In Telegram worden ze niet als gewone deal gemeld (pipeline/biedadv.py).
(function(root){
"use strict";
const VEIL=/drz|domeinen|onlineveilingmeester|catawiki|bringatrailer|bring a trailer|autorola|troostwijk|vavato/i;
const TIT=/\bbieden\b|\bbod\s+vanaf\b|\bvanaf[- ]?bod\b|\bgebote?\b|\bpreis\s+auf\s+anfrage\b|\bprijs\s+op\s+aanvraag\b|\bn\.?\s?o\.?\s?t\.?\s?k\.?(?=\s|$)|\bveiling\b|\bkavel\b|\bauction\b/i;
const NORM={D:"DE",B:"BE",F:"FR",A:"AT",I:"IT",L:"LU",E:"ES"};
const VLAG={NL:"🇳🇱",DE:"🇩🇪",BE:"🇧🇪",FR:"🇫🇷",IT:"🇮🇹",AT:"🇦🇹",LU:"🇱🇺",ES:"🇪🇸",CH:"🇨🇭",DK:"🇩🇰",SE:"🇸🇪",PL:"🇵🇱",CZ:"🇨🇿",GB:"🇬🇧"};
const carVan=d=>d.c||((d.autos||[]).find(a=>a.url===d.deal_url))||(d.autos||[])[0]||d;
function landCode(x){const c=x&&x.autos?carVan(x):(x||{});let l=String(c.land||"").trim().toUpperCase();l=NORM[l]||l;
 if(/^[A-Z]{2}$/.test(l))return l;if(/marktplaats\.nl|autotrack\.nl/.test(String(c.url||x.deal_url||x.url||"")))return"NL";return"onbekend"}
function isBuitenland(x){const l=landCode(x);return l!=="NL"&&l!=="onbekend"}
function biedReden(d){const c=carVan(d);if(c.bod===true||c.pt==="MIN_BID")return"Bieden vanaf (geen vaste prijs)";
 if(VEIL.test(String(c.bron||"")+" "+String(c.url||d.deal_url||""))||d.veiling)return"veilingkavel";
 if(c.pt&&c.pt!=="FIXED")return"prijstype "+c.pt;const m=String(d.titel||c.titel||"").match(TIT);if(m)return`"${m[0].trim()}" in de titel`;
 if(!c.prijs)return"geen vraagprijs";return null}
function aan(){return localStorage.bl_eerst!=="0"}
function zet(v){localStorage.bl_eerst=v?"1":"0"}
// stabiel sorteren: buitenland eerst, bestaande volgorde blijft binnen de groep
function blSort(L,f){return L.map((x,i)=>[x,i]).sort((a,b)=>((!isBuitenland(f?f(a[0]):a[0]))-(!isBuitenland(f?f(b[0]):b[0])))||a[1]-b[1]).map(x=>x[0])}
function volgordeLijst(L,S){const gewoon=L.filter(d=>!biedReden(d)),bied=L.filter(d=>biedReden(d));bied.forEach(d=>{d._bied=biedReden(d)});
 const g=(S&&S.id==="brns"&&aan())?blSort(gewoon):gewoon;return g.concat(bied)}
function volgordeOpvolgen(H){if(!aan())return H;const A=typeof alleDeals==="function"?alleDeals():[];
 return blSort(H,([u])=>A.find(x=>x.deal_url===u)||{})}
Object.assign(root,{landCode,isBuitenland,biedReden,volgordeLijst,volgordeOpvolgen,buitenlandEerstAan:aan,buitenlandEerstZet:zet,blSort});
if(typeof root.kort==="function"){const _k=root.kort;root.kort=function(d){let h=_k(d);try{const l=landCode(d),b=biedReden(d);
 const chip=`<span class="chip land ${l==="NL"?"nl":l==="onbekend"?"onb":"bu"}" title="${l==="onbekend"?"Land niet duidelijk uit de advertentie: telt niet als buitenland":"Land van de advertentie"}">${l==="onbekend"?"Land onbekend":(VLAG[l]||"")+" "+l+(l!=="NL"?" · buitenland":"")}</span>`+(b?`<span class="chip bied" title="Geen vaste vraagprijs; wordt niet als deal in Telegram gemeld">Bieden / veiling: ${b}</span>`:"");
 h=h.replace('<div class="chips">','<div class="chips">'+chip)}catch(e){}return h}}
if(typeof root.render==="function"){const _r=root.render;root.render=function(){_r.apply(this,arguments);try{
 const S=(typeof D!=="undefined"&&D&&typeof seg!=="undefined"&&seg<6)?D.segmenten[seg]:null;if(!S)return;
 const c=document.getElementById("cards");if(c){const f=[...c.querySelectorAll("article.card[id^='deal-']")].find(a=>{const d=S.deals.find(x=>"deal-"+x.id===a.id);return d&&biedReden(d)});
  if(f&&!c.querySelector(".bied-kop"))f.insertAdjacentHTML("beforebegin",`<div class="card wide bied-kop"><h3>Bieden / veiling</h3><div class="meta">Advertenties zonder vaste vraagprijs ("Bieden vanaf", veilingkavels, prijs op aanvraag). De marge is op het startbod gerekend en dus onzeker; ze worden niet als deal in Telegram gemeld.</div></div>`)}
 const so=document.getElementById("sort");if(so&&S.id==="brns"&&!so.querySelector("#bl-eerst")){so.insertAdjacentHTML("beforeend",`<button id="bl-eerst" class="${aan()?"on":""}" title="Buitenlandse deals bovenaan (standaard aan, ook in Instellingen > Volgorde)">Buitenland eerst</button>`);
  so.querySelector("#bl-eerst").addEventListener("click",ev=>{ev.stopPropagation();zet(!aan());root.render()})}
 }catch(e){}}}
document.addEventListener("change",e=>{const t=e.target;if(t&&t.dataset&&t.dataset.p==="volgorde.buitenland_eerst")zet(!!t.checked)});
})(typeof window!=="undefined"?window:globalThis);
