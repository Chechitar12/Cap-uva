/* QAS 1.1.64: navegación de cámara y entregas con rutas independientes por pallet. */
const limpioTZ64=s=>String(s||'').replace(/\s*\(simulación\)/gi,'');
cabeceraResponsable63=function(){const c=tz62().config||{};return '<div class="tz-persona62 tz-responsable64"><div><p>Responsable de traslado: <b>'+safe(usuarioUva())+'</b></p><p>Fundo: <b>'+safe(c.fundo||'')+'</b></p><p>Prepacking: <b>'+safe(c.zona||'Sin registrar')+'</b></p><p>Zona de traslado: <b>'+safe(nombreRuta63(c.traslado||''))+'</b></p></div>'+(paginaTZ62==='gestion'?'<button class="tz-camara64" onclick="scannerTZ62(\'recojo\')" aria-label="Abrir lectura de pallet o viaje"><i class="fa-solid fa-camera"></i></button>':'')+'</div>';};
encabezadoTZ62=function(v){
  const rutas=v.tramos64?.length?v.tramos64.map(t=>nombreEtapa(t.origen)+' → '+nombreRuta63(t.destino)):[nombreEtapa(v.origen)+' → '+nombreRuta63(v.destino)];
  const origenes=v.viajesRecojo64||v.pallets?.map(p=>p.viajeRecojo64||p.fuenteId62).filter(Boolean)||[];
  const codigo=v.numero||[...new Set(origenes)].join(', ')||v.id;
  return '<div class="tz-enc62"><p class="tz-codigo64">'+(v.numero?'Código de viaje de traslado: ':'Viaje de recojo: ')+'<b>'+safe(codigo)+'</b></p><span>Ruta de traslado: <b>'+safe([...new Set(rutas)].join(' · '))+'</b></span></div><div class="tz-datos63"><p>Responsable de traslado: <b>'+safe(limpioTZ64(v.transportista))+'</b></p><p>Entregó: <b>'+safe(limpioTZ64((v.remitentes64||[v.remitente]).filter(Boolean).join(', ')))+'</b></p>'+(v.receptor?'<p>Recepcionó: <b>'+safe(v.receptor)+'</b></p>':'')+'</div>';
};
const pieAntes64=pieTZ62;
pieTZ62=function(resumen){return resumen?pieAntes64(true):'<nav class="tz-tabs62"><button class="activo" aria-current="page">Recepción</button></nav>';};
const aceptarRecojoAntes64=aceptarRecojoTZ62;
aceptarRecojoTZ62=function(){const n=tz62().recojos.length;aceptarRecojoAntes64();if(tz62().recojos.length>n){const r=tz62().recojos.at(-1);r.viajesRecojo64=[...new Set(r.pallets.map(p=>viajeEntregaV11(p.fuenteId62)?.v.numeroGas60||p.fuenteId62))];r.pallets.forEach(p=>p.viajeRecojo64=viajeEntregaV11(p.fuenteId62)?.v.numeroGas60||p.fuenteId62);guardarLocal();renderTZ62();}};

// Volver explícito, Escape y botón Atrás: cancela incluso una petición de permisos pendiente.
let camaraTZActiva64=false,historiaCamara64=false;
function cerrarScannerTZ64(retornar){
  if(!camaraTZActiva64)return;camaraTZActiva64=false;
  cerrarCamaraGenerica();const modal=document.getElementById('modal-camara-generica');modal.style.zIndex='';
  if(historiaCamara64&&window.history?.state?.tzCamera64){historiaCamara64=false;window.history.back();}
  if(retornar)scannerTZ62('recojo');
}
function volverCamaraTZ64(){cerrarScannerTZ64(true);}
camaraTZ62=async function(op){
  cerrar40();crearScanner();const modal=document.getElementById('modal-camara-generica');modal.classList.remove('hidden');modal.style.zIndex='120';
  camaraTZActiva64=true;const sesion=++scannerSesion;
  if(window.history?.pushState){window.history.pushState({tzCamera64:true},'');historiaCamara64=true;}
  document.getElementById('lbl-titulo-camara-generica').textContent='Lectura de pallet o viaje';
  const cerrar=document.querySelector('#modal-camara-generica .scanner-header button');if(cerrar){cerrar.textContent='← Volver';cerrar.onclick=volverCamaraTZ64;cerrar.setAttribute('aria-label','Volver al recojo');}
  modal.insertAdjacentHTML('beforeend','<button class="tz-volver64" onclick="volverCamaraTZ64()">← Volver al recojo</button>');
  const input=document.getElementById('codigo-etiqueta');input.maxLength=20000;
  const leer=raw=>{if(!raw||!camaraTZActiva64)return;cerrarScannerTZ64(false);leerTZ62(op,raw);};scannerCallback=leer;
  const manual=document.querySelector('#modal-camara-generica .scanner-manual button');if(manual)manual.onclick=()=>leer(input.value.trim());
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});
    if(!camaraTZActiva64||sesion!==scannerSesion){stream.getTracks().forEach(t=>t.stop());return;}
    scannerStream=stream;const video=document.getElementById('video-qr');video.srcObject=stream;await video.play();
    if(!camaraTZActiva64||sesion!==scannerSesion)return;
    document.getElementById('scanner-estado').textContent='Apunte al QR o use el código. Puede volver en cualquier momento.';
    if('BarcodeDetector' in window){const detector=new BarcodeDetector({formats:['qr_code']});let busy=false;scannerTimer=setInterval(async()=>{if(busy||!camaraTZActiva64)return;busy=true;try{const xs=await detector.detect(video);if(xs.length)leer(xs[0].rawValue);}catch{}finally{busy=false;}},350);}
  }catch{if(camaraTZActiva64&&sesion===scannerSesion)document.getElementById('scanner-estado').textContent='No se pudo activar la cámara. Use el código o Volver al recojo.';}
};
if(typeof window.addEventListener==='function'){
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&camaraTZActiva64){e.preventDefault();volverCamaraTZ64();}});
  window.addEventListener('popstate',()=>{if(camaraTZActiva64){historiaCamara64=false;cerrarScannerTZ64(true);}});
}

let generandoTZ64=false;
prepararEntregaTZ62=async function(){
  if(generandoTZ64)return;generandoTZ64=true;
  try{
    const xs=pendientesTZ62().filter(x=>seleccionTZ62.has(x.p.id));if(!xs.length)return avisoApp('Seleccione pallets.');
    const rutas=new Map();
    for(const x of xs){const key=x.r.origen+'|'+x.r.destino;if(!rutas.has(key))rutas.set(key,[]);rutas.get(key).push(x);}
    const d={id:uid('TZ'),numero:'TZ-'+String(tz62().secuencia+1).padStart(6,'0'),transportista:usuarioUva(),cierre:fechaUva(),config:clonarTZ62(tz62().config),pallets:[],recibidos:[],tramos64:[],viajesOrigen64:[],viajesRecojo64:[],remitentes64:[]};
    for(const [key,items] of rutas){
      const base=items[0].r,ps=items.map(x=>palletsEtapa(base.origen).find(p=>p.codigoQR===x.p.codigoQR));if(ps.some(p=>!p))throw Error('Revise los pallets del origen.');
      const tramo={id:d.id+'-R'+d.tramos64.length,numero:d.numero,origen:base.origen,destino:base.destino,transportista:d.transportista,remitente:base.remitente,cierre:d.cierre,config:clonarTZ62(base.config),pallets:items.map(x=>clonarTZ62(x.p)),recibidos:[]};
      tramo.paquete=paqueteTZ62(tramo);tramo.paquete.viajesRecojo64=[...new Set(items.map(x=>x.p.viajeRecojo64||x.p.fuenteId62))];tramo.paquete.pallets.forEach((x,i)=>x.actual.viajeRecojo64=items[i].p.viajeRecojo64||items[i].p.fuenteId62);d.tramos64.push(tramo);
      for(const x of items){d.pallets.push({...clonarTZ62(x.p),origenTraslado64:base.origen,destinoTraslado64:base.destino});d.viajesRecojo64.push(x.p.viajeRecojo64||x.p.fuenteId62);d.remitentes64.push(x.r.remitente);}
    }
    d.viajesRecojo64=[...new Set(d.viajesRecojo64)];d.remitentes64=[...new Set(d.remitentes64)];
    d.origen=d.tramos64.length===1?d.tramos64[0].origen:'mixto';d.destino=d.tramos64.length===1?d.tramos64[0].destino:'mixto';d.remitente=d.remitentes64.join(', ');
    const a={tipo:'TZ_RUTAS_64',id:d.id,numero:d.numero,transportista:d.transportista,cierre:d.cierre,config:d.config,viajes:d.tramos64.map(t=>t.paquete)};
    d.paquete=a;d.qrUnico63=await codificarQR63(a);
    if(!await confirmarApp('¿Generar entrega de '+d.pallets.length+' pallets?'))return;
    if(xs.some(x=>x.p.entregaTZ62))throw Error('Un pallet ya fue entregado.');
    for(const tramo of d.tramos64){
      const ps=tramo.pallets.map(p=>palletsEtapa(tramo.origen).find(x=>x.codigoQR===p.codigoQR));
      const v=crearTransferenciaCAP(tramo.origen,ps,tramo.destino,'AGRUPACION');v.tzId62=d.id;v.salidaAutomatica61=true;
      if(tramo.origen==='prepacking')v.envioAutomaticoClasificado59=tramo.destino!=='t2';
      if(tramo.destino==='t2'){const old=viajeEntregaV11(tramo.pallets[0].fuenteId62)?.v;v.guia=old?.guia||'';v.precinto=old?.precinto||'';}
      tramo.viajeOrigen=v.id;d.viajesOrigen64.push(v.id);
    }
    d.viajeOrigen=d.tramos64[0].viajeOrigen;xs.forEach(x=>x.p.entregaTZ62=d.id);tz62().secuencia++;tz62().entregas.push(d);
    seleccionTZ62.clear();modoTZ62=false;guardarLocal();renderTZ62();await verEntregaTZ62(d.id);
  }catch(e){avisoApp(e.message||'No se pudo generar la entrega.');}finally{generandoTZ64=false;}
};

// Un QR puede contener varios tramos. El destino solo importa los que le corresponden.
function validarRutasTZ64(a){
  if(a?.tipo!=='TZ_RUTAS_64'||typeof a.id!=='string'||!/^[-A-Za-z0-9_]{1,150}$/.test(a.id)||!Array.isArray(a.viajes)||!a.viajes.length||a.viajes.length>10)throw Error('QR de traslado inválido.');
  const codigos=new Set();for(const t of a.viajes){validarPaqueteTZ62(t);for(const x of t.pallets){if(codigos.has(x.actual.codigoQR))throw Error('El QR repite un pallet.');codigos.add(x.actual.codigoQR);}}
}
function importarRutasTZ64(a,m){
  validarRutasTZ64(a);const rutas=a.viajes.filter(t=>t.destino===m);if(!rutas.length)throw Error('Esta entrega no contiene pallets para este destino.');
  let d=tz62().entregas.find(v=>v.id===a.id);if(!d){d={id:a.id,numero:a.numero,transportista:a.transportista,cierre:a.cierre,config:a.config,origen:'mixto',destino:'mixto',pallets:a.viajes.flatMap(t=>t.pallets.map(x=>({...x.actual,origenTraslado64:t.origen,destinoTraslado64:t.destino}))),tramos64:[],viajesOrigen64:[],recibidos:[],paquete:a,viajesRecojo64:[...new Set(a.viajes.flatMap(t=>t.viajesRecojo64||[]))],remitentes64:[...new Set(a.viajes.map(t=>t.remitente))]};tz62().entregas.push(d);}
  for(const t of rutas){if(d.tramos64.some(x=>x.id===t.id))continue;const hijo=importarEntregaTZ62(t),src=viajeEntregaV11(hijo.viajeOrigen)?.v;if(src)src.tzId62=d.id;d.tramos64.push(hijo);d.viajesOrigen64.push(hijo.viajeOrigen);tz62().entregas=tz62().entregas.filter(v=>v.id!==hijo.id);}
  d.viajeOrigen ||= d.viajesOrigen64[0];guardarLocal();return d;
}
fuenteSecuencia30=function(raw,m){const f=fuenteBaseTZ62(raw,m);if(!f)return null;const r=tz62().recojos.find(r=>r.origen===f.modulo&&r.pallets.some(p=>p.codigoQR===f.origen.codigoQR));if(!r)return f;const d=tz62().entregas.find(v=>(v.viajesOrigen64||[v.viajeOrigen]).includes(f.viaje.id)&&v.pallets.some(p=>p.codigoQR===f.origen.codigoQR));return d?f:null;};
fuentePalletV11=fuenteSecuencia30;
disponibleT231=function(v,m){if(!disponibleT2Antes63(v,m))return false;return codigosViaje31(v,m).every(c=>!ocupadoTZ62(m,c)||tz62().entregas.some(d=>(d.viajesOrigen64||[d.viajeOrigen]).includes(v.id)&&d.pallets.some(p=>p.codigoQR===c)));};
let colaRecepcionTZ64=[];
const lectorDestinoAntes64=leerPalletUva;
leerPalletUva=async function(m,op,raw){try{const decoded=await decodificarQR63(raw);let a;try{a=JSON.parse(decoded);}catch{}if(a?.tipo!=='TZ_RUTAS_64')return lectorDestinoAntes64(m,op,decoded);if(!['ingreso','recepcion'].includes(op)||!validarUbicacion36(m))return;if(colaRecepcionTZ64.length)return avisoApp('Termine la recepción actual antes de leer otra entrega.');const d=importarRutasTZ64(a,m);const ids=d.tramos64.filter(t=>t.destino===m&&pendientesViaje31(viajeEntregaV11(t.viajeOrigen)?.v||{},m).length).map(t=>t.viajeOrigen);if(!ids.length)return avisoApp('Los pallets de este destino ya fueron recibidos.');colaRecepcionTZ64=ids.slice(1).map(id=>({m,op,id}));return lectorDestinoAntes64(m,op,ids[0]);}catch(e){avisoApp(e.message);}};
const aceptarDestinoAntes64=aceptarRevision37;
aceptarRevision37=function(id){const r=revisionesViaje37.get(id),result=aceptarDestinoAntes64(id);if(r&&!revisionesViaje37.has(id)&&colaRecepcionTZ64.length){const next=colaRecepcionTZ64.shift();lectorDestinoAntes64(next.m,next.op,next.id);}return result;};
const cancelarAntes64=cancelarRevision37;
cancelarRevision37=function(id){if(revisionesViaje37.get(id)?.fase!=='aceptar')colaRecepcionTZ64=[];return cancelarAntes64(id);};
const camaraDestinoAntes64=camaraUva;
camaraUva=function(m,op){
  camaraDestinoAntes64(m,op);
  if(!['ingreso','recepcion'].includes(op)||!registroUva(m)?.config||['gasificado','enfriado'].includes(m)&&!ubicacionesUva[m])return;
  const vs=tz62().entregas.filter(d=>d.paquete?.tipo==='TZ_RUTAS_64'&&d.tramos64?.some(t=>t.destino===m&&pendientesViaje31(viajeEntregaV11(t.viajeOrigen)?.v||{},m).length));
  document.getElementById('uva-lista-prueba')?.insertAdjacentHTML('afterbegin',vs.map(d=>'<option value="'+safe(JSON.stringify(d.qrUnico63||d.paquete))+'">'+safe(d.numero)+' · Entrega de traslado</option>').join(''));
  if(vs.length)document.getElementById('uva-simular').disabled=false;
};
const leerLogAntes64=leer40;
leer40=async function(op,raw){try{const decoded=await decodificarQR63(raw);let a;try{a=JSON.parse(decoded);}catch{}if(op==='recojo'&&a?.tipo==='TZ_RUTAS_64'){const d=importarRutasTZ64(a,'t2'),t=d.tramos64.find(t=>t.destino==='t2'&&disponibleT231(viajeEntregaV11(t.viajeOrigen)?.v||{},t.origen));if(!t)return avisoApp('Esta entrega ya fue recibida en T2.');return leerLogAntes64(op,t.viajeOrigen);}return leerLogAntes64(op,decoded);}catch(e){avisoApp(e.message);}};
aceptarRecojo40=function(id){const v=origenes40().find(x=>x.v.id===id)?.v,result=aceptarT2Antes63(id),d=tz62().entregas.find(d=>d.id===v?.tzId62);if(d&&v.recepcion){for(const code of codigosViaje31(v,v.origen))if(!d.recibidos.includes(code))d.recibidos.push(code);d.receptor=v.usuarioRecepcion;if(d.pallets.every(p=>d.recibidos.includes(p.codigoQR))){d.recepcion=v.recepcion;d.confirmado=v.recepcion;}guardarLocal();}return result;};
const registrarAntes64=registrarRecepcionV11;
registrarRecepcionV11=function(m,p,viaje){registrarAntes64(m,p,viaje);const d=tz62().entregas.find(d=>d.id===viaje?.tzId62);if(!d)return;(d.recepciones64||=[]);if(!d.recepciones64.some(r=>r.codigoQR===p.codigoQR))d.recepciones64.push({codigoQR:p.codigoQR,destino:m,usuario:usuarioUva(),hora:fechaUva()});if(d.recepcion)d.receptor=[...new Set(d.recepciones64.map(r=>r.usuario))].join(', ');guardarLocal();};

// Resumen con el mismo agrupador del resto de reportes: solo una flecha en el encabezado.
const renderAntes64=renderTZ62;
renderTZ62=function(){
  if(paginaTZ62!=='resumen')return renderAntes64();
  const recepcion=hojaTZ62==='recepcion',vs=(recepcion?tz62().recojos:tz62().entregas).filter(v=>JSON.stringify(v).toLowerCase().includes(busquedaTZ62.toLowerCase())).slice().reverse();
  const filtro=barraBusquedaCAP('zonas',busquedaTZ62).replace("filtrarTransferCAP('zonas','q',this.value)",'filtrarTZ62(this.value)');
  document.getElementById('view-zonas62').innerHTML='<header class="tz-header62"><button onclick="openSidebar(\'drawer-zonas62\')" aria-label="Menú de transferencia entre zonas">☰</button><h2>Resumen de traslados</h2></header><div class="tz-body62">'+cabeceraResponsable63()+'<div class="tz-filtro64">'+filtro+'</div>'+vs.map(v=>{
    const abierto=!viajesContraidos15.has(v.id);
    return '<article class="uva-viaje resumen-viaje15 tz-viaje62">'+encabezadoTZ62(v)+'<div class="tz-cabecera-viaje64"><b class="'+(v.recepcion?'validado64':'proceso64')+'">'+(recepcion?'RECOGIDO':v.recepcion?'VALIDADO':'EN PROCESO')+'</b>'+(!recepcion&&!v.recepcion?'<button class="uva-qr" onclick="verEntregaTZ62(\''+v.id+'\')" aria-label="Abrir QR de entrega"><i class="fa-solid fa-qrcode"></i></button>':'')+'</div><div class="conteos-despliegue26 tz-conteos64">'+conteosPallets(v.pallets)+'<button class="flecha-pallets26" onclick="alternarPallets26(this,\''+v.id+'\')" aria-expanded="'+abierto+'" aria-label="'+(abierto?'Ocultar pallets':'Mostrar pallets')+'"><i class="fa-solid '+(abierto?'fa-chevron-up':'fa-chevron-down')+'"></i></button></div><div class="pallets-viaje26" '+(abierto?'':'hidden')+'>'+v.pallets.map(p=>tarjetaTZ62(p)).join('')+'</div></article>';
  }).join('')+(!vs.length?'<p class="estado-vacio">Sin registros.</p>':'')+'</div>'+pieTZ62(true);
};
const filtroAntes64=filtrarTZ62;
filtrarTZ62=function(q){busquedaTZ62=q;renderTZ62();const input=document.getElementById('cap-buscar-zonas');input?.focus();input?.setSelectionRange(q.length,q.length);};
const versionTZ64=document.querySelector('#view-menu .font-mono');if(versionTZ64)versionTZ64.textContent='QAS - 1.1.64';
