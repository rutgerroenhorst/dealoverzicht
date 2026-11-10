// Tab 'Bijna-deals': auto's die net niet door de dealcriteria kwamen (bijna.json, gemaakt door de normale scan; geen extra verzoeken).
// Verdachte advertenties en uitschieters staan hier bewust niet in. 'Zo kan het toch' rekent alleen met echte data; schattingen staan erbij.
let BJ=null,BJF="alle",BJME=null;
const BJS={marge:"Marge net te laag",prijs:"Prijs net boven drempel",vergelijking:"Te weinig vergelijkbare auto's",vertrouwen:"Eerst controleren",profiel:"Buiten inkoopprofiel"};
function bjEu(x){return x==null||isNaN(x)?"n.b.":"€"+Math.round(x).toLocaleString("nl-NL")}
function bjPct(a,b){return b?Math.round((1-a/b)*100):null}
function bjEuMarkt(x){if(!BJME||!BJME.modellen)return null;const mk=(x.merk||"").toLowerCase(),t=(x.titel||"").toLowerCase();let best=null;
 for(const m of BJME.modellen){if((m.merk||"").toLowerCase()!==mk)continue;const md=(m.model||"").toLowerCase();if(md&&t.includes(md)&&(!best||md.length>best.model.length))best=m}return best}
function bijnaDeals(){$("#kpis").innerHTML="";
 if(!BJ){$("#cards").innerHTML='<div class="meta">Bijna-deals laden…</div>';Promise.all([fetch("bijna.json?"+Date.now()).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]})),fetch("markt_eu.json?"+Date.now()).then(r=>r.ok?r.json():null).catch(()=>null)]).then(([j,m])=>{BJ=j;BJME=m;render()});return}
 const all=BJ.items||[],L=all.filter(x=>BJF==="alle"||x.soort===BJF);
 const knop=(k,t)=>{const n=k==="alle"?all.length:all.filter(x=>x.soort===k).length;return `<button type="button" class="chip bjf${BJF===k?" on":""}" data-bjf="${k}" aria-pressed="${BJF===k}">${esc(t)} (${n})</button>`};
 const kaart=x=>{const sc=Math.max(0,Math.round((1-(x.afstand||0))*100)),land=x.land||"NL",vk=x.verkoper||"onbekend";
  const mg=x.marge!=null?`Geschatte marge <b>${bjEu(x.marge)}</b>${x.drempel?` · minimum ${bjEu(x.drempel)}`:""}`:x.verschil!=null?`${bjEu(x.verschil)} onder de mediaan (vóór kosten)`:"";
  const vs=x.mediaan&&x.prijs?`<b>${bjEu(x.prijs)}</b> · mediaan ${bjEu(x.mediaan)} (${bjPct(x.prijs,x.mediaan)>=0?bjPct(x.prijs,x.mediaan)+"% onder":(-bjPct(x.prijs,x.mediaan))+"% boven"})${x.n_vergelijk!=null?` · ${x.n_vergelijk} vergelijkbaar`:""}`:`<b>${bjEu(x.prijs)}</b>`;
  const link=x.url?`<a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener">Bekijk advertentie${x.bron?" ("+esc(x.bron)+")":""}</a>`:`<span class="meta">${esc(x.link_verborgen||"link niet getoond")}</span>`+(x.refs&&x.refs.length&&typeof vglKaart==="function"?vglKaart(x.refs):"");
  const spec=[x.jaar?String(x.jaar):"",x.km?Number(x.km).toLocaleString("nl-NL")+" km":"",x.dagen!=null?x.dagen+" d online":""].filter(Boolean).map(t=>`<span class="chip">${esc(t)}</span>`).join("");
  return `<article class="card">${x.foto?`<img class="foto" src="${esc(x.foto)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:""}<div class="body">
  <div class="chips"><span class="chip">${esc(BJS[x.soort]||x.soort)}</span><span class="chip">${sc}% dichtbij</span>${vk==="particulier"?'<span class="chip ok">Particulier</span>':vk==="bedrijf"?'<span class="chip">Bedrijf</span>':""}<span class="chip">${esc(land)}${x.plaats?" · "+esc(x.plaats):""}</span></div>
  <div class="meta">${esc(x.merk||"")}</div><h3 class="t">${esc(x.titel||"")}</h3><div class="chips">${spec}</div>
  <div class="meta">${vs}</div>${mg?`<div class="meta">${mg}</div>`:""}
  ${(x.vlaggen||[]).length?`<div class="chips">${x.vlaggen.map(f=>`<span class="chip warn">${esc(f)}</span>`).join("")}</div>`:""}
  ${dealAfweging(x,x.soort)}<div>${link}</div></div></article>`};
 $("#cards").innerHTML=`<div class="card wide"><h3>Bijna-deals</h3><div class="meta">Auto's die net niet door de criteria kwamen, de dichtstbijzijnde eerst. Marges en mediaan zijn schattingen; controleer zelf. Verdachte advertenties en uitschieters staan hier niet tussen.${BJ.bijgewerkt?" Bijgewerkt "+esc(BJ.bijgewerkt.replace("T"," ")):""}</div>
 <div class="chips" id="bjchips">${knop("alle","Alle")}${Object.keys(BJS).map(k=>knop(k,BJS[k])).join("")}</div><div class="meta" id="bjn">${BJF==="alle"?"":L.length+" getoond: "+esc(BJS[BJF])}</div></div>`+bjAfgewezen()+(L.length?L.map(kaart).join(""):'<div class="meta">Geen bijna-deals in deze categorie.</div>')}
document.addEventListener("click",e=>{const b=e.target.closest("[data-bjf]");if(!b)return;e.preventDefault();BJF=b.dataset.bjf;render()});

/* 04-11: afgewezen lijsten uit Markt (Eerst taxeren, Buiten profiel, Te weinig marge) als inklapbare secties. */
function bjAfgewezen(){if(typeof afgewezenKaarten!=="function"||!D)return "";let h="";try{h=afgewezenKaarten()}catch(e){return ""}if(!h)return "";
 const st=(()=>{try{return JSON.parse(localStorage.bj_afg||"{}")}catch(e){return {}}})();
 return h.replace(/<article class="card wide (\w+)"><div class="body"><h2 class="t">([^<]*)<\/h2>/g,(m,k,t)=>`<article class="card wide ${k} bj-afg"><div class="body"><details class="why" data-bjafg="${k}"${st[k]?" open":""}><summary><b>${t}</b></summary>`).replace(/<\/div><\/article>/g,"</details></div></article>")}
document.addEventListener("toggle",e=>{const d=e.target;if(!d||!d.dataset||!d.dataset.bjafg)return;let st={};try{st=JSON.parse(localStorage.bj_afg||"{}")}catch(x){}st[d.dataset.bjafg]=d.open;try{localStorage.bj_afg=JSON.stringify(st)}catch(x){}},true);
