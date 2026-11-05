/* QAS 1.1.63: registro y encabezados compactos, validación en destino y QR único. */
function nombreRuta63(m){return ({planta:'Planta',t2:'Planta (vía T2)',gasificado:'Gasificado',despacho:'Despacho',enfriado:'Enfriado'})[m]||nombreEtapa(m);}
function cabeceraResponsable63(){const c=tz62().config||{};return '<div class="tz-persona62"><p>Responsable de traslado: <b>'+safe(usuarioUva())+'</b></p><p>Fundo: <b>'+safe(c.fundo||'')+'</b> · Prepacking: <b>'+safe(c.zona||'Sin registrar')+'</b></p><p>Zona de traslado: <b>'+safe(nombreRuta63(c.traslado||''))+'</b></p></div>';}
encabezadoTZ62=function(v){return '<div class="tz-enc62"><span>Código de viaje de traslado</span><b>'+safe(v.numero||v.id)+'</b><span>Ruta de traslado: <b>'+safe(nombreEtapa(v.origen))+' → '+safe(nombreRuta63(v.destino))+'</b></span></div><div class="tz-datos63"><p>Entregó: <b>'+safe(v.remitente||'')+'</b></p><p>Responsable de traslado: <b>'+safe(v.transportista||'')+'</b></p>'+(v.receptor?'<p>Recepcionó: <b>'+safe(v.receptor)+'</b></p>':'')+'</div>';};
const fuentesAntes63=fuentesTZ62,disponibleT2Antes63=disponibleT231;
fuentesTZ62=function(){
  const c=tz62().config;if(!c)return [];
  if(c.traslado==='planta')return origenes40().filter(({m,v})=>disponibleT2Antes63(v,m)&&(!v.fundo||v.fundo===c.fundo)&&(!v.lugar||v.lugar===c.zona)).flatMap(({m,v})=>psOrigen40(m,v).filter(p=>!ocupadoTZ62(m,p.codigoQR)).map(p=>({modulo:m,origen:p,viaje:v,destino:'t2'})));
  const fs=fuentesAntes63();return c.traslado?fs.filter(f=>f.destino===c.traslado):fs;
};
disponibleT231=function(v,m){if(!disponibleT2Antes63(v,m))return false;return codigosViaje31(v,m).every(c=>{const r=tz62().recojos.find(r=>r.origen===m&&r.pallets.some(p=>p.codigoQR===c));return !r||tz62().entregas.some(d=>d.origen===m&&d.destino==='t2'&&d.viajeOrigen===v.id&&d.pallets.some(p=>p.codigoQR===c));});};

// Compresión real del paquete, sin fragmentar una entrega en varios QR.
async function codificarQR63(a){
  if(typeof CompressionStream!=='function')throw Error('Este navegador no permite comprimir la entrega. Utilice una versión reciente de Chrome o Edge.');
  const stream=new Blob([JSON.stringify(a)]).stream().pipeThrough(new CompressionStream('deflate'));
  const bytes=new Uint8Array(await new Response(stream).arrayBuffer());let bin='';for(const b of bytes)bin+=String.fromCharCode(b);
  const qr={tipo:'TZ_Z63',datos:btoa(bin)};
  if(JSON.stringify(qr).length>2200)throw Error('La información supera la capacidad de un QR. Seleccione menos pallets para esta entrega.');
  return qr;
}
async function decodificarQR63(raw){let a;try{a=JSON.parse(raw);}catch{return raw;}if(a?.tipo!=='TZ_Z63')return raw;
  if(typeof a.datos!=='string'||a.datos.length>4000||typeof DecompressionStream!=='function')throw Error('No se puede leer el QR comprimido en este navegador.');
  const bytes=Uint8Array.from(atob(a.datos),c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();let n=0,chunks=[];
  while(true){const r=await reader.read();if(r.done)break;n+=r.value.length;if(n>2000000){await reader.cancel();throw Error('El QR excede el tamaño admitido.');}chunks.push(r.value);}
  return await new Blob(chunks).text();
}
let generandoEntrega63=false;
prepararEntregaTZ62=async function(){
  if(generandoEntrega63)return;generandoEntrega63=true;
  try{
    const xs=pendientesTZ62().filter(x=>seleccionTZ62.has(x.p.id));if(!xs.length)return avisoApp('Seleccione pallets.');const base=xs[0].r;
    if(xs.some(x=>x.r.origen!==base.origen||x.r.destino!==base.destino))return avisoApp('Seleccione pallets del mismo origen y destino.');
    const ps=xs.map(x=>palletsEtapa(base.origen).find(p=>p.codigoQR===x.p.codigoQR));if(ps.some(p=>!p))return avisoApp('Revise los pallets de origen.');
    const d={id:uid('TZ'),numero:'TZ-'+String(tz62().secuencia+1).padStart(6,'0'),origen:base.origen,destino:base.destino,remitente:base.remitente,transportista:usuarioUva(),cierre:fechaUva(),config:clonarTZ62(base.config),pallets:xs.map(x=>clonarTZ62(x.p)),recibidos:[]};
    d.paquete=paqueteTZ62(d);d.qrUnico63=await codificarQR63(d.paquete);
    if(!await confirmarApp('¿Generar entrega de '+xs.length+' pallets a '+nombreRuta63(base.destino)+'?'))return;
    // No comprometer el stock si la selección dejó de estar disponible durante la compresión.
    if(xs.some(x=>x.p.entregaTZ62))return avisoApp('Un pallet ya está asignado.');
    const v=crearTransferenciaCAP(base.origen,ps,base.destino,'AGRUPACION');v.tzId62=d.id;v.salidaAutomatica61=true;
    if(base.origen==='prepacking')v.envioAutomaticoClasificado59=base.destino!=='t2';
    const anterior=registroUva(base.origen).viajes.find(v=>v.id===xs[0].p.fuenteId62);
    if(base.destino==='t2'&&anterior){v.guia=anterior.guia||'';v.precinto=anterior.precinto||'';}
    d.viajeOrigen=v.id;xs.forEach(x=>x.p.entregaTZ62=d.id);tz62().secuencia++;tz62().entregas.push(d);
    seleccionTZ62.clear();modoTZ62=false;guardarLocal();renderTZ62();await verEntregaTZ62(d.id);
  }catch(e){avisoApp(e.message||'No se pudo generar la entrega.');}finally{generandoEntrega63=false;}
};
async function mostrarQRUnico63(titulo,encabezado,pallets,qr){
  modal40(titulo,encabezado+'<div id="tz-unico63" class="qr-centro"></div>'+conteosPallets(pallets)+pallets.map(p=>tarjetaTZ62(p)).join(''),boton40('Aceptar','cerrar40()'));
  // El codificador local usa capacidad L y evita la división o un QR de referencia sin datos.
  const e=document.getElementById('tz-unico63');e.innerHTML='';generarQRLocalCAP(e,JSON.stringify(qr));
}
verEntregaTZ62=async function(id){const v=tz62().entregas.find(v=>v.id===id);if(!v)return;try{const qr=v.qrUnico63||await codificarQR63(v.paquete);await mostrarQRUnico63('QR de entrega entre zonas',encabezadoTZ62(v),v.pallets,qr);}catch(e){avisoApp(e.message);}};
verOrigenTZ62=async function(id){const dato=viajeEntregaV11(id);if(!dato)return;try{const v=dato.v,ps=palletsEtapa(dato.m).filter(p=>perteneceViaje38(v,p));const carga=paqueteTZ62({id:'ORIGEN-'+v.id,numero:v.numeroGas60||v.id,origen:dato.m,destino:v.destino,remitente:v.usuario,cierre:v.cierre,config:registroUva(dato.m).config,pallets:ps},'TZ_ORIGEN_62');const qr=await codificarQR63(carga);await mostrarQRUnico63('QR para recojo entre zonas',encabezadoTZ62(carga),ps,qr);}catch(e){avisoApp(e.message);}};
const leerTZAntes63=leerTZ62;
leerTZ62=async function(op,raw){try{return await leerTZAntes63(op,await decodificarQR63(raw));}catch(e){avisoApp(e.message);}};
const leerPalletAntes63=leerPalletUva;
leerPalletUva=async function(m,op,raw){try{return await leerPalletAntes63(m,op,await decodificarQR63(raw));}catch(e){avisoApp(e.message);}};
// La recepción del destino valida la entrega; no exige otra cámara al transportista.
const registrarAntes63=registrarRecepcionV11;
registrarRecepcionV11=function(m,p,viaje){registrarAntes63(m,p,viaje);const d=tz62().entregas.find(v=>v.id===viaje?.tzId62);if(d?.recepcion){d.confirmado=d.recepcion;guardarLocal();}};
const aceptarAntes63=aceptarAntesTZ62;
aceptarRevision37=function(id){const r=revisionesViaje37.get(id);const result=aceptarAntes63(id);const v=tz62().entregas.find(v=>v.id===r?.viaje?.tzId62);if(v?.recepcion){v.confirmado=v.recepcion;guardarLocal();cerrar40();avisoApp('Recepción confirmada. El traslado quedó VALIDADO.');}return result;};
// Planta conserva su recorrido de Transporte Externo: el traslado entrega primero al T2.
const leerLogAntes63=leer40;
leer40=async function(op,raw){try{const decoded=await decodificarQR63(raw);let a;try{a=JSON.parse(decoded);}catch{}if(op==='recojo'&&a?.tipo==='TZ_ENTREGA_62'&&a.destino==='t2'){const v=importarEntregaTZ62(a);return leerLogAntes63(op,v.viajeOrigen);}return leerLogAntes63(op,decoded);}catch(e){avisoApp(e.message);}};
const aceptarT2Antes63=aceptarRecojo40;
aceptarRecojo40=function(id){const v=origenes40().find(x=>x.v.id===id)?.v,result=aceptarT2Antes63(id),d=tz62().entregas.find(d=>d.id===v?.tzId62);if(d&&v.recepcion){d.receptor=v.usuarioRecepcion;d.recepcion=v.recepcion;d.confirmado=v.recepcion;guardarLocal();}return result;};
// En pruebas permite diferenciar al remitente cuando se usa la misma sesión para todo el recorrido.
const usarScannerAntes63=usarScannerTZ62;
usarScannerTZ62=async function(op){const r=await usarScannerAntes63(op);if(op==='recojo'&&revisionTZ62)revisionTZ62.simulado63=true;return r;};
const aceptarRecojoAntes63=aceptarRecojoTZ62;
aceptarRecojoTZ62=function(){const n=tz62().recojos.length,simulado=!!revisionTZ62?.simulado63;aceptarRecojoAntes63();if(simulado&&tz62().recojos.length>n){const r=tz62().recojos.at(-1);r.simulado=true;if(r.remitente===r.transportista)r.remitente=r.transportista.includes('Luis Bautista')?'Juan Vásquez (simulación)':'Luis Bautista (simulación)';guardarLocal();}};
for(const v of tz62().entregas)if(v.recepcion)v.confirmado ||= v.recepcion;
const versionTZ63=document.querySelector('#view-menu .font-mono');if(versionTZ63)versionTZ63.textContent='QAS - 1.1.63';
guardarLocal();
