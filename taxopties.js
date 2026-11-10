// Taxatie-opties: lokale elite-filter + automatische catalogus via /api/inst/opties (Hetzner).
// Status per optie: bevestigd / mogelijk / onbekend. "Mogelijk bij model" ≠ aanwezig op deze auto.
Object.assign(OPTL,{airco:"Airco / climate control",cruise:"Cruise control",pdc:"Parkeersensoren",navi:"Navigatie",leder:"Lederen bekleding",xenon:"Xenon- of LED-koplampen",privacy:"Privacy glass",schuifdak:"Schuifdak"});
const TXOPT_INFO=["airco","cruise","pdc","navi","leder","xenon","privacy","schuifdak"];
const TXOPT_VOLGORDE=["airco","cruise","adaptieve_cruise","pdc","camera","navi","leder","stoelverwarming","sportstoelen","xenon","matrix_led","privacy","schuifdak","panorama","trekhaak","keyless","head_up","virtual_cockpit","premium_audio","luchtvering","sportuitlaat","nekverwarming","carbonpakket","keramisch","lift","mulliner","naim_audio"];
const TXP={premium:["audi","bmw","mercedes-benz","porsche","jaguar","land-rover","range-rover","lexus","volvo","tesla","maserati","bentley","rolls-royce","aston-martin","ferrari","lamborghini","mclaren","genesis","polestar","alpina","bugatti","pagani"],exoot:["ferrari","lamborghini","mclaren","bugatti","pagani","koenigsegg"]};
let TXCAT=null,TXCAT_KEY="",TXCAT_LADEN=null;
function txModN(md){return String(md||"").toLowerCase().replace(/\s+/g,"-")}
function txSport(mk,md){mk=txMkN(mk);md=txModN(md);
 if(TXP.exoot.includes(mk))return true;
 if(mk==="audi")return/^(rs|r8)/.test(md);
 if(mk==="bmw")return/^(m\d|m$|i8|z8)/.test(md)||/m[- ]?comp/.test(md);
 if(mk==="mercedes-benz")return/amg|^(sls|slr|amg-gt)/.test(md);
 if(mk==="porsche")return!/^(macan|cayenne|panamera|taycan|924|944|914)/.test(md);
 if(mk==="mini")return/jcw|john|works/.test(md);
 if(["aston-martin","lotus","nissan","chevrolet","maserati","alpine"].includes(mk))return mk==="nissan"?/gt-?r/.test(md):mk==="chevrolet"?/corvette/.test(md):mk==="maserati"?/mc20|mc12/.test(md):true;
 return false}
const txLiftModel=(mk,md)=>{mk=txMkN(mk);md=txModN(md);return TXP.exoot.includes(mk)||mk==="porsche"&&/^(911|99\d|718|cayman|boxster|carrera-gt|918)/.test(md)||mk==="audi"&&/^r8/.test(md)||mk==="mercedes-benz"&&/^(amg-gt|sls)/.test(md)||mk==="chevrolet"&&/corvette/.test(md)||mk==="nissan"&&/gt-?r/.test(md)||mk==="maserati"&&/mc20/.test(md)||mk==="aston-martin"&&/dbs|valkyrie|dbx/.test(md)};
const txKeramModel=(mk,md)=>{mk=txMkN(mk);md=txModN(md);if(["mini","ford","volkswagen","seat","skoda","toyota","honda"].includes(mk))return false;return txSport(mk,md)&&mk!=="lotus"||mk==="porsche"||mk==="bentley"||mk==="audi"&&/^(s8|rs)/.test(md)||mk==="lamborghini"};
function txCabrio(t){return /cabrio|roadster|spider|spyder|convertible|cabriolet/.test(String(t||"").toLowerCase())}
const TXOPT_REGEL={
 keramisch:(mk,md,j)=>txKeramModel(mk,md)&&(!j||j>=2000),
 carbonpakket:(mk,md,j,p,s)=>{if(["mini","ford","volkswagen","seat","skoda"].includes(mk))return false;return(s||["bentley","rolls-royce","aston-martin"].includes(mk)||mk==="porsche")&&(!j||j>=2000)},
 lift:(mk,md,j)=>txLiftModel(mk,md)&&(!j||j>=2004),
 mulliner:mk=>mk==="bentley",
 naim_audio:mk=>mk==="bentley",
 nekverwarming:(mk,md,j)=>{if(!["mercedes-benz","porsche","bmw","audi","mini"].includes(mk)||(j&&j<2004))return false;
  const carro=(typeof TX3!=="undefined"&&TX3.carro)||(typeof TXR3!=="undefined"&&TXR3&&TXR3.rdw&&TXR3.rdw.inrichting)||"";
  if(txCabrio(carro)||txCabrio(md))return true;
  if(mk==="porsche"&&/^(911|718|cayman|boxster)/.test(txModN(md)))return true;
  if(mk==="audi"&&/^(tt|tts|ttrs|r8)/.test(txModN(md)))return true;
  if(mk==="bmw"&&/^(z4|m4|4)/.test(txModN(md)))return true;
  if(mk==="mercedes-benz"&&/sl|slc|slk|amg-gt|cabrio/.test(txModN(md)))return true;
  return false},
 virtual_cockpit:(mk,md,j)=>["audi","volkswagen","seat","cupra","skoda","lamborghini","bentley"].includes(mk)&&(!j||j>=2014),
 matrix_led:(mk,md,j)=>(["audi","mercedes-benz","bmw","porsche","bentley","lamborghini"].includes(mk)||mk==="volkswagen"&&/golf|passat|arteon|touareg|tiguan|id/.test(txModN(md))&&(!j||j>=2017))&&(!j||j>=2013),
 luchtvering:(mk,md,j,p)=>p&&!TXP.exoot.includes(mk)||mk==="citroen"&&/c5|c6|xm/.test(txModN(md))||mk==="volkswagen"&&/touareg|phaeton|arteon/.test(txModN(md))||TXP.exoot.includes(mk),
 sportuitlaat:(mk,md,j,p,s)=>s||["porsche","jaguar","maserati","aston-martin","lotus","alpine","abarth"].includes(mk)||mk==="ford"&&/mustang|^gt$/.test(txModN(md))||mk==="mini"&&/jcw|john|works/.test(txModN(md)),
 head_up:(mk,md,j,p)=>!j||(p?j>=2004:j>=2014),
 adaptieve_cruise:(mk,md,j,p)=>!j||(p?j>=2000:j>=2011),
 camera:(mk,md,j,p)=>!j||(p?j>=2005:j>=2009),
 keyless:(mk,md,j,p)=>!j||(p?j>=2002:j>=2008),
 premium_audio:(mk,md,j,p)=>p||!j||j>=2009,
 panorama:(mk,md,j,p)=>!j||(p?j>=2003:j>=2008),
 schuifdak:()=>true,navi:(mk,md,j)=>!j||j>=1995,privacy:(mk,md,j)=>!j||j>=1998,sportstoelen:()=>true,
 stoelverwarming:()=>true,trekhaak:()=>true,airco:()=>true,cruise:()=>true,pdc:(mk,md,j)=>!j||j>=1995,leder:()=>true,xenon:(mk,md,j)=>!j||j>=1996
};
function txOptPastM(mk,md,j,k){const f=TXOPT_REGEL[k];if(!f)return false;mk=txMkN(mk);if(!mk)return!["keramisch","carbonpakket","lift","mulliner","naim_audio","nekverwarming"].includes(k);
 j=+j||null;return!!f(mk,md,j,TXP.premium.includes(mk),txSport(mk,md))}
txOptPast=function(mk,k){return txOptPastM(mk,typeof TX!=="undefined"?TX.model:"",typeof TX!=="undefined"?TX.jaar:null,k)};
txOptLabel=function(k,mk){if(k==="sportstoelen"){mk=txMkN(mk);const md=txModN(typeof TX!=="undefined"?TX.model:"");if(mk==="audi"&&/^rs/.test(md))return"RS-sportstoelen";if(mk==="mercedes-benz"&&/amg/.test(md))return"AMG-sportstoelen";if(mk==="bmw"&&(/^m\d/.test(md)||/m[- ]?comp/.test(md)))return"M Competition- / M-sportstoelen";if(mk==="mini"&&/jcw|john|works/.test(md))return"John Cooper Works-stoelen";return"Sportstoelen"}return OPTL[k]||k};
function txOptEntriesLocal(mk){if(!txMkN(mk))return[];return TXOPT_VOLGORDE.filter(k=>OPTL[k]&&txOptPast(mk,k)).map(k=>[k,txOptLabel(k,mk)])}
txOptEntries=function(mk){if(TXCAT&&TXCAT.opties&&TXCAT_KEY===txCatKey())return TXCAT.opties.map(o=>[o.id,o.label||txOptLabel(o.id,mk)]);return txOptEntriesLocal(mk)};
function txCatKey(){const carro=(typeof TX3!=="undefined"&&TX3.carro)||(TXR3&&TXR3.rdw&&TXR3.rdw.inrichting)||"";return[txMkN(TX.merk),txModN(TX.model),TX.jaar||"",txModN(TX.var||""),txModN(carro),TX.kenteken||""].join("|")}
function txOptStatus(k){if(!TXCAT||!TXCAT.opties)return null;const o=TXCAT.opties.find(x=>x.id===k);return o||null}
function txOptHtml(mk){const L=txOptEntries(mk);if(!L.length)return'<span class="meta">Kies eerst een merk om passende opties te zien.</span>';
 const tip=TXCAT&&TXCAT.melding?`<div class="meta txopt-tip">${esc(TXCAT.melding)}${TXCAT.fallback?' <b>Nog te controleren.</b>':""} Aangevinkt = aanwezig op <i>deze</i> auto.</div>`:`<div class="meta txopt-tip">Opties gefilterd op merk/model/bouwjaar. Catalogus wordt opgehaald…</div>`;
 const st=o=>{const s=txOptStatus(o);if(!s)return"";const lab=s.status==="bevestigd"?"bevestigd":s.status==="onbekend"?"onbekend":"mogelijk";
  return` <span class="chip txst txst-${lab}" title="${esc(s.toelichting||"")}">${lab}</span>`};
 return tip+`<div class="frow txopt">${L.map(([k,l])=>`<label class="chk" title="${esc((txOptStatus(k)||{}).toelichting||"")}"><input type="checkbox" data-txopt="${k}"${TX3.opt[k]?" checked":""}> ${esc(l)}${st(k)} <button type="button" class="ghost txopt-x" data-txoptfix="${k}" title="Hoort niet bij dit model">×</button></label>`).join("")}</div>
 <div class="meta">Bron: ${esc((TXCAT&&TXCAT.bronnen||["lokale regels"]).join(", "))}. ${(TXCAT&&TXCAT.grenzen)?esc(TXCAT.grenzen):"RDW/VIN geven geen fabrieksoptielijst."}</div>`}
function txOptOpschonen(){if(typeof TX3==="undefined"||!TX3.opt)return;const ok=new Set(txOptEntries(TX.merk).map(x=>x[0]));for(const k of Object.keys(TX3.opt))if(!ok.has(k))delete TX3.opt[k]}
async function txCatFetch(force){if(!TX.merk){TXCAT=null;TXCAT_KEY="";return null}
 const key=txCatKey();if(!force&&TXCAT&&TXCAT_KEY===key)return TXCAT;
 const api=(typeof TXAPI==="function"?TXAPI():((typeof KL!=="undefined"&&KL.instellingen_api)||"https://2-31-144-18.sslip.io/api/inst"));
 const q=new URLSearchParams({merk:TX.merk||"",model:TX.model||"",jaar:String(TX.jaar||""),uitvoering:TX.var||"",carro:(TX3&&TX3.carro)||(TXR3&&TXR3.rdw&&TXR3.rdw.inrichting)||"",kenteken:TX.kenteken||""});
 if(force)q.set("force","1");
 const ctrl=typeof AbortController!=="undefined"?new AbortController():null;const t=setTimeout(()=>ctrl&&ctrl.abort(),2800);
 try{const r=await fetch(api+"/opties?"+q,{signal:ctrl?ctrl.signal:undefined});clearTimeout(t);
  if(!r.ok)throw 0;TXCAT=await r.json();TXCAT_KEY=key;txOptOpschonen();return TXCAT
 }catch(e){clearTimeout(t);if(!TXCAT||TXCAT_KEY!==key){TXCAT={fallback:true,melding:"Catalogus niet bereikbaar; lokale veilige lijst.",bronnen:["lokale regels"],opties:txOptEntriesLocal(TX.merk).map(([id,label])=>({id,label,status:"onbekend",toelichting:"Offline fallback"}))};TXCAT_KEY=key}return TXCAT}
}
function txCatRefreshUI(){const box=document.querySelector(".txopt")||document.querySelector(".txopt-tip");if(!box)return;const wrap=box.closest(".body")||box.parentElement;if(!wrap)return;
 const old=wrap.querySelector(".txopt-tip")||wrap.querySelector(".txopt");if(!old)return;
 // herbouw optieblok: zoek vanaf tip of txopt tot notities/taxeer
 const holder=document.createElement("div");holder.innerHTML=txOptHtml(TX.merk);
 const zone=wrap.querySelector(".txopt-zone")||(()=>{const z=document.createElement("div");z.className="txopt-zone";const txo=wrap.querySelector(".txopt");if(txo){txo.replaceWith(z);return z}return null})();
 if(zone){zone.innerHTML=holder.innerHTML}else{
  const tip=wrap.querySelector(".txopt-tip");const txo=wrap.querySelector(".frow.txopt");
  if(tip&&txo){const frag=document.createDocumentFragment();[...holder.childNodes].forEach(n=>frag.appendChild(n));tip.replaceWith(frag);txo.remove();
   // remove trailing meta bronregel duplicates carefully — skip
  }
 }
}
// Na render: catalogus async laden zonder taxatie te blokkeren
if(typeof taxatie2==="function"){const _t=taxatie2;taxatie2=function(){txOptOpschonen();const r=_t.apply(this,arguments);
  // vervang optieregel door rijke html als zone bestaat
  try{const fr=document.querySelector(".frow.txopt");if(fr&&typeof txOptHtml==="function"){const z=document.createElement("div");z.className="txopt-zone";z.innerHTML=txOptHtml(TX.merk);fr.replaceWith(z)}}catch(e){}
  if(TX.merk){const key=txCatKey();if(TXCAT_KEY!==key)txCatFetch(false).then(()=>{txOptOpschonen();const z=document.querySelector(".txopt-zone");if(z)z.innerHTML=txOptHtml(TX.merk)})}
  return r}}
if(typeof txBereken3==="function"){const _b=txBereken3;txBereken3=function(){txOptOpschonen();const o=TX3.opt,z={};for(const k in o)if(!TXOPT_INFO.includes(k))z[k]=o[k];TX3.opt=z;try{return _b.apply(this,arguments)}finally{TX3.opt=o}}}
// RDW: ook inrichting meenemen voor cabrio-opties
if(typeof txRdw==="function"){const _rdw=txRdw;txRdw=async function(){const r=await _rdw.apply(this,arguments);if(!r)return r;
  try{const k=r.kenteken;const j=await fetch("https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken="+k).then(x=>x.json());
   if(j&&j[0]){r.inrichting=j[0].inrichting||"";if(typeof TX3!=="undefined")TX3.carro=r.inrichting}}catch(e){}
  TXCAT=null;TXCAT_KEY="";return r}}
document.addEventListener("change",e=>{const t=e.target;if(t&&t.dataset&&(t.dataset.tx==="model"||t.dataset.tx==="jaar"||t.dataset.tx==="merk"||t.dataset.tx==="var")){TX[t.dataset.tx]=t.value;TXCAT=null;TXCAT_KEY="";txOptOpschonen()}},true);
document.addEventListener("click",e=>{const b=e.target.closest("[data-txoptfix]");if(!b)return;e.preventDefault();e.stopPropagation();
 const k=b.dataset.txoptfix;if(!k||!TX.merk||!TX.model)return;
 if(!confirm("Markeer «"+(txOptLabel(k,TX.merk))+"» als niet horend bij dit model?\nDit verbetert de catalogus (met bewijs). Eén taxatie-vinkje telt niet mee."))return;
 delete TX3.opt[k];
 const api=(typeof TXAPI==="function"?TXAPI():((typeof KL!=="undefined"&&KL.instellingen_api)||"https://2-31-144-18.sslip.io/api/inst"));
 const tok=localStorage["inst_token_"+(typeof TXSLUG==="function"?TXSLUG():"brns")];
 if(!tok){alert("Log in bij Instellingen om de cataloguscorrectie op te slaan. De optie is lokaal verborgen voor deze sessie.");
  if(TXCAT&&TXCAT.opties)TXCAT.opties=TXCAT.opties.filter(o=>o.id!==k);const z=document.querySelector(".txopt-zone");if(z)z.innerHTML=txOptHtml(TX.merk);return}
 fetch(api+"/opties/correctie",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+tok},body:JSON.stringify({merk:TX.merk,model:TX.model,jaar:+TX.jaar||null,uitvoering:TX.var||"",optie:k,oordeel:"onmogelijk",bewijs:"gebruiker: hoort niet bij dit model"})})
  .then(r=>r.json()).then(()=>{TXCAT=null;return txCatFetch(true)}).then(()=>{const z=document.querySelector(".txopt-zone");if(z)z.innerHTML=txOptHtml(TX.merk)}).catch(()=>{});
},true);
// lichte styling
(function(){const s=document.createElement("style");s.textContent=`.txst{font-size:10px;padding:1px 6px;margin-left:4px;opacity:.85}.txst-bevestigd{background:#1f6f4a}.txst-mogelijk{background:#3a4558}.txst-onbekend{background:#6a4a1a}.txopt-x{border:0;background:transparent;color:#999;cursor:pointer;padding:0 4px;font-size:14px;line-height:1}.txopt-x:hover{color:#c44}.txopt-zone .chk{align-items:center}.txopt-tip{margin:.4rem 0}`;document.head.appendChild(s)})();

/* 05-11: meerwaarde per aangevinkte optie (bandbreedte + betrouwbaarheid) via /api/inst/opties/waarde. Geen schijnprecisie; pakketten niet dubbel. */
let TXOW_T=null,TXOW_KEY="";
function txOptWaardeHtml(j){if(!j||!j.opties||!j.opties.length)return "";const e=x=>x==null?"–":"€"+Number(x).toLocaleString("nl-NL");
 const rij=o=>`<li>${esc(o.optie.replace(/_/g," "))}: ${o.laag==null?"<i>geen bedrag (te weinig bewijs)</i>":e(o.laag)+" – "+e(o.hoog)} <span class="chip">${esc(o.betrouwbaarheid)}</span> <span class="meta">${esc(o.bron||"")}</span></li>`;
 const t=j.totaal||{};return `<div class="marge txoptw"><b>Meerwaarde opties</b> <span class="meta">(vraagprijzen NL+DE/BE, geen verkoopprijzen)</span><ul>${j.opties.map(rij).join("")}</ul>`+
 (t.laag!=null?`<div><b>Samen: ${e(t.laag)} – ${e(t.hoog)}</b> <span class="chip">${esc(t.betrouwbaarheid)}</span> <span class="meta">${esc(t.toelichting||"")}</span></div>`:"")+`<div class="meta">${esc(j.niet_gebruikt||"")}</div></div>`}
function txOptWaarde(){const sel=Object.keys((typeof TX3!=="undefined"&&TX3.opt)||{}).filter(k=>TX3.opt[k]);const w=(typeof TXR3!=="undefined"&&TXR3&&TXR3.r&&TXR3.r.verk)||0;
 const z=document.querySelector(".txopt-zone");if(!z)return;let d=document.getElementById("txoptw");if(!d){d=document.createElement("div");d.id="txoptw";z.after(d)}
 if(!sel.length||!TX.merk){d.innerHTML="";return}if(!w){d.innerHTML='<div class="meta">Meerwaarde per optie verschijnt na het berekenen van de marktwaarde.</div>';return}
 const key=[TX.merk,TX.model,Math.round(w),sel.join(",")].join("|");if(key===TXOW_KEY&&d.innerHTML)return;TXOW_KEY=key;
 const api=(typeof TXAPI==="function"?TXAPI():"https://2-31-144-18.sslip.io/api/inst");
 fetch(api+"/opties/waarde?"+new URLSearchParams({merk:TX.merk,model:TX.model||"",waarde:Math.round(w),opties:sel.join(",")})).then(r=>r.ok?r.json():null).then(j=>{const d2=document.getElementById("txoptw");if(d2)d2.innerHTML=txOptWaardeHtml(j)}).catch(()=>{d.innerHTML='<div class="meta">Optiewaarde niet bereikbaar.</div>'})}
if(typeof document!=="undefined"){document.addEventListener("change",e=>{if(e.target.dataset&&e.target.dataset.txopt){clearTimeout(TXOW_T);TXOW_T=setTimeout(txOptWaarde,400)}});
 if(typeof MutationObserver!=="undefined")new MutationObserver(()=>{if(document.querySelector(".txopt-zone")&&!document.getElementById("txoptw")){TXOW_KEY="";clearTimeout(TXOW_T);TXOW_T=setTimeout(txOptWaarde,300)}}).observe(document.documentElement,{childList:true,subtree:true})}
if(typeof module!=="undefined"&&module.exports)module.exports.txOptWaardeHtml=txOptWaardeHtml;
