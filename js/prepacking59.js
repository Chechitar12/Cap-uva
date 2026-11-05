/* QAS 1.1.59: cierre con ingreso automático a Transferencia o publicación a Clasificado.
 * Conserva los valores internos GASIFICADO/DESPACHO para los registros anteriores.
 */
function rotularResumenPre59(){
  const nombres={total:'Resumen',recepcion:'Recepción',transferencia:'Paletizado',viajes:'Transferencia Planta'};
  document.querySelectorAll('#view-acopio-resumen [data-resumen]').forEach(b=>{
    if(nombres[b.dataset.resumen])b.textContent=nombres[b.dataset.resumen];
  });
}
const rotularAntes59=rotularTransferencias29;
rotularTransferencias29=function(m,p){rotularAntes59(m,p);rotularResumenPre59();};
const resumenAntes59=renderResumenAcopio;
renderResumenAcopio=function(){const r=resumenAntes59();rotularResumenPre59();return r;};

const cerrarDestinoAntes59=confirmarDestinoPalletFinal;
confirmarDestinoPalletFinal=function(){
  const p=AppState.palletsAcopio.find(x=>x.id===AppState.palletEnCierreId);
  if(!p||p.estado!=='PROCESO')return;
  cerrarDestinoAntes59();
  if(p.estado!=='CERRADO')return;
  const d=registroUva('prepacking');
  p.despachoHoraInicio=fechaUva();
  p.despachoHoraFin=null;
  if(p.destino==='DESPACHO'){
    p.destino=p.destinoInicial='Envío a planta';
    if(!d.grupo.includes(p.id))d.grupo.push(p.id);
  }else{
    p.destino=p.destinoInicial='Gasificado';
    // AGRUPACION conserva los pallets de la transferencia a planta en preparación.
    const v=crearTransferenciaCAP('prepacking',[p],'gasificado','AGRUPACION');
    v.tipo='TRANSFERENCIA';
    v.envioAutomaticoClasificado59=true;
    v.guia='';v.precinto='';
  }
  guardarLocal();
  actualizarAcopio();
  switchSubtabAcopio(p.destino==='Envío a planta'?'viajes':'paletizado');
};

// Una entrega automática a Clasificado pertenece al circuito de tratamiento.
// No debe aparecer en el recojo de Planta por Transporte Externo.
const disponibleT2Antes59=disponibleT231;
disponibleT231=function(v,m){
  return !v.envioAutomaticoClasificado59&&disponibleT2Antes59(v,m);
};
const resumenTransferAntes59=resumenTransferCAP;
resumenTransferCAP=function(m){
  if(m!=='prepacking')return resumenTransferAntes59(m);
  const q=filtrosTransferCAP[m]?.q||'';
  const vs=registroUva(m).viajes.filter(v=>!v.envioAutomaticoClasificado59&&coincideRegistroCAP(v,q,m)).slice().reverse();
  return barraBusquedaCAP(m,q)+vs.map(v=>tarjetaViajeDesplegable13(v,m)).join('')+
    (!vs.length?'<p class="estado-vacio">Sin viajes.</p>':'');
};
rotularResumenPre59();
