/* Verkoopcijfers per merk (Trends, Feiten): RDW-registraties en overschrijvingen + verkoopsnelheid eigen scans. Data: verkoop.json */
let VK=null,VKM=localStorage.vk_m||"Porsche",VKP=localStorage.vk_p||"maand",VKS=localStorage.vk_s||"meest";
function verkoopSectie(){
 if(VK===null){VK=0;fetch("verkoop.json?"+Date.now()).then(r=>r.json()).then(j=>{VK=j;render()}).catch(()=>{VK={merken:{}}})}
 if(!VK)return '<div class="meta">Verkoopcijfers laden…</div>';
 const B=VK.merken||{},ms=Object.keys(B).sort();if(!ms.length)return "";if(!B[VKM])VKM=ms.includes("Porsche")?"Porsche":ms[0];
 const pr=VK.perioden[VKP],d=s=>s.split("-").reverse().join("-"),S=["nieuw","import","over"];
 const v=(r,s,i)=>((r.p[VKP]||{})[s]||[0,0])[i],tot=r=>S.reduce((a,s)=>a+v(r,s,0),0);
 const so=(a,b)=>B[VKM].reduce((t,r)=>t+v(r,"over",b),0);const mo=so(0,1)?so(0,0)/so(0,1):null;
 const pc=x=>(x>=0?"+":"")+Math.round(x)+"%";
 const reg=r=>{const a=v(r,"nieuw",0)+v(r,"import",0),b=v(r,"nieuw",1)+v(r,"import",1);return b>=5?pc((a/b-1)*100):"n.b."};
 const occ=r=>{const a=v(r,"over",0),b=v(r,"over",1);return b>=5&&mo?pc((a/b/mo-1)*100):"n.b."};
 const J=r=>S.reduce((a,s)=>a+(((r.p.jaar||{})[s])||[0,0])[0],0);
 let L=B[VKM].filter(r=>tot(r)>0).sort((a,b)=>tot(b)-tot(a));L.forEach((r,i)=>r._i=i+1);
 if(VKS==="minst")L=L.filter(r=>J(r)>=10).reverse();else if(VKS==="snel")L=B[VKM].filter(r=>r.snel&&r.snel.weg>=3&&r.snel.dagen!=null).sort((a,b)=>a.snel.dagen-b.snel.dagen);
 const btn=(a,k,l,on)=>`<button data-${a}="${esc(k)}" class="${on?"on":""}">${esc(l)}</button>`;
 return `<h3>Verkoopcijfers per merk (RDW)</h3>
 <div class="meta">${esc(VKP==="maand"?"Vorige maand":VKP==="halfjaar"?"Laatste 6 maanden":"Laatste 12 maanden")}: ${d(pr.van)} t/m ${d(pr.tot)}, vergeleken met ${d(pr.vvan)} t/m ${d(pr.vtot)}. <b>Nieuw</b> = eerste registratie in NL, <b>import</b> = eerder buiten NL toegelaten, <b>occasion</b> = overschrijvingen (benadering van occasionverkopen). RDW bewaart alleen de laatste overschrijving per auto; daarom vergelijken we occasions met het merkgemiddelde. Snelheid = mediaan dagen online van advertenties die in 30 dagen uit onze scans verdwenen (meting sinds 29-10).</div>
 <div class="frow" style="margin:6px 0;flex-wrap:wrap"><div class="seg" style="flex-wrap:wrap">${ms.map(m=>btn("vkm",m,m,m===VKM)).join("")}</div></div>
 <div class="frow" style="margin:6px 0"><div class="seg">${[["maand","Maand"],["halfjaar","Half jaar"],["jaar","Jaar"]].map(([k,l])=>btn("vkp",k,l,k===VKP)).join("")}</div><div class="seg">${[["meest","Meest"],["minst","Minst"],["snel","Snelst weg"]].map(([k,l])=>btn("vks",k,l,k===VKS)).join("")}</div></div>
 <div class="tw"><table class="trt"><tr><th>#</th><th>Model</th><th>Totaal</th><th>Nieuw</th><th>Import</th><th>Occasion</th><th>Registraties t.o.v. vorige</th><th>Occasion t.o.v. merk</th><th>Snelheid</th></tr>
 ${L.slice(0,25).map(r=>`<tr><td>${r._i||""}</td><td><b>${esc(r.model)}</b></td><td style="text-align:right">${tot(r)}</td><td style="text-align:right">${v(r,"nieuw",0)}</td><td style="text-align:right">${v(r,"import",0)}</td><td style="text-align:right">${v(r,"over",0)}</td><td style="text-align:right">${reg(r)}</td><td style="text-align:right">${occ(r)}</td><td>${r.snel&&r.snel.dagen!=null?r.snel.dagen+" d <small>("+r.snel.weg+" weg)</small>":"n.b."}</td></tr>`).join("")}</table></div>
 <div class="meta">Bron: RDW open data. Bijgewerkt ${esc(VK.bijgewerkt)}. In de bot: <code>/verkoop ${esc(VKM.toLowerCase())}</code></div>`}
document.addEventListener("click",e=>{const b=e.target.closest("[data-vkm],[data-vkp],[data-vks]");if(!b)return;
 if(b.dataset.vkm)VKM=localStorage.vk_m=b.dataset.vkm;if(b.dataset.vkp)VKP=localStorage.vk_p=b.dataset.vkp;if(b.dataset.vks)VKS=localStorage.vk_s=b.dataset.vks;render()});
