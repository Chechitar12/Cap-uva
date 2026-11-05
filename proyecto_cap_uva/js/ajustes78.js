/* QAS 1.1.78. Presentación y propagación de confirmaciones. */
(function(){
 // Los pallets abiertos mantienen su identidad interna, pero aún no tienen etiqueta QR.
 let changed=false;
 for(const p of AppState.palletsAcopio||[])if(p.estado==='PROCESO'&&p.codigoQR){p.codigoQR='';changed=true;}
 if(changed)guardarLocal();
 const confirmBefore78=confirmarFlujo67;
 confirmarFlujo67=async function(key){
  const result=await confirmBefore78.apply(this,arguments),f=buscarFlujo67(key);
  if(f?.destino==='prepacking'&&f.confirmado){
   const rec=(AppState.viajesAcopio||[]).find(v=>v.id===f.id);
   if(rec){rec.confirmadoPre67=f.confirmado;rec.reporte70||={};rec.reporte70.confirmacion=f.confirmado;}
   const t=(AppState.uva.interno49?.viajes||[]).find(v=>v.id===f.id);
   if(t)t.confirmadoPre67=f.confirmado;
   guardarLocal();
  }
  return result;
 };
 function titles78(){
  const colors={cosecha:'#713000',acopio:'#392156',gasificado:'#24482A',enfriado:'#153D67',despacho:'#204529',calidad:'#235252','log-t2':'#59233F','log-planta':'#70272B',zonas:'#174D55'};
  for(const screen of document.querySelectorAll('#app-shell .app-screen')){
   const title=screen.querySelector('.cap-heading75 h1,.cap-heading75 h2');
   if(!title)continue;
   const key=Object.keys(colors).find(k=>screen.id.includes(k)),color=colors[key]||'#26394B';
   title.style.setProperty('color',color,'important');
  }
 }
 titles78();let pending=false;
 new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;titles78();});}).observe(document.getElementById('app-shell'),{childList:true,subtree:true});
})();
