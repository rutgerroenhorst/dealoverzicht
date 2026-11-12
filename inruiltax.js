/* INRUILTAX_V1: compacte inruil-taxatie (iPhone) + Mijn taxaties via de live Instellingen-API.
   Normalisatie merk/model (Range Rover Sport), handmatig pad, Duitsland incl. BPM, chips, sticky Taxeer.
   Zachte prullenbak 30 dagen; per actie wie het deed. Ook op de medewerkerpagina Bedrijf. */
(function(){
"use strict";
const RDW_V="https://opendata.rdw.nl/resource/m9d7-ebf2.json";
const RDW_B="https://opendata.rdw.nl/resource/8ys7-d773.json";
const GH="https://rutgerroenhorst.github.io/dealoverzicht/";
const UITVO={
  "land-rover|range-rover-sport":["SE","HSE","HSE Dynamic","Dynamic SE","Dynamic HSE","Autobiography","Autobiography Dynamic","SVR","SVA","First Edition","P300","P360","P400","P400e","P460e","SDV6","SDV8","TDV6","TDV8","D200","D250","D300","D350","V8","PHEV"],
  "land-rover":["SE","HSE","HSE Dynamic","Dynamic SE","Dynamic HSE","Autobiography","S","First Edition","SVR","SVA","PHEV","D200","D250","D300","D350","P300","P400","P400e"]
};
const KEEP={bmw:1,amg:1,gte:1,gti:1,gtd:1,gts:1,rs:1,st:1,gt:1,se:1,hse:1,svr:1,sva:1,sdv6:1,sdv8:1,tdv6:1,tdv8:1,phev:1,tdi:1,tfsi:1,tsi:1,v8:1,v6:1,v12:1};
const MOOI_MERK={"land-rover":"Land Rover","mercedes-benz":"Mercedes-Benz",bmw:"BMW",mini:"MINI",volkswagen:"Volkswagen","rolls-royce":"Rolls-Royce","alfa-romeo":"Alfa Romeo",citroen:"Citroën"};
const VAST={"range-rover-sport":"Range Rover Sport","range-rover":"Range Rover","range-rover-velar":"Range Rover Velar","range-rover-evoque":"Range Rover Evoque","discovery-sport":"Discovery Sport"};
const SPECIAL={landrover:"land-rover","land-rover":"land-rover",mercedes:"mercedes-benz","mercedes-benz":"mercedes-benz",vw:"volkswagen"};
function fold(s){return String(s||"").replace(/[ëË]/g,"e").replace(/[üöäß]/g,c=>({ü:"u","ö":"o",ä:"a","ß":"ss"}[c]||c)).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
function tokens(s){return fold(s).replace(/_/g," ").split(/[\s\-/+,]+/).filter(Boolean);}
function normMerk(m){const hy=fold(m).trim().replace(/\s+/g,"-");return SPECIAL[hy]||SPECIAL[fold(m)]||hy;}
function mooiWoord(w){const k=fold(w);let m=k.match(/^p(\d{3})(e?)$/);if(m)return "P"+m[1]+(m[2]?"e":"");m=k.match(/^d(\d{3})$/);if(m)return "D"+m[1];if(KEEP[k]||k==="phev")return k.toUpperCase();return w?w[0].toUpperCase()+w.slice(1).toLowerCase():w;}
function mooiNaam(s,soort){if(!s)return "";const key=fold(s).replace(/\s+/g,"-");if(soort==="merk"&&(MOOI_MERK[key]||MOOI_MERK[normMerk(s)]))return MOOI_MERK[key]||MOOI_MERK[normMerk(s)];if(VAST[key])return VAST[key];return String(s).trim().split(/[\s\-]+/).filter(Boolean).map(mooiWoord).join(" ");}
function predModel(merk,hb){const mk=normMerk(merk),h=fold(hb).trim().replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");return h.startsWith(mk+"-")?h.slice(mk.length+1):h;}
function matchModel(merk,hb,keys){
  const mk=normMerk(merk),ht=tokens(hb);let best="",score=-1,pref=mk+"|";
  (keys||[]).forEach(k=>{if(!k.startsWith(pref))return;const md=k.slice(pref.length),mdt=tokens(md.replace(/-/g," "));if(mdt.length&&mdt.every(t=>ht.includes(t))){const sc=mdt.length*100+md.length;if(sc>score){best=md;score=sc;}}});
  if(!best){const pr=predModel(merk,hb);if(pr&&(keys||[]).indexOf(mk+"|"+pr)>=0)best=pr;}
  return best;
}
function trimIn(naam,tekst){return (" "+fold(tekst).replace(/-/g," ")+" ").indexOf(" "+fold(naam).replace(/-/g," ")+" ")>=0;}
function uitvoeringen(merk,model,titels,rdwHb){
  const mk=normMerk(merk),md=(model||"").trim(),key=mk+"|"+md,seen={},out=[];
  function add(n){n=String(n||"").replace(/\s+/g," ").trim();const k=fold(n);if(!n||seen[k]||k==="standaard"||k==="standard"||k==="kies")return;seen[k]=1;out.push(n);}
  (UITVO[key]||[]).forEach(add);(UITVO[mk]||[]).forEach(add);
  (titels||[]).forEach(t=>{const blob=String(t||"").replace(/[/\-_]/g," ");(UITVO[key]||[]).concat(UITVO[mk]||[]).forEach(n=>{if(trimIn(n,blob))add(n);});let m;const re=/\b(p\d{3}e?|d\d{3}|sdv[68]|tdv[68]|svr|sva|phev)\b/g,f=fold(blob);while((m=re.exec(f)))add(mooiWoord(m[1]));});
  if(rdwHb){const f=fold(rdwHb);let m,re=/\b(p\d{3}e?|d\d{3}|sdv[68]|tdv[68]|hse|svr|sva|phev)\b/g;while((m=re.exec(f)))add(mooiWoord(m[1]));}
  return out;
}
function kiesUitvoering(lijst,hb,titels){const tekst=[hb||""].concat(titels||[]).join(" ");if(!tekst.trim())return "";const s=lijst.slice().sort((a,b)=>b.length-a.length);for(const n of s)if(trimIn(n,tekst))return n;return "";}
function euro(n){if(n==null||n===""||isNaN(n))return "—";if(typeof eur==="function")try{return eur(n);}catch(e){}return "€\u00a0"+Math.round(n).toLocaleString("nl-NL");}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function asset(f){if(location.pathname.indexOf("/bedrijf")>=0||location.pathname.indexOf("/api/inst")>=0)return GH+f;return f;}
function apiRoot(){return (typeof TXAPI==="function"?TXAPI():((typeof KL!=="undefined"&&KL.instellingen_api)||"https://2-31-144-18.sslip.io/api/inst"));}
function wie(){if(window.TX_BEDRIJF_NAAM)return String(TX_BEDRIJF_NAAM).trim();try{const u=JSON.parse(localStorage["inst_gebruiker_"+((typeof TXSLUG==="function"?TXSLUG():"brns"))]||localStorage.inst_gebruiker||"null");if(u&&(u.naam||u.gebruiker))return u.naam||u.gebruiker;}catch(e){}return "via site";}
function isBedrijf(){return !!(window.TX_BEDRIJF_TOKEN||(location.pathname||"").indexOf("/bedrijf")>=0);}
window.mkmd=function(merk,hb){const keys=(window.MI&&MI.groepen)?Object.keys(MI.groepen):[];const mk=normMerk(merk);const md=matchModel(merk,hb,keys)||predModel(merk,hb)||"";return [mk,md];};
let TXL={taxaties:{},prullenbak:[],verwijderd:[],filter:"",prul:false};
let TXI=false;
function merken(){const mc={};if(!MI||!MI.groepen)return [];for(const k in MI.groepen){const m=k.split("|")[0];mc[m]=(mc[m]||0)+MI.groepen[k].length;}return Object.keys(mc).filter(m=>mc[m]>=20&&/^[a-zë-]+$/.test(m)).sort();}
function modellen(mk){if(!mk||!MI||!MI.groepen)return [];return Object.keys(MI.groepen).filter(k=>k.startsWith(mk+"|")).map(k=>k.split("|")[1]).sort();}
function adsTitels(mk,md){const G=(MI&&MI.groepen&&MI.groepen[mk+"|"+md])||[];return G.map(r=>r[5]||"").filter(Boolean).slice(0,80);}
function optiesLijst(){
  const mk=TX.merk||"";
  if(window.TXCAT&&Array.isArray(TXCAT.opties)&&TXCAT.opties.length)return TXCAT.opties.map(o=>({id:o.id||o.naam,naam:o.naam||o.id}));
  if(typeof txOptEntries==="function")return txOptEntries(mk).map(([k,l])=>({id:k,naam:l}));
  if(typeof OPTL==="object")return Object.keys(OPTL).map(k=>({id:k,naam:OPTL[k]}));
  return [];
}


function etxHtml(){
  const B=TX3&&TX3.herkomst;if(!B||B.soort!=="eerst_taxeren")return "";
  const ontbr=[!TX.kenteken?"kenteken (RDW-gegevens, eerste toelating)":"",B.land&&B.land!=="NL"?"officiële CO2 (CoC) voor de BPM":"","opties/uitvoering controleren","schade en onderhoud"].filter(Boolean);
  const prijs=(typeof eur==="function"&&B.prijs)?eur(+B.prijs):(B.prijs?("€ "+B.prijs):"");
  return `<div class="tk etx-bron"><b>Vooraf ingevuld uit Eerst taxeren</b><div class="meta">${esc(B.titel)}${B.prijs?" · vraagprijs "+prijs:""}${B.land?" · "+esc(B.land):""}. Overgenomen uit de advertentie: merk, model, bouwjaar${TX.km?", km":""}. Waarom eerst taxeren: ${esc(B.reden||"onbekend")}.</div><div class="meta">Nog nodig voor een betrouwbare taxatie: ${ontbr.map(esc).join(", ")}. Zonder vergelijkers geeft de taxatie geen waarde; we vullen niets aan.</div><button type="button" class="btn sm ghost" data-etxterug>Terug naar de lijst</button></div>`;
}
function html(){
  const mks=merken(),mds=modellen(TX.merk);
  const U=uitvoeringen(TX.merk,TX.model,adsTitels(TX.merk,TX.model),(TXR3&&TXR3.rdw&&TXR3.rdw.handelsbenaming)||"");
  const varVrij=TX.var&&!U.some(u=>fold(u)===fold(TX.var));
  if(varVrij&&TX.var)U.unshift(TX.var);
  const rdw=TXR3&&TXR3.rdw;
  const rdwTxt=rdw?`<div class="txin-rdw" id="txrdwblok"><strong>${esc(mooiNaam(rdw.merk||TX.merk,"merk"))} · ${esc(mooiNaam((TX.model||rdw.handelsbenaming||""),"model"))}</strong><span>${esc([rdw.uitvoering||TX.var,rdw.jaar||TX.jaar,rdw.brandstof||TX.brandstof].filter(Boolean).join(" · "))}${rdw.apk?" · APK "+esc(rdw.apk):""}${rdw.co2?" · CO₂ "+rdw.co2+" g/km":""}</span></div>`:`<div class="txin-rdw" id="txrdwblok" hidden></div>`;
  const optHtml=optiesLijst().map(o=>`<label class="txin-chip${TX3.opt&&TX3.opt[o.id]?" aan":""}"><input type="checkbox" data-txopt="${esc(o.id)}"${TX3.opt&&TX3.opt[o.id]?" checked":""}><span>${esc(o.naam)}</span></label>`).join("");
  const autos=(isBedrijf()?[]:((window.TXV&&TXV.autos)||[]));
  return `<div id="tx-inruil" class="txin">
    <h2>Inruil-taxatie</h2>${etxHtml()}
    <div id="txmijn" class="txin-lijst"></div>
    <div class="txin-zoek"><label class="breed">Kenteken of VIN<input id="txkent" data-tx="kenteken" value="${esc(TX.kenteken||TX.vin||"")}" placeholder="XX-123-Y of 17 tekens VIN" autocomplete="off"></label><button type="button" id="txophalen">Ophalen</button></div>
    ${rdwTxt}
    <div class="txin-grid">
      <label>Merk<select id="txmerk" data-tx="merk"><option value="">Kies</option>${mks.map(m=>`<option value="${esc(m)}"${m===TX.merk?" selected":""}>${esc(mooiNaam(m,"merk"))}</option>`).join("")}</select></label>
      <label>Model<select id="txmodel" data-tx="model"><option value="">Kies</option>${mds.map(m=>`<option value="${esc(m)}"${m===TX.model?" selected":""}>${esc(mooiNaam(m,"model"))}</option>`).join("")}</select></label>
      <label>Uitvoering<select id="txuit" data-tx="var"><option value="">Kies (optioneel)</option>${U.map(v=>`<option value="${esc(v)}"${fold(v)===fold(TX.var||"")?" selected":""}>${esc(v)}</option>`).join("")}<option value="__anders__">Anders…</option></select></label>
      <label id="txuitvrijlab"${varVrij?"":" hidden"}>Vrije uitvoering<input id="txuitvrij" value="${esc(varVrij?TX.var:"")}" placeholder="bijv. HSE Dynamic"></label>
      <label>Bouwjaar<input id="txjaar" data-tx="jaar" type="number" inputmode="numeric" value="${esc(TX.jaar||"")}" placeholder="2019"></label>
      <label>Brandstof<input id="txbrandstof" value="${esc(TX.brandstof||(rdw&&rdw.brandstof)||"")}" placeholder="Benzine, diesel, PHEV…"></label>
      <label>Km-stand<input id="txkm" data-tx="km" type="number" inputmode="numeric" value="${esc(TX.km||"")}" placeholder="166000"></label>
      <label>Versnellingsbak<select data-tx3="bak"><option value=""${!TX3.bak?" selected":""}>Onbekend</option><option value="aut"${TX3.bak==="aut"?" selected":""}>Automaat</option><option value="hand"${TX3.bak==="hand"?" selected":""}>Handgeschakeld</option></select></label>
      <label>Schade<select data-tx3="schade"><option value="geen"${TX3.schade==="geen"?" selected":""}>Geen</option><option value="licht"${TX3.schade==="licht"?" selected":""}>Licht (krassen, velgen)</option><option value="zwaar"${TX3.schade==="zwaar"?" selected":""}>Zwaar of schadehistorie</option></select></label>
      <label>Eigenaren<select data-tx3="eigenaren"><option value=""${!TX3.eigenaren?" selected":""}>Onbekend</option><option value="1"${TX3.eigenaren==="1"?" selected":""}>Eerste eigenaar</option><option value="meer"${TX3.eigenaren==="meer"?" selected":""}>Twee of meer</option></select></label>
      <label>Onderhoud<select data-tx3="onderhoud"><option value=""${!TX3.onderhoud?" selected":""}>Onbekend</option><option value="dealer"${TX3.onderhoud==="dealer"?" selected":""}>Volledig bij dealer</option><option value="deels"${TX3.onderhoud==="deels"?" selected":""}>Deels of vrije garage</option><option value="geen"${TX3.onderhoud==="geen"?" selected":""}>Geen of onbekend</option></select></label>
      <label>NAP<select data-tx3="nap"><option value=""${!TX3.nap?" selected":""}>Onbekend</option><option value="ja"${TX3.nap==="ja"?" selected":""}>Ja, logisch</option><option value="nee"${TX3.nap==="nee"?" selected":""}>Nee of onlogisch</option></select></label>
    </div>
    <div class="txin-opt"><div class="txin-opt-h">Opties <button type="button" class="txin-i" id="txi" aria-label="Toelichting bron">i</button></div>
      <div class="txin-i-tekst" id="txitekst"${TXI?"":" hidden"}>Deze opties komen uit een catalogus per model (onder meer elite-regels, advertenties en RDW). Ze zijn mogelijk bij dit model, niet automatisch aanwezig op deze auto. Aangevinkt = aanwezig op deze auto.</div>
      <div class="txin-chips" id="txopt">${optHtml||'<span class="txin-mute">Kies eerst een merk om opties te zien.</span>'}</div>
    </div>
    ${autos.length?`<details class="txin-mute"><summary>Voorraadauto die de klant koopt (optioneel)</summary><label>Voorraad<select data-tx3="ruilauto"><option value="">Geen, alleen inruil taxeren</option>${autos.map(a=>`<option value="${esc(a.url)}"${a.url===TX3.ruilauto?" selected":""}>${esc(a.titel)} · ${esc(String(a.jaar||""))}</option>`).join("")}</select></label></details>`:""}
    <div id="txUit" class="txin-uit"></div>
    <section class="txin-hand" id="txhand">
      <h3>Handmatig taxeren</h3>
      <p class="txin-mute">Altijd mogelijk: vul zelf de verkoopwaarde, de marge en het bod in. Daarna kun je opslaan en delen.</p>
      <div class="txin-grid">
        <label>Verkoopwaarde<input id="txhv" type="number" inputmode="numeric" value="" placeholder="45000"></label>
        <label>Marge (€)<input id="txhm" type="number" inputmode="numeric" value="" placeholder="4000"></label>
        <label class="breed">Veilig bod<input id="txhb" type="number" inputmode="numeric" value="" placeholder="41000"></label>
      </div>
      <div class="txin-acties"><button type="button" class="txin-btn sec" id="txhandtoepas">Toepassen</button><button type="button" class="txin-btn sec" id="txsave">Opslaan</button><button type="button" class="txin-btn sec" id="deelv">Delen</button></div>
    </section>
    <label class="breed">Notities<textarea data-tx3="notitie" placeholder="Optioneel">${esc(TX3.notitie||"")}</textarea></label>
    <div class="txin-sticky"><button type="button" id="txtaxeer">Taxeer</button></div>
  </div>`;
}
function syncVelden(){
  const g=id=>document.getElementById(id);
  if(g("txkent")){const raw=(g("txkent").value||"").toUpperCase().replace(/[\s-]/g,"");if(raw.length===17)TX.vin=raw;else TX.kenteken=g("txkent").value;}
  if(g("txmerk"))TX.merk=g("txmerk").value;
  if(g("txmodel"))TX.model=g("txmodel").value;
  if(g("txjaar"))TX.jaar=g("txjaar").value;
  if(g("txkm"))TX.km=g("txkm").value;
  if(g("txbrandstof"))TX.brandstof=g("txbrandstof").value;
  if(g("txuit")){let v=g("txuit").value;if(v==="__anders__")v=(g("txuitvrij")&&g("txuitvrij").value)||"";TX.var=v;}
  document.querySelectorAll("#tx-inruil [data-tx3]").forEach(el=>{if(el.type==="checkbox")return;TX3[el.dataset.tx3]=el.value;});
}

function toonUitkomst(){
  const box=document.getElementById("txUit");if(!box)return;
  const R=TXR3&&TXR3.r,fout=TXR3&&TXR3.fout,de=TXR3&&TXR3.de;
  let h="";
  if(fout&&!(R&&R.inruil))h+=`<div class="txin-kaart fout"><b>${esc(fout)}</b><div class="txin-meta">Je kunt hieronder handmatig taxeren, of vergelijken met Duitsland als er te weinig Nederlandse advertenties zijn.</div></div>`;
  if(R&&(R.verkoop||R.inruil||R.fout)){
    if(!(R.fout&&!R.inruil)){
      const n=R.n||(R.V&&R.V.n)||0;
      const landen=(R.landen||(R.V&&R.V.landen)||["NL"]);
      const landTxt=landen.length===1&&landen[0]==="NL"?"Nederland":landen.join(", ");
      const lbl=R.label_de?" · "+R.label_de:"";
      h+=`<div class="txin-kaart"><div class="txin-rijen">
        <div class="txin-rij"><span class="l">Verkoopwaarde</span><b>${euro(R.verkoop)}</b></div>
        <div class="txin-rij"><span class="l">Veilig bod</span><b>${euro(R.inruil)}</b></div>
        <div class="txin-rij"><span class="l">Marge</span><b>${euro(R.marge!=null?R.marge:(R.verkoop&&R.inruil?R.verkoop-R.inruil:null))}</b></div>
      </div><div class="txin-meta">${R.handmatig?"Handmatig getaxeerd":(n+" vergelijker"+(n===1?"":"s")+" ("+esc(landTxt)+")")}${lbl}${R.regelversie?" · regels "+esc(R.regelversie):""}</div></div>`;
    }
    const hv=document.getElementById("txhv"),hm=document.getElementById("txhm"),hb=document.getElementById("txhb");
    if(hv&&R.verkoop&&!hv.value)hv.value=R.verkoop;
    if(hm&&R.marge!=null&&!hm.value)hm.value=R.marge;
    if(hb&&R.inruil&&!hb.value)hb.value=R.inruil;
  }
  const weinig=(!R||!R.n||R.n<5||(TXR3&&TXR3.fout));
  if(weinig)h+=`<div class="txin-acties"><button type="button" class="txin-btn sec" id="txde">Vergelijk met Duitsland</button></div>`;
  if(de){
    if(de.fout)h+=`<div class="txin-kaart fout">${esc(de.fout)}</div>`;
    else{
      h+=`<div class="txin-kaart"><b>Duitsland</b><div class="txin-meta">${esc(de.label||"op basis van Duitsland incl. BPM")}${de.regelversie?" · "+esc(de.regelversie):""} · ${de.n||0} advertentie(s) in bestaande scans</div>`;
      (de.rijen||[]).slice(0,8).forEach(x=>{
        h+=`<div class="txin-rij"><span class="l">${esc(x.jaar||"?")} · ${esc((x.km||0).toLocaleString("nl-NL"))} km${x.url?` · <a href="${esc(x.url)}" target="_blank" rel="noopener">advertentie</a>`:""}</span><b>${euro(x.nl_equivalent||x.vraagprijs)}</b></div>`;
      });
      if(de.mediaan)h+=`<div class="txin-meta">Indicatie NL-equivalent (mediaan): ${euro(de.mediaan)}</div>`;
      h+=`</div>`;
    }
  }
  box.innerHTML=h;
}
async function api(pad,method,body){
  const headers={"Accept":"application/json","X-Klant":"brns"};
  if(body!=null)headers["Content-Type"]="application/json";
  if(window.TX_BEDRIJF_TOKEN){headers.Authorization="Bearer "+TX_BEDRIJF_TOKEN;headers["X-Taken-Token"]=TX_BEDRIJF_TOKEN;}
  else{try{const tk=localStorage["inst_token_"+((typeof TXSLUG==="function"?TXSLUG():"brns"))];if(tk)headers.Authorization="Bearer "+tk;}catch(e){}}
  const basis=apiRoot();
  let url;
  if(isBedrijf()&&pad.indexOf("/taxatie/")!==0)url=basis+"/taxaties/bedrijf"+(pad==="/taxaties"?"":pad.replace(/^\/taxaties/,""));
  else url=basis+pad;
  const r=await fetch(url,{method:method||"GET",headers,body:body!=null?JSON.stringify(body):undefined});
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(j.fout||("Fout "+r.status));
  return j;
}
async function lijstLaden(){
  try{
    const j=await api("/taxaties","GET");
    TXL.taxaties=j.taxaties||{};TXL.prullenbak=j.prullenbak||[];TXL.verwijderd=j.verwijderd||[];
    if(typeof txPut==="function")txPut(j.taxaties||{});
  }catch(e){try{TXL.taxaties=(typeof txAll==="function"?txAll():{})||{};}catch(x){TXL.taxaties={};}}
  lijstTeken();
}
function kaartenVan(store,prul){
  if(prul)return (TXL.prullenbak||[]).map(x=>x);
  const out=[];const L=store||{};
  Object.keys(L).forEach(id=>{
    const t=L[id];if(!t)return;
    const inv=t.invoer||{},TXx=inv.TX||{};
    out.push({id,datum:t.datum||t.gewijzigd||"",kenteken:t.kenteken||TXx.kenteken||"",auto:t.auto||"",km:t.km||TXx.km||"",verkoop:t.verkoop,bod:t.inruil!=null?t.inruil:t.bod,door:t.door||t.aangemaakt_door||"",record:t,in_prullenbak:false,herstel_tot:""});
  });
  out.sort((a,b)=>String(b.datum).localeCompare(String(a.datum)));
  return out;
}
function lijstTeken(){
  const box=document.getElementById("txmijn");if(!box)return;
  const q=fold(TXL.filter||"");
  let rows=kaartenVan(TXL.taxaties,TXL.prul);
  if(q)rows=rows.filter(x=>fold([x.auto,x.kenteken,x.door,x.datum,x.km].join(" ")).indexOf(q)>=0);
  const items=rows.map(x=>`<article class="txin-item" data-txid="${esc(x.id)}">
    <div class="txin-item-t"><b>${esc(x.auto||"Taxatie")}</b><span>${esc((x.datum||"").toString().slice(0,16))}</span></div>
    <div class="txin-item-m">${esc([x.kenteken,x.km?Number(x.km).toLocaleString("nl-NL")+" km":"",x.verkoop!=null?"verkoop "+euro(x.verkoop):"",x.bod!=null?"bod "+euro(x.bod):"","door "+(x.door||"onbekend")].filter(Boolean).join(" · "))}${x.herstel_tot?" · herstel tot "+esc(x.herstel_tot):""}</div>
    <div class="txin-item-a">${TXL.prul
      ?`<button type="button" data-txa="herstel" data-id="${esc(x.id)}">Herstellen</button>`
      :`<button type="button" data-txa="open" data-id="${esc(x.id)}">Openen</button>
         <button type="button" data-txa="bewerk" data-id="${esc(x.id)}">Bewerken</button>
         <button type="button" data-txa="herbereken" data-id="${esc(x.id)}">Opnieuw berekenen</button>
         <button type="button" data-txa="deel" data-id="${esc(x.id)}">Delen</button>
         <button type="button" class="gevaar" data-txa="weg" data-id="${esc(x.id)}">Verwijderen</button>`}
    </div>
  </article>`).join("");
  box.innerHTML=`<h3>Mijn taxaties</h3>
    <div class="txin-tabs"><button type="button" class="${TXL.prul?"":"aan"}" data-txlijst="actief">Actief</button><button type="button" class="${TXL.prul?"aan":""}" data-txlijst="prul">Prullenbak (30 dagen)</button></div>
    <div class="txin-zoekf"><input id="txzoek" placeholder="Zoek op kenteken, auto, wie…" value="${esc(TXL.filter||"")}"><button type="button" class="txin-btn sec" id="txzoekbtn">Zoek</button></div>
    ${items||'<div class="txin-leeg">'+(TXL.prul?"Geen taxaties in de prullenbak.":"Nog geen opgeslagen taxaties.")+'</div>'}`;
}
function openTaxatie(id,bewerk){
  const t=(TXL.taxaties||{})[id]||((TXL.prullenbak||[]).find(x=>x.id===id)||{}).record;
  if(!t)return;
  const inv=t.invoer||{};
  if(inv.TX)Object.assign(TX,inv.TX);
  if(inv.TX3)TX3=Object.assign({},inv.TX3,{id:t.id||id});
  TX3.id=t.id||id;
  TXR3={r:t.r||{verkoop:t.verkoop,inruil:t.inruil,marge:t.marge,n:t.n,handmatig:t.handmatig},fout:null};
  if(typeof taxatie2==="function")taxatie2();
  if(!bewerk){const el=document.getElementById("txUit");if(el)el.scrollIntoView({block:"start"});}
}
async function herbereken(id){
  openTaxatie(id,true);
  await new Promise(r=>setTimeout(r,0));
  syncVelden();
  if(typeof txBereken3==="function"&&TX.merk&&TX.model&&TX.jaar){
    const r=txBereken3();
    TXR3={r:r,fout:r&&r.fout?r.fout:null};
    if(TXR3.r&&!TXR3.r.fout)TXR3.r.laatste_actie="herberekend";
  }
  toonUitkomst();
  if(typeof toast==="function")toast("Herberekend met de actuele markt");
}
async function wegTaxatie(id){
  if(!confirm("Deze taxatie naar de prullenbak verplaatsen? Je kunt hem 30 dagen herstellen."))return;
  try{await api("/taxaties/"+encodeURIComponent(id),"DELETE");await lijstLaden();if(typeof toast==="function")toast("Verplaatst naar de prullenbak");}
  catch(e){if(typeof toast==="function")toast(e.message);else alert(e.message);}
}
async function herstelTaxatie(id){
  try{await api("/taxaties/"+encodeURIComponent(id)+"/herstel","POST",{});TXL.prul=false;await lijstLaden();if(typeof toast==="function")toast("Taxatie hersteld");}
  catch(e){if(typeof toast==="function")toast(e.message);else alert(e.message);}
}
function bouwRecord(actie){
  const R=TXR3&&TXR3.r||{};
  const auto=[mooiNaam(TX.merk,"merk"),mooiNaam(TX.model,"model"),TX.var,TX.jaar].filter(Boolean).join(" ");
  const rec={auto,kenteken:TX.kenteken||"",km:TX.km||"",jaar:TX.jaar||"",verkoop:R.verkoop,inruil:R.inruil,marge:R.marge,n:R.n,handmatig:!!R.handmatig,invoer:{TX:Object.assign({},TX),TX3:Object.assign({},TX3)},laatste_actie:actie||"opgeslagen"};
  rec.datum=new Date().toISOString().slice(0,16).replace("T"," ");
  return rec;
}
async function opslaanNu(actie){
  syncVelden();
  const R=TXR3&&TXR3.r;
  if(!R||!R.inruil){if(typeof toast==="function")toast("Eerst taxeren (automatisch of handmatig).");return;}
  const id=TX3.id||("t"+Date.now().toString(36));TX3.id=id;
  const rec=bouwRecord(actie||"opgeslagen");rec.id=id;rec.door=wie();
  try{await api("/taxaties","PUT",{taxaties:{[id]:rec}});await lijstLaden();if(typeof toast==="function")toast("Taxatie opgeslagen");}
  catch(e){try{if(typeof txPut==="function"){const L=(typeof txAll==="function"?txAll():{});L[id]=rec;txPut(L);}}catch(x){}if(typeof toast==="function")toast("Lokaal opgeslagen ("+e.message+")");lijstTeken();}
}
async function deelNu(id){
  if(id)openTaxatie(id,false);
  syncVelden();
  const R=TXR3&&TXR3.r;
  if(!R||!R.inruil){if(typeof toast==="function")toast("Eerst taxeren of een taxatie openen.");return;}
  try{
    if(typeof txOpslaan==="function"&&!isBedrijf())txOpslaan();
    const voorstel={auto:bouwRecord().auto,kenteken:TX.kenteken||"",inruil:R.inruil,verkoop:R.verkoop,notitie:TX3.notitie||""};
    const j=await api(isBedrijf()?"/taxaties/voorstel":"/voorstel","POST",{voorstel:voorstel});
    const t=j.t||j.token;
    if(t){const url=apiRoot()+"/voorstel?t="+encodeURIComponent(t);if(navigator.clipboard)try{await navigator.clipboard.writeText(url);}catch(e){}if(typeof toast==="function")toast("Deellink gekopieerd");else alert(url);}
  }catch(e){
    const tekst="Inruil-taxatie "+bouwRecord().auto+"\nVerkoopwaarde "+euro(R.verkoop)+"\nVeilig bod "+euro(R.inruil);
    if(navigator.clipboard)try{await navigator.clipboard.writeText(tekst);}catch(x){}
    if(typeof toast==="function")toast("Samenvatting gekopieerd");
  }
}

async function ophalen(){
  const raw=((document.getElementById("txkent")||{}).value||"").toUpperCase().replace(/[\s-]/g,"");
  if(!raw){if(typeof toast==="function")toast("Vul een kenteken of VIN in");return;}
  TX3.bron="hand";
  if(raw.length===17){TX.vin=raw;TX.kenteken="";await vinOphalen(raw);}
  else{TX.kenteken=((document.getElementById("txkent")||{}).value||"").toUpperCase().trim();await rdwOphalen(TX.kenteken.replace(/[\s-]/g,""));}
  if(typeof taxatie2==="function")taxatie2();
}
async function rdwOphalen(k){
  try{
    const [v,b]=await Promise.all([
      fetch(RDW_V+"?kenteken="+encodeURIComponent(k)).then(r=>r.json()),
      fetch(RDW_B+"?kenteken="+encodeURIComponent(k)).then(r=>r.json()).catch(()=>[])
    ]);
    const a=(v&&v[0])||null;if(!a){if(typeof toast==="function")toast("Kenteken niet gevonden bij de RDW");return;}
    const br=(b&&b[0])||{};
    const det=(a.datum_eerste_toelating||"").slice(0,10);
    const jaar=det?det.slice(0,4):"";
    const keys=(window.MI&&MI.groepen)?Object.keys(MI.groepen):[];
    const mk=normMerk(a.merk),md=matchModel(a.merk,a.handelsbenaming,keys)||predModel(a.merk,a.handelsbenaming);
    const U=uitvoeringen(mk,md,adsTitels(mk,md),a.handelsbenaming);
    const uit=kiesUitvoering(U,a.handelsbenaming,[]);
    TX.merk=mk;TX.model=md;TX.jaar=jaar;TX.brandstof=br.brandstof_omschrijving||TX.brandstof||"";
    if(uit)TX.var=uit;
    const co2=br.co2_uitstoot_gecombineerd?+br.co2_uitstoot_gecombineerd:null;
    TX.co2=co2;TX.det=det;
    TXR3=Object.assign(TXR3||{},{rdw:{merk:a.merk,handelsbenaming:a.handelsbenaming,jaar,apk:(a.vervaldatum_apk||"").slice(0,10),recall:a.openstaande_terugroepactie_indicator,brandstof:br.brandstof_omschrijving||"",co2,uitvoering:uit,det}});
  }catch(e){if(typeof toast==="function")toast("RDW niet bereikbaar");}
}
async function vinOphalen(vin){
  if(typeof txVinDecode==="function"){TX.vin=vin;try{const r=await txVinDecode();TXR3=Object.assign(TXR3||{},{vin:r});}catch(e){}}
}
async function taxeer(){
  syncVelden();
  if(!TX.merk||!TX.model||!TX.jaar){TXR3=Object.assign(TXR3||{},{r:null,fout:"Kies merk, model en bouwjaar, of haal de auto op bij de RDW."});toonUitkomst();return;}
  if(typeof txBereken3==="function"){const r=txBereken3();TXR3=Object.assign(TXR3||{},{r:r,fout:(r&&r.fout)||null});}
  else TXR3=Object.assign(TXR3||{},{r:null,fout:"Taxatie-rekenkern ontbreekt."});
  toonUitkomst();
}
function handToepas(){
  const V=+((document.getElementById("txhv")||{}).value||0),M=+((document.getElementById("txhm")||{}).value||0);
  let B=+((document.getElementById("txhb")||{}).value||0);
  if(!B&&V)B=Math.round(V-M);
  if(!V||!B){if(typeof toast==="function")toast("Vul verkoopwaarde en bod in");return;}
  TXR3=Object.assign(TXR3||{},{r:{verkoop:V,inruil:B,marge:M||Math.round(V-B),n:0,handmatig:true},fout:null});
  toonUitkomst();
}
async function vergelijkDE(){
  syncVelden();
  const boxFout=e=>{TXR3=Object.assign(TXR3||{},{de:{fout:e}});toonUitkomst();};
  try{
    const ads=await api("/taxatie/de-ads?merk="+encodeURIComponent(TX.merk||"")+"&model="+encodeURIComponent(TX.model||"")+"&jaar="+encodeURIComponent(TX.jaar||""),"GET");
    if(!ads.n){boxFout("Geen Duitse advertenties in de bestaande scans voor dit model.");return;}
    const rijen=[];
    for(const a of (ads.ads||[]).slice(0,15)){
      try{
        const eq=await api("/taxatie/nl-eq","POST",{prijs:a.prijs,land:a.land||"DE",jaar:a.jaar||TX.jaar,brandstof:TX.brandstof||a.brandstof||"",rdw_co2:TX.co2,det:TX.det||undefined,titel:a.titel||(mooiNaam(TX.merk,"merk")+" "+mooiNaam(TX.model,"model")),segment:"sport"});
        rijen.push(Object.assign({},a,{nl_equivalent:eq.nl_equivalent,rest_bpm:eq.rest_bpm,regelversie:eq.regelversie,label:eq.label,zekerheid:eq.zekerheid}));
      }catch(e){rijen.push(Object.assign({},a,{nl_equivalent:null}));}
    }
    const vals=rijen.map(x=>x.nl_equivalent).filter(x=>x>0).sort((a,b)=>a-b);
    const med=vals.length?vals[Math.floor((vals.length-1)/2)]:null;
    TXR3=Object.assign(TXR3||{},{de:{n:rijen.length,rijen,mediaan:med,label:"op basis van Duitsland incl. BPM",regelversie:(rijen[0]||{}).regelversie}});
    if(med&&(!TXR3.r||TXR3.r.fout||!TXR3.r.inruil)){
      const marge=typeof ruilMinMarge==="function"?ruilMinMarge(med,"sport"):Math.max(1000,Math.round(med*0.06));
      TXR3.r={verkoop:med,inruil:Math.max(0,med-marge),marge,n:rijen.length,landen:["DE"],label_de:"op basis van Duitsland incl. BPM",regelversie:(rijen[0]||{}).regelversie};
      TXR3.fout=null;
    }
    toonUitkomst();
  }catch(e){boxFout(e.message||"Duitse vergelijking niet beschikbaar");}
}
function bind(){
  const g=id=>document.getElementById(id);
  if(g("txophalen"))g("txophalen").onclick=ophalen;
  if(g("txtaxeer"))g("txtaxeer").onclick=taxeer;
  if(g("txhandtoepas"))g("txhandtoepas").onclick=handToepas;
  if(g("txsave"))g("txsave").onclick=()=>opslaanNu(TXR3&&TXR3.r&&TXR3.r.laatste_actie==="herberekend"?"herberekend":"opgeslagen");
  if(g("deelv"))g("deelv").onclick=()=>deelNu();
  if(g("txi"))g("txi").onclick=()=>{TXI=!TXI;const t=g("txitekst");if(t)t.hidden=!TXI;};
  if(g("txuit"))g("txuit").onchange=()=>{const v=g("txuit").value,lab=g("txuitvrijlab");if(lab)lab.hidden=v!=="__anders__";};
  document.querySelectorAll("#txopt .txin-chip input").forEach(inp=>{inp.addEventListener("change",()=>{const lab=inp.closest(".txin-chip");if(lab)lab.classList.toggle("aan",inp.checked);});});
  const root=document.getElementById("tx-inruil");
  if(root)root.addEventListener("click",e=>{
    const b=e.target.closest("[data-txa],[data-txlijst],#txde,#txzoekbtn");
    if(!b)return;
    if(b.id==="txde"){vergelijkDE();return;}
    if(b.id==="txzoekbtn"){TXL.filter=(g("txzoek")||{}).value||"";lijstTeken();return;}
    if(b.dataset.txlijst){TXL.prul=b.dataset.txlijst==="prul";lijstTeken();return;}
    const id=b.dataset.id,a=b.dataset.txa;
    if(a==="open")openTaxatie(id,false);
    else if(a==="bewerk")openTaxatie(id,true);
    else if(a==="herbereken")herbereken(id);
    else if(a==="deel")deelNu(id);
    else if(a==="weg")wegTaxatie(id);
    else if(a==="herstel")herstelTaxatie(id);
  });
  if(g("txzoek")){g("txzoek").addEventListener("input",e=>{TXL.filter=e.target.value;});g("txzoek").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();lijstTeken();}});}
}
let TXLAAD=null;
function ladenDan(teken){
  if(isBedrijf()){
    const need=[];
    if(!window.MI)need.push(fetch(asset("marktindex.json")+"?"+Date.now()).then(r=>r.json()).then(a=>{MI=a;}));
    if(!window.WM)need.push(fetch(asset("waardemodel.json")+"?"+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({})).then(b=>{WM=b;}));
    window.TXV=window.TXV||{autos:[]};
    if(need.length){Promise.all(need).then(teken).catch(()=>{const T=document.getElementById("cards")||document.getElementById("m");if(T)T.innerHTML='<div class="txin-leeg">Marktindex niet geladen.</div>';});return true;}
    return false;
  }
  if(!window.MI||!window.WM||!window.TXV){
    if(!TXLAAD){
      TXLAAD=Promise.all([
        window.MI?MI:fetch("marktindex.json?"+Date.now()).then(r=>r.json()),
        window.WM?WM:fetch("waardemodel.json?"+Date.now()).then(r=>r.ok?r.json():{}).catch(()=>({})),
        window.TXV?TXV:fetch("voorraad.json?"+Date.now()).then(r=>r.ok?r.json():{autos:[]}).catch(()=>({autos:[]}))
      ]).then(([a,b,c])=>{MI=a;WM=b;TXV=c;TXLAAD=null;teken();}).catch(()=>{
        TXLAAD=null;
        const T=document.getElementById("cards");if(T)T.innerHTML='<div class="empty"><b>Inruil-taxatie nog niet beschikbaar</b><div class="meta">De marktindex ontbreekt nog.</div></div>';
      });
    }else TXLAAD.then(()=>{if(typeof seg==="undefined"||seg===13||isBedrijf())teken();});
    return true;
  }
  return false;
}
window.taxatie2=function(){
  if(!isBedrijf()&&typeof seg!=="undefined"&&seg!==13)return;
  const kpis=document.getElementById("kpis");if(kpis&&!isBedrijf())kpis.innerHTML="";
  if(typeof TX3==="undefined"||!TX3)TX3={bron:"hand",opt:{},schade:"geen"};
  if(!TX3.opt)TX3.opt={};
  if(ladenDan(taxatie2)){const T=document.getElementById("cards")||document.getElementById("tx-inruil-root");if(T)T.innerHTML='<div id="tx-inruil" class="txin"><h2>Inruil-taxatie</h2>'+etxHtml()+'<div class="meta">Gegevens laden</div></div>';return;}
  if(!TX3.bron)TX3.bron="hand";
  const T=document.getElementById("cards")||document.getElementById("tx-inruil-root");
  if(!T)return;
  try{T.innerHTML=html();}catch(e){T.innerHTML='<div id="tx-inruil" class="txin"><h2>Inruil-taxatie</h2>'+etxHtml()+'<div class="txin-kaart fout">'+esc(e.message||e)+'</div></div>';return;}
  bind();toonUitkomst();lijstTeken();lijstLaden();
  if(typeof txCatFetch==="function"&&TX.merk){try{txCatFetch(false).then(()=>{const opt=document.getElementById("txopt");if(opt&&window.TXCAT){opt.innerHTML=optiesLijst().map(o=>`<label class="txin-chip${TX3.opt&&TX3.opt[o.id]?" aan":""}"><input type="checkbox" data-txopt="${esc(o.id)}"${TX3.opt&&TX3.opt[o.id]?" checked":""}><span>${esc(o.naam)}</span></label>`).join("")||opt.innerHTML;bind();}}).catch(()=>{});}catch(e){}}
};
window.txGo=async function(){
  syncVelden();
  if(!TX.merk||!TX.model||!TX.jaar){TXR3=Object.assign(TXR3||{},{r:null,fout:"Kies merk, model en bouwjaar, of haal de auto op bij de RDW."});if(typeof taxatie2==="function")taxatie2();return;}
  TXR3=Object.assign(TXR3||{},{r:typeof txBereken3==="function"?txBereken3():null,fout:null});
  if(TXR3.r&&TXR3.r.fout)TXR3.fout=TXR3.r.fout;
  if(typeof taxatie2==="function")taxatie2();
};
window.txStappen=function(){return;};
const _cui=window.txCatRefreshUI;
window.txCatRefreshUI=function(){if(document.getElementById("tx-inruil"))return;if(_cui)_cui.apply(this,arguments);};
(function bedrijfHook(){
  const nav=document.querySelector("header nav");
  if(!nav||(location.pathname||"").indexOf("/bedrijf")<0)return;
  if(typeof TOKEN!=="undefined")window.TX_BEDRIJF_TOKEN=TOKEN;
  const h1=document.querySelector("header h1");
  if(h1)window.TX_BEDRIJF_NAAM=(h1.textContent||"").replace(/^Bedrijf\s*·\s*/,"").trim();
  if(!nav.querySelector('[data-t="taxaties"]')){const b=document.createElement("button");b.dataset.t="taxaties";b.textContent="Taxaties";nav.appendChild(b);}
  function leegWarnWeg(){document.querySelectorAll("#m > .warn").forEach(w=>{if(!w.textContent.trim())w.remove();});}
  const _t=window.teken;
  window.teken=function(){
    if(typeof TAB!=="undefined"&&TAB==="taxaties"){
      document.querySelectorAll("header nav button").forEach(b=>b.classList.toggle("on",b.dataset.t==="taxaties"));
      const m=document.getElementById("m");if(m)m.innerHTML='<div id="cards"></div>';
      if(window.taxatie2)taxatie2();
      return;
    }
    if(_t)_t.apply(this,arguments);
    leegWarnWeg();
  };
  nav.addEventListener("click",e=>{const b=e.target.closest("button[data-t]");if(!b)return;if(b.dataset.t==="taxaties"){if(typeof TAB!=="undefined")TAB="taxaties";window.teken();}});
  leegWarnWeg();
})();
window.txInruilNorm={normMerk,matchModel,predModel,mooiNaam,uitvoeringen,kiesUitvoering};
})();
