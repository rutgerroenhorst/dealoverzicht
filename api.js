// Pluggable opslag voor klantwensen. Backend (bv. Cloudflare Worker) verwacht:
// GET  {API_URL}/klantwensen  header X-PIN  -> [wens...]
// POST {API_URL}/klantwensen  header X-PIN  body wens -> {ok:true,id}
// PATCH {API_URL}/klantwensen/{id} header X-PIN body {status}
window.API={
 pin(){let p=localStorage.kwpin;if(!p&&CFG.API_URL){p=prompt("Toegangscode (PIN)");if(p)localStorage.kwpin=p}return p||""},
 async list(){if(!CFG.API_URL){const loc=JSON.parse(localStorage.kw||"[]");let pub=[];try{pub=await (await fetch("klantwensen.json?"+Date.now())).json()}catch(e){}return pub.concat(loc)}
  const r=await fetch(CFG.API_URL+"/klantwensen",{headers:{"X-PIN":this.pin()}});if(r.status===401){delete localStorage.kwpin;throw Error("Verkeerde PIN")}return r.json()},
 async save(w){if(!CFG.API_URL){const l=JSON.parse(localStorage.kw||"[]");w.id=Date.now()+"";w.lokaal=true;l.push(w);localStorage.kw=JSON.stringify(l);return{ok:true,lokaal:true}}
  const r=await fetch(CFG.API_URL+"/klantwensen",{method:"POST",headers:{"X-PIN":this.pin(),"Content-Type":"application/json"},body:JSON.stringify(w)});if(!r.ok)throw Error("Opslaan mislukt ("+r.status+")");return r.json()}
};
