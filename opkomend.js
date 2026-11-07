/* Trends, Opkomend (04-11-2026): vroege signalen per model met fase, waarom, periode en bron. Data: opkomend.json (pipeline/opkomend.py). */
let OK_=null;const OKF=["Vroeg signaal","Opkomend","Piek","Afkoelend"],OKS={feit:"feit",patroon:"patroon",regel:"regel",signaal:"signaal",schatting:"schatting"};
function okDatum(d){return String(d||"").slice(0,10).split("-").reverse().join("-")}
function opkomendSectie(segOK,mkOK){
 if(OK_===null){OK_=0;fetch("opkomend.json?"+Date.now()).then(r=>r.ok?r.json():{modellen:[]}).then(j=>{OK_=j;render()}).catch(()=>{OK_={modellen:[]}})}
 if(!OK_)return '<article class="card wide"><div class="body"><div class="meta">Vroege signalen laden...</div></div></article>';
 const L=(OK_.modellen||[]).filter(o=>(!segOK||segOK(o))&&(!mkOK||mkOK(o)));const T=OK_.trefkans||{};
 const tk=T.pct!=null?`Trefkans tot nu toe: <b>${T.pct}%</b> (${T.raak} van ${T.totaal} voorspellingen raak).`:`Trefkans: nog niet te toetsen. De eerste voorspellingen (${esc((T.per_maand||[]).map(x=>x.maand).join(", ")||"deze maand")}) worden getoetst zodra de RDW-cijfers van de maand erna compleet zijn.`;
 const sig=s=>`<li>${esc(s.t)} <span class="meta">(${esc(OKS[s.soort]||s.soort)}; periode: ${esc(s.per)}; bron: ${/^https?:/.test(s.bron||"")?`<a href="${esc(s.bron)}" target="_blank" rel="noopener">bron</a>`:esc(s.bron)}${s.status?"; "+esc(s.status):""})</span></li>`;
 const rij=o=>`<details class="why"><summary><b>${esc(o.merk)} ${esc(o.model)}</b> <span class="meta">score ${o.score}, ${o.signalen.length} signalen</span></summary><div class="meta"><b>Waarom:</b> ${esc(o.waarom)}</div><ul>${o.signalen.map(sig).join("")}</ul></details>`;
 const groep=f=>{const G=L.filter(o=>o.fase===f);if(!G.length)return "";return `<details class="why ok-fase"${f==="Vroeg signaal"?" open":""}><summary><b>${esc(f)} (${G.length})</b></summary>${G.slice(0,30).map(rij).join("")}${G.length>30?`<div class="meta">En nog ${G.length-30} modellen.</div>`:""}</details>`};
 const kal=(OK_.kalender||[]).map(e=>`<li><b>${okDatum(e.datum)}</b>: ${esc(e.titel)} <span class="meta">(${esc(e.status||"")}; <a href="${esc(e.bron)}" target="_blank" rel="noopener">bron</a>)</span><div class="meta">${esc(e.effect)}</div></li>`).join("");
 return `<article class="card wide okm"><div class="body"><h2 class="t">Vroege signalen per model</h2>
 <div class="meta">Gesorteerd op fase (eerst Vroeg signaal), daarbinnen op score. Score en fase zijn <b>schattingen</b> op basis van de signalen eronder; elk signaal noemt zijn periode en bron. RDW-periode: ${esc(OK_.periode_rdw||"")}. Bijgewerkt ${esc(OK_.bijgewerkt||"")}.</div>
 <div class="meta"><b>Fasen</b>: Vroeg signaal = RDW stijgt nog niet duidelijk, wel 2 of meer vroege signalen. Opkomend = overschrijvingen deze maand minstens 10% sneller dan de markt. Piek = halfjaar sterk gegroeid, deze maand afgevlakt. Afkoelend = deze maand minstens 10% achter op de markt.</div>
 <div class="meta">${tk} ${esc(T.uitleg||"")}</div>
 ${OKF.map(groep).join("")||'<div class="meta">Geen modellen met deze filters.</div>'}
 <details class="why"><summary><b>Belasting- en regelkalender (${(OK_.kalender||[]).length})</b></summary><ul>${kal}</ul></details>
 <details class="why"><summary><b>Bronnen en perioden</b></summary><ul>${(OK_.bronnen||[]).map(b=>`<li>${esc(b.naam)}: ${esc(b.soort)}, ${esc(b.per)}</li>`).join("")}${(OK_.niet||[]).map(t=>`<li>${esc(t)}</li>`).join("")}</ul></details>
 </div></article>`}
