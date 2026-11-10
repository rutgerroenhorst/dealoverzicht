/* MDE_WACHTRIJ_V1: tab 'Wachtrij' — mobile.de-auto's uit de mail, eerst voorlopig doorgerekend; alleen interessante worden geopend. Leest alleen mobilede_wachtrij.json. */
(function(){
'use strict';
const TAB=25;let data=null,bezig=false,fout='';
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eu=n=>n==null?'onbekend':'€'+Math.round(n).toLocaleString('nl-NL');
const ST={wordt_opgehaald:['Wordt opgehaald','De mail ziet er interessant uit. Dealmaker leest de advertentie voor btw, verkoper en locatie.'],
 voorlopig:['Voorlopig interessant','Interessant op basis van de mail, maar nog niet volledig gecontroleerd. Nog geen bod.'],
 opgehaald:['Advertentie gelezen','De gegevens worden gecontroleerd en daarna volledig doorgerekend.'],
 verplaatst:['Doorgezet','Volledig doorgerekend en verplaatst naar de deals.'],
 afgewezen:['Afgewezen','Niet interessant genoeg; de reden staat erbij.']};
async function laad(){if(bezig)return;bezig=true;fout='';
 try{const r=await fetch('mobilede_wachtrij.json?'+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('Wachtrij tijdelijk niet beschikbaar.');data=await r.json()}
 catch(err){fout=err.message}finally{bezig=false;if(typeof seg!=='undefined'&&seg===TAB)toon()}}
function kaart(z){const s=ST[z.status]||[z.status,''];
 return `<article class="card"><div class="meta">mobile.de · uit je zoekmelding${z.zoekopdracht?' "'+e(z.zoekopdracht)+'"':''}${z.volgorde?' · plek '+z.volgorde+' in de rij':''}</div>
 <h3>${e(z.titel)}</h3><div class="meta">${e(z.jaar||'bouwjaar onbekend')}${z.km!=null?' · '+Number(z.km).toLocaleString('nl-NL')+' km':''}${z.pk?' · '+e(z.pk)+' pk':''}${z.brandstof?' · '+e(z.brandstof):''}</div>
 <div><b>Vraagprijs ${eu(z.prijs)}</b>${z.voorlopige_marge!=null?` · voorlopige marge <b>${eu(z.voorlopige_marge)}</b> (drempel ${eu(z.drempel)})`:''}</div>
 <div class="meta"><span class="chip">${e(s[0])}</span> ${e(z.uitleg||s[1])}</div>
 ${z.voorlopige_marge!=null?`<details><summary>Hoe is dit berekend?</summary><div>NL-waarde ${eu(z.nl_waarde)} (${e(z.n_nl)} vergelijkbare NL-advertenties)</div><div>BPM ${eu(z.bpm)} (${e(z.bpm_zekerheid||'?')})</div><div>Btw: ${e(z.btw_scenario||'onbekend')}</div><div class="meta">Voorzichtig gerekend: zolang btw-status en verkoper onbekend zijn, rekenen we het minst gunstige scenario. Ontbrekende gegevens tellen nooit als 0.</div></details>`:''}
 ${z.url?`<a class="btn" href="${e(z.url)}" target="_blank" rel="noopener">Advertentie</a>`:''}</article>`}
function toon(){const c=document.getElementById('cards');if(!c)return;const k=document.getElementById('kpis');if(k)k.innerHTML='';
 if(fout){c.innerHTML='<div class="empty">'+e(fout)+'</div>';return}
 if(!data){c.innerHTML='<div class="meta">Wachtrij laden…</div>';return}
 const L=data.items||[],T=data.telling||{},o=data.ophalen||{},n=s=>T[s]||0;
 const open=L.filter(z=>z.status!=='afgewezen'),af=L.filter(z=>z.status==='afgewezen');
 c.innerHTML=`<article class="card wide"><h3>Wachtrij mobile.de</h3><p>Hier komen alle auto's uit je mobile.de-meldingen binnen. Dealmaker rekent eerst met de gegevens uit de mail een voorzichtige, voorlopige marge uit. Alleen auto's die dan interessant zijn, worden daarna geopend om btw, verkoper en locatie te controleren. Pas met die gegevens komt er een bod en gaat de auto naar de deals.</p>
 <p><b>${n('wordt_opgehaald')+n('voorlopig')}</b> voorlopig interessant · <b>${n('opgehaald')}</b> gelezen · <b>${n('verplaatst')}</b> doorgezet · <b>${n('afgewezen')}</b> afgewezen</p>
 ${o.gestopt?'<p><b>Let op:</b> het automatisch openen van advertenties staat stil, omdat mobile.de de toegang weigerde. De voorlopig interessante auto\'s staan hieronder; bekijk ze zelf via de link in je mobile.de-melding.</p>':''}</article>`
 +(open.length?open.map(kaart).join(''):'<div class="empty">Op dit moment geen voorlopig interessante auto\'s.</div>')
 +(af.length?`<details class="card wide"><summary>Afgewezen (${af.length})</summary>${af.map(kaart).join('')}</details>`:'')
 +`<details class="card wide"><summary>Technische status</summary><div class="meta">Bijgewerkt ${e(String(data.bijgewerkt||'').replace('T',' '))}. Selectie: voorlopige marge ≥ ${Math.round((data.buffer||0)*100)}% van de dealdrempel. Ophalen: ${o.actief?'aan, max '+e(o.dagmax)+' per dag (vandaag '+e(o.vandaag)+')':'uit'}${o.gestopt?' · gestopt sinds '+e(String(o.stop_sinds||'').replace('T',' '))+': '+e(o.stop_reden):''}.</div></details>`}
function tabs(){const t=document.getElementById('tabs');if(!t)return;
 if(!t.querySelector('[data-i="25"]'))t.insertAdjacentHTML('beforeend',`<button data-i="25" class="${seg===TAB?'on':''}">Wachtrij</button>`);
 if(seg===TAB){t.querySelectorAll('button[data-i]').forEach(b=>b.classList.toggle('on',+b.dataset.i===TAB));if(typeof tabZichtbaar==='function')tabZichtbaar()}}
if(typeof render!=='function')return;
const oud=render;render=function(){if(seg===TAB){seg=8;try{oud()}finally{seg=TAB}tabs();toon();if(!data&&!bezig)laad()}else{oud();tabs()}};
if(typeof D!=='undefined'&&D)render();
window.addEventListener('focus',()=>{if(seg===TAB)laad()});
})();
