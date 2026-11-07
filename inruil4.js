// Inruil v4 (04-11): optie-overlap per vergelijker, importkosten voor DE/BE, eigen voorraad als marktpunt, uitvoering uit RDW,
// links met bron bij elke vergelijker en de flow "Inruil op voorraadauto" met scenario's. Laadt na taxatie3.js en overschrijft enkele functies.
Object.assign(OPTL,{nekverwarming:"Nekverwarming (Airscarf)",sportstoelen:"Sportstoelen",matrix_led:"Matrix LED",virtual_cockpit:"Virtual cockpit",head_up:"Head up display",adaptieve_cruise:"Adaptieve cruise",stoelverwarming:"Stoelverwarming",trekhaak:"Trekhaak",sportuitlaat:"Sportuitlaat",luchtvering:"Luchtvering of magnetic ride",camera:"Camera",keyless:"Keyless",mulliner:"Mulliner",naim_audio:"Naim-audio"});
const TXBRON=(u,b)=>b==="eigen"?"Eigen voorraad":/marktplaats/.test(u||"")?"Marktplaats":/autoscout24/.test(u||"")?"AutoScout24":/autotrack/.test(u||"")?"AutoTrack":/classicdriver/.test(u||"")?"Classic Driver":/autodealers/.test(u||"")?"Eigen site":b||"advertentie";
const TXLAND={NL:"Nederland",DE:"Duitsland",BE:"Belgie",LU:"Luxemburg",AT:"Oostenrijk",IT:"Italie"};
const TXVARW=["roadster","cabrio","competition","coupe","spider","spyder","volante","targa"];
let TXOPT={};
// Minstens 5 vergelijkers voordat we stoppen met verbreden (eerst NL, dan NL+BE+DE met importkosten)
function txWaarde(G,v,j,km){let C=[],L=["NL"],st=0;
 for(st=0;st<TXSTAP.length;st++){const[lan,tol,strikt,jr]=TXSTAP[st];L=lan;C=G.filter(r=>lan.includes(r[4])&&r[3]>=500&&(!strikt||(r[0]||"")===(v||""))&&r[1]&&j&&Math.abs(r[1]-j)<=jr&&!(tol!=null&&km&&r[2]&&!((1-tol)*km<=r[2]&&r[2]<=(1+tol)*km+10000)));if(C.length>=5)break}
 const _dg=(C.find(r=>r[8]&&r[1]===j)||C.find(r=>r[8]&&j&&Math.abs(r[1]-j)<=1)||[])[8]||"";
 let _Cg=_dg?C.filter(r=>!r[8]||r[8]===_dg):C;if(_Cg.length>=3)C=_Cg;
 if(st>=TXSTAP.length)st=TXSTAP.length-1;return{C,landen:L,stap:st,n:C.length,breder:st>0}}
function txAfschr(m){const T=(MI.importkosten||{}).afschrijving||[];if(!T.length)return 0;const r=T.filter(x=>m>=x[0]).pop()||T[0];return Math.min(100,m>r[0]?r[1]+(m-r[0])*r[2]:r[1])}
function txImport(land,j,seg){const I=MI.importkosten;if(!I||land==="NL")return{bedrag:0,uitleg:""};const t=I.transport,km=(t.afstand||{})[land]||600;let tr=Math.max(t.min,t.start+t.per_km*km);if(seg==="sport"||seg==="exotisch")tr*=1+t.gesloten_opslag;tr=Math.round(tr/5)*5;
 const rd=TXR3&&TXR3.rdw,bb=rd&&+rd.bruto_bpm;let bpm=0,u="transport "+eur(tr);if(bb&&j){const m=Math.max(0,(new Date().getFullYear()-j)*12);bpm=Math.round(bb*(1-txAfschr(m)/100));u+=", rest BPM ongeveer "+eur(bpm)}else u+=", rest BPM onbekend";return{bedrag:tr+bpm+120,uitleg:u+", keuring en kenteken 120"}}
function txOverlap(doel,r){if(!Array.isArray(r[6]))return null;const s=new Set(doel),y=new Set(r[6]),g=[...s].filter(x=>y.has(x)),mi=[...s].filter(x=>!y.has(x)),ex=[...y].filter(x=>!s.has(x)),t=new Set([...s,...y]).size,ov=t?g.length/t:1;return{g,mi,ex,ov,label:ov>=0.75?"bijna gelijk":ov>=0.4?"deels gelijk":"anders"}}
function txWaarde3(mk,md,v,j,km,kl){const G=MI.groepen[mk+"|"+md]||[],W=txWaarde(G,v,j,km);if(!W.C||!W.C.length)return{W,n:0};
 const cf=wmCoef(mk,md,v,kl),tel={km:0,jaar:0,uitv:0,opt:0,imp:0},doel=Object.keys(TXOPT).filter(k=>TXOPT[k]),zelf=TX3.voorraad||"",uit=[];
 const doelGen=(W.C.find(r=>r[8]&&r[1]===j)||W.C.find(r=>r[8]&&Math.abs(r[1]-j)<=1)||[])[8]||"";
 const R=[];W.C.forEach(r=>{if((zelf&&r[5]===zelf)||((r[7]==="eigen"&&r[1]===j&&(!km||!r[2]||Math.abs(r[2]-km)<500)))){uit.push(r);return}
  let e=0,w=1;const corr=[];
  if(km&&r[2]){const d=cf.b*(r[2]-km)/1e4;e+=d;w*=Math.exp(-Math.abs(r[2]-km)/60000);if(Math.abs(r[2]-km)>=5000){tel.km++;corr.push("km "+(d>0?"plus ":"min ")+Math.abs(d*100).toFixed(0)+"%")}}else w*=0.6;
  if(j&&r[1]){const d=cf.c*(j-r[1]);e+=d;w*=Math.exp(-Math.abs(j-r[1])/2.5);if(j!==r[1]){tel.jaar++;corr.push("bouwjaar "+(d>0?"plus ":"min ")+Math.abs(d*100).toFixed(0)+"%")}}
  if((r[0]||"")!==(v||"")){w*=0.6;tel.uitv++}
  if(r[8]&&doelGen&&r[8]!==doelGen){w*=0.15;tel.gen=(tel.gen||0)+1;corr.push("andere generatie "+r[8])}
  const o=txOverlap(doel,r);if(o){w*=0.6+0.4*o.ov;let d=0;o.mi.forEach(k=>d+=Math.min(0.08,wmPrem(mk,md,v,"opt:"+k)));o.ex.forEach(k=>d-=Math.min(0.08,wmPrem(mk,md,v,"opt:"+k)));if(Math.abs(d)>=0.005){e+=d;tel.opt++;corr.push("opties "+(d>0?"plus ":"min ")+Math.abs(d*100).toFixed(1).replace(".",",")+"%")}}
  e=Math.max(-0.35,Math.min(0.35,e));let adj=r[3]*Math.exp(e),imp=null;
  if(r[4]!=="NL"){w*=0.8;imp=txImport(r[4],j,kl);if(imp.bedrag){adj+=imp.bedrag;tel.imp++}}
  R.push({jaar:r[1],km:r[2],prijs:r[3],land:r[4],url:r[5]||"",bron:TXBRON(r[5],r[7]),eigen:r[7]==="eigen",var:r[0],gen:r[8]||"",adj:Math.round(adj),w:Math.max(w,0.02),corr,o,imp})});
 if(!R.length)return{W,n:0,uit};
 const v_=R.map(x=>x.adj),w_=R.map(x=>x.w),med=wq(v_,w_,0.5),p25=wq(v_,w_,0.25),p75=wq(v_,w_,0.75),sw=w_.reduce((a,b)=>a+b,0),neff=sw*sw/w_.reduce((a,b)=>a+b*b,0),spr=(p75-p25)/Math.max(med,1);
 const score=Math.round(100*Math.min(1,neff/6)*Math.max(0,1-spr/0.5));R.sort((a,b)=>b.w-a.w);const nNL=R.filter(x=>x.land==="NL").length;
 return{W,R,n:R.length,nNL,neff,med,p25,p75,score,label:score>=65?"hoog":score>=35?"middel":"laag",cf,tel,uit}}
// Opties tellen nu per vergelijker (overlap), dus niet nog eens als vaste opslag in txBereken3
const _txB3=txBereken3;txBereken3=function(){TXOPT=Object.assign({},TX3.opt);const o=TX3.opt;TX3.opt={};let r;try{r=_txB3()}finally{TX3.opt=o}
 if(r&&r.V&&r.V.n){const t=r.V.tel,x=[];if(t.gen)x.push("andere generatie bij "+t.gen);if(t.opt)x.push("opties bij "+t.opt);if(t.imp)x.push("importkosten bij "+t.imp+" buitenlandse auto's");if(x.length)r.waarom+=" Ook gecorrigeerd voor "+x.join(" en ")+".";if(r.V.uit&&r.V.uit.length)r.waarom+=" De auto zelf staat in de markt en is niet meegeteld.";r.waarom+=` ${r.V.nNL} van de ${r.V.n} vergelijkbare auto's staan in Nederland.`;if((r.V.R.find(x=>x.gen)||{}).gen)r.waarom+=" Generatie "+(r.V.R.find(x=>x.gen)||{}).gen+"."}return r};
async function txRdw(){const k=TX.kenteken.toUpperCase().replace(/[^A-Z0-9]/g,"");if(!k)return null;
 const r=await fetch("https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken="+k).then(r=>r.json()).catch(()=>[]);if(!r.length)return null;const x=r[0],d=x.datum_eerste_toelating||"";
 return{kenteken:k,merk:x.merk,handelsbenaming:x.handelsbenaming,jaar:+d.slice(0,4)||null,apk:x.vervaldatum_apk||"",recall:x.openstaande_terugroepactie_indicator||"",bruto_bpm:x.bruto_bpm||"",inrichting:x.inrichting||""}}
function txVarUit(tekst,mk,md){const t=(tekst||"").toLowerCase(),G=MI.groepen[mk+"|"+md]||[],vs=new Set(G.map(r=>r[0]||""));for(const w of TXVARW)if(t.includes(w)&&vs.has(w))return w;if(/cabriolet/.test(t)&&vs.has("roadster")&&mk==="audi")return"roadster";return""}
const _mkmd=mkmd;mkmd=function(merk,hb){const r=_mkmd(merk,hb);TX._varhint=txVarUit(hb,r[0],r[1]);setTimeout(()=>{if(TX._varhint&&!TX.var){TX.var=TX._varhint;if(typeof taxatie2==="function"&&$("#txgo"))taxatie2()}},0);return r};
const _txVV=txVanVoorraad;txVanVoorraad=function(u){_txVV(u);const a=(TXV.autos||[]).find(x=>x.url===u);if(!a)return;TX.var=txVarUit(a.titel,TX.merk,TX.model);
 const t=(a.titel+" "+(a.opties||[]).join(" ")).toLowerCase(),mk=txMkN(TX.merk),RX={nekverwarming:/nekverwarm|air ?scarf/,sportstoelen:/kuipstoel|sportstoel|amg ?(stoelen|seats)|m[- ]?sport/,matrix_led:/matrix/,virtual_cockpit:/virtual/,premium_audio:/b&o|bang|burmester|bose/,panorama:/panorama/,mulliner:/mulliner/,naim_audio:/\bnaim\b/};for(const k in RX){if(!RX[k].test(t))continue;if(typeof txOptPast==="function"&&!txOptPast(mk,k))continue;TX3.opt[k]=true}if(/\brs ?(stoelen|zetels|seats)/.test(t)&&["audi","volkswagen","porsche","seat","cupra","skoda"].includes(mk))TX3.opt.sportstoelen=true};
// Vergelijkerlijst met bron, link, gecorrigeerde prijs, km, bouwjaar, gewicht en optie-overlap
function txVglLijst(R){const ol=k=>(typeof txOptLabel==="function"?txOptLabel(k,TX.merk):OPTL[k]||k);return `<details class="why" open><summary>Vergelijkbare auto's (${R.V.n}, waarvan ${R.V.nNL} in Nederland), zwaarst wegend eerst</summary><ul class="vgl">${R.V.R.slice(0,20).map(c=>`<li><div><b>${esc(c.bron)}</b> · ${esc(TXLAND[c.land]||c.land)} · ${c.jaar}${c.gen?" · gen "+esc(c.gen):""} · ${c.km?c.km.toLocaleString("nl-NL")+" km":"km onbekend"}${c.eigen?' <span class="chip acc">Eigen voorraad</span>':""}</div>
 <div>Vraagprijs ${eur(c.prijs)} · gecorrigeerd ${eur(c.adj)} · gewicht ${Math.round(c.w*100)}%${c.o?` · <span class="chip${c.o.label==="bijna gelijk"?" ok":c.o.label==="anders"?" bad":""}">${c.o.label}</span>`:""}</div>
 ${c.corr.length||c.imp?`<div class="meta">${esc(c.corr.join(", "))}${c.imp&&c.imp.bedrag?(c.corr.length?". ":"")+"Importkosten plus "+eur(c.imp.bedrag)+" ("+esc(c.imp.uitleg)+")":""}</div>`:""}
 ${c.o&&(c.o.g.length||c.o.mi.length||c.o.ex.length)?`<div class="meta">${c.o.g.length?"Zelfde: "+esc(c.o.g.map(ol).join(", "))+". ":""}${c.o.mi.length?"Mist: "+esc(c.o.mi.map(ol).join(", "))+". ":""}${c.o.ex.length?"Extra: "+esc(c.o.ex.map(ol).join(", "))+".":""}</div>`:""}
 ${c.url?`<a class="btn sm" href="${esc(c.url)}" target="_blank" rel="noopener">Bekijk advertentie</a>`:'<span class="meta">geen link</span>'}</li>`).join("")}</ul></details>`}
// Inruil op voorraadauto
function ruilMinMarge(P,seg){const M=MI.minmarge||{},k={standaard:"normaal"}[seg]||seg||"normaal",m=M[k]||M.normaal||{abs:1000,pct:6};return Math.max(m.abs||0,P*(m.pct||0)/100)}
function ruilVoorraad(){const a=(TXV.autos||[]).find(x=>x.url===TX3.ruilauto);if(!a)return null;const ik=ikGet(a.url)||{},ink=TX3.rinkoop!==undefined&&TX3.rinkoop!==""?+TX3.rinkoop:ik.inkoop,kost=TX3.rkosten!==undefined&&TX3.rkosten!==""?+TX3.rkosten:(ik.kosten||0);
 const m=ink!=null?vrMarge(a.prijs,ink,a.dagen,kost,a.btw,(typeof VR!=="undefined"&&VR&&VR.stakosten)||SK_STD):null;let seg="normaal";try{const[mk,md]=_mkmd(a.merk||a.titel.split(" ")[0],(a.model||"")+" "+a.titel);seg=txKosten(mk,md,a.prijs).segment}catch(e){}return{a,ink,kost,m,seg}}
function ruilScenarios(S,R){if(!S||!S.m||!R||!R.inruil)return null;const P=S.a.prijs,mm=Math.round(ruilMinMarge(P,S.seg)),kt=R.K.totaal+R.okt,mr=b=>R.verk-b-kt,L=[];
 for(const[l,b]of[["Laag bod op inruil",R.inruil.laag],["Midden",R.inruil.midden],["Hoog bod op inruil",R.inruil.hoog]]){L.push({l,bod:b,korting:0,tot:S.m.marge+mr(b)})}
 const ruimte=S.m.marge+mr(R.inruil.midden)-mm;if(ruimte>0){L.push({l:"Maximale korting bij midden bod",bod:R.inruil.midden,korting:Math.floor(ruimte/50)*50,tot:mm});L.push({l:"Maximale inruilpremie, geen korting",bod:R.inruil.midden+Math.floor(ruimte/50)*50,korting:0,tot:mm})}
 return{L,mm,ruimte,mrMid:mr(R.inruil.midden)}}
function ruilAdvies(S,R,Sc){const ruim=Sc.ruimte,bod=R.inruil.midden;if(ruim<=0){const b=R.inruil.laag,tot=S.m.marge+(R.verk-b-R.K.totaal-R.okt);return{bod:b,korting:0,tot}}const k=Math.floor(ruim/2/50)*50;return{bod,korting:k,tot:Sc.L[1].tot-k}}
const _tx2=taxatie2;taxatie2=function(){_tx2();if(!MI||!TXV)return;const body=document.querySelector("#cards .card .body");if(!body)return;
 const fr=body.querySelector(".frow");if(!fr)return;
 // knop "Kies uit eigen voorraad" taxeert de voorraadauto zelf: duidelijker benoemen
 const kv=fr.querySelector('[data-txb="voorraad"]');if(kv)kv.textContent="Voorraadauto zelf taxeren";const kh=fr.querySelector('[data-txb="hand"]');if(kh&&!TX3.ruilauto)kh.textContent="Alleen inruilauto taxeren";
 const autos=TXV.autos||[],S=ruilVoorraad();
 let top=`<div class="tk ruiltop"><b>Klant koopt een auto uit je voorraad?</b><div class="meta">Kies de voorraadauto. Vul daarna de inruilauto in, dan zie je direct het advies voor bod en korting.</div><div class="frow"><label style="flex:1 1 100%">Voorraadauto die de klant koopt<select data-tx3="ruilauto"><option value="">Geen, alleen inruil taxeren</option>${autos.map(a=>`<option value="${esc(a.url)}"${a.url===TX3.ruilauto?" selected":""}>${esc(a.titel)} · ${esc(String(a.jaar||""))} · ${eur(a.prijs)}</option>`).join("")}</select></label></div>`;
 if(S){top+=`<div class="frow"><label>Inkoopprijs voorraadauto<input type="number" inputmode="numeric" data-tx3="rinkoop" value="${S.ink??""}" placeholder="nodig voor het advies"></label><label>Overige kosten<input type="number" inputmode="numeric" data-tx3="rkosten" value="${S.kost||""}" placeholder="0"></label></div>
  <div class="meta">Vraagprijs ${eur(S.a.prijs)}${S.m?" · marge op deze auto "+eur(S.m.marge):""} · <a href="${esc(S.a.url)}" target="_blank" rel="noopener">Bekijk advertentie</a></div>`;
  if(!S.m)top+=`<div class="meta tax"><b>Inkoopprijs ontbreekt.</b> Zonder inkoopprijs kan ik geen korting uitrekenen. Vul hem hierboven in, of bij Eigen voorraad. <button class="btn sm" data-gotab="12">Naar Eigen voorraad</button></div>`;
  top+=`<div class="tk"><b>Inruilauto</b><div class="frow"><label>Kenteken<input data-tx="kenteken" value="${esc(TX.kenteken||"")}" placeholder="XX-123-Y"></label><button class="btn ghost" id="txrdw">Haal op bij RDW</button></div><div class="frow"><label>Chassisnummer / VIN (optioneel)<input data-tx="vin" value="${esc(TX.vin||"")}" placeholder="WAUZZZ…"></label><button class="btn ghost" id="txvin">Decodeer VIN (gratis)</button></div>${TXR3&&TXR3.vin?`<div class="meta">VIN: ${esc(TXR3.vin.samenvatting||TX.vin||"")}${TXR3.vin.grenzen?`<div class="meta">${esc(TXR3.vin.grenzen)}</div>`:""}</div>`:""}${TXR3&&TXR3.rdw?`<div class="meta">RDW: ${esc(TXR3.rdw.merk)} ${esc(TXR3.rdw.handelsbenaming)} · ${TXR3.rdw.jaar||"?"} · APK ${esc(TXR3.rdw.apk||"?")}</div>`:""}<div class="meta">Of kies hieronder merk, model, bouwjaar en km, vink de opties aan en druk op Taxeer. VIN wordt opgeslagen; gratis bronnen geven in NL geen fabrieksopties.</div></div>`}
 top+=`</div>`;fr.insertAdjacentHTML("beforebegin",top);
 const R=TXR3&&TXR3.r,Sc=ruilScenarios(S,R);
 if(S&&R&&R.inruil){const tgt=body.querySelector(".marge");
  if(Sc){const A=ruilAdvies(S,R,Sc),naam=esc(S.a.titel.split("|")[0].trim().slice(0,45)),mt=v=>v<0?"min "+eur(-v):eur(v);
   const html=`<div class="advies tk"><b>Advies: bod inruil ${eur(A.bod)}, korting op ${naam} ${eur(A.korting)}, jouw marge blijft ${mt(A.tot)} (minimum ${eur(Sc.mm)}).</b>
   <div class="meta">${Sc.ruimte>0?`Je hebt ${eur(Sc.ruimte)} ruimte boven je minimummarge. Het advies geeft de helft daarvan als korting, de rest is je buffer voor onderhandelen.`:`Bij een normaal bod blijft je marge onder het minimum. Daarom: laag bod op de inruil en geen korting.`} De klant betaalt dan ${eur(S.a.prijs-A.korting-A.bod)} bij.</div>
   <details class="why"><summary>Andere scenario's en details</summary><div class="specs"><div><span>Waarde inruil</span><b>${eur(R.inruil.laag)} tot ${eur(R.inruil.hoog)}</b></div><div><span>Marge voorraadauto</span><b>${mt(S.m.marge)}</b></div><div><span>Marge inruil bij midden bod</span><b>${mt(Sc.mrMid)}</b></div><div><span>Minimale marge (Instellingen)</span><b>${eur(Sc.mm)}</b></div></div>
   <ul class="vgl">${Sc.L.map(s=>`<li><b>${esc(s.l)}</b><div>Bod inruil ${eur(s.bod)}, korting ${eur(s.korting)}, totale marge <b class="${s.tot<Sc.mm?"neg":""}">${mt(s.tot)}</b></div></li>`).join("")}</ul>
   <div class="meta">Waarom een bandbreedte bij de inruil: de waarde komt uit vraagprijzen van vergelijkbare auto's, die verschillen in km, opties en staat. Het advies gaat uit van het midden.</div></details></div>`;
   (tgt||body.lastElementChild).insertAdjacentHTML("beforebegin",html)}
  else if(!S.m)(tgt||body.lastElementChild).insertAdjacentHTML("beforebegin",`<div class="advies tk"><b>Nog geen advies: vul de inkoopprijs van ${esc(S.a.titel.split("|")[0].trim().slice(0,45))} in.</b> <button class="btn sm" data-gotab="12">Naar Eigen voorraad</button></div>`)}
 if(R&&R.V&&R.V.R){const d=[...body.querySelectorAll("details.why")].find(x=>/Vergelijkbare auto/.test(x.querySelector("summary").textContent));if(d)d.outerHTML=txVglLijst(R).replace("<details class=\"why\" open>","<details class=\"why\">")}};
document.addEventListener("click",e=>{const b=e.target.closest("[data-gotab]");if(!b)return;e.preventDefault();const t=document.querySelector(`#tabs [data-i="${b.dataset.gotab}"]`);if(t)t.click()},true);
const _txOps=txOpslaan;txOpslaan=function(){_txOps();if(TX3.bron!=="ruil"||!TX3.id)return;const L=txAll(),t=L[TX3.id],S=ruilVoorraad(),R=TXR3&&TXR3.r,Sc=ruilScenarios(S,R);if(!t||!Sc)return;
 t.soort="voorstel";t.voorraad=S.a.url;t.voorstel={voorraadauto:S.a.titel,vraagprijs:S.a.prijs,inkoop:S.ink,marge_voorraad:S.m.marge,min_marge:Sc.mm,ruimte:Sc.ruimte,scenarios:Sc.L};t.auto="Voorstel: inruil "+t.auto+" op "+S.a.titel.slice(0,40);txPut(L);txSync();taxatie2()};
document.addEventListener("change",e=>{const t=e.target;if(t.dataset&&["ruilauto","rinkoop","rkosten"].includes(t.dataset.tx3)){TX3[t.dataset.tx3]=t.value;if(t.dataset.tx3==="ruilauto"){TX3.bron=t.value?"ruil":"";if(TX3.voorraad&&t.value){TX3.voorraad="";Object.assign(TX,{merk:"",model:"",jaar:"",km:"",var:""});TXR3=null}}if(TXR3&&TXR3.r&&TX.merk)TXR3.r=txBereken3();setTimeout(taxatie2,0)}});
// Vergelijkers op deal- en bijna-dealkaarten (uit de gecorrigeerde waardering van de pipeline)
function vglKaart(refs,open){if(!refs||!refs.length)return"";const BR={MP:"Marktplaats",AS:"AutoScout24",AT:"AutoTrack",CD:"Classic Driver"},ol=k=>(typeof OPTL!=="undefined"&&OPTL[k])||k;
 return `<details class="why"${open?" open":""}><summary>Vergelijkbare advertenties met correctie (${refs.length})</summary><ul class="vgl">${refs.slice(0,15).map(r=>{const o=r.opties||null;return `<li><div><b>${esc(BR[r.bron]||TXBRON(r.url,r.bron))}</b>${r.land?" · "+esc(TXLAND[r.land]||r.land):""} · ${esc(String(r.jaar||"?"))} · ${r.km?(+r.km).toLocaleString("nl-NL")+" km":"km onbekend"}</div>
 <div>Vraagprijs ${eur(r.prijs)} · gecorrigeerd ${eur(r.gecorrigeerd)} · gewicht ${Math.round((r.gewicht||0)*100)}%${o&&o.label?` · <span class="chip${o.label==="bijna gelijk"?" ok":o.label==="anders"?" bad":""}">${esc(o.label)}</span>`:""}</div>
 ${(r.correcties||[]).length?`<div class="meta">${esc(r.correcties.join(", ").replace(/\+/g,"plus ").replace(/(^| )-/g,"$1min "))}</div>`:""}
 ${o&&(o.mist||[]).length+(o.extra||[]).length?`<div class="meta">${(o.mist||[]).length?"Mist: "+esc(o.mist.map(ol).join(", "))+". ":""}${(o.extra||[]).length?"Extra: "+esc(o.extra.map(ol).join(", "))+".":""}</div>`:""}
 ${r.url?`<a class="btn sm" href="${esc(r.url)}" target="_blank" rel="noopener">Bekijk advertentie</a>`:""}</li>`}).join("")}</ul></details>`}

/* 05-11: dunne NL-data → buitenland (AS-DE/BE) telt mee met transport + rest-BPM; btw/marge-regeling en lokale vraag zijn NIET gecorrigeerd.
   Dan betrouwbaarheid hooguit 'laag' en dat staat er expliciet bij (geen schijnzekerheid). */
if(typeof txBereken3==="function"){const _txB4=txBereken3;txBereken3=function(){const r=_txB4.apply(this,arguments);try{
 if(r&&r.V&&r.V.n&&r.V.nNL<3&&r.V.n>r.V.nNL){r.V.label="laag";if(r.V.score>34)r.V.score=34;
  r.waarom+=` Weinig Nederlandse vergelijkers (${r.V.nNL}): de waarde leunt op ${r.V.n-r.V.nNL} buitenlandse advertenties, gecorrigeerd voor transport en rest-BPM; btw/marge-regeling en lokale vraag zijn niet gecorrigeerd. Betrouwbaarheid daarom laag.`}}catch(e){}return r}}
