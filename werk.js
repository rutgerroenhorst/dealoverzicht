// Klantconfiguratie (klant.js, gegenereerd uit klanten/<slug>/klant.json). Standaardwaarden = BRNS, zodat de app ook zonder klant.js gelijk blijft.
const KL=Object.assign({naam:"BRNS Exclusief",kort:"BRNS",prioriteit_merk:"Ferrari",tabs:{},categorieen:null,doelmarge_pct:8,flips_doelmarge_eur:250},window.KLANT||{});
KL.tabs=Object.assign({inkoop:"Inkoopkansen",flips:"Eigen flips (&lt; €1.000)",profiel:"BRNS-profiel",klantwensen:"Zoekopdrachten klanten",voorraad:"Eigen voorraad",taxatie:"Inruil-taxatie",veilingen:"Veilingen",rapport:"Maandrapport"},KL.tabs||{});
// Andere klant op hetzelfde domein (bv. preview-pad): eigen opslag-namespace, zodat pipeline/notities nooit tussen bedrijven mengen.
if(KL.slug&&KL.slug!=="brns"){try{const R=window.localStorage,px=KL.slug+":",f={getItem:k=>R.getItem(px+k),setItem:(k,v)=>R.setItem(px+k,v),removeItem:k=>R.removeItem(px+k),clear:()=>Object.keys(R).filter(k=>k.startsWith(px)).forEach(k=>R.removeItem(k)),key:i=>Object.keys(R).filter(k=>k.startsWith(px))[i]};
 const P=new Proxy({},{get:(o,k)=>k in f?f[k]:k==="length"?Object.keys(R).filter(x=>x.startsWith(px)).length:(R.getItem(px+String(k))??undefined),set:(o,k,v)=>(R.setItem(px+String(k),v),true),deleteProperty:(o,k)=>(R.removeItem(px+String(k)),true),has:(o,k)=>R.getItem(px+String(k))!==null,ownKeys:()=>Object.keys(R).filter(x=>x.startsWith(px)).map(x=>x.slice(px.length)),getOwnPropertyDescriptor:(o,k)=>({value:R.getItem(px+String(k)),enumerable:true,configurable:true})});
 Object.defineProperty(window,"localStorage",{value:P,configurable:true})}catch(e){}}
// Andere klant: vaste BRNS-namen in uitlegteksten vervangen door de eigen bedrijfsnaam (alleen tekst, geen data).
if(KL.kort!=="BRNS"){const rb=n=>{const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT);let t;while(t=w.nextNode())if(/BRNS/.test(t.nodeValue))t.nodeValue=t.nodeValue.replace(/BRNS Exclusief/g,KL.naam).replace(/BRNS/g,KL.kort)};
 new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(x=>x.nodeType===1?rb(x):x.nodeType===3&&rb(x.parentNode||document.body)))).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener("DOMContentLoaded",()=>rb(document.body))}
// Werkstroom BRNS: bodcalculator, pipeline-status, betrouwbaarheid, risico, delen, herinneringen. Alles lokaal op dit toestel.
const KMAP={Investering:"Stijgend",Waardevast:"Stabiel",Leeglopend:"Dalend"};
function kmap(o){if(Array.isArray(o))o.forEach(kmap);else if(o&&typeof o==="object")for(const k in o){if(k==="klasse"&&KMAP[o[k]])o[k]=KMAP[o[k]];else kmap(o[k])}return o}
const PIPE_ST=["Nieuw","Bekeken","Gebeld","Bod uitgebracht","Gekocht","Afgewezen"];
let PIPE=JSON.parse(localStorage.pipe||"{}");
const pipeSave=()=>{localStorage.pipe=JSON.stringify(PIPE)};
const pget=u=>Object.assign({status:"Nieuw",notitie:"",herinner:""},PIPE[u]||{});
function pset(u,k,v){const p=pget(u);p[k]=v;p.gewijzigd=new Date().toISOString().slice(0,16);PIPE[u]=p;pipeSave()}
// Doelmarge per segment: Inkoopkansen = % van marktwaarde (standaard 8%), Eigen flips = vast bedrag (standaard €250).
function doel(segId){const o=JSON.parse(localStorage.doel||"{}");return o[segId]||(segId==="flips"?{t:"eur",v:KL.flips_doelmarge_eur}:{t:"pct",v:KL.doelmarge_pct})}
function doelSet(segId,t,v){const o=JSON.parse(localStorage.doel||"{}");o[segId]={t,v};localStorage.doel=JSON.stringify(o)}
function doelEur(d,segId){const x=doel(segId),V=(d.marge||{}).verkoop||0;return x.t==="pct"?V*x.v/100:x.v}
// Max. inkoopprijs P waarbij de verwachte brutomarge precies 'm' is — dezelfde formules als de pijplijn (deals.py/btw.py).
function maxBod(d,m){const g=d.marge||{},c=d.c,V=g.verkoop||0;if(!V||!c||!c.prijs)return null;const K=(g.kosten||0)+(g.opknap_totaal||0),im=g.importkosten,bt=g.btw||{},r=21/121;let P;
 if(im){const I=im.totaal||0;
  if(bt.regeling==="btw-auto"){const rate=im.btw&&im.btw.inkoop?c.prijs/im.btw.inkoop:1.21;P=(V/1.21-I-K-m)*rate}
  else{const b=(im.bpm&&im.bpm.bedrag)||0;P=V-(m+I+K-r*b)/(1-r);if(V-P-b<=0)P=V-I-K-m}}
 else if(bt.regeling==="btw-auto"){const f=c.netto?c.netto/c.prijs:1/1.21;P=(V/1.21-K-m)/f}
 else if(bt.regeling){P=V-(m+K)/(1-r);if(V-P<=0)P=V-K-m}
 else P=V-K-m
 return Math.max(0,Math.round(P))}
function taxatie(d){const c=d.c,r=[];if(d.spec_taxatie)r.push(d.spec_taxatie);if(d.taxatie_km)r.push(d.taxatie_km);if(d.verdacht)r.push(...d.verdacht.verdacht,...d.verdacht.km);
 c.vlaggen.filter(f=>f.ernst==="rood"&&!/^Verdacht|^Km-stand|terugroepactie|^APK verlopen/i.test(f.t)).forEach(f=>r.push(f.t));if(!c.km)r.push("km-stand ontbreekt");
 if(d.te_mooi&&!d.verdacht)r.push("verdacht laag geprijsd");return r}
function betrouw(d){const refs=d.autos.filter(a=>a.url!==d.deal_url&&a.online!==false).map(a=>a.prijs).sort((a,b)=>a-b),n=refs.length;
 const q=p=>refs.length?refs[Math.min(refs.length-1,Math.floor(p*(refs.length-1)+0.5))]:0,sp=n?(q(.75)-q(.25))/d.mediaan:1;
 const ts=d.autos.map(a=>a.gecontroleerd).filter(Boolean).sort()[0]||"";let s=n>=8&&sp<=.25&&!d.marge_onzeker?"A":n>=4&&sp<=.45?"B":"C";if(d.kmcorr&&d.kmcorr.buiten_bereik)s="C";
 return{s,n,sp:Math.round(sp*100),ts,uitleg:`Marktwaarde = mediaan vraagprijs van ${n} referentie-auto's (geen verkoopprijzen), spreiding ±${Math.round(sp*100)}%${d.marge_onzeker?", te weinig NL-referenties":""}${ts?`, oudste online-check ${ts}`:""}. A: ≥8 referenties en spreiding ≤25% · B: ≥4 en ≤45% · C: minder.`}}
function risico(d,tx,b){if(tx.length)return["rood","Rood: eerst taxeren"];const o=d.c.vlaggen.some(f=>f.ernst==="oranje")||b.s==="C"||(d.marge||{}).marge<=0;return o?["oranje","Oranje: let op"]:["groen","Groen"]}
function deelTekst(d,mb,tx){const c=d.c,g=d.marge||{};return [`${d.titel} (${c.jaar}, ${kmf(c.km)})`,`Vraagprijs ${eur(c.prijs)} · marktwaarde ${eur(d.mediaan)} (mediaan vraagprijs, n=${d.autos.length-1})`,tx.length?`Taxatie nodig: ${tx.slice(0,2).join("; ")}`:`Verwachte brutomarge ${eur(g.marge)}${mb==null?"":` · max. bod ${eur(mb)}`}`,`Verkoper: ${VKL[c.verkoper||"onbekend"]||"onbekend"} via ${c.bron}`,`App: ${location.origin+location.pathname}?deal=${d.id}#deal-${d.id}`,`Advertentie: ${c.url}`].join("\n")}
function ics(d,datum){const t=datum.replace(/-/g,""),txt=`Terugbellen/opvolgen: ${d.titel}`,b=new Blob([["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Dealoverzicht//NL","BEGIN:VEVENT",`UID:${d.id}-${t}@dealoverzicht`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").slice(0,15)}Z`,`DTSTART;VALUE=DATE:${t}`,`SUMMARY:${txt.replace(/[,;]/g," ")}`,`DESCRIPTION:${(d.c.url+" "+(pget(d.deal_url).notitie||"")).replace(/[,;\n]/g," ")}`,"BEGIN:VALARM","TRIGGER:PT9H","ACTION:DISPLAY","DESCRIPTION:Opvolgen","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n")],{type:"text/calendar"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`opvolgen-${d.id}.ics`;a.click()}
function herinneringen(){const td=new Date().toISOString().slice(0,10);return Object.entries(PIPE).filter(([u,p])=>p.herinner&&p.herinner<=td&&!["Gekocht","Afgewezen"].includes(p.status))}
function pipeExport(){const b=new Blob([JSON.stringify({versie:1,export:new Date().toISOString(),pipeline:PIPE,doelmarge:JSON.parse(localStorage.doel||"{}")},null,1)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="dealoverzicht-pipeline.json";a.click()}
function pipeImport(f){const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);Object.assign(PIPE,j.pipeline||{});pipeSave();if(j.doelmarge)localStorage.doel=JSON.stringify(j.doelmarge);toast("Pipeline geïmporteerd ✓");render()}catch(e){toast("Bestand niet leesbaar")}};r.readAsText(f)}
const fdat=s=>s&&s.length>=8?s.slice(6,8)+"-"+s.slice(4,6)+"-"+s.slice(0,4):"";
function rdwx(d){const r=d.rdwplus;if(!r)return"";const cat=Object.entries(r.categorieen||{});
 return `<details class="kosten"><summary>APK-historie &amp; terugroepacties (RDW)${(r.vlaggen||[]).length?" ⚠":""}: ${r.n_gebreken} gebrek(en) bij ${r.n_keuringen} keuring(en)</summary>
 ${r.gebreken_laatste.length?`<div class="meta"><b>Laatste keuring met gebreken (${fdat(r.gebreken_laatste_datum)}):</b> ${r.gebreken_laatste.map(esc).join("; ")}</div>`:`<div class="meta">Geen geconstateerde gebreken geregistreerd.</div>`}
 ${cat.length?`<div class="meta"><b>Per onderdeel:</b> ${cat.map(([k,v])=>esc(k)+" ("+v.join(", ")+")").join(" · ")}</div>`:""}
 ${(r.terugroep||[]).map(t=>`<div class="meta"><span class="chip ${t.open?"bad":"ok"}">${t.open?"open":"hersteld"}</span> <b>${esc(t.code)}</b>${t.risico?" · risico "+esc(t.risico):""}: ${esc(t.oms)}</div>`).join("")}
 ${r.co2?`<div class="meta">CO₂ ${r.co2} g/km${r.euro?" · "+esc(r.euro):""}</div>`:""}<div class="meta">Bron: ${esc(r.bron)}. Laatste keuring ${fdat(r.laatste_keuring)||"onbekend"}.</div></details>`}
function verkx(d){const v=d.verkocht;if(!v)return"";if(!v.n)return `<div class="meta">Verdwenen vergelijkbare advertenties (verkoopprijs-proxy): nog geen (we bouwen deze historie elke dag op).</div>`;
 return `<details class="kosten"><summary>Waarschijnlijk verkocht: ${v.n} vergelijkbare, mediaan laatste vraagprijs ${eur(v.mediaan)} (na ±${v.dagen_online_mediaan} d online)</summary>${v.uitleg?`<div class="meta">${esc(v.uitleg)}</div>`:`<div class="meta">${v.n<5?"Minder dan 5: nog niet meegerekend in de marge.":"Hoger dan of gelijk aan de verkoopwaarde: niet aangepast."}</div>`}${v.voorbeelden.map(x=>`<div class="meta">${esc(x.titel)} · ${x.jaar||""} · ${x.km?x.km.toLocaleString("nl-NL")+" km":"km ?"} · ${eur(x.prijs)} · ${x.dagen} d online, weg sinds ${esc(x.weg_sinds)}</div>`).join("")}<div class="meta">Laatste vraagprijs vóór verdwijnen, live bevestigd (404/weg). Geen transactieprijs.</div></details>`}
function kchk(c){const k=c.kcheck;if(!k)return"";if(!k.beschikbaar)return `<details class="kosten"><summary>Kentekencheck</summary><div class="meta">${esc(k.uitleg)}</div></details>`;
 const R=[["Kenteken / RDW",`${k.kenteken} · ${k.merk_model} · ${k.kleur}`],["NAP-tellerstandoordeel",k.nap+(k.nap_laatste_jaar?` (laatste registratie ${k.nap_laatste_jaar})`:"")],["WOK (wacht op keuren)",k.wok],["Open terugroepactie",k.terugroepactie],["APK tot",k.apk_tot],["1e toelating / 1e in NL",`${k.eerste_toelating||"?"} / ${k.eerste_nl||"?"}${k.import?" (import)":""}`],["Laatste overschrijving",k.laatste_overschrijving||"onbekend"],["Export / tenaamstellen mogelijk",`${k.export} / ${k.tenaamstellen}`],["Catalogusprijs nieuw",k.catalogusprijs?eur(k.catalogusprijs):"onbekend"],["Rest-BPM (indicatie)",k.rest_bpm!=null?eur(k.rest_bpm):"onbekend"]];
 return `<details class="kosten"><summary>Kentekencheck (RDW open data)${/onlogisch/i.test(k.nap)||/^JA/.test(k.wok)?" ⚠":""}</summary><table>${R.map(([a,b])=>`<tr><td>${a}</td><td><b>${esc(String(b))}</b></td></tr>`).join("")}</table>${k.rest_bpm_uitleg?`<div class="meta">${esc(k.rest_bpm_uitleg)}</div>`:""}<div class="meta">Niet openbaar / onbekend: ${k.onbekend.map(esc).join("; ")}.</div></details>`}
function kort(d){const c=d.c,g=d.marge||{},segId=S().id||"brns",tx=taxatie(d),b=betrouw(d),[rk,rl]=risico(d,tx,b),dm=doelEur(d,segId),mb=maxBod(d,dm)==null?null:Math.floor(maxBod(d,dm)/50)*50,p=pget(d.deal_url),cr=d.courant,u=encodeURIComponent(d.deal_url),x=doel(segId);
 const crt=cr&&cr.statijd!=null?`${cr.label} (±${cr.statijd} d)`:cr&&cr.label==="niet berekend"?"":"courantheid: te weinig data";
 return `<div class="kc"><div class="kc-top">${c.foto?`<img class="kc-img" src="${esc(c.foto)}" alt="" loading="lazy" onerror="this.remove()">`:""}<div class="kc-i">
 <div class="meta">${esc(d.merk)} · ${esc(c.bron)} ${vkb(c.verkoper)}${p.status!=="Nieuw"?` <span class="chip st">${esc(p.status)}</span>`:""}</div><h2 class="t">${esc(d.titel)}</h2>${kjl(c.jaar,c.km,c.fuel||c.brandstof,c.bak,locVan({...c,deal_url:d.deal_url}))}
 <div class="kc-p"><span class="price">${eur(c.prijs)}</span><span class="licht ${rk}" title="${esc(rl+(tx.length?": "+tx.join("; "):""))}"></span></div></div></div>
 <div class="kc-g"><div><span>Max. bod</span><b>${tx.length||mb==null?"–":eur(mb)}</b></div><div><span>Verw. brutomarge</span><b class="${tx.length?"tax":g.marge>0?"pos":"neg"}">${tx.length?"Taxatie nodig":(g.marge<0?"−"+eur(-g.marge):eur(g.marge))}</b></div><div><span>Marktwaarde</span><b>${eur(d.mediaan)}</b></div></div>
 <div class="chips"><span class="chip bt-${b.s}" title="${esc(b.uitleg)}">Betrouwbaarheid ${b.s}</span>${crt?`<span class="chip" title="${esc(cr?cr.uitleg:"")}">${esc(crt)}</span>`:""}<span class="chip">${d.korting}% t.o.v. marktwaarde</span>${mchip(d)}${specChips(d)}${c.online===false||d.verlopen?'<span class="chip bad">Verkocht/offline</span>':""}</div>
 ${tx.length?`<div class="meta tax">Taxatie nodig: ${esc(tx.join("; "))}</div>`:""}
 <div class="kc-a"><select class="pst" data-pst="${u}" aria-label="Status">${PIPE_ST.map(s=>`<option${s===p.status?" selected":""}>${s}</option>`).join("")}</select><a class="btn sm" href="${esc(d.deal_url)}" target="_blank" rel="noopener">Advertentie ↗</a><a class="btn sm sec" href="https://wa.me/?text=${encodeURIComponent(deelTekst(d,mb,tx))}" target="_blank" rel="noopener">Deel via WhatsApp</a></div>
 <details class="meer"${open["m"+d.deal_url]?" open":""} data-meer="${u}"><summary>Details, bodcalculator, notities</summary>
 <div class="bodc"><b>Bodcalculator</b> ${T("Max. inkoopprijs = de prijs waarbij je na kosten afleverklaar, import/BPM en btw (margeregeling of btw-auto) precies je doelmarge overhoudt. Zelfde rekenmodel als de verwachte brutomarge.")}<div class="frow"><label>Doelmarge<input type="number" inputmode="numeric" class="doelv" data-seg="${segId}" value="${x.v}"></label><label>in<select class="doelt" data-seg="${segId}"><option value="pct"${x.t==="pct"?" selected":""}>% van marktwaarde</option><option value="eur"${x.t==="eur"?" selected":""}>€</option></select></label></div>
 <div class="meta">${mb==null?"Geen verkoopwaarde bekend; max. inkoopprijs niet te berekenen.":`Doelmarge ${eur(dm)} → <b>max. inkoopprijs ${eur(mb)}</b> (vraagprijs ${eur(c.prijs)}, verschil ${eur(mb-c.prijs)}).`}${g.bod?` Voorzichtig bod in verkoperbericht ${eur(g.bod)} (onderbouwd met gebreken).`:" Verkoperbericht noemt geen bedrag (geen gebreken gevonden)."}${tx.length?" Let op: taxatie nodig, berekening alleen indicatief.":""}</div></div>
 <div class="pnote"><label>Notitie<textarea class="pnt" data-pnt="${u}" rows="2">${esc(p.notitie)}</textarea></label><label>Herinnering op<input type="date" class="phr" data-phr="${u}" value="${esc(p.herinner)}"></label>${p.herinner?`<button class="sec sm" data-ics="${u}">Zet in agenda (.ics)</button>`:""}</div>
 ${tkForm(d)}${kchk(c)}${rdwx(d)}${verkx(d)}<div class="meta">${esc(b.uitleg)}</div>${cr?`<div class="meta">Courantheid: ${esc(cr.uitleg)}</div>`:""}
 <div class="card inner">${card0(d)}</div></details></div>`}
document.addEventListener("change",e=>{const t=e.target;const g=k=>decodeURIComponent(t.dataset[k]);
 if(t.dataset.pst){pset(g("pst"),"status",t.value);toast("Status: "+t.value);render()}
 else if(t.dataset.phr!==undefined&&t.classList.contains("phr")){pset(g("phr"),"herinner",t.value);render()}
 else if(t.classList.contains("pnt")){pset(g("pnt"),"notitie",t.value);toast("Notitie bewaard")}
 else if(t.classList.contains("doelv")||t.classList.contains("doelt")){const s=t.dataset.seg,box=t.closest(".bodc");doelSet(s,box.querySelector(".doelt").value,+box.querySelector(".doelv").value||0);render()}
 else if(t.id==="pimp"&&t.files[0])pipeImport(t.files[0])});
document.addEventListener("toggle",e=>{const t=e.target;if(t.classList&&t.classList.contains("meer"))open["m"+decodeURIComponent(t.dataset.meer)]=t.open},true);
document.addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;
 if(t.dataset.ics){const u=decodeURIComponent(t.dataset.ics),d=alleDeals().find(x=>x.deal_url===u);if(d)ics(d,pget(u).herinner)}
 else if(t.id==="pexp")pipeExport();else if(t.dataset.pf!==undefined){PF=t.dataset.pf;render()}});
let PF="";
function alleDeals(){return D.segmenten.flatMap((S,i)=>S.deals.map(d=>{const c=d.autos.find(a=>a.url===d.deal_url)||d.autos[0];return{...d,c,_seg:S.id,korting:Math.round((c.prijs/d.mediaan-1)*100)}}))}
function pipeline(){const A=alleDeals().filter(d=>PIPE[d.deal_url]&&PIPE[d.deal_url].status!=="Nieuw"),n=s=>A.filter(d=>pget(d.deal_url).status===s).length;
 $("#kpis").innerHTML="";const L=A.filter(d=>!PF||pget(d.deal_url).status===PF),H=herinneringen();
 $("#cards").innerHTML=`<article class="card wide"><div class="body"><h2 class="t">Mijn pipeline</h2><div class="meta">Status, notities en herinneringen staan alleen op dit toestel (geen login). Maak regelmatig een export, of zet hem met Import op een ander toestel.</div>
 <div class="seg">${[["","Alle",A.length],...PIPE_ST.slice(1).map(s=>[s,s,n(s)])].map(([k,l,c])=>`<button data-pf="${k}" class="${PF===k?"on":""}">${l} (${c})</button>`).join("")}</div>
 ${H.length?`<div class="meta tax">⏰ ${H.length} herinnering(en) voor vandaag of eerder.</div>`:""}
 <div class="act"><button id="pexp" class="sec">Export (JSON)</button><label class="btn sec">Import<input id="pimp" type="file" accept="application/json" hidden></label></div></div></article><article class="card wide"><div class="body"><h2 class="t">Terugkoppeling gekochte auto's</h2><div class="meta">Geschatte vs werkelijke marge. Export als <b>kalibratie.json</b> en importeer in de pipeline (<code>cli.py kalibratie --import</code>); vanaf 3 auto's per model/merk past de kostenraming zich aan.</div>${tkSectie()}<div class="act"><button id="kexp" class="sec">Export kalibratie.json</button></div></div></article>`+(L.length?L.map(d=>{const old=seg;seg=D.segmenten.findIndex(s=>s.id===d._seg);const h=card(d);seg=old;return h}).join(""):`<div class="empty">Nog niets in je pipeline. Zet op een kaart de status op bv. 'Bekeken' of 'Gebeld'.</div>`)}
function startSeg(){if(seg<0)seg=location.hash==="#flips"?D.segmenten.findIndex(x=>x.id==="flips"):Math.max(0,D.segmenten.findIndex(x=>x.id==="brns"));
 const H=herinneringen();if(H.length){setTimeout(()=>toast(`⏰ ${H.length} herinnering(en) in Mijn pipeline`,4000),800);if(window.Notification&&Notification.permission==="granted")try{new Notification("Dealoverzicht",{body:`${H.length} auto(s) opvolgen vandaag`})}catch(e){}}}

// Bouwjaar · km-stand (· brandstof · transmissie) direct onder de titel; onbekende km amber.
function kjl(j,km,f,b,loc){km=km==null?null:(+String(km).replace(/\D/g,"")||null);const kort=v=>{v=String(v||"").toLowerCase();return /^aut|automa|dsg|pdk|tronic/.test(v)?"automaat":/^hand|manual|schalt/.test(v)?"handgeschakeld":""};const fu=String(f||"").toLowerCase().replace("phev/hybride","plug-in hybride"),t=kort(b);
 return `<div class="kjl">${j?`<b>${esc(String(j).slice(0,4))}</b>`:""}${km?`<b>${Number(km).toLocaleString("nl-NL")} km</b>`:'<span class="kmo" title="De advertentie vermeldt geen kilometerstand">km onbekend</span>'}${fu&&fu.length<=16?`<span>${esc(fu)}</span>`:""}${t?`<span>${t}</span>`:""}${loc?`<span class="${loc.vr?"lnd":""}" title="Locatie van de auto">${loc.vr?vlag(loc.l)+" ":""}${esc(loc.t)}</span>`:""}</div>`}

// Land/locatie van de deal-auto. Marktplaats/AutoTrack = NL; anders ISO uit de bron; onbekend als niets bekend is.
function landVan(a){a=a||{};const l=String(a.land||"").toUpperCase();if(/^[A-Z]{2}$/.test(l))return l;if(/marktplaats\.nl|autotrack\.nl/.test(a.url||a.deal_url||""))return"NL";return"onbekend"}
function vlag(l){return /^[A-Z]{2}$/.test(l)?String.fromCodePoint(...[...l].map(c=>127397+c.charCodeAt(0))):""}
function locVan(a){const l=landVan(a),p=String(a&&a.plaats||"").trim(),vr=l!=="NL"&&l!=="onbekend";if(p)return{t:vr?`${p} (${l})`:p,l,vr};if(vr)return{t:l,l,vr};return null}
const LFN={NL:"Nederland",DE:"Duitsland",BE:"België",AT:"Oostenrijk",IT:"Italië",LU:"Luxemburg",FR:"Frankrijk",ES:"Spanje",CH:"Zwitserland",GB:"VK",US:"VS",CA:"Canada",NO:"Noorwegen",DK:"Denemarken",SE:"Zweden",PL:"Polen",CZ:"Tsjechië",MC:"Monaco",PT:"Portugal"};
function lfLabel(k){return k==="alles"?"Alle landen":k==="NL"?"Nederland":k==="buiten"?"Buitenland":k==="onbekend"?"Land onbekend":vlag(k)+" "+k}
function lfbar(lands){const c={};lands.forEach(l=>c[l]=(c[l]||0)+1);const per=Object.keys(c).filter(k=>k!=="NL"&&k!=="onbekend").sort((a,x)=>c[x]-c[a]),bu=per.reduce((n,k)=>n+c[k],0),
 b=k=>gb("lf",k,lfLabel(k),c[k]||0,LFN[k]||""),buOn=per.length&&per.every(k=>gOn("lf",k));
 return `<div class="seg lfbar">${gb("lf","alles","Alle landen",lands.length)}${b("NL")}<button data-g="lf" data-v="buiten" data-lijst="${per.join(",")}" class="${buOn?"on":""}" title="Selecteert alle buitenlandse landen">Buitenland (${bu})</button>${per.map(b).join("")}${c.onbekend?b("onbekend"):""}</div>`}
function bannerKlein(n,tot,f){f=f||[];return n>=tot||!f.length?"":`<div class="fbanner"><b>${n} van ${tot} getoond</b> — filter: ${f.map(esc).join(" · ")} <button class="sec sm" id="fwis2">Filters wissen</button></div>`}
document.addEventListener("click",e=>{if(e.target.closest("#fwis2")){gWis();render()}});
