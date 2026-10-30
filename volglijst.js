// Snelle volglijst (alleen lezen): de lijst staat in volglijst.json (bron: de bot). Deze app heeft geen backend,
// dus toevoegen gaat via een kant-en-klaar Telegram-commando of een t.me-link die de bot opent.
let VLST=null,VLF={};
function vlB64(s){return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function vlCmd(){const f=VLF,d=[f.merk,f.model,f.variant].filter(Boolean).join(" ");if(!f.merk)return"";
 return [d,f.prijs?`tot ${f.prijs}`:"",f.km?`max ${f.km} km`:"",f.jaar?`vanaf ${f.jaar}`:"",f.verkoper==="particulier"?"particulier":"",f.land==="NL"?"alleen NL":f.land==="buitenland"?"buitenland":""].filter(Boolean).join(" ")}
function volglijst(){$("#kpis").innerHTML="";
 if(!VLST){$("#cards").innerHTML='<div class="meta">Volglijst laden…</div>';Promise.all([fetch("volglijst.json?"+Date.now()).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]})),CATL?Promise.resolve({merken:CATL}):fetch("catalog.json").then(r=>r.json()).catch(()=>({merken:{}}))]).then(([v,c])=>{VLST=v;CATL=CATL||c.merken;render()});return}
 const C=CATL||{},M=C[VLF.merk]||{},bot=(KL.telegram&&KL.telegram.bot)||"BRNS_EXLUSIEF_BOT",cmd=vlCmd(),pl=cmd?"volg_"+vlB64(cmd):"",te=pl.length>64;
 const opt=(L,v)=>'<option value="">—</option>'+L.map(x=>`<option${x===v?" selected":""}>${esc(x)}</option>`).join("");
 const items=(VLST.items||[]);
 $("#cards").innerHTML=`<div class="card"><h3>Snelle volglijst</h3><div class="meta">Deze auto's checkt de snelle (uurlijkse) run extra: alleen de eerste pagina, nieuwste eerst. Lege lijst = de snelle check doet niets.${VLST.bijgewerkt?` Bijgewerkt: ${esc(VLST.bijgewerkt)}.`:""}</div>
 ${items.length?`<ol>${items.map(x=>`<li>${esc(x.tekst||[x.merk,x.model,x.variant].filter(Boolean).join(" "))}${x.door?` <span class="meta">(${esc(x.door)})</span>`:""}</li>`).join("")}</ol>`:'<div class="empty">De volglijst is leeg.</div>'}</div>
 <div class="card"><h3>Toevoegen via Telegram</h3><div class="meta">De app heeft geen server en kan de lijst dus niet zelf aanpassen. Kies hieronder, en stuur het commando naar de bot (of open de link). Alleen eigenaar/beheerder. Weghalen: <code>/ontvolg nr</code> in de bot.</div>
 <div class="frow"><label>Merk<select data-vf="merk">${opt(Object.keys(C).sort(),VLF.merk)}</select></label><label>Model<select data-vf="model">${opt(Object.keys(M),VLF.model)}</select></label>
 <label>Uitvoering/generatie<input data-vf="variant" placeholder="bv. GTB of G80" value="${esc(VLF.variant||"")}"></label></div>
 <div class="frow"><label>Max prijs<input data-vf="prijs" inputmode="numeric" placeholder="300000" value="${esc(VLF.prijs||"")}"></label><label>Max km<input data-vf="km" inputmode="numeric" value="${esc(VLF.km||"")}"></label><label>Vanaf bouwjaar<input data-vf="jaar" inputmode="numeric" value="${esc(VLF.jaar||"")}"></label>
 <label>Verkoper<select data-vf="verkoper">${opt(["particulier"],VLF.verkoper)}</select></label><label>Land<select data-vf="land">${opt(["NL","buitenland"],VLF.land)}</select></label></div>
 ${cmd?`<p><code id="vlcmd">/volg ${esc(cmd)}</code> <button data-vlcopy>Kopieer</button> ${te?'<span class="meta">(te lang voor een link: plak het commando in de bot)</span>':`<a href="https://t.me/${bot}?start=${pl}" target="_blank" rel="noopener">Open in Telegram</a>`}</p>`:'<div class="meta">Kies minstens een merk.</div>'}</div>`;
}
document.addEventListener("change",e=>{const k=e.target.dataset&&e.target.dataset.vf;if(!k)return;VLF[k]=e.target.value;if(k==="merk")VLF.model="";render()});
document.addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.vf;if(!k||e.target.tagName==="SELECT")return;VLF[k]=e.target.value;const c=$("#vlcmd");if(c){c.textContent="/volg "+vlCmd()}});
document.addEventListener("click",e=>{if(e.target.closest("[data-vlcopy]")){navigator.clipboard&&navigator.clipboard.writeText($("#vlcmd").textContent);e.target.textContent="Gekopieerd"}});
