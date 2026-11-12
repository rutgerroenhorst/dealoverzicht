/* MDE_WACHTRIJ_V1 + WACHTRIJ_V2 (12-11-2026): tab 'Wachtrij' — mobile.de-auto's uit de zoekmeldingsmails, voorlopig doorgerekend.
   mobile.de blijft geparkeerd: deze tab leest alleen mobilede_wachtrij.json, de server haalt niets op bij mobile.de.
   Per auto: "Open op mobile.de" (alleen een schone advertentielink uit de mail; anders "link niet in mail"), en Interessant /
   Niet interessant / Gekocht. De status gaat via de bestaande pipeline-opslag (pset, Mijn pipeline). Niet interessant verdwijnt,
   Gekocht staat in Mijn pipeline (status Gekocht). Sortering: voorlopige marge hoog→laag, buitenland eerst (volgorde.js; land onbekend
   telt niet als buitenland). Ouder dan 7 dagen zonder actie → Archief (niet gewist). */
(function(){
'use strict';
const TAB=25,DAG=864e5;
if(typeof document!=='undefined'&&!document.getElementById('wq-css'))document.head.insertAdjacentHTML('beforeend','<style id="wq-css">article.wq,#cards>article.card.wide{padding:12px 14px}article.wq h3.t{margin:0 0 4px;font-size:1.05rem}article.wq .wq-k{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 4px}article.wq details{margin-top:4px}</style>');let data=null,bezig=false,fout='';
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eu=n=>n==null?'onbekend':'€'+Math.round(n).toLocaleString('nl-NL');
const SCHOON=/^https:\/\/suchen\.mobile\.de\/fahrzeuge\/details\.html\?(?:.*&)?id=(\d{6,18})(?:&|$)/;
const link=z=>{const m=SCHOON.exec(String(z.url||''));return m?'https://suchen.mobile.de/fahrzeuge/details.html?id='+m[1]:null};
const sleutel=z=>link(z)||('mde:'+z.sleutel);
const pg=z=>(typeof pget==='function'?pget(sleutel(z)):{})||{};
const actie=z=>pg(z).wachtrij||'';
const datum=z=>{const t=Date.parse(z.binnen||z.laatst_gezien||'');return isNaN(t)?null:t};
const oud=z=>{const t=datum(z);return t!=null&&Date.now()-t>7*DAG};
const ST={wordt_opgehaald:'Wordt opgehaald',voorlopig:'Voorlopig interessant',opgehaald:'Advertentie gelezen',verplaatst:'Doorgezet',afgewezen:'Afgewezen'};
async function laad(){if(bezig)return;bezig=true;fout='';
 try{const r=await fetch('mobilede_wachtrij.json?'+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('Wachtrij tijdelijk niet beschikbaar.');data=await r.json()}
 catch(err){fout=err.message}finally{bezig=false;if(typeof seg!=='undefined'&&seg===TAB)toon()}}
function zet(z,soort){if(typeof pset!=='function')return;const k=sleutel(z);
 pset(k,'status',soort==='gekocht'?'Gekocht':soort==='niet'?'Afgewezen':'Bekeken');pset(k,'wachtrij',soort);
 pset(k,'titel',z.titel||'');pset(k,'prijs',z.prijs);pset(k,'bron','mobile.de (wachtrij)');pset(k,'jaar',z.jaar||'');pset(k,'km',z.km);
 if(link(z))pset(k,'url',link(z));if(typeof toast==='function')toast(soort==='gekocht'?'Gekocht: staat nu in Mijn pipeline':soort==='niet'?'Niet interessant: uit de lijst':'Gemarkeerd als interessant');toon()}
function kaart(z,metKnoppen){const l=link(z),a=actie(z),ka=z.km!=null?Number(z.km).toLocaleString('nl-NL')+' km':'km onbekend',m=z.voorlopige_marge;
 const lc=typeof landCode==='function'?landCode({land:z.land}):'onbekend';
 return `<article class="card wq" data-wq="${e(z.sleutel)}"><h3 class="t">${e(z.titel)}</h3>
 <div class="meta">${e(z.jaar||'bouwjaar ?')} · ${ka} · <b>${eu(z.prijs)}</b> · voorlopige marge <b class="${m>0?'pos':'neg'}">${m==null?'onbekend':eu(m)}</b>${a==='interessant'?' · <span class="chip">Interessant</span>':''} <span class="chip">${lc==='onbekend'?'Land onbekend':e(lc)}</span></div>
 ${metKnoppen?`<div class="kc-a wq-k">${l?`<a class="btn sm" href="${e(l)}" target="_blank" rel="noopener">Open op mobile.de</a>`:'<span class="meta">link niet in mail</span>'}
 <button class="btn sm sec" data-wqa="interessant">Interessant</button><button class="btn sm sec" data-wqa="niet">Niet interessant</button><button class="btn sm sec" data-wqa="gekocht">Gekocht</button></div>`:''}
 <details><summary>Hoe is dit berekend?</summary><div class="meta">${e(ST[z.status]||z.status)}: ${e(z.uitleg||'')}</div>
 ${m!=null?`<div>NL-waarde ${eu(z.nl_waarde)} (${e(z.n_nl)} vergelijkbare NL-advertenties) · BPM ${eu(z.bpm)} (${e(z.bpm_zekerheid||'?')}) · btw: ${e(z.btw_scenario||'onbekend')} · drempel ${eu(z.drempel)}</div>`:''}
 <div class="meta">Uit je zoekmelding${z.zoekopdracht?' "'+e(z.zoekopdracht)+'"':''}${z.binnen?' · binnen '+e(String(z.binnen).slice(0,10)):''}. Voorzichtig gerekend: btw-status en verkoper onbekend = minst gunstige scenario; ontbrekende gegevens tellen nooit als 0.</div></details></article>`}
function lijsten(){const L=(data&&data.items)||[];
 const zicht=L.filter(z=>z.status!=='afgewezen'&&!['niet','gekocht'].includes(actie(z)));
 const actief=zicht.filter(z=>actie(z)||!oud(z)),archief=zicht.filter(z=>!actie(z)&&oud(z));
 let A=actief.slice().sort((a,b)=>(b.voorlopige_marge??-1e12)-(a.voorlopige_marge??-1e12));
 if(typeof blSort==='function'&&(typeof buitenlandEerstAan!=='function'||buitenlandEerstAan()))A=blSort(A,z=>({land:z.land}));
 return {A,archief,af:L.filter(z=>z.status==='afgewezen'),gekocht:L.filter(z=>actie(z)==='gekocht'),niet:L.filter(z=>actie(z)==='niet')}}
function toon(){const c=document.getElementById('cards');if(!c)return;const k=document.getElementById('kpis');if(k)k.innerHTML='';
 if(fout){c.innerHTML='<div class="empty">'+e(fout)+'</div>';return}
 if(!data){c.innerHTML='<div class="meta">Wachtrij laden…</div>';return}
 const W=lijsten();
 c.innerHTML=`<article class="card wide"><h3>Wachtrij mobile.de</h3><div class="meta">Auto's uit je mobile.de-meldingen, voorlopig doorgerekend met de maildata. Nog niet volledig berekend: open de advertentie om te beoordelen. ${W.A.length} open${W.gekocht.length?` · ${W.gekocht.length} gekocht (Mijn pipeline)`:''}${W.niet.length?` · ${W.niet.length} niet interessant`:''}.</div></article>`
 +(W.A.length?W.A.map(z=>kaart(z,true)).join(''):'<div class="empty">Op dit moment geen voorlopig interessante auto\'s.</div>')
 +(W.archief.length?`<details class="card wide"><summary>Archief: ouder dan 7 dagen zonder actie (${W.archief.length})</summary>${W.archief.map(z=>kaart(z,true)).join('')}</details>`:'')
 +(W.af.length?`<details class="card wide"><summary>Afgewezen op basis van de mail (${W.af.length})</summary>${W.af.map(z=>kaart(z,false)).join('')}</details>`:'')
 +`<details class="card wide"><summary>Technische status</summary><div class="meta">Bijgewerkt ${e(String(data.bijgewerkt||'').replace('T',' '))}. mobile.de is geparkeerd: de server opent geen advertenties. Selectie: voorlopige marge ≥ ${Math.round((data.buffer||0)*100)}% van de dealdrempel.</div></details>`}
document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('[data-wqa]');if(!b||typeof seg==='undefined'||seg!==TAB||!data)return;
 const s=b.closest('[data-wq]').dataset.wq,z=(data.items||[]).find(x=>String(x.sleutel)===s);if(z){ev.preventDefault();zet(z,b.dataset.wqa)}});
function tabs(){const t=document.getElementById('tabs');if(!t)return;
 if(!t.querySelector('[data-i="25"]'))t.insertAdjacentHTML('beforeend',`<button data-i="25" class="${seg===TAB?'on':''}">Wachtrij</button>`);
 if(seg===TAB){t.querySelectorAll('button[data-i]').forEach(b=>b.classList.toggle('on',+b.dataset.i===TAB));if(typeof tabZichtbaar==='function')tabZichtbaar()}}
// Gekocht/Interessant uit de Wachtrij ook zichtbaar in Mijn pipeline (die toont anders alleen auto's uit de deals)
if(typeof pipeline==='function'){const _p=pipeline;window.pipeline=pipeline=function(){_p.apply(this,arguments);try{
 const R=Object.entries(typeof PIPE!=='undefined'?PIPE:{}).filter(([u,p])=>p.bron==='mobile.de (wachtrij)'&&p.wachtrij!=='niet');
 const c=document.getElementById('cards');if(!R.length||!c)return;
 c.insertAdjacentHTML('beforeend',`<article class="card wide wq-pipe"><h3>Uit de Wachtrij (mobile.de)</h3><ul class="vl">${R.map(([u,p])=>`<li><b>${e(p.titel)}</b> · ${e(p.jaar)} · ${eu(p.prijs)} · <span class="chip">${e(p.status)}</span> ${p.url?`<a href="${e(p.url)}" target="_blank" rel="noopener">Open op mobile.de</a>`:'<span class="meta">link niet in mail</span>'}</li>`).join('')}</ul></article>`)}catch(err){}}}
if(typeof render!=='function')return;
const oudR=render;render=function(){if(seg===TAB){seg=8;try{oudR()}finally{seg=TAB}tabs();toon();if(!data&&!bezig)laad()}else{oudR();tabs()}};
if(typeof D!=='undefined'&&D)render();
window.addEventListener('focus',()=>{if(seg===TAB)laad()});
})();
