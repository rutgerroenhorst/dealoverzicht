/* Klantgebonden kansenlijst. Alleen eigen API/data; nooit requests naar mobile.de. */
(function(){
'use strict';
const TAB=24,SLUG=(typeof KL!=='undefined'&&KL.slug)||'brns';
const API=(typeof KL!=='undefined'&&KL.instellingen_api)||'https://2-31-144-18.sslip.io/api/inst';
let data=null,omloop=null,fout='',bezig=false;
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro=n=>'€'+Math.round(n||0).toLocaleString('nl-NL');
async function laad(){
 if(bezig)return;bezig=true;fout='';
 try{
  const token=localStorage['inst_token_'+SLUG],open=SLUG==='brns'&&location.hostname==='rutgerroenhorst.github.io';
  const r=await fetch((token||open)?API+'/kansen':'mobilede_kansen.json?'+Date.now(),{headers:token?{Authorization:'Bearer '+token}:(open?{'X-Klant':'brns'}:{}),cache:'no-store'});
  if(!r.ok)throw new Error('Kansenlijst tijdelijk niet beschikbaar.');
  const j=await r.json();if(j.klant!==SLUG)throw new Error('Klantcontrole mislukt.');data=j;
  if(j.omloop_inzichten)omloop=j.omloop_inzichten;else await omloopLaad();
 }catch(err){fout=err.message}finally{bezig=false;if(typeof seg!=='undefined'&&seg===TAB)toon()}
}
async function omloopLaad(){try{const r=await fetch('verkoopsnelheid.json?'+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();if(j.klant===SLUG)omloop=j}}catch(err){}}
function inzichten(){
 const z=omloop;if(!z)return '<article class="card wide"><h3>Advertentie-omloop</h3><p>Nog te weinig gegevens; we vullen geen verkoopsnelheid in.</p></article>';
 const lijst=L=>L.length?'<ul>'+L.map(x=>`<li>${e(x.mk+' '+x.md)} · ${e(x.generatie)} · ${e(x.bouwjaarband)} · ${x.mediaan_dagen} dagen · ${x.n} advertenties · ${e(x.betrouwbaarheid)}</li>`).join('')+'</ul>':'<p>Nog te weinig gegevens</p>';
 const adv=(z.voorraadadvies||[]).map(x=>`<p><b>${e(x.titel)}</b>: ${x.dagen} dagen online, normaal ongeveer ${x.normaal} dagen (${x.n} advertenties). Richtprijs ${euro(x.richtprijs)} (${x.n_referenties} prijsvergelijkingen). ${e(x.advies)}</p>`).join('');
 return `<article class="card wide" id="omloop-inzichten"><h3>Hoe snel verdwijnt aanbod?</h3><p>Advertentie-omloop op basis van ${z.historiedagen} dagen eigen waarneming. Offline betekent niet automatisch verkocht.</p><h4>Snelst verdwijnende modellen</h4>${lijst(z.snelst||[])}<h4>Modellen die lang blijven staan</h4>${lijst(z.langzaamst||[])}<h4>Wat doet een prijsverlaging?</h4><p>${e(z.prijsverlaging.tekst)}</p><small>${e(z.prijsverlaging.beperking)}</small><h4>Herplaatsingen</h4><p>${(z.herplaatsingen||[]).length?e(z.herplaatsingen.length+' herplaatsingen herkend; niet als verkocht geteld. Mogelijk onderhandelruimte.'):'Nog geen betrouwbaar herkende herplaatsingen.'}</p><h4>Verkopers/dealers</h4>${lijst((z.dealers||[]).filter(x=>x.mediaan_dagen!=null).map(x=>Object.assign({},x,{mk:x.naam,md:'',generatie:'',bouwjaarband:''}))) }<h4>Eigen voorraad</h4>${adv||'<p>Nog te weinig gegevens; daarom geen willekeurige prijsverlaging.</p>'}<details><summary>Zo meten we</summary><ul>${(z.uitleg||[]).map(t=>'<li>'+e(t)+'</li>').join('')}</ul></details></article>`;
}
function voorraadOmloop(){const old=document.getElementById('voorraad-omloop');if(old)old.remove();const c=document.getElementById('cards');if(c)c.insertAdjacentHTML('beforeend','<section class="card wide" id="voorraad-omloop"><h3>Vergeleken met de omloop van dit model</h3>'+((omloop&&omloop.voorraadadvies||[]).map(x=>`<p>${e(x.titel)}: ${x.dagen} dagen, normaal ${x.normaal} (${x.n} advertenties). Richtprijs ${euro(x.richtprijs)}. ${e(x.advies)}</p>`).join('')||'<p>Nog te weinig gegevens; geen automatische prijswijziging.</p>')+'</section>')}
function verklaren(){
 const L=(data&&data.eerst_verklaren)||[];if(!L.length)return '';
 return `<article class="card wide" id="kansen-verklaren"><h3>Eerst verklaren (geen zoek- of biedadvies)</h3><p>Deze modellen lijken op papier extreem gunstig. Dat is een signaal om te controleren, geen bewijs dat een prijs fout is: vaak zijn het te weinig advertenties, een andere uitvoering, netto- of maandprijs of onzekere BPM, soms een echte kans. Verschil in vraagprijzen is geen verkoopmarge. Ze komen pas in de lijst als dit verklaard is.</p>`+
  L.map(x=>`<details><summary>${e(x.model)} ${e(x.uitvoering)} ${e(x.bouwjaar_van)} · DE-mediaan ${euro(x.de_mediaan)} (${x.n.de} advertenties) · NL ${euro(x.nl_waarde)} (${x.n.nl} advertenties)</summary><ul>${((x.controle||{}).redenen||[]).map(r=>'<li>'+e(r)+'</li>').join('')}</ul>${(x.uitgesloten_de||[]).length?'<p>Niet meegeteld in de DE-mediaan (wel apart te bekijken): '+x.uitgesloten_de.map(u=>euro(u.prijs)+' ('+e(u.reden)+')').join('; ')+'</p>':''}<p>Wat te doen: open de DE-advertenties, controleer bruto prijs incl. btw, exacte uitvoering en CO2 (CoC). Pas daarna taxeren.</p></details>`).join('')+'</article>';
}
function tabs(){
 const t=document.getElementById('tabs');if(!t)return;
 if(!t.querySelector('[data-i="24"]'))t.insertAdjacentHTML('beforeend',`<button data-i="24" class="${seg===TAB?'on':''}">Kansen</button>`);
 const b=document.getElementById('instbtn');
 if(b&&!document.getElementById('kansenbtn')){const k=document.createElement('button');k.id='kansenbtn';k.textContent='Kansen';k.className='ghost';k.onclick=()=>{seg=TAB;render()};b.before(k)}
 if(seg===TAB){t.querySelectorAll('button[data-i]').forEach(b=>b.classList.toggle('on',+b.dataset.i===TAB));if(typeof tabZichtbaar==='function')tabZichtbaar()}
}
function toon(){
 const c=document.getElementById('cards');if(!c)return;
 document.getElementById('kpis').innerHTML='';
 if(!data){c.innerHTML=`<article class="card wide"><h2>Kansen voor mobile.de</h2><p>${e(fout||'Lijst wordt met jouw profiel doorgerekend…')}</p><button id="kansen-herlaad">Opnieuw laden</button></article>`;document.getElementById('kansen-herlaad').onclick=laad;return}
 const datum=new Date(data.bijgewerkt).toLocaleString('nl-NL',{timeZone:'Europe/Amsterdam'});
 c.innerHTML=`<article class="card wide"><h2>Kansen voor mobile.de</h2><p>Wekelijks maximaal 8 zoekopdrachten, automatisch op jouw profiel. ${e(data.week)} · ${e(datum)}.</p><p>${e(fout)}</p><p>Zoekfilters, geen koopadvies. Per advertentie worden BPM, uitvoering, kosten en marge opnieuw gecontroleerd.</p><h3>Wijzigingen ten opzichte van ${e(data.vorige_week||'de eerste meting')}</h3><ul>${(data.wijzigingen||[]).map(x=>`<li>${e(x.soort)}: ${e(x.model)}${x.van!=null?' · '+euro(x.van)+' → '+euro(x.naar):''}</li>`).join('')||'<li>Geen wijzigingen.</li>'}</ul>${(data.anomalieen||[]).map(x=>'<p role="status">Let op: '+e(x)+'</p>').join('')}</article>`+
 (data.items||[]).map((x,i)=>`<article class="card"><h3>${i+1}. ${e(x.model)}</h3><p>${e(x.generatie)} · ${e(x.uitvoering)} · ${e(x.brandstof)} · ${e(x.bouwjaar_van)}–${e(x.bouwjaar_tot)}</p><p><b>Max. vraagprijs DE ${euro(x.max_vraagprijs_de)}</b> · max. ${x.max_km.toLocaleString('nl-NL')} km</p><p>Marge bij DE-mediaan (${euro(x.de_mediaan)}): ${euro(x.verwachte_marge)} · bij de max. vraagprijs: ${euro(x.marge_bij_plafond)} (jouw minimum ${euro(x.minimum_marge)})</p><p>Advertenties DE/NL: ${x.n.de} / ${x.n.nl} · zekerheid ${e(x.betrouwbaarheid)} · BPM ${e(x.bpm_zekerheid)}</p><p>${e(x.reden)}</p><p>Advertentie-omloop: ${e((x.verkoopsnelheid||{}).tekst||"nog niet gemeten: te weinig advertenties die aantoonbaar offline gingen (offline is niet hetzelfde als verkocht)")}</p><details><summary>Berekening en instellingen</summary><p>NL ${euro(x.nl_waarde)} − vraagprijs ${euro(x.max_vraagprijs_de)} − BPM ${euro(x.berekening.bpm)} − transport ${euro(x.berekening.transport)} − RDW ${euro(x.berekening.rdw)} − kosten ${euro(x.berekening.kosten)} − stakosten ${euro(x.berekening.stakosten)} − opknap ${euro(x.berekening.opknap)} − btw-effect ${euro(x.berekening.btw)} = ${euro(x.marge_bij_plafond)}</p><p>Statijd ${x.berekening.statijd} dagen: ${e(x.berekening.statijd_bron)}. Verkoper ${e(x.verkoper)}; btw/marge ${e(x.btw_regeling)}.</p>${x.berekening.kosten_regelversie?`<p>Rekenregels ${e(x.berekening.kosten_regelversie)} · fiscale status ${e(({onbekend:"btw-status onbekend: laagste uitkomst van margeregeling en btw-auto gerekend",margeregeling:"margeregeling",btw:"btw-auto",nieuw_vervoermiddel:"nieuw vervoermiddel (btw in NL)"})[x.berekening.regime]||x.berekening.regime)} · ${e(x.berekening.kosten_status)}</p>${(x.berekening.waarschuwingen||[]).length?"<ul>"+x.berekening.waarschuwingen.map(w=>"<li>"+e(w)+"</li>").join("")+"</ul>":""}<p><small>Max. vraagprijs is een zoekfilter, geen bod: vóór kopen btw-status (factuur/verkoper), eerste toelating en CO2 (CoC) bevestigen.</small></p>`:""}</details><details open><summary>Zo instellen op mobile.de</summary><p>${e(x.instructie)}</p><button data-kopie="${i}">Instructie kopiëren</button> <a class="btn" href="${e(x.zoeklink)}" target="_blank" rel="noopener">Zoeklink openen</a><small>Controleer merk/model en uitvoering na openen; mobile.de kan URL-filters wijzigen. E-mailmelding zelf op direct zetten.</small></details></article>`).join('')+`<article class="card wide"><details><summary>Meetmethode en beperkingen</summary><ul>${(data.beperkingen||[]).map(x=>'<li>'+e(x)+'</li>').join('')}</ul><p>Gegevens van ${e(data.bronnen.scan_meetdatum)} · mobile.de: ${data.bronnen.mobilede_uniek} unieke auto's.</p></details></article>`;
 c.insertAdjacentHTML('beforeend',verklaren());
 c.insertAdjacentHTML('beforeend',inzichten());
 c.querySelectorAll('[data-kopie]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(data.items[+b.dataset.kopie].instructie);b.textContent='Gekopieerd'}catch(err){b.textContent='Selecteer de instructie hierboven om te kopiëren'}});
}
/* TEKSTEN_START */
function titelSchoon(s){
 s=String(s||"").replace(/\s+/g," ").trim();
 if(!s)return "";
 s=s.replace(/\(\s*€[^)]*\)/g,"").replace(/[,(]?\s*€\s*[\d.\s]+.*$/u,"").replace(/\bbtw[\s-]*auto\b/ig,"").replace(/\s+/g," ").trim();
 s=(s.split(/\s*[|]\s*|\s+-\s+/)[0]||s);
 s=s.split(/\s+/).map(t=>t.includes("/")?t.split("/")[0]:t).join(" ");
 const RUIS=/^(hele|lift|fullcarbon|full|carbon|maluspayer|malus|jbl|led-lenkrad|lenkrad|kamera|camera|pano|hud|keyless)$/i;
 const out=[];
 for(const x of s.split(/\s+/).filter(Boolean)){
  const z=x.replace(/[,.:;]+$/g,"");
  if(!z||RUIS.test(z))continue;
  if(out.length&&out[out.length-1].toLowerCase()===z.toLowerCase())continue;
  out.push(z);
 }
 return out.join(" ").trim();
}
function datumKort(s){
 if(!s)return "";
 s=String(s).trim();
 let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(m)return String(+m[3])+"-"+m[2];
 m=s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
 if(m)return String(+m[1])+"-"+String(+m[2]).padStart(2,"0");
 const t=new Date(s);
 if(!isNaN(t))return t.getDate()+"-"+String(t.getMonth()+1).padStart(2,"0");
 return "";
}
function versheidBlok(d){
 const R=(d.autos||[]).filter(a=>a.url!==d.deal_url&&a.vers),hw=d.herwaardering;if(!R.length&&!hw)return "";
 const nAct=R.filter(a=>a.vers.status==="actief").length,N=R.length;
 const prijzen=R.map(a=>+a.prijs).filter(x=>x>0);
 const ev=x=>"€"+Math.round(+x||0).toLocaleString("nl-NL");
 const range=prijzen.length?(Math.min(...prijzen)===Math.max(...prijzen)?" ("+ev(prijzen[0])+")":" ("+ev(Math.min(...prijzen))+" – "+ev(Math.max(...prijzen))+")"):"";
 const regel="Vergeleken met "+N+" "+(N===1?"auto":"auto's")+range+", "+nAct+" nog te koop";
 const badge=nAct<5?'<span class="chip weinig">Weinig vergelijkers</span>':"";
 const ST={actief:"te koop",historisch:"niet meer online",onzeker:"niet recent gezien"};
 const land=a=>{const l=String(a.land||"").toUpperCase();if(!/^[A-Z]{2}$/.test(l))return "";const v=(typeof vlag==="function"?vlag(l)+" ":"");const naam=(typeof LFN!=="undefined"&&LFN[l])?LFN[l]:l;return v+naam};
 const kmj=a=>[a.jaar?String(a.jaar).slice(0,4):"",a.km?Number(a.km).toLocaleString("nl-NL")+" km":""].filter(Boolean).join(" · ");
 const rij=a=>{const v=a.vers||{},titel=titelSchoon(a.titel)||String(a.titel||"Advertentie");
  const gezien=datumKort(v.laatst_gezien||v.laatst_gecontroleerd||v.eerst_gezien);
  const was=a.prijs_bij_kaart&&+a.prijs_bij_kaart!==+a.prijs?" (was "+ev(a.prijs_bij_kaart)+")":(v.prijs_vorige&&+v.prijs_vorige!==+a.prijs?" (was "+ev(v.prijs_vorige)+")":"");
  const link=a.url?'<a class="vgl-link" href="'+e(a.url)+'" target="_blank" rel="noopener" title="Open advertentie">↗</a>':"";
  const ld=land(a);
  return '<li><span class="vgl-t">'+e(titel)+" "+link+'</span><span class="vgl-m">'+ev(a.prijs)+was+(kmj(a)?" · "+e(kmj(a)):"")+(ld?" · "+e(ld):"")+" · "+(ST[v.status]||"niet recent gezien")+(gezien?" · gezien "+gezien:"")+"</span></li>";
 };
 const info='<details class="vgl-info"><summary aria-label="Uitleg bij de status">ⓘ</summary><p>Te koop: de advertentie is nu online, of we zagen hem de afgelopen 3 dagen. Niet meer online: de pagina is weg of als verlopen gemeld; dat betekent niet automatisch dat de auto is verkocht. Als een controle niet lukte, blijft de status onbekend.</p></details>';
 const warn=hw&&hw.waarschuwing?'<p class="meta tax">'+e(hw.waarschuwing)+"</p>":"";
 const meer=hw&&hw.mediaan_refs_kaart?'<details class="vgl-meer"><summary>Meer info</summary><p>Bij het maken van de kaart'+(hw.sinds?" ("+e(String(hw.sinds).replace("T"," "))+")":"")+" was de mediaan van de vergelijkers "+ev(hw.mediaan_refs_kaart)+(hw.mediaan_refs_nu?", nu "+ev(hw.mediaan_refs_nu):"")+". "+(hw.herrekend_op?"Verkoopwaarde en marge zijn toen opnieuw berekend.":"Geen wijziging die de marge raakt.")+"</p></details>":"";
 return '<div class="versheid-regel">'+regel+badge+info+'</div><details class="versheid"><summary>Bekijk vergelijkers</summary>'+warn+'<ul class="vgl-lijst">'+R.map(rij).join("")+"</ul>"+meer+"</details>";
}
window.titelSchoon=titelSchoon;window.datumKort=datumKort;window.versheidBlok=versheidBlok;
/* TEKSTEN_END */

function snelheidBlok(d){
 const z=d.verkoopsnelheid;if(!z)return '';
 const nv=d.n_vergelijk!=null?d.n_vergelijk:null,hd=omloop&&omloop.historiedagen,van=omloop&&omloop.waarneming_vanaf?new Date(omloop.waarneming_vanaf).toLocaleDateString('nl-NL'):null;
 const pk=x=>x?('€'+String(x).replace(/(\d+)000/g,'$1k').replace('-+','+').replace('-','–€')).replace('–€+','+'):'';const groep=[z.generatie&&!/onbekend/.test(z.generatie)?z.generatie:'',z.bouwjaarband?'bouwjaar '+z.bouwjaarband:'',pk(z.prijsklasse)].filter(Boolean).join(' · ');
 const los=`<p>Dit staat los van de waardering: die gebruikt ${nv!=null?nv+' vergelijkbare auto\'s':'de vergelijkbare auto\'s'} die nu bekend zijn. Dat een advertentie offline gaat, betekent niet automatisch dat de auto is verkocht.</p>`;
 const sig=(d.omloop_signalen||[]).map(x=>'<p>'+e(x)+'</p>').join('');
 if(z.mediaan_dagen!=null)return `<details class="omloop-regel"><summary>Stonden gemiddeld ca. ${z.mediaan_dagen} dagen te koop</summary><p>Vergelijkbare advertenties${groep?' ('+e(groep)+')':''} stonden typisch ${z.mediaan_dagen} dagen online tot ze bevestigd offline gingen, op basis van ${z.n} advertenties${hd?' over '+hd+' dagen':''}.</p>${los}${sig}</details>`;
 const gevolgd=z.n_gevolgd!=null?`We volgen ${z.n_gevolgd} vergelijkbare advertenties${groep?' ('+e(groep)+')':''}${van?' sinds '+van:''}; daarvan zijn er ${z.n_offline||0} bevestigd offline.`:'Van dit model is nog te weinig bekend over hoe snel het weggaat.';
 return `<details class="omloop-regel"><summary>Verkoopsnelheid nog niet bekend</summary><p>${gevolgd} Een tempo tonen we pas als we van minstens 8 advertenties weten dat ze offline zijn gegaan, én minstens 14 dagen hebben gevolgd${hd!=null?' (nu '+hd+' dagen)':''}. Tot die tijd doen we geen schatting.</p>${los}${sig}</details>`;
}

if(typeof kort==='function'){const oudKort=kort;kort=function(d){const h=oudKort(d),tekst=snelheidBlok(d)+versheidBlok(d);if(!tekst)return h;return h.includes('</article>')?h.replace(/<\/article>(?![\s\S]*<\/article>)/,tekst+'</article>'):h+tekst}}
if(typeof voorraad==='function'){const oudVoorraad=voorraad;voorraad=function(){oudVoorraad();voorraadOmloop()}}
const oud=render;render=function(){if(seg===TAB){seg=8;try{oud()}finally{seg=TAB}tabs();toon();if(!data&&!bezig)laad()}else{oud();tabs()}};
const vorigFetch=window.fetch.bind(window);window.fetch=async function(input,opt){const r=await vorigFetch(input,opt);const url=String(input&&input.url||input),m=String(opt&&opt.method||'GET').toUpperCase();if(r.ok&&m!=='GET'&&/\/api\/inst\/(instellingen|ongedaan)(?:\?|$)/.test(url)){data=null;setTimeout(laad,0)}return r};
if(typeof D!=='undefined'&&D)render();
omloopLaad().then(()=>{if(typeof seg!=='undefined'&&seg===12)voorraadOmloop()});
window.addEventListener('focus',()=>{if(seg===TAB)laad()});
})();
