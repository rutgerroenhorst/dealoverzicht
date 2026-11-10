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
  const token=localStorage['inst_token_'+SLUG];
  const r=await fetch(token?API+'/kansen':'mobilede_kansen.json?'+Date.now(),{headers:token?{Authorization:'Bearer '+token}:{},cache:'no-store'});
  if(!r.ok)throw new Error('Kansenlijst tijdelijk niet beschikbaar.');
  const j=await r.json();if(j.klant!==SLUG)throw new Error('Klantcontrole mislukt.');data=j;
  if(j.omloop_inzichten)omloop=j.omloop_inzichten;else await omloopLaad();
 }catch(err){fout=err.message}finally{bezig=false;if(typeof seg!=='undefined'&&seg===TAB)toon()}
}
async function omloopLaad(){try{const r=await fetch('verkoopsnelheid.json?'+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();if(j.klant===SLUG)omloop=j}}catch(err){}}
function inzichten(){
 const z=omloop;if(!z)return '<article class="card wide"><h3>Advertentie-omloop</h3><p>nog te weinig data (n=0). Er worden geen verkoopsnelheden verzonnen.</p></article>';
 const lijst=L=>L.length?'<ul>'+L.map(x=>`<li>${e(x.mk+' '+x.md)} · ${e(x.generatie)} · ${e(x.bouwjaarband)} · ${x.mediaan_dagen} dagen · n=${x.n} · ${e(x.betrouwbaarheid)}</li>`).join('')+'</ul>':'<p>nog te weinig data (n=0)</p>';
 const adv=(z.voorraadadvies||[]).map(x=>`<p><b>${e(x.titel)}</b>: ${x.dagen} dagen online, normaal ongeveer ${x.normaal} dagen (n=${x.n}). Richtprijs ${euro(x.richtprijs)} (${x.n_referenties} prijsreferenties). ${e(x.advies)}</p>`).join('');
 return `<article class="card wide" id="omloop-inzichten"><h3>Hoe snel verdwijnt aanbod?</h3><p>Advertentie-omloop op basis van ${z.historiedagen} dagen eigen waarneming. Offline betekent niet automatisch verkocht.</p><h4>Snelst verdwijnende modellen</h4>${lijst(z.snelst||[])}<h4>Modellen die lang blijven staan</h4>${lijst(z.langzaamst||[])}<h4>Wat doet een prijsverlaging?</h4><p>${e(z.prijsverlaging.tekst)}</p><small>${e(z.prijsverlaging.beperking)}</small><h4>Herplaatsingen</h4><p>${(z.herplaatsingen||[]).length?e(z.herplaatsingen.length+' herplaatsingen herkend; niet als verkocht geteld. Mogelijk onderhandelruimte.'):'Nog geen betrouwbaar herkende herplaatsingen.'}</p><h4>Verkopers/dealers</h4>${lijst((z.dealers||[]).filter(x=>x.mediaan_dagen!=null).map(x=>Object.assign({},x,{mk:x.naam,md:'',generatie:'',bouwjaarband:''}))) }<h4>Eigen voorraad</h4>${adv||'<p>nog te weinig data (n=0); daarom geen willekeurige prijsverlaging.</p>'}<details><summary>Zo meten we</summary><ul>${(z.uitleg||[]).map(t=>'<li>'+e(t)+'</li>').join('')}</ul></details></article>`;
}
function voorraadOmloop(){const old=document.getElementById('voorraad-omloop');if(old)old.remove();const c=document.getElementById('cards');if(c)c.insertAdjacentHTML('beforeend','<section class="card wide" id="voorraad-omloop"><h3>Vergeleken met de omloop van dit model</h3>'+((omloop&&omloop.voorraadadvies||[]).map(x=>`<p>${e(x.titel)}: ${x.dagen} dagen, normaal ${x.normaal} (n=${x.n}). Richtprijs ${euro(x.richtprijs)}. ${e(x.advies)}</p>`).join('')||'<p>nog te weinig data (n=0); geen automatische prijswijziging.</p>')+'</section>')}
function verklaren(){
 const L=(data&&data.eerst_verklaren)||[];if(!L.length)return '';
 return `<article class="card wide" id="kansen-verklaren"><h3>Eerst verklaren (geen zoek- of biedadvies)</h3><p>Deze modellen lijken op papier extreem gunstig. Dat is een signaal om te controleren, geen bewijs dat een prijs fout is: vaak zijn het te weinig advertenties, een andere uitvoering, netto- of maandprijs of onzekere BPM, soms een echte kans. Verschil in vraagprijzen is geen verkoopmarge. Ze komen pas in de lijst als dit verklaard is.</p>`+
  L.map(x=>`<details><summary>${e(x.model)} ${e(x.uitvoering)} ${e(x.bouwjaar_van)} · DE-mediaan ${euro(x.de_mediaan)} (n=${x.n.de}) · NL ${euro(x.nl_waarde)} (n=${x.n.nl})</summary><ul>${((x.controle||{}).redenen||[]).map(r=>'<li>'+e(r)+'</li>').join('')}</ul>${(x.uitgesloten_de||[]).length?'<p>Niet meegeteld in de DE-mediaan (wel apart te bekijken): '+x.uitgesloten_de.map(u=>euro(u.prijs)+' ('+e(u.reden)+')').join('; ')+'</p>':''}<p>Wat te doen: open de DE-advertenties, controleer bruto prijs incl. btw, exacte uitvoering en CO2 (CoC). Pas daarna taxeren.</p></details>`).join('')+'</article>';
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
 c.innerHTML=`<article class="card wide"><h2>Kansen voor mobile.de</h2><p>Wekelijks maximaal 8 zoekopdrachten, automatisch op jouw profiel. ${e(data.week)} · ${e(datum)} (Europe/Amsterdam).</p><p>${e(fout)}</p><p>Zoekfilters, geen koopadvies. Per advertentie worden BPM, uitvoering, kosten en marge opnieuw gecontroleerd.</p><h3>Wijzigingen ten opzichte van ${e(data.vorige_week||'de eerste meting')}</h3><ul>${(data.wijzigingen||[]).map(x=>`<li>${e(x.soort)}: ${e(x.model)}${x.van!=null?' · '+euro(x.van)+' → '+euro(x.naar):''}</li>`).join('')||'<li>Geen wijzigingen.</li>'}</ul>${(data.anomalieen||[]).map(x=>'<p role="status">Let op: '+e(x)+'</p>').join('')}</article>`+
 (data.items||[]).map((x,i)=>`<article class="card"><h3>${i+1}. ${e(x.model)}</h3><p>${e(x.generatie)} · ${e(x.uitvoering)} · ${e(x.brandstof)} · ${e(x.bouwjaar_van)}–${e(x.bouwjaar_tot)}</p><p><b>Max. vraagprijs DE ${euro(x.max_vraagprijs_de)}</b> · max. ${x.max_km.toLocaleString('nl-NL')} km</p><p>Marge bij DE-mediaan (${euro(x.de_mediaan)}): ${euro(x.verwachte_marge)} · bij de max. vraagprijs: ${euro(x.marge_bij_plafond)} (jouw minimum ${euro(x.minimum_marge)})</p><p>n DE/NL ${x.n.de}/${x.n.nl} · betrouwbaarheid ${e(x.betrouwbaarheid)} · BPM ${e(x.bpm_zekerheid)}</p><p>${e(x.reden)}</p><p>Advertentie-omloop: ${e((x.verkoopsnelheid||{}).tekst||"nog niet gemeten: te weinig advertenties die aantoonbaar offline gingen (offline is niet hetzelfde als verkocht)")}</p><details><summary>Berekening en instellingen</summary><p>NL ${euro(x.nl_waarde)} − vraagprijs ${euro(x.max_vraagprijs_de)} − BPM ${euro(x.berekening.bpm)} − transport ${euro(x.berekening.transport)} − RDW ${euro(x.berekening.rdw)} − kosten ${euro(x.berekening.kosten)} − stakosten ${euro(x.berekening.stakosten)} − opknap ${euro(x.berekening.opknap)} − btw-effect ${euro(x.berekening.btw)} = ${euro(x.marge_bij_plafond)}</p><p>Statijd ${x.berekening.statijd} dagen: ${e(x.berekening.statijd_bron)}. Verkoper ${e(x.verkoper)}; btw/marge ${e(x.btw_regeling)}.</p>${x.berekening.kosten_regelversie?`<p>Rekenregels ${e(x.berekening.kosten_regelversie)} · fiscale status ${e(({onbekend:"btw-status onbekend: laagste uitkomst van margeregeling en btw-auto gerekend",margeregeling:"margeregeling",btw:"btw-auto",nieuw_vervoermiddel:"nieuw vervoermiddel (btw in NL)"})[x.berekening.regime]||x.berekening.regime)} · ${e(x.berekening.kosten_status)}</p>${(x.berekening.waarschuwingen||[]).length?"<ul>"+x.berekening.waarschuwingen.map(w=>"<li>"+e(w)+"</li>").join("")+"</ul>":""}<p><small>Max. vraagprijs is een zoekfilter, geen bod: vóór kopen btw-status (factuur/verkoper), eerste toelating en CO2 (CoC) bevestigen.</small></p>`:""}</details><details open><summary>Zo instellen op mobile.de</summary><p>${e(x.instructie)}</p><button data-kopie="${i}">Instructie kopiëren</button> <a class="btn" href="${e(x.zoeklink)}" target="_blank" rel="noopener">Zoeklink openen</a><small>Controleer merk/model en uitvoering na openen; mobile.de kan URL-filters wijzigen. E-mailmelding zelf op direct zetten.</small></details></article>`).join('')+`<article class="card wide"><details><summary>Meetmethode en beperkingen</summary><ul>${(data.beperkingen||[]).map(x=>'<li>'+e(x)+'</li>').join('')}</ul><p>Scan: ${e(data.bronnen.scan_meetdatum)} · mobile.de: ${data.bronnen.mobilede_uniek} unieke auto's.</p></details></article>`;
 c.insertAdjacentHTML('beforeend',verklaren());
 c.insertAdjacentHTML('beforeend',inzichten());
 c.querySelectorAll('[data-kopie]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(data.items[+b.dataset.kopie].instructie);b.textContent='Gekopieerd'}catch(err){b.textContent='Selecteer de instructie hierboven om te kopiëren'}});
}
function snelheidBlok(d){
 // Verkoopsnelheid = EIGEN gemeten advertentie-omloop (online tot bevestigd offline). Niet hetzelfde als de
 // vergelijkauto's van de waardering (n_vergelijk) of RDW-overschrijvingen (courantheid).
 const z=d.verkoopsnelheid;if(!z)return '';
 const nv=d.n_vergelijk!=null?d.n_vergelijk:null,hd=omloop&&omloop.historiedagen,van=omloop&&omloop.waarneming_vanaf?new Date(omloop.waarneming_vanaf).toLocaleDateString('nl-NL'):null;
 const pk=x=>x?('€'+String(x).replace(/(\d+)000/g,'$1k').replace('-+','+').replace('-','–€')).replace('–€+','+'):'';const groep=[z.generatie&&!/onbekend/.test(z.generatie)?z.generatie:'',z.bouwjaarband?'bouwjaar '+z.bouwjaarband:'',pk(z.prijsklasse)].filter(Boolean).join(' · ');
 const los=`<p>Dit staat los van de waardering: die gebruikt ${nv!=null?nv+' actuele vergelijkauto\'s':'de vergelijkauto\'s'} (zie Vergelijking/taxatie). Offline gaan is geen bewezen verkoop.</p>`;
 const sig=(d.omloop_signalen||[]).map(x=>'<p>'+e(x)+'</p>').join('');
 if(z.mediaan_dagen!=null)return `<details class="omloop-regel"><summary>Verkoopsnelheid: ca. ${z.mediaan_dagen} dagen online (${e(z.betrouwbaarheid||'')}, n=${z.n})</summary><p>Vergelijkbare advertenties (${e(groep)}) stonden mediaan ${z.mediaan_dagen} dagen online tot ze bevestigd offline gingen. Gemeten over ${z.n} advertenties${hd?' en '+hd+' dagen eigen waarneming':''}.</p>${los}${sig}</details>`;
 const gevolgd=z.n_gevolgd!=null?`We volgen ${z.n_gevolgd} vergelijkbare advertenties${groep?' ('+e(groep)+')':''}${van?' sinds '+van:''}; daarvan ${z.n_offline||0} bevestigd offline.`:'Dit model/bouwjaar zit nog niet in de eigen omloopmeting.';
 return `<details class="omloop-regel"><summary>Verkoopsnelheid: nog niet gemeten</summary><p>${gevolgd} Een tempo tonen we pas vanaf 8 bevestigd offline gegane advertenties en 14 dagen historie${hd!=null?' (nu '+hd+' dagen)':''}. Tot die tijd geen gok.</p>${los}<p>Wat je nu kunt doen: beoordeel courantheid via de vergelijkauto's en (indien getoond) de RDW-overschrijvingen bij de taxatie.</p>${sig}</details>`;
}
function versheidBlok(d){
 // VERSHEID_V1: per vergelijker actief/historisch/onzeker, eerst/laatst gezien, laatste geldige controle, prijswijziging, herwaardering.
 const R=(d.autos||[]).filter(a=>a.url!==d.deal_url&&a.vers),hw=d.herwaardering;if(!R.length&&!hw)return '';
 const n=s=>R.filter(a=>a.vers.status===s).length,dg=s=>{if(!s)return 'onbekend';const t=new Date(s);return isNaN(t)?e(String(s)):t.toLocaleDateString('nl-NL')},eu=x=>'€'+Math.round(+x||0).toLocaleString('nl-NL');
 const ST={actief:'actief',historisch:'niet meer online (bewezen), telt niet mee',onzeker:'status onzeker (controle mislukt), telt mee tot er bewijs is'};
 const rij=a=>{const v=a.vers;return `<li>${e(String(a.titel||'').slice(0,50))} · ${eu(a.prijs)}${a.prijs_bij_kaart?` (was ${eu(a.prijs_bij_kaart)} bij de kaart)`:v.prijs_vorige?` (was ${eu(v.prijs_vorige)}, gewijzigd ${dg(v.prijs_sinds)})`:''} · ${ST[v.status]||e(v.status)} · eerst gezien ${dg(v.eerst_gezien)} · laatst in scan ${dg(v.laatst_gezien)}${v.laatst_gecontroleerd?' · gecontroleerd '+e(v.laatst_gecontroleerd):''}${v.laatste_poging?' · laatste poging '+e(String(v.laatste_poging).replace('T',' '))+': geen antwoord':''}</li>`};
 const her=hw&&hw.mediaan_refs_kaart?`<p>Bij het maken van de kaart (${e(hw.sinds||'')}) was de mediaan van de vergelijkers ${eu(hw.mediaan_refs_kaart)}${hw.mediaan_refs_nu?`, nu ${eu(hw.mediaan_refs_nu)}`:''}. ${hw.herrekend_op?`Verkoopwaarde en marge zijn daarop herrekend op ${e(hw.herrekend_op.replace('T',' '))}${hw.marge_kaart!=null?` (marge bij de kaart ${eu(hw.marge_kaart)})`:''}.`:'Geen wijziging die de marge raakt.'}</p>`:'';
 return `<details class="versheid"><summary>Actualiteit vergelijkers: ${n('actief')} actief${n('historisch')?` · ${n('historisch')} niet meer online`:''}${n('onzeker')?` · ${n('onzeker')} onzeker`:''}${hw&&hw.n_prijswijzigingen?` · ${hw.n_prijswijzigingen} prijswijziging(en)`:''}</summary>${hw&&hw.waarschuwing?`<p><b>${e(hw.waarschuwing)}</b></p>`:''}${her}<ul>${R.map(rij).join('')}</ul><p>Actief: nu online of de afgelopen 3 dagen in onze scan gezien, ook als de advertentie al lang staat. "Niet meer online" alleen met bewijs (pagina weg of als verlopen gemeld); dat is nog geen bewezen verkoop. Een mislukte of door het dagbudget overgeslagen controle is geen bewijs.</p></details>`}
if(typeof kort==='function'){const oudKort=kort;kort=function(d){const h=oudKort(d),tekst=snelheidBlok(d)+versheidBlok(d);if(!tekst)return h;return h.includes('</article>')?h.replace(/<\/article>(?![\s\S]*<\/article>)/,tekst+'</article>'):h+tekst}}
if(typeof voorraad==='function'){const oudVoorraad=voorraad;voorraad=function(){oudVoorraad();voorraadOmloop()}}
const oud=render;render=function(){if(seg===TAB){seg=8;try{oud()}finally{seg=TAB}tabs();toon();if(!data&&!bezig)laad()}else{oud();tabs()}};
const vorigFetch=window.fetch.bind(window);window.fetch=async function(input,opt){const r=await vorigFetch(input,opt);const url=String(input&&input.url||input),m=String(opt&&opt.method||'GET').toUpperCase();if(r.ok&&m!=='GET'&&/\/api\/inst\/(instellingen|ongedaan)(?:\?|$)/.test(url)){data=null;setTimeout(laad,0)}return r};
if(typeof D!=='undefined'&&D)render();
omloopLaad().then(()=>{if(typeof seg!=='undefined'&&seg===12)voorraadOmloop()});
window.addEventListener('focus',()=>{if(seg===TAB)laad()});
})();
