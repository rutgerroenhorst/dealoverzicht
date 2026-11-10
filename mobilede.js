/* mobile.de-tab: deals uit de inbox-parser (webapp/mobilede_deals.json). */
var MDE=null;
function mobilede(){$("#kpis").innerHTML="";
 if(!MDE){$("#cards").innerHTML='<div class="meta">mobile.de-deals laden…</div>';fetch("mobilede_deals.json?"+Date.now()).then(r=>r.ok?r.json():[]).catch(()=>[]).then(j=>{MDE=Array.isArray(j)?j:[];mobilede()});return}
 const e=x=>esc(String(x==null?"":x)),eu=v=>"€"+Math.round(v||0).toLocaleString("nl-NL");
 const L=MDE.filter(d=>!d.test).sort((a,b)=>(b.marge||0)-(a.marge||0));
 if(!L.length){$("#cards").innerHTML='<div class="empty"><b>Wacht op eerste melding van mobile.de.</b><br>Deals komen hier binnen via de opgeslagen zoekopdrachten van mobile.de: elke e-mailmelding wordt automatisch gelezen, doorgerekend (NL-waarde − vraagprijs − rest-BPM − transport − RDW-keuring − btw) en alleen getoond als de marge boven de drempel ligt. We halen niets van de site zelf op.</div>';return}
 const zk={zeker:"BPM zeker",aangenomen:"BPM aangenomen",onzeker:"BPM onzeker"};
 $("#cards").innerHTML=L.map(d=>`<article class="card" id="deal-${e(d.id)}">${d.foto?`<img class="foto" loading="lazy" src="${e(d.foto)}" alt="">`:""}
 <div class="meta">🌍 ${e(d.label||"Import DE · mobile.de")}${d.verkoper==="particulier"?' · <span class="chip">Particulier</span>':""}</div>
 <h3>${e(d.titel)}</h3><div class="meta">${e(d.jaar)}${d.km?" · "+(+d.km).toLocaleString("nl-NL")+" km":""}${d.plaats?" · "+e(d.plaats):""} · ${e(d.btw)}</div>
 <div><b>Vraagprijs ${eu(d.prijs)}</b> · NL-waarde ${eu(d.nl_waarde)} · <b>marge ${eu(d.marge)}</b></div>
 <div class="meta">BPM ${d.bpm_laag!=null&&d.bpm_laag!==d.bpm_hoog?eu(d.bpm_laag)+"–"+eu(d.bpm_hoog):eu(d.bpm)} <span class="chip">${e(zk[d.bpm_zekerheid]||"BPM ?")}</span></div>
 <details><summary>Kosten</summary>${(d.kosten||[]).map(k=>`<div>${e(k.post)}: ${eu(k.bedrag)}</div>`).join("")}${d.bpm_uitleg?`<div class="meta">BPM-methode: ${e(d.bpm_uitleg)}</div>`:""}</details>
 <div class="meta">Waarom: ${e(d.waarom)}</div>
 <a class="btn" href="${e(d.url)}" target="_blank" rel="noopener">Advertentie</a></article>`).join("")}
