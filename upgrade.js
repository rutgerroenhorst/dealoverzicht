// Upgrade UX (05-11-2026): startscherm Vandaag, taxatie in drie stappen met delen als voorstel en dossier,
// waarom-zin en statuskleur op dealkaarten, koppeling met de Assistent, bron-score en leren zichtbaar, licht/donker.
// Laadt als laatste en wikkelt bestaande functies in; zonder dit bestand werkt de app zoals voorheen.
const VD=20,ASSIST=(typeof KL!=="undefined"&&KL.assistent_bot)||"Assistent_Rutger_bot";
const upTok=()=>localStorage["inst_token_"+((typeof KL!=="undefined"&&KL.slug)||"brns")]||"";
const upOpen=()=>((typeof KL!=="undefined"&&KL.slug)||"brns")==="brns"&&location.hostname==="rutgerroenhorst.github.io";
const upApi=(p,o)=>fetch(TXAPI()+p,Object.assign({},o||{},{headers:Object.assign(upTok()?{Authorization:"Bearer "+upTok()}:(upOpen()?{"X-Klant":"brns"}:{}),(o&&o.headers)||{})}));
let BSC=null,LRN=null,DOS=null,DOSURL={};
// ---------- licht/donker ----------
function upThema(){const t=localStorage.thema||"auto";if(t==="auto")delete document.documentElement.dataset.thema;else document.documentElement.dataset.thema=t}
upThema();
(function(){const h=document.querySelector(".top .brand");if(h&&!document.getElementById("thema")){h.insertAdjacentHTML("afterend",`<button id="thema" class="ghost sm" title="Weergave">Weergave: ${{auto:"automatisch",licht:"licht",donker:"donker"}[localStorage.thema||"auto"]}</button>`)}})();
document.addEventListener("click",e=>{const b=e.target.closest("#thema");if(!b)return;const n={auto:"licht",licht:"donker",donker:"auto"}[localStorage.thema||"auto"];localStorage.thema=n;upThema();b.textContent="Weergave: "+{auto:"automatisch",licht:"licht",donker:"donker"}[n]});
// ---------- waarom-zin en status op dealkaart ----------
function waaromZin(d){const c=d.c||{},g=d.marge||{},n=d.n_vergelijk||((d.autos||[]).length-1),k=d.korting!=null?d.korting:(c.prijs&&d.mediaan?Math.round((c.prijs/d.mediaan-1)*100):null),r=String(d.reden||"").toLowerCase(),L=[];
 if(k!=null&&k<0)L.push(`${-k}% onder de marktwaarde van ${eur(d.mediaan)}`);else if(d.mediaan)L.push(`marktwaarde ${eur(d.mediaan)}`);
 if(n>0)L.push(`vergeleken met ${n} auto${n===1?"":"'s"}`);if(g.marge>0)L.push(`marge na kosten ongeveer ${eur(g.marge)}`);
 if(/prijs verlaagd|prijsdaling/.test(r))L.push("prijs is verlaagd");if(c.verkoper==="particulier")L.push("particuliere verkoper");
 return L.length?L.join(", ").replace(/^./,x=>x.toUpperCase())+".":""}
function dealStatus(d){const g=d.marge||{};let tx=[];try{tx=taxatie(d)}catch(e){}if(tx.length||d.verdacht)return["bijna","Eerst controleren"];if(g.marge>0)return["deal","Deal"];return["duur","Te duur"]}
const _kort=kort;kort=function(d){let h=_kort(d);try{const w=waaromZin(d),[s,l]=dealStatus(d);
 h=h.replace('<div class="kc">',`<div class="kc st-${s}" data-status="${l}">`);
 if(w)h=h.replace(/(<h2 class="t">[\s\S]*?<\/h2>)/,`$1<div class="waarom"><b>Waarom:</b> ${esc(w)}</div>`);
 if(d.id)h=h.replace(/(<div class="kc-a">[\s\S]*?)(<\/div>\s*<details class="meer")/,`$1<a class="btn sm sec" href="https://t.me/${ASSIST}?start=deal_${esc(d.id)}" target="_blank" rel="noopener" title="Opent de Assistent met deze auto: afspraak plannen of foto's naar het dossier">Afspraak of foto's</a>$2`)}catch(e){}return h};
// ---------- tab Vandaag ----------
const _render=render;render=function(){if(seg!==VD){_render();upTabs();upNa();return}seg=8;try{_render()}finally{seg=VD}upTabs();if(typeof tabZichtbaar==="function")tabZichtbaar();document.querySelector(".filters").style.display="none";document.querySelector(".bronnen").style.display="none";const sb=$("#sbox");if(sb)sb.remove();vandaag()};
function upTabs(){const t=$("#tabs");if(!t)return;if(!t.querySelector(`[data-i="${VD}"]`)){t.querySelectorAll("button").forEach(b=>{if(seg===VD)b.classList.remove("on")});t.insertAdjacentHTML("afterbegin",`<button class="${seg===VD?"on":""}" data-i="${VD}">Vandaag</button>`)}else{t.querySelectorAll("button").forEach(b=>{b.classList.toggle("on",+b.dataset.i===seg)})}if(typeof tabZichtbaar==="function")tabZichtbaar()}
const _startSeg=startSeg;startSeg=function(){const was=seg,h=location.hash||"";_startSeg();if(was<0&&(!h||h==="#vandaag"))seg=VD;if(/^#taxatie-/.test(h)){seg=13;const id=h.slice(9);setTimeout(()=>{const t=txAll()[id];if(t){Object.assign(TX,t.invoer.TX);TX3=Object.assign({},t.invoer.TX3,{id:t.id});TXR3={r:null};txGo()}},900)}};
function upFetch(){if(BSC===null){BSC=0;fetch("bronscore.json?"+Date.now()).then(r=>r.ok?r.json():{}).then(j=>{BSC=j;if(seg===VD||seg===8)render()}).catch(()=>{BSC={}})}
 if(!TXV){fetch("voorraad.json?"+Date.now()).then(r=>r.ok?r.json():{autos:[]}).then(j=>{TXV=j;if(seg===VD)render()}).catch(()=>{TXV={autos:[]}})}
 if(LRN===null&&upTok()){LRN=0;upApi("/leren").then(r=>r.ok?r.json():null).then(j=>{LRN=j||{};if([VD,12,16].includes(seg))render()}).catch(()=>{LRN={}})}}
function vRij(t,s,a,extra){extra=extra||{};const open=extra.open,foto=extra.foto,cls=["vr",open?"vr-deal":"",extra.cls||""].filter(Boolean).join(" ");
 const thumb=open?`<div class="vr-ph" aria-hidden="true">${foto?`<img src="${esc(foto)}" alt="" loading="lazy" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'vr-ph-x',textContent:'Geen foto'}))">`:`<span class="vr-ph-x">Geen foto</span>`}</div>`:"";
 const chev=open?`<span class="vr-chev" aria-hidden="true">›</span>`:"";
 return `<li class="${cls}"${open?` data-open="${esc(open)}" role="link" tabindex="0" title="Bekijk deal">`:">"}${thumb}<div class="vr-m"><div class="vr-t">${t}</div><div class="vr-s">${s||""}</div></div>${chev}<div class="vr-a">${a||""}</div></li>`}
function vandaag(){upFetch();$("#kpis").innerHTML="";const A=alleDeals().filter(d=>!HID.has(d.deal_url)&&d.c&&d.c.online!==false&&!d.verlopen&&!/verkocht/i.test(d.titel||"")),nu=Date.now();
 const open=A.filter(d=>!["Gekocht","Afgewezen"].includes(pget(d.deal_url).status)).sort((a,b)=>String(b.nieuw_iso||"").localeCompare(String(a.nieuw_iso||""))||((b.marge||{}).marge||0)-((a.marge||{}).marge||0));
 const vers=open.filter(d=>d.nieuw_iso&&nu-new Date(d.nieuw_iso).getTime()<48*3600e3),H=herinneringen(),T=Object.values(txAll()).sort((a,b)=>String(b.gewijzigd||"").localeCompare(String(a.gewijzigd||""))).slice(0,6);
 const V=((TXV&&TXV.autos)||[]).filter(a=>(a.dagen||0)>=30||/boven markt/.test((a.advies||{}).label||"")).sort((a,b)=>(b.dagen||0)-(a.dagen||0)).slice(0,6);
 const knop=(l,i,cl)=>`<button class="btn ${cl||""}" data-gotab="${i}">${l}</button>`;
 const bi=D.segmenten.findIndex(x=>x.id==="brns"),nBrns=bi>=0?D.segmenten[bi].deals.length:0,nFlips=(D.segmenten.find(x=>x.id==="flips")||{deals:[]}).deals.length;
 const dl=(d)=>{const[s,l]=dealStatus(d),foto=(d.c&&d.c.foto)||"";
  return vRij(`<span class="sdot2 st-${s}" title="${l}"></span><span class="vr-titel">${esc(d.titel)}</span>`,
   `${eur(d.c.prijs)} · ${esc(waaromZin(d))}${(d.marge&&d.marge.marge!=null)?` · marge ${d.marge.marge<0?"−"+eur(-d.marge.marge):eur(d.marge.marge)}`:""}${d._seg==="flips"?" · flip":""}`,
   `<span class="btn sm ghost vr-bekijk">Bekijk deal</span><a class="btn sm sec" href="${esc(d.deal_url)}" target="_blank" rel="noopener" data-extadv>Advertentie</a>`,
   {open:d.id,foto})};

 const blok=(t,n,inh,leeg)=>`<section class="vb"><h3>${t}${n!=null?` <span class="cnt">${n}</span>`:""}</h3>${inh||`<div class="meta">${leeg}</div>`}</section>`;
 const opvolgen=H.map(([u,p])=>{const d=A.find(x=>x.deal_url===u);
  if(d) return vRij(`<span class="vr-titel">${esc(d.titel)}</span>`,`${esc(p.status)} · herinnering ${esc(String(p.herinner).replace("T"," "))}${p.notitie?" · "+esc(p.notitie.slice(0,60)):""}`,`<span class="btn sm ghost vr-bekijk">Bekijk deal</span>`,{open:d.id,foto:(d.c&&d.c.foto)||""});
  return vRij(esc(u.slice(0,50)),`${esc(p.status)} · herinnering ${esc(String(p.herinner).replace("T"," "))}${p.notitie?" · "+esc(p.notitie.slice(0,60)):""}`,"")});
 const bs=BSC&&BSC.per_bron?Object.entries(BSC.per_bron).map(([b,n])=>`${esc(b)} ${n}`).join(", "):"";
 const lr=LRN&&LRN.paren!=null?`Leren van eigen verkopen: ${LRN.paren} inkoop en verkoop gekoppeld, ${LRN.actief?"model actief":"model actief vanaf "+LRN.drempel+" (nog "+LRN.nog_nodig+" nodig)"}.`:upTok()?"":"Log in bij Instellingen om taxaties, dossier en leren op alle toestellen te zien.";
 $("#cards").innerHTML=`<div class="vandaag"><div class="vk">${knop("Nieuwe taxatie",13)} ${knop("Alle deals",Math.max(0,D.segmenten.findIndex(x=>x.id==="brns")),"ghost")} ${knop("Bijna-deals",18,"ghost")} ${knop("Eigen voorraad",12,"ghost")} ${knop("Meldingen",6,"ghost")}</div>
 <div class="vgrid">${blok("Nu opvolgen",H.length,H.length?`<ul class="vl">${opvolgen.join("")}</ul>`:"","Geen herinneringen voor vandaag.")}
 ${blok("Nieuwe deals (48 uur)",vers.length,vers.length?`<ul class="vl">${vers.slice(0,8).map(dl).join("")}</ul>${vers.length>8?`<div class="meta">Nog ${vers.length-8} nieuw — open Inkoopkansen of Eigen flips.</div>`:""}`:"","Geen nieuwe deals in de laatste 48 uur.")}
 ${blok("Open deals",open.length,open.length?`<ul class="vl">${open.filter(d=>!vers.includes(d)).slice(0,6).map(dl).join("")}</ul><div class="meta">Open deals = alle segmenten (Inkoopkansen ${nBrns} + Eigen flips ${nFlips}${open.length!==nBrns+nFlips?`, waarvan ${open.length} niet afgewezen/gekocht`:""}). Tab Inkoopkansen toont alleen BRNS (${nBrns}). Tik op een regel voor de volledige kaart (foto, marge, vergelijkers).</div>`:"","Geen open deals.")}
 ${blok("Open taxaties en voorstellen",T.length,T.length?`<ul class="vl">${T.map(t=>vRij(`<a href="#taxatie-${esc(t.id)}" data-vtx="${esc(t.id)}">${esc(t.auto)}</a>`,`${esc(t.datum||"")} · inruil ${eur(t.inruil_midden||0)}${t.soort==="voorstel"?" · voorstel":""}`,"")).join("")}</ul>`:"","Nog geen opgeslagen taxaties.")}
 ${blok("Voorraad die te lang staat",V.length,V.length?`<div class="meta">Te lang = minstens 30 dagen in voorraad sinds onze eerste meting, of vraagprijs meer dan 5% boven de mediaan van minstens 4 vergelijkbare NL-advertenties. Wij wijzigen nooit zelf een prijs.</div><ul class="vl">${V.map(vrLangRij).join("")}</ul>`:"",TXV?"Geen voorraad die opvalt.":"Voorraad laden")}
 </div><div class="meta vfoot">${bs?`Deals per bron (${BSC.dagen} dagen): ${bs}. `:""}${esc(lr)}${upTok()?' <button type="button" class="btn sm ghost" data-paren>Verkopen invoeren</button>':""}</div></div>`}
function vrId(u){let h=0;for(const c of String(u||""))h=(h*31+c.charCodeAt(0))|0;return (h>>>0).toString(36)}
function vrLangRij(a){const ad=a.advies||{},bov=/boven markt/.test(ad.label||""),lang=(a.dagen||0)>=30,ik=(typeof ikGet==="function"?ikGet(a.url):null)||{};
 const waarom=[lang?`${a.dagen} dagen sinds onze eerste meting (${esc(a.sinds||"")}; echte statijd kan langer zijn)`:"",bov?`${esc(ad.label)} (mediaan ${eur(ad.mediaan)}, n=${ad.n})`:(!lang?"":ad.mediaan?`markt ${eur(ad.mediaan)}, n=${ad.n}`:`te weinig vergelijkers (n=${ad.n||0})`)].filter(Boolean).join(" · ");
 const stap=bov?"Vergelijk met de markt en beslis zelf over de prijs.":ad.mediaan?"Prijs ligt in de markt: check courantheid (vergelijkers, omloop) en presentatie.":"Te weinig vergelijkers voor een prijsadvies: taxeer opnieuw.";
 const dos=ik.inkoop!=null?"":" · geen inkoopprijs vastgelegd op dit toestel (marge onbekend)";
 return vRij(`<a href="#voorraad-${vrId(a.url)}" data-vrgo="${esc(a.url)}">${esc(String(a.titel||"").split("|")[0].slice(0,60))}</a>`,`${eur(a.prijs)} · ${waarom}${dos}`,`<span class="meta">${esc(stap)}</span> <button type="button" class="btn sm ghost" data-vrgo="${esc(a.url)}">Open in voorraad</button> <button type="button" class="btn sm ghost" data-vrtax="${esc(a.url)}">Taxeer opnieuw</button>`)}
document.addEventListener("click",e=>{const g=e.target.closest("[data-vrgo],[data-vrtax]");if(!g)return;e.preventDefault();const u=g.dataset.vrgo||g.dataset.vrtax;
 if(g.dataset.vrtax!=null){txKlaar(()=>{seg=13;try{if(typeof txVanVoorraad==="function"){TX3.voorraad=u;txVanVoorraad(u)}}catch(x){}render();window.scrollTo(0,0)});return}
 seg=12;render();const zoek=(n)=>{const el=document.getElementById("voorraad-"+vrId(u));if(el){el.scrollIntoView({block:"start"});el.classList.add("hl")}else if(n>0)setTimeout(()=>zoek(n-1),300);else{const c=$("#cards");if(c)c.insertAdjacentHTML("afterbegin",`<div class="meta">Deze auto staat niet (meer) in de laatste voorraadmeting; er is geen dossier om te openen.</div>`)}};zoek(10)});
function upOpenDeal(id){if(!id||typeof route!=="function")return;history.pushState(null,"","?deal="+encodeURIComponent(id)+"#deal-"+id);route(id)}
document.addEventListener("click",e=>{
 if(e.target.closest("[data-extadv],a[target=_blank],button,[data-gotab],[data-vtx],[data-paren]"))return;
 const a=e.target.closest("[data-open]");if(a&&(seg===VD||a.closest(".vandaag"))){e.preventDefault();upOpenDeal(a.dataset.open);return}
 const t=e.target.closest("[data-vtx]");if(t){e.preventDefault();seg=13;render();const x=txAll()[t.dataset.vtx];if(x){Object.assign(TX,x.invoer.TX);TX3=Object.assign({},x.invoer.TX3,{id:x.id});TXR3={r:null};txGo()}}},true);
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const a=e.target.closest("li.vr-deal[data-open]");if(!a||!(seg===VD||a.closest(".vandaag")))return;e.preventDefault();upOpenDeal(a.dataset.open)});
// ---------- leren zichtbaar (Eigen voorraad en Trends) ----------
function lerenBlok(){if(!upTok())return `<div class="tk leren"><b>Leren van eigen verkopen</b><div class="meta">Log in bij Instellingen om te zien hoeveel inkoop- en verkoopparen het model heeft.</div></div>`;if(!LRN)return "";
 const p=Math.min(100,Math.round(LRN.paren/LRN.drempel*100));return `<div class="tk leren"><b>Leren van eigen verkopen: ${LRN.actief?"actief":"nog niet actief"}</b><div class="bar"><i style="width:${p}%"></i></div><div class="meta">${LRN.paren} van ${LRN.drempel} paren inkoop en verkoop. Verkocht gemeten: ${LRN.verkocht}. Inkoopprijs bekend: ${LRN.inkoop_bekend} auto's (${LRN.inkoop_te_koop} nog te koop). ${LRN.actief?"Het model corrigeert taxaties met je echte verkopen.":"Vul bij Eigen voorraad de inkoopprijs in; elke verkochte auto met inkoopprijs telt mee."}</div></div>`}
function upNa(){try{upFetch();const c=$("#cards");if(!c)return;if((seg===12||seg===16)&&!c.querySelector(".leren"))c.insertAdjacentHTML(seg===12?"afterbegin":"beforeend",lerenBlok());
 if(seg===8&&BSC&&BSC.per_bron&&!c.querySelector(".bsc"))c.insertAdjacentHTML("beforeend",`<article class="card wide bsc"><div class="body"><h2 class="t">Bron-score</h2><div class="meta">Welke bron levert echte deals, laatste ${BSC.dagen} dagen (${BSC.deals} deals). ${esc(BSC.regel)}</div><ul class="vl">${(BSC.per_model||[]).slice(0,12).map(r=>vRij(esc(r.model),`${r.deals} deals, meeste via ${esc(r.beste)}`,"")).join("")}</ul>${(BSC.advies||[]).length?`<div class="meta">${BSC.advies.map(esc).join(". ")}</div>`:""}</div></article>`);
 if(seg===13)txStappen()}catch(e){}}
// ---------- taxatie in drie stappen ----------
const _txUp=taxatie2;taxatie2=function(){_txUp();txStappen()};
function txStappen(){const body=document.querySelector("#cards .card .body");if(!body||body.querySelector(".stappen"))return;const R=TXR3&&TXR3.r,s1=!!(TX.merk&&TX.model&&TX.jaar),s2=!!(R&&R.inruil),s3=!!TX3.id;
 const st=(n,l,ok,on)=>`<li class="${ok?"ok":""}${on?" on":""}"><span>${n}</span>${l}</li>`;const act=!s1?1:!s2?2:3;
 const h=`<div class="stappen"><ol>${st(1,"Kenteken of VIN",s1,act===1)}${st(2,"Controleer en taxeer",s2,act===2)}${st(3,"Voorraadauto, opslaan en delen",s3,act===3)}</ol>
 <div class="frow snel"><label style="flex:1 1 260px">Kenteken of VIN<input id="snelk" value="${esc(TX.vin||TX.kenteken||"")}" placeholder="XX-123-Y of 17 tekens VIN" autocomplete="off"></label><label>Km-stand<input id="snelkm" type="number" inputmode="numeric" value="${esc(TX.km||"")}" placeholder="85000"></label><button class="btn" id="snelgo">${s1?"Opnieuw ophalen":"Ophalen"}</button>${s1&&!s2?'<button class="btn" id="snelt">Taxeer</button>':""}</div>
 ${s2?`<div class="frow">${s3?"":'<button class="btn" id="snelsave">Opslaan</button>'}<button class="btn ghost" id="deelv">Deel als voorstel</button>${s3?`<a class="btn ghost" href="https://t.me/${ASSIST}?start=tax_${esc(TX3.id)}" target="_blank" rel="noopener">Foto's via Assistent</a>`:""}</div>`:""}
 ${s3?`<div class="dossier tk"><b>Dossier</b> <span class="meta">Foto's en papieren bij deze taxatie, alleen zichtbaar na inloggen.</span><div class="thumbs" id="thumbs"></div><label class="btn ghost sm">Foto toevoegen<input type="file" accept="image/*" id="dosup" hidden multiple></label></div>`:""}</div>`;
 body.querySelector("h2.t").insertAdjacentHTML("afterend",h);if(s3)dosToon(TX3.id)}
function txVoorstel(){const R=TXR3&&TXR3.r;if(!R||!R.inruil)return null;let S=null,Sc=null,A=null;try{S=ruilVoorraad();Sc=ruilScenarios(S,R);A=Sc?ruilAdvies(S,R,Sc):null}catch(e){}
 const bod=A?A.bod:R.inruil.midden,v={auto:[String(TX.merk||"").replace(/-/g," ").replace("mercedes benz","Mercedes-Benz"),TX.model,TX.var,TX.jaar].filter(Boolean).join(" ").replace(/(^|\s)([a-z])/g,(m,s,x)=>s+x.toUpperCase())+(TX.km?", "+(+TX.km).toLocaleString("nl-NL")+" km":""),kenteken:TX.kenteken||"",inruil:Math.round(bod/50)*50,datum:new Date().toLocaleDateString("nl-NL"),bedrijf:(KL.naam||KL.bedrijf||"BRNS Exclusief"),notitie:""};
 if(S&&S.a){v.voorraad_titel=S.a.titel.split("|")[0].trim().slice(0,70);v.voorraad_prijs=S.a.prijs-(A?A.korting:0);v.bijbetalen=v.voorraad_prijs-v.inruil}return v}
async function txDeel(){const v=txVoorstel();if(!v){toast("Eerst taxeren");return}const base=location.href.split("#")[0].replace(/[^/]*$/,"")+"voorstel.html";let url=base+"#d="+btoa(unescape(encodeURIComponent(JSON.stringify(v))));
 if(upTok()){try{const r=await upApi("/voorstel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({voorstel:v})});if(r.ok){const j=await r.json();if(j.t)url=base+"?t="+encodeURIComponent(j.t)}}catch(e){}}
 try{await navigator.clipboard.writeText(url);toast("Link gekopieerd",2200)}catch(e){}window.open(url,"_blank","noopener")}
document.addEventListener("click",e=>{const b=e.target.closest("#snelgo,#snelt,#snelsave,#deelv");if(!b)return;e.preventDefault();e.stopImmediatePropagation();
 const km=($("#snelkm")||{}).value;if(km)TX.km=km;
 if(b.id==="snelgo"){const raw=(($("#snelk")||{}).value||"").toUpperCase().replace(/[\s-]/g,"");if(!raw){toast("Vul een kenteken of VIN in");return}if(!TX3.bron)TX3.bron="hand";
  if(raw.length===17){TX.vin=raw;taxatie2();const x=$("#txvin");if(x)x.click()}else{TX.kenteken=(($("#snelk")||{}).value||"").toUpperCase().trim();taxatie2();const x=$("#txrdw");if(x)x.click()}return}
 if(b.id==="snelt"){txGo();return}if(b.id==="snelsave"){txOpslaan();return}if(b.id==="deelv"){txDeel();return}},true);
// dossier: lijst, miniaturen (via ingelogde fetch), uploaden met verkleinen
async function dosLaad(){if(!upTok())return{};try{const r=await upApi("/dossier");DOS=r.ok?(await r.json()).dossier||{}:{}}catch(e){DOS={}}return DOS}
async function dosToon(id){const el=$("#thumbs");if(!el)return;if(!upTok()){el.innerHTML='<span class="meta">Log in bij Instellingen om het dossier te zien.</span>';return}const L=(await dosLaad())[id]||[];
 if(!L.length){el.innerHTML='<span class="meta">Nog geen bestanden.</span>';return}el.innerHTML=L.map(f=>`<a class="th" data-dos="${esc(id)}/${esc(f)}" href="#">${/\.pdf$/i.test(f)?"PDF":""}</a>`).join("");
 for(const a of el.querySelectorAll("[data-dos]")){const k=a.dataset.dos;if(/\.pdf$/i.test(k))continue;try{if(!DOSURL[k]){const r=await upApi("/dossier/"+k);DOSURL[k]=URL.createObjectURL(await r.blob())}a.style.backgroundImage=`url(${DOSURL[k]})`}catch(e){}}}
document.addEventListener("click",async e=>{const a=e.target.closest("[data-dos]");if(!a)return;e.preventDefault();const k=a.dataset.dos;try{if(!DOSURL[k]){const r=await upApi("/dossier/"+k);DOSURL[k]=URL.createObjectURL(await r.blob())}window.open(DOSURL[k],"_blank")}catch(x){toast("Openen mislukt")}});
function verklein(f){return new Promise((ok,nee)=>{const i=new Image();i.onload=()=>{const m=1600,s=Math.min(1,m/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);c.getContext("2d").drawImage(i,0,0,c.width,c.height);ok(c.toDataURL("image/jpeg",0.82))};i.onerror=nee;i.src=URL.createObjectURL(f)})}
document.addEventListener("change",async e=>{if(e.target.id!=="dosup"||!TX3.id)return;if(!upTok()){toast("Log eerst in bij Instellingen");return}for(const f of e.target.files){try{const d=await verklein(f);const r=await upApi("/dossier/"+TX3.id,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:d,ext:"jpg"})});toast(r.ok?"Foto opgeslagen":"Opslaan mislukt")}catch(x){toast("Opslaan mislukt")}}dosToon(TX3.id)});
const _vrUp=voorraad;voorraad=function(){const r=_vrUp.apply(this,arguments);setTimeout(upNa,0);return r};
const _trUp=trends;trends=function(){const r=_trUp.apply(this,arguments);setTimeout(upNa,0);return r};
if(typeof D!=="undefined"&&D)render();

// TXKLAAR_V1: marktindex en voorraad laden vóór het vooraf invullen van de inruiltaxatie (MI/TXV zijn lazy).
function txKlaar(cb){const mi=(typeof MI!=="undefined"&&MI)?MI:fetch("marktindex.json?"+Date.now()).then(r=>{if(!r.ok)throw 0;return r.json()});
 const tv=(typeof TXV!=="undefined"&&TXV)?TXV:fetch("voorraad.json?"+Date.now()).then(r=>r.ok?r.json():{autos:[]}).catch(()=>({autos:[]}));
 const wm=(typeof WM!=="undefined"&&WM)?WM:fetch("waardemodel.json?"+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({}));
 Promise.all([mi,tv,wm]).then(([a,c,w])=>{MI=a;TXV=c;WM=w;cb()}).catch(()=>{seg=13;render();window.scrollTo(0,0)})}
