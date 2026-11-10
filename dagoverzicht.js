/* Generieke dagtrechter. Alleen reeds beoordeelde kandidaten; geen nieuwe bronverzoeken. */
function dagMinimum(x,S){const M=S.marge;if(x.seg==='flips')return S.flips.marge;const merk=(x.merk||'').toLowerCase();let kl=['ferrari','lamborghini','mclaren','rolls-royce'].includes(merk.replace(/ /g,'-'))?'ferrari':({standaard:'normaal',sport:'sport',exotisch:'exotisch'}[x.klasse]||'normaal');const r=M.merken[merk]||M.brns[kl]||M.brns.normaal;let b=Math.max(r.abs,Math.round(x.prijs*r.pct/100));if(x.betrouw==='C')b*=M.factor_lagere_zekerheid;if(x.verkoper==='particulier')b*=M.factor_particulier;return Math.round(b/50)*50}
function dagRedenen(x,S){const r=[],p=S.profiel,st=S.strengheid,t=(x.titel||'').toLowerCase(),ml=(x.merk||'').toLowerCase();
 if(x.n!=null&&x.n<st.min_vergelijkbaar)r.push('vergelijkers');if(x.betrouw==='C'&&!st.lagere_zekerheid&&x.seg!=='flips')r.push('zekerheid');
 if(x.land&&S.landen[x.land]===false)r.push('land');if(x.bron&&S.bronnen[x.bron]===false)r.push('bron');if(S.ophalen_max&&(x.ophalen||0)>S.ophalen_max)r.push('ophalen');
 if(x.seg==='flips'){if(x.prijs>S.flips.prijs_max)r.push('prijs');if(x.land&&S.flips.landen.length&&!S.flips.landen.includes(x.land))r.push('regio');return r}
 if((p.merken_uit||[]).some(m=>m.toLowerCase()===ml)||(p.modellen_uit||[]).some(m=>m&&t.includes(m.toLowerCase())))r.push('model');
 if(!x.exclusief){if(p.bouwjaar_min&&x.jaar&&parseInt(x.jaar)<p.bouwjaar_min)r.push('jaar');if(p.km_max&&x.km&&x.km>p.km_max)r.push('km');if(x.prijs&&(x.prijs<p.prijs_min||x.prijs>p.prijs_max))r.push('prijs')}
 for(const k of ['brandstof','transmissie'])if(p[k]&&p[k].length&&x[k]&&!p[k].some(v=>v.toLowerCase()===x[k].toLowerCase()))r.push(k);return r}
function dagTel(payload,S){S=S||payload.instellingen;const r={gescand:payload.gescand,nieuw:payload.nieuw,goede_deals:0,bijna_deals:0,onzeker:0,prijsverlagingen:0};
 for(const x of payload.kandidaten){if(dagRedenen(x,S).length)continue;if(x.bpm_onzeker){r.onzeker++;continue}if(x.taxatie||x.marge==null)continue;
 const min=dagMinimum(x,S),korting=x.mediaan?(1-x.prijs/x.mediaan)*100:null,st=S.strengheid.pct_onder_mediaan;
 if(x.marge>=min&&(korting==null||korting>=st-.01)){r.goede_deals++;if(x.prijsdaling)r.prijsverlagingen++}else if(x.marge>=min*.8&&(korting==null||korting>=st*.8-.01)){r.bijna_deals++;if(x.prijsdaling)r.prijsverlagingen++}}return r}
if(typeof module!=='undefined')module.exports={dagTel,dagMinimum};
if(typeof document!=='undefined'){
 let dagData=null,dagInst=null,dagFout='',dagBezig=false;const n=v=>(+v||0).toLocaleString('nl-NL');
 function dagToon(){let el=document.getElementById('dagoverzicht');if(!el){const c=document.getElementById('cards');if(!c)return;el=document.createElement('section');el.id='dagoverzicht';el.className='card wide';el.style.margin='12px 0';c.before(el)}
 el.hidden=typeof seg!=='undefined'&&![0,1,20].includes(seg);if(el.hidden)return;
 if(!dagData){el.innerHTML='<div class="body"><b>Vandaag</b><p>Dagoverzicht '+(dagFout?'niet beschikbaar.':'laden…')+'</p></div>';return}
 const vandaag=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam'}).format(new Date());if(dagData.datum!==vandaag){el.innerHTML='<div class="body"><b>Vandaag</b><p>Nog geen afgeronde scan vandaag. Laatste meetdag: '+esc(dagData.datum)+'.</p></div>';return}
 const r=dagTel(dagData,dagInst),regel=`Van de ${n(r.gescand)} advertentiecontroles vandaag voldeden er ${n(r.goede_deals)} aan je huidige dealcriteria; ${n(r.bijna_deals)} bijna-deals, ${n(r.onzeker)} onzeker (BPM niet exact).`;
 el.innerHTML=`<div class="body"><h2 class="t">Vandaag · ${esc(dagData.datum)}</h2><div class="chips">${[[r.gescand,'Gescand (incl. cache)'],[r.nieuw,'Nieuwe advertenties'],[r.prijsverlagingen,'Prijsverlaging → deal/bijna'],[r.goede_deals,'Goede deals'],[r.bijna_deals,'Bijna-deals'],[r.onzeker,'Onzeker (BPM)']].map(([v,l])=>`<span class="chip"><b>${n(v)}</b> ${l}</span>`).join(' ')}</div><p>${esc(regel)}</p><div class="meta">Aantallen volgens ${dagInst?'je huidige opgeslagen instellingen':'de instellingen bij de laatste scan (log in voor de actuele instellingen)'}. ${n(dagData.vers)} vers opgehaald, ${n(dagData.cache)} uit cache; ${n(dagData.runs)} afgeronde runs. ${esc(dagData.toelichting)}${dagFout?' Actuele instellingen konden niet worden geladen.':''}</div></div>`}
 async function dagLaad(){if(dagBezig)return;dagBezig=true;try{const r=await fetch('dagoverzicht.json?'+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('dagoverzicht');dagData=await r.json();dagFout='';dagInst=null;
 const slug=(typeof KL!=='undefined'&&KL.slug)||'brns',token=localStorage['inst_token_'+slug];if(token){try{const api=(typeof KL!=='undefined'&&KL.instellingen_api)||'https://2-31-144-18.sslip.io/api/inst',a=await fetch(api+'/instellingen',{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!a.ok)throw Error('instellingen');dagInst=(await a.json()).instellingen}catch(e){dagFout='instellingen'}}
 }catch(e){dagFout='data'}finally{dagBezig=false;dagToon()}}
 const dagRender=render;render=function(){const r=dagRender.apply(this,arguments);dagToon();return r};
 // Bestaande Instellingen-API blijft de bron. Na opslaan/ongedaan maken tellen we direct opnieuw.
 const dagFetch=window.fetch.bind(window);window.fetch=async function(input,options){const r=await dagFetch(input,options);const url=String(input&&input.url||input),method=String(options&&options.method||'GET').toUpperCase();if(r.ok&&method!=='GET'&&/\/api\/inst\/(instellingen|ongedaan)(?:\?|$)/.test(url))setTimeout(dagLaad,0);return r};
 const dagTaxatie=taxatie;taxatie=function(d){const r=dagTaxatie(d);if(d.bpm_zekerheid==='onzeker'||(((((d.marge||{}).importkosten)||{}).bpm)||{}).zekerheid==='onzeker')r.push('BPM nog niet exact te berekenen');return [...new Set(r)]};
 const dagKort=kort;kort=function(d){let h=dagKort(d);if(d.label==='Prijsdaling'&&d.prijsverloop)h=h.replace(/(<h2 class="t">[\s\S]*?<\/h2>)/,`$1<div class="meta prijs-reden">${esc(d.prijsverloop.tekst)}</div>`);const bp=(((d.marge||{}).importkosten||{}).bpm)||{},txt=d.bpm_uitleg||bp.uitleg_onzeker;if(txt)h=h.replace('<div class="marge">',`<div class="meta bpm-reden" role="note"><b>${esc(txt)}</b></div><div class="marge">`);return h};
 window.addEventListener('focus',dagLaad);if(typeof D!=='undefined'&&D)render();dagLaad();
}
