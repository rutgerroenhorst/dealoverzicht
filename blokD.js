// Tab 'Trends': overschrijvingen (RDW) + aanbod/prijzen uit eigen scans + 'mogelijk trending'. Data: modeltrends.json (pipeline/modeltrends.py).
let MT=null,MTMEER=40;const TPL={week:"Week",maand:"Maand",halfjaar:"Halfjaar"},TSEG={brns:"BRNS-segment",exclusief:"Exclusief",handel:"Dagelijkse handel",flips:"< €1.000 flips"};
const TSORT=[["score","Mogelijk trending"],["volume","Meeste overschrijvingen"],["groei","Snelste groei"],["aanbod","Aanbod daalt"]];
function tp(){return localStorage.tr_p||"maand"}function tsort(){return localStorage.tr_s||"score"}
function tDeals(o){if(!D)return[];const mk=o.mk.replace(/-/g," "),re=new RegExp("(^|[^a-z0-9])"+o.md.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/-klasse$/,"(-klasse|\\b\\s?\\d{2,3})").replace(/-serie$/,"(-serie|\\d{2}\\w*)")+"([^a-z0-9]|$)");
 return D.segmenten.flatMap(s=>s.deals.map(d=>({d,s}))).filter(({d})=>{const t=(d.titel||"").toLowerCase();return t.replace(/-/g," ").startsWith(mk)&&re.test(t.slice(mk.length))})}
function trends(){$("#kpis").innerHTML="";if(!MT){$("#cards").innerHTML='<div class="meta">Trends laden…</div>';fetch("modeltrends.json?"+Date.now()).then(r=>{if(!r.ok)throw 0;return r.json()}).then(j=>{MT=j;render()}).catch(()=>{$("#cards").innerHTML='<div class="empty">Nog geen trenddata (komt na de eerstvolgende run).</div>'});return}
 const p=tp(),P=MT.perioden[p],so=tsort(),fmt=n=>Number(n).toLocaleString("nl-NL");
 const segOK=o=>!G.ts.length||G.ts.some(s=>o.seg.includes(s)),mkOK=o=>!G.tm.length||G.tm.includes(o.merk);
 const nieuw=o=>{const r=o.rdw[p]||[0,0];return r[1]<Math.max(10,r[0]*0.25)},kort=o=>o.zeker[p]==="laag"||nieuw(o),trendOK=o=>!kort(o);  // nieuw op de markt of te korte historie: geen trend
 const base=MT.modellen.filter(o=>o.rdw[p][0]+o.rdw[p][1]>0||o.aanbod);
 const A=base.filter(o=>segOK(o)&&mkOK(o)),As=base.filter(mkOK),Am=base.filter(segOK);
 const sk={score:o=>o.score[p]==null?-1e9:o.score[p]*10+Math.log10(1+o.rdw[p][0]),volume:o=>o.rdw[p][0],groei:o=>o.groei[p]==null?-1e9:o.groei[p],aanbod:o=>o.dn[p]==null?-1e9:-o.dn[p]}[so];
 const L=[...A].filter(o=>(so!=="score"&&so!=="groei")||(trendOK(o)&&(so!=="score"||o.score[p]!=null))).sort((a,b)=>sk(b)-sk(a));
 const mc={};Am.forEach(o=>mc[o.merk]=(mc[o.merk]||0)+1);const merken=Object.keys(mc).sort((a,b)=>mc[b]-mc[a]).slice(0,30).concat(G.tm.filter(m=>!(m in mc)));
 const top=(f,t,fn)=>`<div class="ttop"><b>${t}</b><ol>${[...A].filter(f).sort(fn).slice(0,5).map(o=>`<li><a href="#" data-tm="${esc(o.k)}">${esc(o.merk+" "+o.model)}</a> <span class="meta">${esc(TOPV[t](o))}</span></li>`).join("")||"<li class=meta>–</li>"}</ol></div>`;
 const TOPV={"Meeste overschrijvingen":o=>fmt(o.rdw[p][0]),"Snelste stijgers":o=>(o.groei[p]>=0?"+":"")+o.groei[p]+"% t.o.v. markt","Mogelijk trending":o=>"score "+o.score[p]+" · "+o.zeker[p]};
 const row=o=>{const r=o.rdw[p],g=o.groei[p],sc=o.score[p],dl=tDeals(o),an=o.aanbod;
  return `<article class="card tr" id="tr-${esc(o.k)}"><div class="body"><div class="meta">${o.seg.map(s=>`<span class="chip">${esc(TSEG[s])}</span>`).join("")}</div>
  <h2 class="t">${esc(o.merk+" "+o.model)}${sc!=null?` <span class="chip ${sc>=25?"ok":sc<=-25?"bad":""}" title="Combinatie van de signalen hieronder (−100…+100). Zekerheid: ${esc(o.zeker[p])}.">${sc>0?"+":""}${sc} · ${esc(o.zeker[p])}</span>`:""}</h2>
  <div class="specs"><div><span>Overschrijvingen</span><b>${fmt(r[0])}</b></div><div><span>Vorige ${TPL[p].toLowerCase()}</span><b>${fmt(r[1])}</b></div><div><span>T.o.v. markt</span><b class="${g>0?"pos":g<0?"neg":""}">${g==null?"–":(g>0?"+":"")+g+"%"}</b></div>${an?`<div><span>In ons aanbod</span><b>${fmt(an.n)}</b></div><div><span>Mediaan vraagprijs</span><b>${eur(an.med)}</b></div>`:""}</div>
  <div class="chips">${(o.redenen[p]||[]).map(x=>`<span class="chip ${x.pos?"ok":x.neg?"bad":""}">${esc(x.t)}</span>`).join("")}${an&&o.dn[p]==null?'<span class="chip">aanbod-/prijstrend: nog te weinig eigen historie</span>':""}${an&&o.dal[p]?`<span class="chip">${o.dal[p]} prijsdaling${o.dal[p]>1?"en":""} in ons aanbod</span>`:""}</div>
  <div class="act">${dl.length?`<details class="trd"><summary class="btn sm sec">Deals nu (${dl.length})</summary>${dl.slice(0,8).map(({d,s})=>`<a data-deal="${esc(d.id)}" href="?deal=${esc(d.id)}#deal-${esc(d.id)}">${esc(d.titel)}</a> · ${eur(d.autos.find(a=>a.url===d.deal_url).prijs)} <span class="meta">(${esc(s.id==="flips"?KL.tabs.flips:KL.tabs.inkoop)})</span>`).join("<br>")}</details>`:'<span class="meta">Geen deals in de app voor dit model</span>'}
  <button class="btn sm" data-kwp="${esc(o.merk)}|${esc(o.model)}">Klantzoekopdracht maken</button></div></div></article>`};
 const uit=`<details class="why"><summary>Hoe lees je dit?</summary><div class="meta"><p><b>Overschrijvingen</b> = auto's die in deze periode op een nieuwe eigenaar zijn gezet volgens de RDW (alleen personenauto's, géén nieuwe auto's en géén eerste registratie in NL, dus ook geen verse imports). Dat is níet hetzelfde als verkopen: ook leasewissels, bedrijfsoverdrachten en handel-naar-handel tellen mee.</p>
 <p><b>Let op:</b> de RDW bewaart alleen de láátste overschrijving per kenteken. Een auto die later opnieuw is overgeschreven, telt in een oudere periode niet meer mee. Oudere periodes lijken daardoor kleiner. Daarom vergelijken we de groei van een model met de groei van de hele markt in dezelfde periodes (<b>t.o.v. markt</b>): +30% betekent dat het model 30% harder groeide dan gemiddeld. Vanaf nu slaan we elke dag de overschrijvingen van die dag zelf op, zodat de cijfers steeds zuiverder worden.</p>
 <p><b>Aanbod</b> en <b>mediaan vraagprijs</b> komen uit onze eigen scans (AutoScout24/Marktplaats). Verdwenen advertenties zijn een aanwijzing voor verkocht, geen bewijs. Deze aanbodtrends hebben eigen historie nodig (sinds ${esc(MT.historie_sinds)}).</p>
 <p><b>Mogelijk trending</b> combineert: meer overschrijvingen dan de markt, minder aanbod, stijgende vraagprijs, sneller verdwijnende advertenties en (halfjaar) veilingprijzen. Zekerheid ‘hoog’ alleen bij meerdere signalen en genoeg volume. Dit is een indicatie om verder te kijken, geen voorspelling.</p>
 <p>Periode ${esc(P.van)} t/m ${esc(P.tot)} vs ${esc(P.vvan)} t/m ${esc(P.vtot)} (laatste ~2 dagen niet meegeteld, RDW loopt achter). Hele markt: ${fmt(P.markt[0])} vs ${fmt(P.markt[1])} overschrijvingen. Groei pas getoond vanaf ${MT.min[p]} overschrijvingen (beide periodes samen).</p></div></details>`;
 const sc=k=>As.filter(o=>o.seg.includes(k)).length;
 $("#fban").innerHTML=bannerKlein(A.length,base.length,gLabels(["ts","tm"]));
 $("#cards").innerHTML=`<article class="card wide"><div class="body"><h2 class="t">📈 Trends per model</h2><div class="meta">Bijgewerkt ${esc(MT.bijgewerkt)}</div>${uit}
  <div class="seg">${Object.keys(TPL).map(k=>`<button data-tp="${k}" class="${p===k?"on":""}">${TPL[k]}</button>`).join("")}</div>
  <div class="seg">${gb("ts","alles","Alle segmenten",As.length)}${Object.keys(TSEG).map(k=>gb("ts",k,TSEG[k],sc(k))).join("")}</div>
  <details class="why"${G.tm.length?" open":""}><summary>Merk${G.tm.length?": "+esc(G.tm.join(", ")):""}</summary><div class="seg">${gb("tm","alles","Alle merken",Am.length)}${merken.map(m=>gb("tm",m,esc(m),mc[m]||0)).join("")}</div></details>
  <label class="meta">Sorteren <select id="tsort">${TSORT.map(([k,l])=>`<option value="${k}"${so===k?" selected":""}>${l}</option>`).join("")}</select></label>
  <div class="ttops">${top(o=>o.rdw[p][0]>0,"Meeste overschrijvingen",(a,b)=>b.rdw[p][0]-a.rdw[p][0])}${top(o=>o.groei[p]!=null&&trendOK(o),"Snelste stijgers",(a,b)=>b.groei[p]-a.groei[p])}${top(o=>o.score[p]!=null&&trendOK(o),"Mogelijk trending",(a,b)=>b.score[p]-a.score[p])}</div></div></article>`
  +(L.length?L.slice(0,MTMEER).map(row).join("")+(L.length>MTMEER?`<button class="sec" id="tmeer">Meer tonen (${L.length-MTMEER})</button>`:""):'<div class="empty">Geen modellen met deze filters.</div>')}
document.addEventListener("click",e=>{const t=e.target.closest("[data-tp]");if(t){localStorage.tr_p=t.dataset.tp;render();return}
 if(e.target.closest("#tmeer")){MTMEER+=40;render();return}
 const a=e.target.closest("[data-tm]");if(a){e.preventDefault();const el=document.getElementById("tr-"+a.dataset.tm);if(!el){localStorage.tr_s="volume";MTMEER=2000;render()}setTimeout(()=>{const x=document.getElementById("tr-"+a.dataset.tm);if(x){x.scrollIntoView({block:"start"});x.classList.add("hl")}},50);return}
 const k=e.target.closest("[data-kwp]");if(k){const[m,mo]=k.dataset.kwp.split("|");kwPrefill(m,mo)}});
document.addEventListener("change",e=>{if(e.target.id==="tsort"){localStorage.tr_s=e.target.value;MTMEER=40;render()}});
function kwPrefill(m,mo){const go=()=>{const mk=Object.keys(CATL||{}).find(x=>x.toLowerCase()===m.toLowerCase());KF={uitv:[],gens:[],opt:{}};
  if(mk){KF.merk=mk;const md=Object.keys(CATL[mk]).find(x=>x.toLowerCase()===mo.toLowerCase())||Object.keys(CATL[mk]).find(x=>x.toLowerCase().startsWith(mo.toLowerCase()));if(md)KF.model=md;else{KF.model=AND;KF.model_x=mo}}else{KF.merk=AND;KF.merk_x=m;KF.model_x=mo}
  seg=7;render();setTimeout(()=>{const f=$("#kwform");if(f)f.scrollIntoView({block:"start"});toast("Zoekopdracht voorgevuld met "+m+" "+mo,2500)},100)};
 if(typeof CATL==="undefined"||!CATL)fetch("catalog.json").then(r=>r.json()).then(j=>{CATL=j.merken;go()}).catch(()=>{CATL={};go()});else go()}
