/* QAS 1.1.60: Gasificado automático y comprobante agrupado autocontenido.
 * La agrupación cambia el comprobante de envío, nunca duplica las existencias.
 */
const seleccionGas60=new Set();
// Actualiza únicamente las etiquetas de destinos de la entrega anterior.
AppState.palletsAcopio.forEach(p=>{
  for(const key of ['destino','destinoInicial']){
    if(p[key]==='Clasificado')p[key]='Gasificado';
    if(p[key]==='Envío planta')p[key]='Envío a planta';
  }
});
function gasificadoPre60(p){
  return p.estado==='CERRADO'&&['GASIFICADO','CLASIFICADO'].includes(String(p.destinoInicial||p.destino).toUpperCase());
}
function elegiblesGas60(){
  return AppState.palletsAcopio.filter(p=>gasificadoPre60(p)&&!p.agrupacionGas60&&fuentePalletV11(p.codigoQR,'gasificado'));
}
const disponiblePaletAntes60=disponiblePaletizado28;
disponiblePaletizado28=function(p){
  return gasificadoPre60(p)||disponiblePaletAntes60(p);
};
let modoSeleccionGas60=false;
const tarjetaPaletAntes61=tarjetaPaletizado29;
tarjetaPaletizado29=function(p){
  const card=tarjetaPaletAntes61(p);
  if(modoSeleccionGas60&&elegiblesGas60().some(x=>x.id===p.id)){
    card.classList.toggle('seleccionado60',seleccionGas60.has(p.id));
    card.querySelector('.fila-parcela')?.insertAdjacentHTML('afterbegin',
      '<label class="seleccion-pallet33"><input type="checkbox" aria-label="Seleccionar pallet '+safe(p.codigoQR)+'" '+(seleccionGas60.has(p.id)?'checked':'')+' onchange="marcarGas60(\''+p.id+'\',this.checked)"></label>');
  }
  return card;
};
function activarGas61(){modoSeleccionGas60=!modoSeleccionGas60;seleccionGas60.clear();renderPalletsEnProceso();}
const renderPaletAntes60=renderPalletsEnProceso;
renderPalletsEnProceso=function(){
  const ps=elegiblesGas60();
  for(const id of seleccionGas60)if(!ps.some(p=>p.id===id))seleccionGas60.delete(id);
  renderPaletAntes60();
  const el=document.getElementById('lista-pallets-proceso');if(!el)return;
  const elegidos=ps.filter(p=>seleccionGas60.has(p.id));
  el.insertAdjacentHTML('afterbegin','<section class="gas-seleccion60"><div class="gas-barra60">'+
    '<button onclick="activarGas61()" aria-label="Activar selección de pallets" aria-pressed="'+modoSeleccionGas60+'">☑</button>'+
    '<b>'+elegidos.length+' '+iconoConteo('pallet')+' · '+suma(elegidos)+' '+iconoConteo('jaba')+'</b>'+
    (modoSeleccionGas60?'<button onclick="todosGas60()">Todos</button><button onclick="comprimirGas60()" aria-label="Generar QR agrupado" '+(!elegidos.length?'disabled':'')+'><i class="fa-solid fa-qrcode"></i></button>':'')+
    '</div></section>');
};
function marcarGas60(id,valor){if(valor)seleccionGas60.add(id);else seleccionGas60.delete(id);renderPalletsEnProceso();}
function todosGas60(){const ps=elegiblesGas60(),todos=ps.length&&ps.every(p=>seleccionGas60.has(p.id));seleccionGas60.clear();if(!todos)ps.forEach(p=>seleccionGas60.add(p.id));renderPalletsEnProceso();}
function datoPalletGas60(p){
  const keys=['id','codigoQR','cant','formato','embalaje','producto','parcela','tipo','tempPromedio','horaInicio','horaFin','horaEnvio','lineas','origenes','destino','destinoInicial','estado'];
  return Object.fromEntries(keys.filter(k=>p[k]!==undefined).map(k=>[k,JSON.parse(JSON.stringify(p[k]))]));
}
async function comprimirGas60(){
  const ps=elegiblesGas60().filter(p=>seleccionGas60.has(p.id));
  if(!ps.length)return avisoApp('Seleccione pallets disponibles para Gasificado.');
  if(!await confirmarApp('¿Comprimir '+ps.length+' pallets en un QR de entrega a Gasificado?'))return;
  // Revalidar tras la confirmación: no agrupar un pallet recibido mientras tanto.
  if(ps.some(p=>!elegiblesGas60().includes(p)))return avisoApp('Cambió la disponibilidad. Seleccione nuevamente.');
  const d=registroUva('prepacking');
  AppState.uva.secuenciaGas60=(AppState.uva.secuenciaGas60||0)+1;
  const numero='GAS-'+String(AppState.uva.secuenciaGas60).padStart(6,'0');
  const v=crearTransferenciaCAP('prepacking',ps,'gasificado','AGRUPACION');
  Object.assign(v,{numeroGas60:numero,agrupacionGas60:true,envioAutomaticoClasificado59:true,tipo:'TRANSFERENCIA',guia:'',precinto:''});
  ps.forEach(p=>p.agrupacionGas60=v.id);
  v.paqueteGas60={tipo:'CAP_GAS_OFFLINE_60',transferencia:v.id,numero,origen:'prepacking',destino:'gasificado',cierre:v.cierre,usuario:v.usuario,config:d.config||{},pallets:ps.map(datoPalletGas60)};
  seleccionGas60.clear();guardarLocal();actualizarAcopio();verQRGas60(v.id);
}
function paginasGas60(paquete){
  const texto=encodeURIComponent(JSON.stringify(paquete)),partes=[];
  for(let i=0;i<texto.length;i+=1200)partes.push(texto.slice(i,i+1200));
  return partes.map((datos,i)=>({tipo:'CAP_GAS_PARTE_60',id:paquete.transferencia,parte:i,total:partes.length,datos}));
}
function verQRGas60(id,pagina=0){
  const v=registroUva('prepacking').viajes.find(v=>v.id===id&&v.paqueteGas60);if(!v)return;
  const paginas=paginasGas60(v.paqueteGas60);pagina=Math.max(0,Math.min(pagina,paginas.length-1));
  modal40('QR de entrega a Gasificado','<b>'+safe(v.numeroGas60)+'</b><div class="qr-centro" id="qr-gas60"></div>'+
    (paginas.length>1?'<p>QR '+(pagina+1)+' de '+paginas.length+'. Lea todas las partes para recibir la entrega sin conexión.</p>':'')+
    conteosPallets(v.paqueteGas60.pallets)+v.paqueteGas60.pallets.map(p=>tarjetaPallet(p).outerHTML).join(''),
    (pagina>0?boton40('Anterior',"verQRGas60('"+id+"',"+(pagina-1)+")"):'')+
    (pagina<paginas.length-1?boton40('Siguiente',"verQRGas60('"+id+"',"+(pagina+1)+")"):'')+boton40('Cerrar','cerrar40()'));
  generarQR('qr-gas60',paginas[pagina]);
}
const comprobanteAntes60=abrirComprobanteV11;
abrirComprobanteV11=function(id){const v=registroUva('prepacking').viajes.find(v=>v.id===id);if(v?.agrupacionGas60)return verQRGas60(id);return comprobanteAntes60(id);};
const rotularAntes60=rotularResumenPre59;
rotularResumenPre59=function(){
  rotularAntes60();
  const tabs=document.querySelector('#view-acopio-resumen .tabs-acopio');
  if(tabs&&!document.getElementById('tab-resumen-gas60'))tabs.insertAdjacentHTML('beforeend','<button id="tab-resumen-gas60" data-resumen="gasificado60" onclick="cambiarResumen(\'gasificado60\')">Transferencia Gasificado</button>');
  const gas=document.getElementById('tab-resumen-gas60');
  const planta=document.querySelector('#view-acopio-resumen [data-resumen="viajes"]');
  if(gas&&planta)planta.before(gas);
};
const resumenPreAntes60=renderResumenAcopio;
renderResumenAcopio=function(){
  if(resumenTab!=='gasificado60'){const r=resumenPreAntes60();rotularResumenPre59();return r;}
  rotularResumenPre59();
  const q=filtrosTransferCAP.prepacking?.q||'';
  const vs=registroUva('prepacking').viajes.filter(v=>v.agrupacionGas60&&coincideRegistroCAP(v,q,'prepacking')).slice().reverse();
  document.getElementById('lista-resumen-pallets-acopio').innerHTML=barraBusquedaCAP('prepacking',q)+vs.map(v=>{
    const ps=AppState.palletsAcopio.filter(p=>v.palletIds.includes(p.id)),recibidos=ps.filter(p=>!fuentePalletV11(p.codigoQR,'gasificado')).length;
    return '<article class="uva-viaje"><div class="fila-parcela"><b>'+safe(v.numeroGas60)+'</b><button class="uva-qr" onclick="verQRGas60(\''+v.id+'\')" aria-label="Abrir QR Gasificado"><i class="fa-solid fa-qrcode"></i></button></div><p>'+ (recibidos===ps.length?'VALIDADO':recibidos?'EN PROCESO':'PENDIENTE')+'</p>'+conteosPallets(ps)+'<details open><summary>Detalle de pallets</summary>'+ps.map(p=>tarjetaPallet(p).outerHTML).join('')+'</details></article>';
  }).join('')+(!vs.length?'<p class="estado-vacio">Sin transferencias a Gasificado.</p>':'');
  document.getElementById('resumen-totales').innerHTML='';
  document.getElementById('resumen-encabezado').innerHTML='';
  document.getElementById('buscar-resumen')?.parentElement.classList.add('hidden');
  document.querySelectorAll('[data-resumen]').forEach(b=>b.classList.toggle('activo',b.dataset.resumen===resumenTab));
};

// Importación sin servidor. No reemplaza stock ni recepciones existentes.
function importarGas60(a){
  if(a?.tipo!=='CAP_GAS_OFFLINE_60'||typeof a.transferencia!=='string'||a.destino!=='gasificado'||!Array.isArray(a.pallets)||!a.pallets.length||a.pallets.length>500)throw Error('QR de Gasificado inválido.');
  const codes=new Set();
  for(const p of a.pallets){
    if(!/^\d{11}$/.test(p.codigoQR)||codes.has(p.codigoQR)||!Number.isSafeInteger(p.cant)||p.cant<1||!Array.isArray(p.lineas))throw Error('Revise los pallets del QR.');
    codes.add(p.codigoQR);
  }
  const d=registroUva('prepacking');
  const conocido=d.viajes.find(v=>v.id===a.transferencia);
  if(conocido)return conocido;
  // Un pallet ya procesado o publicado por otro viaje no se libera con un QR antiguo.
  for(const p of a.pallets){
    const existente=AppState.palletsAcopio.find(x=>x.codigoQR===p.codigoQR);
    if(['gasificado','enfriado','despacho'].some(m=>registroUva(m).pallets.some(x=>x.codigoQR===p.codigoQR))||entregadoT231(p.codigoQR))throw Error('Un pallet ya fue recepcionado. No se importará una entrega duplicada.');
    if(existente&&(!gasificadoPre60(existente)||existente.agrupacionGas60&&existente.agrupacionGas60!==a.transferencia))throw Error('El pallet pertenece a otra entrega.');
  }
  const ps=a.pallets.map(p=>{
    let x=AppState.palletsAcopio.find(x=>x.codigoQR===p.codigoQR);
    if(!x){x={...p,id:uid('PALLET-QR'),estado:'CERRADO',destino:'Gasificado',destinoInicial:'Gasificado'};AppState.palletsAcopio.push(x);}
    x.transferenciaSalida=a.transferencia;x.agrupacionGas60=a.transferencia;return x;
  });
  const v={id:a.transferencia,numeroGas60:a.numero,origen:'prepacking',destino:'gasificado',cierre:a.cierre,usuario:a.usuario,estado:'Pendiente de recepción',palletIds:ps.map(p=>p.id),codigos:ps.map(p=>p.codigoQR),cant:suma(ps),recibidos:[],agrupacionGas60:true,envioAutomaticoClasificado59:true,paqueteGas60:a};
  d.viajes.push(v);guardarLocal();return v;
}
const lectorAntes60=leerPalletUva;
leerPalletUva=async function(m,op,raw){
  let a;try{a=JSON.parse(raw);}catch{}
  if(!['CAP_GAS_OFFLINE_60','CAP_GAS_PARTE_60'].includes(a?.tipo))return lectorAntes60(m,op,raw);
  if(m!=='gasificado'||!['ingreso','recepcion'].includes(op))return avisoApp('Este QR se recibe en Ingreso de Gasificado.');
  if(!validarUbicacion36(m))return;
  try{
    if(a.tipo==='CAP_GAS_PARTE_60'){
      if(typeof a.id!=='string'||!Number.isInteger(a.total)||a.total<1||a.total>1000||!Number.isInteger(a.parte)||a.parte<0||a.parte>=a.total||typeof a.datos!=='string'||a.datos.length>1200)throw Error('Parte de QR inválida.');
      const pendientes=AppState.uva.partesGas60||={};
      let r=pendientes[a.id];if(!r)r=pendientes[a.id]={total:a.total,partes:{}};
      if(r.total!==a.total||r.partes[a.parte]&&r.partes[a.parte]!==a.datos)throw Error('Las partes del QR no coinciden.');
      r.partes[a.parte]=a.datos;guardarLocal();
      if(Object.keys(r.partes).length<r.total)return avisoApp('QR leído: '+Object.keys(r.partes).length+' de '+r.total+'. Continúe con los restantes.');
      const paquete=JSON.parse(decodeURIComponent(Array.from({length:r.total},(_,i)=>r.partes[i]).join('')));
      if(paquete.transferencia!==a.id)throw Error('La entrega no coincide con el QR.');
      a=paquete;
    }
    const v=importarGas60(a);return lectorAntes60(m,op,v.id);
  }catch(e){return avisoApp(e.message||'No se pudo leer el QR de entrega.');}
};
rotularResumenPre59();
guardarLocal();
