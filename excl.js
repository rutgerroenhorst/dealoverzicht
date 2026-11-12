/* Exclusief & Verzamel + Prijstrends (waarde-oordeel). Los bestand zodat app.js zo weinig mogelijk verandert. */
let TR=null,TRS="pct",TRQ="";
const WKL={"te weinig data":"wk-onb","Stijgend":"wk-inv","Stabiel":"wk-vast","Dalend":"wk-leeg","nog te weinig historie":"wk-onb"};
function wkl(d){return (d.waarde&&d.waarde.klasse)||"nog te weinig historie"}
function xfOK(d){return gx("xf",XFP,d)&&gIn("wf",wkl(d))}
function xfbar(all,isBrns,allW){allW=allW||all;const n=f=>all.filter(f).length,nw=f=>allW.filter(f).length,b=(k,l,c,v)=>gb(v,k,l,c);
 const x=isBrns?`<div class="seg">${b("alles","Alles",all.length,"xf")}${b("excl","Exclusief & Verzamel",n(d=>d.exclusief),"xf")}${b("verz","Verzameling/Stijgend",n(d=>d.exclusief&&d.exclusief.categorie.startsWith("Verzameling")),"xf")}${b("handel","Dagelijkse handel",n(d=>d.exclusief&&d.exclusief.categorie==="Dagelijkse handel"),"xf")}</div>`:"";
 const w=`<div class="seg">${b("alles","Alle waarde",allW.length,"wf")}${["Stijgend","Stabiel","Dalend","nog te weinig historie"].map(k=>b(k,k==="nog te weinig historie"?"Te weinig historie":k,nw(d=>wkl(d)===k),"wf")).join("")}</div>`;return x+w}
function xbadges(d){let h="";const e=d.exclusief,w=d.waarde;
 if(e){h+=`<span class="chip excl" title="${esc(e.naam)}, ${esc(e.categorie)}">${esc(e.categorie==="Dagelijkse handel"?"Exclusief · dagelijkse handel":"Exclusief")}</span>`;
  (e.labels||[]).forEach(l=>{h+=`<span class="chip excl2"${l.startsWith("Gelimiteerd")&&e.oplage?` title="Totale productie volgens ${esc(e.oplage.bron)}"`:""}>${esc(l)}</span>`})}
 if(d.marge_onzeker)h+=`<span class="chip warn" title="Minder dan 3 vergelijkbare advertenties in NL/DE/BE: de marge is een grove schatting.">marge onzeker (${d.n_vergelijk||0} vergelijkbaar)</span>`;
 if(w){const k=w.klasse,p=w.pct!=null?(w.pct>0?"+":"")+String(w.pct).replace(".",",")+"%":"";
  const tip=k==="nog te weinig historie"?`Nog te weinig prijshistorie voor ${w.groep||"deze groep"} (${w.uitleg||""}). Eigen metingen lopen sinds de eerste ochtendrun; na 4 weken komt er een trend.`:
   `${k}: ${p} over ${w.periode}${w.toen?` (toen ${eur(w.toen)}, nu ${eur(w.nu)})`:w.nu_usd?` (typische veilingprijs nu $${Math.round(w.nu_usd).toLocaleString("nl-NL")})`:""}. Groep: ${w.groep}. ${w.punten?w.punten+" datapunten. ":""}Bron: ${w.extern?(w.soort+", "+w.bron):w.bron}`;
  h+=`<span class="chip ${WKL[k]||"wk-onb"}" title="${esc(tip)}">${esc(k==="nog te weinig historie"?"Waarde: nog te weinig historie":k+" "+p)}${w.extern?" (extern)":""}</span>`;
  if(w.extern&&w.bron)h+=`<a class="chip" href="${esc(w.bron)}" target="_blank" rel="noopener" title="Bron van de waardetrend">bron trend</a>`}
 return h}
function spark(r){if(!r||r.length<2)return `<span class="meta">1 meetpunt</span>`;const v=r.map(x=>x[1]),mn=Math.min(...v),mx=Math.max(...v),W=90,H=24;
 const pts=v.map((y,i)=>`${(i/(v.length-1)*W).toFixed(1)},${(H-2-(mx===mn?0.5:(y-mn)/(mx-mn))*(H-4)).toFixed(1)}`).join(" ");return `<svg class="spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><polyline fill="none" stroke="currentColor" stroke-width="1.5" points="${pts}"/></svg>`}
document.addEventListener("click",e=>{const b=e.target.closest("[data-mea]");if(b){MEA=+b.dataset.mea;prijstrends()}});
let ME=null,MEA=0;
/* === Markt-tab upgrades 06-11-2026 (sectiemeta, conclusies, EUR-BaT, betrouwbaarheid) === */
function mkBadge(sec){
  if(!sec)return '';
  const oud=sec.verouderd?' <span class="chip wk-leeg">verouderd</span>':'';
  const d=sec.meetdatum?sec.meetdatum.slice(0,10):'n.b.';
  const leeft=sec.leeftijd_dagen!=null?` · ${sec.leeftijd_dagen} d geleden`:'';
  return `<div class="mk-meta"><span class="chip">${esc(sec.type||'')}</span> <span class="chip">${esc(sec.regio||'')}</span> <span class="chip">${esc(sec.valuta||'')}</span>
  <span class="meta">Bron: ${esc(sec.bron||'')} · gemeten ${esc(d)}${leeft} · verversing: ${esc(sec.frequentie||'')}</span>${oud}
  ${sec.verouderd?`<div class="meta warn">Deze sectie is ouder dan de verwachte frequentie (${esc(String(sec.max_leeftijd_dagen))} d). Cijfers niet als actueel behandelen.</div>`:''}</div>`;
}
function mkConclusies(C){
  if(!C||!C.length)return '';
  return `<h3>Dealerconclusies (nu inkopen)</h3><div class="mk-concl">${C.slice(0,3).map(c=>`<div class="mk-concl-i"><b>${esc(c.wat)}</b><div class="meta">Waarom: ${esc(c.waarom)}</div><div class="meta">Betekenis: ${esc(c.betekenis)}</div></div>`).join('')}</div>
  <div class="meta">Markt = aanbod en vraagprijzen nu. Voor ontwikkeling in de tijd: tab <button type="button" class="chip" data-goto="16">Trends</button>.</div>`;
}
function mkBet(g){return g.betrouwbaarheid?`<span class="meta" title="Betrouwbaarheid">${esc(g.betrouwbaarheid)}</span>`:''}
function sparkN(r,periode){
  if(!r||r.length<2)return `<span class="meta">1 meetpunt</span>`;
  let pts=r;
  if(periode==='3m'){const cut=Date.now()-90*864e5;pts=r.filter(x=>+new Date(x[0])>=cut);if(pts.length<2)pts=r}
  if(periode==='6m'){const cut=Date.now()-180*864e5;pts=r.filter(x=>+new Date(x[0])>=cut);if(pts.length<2)pts=r}
  const v=pts.map(x=>x[1]),mn=Math.min(...v),mx=Math.max(...v),W=110,H=28;
  const p=v.map((y,i)=>`${(i/(v.length-1)*W).toFixed(1)},${(H-2-(mx===mn?0.5:(y-mn)/(mx-mn))*(H-4)).toFixed(1)}`).join(' ');
  const title=pts.map(x=>`${x[0]}: ${x[1]}${x[2]!=null?' (n='+x[2]+')':''}`).join(' · ');
  return `<svg class="spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" title="${esc(title)}"><polyline fill="none" stroke="currentColor" stroke-width="1.5" points="${p}"/>${pts.map((x,i)=>{const px=(i/(pts.length-1)*W);const py=H-2-(mx===mn?0.5:(x[1]-mn)/(mx-mn))*(H-4);return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1.6" fill="currentColor"/>`}).join('')}</svg>`;
}
let TRPER='alles';
function euSectie(q){if(!ME)return '<div class="meta">Europese marktdata laden…</div>';if(!ME.modellen||!ME.modellen.length)return '<div class="meta">Nog geen Europese marktdata (komt na de volgende ochtendrun).</div>';
 const pc=v=>v==null?'n.b.':(v>0?'+':'')+String(v).replace('.',',')+'%',nl=d=>d?d.split('-').reverse().join('-'):'';
 const cel=(o,s)=>o.nu[s]?`${eur(o.nu[s][1])}<br><small>${o.nu[s][0]}×</small>`:'n.b.';
 const tr=(o,l)=>{const t=o.trend[l];return t&&t.a!=null?pc(t.a):'n.b.'};
 const luxe=o=>(o.seg&&o.seg.length)||o.nu.a[1]>=50000;
 const tv=o=>{const t=o.trend||{};for(const k of ['d30','d7','d90','sinds']){if(t[k]&&t[k].a!=null)return t[k].a}return null};
 // MARKT-SORT 09-11: de knoppen Stijgers/Dalers/Meeste data/Naam sorteren nu ook deze bovenste EU-tabel (eerder alleen de eigen-metingentabel lager op de pagina).
 const nul=(x,y,f)=>x==null&&y==null?0:x==null?1:y==null?-1:f(x,y);
 const esrt=(a,b)=>TRS==='pct'?nul(tv(a),tv(b),(x,y)=>y-x):TRS==='pctasc'?nul(tv(a),tv(b),(x,y)=>x-y):TRS==='n'?((b.nu.a&&b.nu.a[0])||0)-((a.nu.a&&a.nu.a[0])||0):(a.merk+' '+a.model).localeCompare(b.merk+' '+b.model);
 const L=ME.modellen.filter(o=>MEA||q?true:luxe(o)).filter(o=>!q||(o.merk+' '+o.model).toLowerCase().includes(q)).slice().sort(esrt).slice(0,MEA?400:80);
 const srtLabel={pct:'grootste stijgers (30 d, anders 7/90 d of sinds 1e meting; zonder trend onderaan)',pctasc:'grootste dalers (zonder trend onderaan)',n:'meeste advertenties',naam:'naam'}[TRS]||'';
 const vk=o=>o.verkocht?`${eur(o.verkocht.med)}<br><small>${o.verkocht.n}× · ${o.verkocht.dagen} d online</small>`:(o.weg30?`<small>nog niet bevestigd (${o.weg30} weg in 30 d)</small>`:'n.b.');
 const rd=(v,g)=>v?`${v[0]}<br><small>vorige ${v[1]}${g!=null?' · '+pc(g)+' t.o.v. markt':''}</small>`:'n.b.';
 const R=ME.rdw_perioden||{},ov=R.over||{},im=R.imp||{};
 const sec=(TR.secties&&TR.secties.markt_eu)||{type:'vraagprijs',regio:'NL/DE/BE',valuta:'EUR',bron:'eigen scans + RDW',frequentie:'elke full + quick',meetdatum:ME.bijgewerkt,leeftijd_dagen:null,verouderd:false,max_leeftijd_dagen:2};
 return `<h3>Europese markt (eigen scans NL/DE/BE + RDW)</h3>
 ${mkBadge(Object.assign({},sec,{meetdatum:(ME.bijgewerkt||'').slice(0,10)}))}
 <div class="meta">Vraagprijzen uit onze eigen scans (AutoScout24 NL/DE/BE/LU/IT/AT, Marktplaats, AutoTrack), mediaan per model. Trend 7/30/90 dagen verschijnt zodra er zoveel dagen historie is (eerste meting ${esc(nl(ME.eerste_meting))}, nu ${ME.historie_dagen} meetdagen). <b>Geschat verkocht</b> = laatste vraagprijs van advertenties die bevestigd verdwenen zijn (<b>schatting, laatste vraagprijs</b>, geen transactieprijs). Dagen online telt pas vanaf onze eerste meting. RDW: overschrijvingen ${esc(nl(ov.van))} t/m ${esc(nl(ov.tot))} en importen van gebruikte auto's (eerste toelating ≥ 3 maanden vóór NL-registratie) ${esc(nl(im.van))} t/m ${esc(nl(im.tot))}, telkens met de 30 dagen daarvoor.</div>
 <div class="frow" style="margin:6px 0"><div class="seg"><button data-mea="0" class="${MEA?'':'on'}">Luxe en sport</button><button data-mea="1" class="${MEA?'on':''}">Alle modellen</button></div></div>
 <div class="tw"><table class="trt"><tr><th>Model</th><th>Mediaan EU</th><th>NL</th><th>DE</th><th>BE</th><th>Particulier</th><th>Bedrijf</th><th>7 d</th><th>30 d</th><th>90 d</th><th>Sinds 1e meting</th><th>Dagen online</th><th>Geschat verkocht</th><th>RDW overschrijvingen 30 d</th><th>RDW import 30 d</th></tr>
 ${L.map(o=>`<tr><td><b>${esc(o.merk+' '+o.model)}</b></td><td>${cel(o,'a')}</td><td>${cel(o,'NL')}</td><td>${cel(o,'DE')}</td><td>${cel(o,'BE')}</td><td>${cel(o,'P')}</td><td>${cel(o,'B')}</td><td style="text-align:right">${tr(o,'d7')}</td><td style="text-align:right">${tr(o,'d30')}</td><td style="text-align:right">${tr(o,'d90')}</td><td style="text-align:right">${o.trend.sinds?pc(o.trend.sinds.a)+'<br><small>sinds '+esc(nl(o.trend.sinds.sinds))+'</small>':'n.b.'}</td><td style="text-align:right">${o.dagen_online?o.dagen_online[1]:'n.b.'}</td><td>${vk(o)}</td><td>${rd(o.rdw&&o.rdw.over,o.rdw&&o.rdw.groei)}</td><td>${rd(o.rdw&&o.rdw.imp)}</td></tr>`).join('')}</table></div>
 <div class="meta">${L.length} modellen getoond${MEA?'':' (mediaan ≥ €50.000 of in je inkoopprofiel)'}, gesorteerd op ${srtLabel}. Bijgewerkt ${esc(ME.bijgewerkt)}.</div>`}

function prijstrends(){$('#kpis').innerHTML='';if(ME===null){ME=0;fetch('markt_eu.json?'+Date.now()).then(r=>r.json()).then(j=>{ME=j;if(TR)prijstrends()}).catch(()=>{ME={modellen:[]};if(TR)prijstrends()})}$('#cards').innerHTML='<div class="meta">Prijstrends laden…</div>';
 if(!TR){fetch('trends.json?'+Date.now()).then(r=>r.json()).then(j=>{TR=kmap(j);prijstrends()}).catch(()=>{$('#cards').innerHTML='<div class="empty">Nog geen prijstrends beschikbaar (komt na de eerste ochtendrun).</div>'});return}
 const minN=TR.top_min_n||5;
 const met=(TR.eigen_top&&TR.eigen_top.length?TR.eigen_top:TR.eigen.filter(g=>g.pct!=null&&(g.n_nu||0)>=minN));
 const q=TRQ.toLowerCase(),fq=x=>!q||(x.label||x.merk+' '+x.model).toLowerCase().includes(q);
 const srt=(a,b)=>TRS==='pct'?b.pct-a.pct:TRS==='pctasc'?a.pct-b.pct:TRS==='n'?(b.n||b.n_nu||0)-(a.n||a.n_nu||0):String(a.label||a.model).localeCompare(b.label||b.model);
 const S=TR.secties||{};
 $('#kpis').innerHTML=[[TR.groepen,'Groepen gemeten','Aantal spec-groepen met minstens 3 advertenties, gemeten bij elke ochtendrun (full).'],[TR.eerste_meting||'n.b.','Eerste eigen meting','Trend pas na minstens '+TR.min_dagen+' dagen.'],[met.length,'In toplijst (n≥'+minN+')','Alleen groepen met genoeg advertenties in de laatste meting.'],[TR.extern.length,'Externe waardetrends','Hagerty (VS), met bron en meetdatum.']].map(([b,s,t])=>`<div class="kpi"><b>${esc(b)}</b><span>${s} ${T(t)}</span></div>`).join('');
 const so=[['pct','Grootste stijgers'],['pctasc','Grootste dalers'],['n','Meeste data'],['naam','Naam']].map(([k,l])=>`<button data-trs="${k}" class="${TRS===k?'on':''}">${l}</button>`).join('');
 const per=[['alles','Hele reeks'],['6m','6 maanden'],['3m','3 maanden']].map(([k,l])=>`<button data-trper="${k}" class="${TRPER===k?'on':''}">${l}</button>`).join('');
 const vsd=v=>v?`${(v.pct>0?'+':'')+v.pct}%<br><small>EU ${eur(v.eu_med)} · ${v.eu_n}×</small>`:'n.b.';
 const row=(naam,k,p,toen,nu,per0,n,bron,sp,extra)=>`<tr class="${extra&&extra.hangend?'mk-hang':''}${extra&&extra.verouderd?' mk-oud':''}"><td><b>${esc(naam)}</b>${extra&&extra.hangend?' <span class="chip wk-onb">geen aanbod meer</span>':''}${extra&&extra.verouderd?' <span class="chip wk-leeg">verouderd</span>':''}<div class="meta">${mkBet(extra||{})}</div></td><td><span class="chip ${WKL[k]||'wk-onb'}">${esc(k)}</span></td><td style="text-align:right">${p==null?'n.b.':(p>0?'+':'')+String(p).replace('.',',')+'%'}</td><td>${toen}</td><td>${nu}</td><td>${esc(per0||'')}</td><td style="text-align:right">${n??'n.b.'}</td><td>${sp||''}</td><td>${bron}</td></tr>`;
 const hd=`<tr><th>Model / groep</th><th>Oordeel</th><th>Verandering</th><th>Toen</th><th>Nu</th><th>Periode</th><th>n / punten</th><th>Verloop</th><th>Bron</th></tr>`;
 const eig=met.filter(fq).sort(srt).slice(0,80),ext=TR.extern.filter(fq).filter(x=>(x.n||0)>=minN||x.n==null).sort(srt);
 const hang=(TR.hangend||[]).filter(fq);
 $('#cards').innerHTML=`<article class="card wide"><div class="body"><h2 class="t">Markt — nu inkopen</h2>
 <div class="meta">Aanbod, liquiditeit en vraagprijzen. Globale site-update: ${esc((typeof D!=='undefined'&&D&&D.datum)||'zie kop')}. Per sectie staat de echte meetdatum. Stijgend = minstens +${TR.drempel}% · Stabiel = tussen −${TR.drempel}% en +${TR.drempel}% · Dalend = minstens ${TR.drempel}% gedaald.</div>
 ${mkConclusies(TR.conclusies)}
 <div class="frow" style="margin:8px 0"><div class="seg">${so}</div><div class="seg">${per}</div><input id="trq" placeholder="Zoek model…" value="${esc(TRQ)}" style="padding:7px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink)"></div>
 <div class="meta">${esc(TR.noot||'Verandering kan ook door andere aanbodsamenstelling komen.')}</div>
 ${euSectie(q)}
 <h3>Eigen metingen per uitvoering en bouwjaar (vraagprijzen NL/DE/BE)</h3>
 ${mkBadge(S.eigen)}
 ${eig.length?`<div class="tw"><table class="trt">${hd}${eig.map(g=>row(g.label,g.klasse,g.pct,eur(g.toen),eur(g.nu),g.periode,(g.n_nu!=null?g.n_nu+'/':'')+(g.punten||''),'eigen data · vraagprijs · EUR',sparkN(g.reeks,TRPER),g)).join('')}</table></div>`:`<div class="meta">Nog te weinig historie of geen groepen met n≥${minN}. Eerste meting ${esc(TR.eerste_meting||'vandaag')}.</div>`}
 ${hang.length?`<div class="meta" style="margin-top:8px"><b>Hangende groepen</b> (geen ≥3 advertenties meer sinds de laatste meting): ${hang.map(g=>esc(g.label)+' (laatst '+esc(g.nu_datum)+')').join('; ')}. ${esc((hang[0]&&hang[0].hangend_uitleg)||'')}</div>`:''}
 ${(TR.eigen_dun&&TR.eigen_dun.length)?`<details class="why"><summary>Groepen met n&lt;${minN} (niet in toplijst, ${TR.eigen_dun.length})</summary><div class="meta">Te weinig advertenties voor een betrouwbaar percentage.</div><ul>${TR.eigen_dun.filter(fq).slice(0,40).map(g=>`<li>${esc(g.label)} · n=${g.n_nu} · ${g.pct==null?'n.b.':(g.pct>0?'+':'')+g.pct+'%'}</li>`).join('')}</ul></details>`:''}
 <h3>VS-markt, alleen richting (geen NL-prijs)</h3>
 <div class="meta">Amerikaanse veilingverkopen. Kolom % is in <b>euro</b> (ECB-koers per verkoopdatum). USD-% staat erbij ter vergelijking. t.o.v. EU-vraagprijs = mediaan uit onze Europese scans.</div>
 
 ${mkBadge(S.bat)}
 <div class="meta">Mediaan verkocht per kwartaal, %/jaar in EUR. Stijgend &gt; +10%/jaar, Dalend &lt; −10%/jaar, n&lt;5 per periode = te weinig data.</div>
 ${false&&TR.bat&&TR.bat.modellen?`<div class="tw"><table class="trt"><tr><th>Model</th><th>Oordeel</th><th>%/jaar EUR</th><th>%/jaar USD</th><th>Toen (EUR)</th><th>Nu (EUR)</th><th>Verkopen</th><th>Verloop</th><th>t.o.v. EU</th><th>Betrouwbaarheid</th></tr>${TR.bat.modellen.filter(m=>!q||m.naam.toLowerCase().includes(q)).map(m=>`<tr><td><b>${esc(m.naam)}</b><div class="meta">veilingverkoop · VS · EUR</div></td><td><span class="chip ${WKL[m.klasse]||'wk-onb'}">${esc(m.klasse)}</span></td><td style="text-align:right">${m.pct_jaar==null?'n.b.':(m.pct_jaar>0?'+':'')+String(m.pct_jaar).replace('.',',')+'%'}</td><td style="text-align:right">${m.pct_jaar_usd==null?'n.b.':(m.pct_jaar_usd>0?'+':'')+String(m.pct_jaar_usd).replace('.',',')+'%'}</td><td>${m.toen_eur?eur(m.toen_eur):'n.b.'}</td><td>${m.nu_eur?eur(m.nu_eur):'n.b.'}</td><td style="text-align:right">${m.n_12_24m} → ${m.n_laatste12m}</td><td>${sparkN((m.kwartalen||[]).filter(k=>k.mediaan_eur).map(k=>[k.kwartaal,k.mediaan_eur,k.n]),'alles')}</td><td>${vsd(((ME&&ME.vs)||{bat:{}}).bat[m.naam])}</td><td>${esc(m.betrouwbaarheid||'')}</td></tr>`).join('')}</table></div>`:''}
 <h3>Externe veilingverkopen / prijsindex (vooral VS, USD)</h3>
 ${mkBadge(S.extern)}
 <div class="tw"><table class="trt">${hd.replace('<th>Verloop</th>','<th>t.o.v. EU-vraagprijs</th>')}${ext.map(x=>row(`${x.merk.replace('-',' ')} ${x.model} (${x.jaren})`,x.klasse,x.pct,'n.b.',x.nu_usd?'$'+Math.round(x.nu_usd).toLocaleString('nl-NL')+' (typisch)':'n.b.',x.periode,x.n,`<a href="${esc(x.bron)}" target="_blank" rel="noopener">${esc((x.soort||'').split(' (')[0])}</a> · ${esc(x.datum)} · ${esc(x.type||'')} · ${esc(x.valuta||'USD')}`,vsd(((ME&&ME.vs)||{extern:{}}).extern[x.merk+'|'+x.model+'|'+x.jaren]),x)).join('')}</table></div>
 <div class="meta" style="margin-top:8px">VS-cijfers geven alleen de richting. Europese veilingsites verbieden automatisch overnemen van uitslagen; die gebruiken we niet. mobile.de en Gaspedaal: niet.</div>
 <h3>Verversingsschema</h3>
 <div class="meta"><ul>${Object.values(TR.schema||{}).map(s=>`<li><b>${esc(s.label)}</b>: ${esc(s.type)}, ${esc(s.regio)}, ${esc(s.valuta)} — ${esc(s.frequentie)} (max. ${s.max_leeftijd_dagen} d oud)</li>`).join('')}</ul></div>
 </div></article>`}

document.addEventListener('click',e=>{
  const p=e.target.closest('[data-trper]');if(p){TRPER=p.dataset.trper;prijstrends();return}
  const g=e.target.closest('[data-goto]');if(g){seg=+g.dataset.goto;render();return}
});

function xuitleg(B){return B("Prijstrends en waarde-oordeel",["Elke ochtendrun slaat het systeem per <b>groep</b> (merk + model + uitvoering + bouwjaarband van 3 jaar + handgeschakeld) de <b>mediaan-vraagprijs</b> op, als er minstens 3 advertenties zijn (NL, DE en BE).","Na verloop van tijd zie je <b>toen vs nu</b>: de prijs ongeveer 3 en 6 maanden geleden tegenover vandaag, met het % verschil en het aantal datapunten.","<b>Stijgend</b> = minstens 5% gestegen · <b>Stabiel</b> = tussen −5% en +5% · <b>Dalend</b> = minstens 5% gedaald (over 6 maanden, anders 3 maanden, anders de langste periode van minstens 4 weken).","Is er nog geen 4 weken eigen historie, dan staat er <b>‘nog te weinig historie’</b>. We verzinnen geen oude prijzen.","Voor exclusieve modellen gebruiken we een <b>externe bron</b> (de Hagerty-prijsgids), met link, als er nog te weinig eigen metingen zijn. Hagerty is handmatig (verwachting per kwartaal) en gaat over de VS-markt: het geeft de richting, geen NL-prijs.","Op elke kaart staat het oordeel (Stijgend, Stabiel, Dalend of Nog te weinig historie); filter erop met <b>Alle waarde / Stijgend / Stabiel / Dalend</b>. Het tabblad <b>Prijstrends</b> toont de grootste stijgers en dalers, met verloop."])+
 B("Exclusief & Verzamel",["In BRNS kies je <b>Exclusief & Verzamel</b>: zeldzame, gelimiteerde en verzamelauto's (bijv. Porsche GT3/GT2 RS/luchtgekoeld/Carrera GT, Ferrari V12/Speciale/klassiek, Lamborghini SV/Diablo, BMW M3 E30/CSL, SLS, LFA, NSX, Supra, Skyline GT-R, Defender klassiek) en <b>dagelijkse handel</b> met grote marges (bijv. 911 Turbo S, GT3 992, G 63, Urus/Huracán, R8, A110).","Labels: <b>Verzamelobject</b>, <b>Gelimiteerd (1 van N)</b> (alleen als de oplage uit een bron komt), <b>Handgeschakeld</b> (volgens advertentie), <b>BPM-vrij bij import (25+ jr)</b>, <b>Oldtimer 40+ jr</b>.","Zeldzame auto's worden vergeleken met advertenties in <b>NL, DE en BE</b> (bouwjaar ±1, bij 25+ jaar ±3). Minder dan 3 vergelijkbare? Dan staat er <b>marge onzeker</b>.","Import: auto's van 25 jaar of ouder betalen <b>geen BPM</b> (wel aangifte); vanaf 17 jaar en 10 maanden is de forfaitaire afschrijving 100%.","De modellenlijst staat in <code>doelen_exclusief.csv</code> (per model: bouwjaren, max km, minimumprijs, zoekpaden, bron)."])}
document.addEventListener("click",e=>{const b=e.target.closest("[data-xf],[data-wf],[data-trs]");if(!b)return;if(b.dataset.trs){TRS=b.dataset.trs}render()});
document.addEventListener("input",e=>{if(e.target.id==="trq"){TRQ=e.target.value;prijstrends();const i=$("#trq");if(i){i.focus();i.setSelectionRange(TRQ.length,TRQ.length)}}});

/* 04-11: Eerst taxeren, Buiten profiel en Te weinig marge staan nu in de tab Bijna-deals (afgewezenKaarten), niet meer in Markt. */
function afgewezenKaarten(){
 if(!D)return "";
 return [["eerst_taxeren","etx","Eerst taxeren","taxatie","Geen betrouwbare inkoopkans vóór controle en taxatie. Geen doelbod of melding."],["buiten_profiel","bpr","Buiten profiel","profiel","Buiten je ingestelde zoekbereik. Per auto staat welk criterium en welke instelling."],["te_weinig_marge","twm","Te weinig marge","marge","De verwachte marge haalt het minimum niet. Per auto de berekening en vervolgstap."]].map(([key,cls,title,type,intro])=>{
  const list=D[key]||[];if(!list.length)return "";
  return `<article class="card wide ${cls}"><div class="body"><h2 class="t">${title} (${list.length})</h2><div class="meta">${intro}</div>${list.slice().reverse().map(x=>`<section class="afg-auto"><h3>${esc(x.titel||"")}</h3>${kjl(x.jaar,x.km,null,null,locVan(x))}${dealAfweging(x,type)}${key==="eerst_taxeren"?`<button type="button" class="btn sm" data-etx="${esc(x.id)}">Taxeer met inruiltaxatie</button> `:""}${x.url?`<a class="btn sm sec" href="${esc(x.url)}" target="_blank" rel="noopener">Advertentie</a>`:`<span class="meta">${esc(x.link_verborgen||"Advertentielink niet beschikbaar")}</span>`}</section>`).join("")}</div></article>`;
 }).join("");
}

// ETX_INRUIL_V1 (09-11): 'Eerst taxeren' opent de bestaande inruiltaxatie (geen tweede taxatie-engine) met bekende gegevens vooraf,
// herkomst zichtbaar en een terugknop. Ontbrekende gegevens worden genoemd, niet aangevuld.
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-etx]");if(!b||typeof D==="undefined"||!D)return;ev.preventDefault();const id=b.dataset.etx,herseg=seg;
 if(typeof txKlaar==="function")txKlaar(()=>etxVul(id,herseg));else etxVul(id,herseg)});
function etxVul(id,herseg){const x=(D.eerst_taxeren||[]).find(y=>y.id===id);if(!x||typeof mkmd!=="function")return;
 const[mk,md]=mkmd(x.merk||String(x.titel||"").split(" ")[0],x.titel||"");
 Object.assign(TX,{merk:mk,model:md,jaar:+String(x.jaar||"").slice(-4)||"",km:String(x.km||"").replace(/\D/g,""),kenteken:"",vin:""});
 try{TX.var=typeof txVarUit==="function"?txVarUit(x.titel,mk,md):""}catch(e){TX.var=""}
 TX3=Object.assign({},TX3||{},{id:undefined,voorraad:"",herkomst:{soort:"eerst_taxeren",id:x.id,titel:x.titel||"",url:x.url||"",prijs:x.prijs,land:x.land||"NL",reden:x.reden||"",terug:herseg}});
 TXR3={r:null};seg=13;render();window.scrollTo(0,0)}
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-etxterug]");if(!b)return;ev.preventDefault();const t=(TX3&&TX3.herkomst&&TX3.herkomst.terug!=null)?TX3.herkomst.terug:18;seg=t;render()});
function etxBanner(){const B=TX3&&TX3.herkomst;if(!B||B.soort!=="eerst_taxeren")return;const body=document.querySelector("#cards .card .body");if(!body||body.querySelector(".etx-bron"))return;
 const ontbr=[!TX.kenteken?"kenteken (RDW-gegevens, eerste toelating)":"",B.land&&B.land!=="NL"?"officiële CO2 (CoC) voor de BPM":"","opties/uitvoering controleren","schade en onderhoud"].filter(Boolean);
 body.insertAdjacentHTML("afterbegin",`<div class="tk etx-bron"><b>Vooraf ingevuld uit Eerst taxeren</b><div class="meta">${esc(B.titel)}${B.prijs?" · vraagprijs "+eur(+B.prijs):""}${B.land?" · "+esc(B.land):""}. Overgenomen uit de advertentie: merk, model, bouwjaar${TX.km?", km":""}. Waarom eerst taxeren: ${esc(B.reden||"onbekend")}.</div><div class="meta">Nog nodig voor een betrouwbare taxatie: ${ontbr.map(esc).join(", ")}. Zonder vergelijkers geeft de taxatie geen waarde; we vullen niets aan.</div><button type="button" class="btn sm ghost" data-etxterug>Terug naar de lijst</button></div>`)}
{const c=document.getElementById("cards");if(c)new MutationObserver(()=>{try{if(typeof seg!=="undefined"&&seg===13)etxBanner()}catch(e){}}).observe(c,{childList:true})}
