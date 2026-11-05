/* Identidades de simulación compartidas por aplicativo y reportes. No cambia cantidades ni horas. */
const CAPUsuarios79={
 prepacking:{codigo:'62-1901',nombre:'César Santisteban'},calidad50:{codigo:'62-1902',nombre:'María López'},
 TPG:{codigo:'62-1903',nombre:'Carlos Rojas'},gasificado:{codigo:'62-1904',nombre:'Juan Vásquez'},
 TGD:{codigo:'62-1905',nombre:'Diego Flores'},TGE:{codigo:'62-1906',nombre:'Miguel Ramos'},
 enfriado:{codigo:'62-1907',nombre:'Luis Bautista'},TED:{codigo:'62-1908',nombre:'Jorge Medina'},
 despacho:{codigo:'62-1909',nombre:'Omar Mariños'},t2:{codigo:'62-1910',nombre:'Pedro Salazar'},
 planta:{codigo:'62-1911',nombre:'Ana Torres'},cosecha:{codigo:'62-1912',nombre:'Rosa Castillo'},
 transporte:{codigo:'62-1913',nombre:'Andrés Vega'}
};
function rutaUsuario79(origen,destino){return origen==='prepacking'?'TPG':origen==='enfriado'?'TED':destino==='enfriado'?'TGE':'TGD';}
function moduloUsuario79(view=AppState.currentView){
 const id=String(view||'').replace(/^view-/,'');
 if(id.includes('zonas')){
  const d=AppState.uva.zonas62||{},dest=d.config?.traslado||'gasificado';
  const revision=typeof revisionTZ62!=='undefined'?revisionTZ62?.[0]:null;
  const origin=revision?.modulo||(dest==='gasificado'?'prepacking':dest==='enfriado'?'gasificado':d.recojos?.at(-1)?.origen||'gasificado');
  return rutaUsuario79(origin,revision?.destino||dest);
 }
 if(id.includes('log-t2'))return 't2';if(id.includes('log-planta'))return 'planta';
 if(id.includes('calidad'))return 'calidad50';
 for(const m of ['gasificado','enfriado','despacho'])if(id.includes('uva-'+m))return m;
 if(id.includes('acopio'))return 'prepacking';if(id.includes('transporte'))return 'transporte';
 if(id.includes('cosecha'))return 'cosecha';return '';
}
(function(){
 responsablePrueba66=function(v){
  if(v?.destino==='t2')return CAPUsuarios79.t2.nombre;
  const origin=v?.origen||Object.keys(CAPUsuarios79).find(k=>CAPUsuarios79[k].nombre===v?.usuario)||'prepacking';
  return CAPUsuarios79[rutaUsuario79(origin,v?.destino||AppState.uva.zonas62?.config?.traslado)].nombre;
 };
 const oldUser=usuarioUva;
 usuarioUva=function(){return CAPUsuarios79[moduloUsuario79()]?.nombre||oldUser();};
 function normalizar(){
  const u=AppState.uva,A=x=>Array.isArray(x)?x:[];
  const actor=(x,key,field)=>{const p=CAPUsuarios79[key];if(!x||!p)return;if(field)x[field]=p.nombre;x.reporte70||={};x.reporte70.actor={...p};};
  persona.croquista=CAPUsuarios79.prepacking.nombre;
  for(const v of A(AppState.viajesAcopio)){v.croquistaRecepcion49=CAPUsuarios79.prepacking.nombre;actor(v,'prepacking');}
  for(const p of A(AppState.palletsAcopio))actor(p,'prepacking');
  for(const m of ['prepacking','gasificado','enfriado','despacho']){
   for(const p of A(u[m]?.pallets))actor(p,m,'usuarioIngreso');
   for(const v of A(u[m]?.viajes)){actor(v,m,'usuario');if(v.usuarioRecepcion&&v.destino==='t2')v.usuarioRecepcion=CAPUsuarios79.t2.nombre;}
  }
  for(const r of A(u.zonas62?.recojos)){const key=rutaUsuario79(r.origen,r.destino);actor(r,key,'transportista');if(CAPUsuarios79[r.origen])r.remitente=CAPUsuarios79[r.origen].nombre;}
  for(const r of A(u.zonas62?.entregas)){const key=rutaUsuario79(r.origen,r.destino);actor(r,key,'transportista');if(r.receptor&&CAPUsuarios79[r.destino])r.receptor=CAPUsuarios79[r.destino].nombre;}
  for(const k of ['envios','recepciones','cambios','desmedros','devoluciones'])for(const r of A(u.calidad50?.[k])){
   actor(r,k==='envios'?'prepacking':'calidad50','responsable');if(r.receptor)r.receptor=CAPUsuarios79[k==='devoluciones'?'prepacking':'calidad50'].nombre;
  }
  for(const v of A(u.interno49?.viajes)){v.conductor=CAPUsuarios79.transporte.nombre;if(v.croquistaRecepcion49)v.croquistaRecepcion49=CAPUsuarios79.prepacking.nombre;}
  for(const v of A(u.logistica?.viajes)){v.conductor=CAPUsuarios79.t2.nombre;actor(v,'t2');if(v.receptorIngresoPlanta)v.receptorIngresoPlanta=CAPUsuarios79.planta.nombre;if(v.receptor)v.receptor=CAPUsuarios79.planta.nombre;for(const r of A(v.recojos))if(r.receptor)r.receptor=CAPUsuarios79.t2.nombre;}
  for(const p of A(u.logistica?.planta))actor(p,'planta','receptor');
  for(const f of A(u.flujos67)){
   const tz=A(u.zonas62?.entregas).find(x=>x.id===f.id),key=tz?rutaUsuario79(tz.origen,tz.destino):null;
   if(f.origen==='zonas'&&key){f.entrego=CAPUsuarios79[key].nombre;f.responsableTraslado=CAPUsuarios79[key].nombre;}
   else if(f.origen==='transporte')f.entrego=CAPUsuarios79.transporte.nombre;
   else if(CAPUsuarios79[f.origen])f.entrego=CAPUsuarios79[f.origen].nombre;
   if(f.receptor){const dest=f.destino==='zonas'?rutaUsuario79(f.origen,(u[f.origen]?.viajes||[]).find(v=>v.id===f.id)?.destino||u.zonas62?.config?.traslado||'gasificado'):f.destino;if(CAPUsuarios79[dest])f.receptor=CAPUsuarios79[dest].nombre;}
  }
 }
 const save=guardarLocal;
 guardarLocal=function(){normalizar();return save.apply(this,arguments);};
 normalizar();
 // Small common identity line on module screens, independent from the centered title.
 function labels(){
  for(const screen of document.querySelectorAll('#app-shell .app-screen')){
   const p=CAPUsuarios79[moduloUsuario79(screen.id)],header=screen.querySelector('.cap-heading75');
   if(!p||!header)continue;
   let line=screen.querySelector('.cap-user79');
   if(!line){line=document.createElement('p');line.className='cap-user79';header.insertAdjacentElement('afterend',line);}
   const text=p.nombre+' · '+p.codigo;if(line.textContent!==text)line.textContent=text;
  }
 }
 labels();let queued=false;
 new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;labels();});}).observe(document.getElementById('app-shell'),{childList:true,subtree:true});
})();
