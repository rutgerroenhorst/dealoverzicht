// 05-11: echte inkoop/verkoop-paren invoeren of importeren (CSV/plakken) voor 'Leren van eigen verkopen'. Alleen ingelogd; niets wordt geschat.
// Kolommen (kop verplicht, ; of , of tab): kenteken;titel;merk;model;jaar;km;inkoop;inkoopdatum;verkoop;verkoopdatum;kosten
function parCsv(t){const r=(t||"").trim().split(/\r?\n/).filter(x=>x.trim());if(r.length<2)return [];const sep=r[0].includes("\t")?"\t":r[0].includes(";")?";":",";
 const kop=r[0].split(sep).map(k=>k.trim().toLowerCase().replace(/prijs$/,"").replace(/^verkocht.*/,"verkoop").replace(/^gekocht.*/,"inkoop"));
 return r.slice(1).map(l=>{const v=l.split(sep),o={};kop.forEach((k,i)=>{if(k&&v[i]!=null&&v[i].trim()!=="")o[k]=v[i].trim()});return o})}
function parOpen(){if(typeof upTok!=="function"||!upTok()){alert("Log eerst in bij Instellingen.");return}
 let d=document.getElementById("pardlg");if(!d){d=document.createElement("dialog");d.id="pardlg";document.body.appendChild(d)}
 d.innerHTML=`<form method="dialog" class="card" style="max-width:640px"><div class="body"><h3>Verkopen invoeren (leren)</h3>
 <div class="meta">Alleen echte, afgeronde verkopen: inkoopprijs én verkoopprijs. Vanaf 8 paren gaat het model ermee rekenen.</div>
 <fieldset><legend>Eén auto</legend><input id="par_k" placeholder="Kenteken"> <input id="par_t" placeholder="Omschrijving (bv. Audi TTS 2019)"><br>
 <input id="par_i" inputmode="decimal" placeholder="Inkoop €"> <input id="par_id" type="date" title="Inkoopdatum"> <input id="par_v" inputmode="decimal" placeholder="Verkoop €"> <input id="par_vd" type="date" title="Verkoopdatum"></fieldset>
 <fieldset><legend>Of meerdere tegelijk (CSV of uit Excel plakken)</legend><textarea id="par_csv" rows="5" style="width:100%" placeholder="kenteken;titel;inkoop;inkoopdatum;verkoop;verkoopdatum&#10;AB123C;Audi TTS 2019;30000;01-09-2026;34500;01-10-2026"></textarea><input type="file" id="par_f" accept=".csv,.txt,text/csv"></fieldset>
 <div id="par_uit" class="meta"></div><div><button class="btn" id="par_ok" type="button">Opslaan</button> <button class="btn ghost" value="x">Sluiten</button></div><div id="par_lijst"></div></div></form>`;
 d.showModal();parLijst()}
function parLijst(){upApi("/paren").then(r=>r.ok?r.json():{paren:[]}).then(j=>{const P=j.paren||[];const el=document.getElementById("par_lijst");if(!el)return;
 el.innerHTML=P.length?`<h4>Ingevoerd (${P.length})</h4><ul class="vl">`+P.slice(0,50).map(x=>`<li>${esc(x.kenteken||x.titel||x.url||"")} · inkoop ${eur(x.inkoop)} → verkoop ${eur(x.verkoop)}${x.verkoopdatum?" ("+esc(x.verkoopdatum)+")":""} <button type="button" class="btn sm ghost" data-pardel="${esc(x.id)}">verwijder</button></li>`).join("")+"</ul>":"<div class='meta'>Nog geen paren ingevoerd.</div>"}).catch(()=>{})}
function parStuur(rijen){const u=document.getElementById("par_uit");if(!rijen.length){u.textContent="Niets om op te slaan.";return}
 upApi("/paren/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rijen})}).then(r=>r.json()).then(j=>{
  if(j.fout){u.textContent=j.fout;return}
  u.innerHTML=`${j.opgeslagen} opgeslagen.`+(j.fouten&&j.fouten.length?" Niet opgeslagen: "+j.fouten.map(f=>"rij "+f.rij+": "+esc(f.fout)).join("; "):"")+(j.leren?` Nu ${j.leren.paren} paren${j.leren.actief?" (model actief)":" (nog "+j.leren.nog_nodig+" nodig)"}.`:"");
  if(j.leren&&typeof LRN!=="undefined")LRN=j.leren;parLijst()}).catch(()=>{u.textContent="Opslaan mislukt (offline of niet ingelogd)."})}
if(typeof document!=="undefined")document.addEventListener("click",e=>{if(e.target.closest("[data-paren]")){e.preventDefault();parOpen();return}
 const del=e.target.closest("[data-pardel]");if(del){upApi("/paren/"+encodeURIComponent(del.dataset.pardel),{method:"DELETE"}).then(r=>r.json()).then(j=>{if(j.leren&&typeof LRN!=="undefined")LRN=j.leren;parLijst()});return}
 if(e.target.id==="par_ok"){const g=id=>(document.getElementById(id)||{}).value||"";let R=parCsv(g("par_csv"));
  if(g("par_k")||g("par_t"))R.unshift({kenteken:g("par_k"),titel:g("par_t"),inkoop:g("par_i"),inkoopdatum:g("par_id"),verkoop:g("par_v"),verkoopdatum:g("par_vd")});parStuur(R)}});
if(typeof document!=="undefined")document.addEventListener("change",e=>{if(e.target.id!=="par_f"||!e.target.files[0])return;e.target.files[0].text().then(t=>{document.getElementById("par_csv").value=t})});
if(typeof module!=="undefined")module.exports={parCsv};
