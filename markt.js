// Markt-tab: inklapbare secties + inhoudsopgave (04-11-2026). Werkt op de bestaande opmaak van prijstrends(): h3-blokken in de hoofdkaart en losse kaarten met een h2.
const MK_KEY="mk_open";
function mkStrip(t){return String(t||"").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\uFE0F]/gu,"").replace(/\s+/g," ").trim()}
function mkSleutel(t){return mkStrip(t).replace(/\(\d+\)/g,"").trim().toLowerCase()}
function mkState(){try{return JSON.parse(localStorage.getItem(MK_KEY)||"{}")||{}}catch(e){return {}}}
function mkSave(s){try{localStorage.setItem(MK_KEY,JSON.stringify(s))}catch(e){}}
function mkZet(sec,open){sec.classList.toggle("mk-dicht",!open);const b=sec.querySelector(":scope>.mk-kop");if(b){b.setAttribute("aria-expanded",open?"true":"false");const p=b.querySelector(".mk-pijl");if(p)p.textContent=open?"Sluiten":"Openen"}}
function mkSecties(root){
  const out=[];if(!root)return out;
  const arts=[...root.querySelectorAll(":scope>article")];
  arts.forEach((art,ai)=>{
    const body=art.querySelector(".body")||art;
    if(ai===0){
      const h3s=[...body.querySelectorAll(":scope>h3")];
      h3s.forEach(h=>{const sec=document.createElement("section");sec.className="mk-sec";h.parentNode.insertBefore(sec,h);let n=h.nextSibling;sec.appendChild(h);
        while(n&&!(n.nodeType===1&&(n.tagName==="H3"||n.classList.contains("mk-sec")))){const nx=n.nextSibling;sec.appendChild(n);n=nx}
        out.push({sec,kop:h})});
    }else{const h=body.querySelector(":scope>h2");if(!h)return;art.classList.add("mk-sec","mk-kaart");out.push({sec:art,kop:h,body})}
  });
  return out;
}
function mkMaak(){
  const root=document.querySelector("#cards");if(!root||root.querySelector(".mk-idx"))return;
  const S=mkSecties(root);if(!S.length)return;
  const st=mkState();let eerste=true;const idx=[];
  S.forEach((o,i)=>{
    const titel=mkStrip(o.kop.textContent),k=mkSleutel(o.kop.textContent),id="mk-"+i;
    o.sec.id=id;o.sec.dataset.mk=k;
    const b=document.createElement("button");b.type="button";b.className="mk-kop";b.dataset.mkid=id;
    b.innerHTML='<span class="mk-titel"></span><span class="mk-pijl"></span>';b.querySelector(".mk-titel").textContent=titel;
    o.kop.replaceWith(b);
    if(o.body&&o.body!==o.sec){o.sec.insertBefore(b,o.sec.firstChild);}
    // inhoud in één wrapper zodat inklappen alles behalve de kop verbergt
    const w=document.createElement("div");w.className="mk-inhoud";
    const ouder=o.body&&o.body!==o.sec?o.body:o.sec;
    [...ouder.childNodes].forEach(n=>{if(n!==b)w.appendChild(n)});ouder.appendChild(w);
    const open=k in st?!!st[k]:false;mkZet(o.sec,open);
    idx.push(`<button type="button" class="chip mk-ga" data-mkga="${id}"></button>`);
  });
  const nav=document.createElement("nav");nav.className="mk-idx";nav.setAttribute("aria-label","Secties");
  nav.innerHTML='<div class="meta">Ga naar</div><div class="mk-idx-l">'+idx.join("")+'</div><div class="mk-idx-acties"><button type="button" class="btn mk-alles" data-mkalles="1">Alles openen</button><button type="button" class="btn mk-alles" data-mkalles="0">Alles sluiten</button></div>';
  S.forEach((o,i)=>{nav.querySelectorAll(".mk-ga")[i].textContent=mkStrip(o.sec.querySelector(".mk-titel").textContent)});
  const eersteArt=root.querySelector(":scope>article .body")||root.querySelector(":scope>article")||root;
  const h2=eersteArt.querySelector(":scope>h2");
  if(h2&&h2.nextSibling)h2.parentNode.insertBefore(nav,h2.nextSibling);else eersteArt.insertBefore(nav,eersteArt.firstChild);
}
document.addEventListener("click",e=>{
  const k=e.target.closest(".mk-kop");
  if(k){const sec=document.getElementById(k.dataset.mkid);if(!sec)return;const open=sec.classList.contains("mk-dicht");mkZet(sec,open);const s=mkState();s[sec.dataset.mk]=open;mkSave(s);return}
  const g=e.target.closest("[data-mkga]");
  if(g){const sec=document.getElementById(g.dataset.mkga);if(!sec)return;mkZet(sec,true);const s=mkState();s[sec.dataset.mk]=true;mkSave(s);sec.scrollIntoView({behavior:"smooth",block:"start"});return}
  const a=e.target.closest("[data-mkalles]");
  if(a){const open=a.dataset.mkalles==="1",s=mkState();document.querySelectorAll("#cards .mk-sec").forEach(sec=>{mkZet(sec,open);s[sec.dataset.mk]=open});mkSave(s)}
});
if(typeof prijstrends==="function"){const _mkp=prijstrends;prijstrends=function(){const r=_mkp.apply(this,arguments);try{mkMaak()}catch(e){console.warn("markt-secties",e)}return r}}
