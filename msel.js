// Multi-select filtergroepen per tab: OF binnen een groep, EN tussen groepen. Status in localStorage "ms_<tab>".
let G={vk:[],lf:[],xf:[],wf:[],mf:[],vf:[],ts:[],tm:[]};const GK=["vk","lf","xf","wf","mf","vf","ts","tm"];
const tabId=()=>seg===6?"meldingen":(((D&&D.segmenten[seg])||{}).id||String(seg));
function gLaad(){let g=null;try{g=JSON.parse(localStorage["ms_"+tabId()]||"null")}catch(e){}
 if(!g){g={};const t=tabId(),old={vk:localStorage["vk_"+t],lf:localStorage["lf_"+t],xf:localStorage.xf,wf:localStorage.wf,mf:localStorage.mf};  // migratie oude enkelvoudige waarden
  for(const k in old){const v=old[k];if(v&&v!=="alles")g[k]=[k==="wf"?(({Investering:"Stijgend",Waardevast:"Stabiel",Leeglopend:"Dalend"})[v]||v):v]}
  if(seg===14)g.vf=["kans","bpm","vroeg"];if(seg===16)g.ts=["brns","exclusief"];localStorage["ms_"+t]=JSON.stringify(g);["vk_"+t,"lf_"+t].forEach(k=>localStorage.removeItem(k))}
 GK.forEach(k=>g[k]=Array.isArray(g[k])?g[k]:[]);
 if(!localStorage.ms_mig2){localStorage.ms_mig2=1;if(seg===14&&g.vf.join()==="kans")g.vf=["kans","bpm","vroeg"];if(seg===16&&!g.ts.length)g.ts=["brns","exclusief"];localStorage["ms_"+tabId()]=JSON.stringify(g)}
 G=g}
function gSave(){localStorage["ms_"+tabId()]=JSON.stringify(G)}
const gOn=(k,v)=>G[k].includes(v),gAny=k=>G[k].length>0,gIn=(k,v)=>!G[k].length||G[k].includes(v);
function gToggle(k,v,lijst){if(v==="alles")G[k]=[];else if(lijst){const all=lijst.every(x=>G[k].includes(x));G[k]=all?G[k].filter(x=>!lijst.includes(x)):[...new Set([...G[k],...lijst])]}else G[k]=gOn(k,v)?G[k].filter(x=>x!==v):[...G[k],v];gSave()}
function gWis(){GK.forEach(k=>G[k]=[]);gSave()}
// predicaten
const XFP={excl:d=>!!d.exclusief,verz:d=>!!(d.exclusief&&d.exclusief.categorie.startsWith("Verzameling")),handel:d=>!!(d.exclusief&&d.exclusief.categorie==="Dagelijkse handel")};
const VFP={kans:x=>!!x.kans,bpm:x=>!!x.bpm_eerst,vroeg:x=>!!x.vroeg,waarde:x=>x.marge!=null,bat:x=>x.bron==="bat",drz:x=>x.bron==="drz"};
const gx=(k,P,x)=>!G[k].length||G[k].some(v=>P[v]&&P[v](x));
function dealOK(d,sk){const c=d.c||d;return (sk==="vk"||gIn("vk",c.verkoper||"onbekend"))&&(sk==="lf"||gIn("lf",landVan(c.url?c:{...c,url:d.deal_url})))&&(sk==="xf"||gx("xf",XFP,d))&&(sk==="wf"||gIn("wf",wkl(d)))&&(sk==="mf"||!G.mf.length||!!d.motivatie)}
// knoppen
const gb=(k,v,l,n,t)=>`<button data-g="${k}" data-v="${esc(v)}" class="${v==="alles"?(gAny(k)?"":"on"):(gOn(k,v)?"on":"")}"${t?` title="${esc(t)}"`:""}>${l} (${n})</button>`;
const GL={ts:"Segment",tm:"Merk",vk:"Verkoper",lf:"Land",xf:"Segment",wf:"Waarde",mf:"Lang te koop",vf:"Selectie"};
const GV={particulier:"Particulier",bedrijf:"Handelaar",onbekend:"onbekend",excl:"Exclusief",verz:"Verzameling",handel:"Dagelijkse handel",lang:"ja",kans:"Kansen",bpm:"BPM eerst",vroeg:"Mogelijke kans",waarde:"Met marktwaarde",bat:"BaT",drz:"Domeinen",brns:"BRNS-segment",exclusief:"Exclusief",flips:"< €1.000 flips","nog te weinig historie":"te weinig historie"};
function gLabels(groepen){return groepen.filter(gAny).map(k=>GL[k]+": "+G[k].map(v=>GV[v]||v).join(", "))}
document.addEventListener("click",e=>{const b=e.target.closest("[data-g]");if(!b)return;e.preventDefault();gToggle(b.dataset.g,b.dataset.v,b.dataset.lijst?b.dataset.lijst.split(","):null);render()});
