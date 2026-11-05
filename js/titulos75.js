/* Títulos centrados sobre el ancho completo del módulo, no sobre el espacio sobrante. */
(function(){
 function centrar(){
  for(const screen of document.querySelectorAll('#app-shell .app-screen')){
   if(screen.id==='view-menu')continue;
   const bar=screen.firstElementChild;if(!bar)continue;
   const title=bar.querySelector('h1,h2');if(!title||!bar.querySelector('button'))continue;
   bar.classList.add('cap-heading75');
   const parent=title.parentElement;
   const block=parent!==bar&&!parent.querySelector('button')?parent:title;
   block.classList.add('cap-title75');
  }
 }
 centrar();let scheduled=false;
 new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;centrar();});}).observe(document.getElementById('app-shell'),{childList:true,subtree:true});
 const version=document.querySelector('#view-menu .font-mono');if(version)version.textContent='QAS - 1.1.83';
})();
