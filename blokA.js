// Blok A: eigen voorraad (verkoopkant), terugkoppeling gekochte auto's (+ kalibratie-export), lang te koop / onderhandelruimte.
let VR=null;
// ---------- Eigen voorraad ----------
function vrChip(a){const l=a.advies.label;return l.startsWith("prijs boven")?"bad":l==="scherp geprijsd"?"ok":l==="marktconform"?"":"wk-onb"}
function voorraad(){$("#kpis").innerHTML="";$("#cards").innerHTML='<div class="meta">Eigen voorraad laden…</div>';
 if(!VR){fetch("voorraad.json?"+Date.now()).then(r=>{if(!r.ok)throw 0;return r.json()}).then(j=>{VR=j;voorraad()}).catch(()=>{$("#cards").innerHTML='<div class="empty">Nog geen voorraadmeting (komt na de eerstvolgende ochtendrun).</div>'});return}
 const A=VR.autos,n=f=>A.filter(f).length,bov=n(a=>a.advies.label.startsWith("prijs boven"));
 $("#kpis").innerHTML=[[VR.te_koop,"Te koop","Auto's die nu op de eigen voorraadpagina te koop staan (verkochte auto's tellen niet mee)."],[bov,"Prijs boven markt","Vraagprijs meer dan 5% boven de mediaan van minstens 4 vergelijkbare NL-advertenties."],[n(a=>a.advies.label==="scherp geprijsd"),"Scherp geprijsd","Vraagprijs minstens 3% onder de mediaan van vergelijkbare NL-advertenties."],[VR.gem_statijd!=null?VR.gem_statijd+" d":"–","Gem. statijd verkocht","Gemiddeld aantal dagen tussen eerste meting en verdwijnen van de site, over auto's die wij hebben zien verkopen ("+VR.verkocht_gemeten+")."]].map(([b,s,t])=>`<div class="kpi"><b>${esc(b)}</b><span>${s} ${T(t)}</span></div>`).join("");
 const row=a=>{const ad=a.advies,pv=a.prijsverloop||[];return `<article class="card"><div class="body">
  <div class="meta">${esc(a.brandstof||"")}${a.btw?" · btw-auto":""} · <a href="${esc(a.url)}" target="_blank" rel="noopener">voorraadpagina ↗</a></div><h2 class="t">${esc(a.titel)}</h2>${kjl(a.jaar,a.km,a.brandstof,null,a.plaats?{t:a.plaats,l:"NL"}:null)}
  <div><span class="price">${eur(a.prijs)}</span> <span class="meta">${esc(a.jaar||"")} · ${esc(a.km||"")}</span></div>
  <div class="chips"><span class="chip ${vrChip(a)}">${esc(ad.label)}</span>${ad.mediaan?`<span class="chip" title="Mediaan vraagprijs van ${ad.n} vergelijkbare NL-advertenties (zelfde merk/model/uitvoering, bouwjaar ±1, km ±40%), spreiding ${ad.spreiding??"–"}%">markt ${eur(ad.mediaan)}${ad.pct!=null?" ("+(ad.pct>0?"+":"")+ad.pct+"%)":""} · n=${ad.n}</span>`:`<span class="chip">n=${ad.n} vergelijkbaar</span>`}<span class="chip bt-${esc(ad.betrouwbaarheid)}">Betrouwbaarheid ${esc(ad.betrouwbaarheid)}</span><span class="chip" title="Gemeten sinds ${esc(a.sinds)} (eerste keer dat wij hem op de voorraadpagina zagen)">${a.dagen} dagen in voorraad${a.sinds===VR.eerste_meting?" (sinds eerste meting)":""}</span></div>
  <div class="meta">Prijsverloop: ${pv.length>1?pv.map(([d,p])=>esc(d)+" "+eur(p)).join(" → ")+" "+spark(pv):"geen wijziging sinds "+esc(a.sinds)}</div>
  ${(ad.voorbeelden||[]).length?`<details class="why"><summary>Vergelijkbare advertenties (${ad.n})</summary><ul>${ad.voorbeelden.map(v=>`<li><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.titel)}</a> · ${esc(v.jaar||"")} · ${v.km?esc(String(v.km)).replace(/\B(?=(\d{3})+(?!\d))/g,".")+" km":""} · <b>${eur(v.prijs)}</b></li>`).join("")}</ul></details>`:""}
 </div></article>`};
 $("#cards").innerHTML=`<article class="card wide"><div class="body"><h2 class="t">🏷️ ${esc(KL.tabs.voorraad)}</h2><div class="meta">Bron: ${esc(VR.bron)} · bijgewerkt ${esc(VR.bijgewerkt)}. Dagen in voorraad tellen vanaf onze eerste meting (${esc(VR.eerste_meting)}); de echte statijd kan langer zijn. Advies alleen bij minstens 4 vergelijkbare advertenties; vraagprijzen, geen verkoopprijzen.</div></div></article>`+A.map(row).join("")}
// ---------- Lang te koop / onderhandelruimte ----------
function mfOK(d){return !G.mf.length||!!d.motivatie}
function mchip(d){const m=d.motivatie;return m?`<span class="chip ${m.niveau==="groot"?"mot2":"mot"}" title="${esc(m.reden)}. Signaal voor onderhandelruimte; het verkoperbericht peilt dit beleefd, zonder looptijd of marktprijzen te noemen.">⏳ ${esc(m.label)}</span>`:""}
function mfbar(all){const n=all.filter(d=>d.motivatie).length;return `<div class="seg">${gb("mf","alles","Alle verkopers",all.length)}${gb("mf","lang","⏳ Lang te koop / prijs gezakt",n,"Langer dan "+(KL.motivatie_dagen||60)+" dagen online en/of "+(KL.motivatie_dalingen||2)+"+ prijsdalingen")}</div>`}
function langSectie(all){const L=all.filter(d=>d.motivatie).sort((a,b)=>(b.motivatie.niveau==="groot")-(a.motivatie.niveau==="groot")||b.motivatie.dagen-a.motivatie.dagen);if(gAny("mf"))return `<div class="meta">⏳ Alleen lang te koop / prijs gezakt (${L.length}). <button class="sec sm" data-g="mf" data-v="alles">Toon alles</button></div>`;if(!L.length)return"";
 return `<details class="card wide lang"${open.lang?" open":""} data-lang="1"><summary><b>⏳ Lang te koop / gemotiveerde verkopers (${L.length})</b> <span class="meta">mogelijk onderhandelruimte</span></summary><div class="body"><button class="sec sm" data-g="mf" data-v="lang">Toon alleen deze kaarten</button>${L.map(d=>`<div class="row"><a href="#deal-${esc(d.id||"")}" data-goto="${esc(d.id||"")}">${esc(d.titel)}</a> · ${eur(d.c.prijs)} · <span class="meta">${esc(d.motivatie.reden)}</span> ${mchip(d)}</div>`).join("")}</div></details>`}
document.addEventListener("toggle",e=>{if(e.target.dataset&&e.target.dataset.lang)open.lang=e.target.open},true);
// ---------- Terugkoppeling gekochte auto's ----------
function geschat(d){const g=d.marge||{};const[b,mo]=bm(d);return{titel:d.titel,merk:String(d.merk||b).toLowerCase().replace(/ /g,"-"),model:String(mo).toLowerCase().split(/[ /]/)[0],segment:d._seg||(S()&&S().id)||"",url:d.deal_url,
 vraagprijs:d.c&&d.c.prijs,verkoop:g.verkoop||0,kosten:g.kosten||0,opknap:g.opknap_totaal||0,marge:g.marge||0,regeling:(g.btw&&g.btw.regeling)||"",datum:new Date().toISOString().slice(0,10)}}
function werkMarge(t,regeling){if(t.inkoop==null||t.verkoop==null)return null;const br=t.verkoop-t.inkoop-(t.opknap||0);
 if(regeling==="btw-auto")return Math.round((t.verkoop-t.inkoop)/1.21-(t.opknap||0));const btw=regeling?Math.max(0,(t.verkoop-t.inkoop))*21/121:0;return Math.round(br-btw)}
function tkForm(d){const u=encodeURIComponent(d.deal_url),p=pget(d.deal_url);if(p.status!=="Gekocht")return"";const t=p.tk||{},G=p.geschat||geschat(d),wm=werkMarge(t,G.regeling);
 const f=(k,l,ty)=>`<label>${l}<input type="${ty||"number"}" inputmode="numeric" class="tkv" data-tk="${u}" data-k="${k}" value="${esc(t[k]??"")}"></label>`;
 return `<div class="bodc tk"><b>Terugkoppeling: werkelijk</b> ${T("Alleen op dit toestel. Vul in na aankoop/verkoop; exporteer in Mijn pipeline als kalibratie.json om de kostenraming te verbeteren.")}
 <div class="frow">${f("inkoop","Werkelijke inkoop €")}${f("opknap","Opknap- en bijkomende kosten €")}${f("verkoop","Verkoopprijs €")}${f("verkoopdatum","Verkoopdatum","date")}</div>
 <div class="meta">Geschat: marge ${eur(G.marge)} (verkoop ${eur(G.verkoop)}, kosten+opknap ${eur(G.kosten+G.opknap)}) · Werkelijk: ${wm==null?"vul inkoop en verkoopprijs in":`<b>${wm<0?"−"+eur(-wm):eur(wm)}</b> (${wm-G.marge>=0?"+":"−"}${eur(Math.abs(wm-G.marge))} t.o.v. schatting)`}</div></div>`}
document.addEventListener("change",e=>{const t=e.target;
 if(t.dataset.pst&&t.value==="Gekocht"){const u=decodeURIComponent(t.dataset.pst),d=alleDeals().find(x=>x.deal_url===u),p=pget(u);if(d&&!p.geschat)pset(u,"geschat",geschat(d));render()}
 else if(t.classList.contains("tkv")){const u=decodeURIComponent(t.dataset.tk),p=pget(u),tk=Object.assign({},p.tk||{});tk[t.dataset.k]=t.type==="date"?t.value:(t.value===""?null:+t.value);
  if(!p.geschat){const d=alleDeals().find(x=>x.deal_url===u);if(d)pset(u,"geschat",geschat(d))}pset(u,"tk",tk);toast("Terugkoppeling bewaard");render()}});
function tkLijst(){return Object.entries(PIPE).filter(([u,p])=>p.status==="Gekocht"&&p.geschat).map(([u,p])=>({u,G:p.geschat,t:p.tk||{}}))}
function kalExport(){const A=tkLijst().map(({G,t})=>({titel:G.titel,merk:G.merk,model:G.model,segment:G.segment,url:G.url,gekocht_op:G.datum,
  geschat:{inkoop:G.vraagprijs,kosten:G.kosten,opknap:G.opknap,verkoop:G.verkoop,marge:G.marge},werkelijk:{inkoop:t.inkoop??null,opknap:t.opknap??null,verkoop:t.verkoop??null,verkoopdatum:t.verkoopdatum||null,marge:werkMarge(t,G.regeling)}}));
 const j={versie:1,klant:KL.slug||"brns",gemaakt:new Date().toISOString().slice(0,16),uitleg:"Importeer met: python3 pipeline/cli.py kalibratie --import kalibratie.json",auto_s:A};
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(j,null,1)],{type:"application/json"}));a.download="kalibratie.json";a.click();toast("kalibratie.json gedownload ("+A.length+" auto's)")}
function tkSectie(){const L=tkLijst();if(!L.length)return `<div class="meta">Zet een kaart op <b>Gekocht</b> om werkelijke inkoop, kosten en verkoop bij te houden.</div>`;
 return `<div class="tw"><table class="trt"><tr><th>Auto</th><th>Geschatte marge</th><th>Werkelijke marge</th><th>Verschil</th><th>Verkocht</th></tr>${L.map(({G,t})=>{const w=werkMarge(t,G.regeling);return `<tr><td>${esc(G.titel)}</td><td>${eur(G.marge)}</td><td>${w==null?"–":eur(w)}</td><td>${w==null?"–":(w-G.marge>=0?"+":"−")+eur(Math.abs(w-G.marge))}</td><td>${esc(t.verkoopdatum||"–")}</td></tr>`}).join("")}</table></div>`}
document.addEventListener("click",e=>{const b=e.target.closest("#kexp");if(b)kalExport()});
// Filterbanner: laat zien hoeveel kaarten verborgen zijn en waardoor (tab-badge blijft het totaal).
function actieveFilters(S){const f=[],m=$("#f-merk"),v2=id=>$(id)&&$(id).value.trim();
 f.push(...gLabels(["vk","lf","xf","wf","mf"]));if(m&&m.value)f.push("Merk: "+m.value.replace("|"," "));
 if(v2("#f-pmin")||v2("#f-pmax"))f.push("Prijs "+(v2("#f-pmin")||"…")+"–"+(v2("#f-pmax")||"…"));if(v2("#f-jmin")||v2("#f-jmax"))f.push("Bouwjaar "+(v2("#f-jmin")||"…")+"–"+(v2("#f-jmax")||"…"));if(v2("#f-km"))f.push("Max. km "+v2("#f-km"));
 if($("#f-alleen")&&$("#f-alleen").checked)f.push("Alleen ≥10% onder markt");if($("#f-st")&&$("#f-st").value)f.push("Status: "+$("#f-st").value);
 return f}
function filterBanner(S,all,L){const tot=S.deals.length,verb=S.deals.filter(d=>HID.has(d.deal_url)).length,f=actieveFilters(S);if(L.length>=tot)return"";
 return `<div class="fbanner"><b>${L.length} van ${tot} getoond</b>${f.length?" — filter: "+f.map(esc).join(" · "):""}${verb?` — ${verb} verborgen (verkocht/offline gemeld)`:""} ${f.length?'<button class="sec sm" id="fwis">Filters wissen</button>':""}${verb?'<button class="sec sm" id="fverb">Verborgen terugzetten</button>':""}</div>`}
document.addEventListener("click",e=>{
 if(e.target.closest("#fwis")){document.querySelectorAll(".filters input").forEach(i=>i.type==="checkbox"?i.checked=false:i.value="");$("#f-merk").value="";if($("#f-st"))$("#f-st").value="";gWis();render()}
 if(e.target.closest("#fverb")){const S=D.segmenten[seg];S.deals.forEach(d=>HID.delete(d.deal_url));localStorage.hid=JSON.stringify([...HID]);render()}});
// Spec/optie-herkenning (pipeline/spec.py): chips met gebronde premie waar bekend.
function specChips(d){const S=d.spec;if(!S)return"";const pr=S.premies||[];
 return S.items.map(x=>`<span class="chip ${x.waarde?"spec2":"spec"}" title="${esc(x.waarde?"Waardebepalende specificatie: vergelijk alleen met auto's met dezelfde spec.":"Gewilde optie; premie niet gekwantificeerd.")}">★ ${esc(x.label)}</span>`).join("")+
  pr.map(p=>p.bron?`<a class="chip spec2" href="${esc(p.bron)}" target="_blank" rel="noopener" title="Bron van de premie">${esc(p.tekst)} ↗</a>`:`<span class="chip warn">${esc(p.tekst)}</span>`).join("")}
// Aankoopchecklist (pipeline/checklist.py): afvinken wordt lokaal bij de pijplijn-status van de auto opgeslagen.
function checklistHtml(d){const L=d.checklist;if(!L||!L.length)return"";const v=pget(d.deal_url).checklist||{},n=L.filter(x=>v[x.id]).length;let g="";
 return `<details class="ckl" data-ckl="${esc(d.deal_url)}"><summary>✅ Aankoopchecklist <b>${n}/${L.length}</b></summary><div class="cklb">${L.map(x=>{const h=x.groep!==g?`<div class="cklg">${esc(g=x.groep)}</div>`:"";
  return h+`<label class="ckli"><input type="checkbox" data-ck="${x.id}" ${v[x.id]?"checked":""}> <span>${esc(x.tekst)}${x.bron?` <a href="${esc(x.bron)}" target="_blank" rel="noopener">bron</a>`:""}${x.ongebrond?' <i class="mut">(bekend aandachtspunt — specialist laten bevestigen)</i>':""}</span></label>`}).join("")}
 <button class="sec sm" data-ckprint>🖨 Print checklist</button></div></details>`}
document.addEventListener("change",e=>{const i=e.target.closest("[data-ck]");if(!i)return;const u=i.closest("[data-ckl]").dataset.ckl,v={...(pget(u).checklist||{})};v[i.dataset.ck]=i.checked;pset(u,"checklist",v);
 const L=i.closest("[data-ckl]"),b=L.querySelector("summary b");if(b)b.textContent=L.querySelectorAll("[data-ck]:checked").length+"/"+L.querySelectorAll("[data-ck]").length});
document.addEventListener("click",e=>{const b=e.target.closest("[data-ckprint]");if(!b)return;e.preventDefault();const box=b.closest("[data-ckl]"),u=box.dataset.ckl,d=(typeof deals==="function"?deals():[]).find(x=>x.deal_url===u),w=window.open("","_blank");if(!w)return;
 w.document.write(`<html><head><meta charset="utf-8"><title>Checklist</title><style>body{font:14px system-ui;margin:24px}h1{font-size:18px}.cklg{font-weight:700;margin-top:12px}label{display:block;margin:4px 0}a{color:#555}</style></head><body><h1>Aankoopchecklist — ${esc(d?d.titel:"")}</h1><p>${esc(u)}</p>${box.querySelector(".cklb").innerHTML.replace(/<button[^]*?<\/button>/,"")}</body></html>`);w.document.close();w.print()});
// Gefacetteerde status-telling + aantal actieve filters op de ingeklapte kop.
function stOpts(A){const e=$("#f-st");if(!e)return;const cv=e.value,n=x=>A.filter(d=>pget(d.deal_url).status===x).length;e.innerHTML=`<option value="">Alle statussen (${A.length})</option>`+PIPE_ST.map(x=>`<option value="${esc(x)}"${cv===x?" selected":""}>${esc(x)} (${n(x)})</option>`).join("");e.value=cv}
function fsum(S){const sm=document.querySelector(".filters>summary");if(!sm)return;const n=actieveFilters(S).length;sm.innerHTML=`Filters en sorteren${n?` <span class="badge">${n} actief</span>`:""}`}
