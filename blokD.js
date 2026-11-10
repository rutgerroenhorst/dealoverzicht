// Tab 'Trends': RDW-overschrijvingen (feit) + aanbod/prijzen uit eigen scans (feit, eigen meting) + 'mogelijk trending' (schatting). Data: modeltrends.json (pipeline/modeltrends.py).
let MT=null,MTMEER=40;const TPL={dag:"Laatste dag",week:"Week",maand:"Maand","3mnd":"3 mnd",halfjaar:"6 mnd",jaar:"Jaar"},TSEG={brns:"BRNS-segment",exclusief:"Exclusief",handel:"Dagelijkse handel",flips:"< €1.000 flips"};
const TSORT=[["volume","Meeste overschrijvingen (aantal)"],["groei","Snelste stijgers (% t.o.v. markt)"],["daal","Snelste dalers (% t.o.v. markt)"],["score","Mogelijk trending (trendscore)"]];
const TSN={rdw:"Overschrijvingen t.o.v. markt (RDW)",aanbod:"Aanbod in onze scans (minder = positief)",prijs:"Mediaan vraagprijs in onze scans",weg:"Verdwijnsnelheid advertenties",veiling:"Veilingprijzen (extern)"};
const TMND=["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];

function trBadge(sec){if(!sec)return "";const oud=sec.verouderd?" <span class=\"chip wk-leeg\">verouderd</span>":"";const d=sec.meetdatum?String(sec.meetdatum).slice(0,10):"n.b.";
 return `<div class="tr-badge mk-meta"><span class="chip">${esc(sec.type||"overschrijvingen")}</span> <span class="chip">${esc(sec.regio||"NL")}</span>
 <span class="meta">Bron: ${esc(sec.bron||"RDW")} · gemeten ${esc(d)} · verversing: ${esc(sec.frequentie||"elke full + quick")}</span>${oud}</div>`}
function trConclusies(MT,A,p,P){
  const C=[],fmt=n=>Number(n).toLocaleString("nl-NL");
  const vol=[...A].filter(o=>o.rdw[p]&&o.rdw[p][0]>0).sort((a,b)=>b.rdw[p][0]-a.rdw[p][0]);
  if(vol[0]) C.push({wat:`Meeste overschrijvingen: ${vol[0].merk} ${vol[0].model} (${fmt(vol[0].rdw[p][0])})`,waarom:`RDW in ${tNu(P,p)}`,betekenis:"Veel handel: sneller te verkopen, maar concurrentie bij inkoop."});
  const gr=[...A].filter(o=>o.groei[p]!=null&&!((o.rdw[p]||[0,0])[1]<Math.max(10,(o.rdw[p]||[0,0])[0]*0.25))).sort((a,b)=>b.groei[p]-a.groei[p]);
  if(gr[0]&&gr[0].groei[p]>0) C.push({wat:`Sterkste stijger t.o.v. markt: ${gr[0].merk} ${gr[0].model} (${gr[0].groei[p]>0?"+":""}${gr[0].groei[p]}%)`,waarom:`periode ${tNu(P,p)} vs ${tVorig(P,p)}`,betekenis:"Vraag groeit sneller dan de markt; inkoopprijzen kunnen volgen."});
  if(gr.length&&gr[gr.length-1].groei[p]<0){const d=gr[gr.length-1];C.push({wat:`Sterkste daler t.o.v. markt: ${d.merk} ${d.model} (${d.groei[p]}%)`,waarom:`periode ${tNu(P,p)} vs ${tVorig(P,p)}`,betekenis:"Minder vraag of meer aanbod; scherpere inkoop mogelijk, check staat."});}
  if(!C.length)return "";
  return `<div class="tr-concl"><b>Dealerconclusies (ontwikkeling in de tijd)</b>${C.slice(0,3).map(c=>`<div class="mk-concl-i"><b>${esc(c.wat)}</b><div class="meta">Waarom: ${esc(c.waarom)}</div><div class="meta">Betekenis: ${esc(c.betekenis)}</div></div>`).join("")}
  <div class="meta">Trends = ontwikkeling over periodes. Voor vraagprijzen en aanbod nu: tab <button type="button" class="chip" data-goto="10">Markt</button>.</div></div>`;
}
function tmode(){return localStorage.tr_m==="opkomend"?"opkomend":"feiten"}
function tp(){const p=localStorage.tr_p||"maand";return MT&&MT.perioden[p]&&!(p==="dag"&&tmode()==="opkomend")?p:"maand"}function tsort(){if(tmode()==="feiten")return"volume";const s=localStorage.tr_s||"groei";return s!=="volume"&&TSORT.some(x=>x[0]===s)?s:"groei"}
let MTA=null;
function tD(s){const[y,m,d]=s.split("-").map(Number);return{y,m,d}}
function tPer(van,tot,p){const a=tD(van),b=tD(tot),M=x=>TMND[x.m-1];if(p==="dag")return `${a.d} ${M(a)} ${a.y}`;if(p==="week"||a.d!==1)return `${a.d} ${M(a)}, ${b.d} ${M(b)} ${b.y}`;
 return a.m===b.m&&a.y===b.y?`${M(a)} ${a.y} (1 tot ${b.d} ${M(b)})`:`${M(a)}${a.y!==b.y?" "+a.y:""}, ${M(b)} ${b.y} (1 ${M(a)}, ${b.d} ${M(b)})`}
function tNu(P,p){return tPer(P.van,P.tot,p)}function tVorig(P,p){return tPer(P.vvan,P.vtot,p)}
function tDeals(o){if(!D)return[];const mk=o.mk.replace(/-/g," "),re=new RegExp("(^|[^a-z0-9])"+o.md.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/-klasse$/,"(-klasse|\\b\\s?\\d{2,3})").replace(/-serie$/,"(-serie|\\d{2}\\w*)")+"([^a-z0-9]|$)");
 return D.segmenten.flatMap(s=>s.deals.map(d=>({d,s}))).filter(({d})=>{const t=(d.titel||"").toLowerCase();return t.replace(/-/g," ").startsWith(mk)&&re.test(t.slice(mk.length))})}
function trends(){$("#kpis").innerHTML="";if(!MT){$("#cards").innerHTML='<div class="meta">Trends laden…</div>';fetch("modeltrends.json?"+Date.now()).then(r=>{if(!r.ok)throw 0;return r.json()}).then(j=>{MT=j;render()}).catch(()=>{$("#cards").innerHTML='<div class="empty">Nog geen trenddata (komt na de eerstvolgende run).</div>'});return}
 const md=tmode(),p=tp(),P=MT.perioden[p],so=tsort(),fmt=n=>Number(n).toLocaleString("nl-NL"),nu=tNu(P,p),vo=tVorig(P,p),dek=MT.dekking&&MT.dekking[p];
 const segOK=o=>!G.ts.length||G.ts.some(s=>o.seg.includes(s)),mkOK=o=>!G.tm.length||G.tm.includes(o.merk);
 const nieuw=o=>{const r=o.rdw[p]||[0,0];return r[1]<Math.max(10,r[0]*0.25)},trendOK=o=>!nieuw(o)&&o.groei[p]!=null;
 const base=MT.modellen.filter(o=>o.rdw[p]&&(o.rdw[p][0]+o.rdw[p][1]>0||o.aanbod));
 const A=base.filter(o=>segOK(o)&&mkOK(o)),As=base.filter(mkOK),Am=base.filter(segOK);
 const pc=g=>(g>0?"+":"")+g+"%";
 const SEC={volume:{t:"Meeste overschrijvingen",u:`Aantal auto's dat in ${nu} in NL van eigenaar wisselde (RDW), tussen haakjes ${vo}. Gesorteerd op aantal, van hoog naar laag.${p==="halfjaar"||p==="jaar"||p==="3mnd"?" Het ruwe verschil met de vorige periode is te hoog ingeschat: RDW bewaart alleen de laatste overschrijving per auto. Voor eerlijke groei: zie Opkomend.":""}`,f:o=>o.rdw[p][0]>0,s:(a,b)=>b.rdw[p][0]-a.rdw[p][0],v:o=>fmt(o.rdw[p][0])+" (vorige: "+fmt(o.rdw[p][1])+")"},
  groei:{t:"Snelste stijgers",u:`Model groeide harder dan de hele markt: ${nu} vs ${vo}. Gesorteerd op % t.o.v. markt, van hoog naar laag. Pas vanaf ${MT.min[p]} overschrijvingen.`,f:o=>trendOK(o)&&o.groei[p]>0,s:(a,b)=>b.groei[p]-a.groei[p],v:o=>pc(o.groei[p])+" t.o.v. markt"},
  daal:{t:"Snelste dalers",u:`Model groeide minder of kromp t.o.v. de markt: ${nu} vs ${vo}. Gesorteerd op % t.o.v. markt, van laag naar hoog.`,f:o=>trendOK(o)&&o.groei[p]<0,s:(a,b)=>a.groei[p]-b.groei[p],v:o=>pc(o.groei[p])+" t.o.v. markt"},
  score:{t:"Mogelijk trending",u:`Schatting, geen feit: trendscore uit de signalen hieronder (formule onder ‘waarom?’). Alleen score > 0 en zekerheid middel/hoog. Gesorteerd op trendscore.`,f:o=>trendOK(o)&&o.score[p]>0&&o.zeker[p]!=="laag",s:(a,b)=>b.score[p]-a.score[p],v:o=>"score "+o.score[p]+" · "+o.zeker[p]}};
 const L=[...A].filter(SEC[so].f).sort(SEC[so].s);
 const tops={};Object.keys(SEC).forEach(k=>tops[k]=[...A].filter(SEC[k].f).sort(SEC[k].s).slice(0,5));
 const mc={};Am.forEach(o=>mc[o.merk]=(mc[o.merk]||0)+1);const merken=Object.keys(mc).sort((a,b)=>mc[b]-mc[a]).slice(0,30).concat(G.tm.filter(m=>!(m in mc)));
 const top=k=>`<div class="ttop"><b>${SEC[k].t}</b><div class="meta">${esc(SEC[k].u)}</div><ol>${tops[k].map(o=>`<li><button class="tlink" data-tm="${esc(o.k)}" data-tms="${k}">${esc(o.merk+" "+o.model)}</button> <span class="meta">${esc(SEC[k].v(o))}</span></li>`).join("")||"<li class=meta>Geen modellen die hieraan voldoen.</li>"}</ol></div>`;
 const waarom=o=>{const c=(o.comp||{})[p]||[],sc=o.score[p];if(sc==null)return"";
  return `<details class="why tw"><summary>Trendscore ${sc>0?"+":""}${sc} · zekerheid ${esc(o.zeker[p])}, waarom?</summary><div class="meta"><p><b>Schatting</b> (−100…+100) = gewogen gemiddelde van de signalen die er zijn; elk signaal is eerst geschaald naar −1…+1:</p>
  <table class="trt"><tr><th>Signaal</th><th>Meting</th><th>Gewicht</th><th>Bijdrage</th></tr>${c.map(x=>`<tr><td>${esc(TSN[x.s]||x.s)}</td><td>${esc(x.t)}</td><td>${x.w}</td><td>${x.bij>0?"+":""}${x.bij}</td></tr>`).join("")}</table>
  <p>Schaal: RDW g/(|g|+40) · aanbod −Δ%/20 · vraagprijs Δ%/5 · verdwijnen (ratio−1)/0,5 · veiling Δ%/30, elk begrensd op ±1.</p>
  <p><b>Zekerheid ${esc(o.zeker[p])}:</b> ${esc((o.zreden||{})[p]||"")}.</p></div></details>`};
 const row=o=>{const r=o.rdw[p],g=o.groei[p],dl=tDeals(o),an=o.aanbod;
  return `<article class="card tr" id="tr-${esc(o.k)}"><div class="body"><div class="meta">${o.seg.map(s=>`<span class="chip">${esc(TSEG[s])}</span>`).join("")}</div>
  <h2 class="t">${esc(o.merk+" "+o.model)}</h2>
  <div class="meta"><b>Feit (RDW)</b></div>
  <div class="specs"><div><span>Overschrijvingen ${esc(nu)}</span><b>${fmt(r[0])}</b></div><div><span>Vorige periode ${esc(vo)}</span><b>${fmt(r[1])}</b></div>${md==="feiten"?`<div><span>Verschil (ruw)</span><b>${r[1]?pc(Math.round((r[0]/r[1]-1)*100)):"n.b."}</b></div>`:`<div><span>Groei t.o.v. markt</span><b class="${g>0?"pos":g<0?"neg":""}">${g==null?" tot  (te weinig)":pc(g)}</b></div>`}</div>
  ${an?`<div class="meta"><b>Feit (eigen scan ${esc(MT.bijgewerkt.slice(0,10))})</b></div><div class="specs"><div><span>Advertenties in onze scans</span><b>${fmt(an.n)}</b></div><div><span>Mediaan vraagprijs</span><b>${eur(an.med)}</b></div>${o.dal[p]!=null?`<div><span>Prijsverlagingen (${esc(nu)})</span><b>${o.dal[p]}</b></div>`:""}</div>`:""}
  ${o.score[p]!=null&&md==="opkomend"?`<div class="meta"><b>Schatting</b></div>${waarom(o)}`:""}
  ${(o.redenen[p]||[]).some(x=>/nieuw\/opkomend/.test(x.t))?'<div class="chips"><span class="chip">nieuw/opkomend model: vorige periode nog weinig auto’s op de weg</span></div>':""}
  <div class="act">${dl.length?`<details class="trd"><summary class="btn sm sec">Deals nu (${dl.length})</summary>${dl.slice(0,8).map(({d,s})=>`<a data-deal="${esc(d.id)}" href="?deal=${esc(d.id)}#deal-${esc(d.id)}">${esc(d.titel)}</a> · ${eur(d.autos.find(a=>a.url===d.deal_url).prijs)} <span class="meta">(${esc(s.id==="flips"?KL.tabs.flips:KL.tabs.inkoop)})</span>`).join("<br>")}</details>`:'<span class="meta">Geen deals in de app voor dit model</span>'}
  <button class="btn sm" data-kwp="${esc(o.merk)}|${esc(o.model)}">Klantzoekopdracht maken</button></div></div></article>`};
 const uit=`<details class="why"><summary>Begrippen en bronnen</summary><div class="meta">
 <p><b>Overschrijving (feit, RDW open data m9d7-ebf2)</b> = personenauto op een nieuwe eigenaar gezet in de gekozen periode; géén nieuwe auto's en géén eerste NL-registratie (dus geen verse imports). Niet hetzelfde als verkopen: ook leasewissels en handel-naar-handel tellen mee.</p>
 <p><b>% t.o.v. markt</b> = (groei van het model) gedeeld door (groei van alle overschrijvingen), min 1. Voorbeeld −1% t.o.v. markt: het model groeide 1% minder hard dan de hele markt tussen ${esc(vo)} en ${esc(nu)}. We vergelijken met de markt omdat de RDW alleen de láátste overschrijving per kenteken bewaart; oudere periodes lijken daardoor kleiner, voor alle modellen ongeveer gelijk.</p>
 <p><b>Aanbod, mediaan vraagprijs, prijsverlagingen, verdwijnen (feit, eigen scans AutoScout24/Marktplaats)</b>: tellen pas mee als onze scanhistorie de hele periode dekt (historie sinds ${esc(MT.historie_sinds)}). ${dek?"Voor deze periode is dat zo.":"<b>Voor deze periode nog niet</b>, dus de trendscore gebruikt nu alleen het RDW-signaal."} ‘Verdwijnt sneller’ = aandeel advertenties van dit model dat uit onze scans verdween, vergeleken met het gemiddelde over alle modellen; een aanwijzing voor verkocht, geen bewijs.</p>
 <p><b>Trendscore (schatting)</b> en <b>zekerheid</b>: zie ‘waarom?’ op elke kaart. Een indicatie om verder te kijken, geen voorspelling.</p>
 <p>Hele markt: ${fmt(P.markt[0])} overschrijvingen in ${esc(nu)} vs ${fmt(P.markt[1])} in ${esc(vo)}. Laatste 2 dagen niet meegeteld (RDW loopt achter).</p></div></details>`;
 const sc=k=>As.filter(o=>o.seg.includes(k)).length;
 const arch=()=>{if(MTA===null){MTA=0;fetch("modeltrends_archief.json?"+Date.now()).then(r=>r.ok?r.json():{}).then(j=>{MTA=j;render()}).catch(()=>{MTA={}})}
  const ms=Object.keys(MTA||{}).sort().reverse();if(!ms.length)return"";const m=localStorage.tr_am&&ms.includes(localStorage.tr_am)?localStorage.tr_am:ms[0],X=MTA[m],nm=Object.fromEntries(MT.modellen.map(o=>[o.k,o]));
  const T=Object.entries(X).filter(([k])=>{const o=nm[k];return !o||(segOK(o)&&mkOK(o))}).sort((a,b)=>b[1]-a[1]).slice(0,10),[y,mm]=m.split("-").map(Number),ld=new Date(y,mm,0).getDate();
  return `<details class="why"><summary>Eerdere maanden bekijken (archief)</summary><div class="meta"><select id="tarch">${ms.map(x=>`<option${x===m?" selected":""}>${x}</option>`).join("")}</select> RDW-overschrijvingen ${TMND[mm-1]} ${y} (1 tot ${ld} ${TMND[mm-1]}), top 10, gesorteerd op aantal.</div><ol>${T.map(([k,n])=>{const o=nm[k];return `<li>${esc(o?o.merk+" "+o.model:k)} <span class="meta">${fmt(n)}</span></li>`}).join("")}</ol></div></details>`};
 $("#fban").innerHTML=bannerKlein(A.length,base.length,gLabels(["ts","tm"]));
 const _trSec=(typeof TR!=="undefined"&&TR&&TR.secties&&TR.secties.modeltrends)||{type:"overschrijvingen",regio:"NL",bron:"RDW open data",frequentie:"elke full + quick (RDW-cache ~20 u)",meetdatum:MT.bijgewerkt,verouderd:false};
 $("#cards").innerHTML=`<article class="card wide trw"><div class="body"><h2 class="t">Trends — ontwikkeling in de tijd</h2>${trConclusies(MT,A,p,P)}${trBadge(Object.assign({},_trSec,{meetdatum:(MT.bijgewerkt||"").slice(0,10)}))}<div class="seg"><button data-tmode="feiten" class="${md==="feiten"?"on":""}">Feiten (RDW)</button><button data-tmode="opkomend" class="${md==="opkomend"?"on":""}">Opkomend (signalen)</button></div><div class="meta">${md==="feiten"?"<b>Feiten</b>: wat er echt is overgeschreven volgens de RDW. Geen schattingen.":"<b>Opkomend</b>: vroege signalen en een trendscore. Dit zijn <b>schattingen</b>, elk met reden."}</div>
  <div class="meta">Periode: <b>${esc(nu)}</b>, vergeleken met <b>${esc(vo)}</b>. Bron: RDW (overschrijvingen) en onze eigen scans. Bijgewerkt ${esc(MT.bijgewerkt)}.</div>
  <div class="seg">${Object.keys(TPL).filter(k=>MT.perioden[k]&&!(k==="dag"&&md==="opkomend")).map(k=>`<button data-tp="${k}" class="${p===k?"on":""}">${TPL[k]}</button>`).join("")}</div>${uit}
  <div class="seg">${gb("ts","alles","Alle segmenten",As.length)}${Object.keys(TSEG).map(k=>gb("ts",k,TSEG[k],sc(k))).join("")}</div>
  <details class="why"${G.tm.length?" open":""}><summary>Merk${G.tm.length?": "+esc(G.tm.join(", ")):""}</summary><div class="seg">${gb("tm","alles","Alle merken",Am.length)}${merken.map(m=>gb("tm",m,esc(m),mc[m]||0)).join("")}</div></details>
  <div class="ttops">${(md==="feiten"?["volume"]:["groei","daal","score"]).map(top).join("")}</div>${md==="feiten"?arch():""}
  <label class="meta"${md==="feiten"?" hidden":""}>Lijst hieronder gesorteerd op <select id="tsort">${TSORT.filter(x=>x[0]!=="volume").map(([k,l])=>`<option value="${k}"${so===k?" selected":""}>${l}</option>`).join("")}</select></label>
  <div class="meta">${esc(SEC[so].u)} ${L.length} modellen.</div></div></article>`
  +(md==="opkomend"&&typeof opkomendSectie==="function"?opkomendSectie(segOK,mkOK):"")
  +(md==="feiten"&&typeof verkoopSectie==="function"?`<article class="card wide vkt"><div class="body"><details class="why vk-det"${localStorage.vk_open==="0"?"":" open"}><summary><b>Verkoopcijfers per merk (RDW)</b>: nieuw, import en occasion per maand, half jaar of jaar</summary>${verkoopSectie()}</details></div></article>`:"")
  +(L.length?L.slice(0,MTMEER).map(row).join("")+(L.length>MTMEER?`<button class="sec" id="tmeer">Meer tonen (${L.length-MTMEER})</button>`:""):'<div class="empty">Geen modellen met deze filters.</div>')}
document.addEventListener("click",e=>{const tm=e.target.closest("[data-tmode]");if(tm){localStorage.tr_m=tm.dataset.tmode;MTMEER=40;render();return}const t=e.target.closest("[data-tp]");if(t){localStorage.tr_p=t.dataset.tp;render();return}
 if(e.target.closest("#tmeer")){MTMEER+=40;render();return}
 const a=e.target.closest("[data-tm]");if(a){e.preventDefault();if(!document.getElementById("tr-"+a.dataset.tm)){localStorage.tr_m=a.dataset.tms==="volume"?"feiten":"opkomend";if(a.dataset.tms!=="volume")localStorage.tr_s=a.dataset.tms;MTMEER=Math.max(MTMEER,40);render()}if(!document.getElementById("tr-"+a.dataset.tm)){MTMEER=5000;render()}setTimeout(()=>{const x=document.getElementById("tr-"+a.dataset.tm);if(x){x.scrollIntoView({block:"start"});x.classList.add("hl")}},50);return}
 const k=e.target.closest("[data-kwp]");if(k){const[m,mo]=k.dataset.kwp.split("|");kwPrefill(m,mo)}});
document.addEventListener("change",e=>{if(e.target.id==="tarch"){localStorage.tr_am=e.target.value;render();return}if(e.target.id==="tsort"){localStorage.tr_s=e.target.value;MTMEER=40;render()}});
function kwPrefill(m,mo){const go=()=>{const mk=Object.keys(CATL||{}).find(x=>x.toLowerCase()===m.toLowerCase());KF={uitv:[],gens:[],opt:{}};
  if(mk){KF.merk=mk;const md=Object.keys(CATL[mk]).find(x=>x.toLowerCase()===mo.toLowerCase())||Object.keys(CATL[mk]).find(x=>x.toLowerCase().startsWith(mo.toLowerCase()));if(md)KF.model=md;else{KF.model=AND;KF.model_x=mo}}else{KF.merk=AND;KF.merk_x=m;KF.model_x=mo}
  seg=7;render();setTimeout(()=>{const f=$("#kwform");if(f)f.scrollIntoView({block:"start"});toast("Zoekopdracht voorgevuld met "+m+" "+mo,2500)},100)};
 if(typeof CATL==="undefined"||!CATL)fetch("catalog.json").then(r=>r.json()).then(j=>{CATL=j.merken;go()}).catch(()=>{CATL={};go()});else go()}

document.addEventListener("click",e=>{const g=e.target.closest("[data-goto]");if(g){seg=+g.dataset.goto;render()}});
