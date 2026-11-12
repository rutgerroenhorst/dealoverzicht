// VEILIG_BOD_V1 (12-11-2026): "Max. bod (veilig)" als de fiscale onzekerheid begrensd is (pipeline/veiligbod.py).
// Het veilige bod = laagste max. bod over alle scenario's (zelfde formules als maxBod in werk.js), met de eigen doelmarge.
// Alleen als de pijplijn fiscaal.veilig meegeeft; anders blijft "Taxatie nodig" staan, met een korte reden.
(function(root){
const VR=21/121;
function vbScenBod(s,m){const V=s.V,K=s.K,x=s.extra||0;let P;
 if(s.type==="import_btw")P=(V-VR*Math.max(0,V-s.b)-s.I-K-m-x)*s.rate;
 else if(s.type==="import_marge"){P=V-(m+s.I+K+x-VR*s.b)/(1-VR);if(V-P-s.b<=0)P=V-s.I-K-m-x}
 else if(s.type==="nl_btw")P=(V/1.21-K-m-x)*s.rate;
 else return null;
 return Math.max(0,P)}
function vbBod(v,m){const S=(v&&v.scenarios)||[];if(!S.length)return null;let b=Infinity;for(const s of S){const p=vbScenBod(s,m);if(p==null)return null;b=Math.min(b,p)}return b}
const VB={vbScenBod,vbBod};
if(typeof module!=="undefined"&&module.exports)module.exports=VB;
if(typeof root.taxatie!=="function"||typeof root.maxBod!=="function"||typeof root.kort!=="function")return;
const _tax=root.taxatie,_mb=root.maxBod,_kort=root.kort,_deel=root.deelTekst;
const fv=d=>(d&&d.fiscaal)||{};
root.taxatie=function(d){let r=_tax(d);const f=fv(d);
 if(f.veilig){const weg=new Set([...(f.redenen||[]),...(f.veilig.gedekt||[]),"BPM nog niet exact te berekenen"]);r=r.filter(x=>!weg.has(x))}
 else if(!f.bied_toegestaan&&f.veilig_reden&&r.length){const t="geen veilig bod: "+f.veilig_reden;if(!r.includes(t))r.push(t)}
 return r};
root.maxBod=function(d,m){const x=_mb(d,m);if(x!=null)return x;const f=fv(d);if(!f.veilig)return null;const b=vbBod(f.veilig,m);return b==null?null:Math.round(b)};
root.kort=function(d){let h=_kort(d);const f=fv(d),v=f.veilig;if(!v||f.bied_toegestaan)return h;
 let tx=[];try{tx=root.taxatie(d)}catch(e){}if(tx.length)return h;
 const e=typeof eur==="function"?eur:(n=>"€"+Math.round(n).toLocaleString("nl-NL"));
 h=h.replace("<span>Max. bod</span>",'<span>Max. bod (veilig)</span>');
 h=h.replace(/<div><span>Je houdt over<\/span><b class="[^"]*">[^<]*<\/b><\/div>/,`<div><span>Je houdt over (min.)</span><b class="${v.marge>0?"pos":"neg"}">${e(v.marge)}${typeof houdPct==="function"?houdPct(v.marge,(d.c||{}).prijs):""}</b></div>`);
 const esc_=typeof esc==="function"?esc:(s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])));
 const uitleg=`<div class="meta veilig">Veilig bod: gerekend met het slechtste scenario. ${esc_((v.aannames||[]).join("; "))}.</div>`;
 h=h.replace(/(<div class="chips">)/,uitleg+"$1");
 return h};
if(typeof _deel==="function")root.deelTekst=function(d,mb,tx){let t=_deel(d,mb,tx);const f=fv(d),v=f.veilig;if(v&&!f.bied_toegestaan&&!(tx&&tx.length))t=t.replace(/Je houdt over [^\n]*?(?= · max\. bod|\n|$)/,`Je houdt over minimaal ${typeof eur==="function"?eur(v.marge):v.marge} (slechtste scenario)`);return t};
})(typeof window!=="undefined"?window:globalThis);
