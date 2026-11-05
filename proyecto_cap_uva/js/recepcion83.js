/* Toda recepción nueva de Prepacking termina en el QR de conformidad. */
(function(){
 let busy=false;
 const previous=confirmarRecepcionAcopioFinal;
 confirmarRecepcionAcopioFinal=async function(){
  if(busy)return;busy=true;
  const before=new Set((AppState.viajesAcopio||[]).map(v=>v.id));
  const incoming=AppState.viajeSimulacion||AppState.viajeTransporte;
  const source=incoming?clonarTZ62(incoming):null;
  try{
   if(AppState.viajeSimulacion){
    const raw=document.getElementById('input-acopio-temp')?.value||'';
    if(!raw.trim()||!Number.isFinite(Number(raw)))return avisoApp('Registre una temperatura válida para recepcionar el viaje.');
   }
   await previous.apply(this,arguments);
   const received=(AppState.viajesAcopio||[]).find(v=>!before.has(v.id));
   if(!received)return; // Cancelación o validación fallida: no generar confirmación.
   const ti=typeof viajeTI49==='function'?viajeTI49(received.id):null;
   const flow=recibirFlujo67(received.id,'prepacking',{
    numero:received.id,origen:'transporte',
    entrego:ti?.conductor||source?.conductor||CAPUsuarios79.transporte.nombre,
    receptor:CAPUsuarios79.prepacking.nombre,
    items:clonarTZ62(received.items||[]),pallets:[],tipo:'ti-pre'
   });
   received.reporte70||={};received.reporte70.recepcion||=flow.recibido;
   guardarLocal();
   await abrirFlujo67(flow.key);
  }finally{busy=false;}
 };
})();
