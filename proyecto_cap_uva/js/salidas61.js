/* QAS 1.1.61: publicar la salida sin exigir otra transferencia manual. */
function publicarSalidas61(m){
  if(!['gasificado','enfriado'].includes(m))return;
  for(const p of registroUva(m).pallets){
    if(!p.salida||p.transferenciaSalida||registroUva(m).viajes.some(v=>v.id===p.envioSalida61))continue;
    const destino=m==='enfriado'?'despacho':p.destinoSalida;
    if(!['enfriado','despacho'].includes(destino))continue;
    // Las salidas históricas ya transferidas no deben generar nuevas entregas.
    if(registroUva(m).viajes.some(v=>perteneceViaje38(v,p)))continue;
    const v=crearTransferenciaCAP(m,[p],destino,'AGRUPACION');
    v.tipo='TRANSFERENCIA';v.salidaAutomatica61=true;
    p.envioSalida61=v.id;
    // Sigue visible en Salida hasta incorporarse a una transferencia manual.
    delete p.transferenciaSalida;
  }
  guardarLocal();
}
const lecturaAntes61=leerPalletUva;
leerPalletUva=async function(m,op,raw){
  const r=await lecturaAntes61(m,op,raw);
  if(op==='salida'&&['gasificado','enfriado'].includes(m)){
    publicarSalidas61(m);renderUva(m,'gestion');
  }
  return r;
};
const masivaAntes61=guardarSalida33;
guardarSalida33=async function(m){
  const r=await masivaAntes61(m);
  publicarSalidas61(m);renderUva(m,'gestion');return r;
};
const fuenteAntes61=fuenteSecuencia30;
fuenteSecuencia30=function(raw,m){
  const f=fuenteAntes61(raw,m);
  return f?.viaje.salidaAutomatica61&&f.viaje.destino!==m?null:f;
};
fuentePalletV11=fuenteSecuencia30;
