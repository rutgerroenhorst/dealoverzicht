/* SCANPAUZE_V1: korte melding als de scans bewust gepauzeerd zijn; uitleg achter ⓘ. Geen techniek. */
(function(){
  fetch("scanpauze.json?"+Date.now()).then(function(r){return r.ok?r.json():null}).then(function(j){
    if(!j||!j.actief||document.getElementById("scanpauze"))return;
    var d=document.getElementById("datum");if(!d)return;
    var e=function(s){return String(s||"").replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};
    d.insertAdjacentHTML("afterend",'<small id="scanpauze" class="scanpauze" style="display:block;opacity:.85">'+e(j.kop||"Scans tijdelijk gepauzeerd")+
      ' <button type="button" aria-label="Meer info" style="border:0;background:none;color:inherit;padding:0 2px;cursor:pointer">ⓘ</button>'+
      '<span class="scanpauze-uitleg" hidden><br>'+e(j.tekst)+'</span></small>');
    var b=document.querySelector("#scanpauze button"),u=document.querySelector("#scanpauze .scanpauze-uitleg");
    if(b&&u)b.addEventListener("click",function(){u.hidden=!u.hidden});
  }).catch(function(){});
})();
