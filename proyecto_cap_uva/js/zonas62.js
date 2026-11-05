/* QAS 1.1.62 — Traslado entre Zonas. Persistencia local y QR autocontenido. */
const tz62=()=>AppState.uva.zonas62||=( {config:null,recojos:[],entregas:[],partes:{},secuencia:0} );
let paginaTZ62='home',hojaTZ62='recepcion',modoTZ62=false,busquedaTZ62='',revisionTZ62=null;
const seleccionTZ62=new Set(),clonarTZ62=x=>JSON.parse(JSON.stringify(x));
const fuenteBaseTZ62=fuenteSecuencia30;
const nombreTZ62=m=>nombreEtapa(m);
const tramoTZ62=(m,c)=>m+'|'+c;
function ocupadoTZ62(m,c){return tz62().recojos.some(r=>r.origen===m&&r.pallets.some(p=>p.codigoQR===c));}
function fuentesTZ62(){
  const c=tz62().config;
  if(!c)return [];
  return AppState.palletsAcopio.flatMap(p=>['gasificado','enfriado','despacho'].flatMap(destino=>{
    const f=fuenteBaseTZ62(p.codigoQR,destino);
    if(!f||ocupadoTZ62(f.modulo,p.codigoQR)||f.modulo==='prepacking'&&!/gasificado|clasificado/i.test(p.destinoInicial||p.destino))return [];
    if(f.viaje.fundo&&f.viaje.fundo!==c.fundo||f.viaje.lugar&&f.viaje.lugar!==c.zona)return [];
    // Una salida tiene un solo destino. Prepacking conserva Gasificado como primera etapa.
    const esperado=f.modulo==='prepacking'?'gasificado':f.modulo==='enfriado'?'despacho':f.origen.destinoSalida;
    return esperado===destino?[{...f,destino}]:[];
  }));
}
function pendientesTZ62(){return tz62().recojos.flatMap(r=>r.pallets.filter(p=>!p.entregaTZ62).map(p=>({r,p})));}
function abrirTZ62(p='home'){
  paginaTZ62=p;hojaTZ62='recepcion';seleccionTZ62.clear();modoTZ62=false;
  closeSidebar('drawer-zonas62');navBaseTZ62('zonas62');renderTZ62();
}
function pieTZ62(resumen){if(!resumen)return '';return '<nav class="tz-tabs62">'+['recepcion','entrega'].map(t=>'<button class="'+(hojaTZ62===t?'activo':'')+'" onclick="tabTZ62(\''+t+'\')">'+(resumen?(t==='recepcion'?'Resumen recepción':'Resumen entrega'):(t==='recepcion'?'Recojo':'Entrega'))+'</button>').join('')+'</nav>';}
function tabTZ62(t){hojaTZ62=t;seleccionTZ62.clear();modoTZ62=false;renderTZ62();}
function tarjetaTZ62(p,check=''){
  return tarjetaUva(p,'zonas',check);
}
function encabezadoTZ62(v){return '<div class="tz-enc62"><b>'+safe(v.numero||v.id)+'</b><span>'+safe(nombreTZ62(v.origen))+' → '+safe(nombreTZ62(v.destino))+'</span></div><p>Entregó: <b>'+safe(v.remitente||'')+'</b><br>Transportista: <b>'+safe(v.transportista||'')+'</b>'+(v.receptor?'<br>Recepcionó: <b>'+safe(v.receptor)+'</b>':'')+'</p>';}
function renderTZ62(){
  const d=tz62(),el=document.getElementById('view-zonas62');if(!el)return;
  let body='';
  if(paginaTZ62==='home')body='<div class="tz-home62"><article><b>'+pendientesTZ62().length+'</b><span>Pendientes de entrega</span></article><article><b>'+d.entregas.filter(v=>v.confirmado).length+'</b><span>Finalizados</span></article></div>';
  if(paginaTZ62==='registro')body='<div class="tz-form62"><label>Fundo<select id="tz-fundo62" onchange="lugaresTZ62()"><option value="">Seleccionar</option>'+Object.keys(acopiosPorFundoCAP).map(f=>'<option '+(d.config?.fundo===f?'selected':'')+'>'+safe(f)+'</option>').join('')+'</select></label><label>Zona de operación / Prepacking<select id="tz-zona62"></select></label><label>Zona de traslado<select id="tz-destino63"><option value="">Seleccionar</option>'+['gasificado','despacho','enfriado'].map(m=>'<option value="'+m+'" '+(d.config?.traslado===m?'selected':'')+'>Traslado a '+nombreRuta63(m)+'</option>').join('')+'</select></label><div class="tz-guardar62"><button onclick="guardarTZ62()">GUARDAR</button></div></div>';
  if(paginaTZ62==='gestion'){
    const xs=pendientesTZ62(),ps=xs.map(x=>x.p),escoger=seleccionTZ62.size;
    body='<div class="tz-herramientas64">'+conteosPallets(ps)+'<div class="tz-acciones64"><button onclick="activarTZ62()" aria-label="Activar selección" aria-pressed="'+modoTZ62+'">☑</button>'+(modoTZ62?'<button onclick="todosTZ62()">Todos</button><button onclick="prepararEntregaTZ62()" aria-label="Generar QR de entrega" '+(!escoger?'disabled':'')+'><i class="fa-solid fa-qrcode"></i></button>':'')+'</div></div>'+xs.slice().reverse().map(({r,p})=>'<div class="tz-tarjeta62 '+(seleccionTZ62.has(p.id)?'seleccionado':'')+'">'+tarjetaTZ62(p,modoTZ62?'<input type="checkbox" aria-label="Seleccionar pallet '+safe(p.codigoQR)+'" '+(seleccionTZ62.has(p.id)?'checked':'')+' onchange="marcarTZ62(\''+p.id+'\',this.checked)">':'')+'<small>'+safe(nombreTZ62(r.origen))+' → '+safe(nombreRuta63(r.destino))+'</small></div>').join('')+(!ps.length?'<p class="estado-vacio">Sin pallets recogidos pendientes de entrega.</p>':'');
  }
  if(paginaTZ62==='resumen'){
    const recepcion=paginaTZ62==='resumen'&&hojaTZ62==='recepcion';
    const vs=(recepcion?d.recojos:d.entregas).filter(v=>JSON.stringify(v).toLowerCase().includes(busquedaTZ62.toLowerCase())).slice().reverse();
    body='<input class="tz-buscar62" aria-label="Filtro rápido" placeholder="Filtro rápido" value="'+safe(busquedaTZ62)+'" oninput="filtrarTZ62(this.value)">'+vs.map(v=>'<article class="tz-viaje62">'+encabezadoTZ62(v)+conteosPallets(v.pallets)+'<div class="tz-barra62"><b>'+safe(recepcion?'RECOGIDO':v.recepcion?'VALIDADO':'EN PROCESO')+'</b>'+(!recepcion&&!v.recepcion?'<button aria-label="Ver QR y detalle" onclick="verEntregaTZ62(\''+v.id+'\')"><i class="fa-solid fa-qrcode"></i></button>':'')+'</div><details open><summary>Detalle de pallets</summary>'+v.pallets.map(p=>tarjetaTZ62(p)).join('')+'</details></article>').join('')+(!vs.length?'<p class="estado-vacio">Sin registros.</p>':'');
  }
  el.innerHTML='<header class="tz-header62"><button onclick="openSidebar(\'drawer-zonas62\')" aria-label="Menú de transferencia entre zonas">☰</button><h2>'+({home:'Traslado entre Zonas',registro:'Registro de traslado',gestion:'Gestión de traslado',resumen:'Resumen de traslados'})[paginaTZ62]+'</h2></header><div class="tz-body62">'+(!['home','registro'].includes(paginaTZ62)?cabeceraResponsable63():'')+body+'</div>'+(['gestion','resumen'].includes(paginaTZ62)?pieTZ62(paginaTZ62==='resumen'):'');
  if(paginaTZ62==='registro')lugaresTZ62();
}
function lugaresTZ62(){const f=document.getElementById('tz-fundo62').value;document.getElementById('tz-zona62').innerHTML='<option value="">Seleccionar</option>'+(acopiosPorFundoCAP[f]||[]).map(z=>'<option '+(tz62().config?.zona===z?'selected':'')+'>'+safe(z)+'</option>').join('');}
function guardarTZ62(){const fundo=document.getElementById('tz-fundo62').value,zona=document.getElementById('tz-zona62').value,traslado=document.getElementById('tz-destino63').value;if(!(acopiosPorFundoCAP[fundo]||[]).includes(zona))return avisoApp('Seleccione fundo y zona.');if(!['gasificado','despacho','enfriado'].includes(traslado))return avisoApp('Seleccione la zona de traslado.');tz62().config={fundo,zona,traslado};guardarLocal();abrirTZ62('gestion');}
function filtrarTZ62(q){busquedaTZ62=q;renderTZ62();const el=document.querySelector('#view-zonas62 .tz-buscar62');el?.focus();el?.setSelectionRange(q.length,q.length);}
function activarTZ62(){modoTZ62=!modoTZ62;seleccionTZ62.clear();renderTZ62();}
function marcarTZ62(id,v){if(v)seleccionTZ62.add(id);else seleccionTZ62.delete(id);renderTZ62();}
function todosTZ62(){const xs=pendientesTZ62(),todos=xs.length&&xs.every(x=>seleccionTZ62.has(x.p.id));seleccionTZ62.clear();if(!todos)xs.forEach(x=>seleccionTZ62.add(x.p.id));renderTZ62();}
function scannerTZ62(op,id=''){
  if(!tz62().config)return avisoApp('Guarde primero fundo y zona.');
  const fs=op==='recojo'?fuentesTZ62():[],vs=op==='confirmacion'?tz62().entregas.filter(v=>!v.confirmado&&(!id||v.id===id)):[];
  const viajes=[...new Map(fs.map(f=>[f.viaje.id,f.viaje])).values()];
  modal40(op==='recojo'?'Recojo · pallet o viaje':'Confirmar entrega',
    '<label>Seleccionar<select id="tz-select62">'+viajes.map(v=>'<option value="'+v.id+'">Viaje '+safe(v.numeroGas60||v.id)+'</option>').join('')+fs.map(f=>'<option value="'+f.origen.codigoQR+'">Pallet '+f.origen.codigoQR+'</option>').join('')+vs.map(v=>'<option value="'+v.id+'">'+v.numero+'</option>').join('')+'</select></label><textarea id="tz-raw62" placeholder="Código o contenido del QR"></textarea>',
    boton40('Simular lectura',"usarScannerTZ62('"+op+"')",!fs.length&&!vs.length?'disabled':'')+boton40('Usar código',"leerTZ62('"+op+"',document.getElementById('tz-raw62').value)")+boton40('Abrir cámara',"camaraTZ62('"+op+"')"));
}
function usarScannerTZ62(op){const id=document.getElementById('tz-select62').value;if(op==='recojo')return leerTZ62(op,id);const v=tz62().entregas.find(v=>v.id===id);if(!v?.recepcion)return avisoApp('Primero recepcione el viaje en '+nombreTZ62(v?.destino)+'.');return leerTZ62(op,JSON.stringify(constanciaTZ62(v)));}
async function camaraTZ62(op){const p=camara40('tz62-'+op);scannerCallback=raw=>leerTZ62(op,raw);await p;}
const leer40AntesTZ62=leer40;
leer40=function(op,raw){if(op.startsWith('tz62-'))return leerTZ62(op.slice(5),raw);return leer40AntesTZ62(op,raw);};
function paqueteTZ62(v,tipo='TZ_ENTREGA_62'){
  return {tipo,id:v.id,numero:v.numero,origen:v.origen,destino:v.destino,remitente:v.remitente,transportista:v.transportista,cierre:v.cierre,config:v.config,pallets:v.pallets.map(p=>({actual:datoPalletGas60(p),pre:datoPalletGas60(AppState.palletsAcopio.find(x=>x.codigoQR===p.codigoQR)||p),gas:registroUva('gasificado').pallets.find(x=>x.codigoQR===p.codigoQR)||null,frio:registroUva('enfriado').pallets.find(x=>x.codigoQR===p.codigoQR)||null}))};
}
function dividirTZ62(a){const s=encodeURIComponent(JSON.stringify(a)),xs=[];for(let i=0;i<s.length;i+=1200)xs.push(s.slice(i,i+1200));return xs.map((datos,parte)=>({tipo:'TZ_PARTE_62',id:a.id,parte,total:xs.length,datos}));}
function unirTZ62(raw){let a;try{a=JSON.parse(raw);}catch{return null;}if(a.tipo==='CAP_GAS_PARTE_60')a={...a,tipo:'TZ_PARTE_62'};if(a.tipo!=='TZ_PARTE_62')return a;
  if(typeof a.id!=='string'||!Number.isInteger(a.total)||a.total<1||a.total>1000||!Number.isInteger(a.parte)||a.parte<0||a.parte>=a.total||typeof a.datos!=='string'||a.datos.length>1200)throw Error('Parte de QR inválida.');
  const r=tz62().partes[a.id]||=( {total:a.total,partes:{}} );if(r.total!==a.total||r.partes[a.parte]&&r.partes[a.parte]!==a.datos)throw Error('Las partes no corresponden al mismo QR.');r.partes[a.parte]=a.datos;guardarLocal();if(Object.keys(r.partes).length<a.total){avisoApp('Leídos '+Object.keys(r.partes).length+' de '+a.total+' QR.');return false;}const completo=JSON.parse(decodeURIComponent(Array.from({length:a.total},(_,i)=>r.partes[i]).join('')));if((completo.id||completo.transferencia)!==a.id)throw Error('Identificador de entrega incorrecto.');return completo;
}
function validarPaqueteTZ62(a){
  if(!a||typeof a.id!=='string'||!/^[-A-Za-z0-9_]{1,150}$/.test(a.id)||!['prepacking','gasificado','enfriado','despacho'].includes(a.origen)||!({prepacking:['gasificado','t2'],gasificado:['enfriado','despacho'],enfriado:['despacho'],despacho:['t2']})[a.origen].includes(a.destino)||!Array.isArray(a.pallets)||!a.pallets.length||a.pallets.length>300)throw Error('Entrega entre zonas inválida.');
  const codes=new Set();for(const x of a.pallets){const p=x.actual;if(!p||!/^\d{11}$/.test(p.codigoQR)||codes.has(p.codigoQR)||!Number.isSafeInteger(p.cant)||p.cant<1||!Array.isArray(p.lineas))throw Error('Datos de pallet inválidos.');codes.add(p.codigoQR);if(!x.pre||x.pre.codigoQR!==p.codigoQR||a.origen==='gasificado'&&(!x.gas?.salida||x.gas.codigoQR!==p.codigoQR)||a.origen==='enfriado'&&(!x.frio?.salida||x.frio.codigoQR!==p.codigoQR))throw Error('Falta la trazabilidad de salida del pallet.');}
}
function importarEntregaTZ62(a){
  validarPaqueteTZ62(a);let v=tz62().entregas.find(v=>v.id===a.id);if(v)return v;
  for(const x of a.pallets){const code=x.actual.codigoQR;const local=a.destino==='t2'?null:registroUva(a.destino).pallets.find(p=>p.codigoQR===code);if(local||entregadoT231(code))throw Error('El pallet ya fue recibido o entregado a T2.');const actual=['despacho','enfriado','gasificado'].find(m=>registroUva(m).pallets.some(p=>p.codigoQR===code));if(actual&&actual!==a.origen)throw Error('El pallet se encuentra en otra etapa.');}
  if(a.pallets.some(x=>tz62().entregas.some(v=>v.origen===a.origen&&v.id!==a.id&&v.pallets.some(p=>p.codigoQR===x.actual.codigoQR))))throw Error('El pallet ya pertenece a otra entrega de traslado.');
  const ps=[];for(const x of a.pallets){let pre=AppState.palletsAcopio.find(p=>p.codigoQR===x.actual.codigoQR);if(!pre){pre={...clonarTZ62(x.pre),id:uid('PALLET-TZ'),estado:'CERRADO'};AppState.palletsAcopio.push(pre);}for(const [m,dato] of [['gasificado',x.gas],['enfriado',x.frio]])if(dato&&!registroUva(m).pallets.some(p=>p.codigoQR===dato.codigoQR))registroUva(m).pallets.push({...clonarTZ62(dato),id:uid('PALLET-TZ')});if(a.origen==='despacho'&&!registroUva('despacho').pallets.some(p=>p.codigoQR===x.actual.codigoQR))registroUva('despacho').pallets.push({...clonarTZ62(x.actual),id:uid('PALLET-TZ')});const p=palletsEtapa(a.origen).find(p=>p.codigoQR===x.actual.codigoQR);ps.push(p);}
  const src=crearTransferenciaCAP(a.origen,ps,a.destino,'AGRUPACION');src.tzId62=a.id;src.salidaAutomatica61=true;if(a.origen==='prepacking')src.envioAutomaticoClasificado59=a.destino!=='t2';
  v={id:a.id,numero:a.numero,origen:a.origen,destino:a.destino,remitente:a.remitente,transportista:a.transportista,cierre:a.cierre,config:a.config,pallets:clonarTZ62(a.pallets.map(x=>x.actual)),viajeOrigen:src.id,recibidos:[],paquete:a};tz62().entregas.push(v);guardarLocal();return v;
}
async function leerTZ62(op,raw){try{
  if(op==='confirmacion'){const a=unirTZ62(raw);if(a===false)return;if(a?.tipo!=='TZ_RECIBIDO_62')return avisoApp('Lea el QR de constancia del destino.');const v=tz62().entregas.find(v=>v.id===a.id);if(!v||a.destino!==v.destino||!a.receptor||!a.hora||!Array.isArray(a.codigos)||a.codigos.length!==v.pallets.length||!v.pallets.every(p=>a.codigos.includes(p.codigoQR)))return avisoApp('Constancia no válida para esta entrega.');Object.assign(v,{receptor:a.receptor,recepcion:a.hora,confirmado:fechaUva()});guardarLocal();cerrar40();renderTZ62();return;}
  let a=unirTZ62(raw);if(a===false)return;
  if(a?.tipo==='CAP_GAS_OFFLINE_60'){importarGas60(a);raw=a.transferencia;}
  if(a?.tipo==='TZ_ORIGEN_62'){validarPaqueteTZ62(a);const local=viajeEntregaV11(a.id.replace(/^ORIGEN-/,''));if(local)raw=local.v.id;else {const v=importarEntregaTZ62(a);raw=v.viajeOrigen;tz62().entregas=tz62().entregas.filter(x=>x.id!==v.id);}}
  const id=a?.transferencia||a?.viaje||raw,fs=fuentesTZ62().filter(f=>f.viaje.id===id||f.origen.codigoQR===id);
  if(!fs.length)return avisoApp('Pallet o viaje no disponible para recojo. Revise la salida del origen y los duplicados.');
  if(fs.some(f=>f.modulo!==fs[0].modulo||f.destino!==fs[0].destino))return avisoApp('El recojo debe tener un solo origen y destino.');
  revisionTZ62=fs;modal40('Confirmar recojo',conteosPallets(fs.map(f=>f.origen))+fs.map(f=>tarjetaTZ62(f.origen)).join(''),boton40('Cancelar','cerrar40()')+boton40('Aceptar','aceptarRecojoTZ62()'));
}catch(e){avisoApp(e.message||'No fue posible leer el QR.');}}
function aceptarRecojoTZ62(){const fs=revisionTZ62;if(!fs?.length)return;const actuales=fuentesTZ62();if(fs.some(f=>!actuales.some(x=>x.modulo===f.modulo&&x.origen.codigoQR===f.origen.codigoQR&&x.viaje.id===f.viaje.id)))return avisoApp('La disponibilidad cambió. Vuelva a leer.');const r={id:uid('RECOJO-TZ'),origen:fs[0].modulo,destino:fs[0].destino,remitente:fs[0].viaje.usuario,transportista:usuarioUva(),hora:fechaUva(),config:clonarTZ62(tz62().config),pallets:fs.map(f=>({...clonarTZ62(f.origen),id:uid('TZ-PALLET'),fuenteId62:f.viaje.id}))};tz62().recojos.push(r);revisionTZ62=null;guardarLocal();cerrar40();paginaTZ62='gestion';hojaTZ62='recepcion';renderTZ62();}
async function prepararEntregaTZ62(){
  const xs=pendientesTZ62().filter(x=>seleccionTZ62.has(x.p.id));if(!xs.length)return avisoApp('Seleccione pallets.');const base=xs[0].r;
  if(xs.some(x=>x.r.origen!==base.origen||x.r.destino!==base.destino))return avisoApp('Seleccione pallets del mismo origen y destino.');
  if(!await confirmarApp('¿Generar entrega de '+xs.length+' pallets a '+nombreTZ62(base.destino)+'?'))return;
  if(xs.some(x=>x.p.entregaTZ62))return avisoApp('Un pallet ya está asignado.');
  const ps=xs.map(x=>palletsEtapa(base.origen).find(p=>p.codigoQR===x.p.codigoQR));if(ps.some(p=>!p))return avisoApp('Revise los pallets de origen.');
  const v=crearTransferenciaCAP(base.origen,ps,base.destino,'AGRUPACION');v.tzId62=uid('TZ');v.salidaAutomatica61=true;if(base.origen==='prepacking')v.envioAutomaticoClasificado59=true;
  const d={id:v.tzId62,numero:'TZ-'+String(++tz62().secuencia).padStart(6,'0'),origen:base.origen,destino:base.destino,remitente:base.remitente,transportista:usuarioUva(),cierre:fechaUva(),config:clonarTZ62(base.config),pallets:xs.map(x=>clonarTZ62(x.p)),viajeOrigen:v.id,recibidos:[]};
  xs.forEach(x=>x.p.entregaTZ62=d.id);d.paquete=paqueteTZ62(d);tz62().entregas.push(d);seleccionTZ62.clear();modoTZ62=false;guardarLocal();renderTZ62();verEntregaTZ62(d.id);
}
function constanciaTZ62(v){return {tipo:'TZ_RECIBIDO_62',id:v.id,destino:v.destino,receptor:v.receptor,hora:v.recepcion,codigos:v.pallets.map(p=>p.codigoQR)};}
// El QR del origen también lleva la carga para el recojo en otro equipo sin conexión.
function verOrigenTZ62(id,pagina=0){
  const dato=viajeEntregaV11(id);if(!dato)return;
  const v=dato.v,ps=palletsEtapa(dato.m).filter(p=>perteneceViaje38(v,p));
  const carga=paqueteTZ62({id:'ORIGEN-'+v.id,numero:v.numeroGas60||v.id,origen:dato.m,destino:v.destino,remitente:v.usuario,cierre:v.cierre,config:registroUva(dato.m).config,pallets:ps},'TZ_ORIGEN_62');
  const partes=dividirTZ62(carga);pagina=Math.max(0,Math.min(pagina,partes.length-1));
  modal40('QR para recojo entre zonas','<b>'+safe(carga.numero)+'</b><p>'+safe(nombreTZ62(carga.origen))+' → '+safe(nombreTZ62(carga.destino))+'</p><div id="tz-origenqr62" class="qr-centro"></div>'+(partes.length>1?'<p>QR '+(pagina+1)+' de '+partes.length+'</p>':'')+conteosPallets(ps)+ps.map(p=>tarjetaTZ62(p)).join(''),(pagina?boton40('Anterior',"verOrigenTZ62('"+id+"',"+(pagina-1)+")"):'')+(pagina<partes.length-1?boton40('Siguiente',"verOrigenTZ62('"+id+"',"+(pagina+1)+")"):'')+boton40('Cerrar','cerrar40()'));
  generarQR('tz-origenqr62',partes[pagina]);
}
const comprobanteAntesTZ62=abrirComprobanteV11;
abrirComprobanteV11=function(id){const dato=viajeEntregaV11(id);if(dato&&['prepacking','gasificado','enfriado'].includes(dato.m)&&['gasificado','enfriado','despacho'].includes(dato.v.destino)&&!dato.v.tzId62)return verOrigenTZ62(id);return comprobanteAntesTZ62(id);};
function verEntregaTZ62(id,pagina=0,constancia=false){const v=tz62().entregas.find(v=>v.id===id);if(!v)return;const a=constancia?constanciaTZ62(v):v.paquete,partes=dividirTZ62(a);pagina=Math.max(0,Math.min(pagina,partes.length-1));modal40(constancia?'Constancia de recepción':'QR de entrega entre zonas',encabezadoTZ62(v)+'<div id="tz-qr62" class="qr-centro"></div>'+(partes.length>1?'<p>QR '+(pagina+1)+' de '+partes.length+'. Lea todas las partes.</p>':'')+conteosPallets(v.pallets)+v.pallets.map(p=>tarjetaTZ62(p)).join(''),(pagina?boton40('Anterior',"verEntregaTZ62('"+id+"',"+(pagina-1)+","+constancia+")"):'')+(pagina<partes.length-1?boton40('Siguiente',"verEntregaTZ62('"+id+"',"+(pagina+1)+","+constancia+")"):'')+(v.recepcion&&!constancia?boton40('Constancia QR',"verEntregaTZ62('"+id+"',0,true)"):'')+boton40('Cerrar','cerrar40()'));generarQR('tz-qr62',partes[pagina]);}

// El destino recibe la entrega publicada por el transportista, conservando la recepción habitual.
fuenteSecuencia30=function(raw,m){const f=fuenteBaseTZ62(raw,m);if(!f)return null;const r=tz62().recojos.find(r=>r.origen===f.modulo&&r.pallets.some(p=>p.codigoQR===f.origen.codigoQR));if(!r)return f;const d=tz62().entregas.find(v=>v.origen===f.modulo&&v.destino===m&&v.pallets.some(p=>p.codigoQR===f.origen.codigoQR)&&v.viajeOrigen===f.viaje.id);return d?f:null;};
fuentePalletV11=fuenteSecuencia30;
const lecturaAntesTZ62=leerPalletUva;
leerPalletUva=async function(m,op,raw){let a;try{a=JSON.parse(raw);}catch{}if(['TZ_ENTREGA_62','TZ_PARTE_62'].includes(a?.tipo)){
  if(!['ingreso','recepcion'].includes(op)||!validarUbicacion36(m))return;
  try{a=unirTZ62(raw);if(a===false)return;if(a?.tipo!=='TZ_ENTREGA_62'||a.destino!==m)return avisoApp('El QR pertenece a otro destino.');const v=importarEntregaTZ62(a);return lecturaAntesTZ62(m,op,v.viajeOrigen);}catch(e){return avisoApp(e.message);}}
  return lecturaAntesTZ62(m,op,raw);
};
const registrarAntesTZ62=registrarRecepcionV11;
registrarRecepcionV11=function(m,p,viaje){registrarAntesTZ62(m,p,viaje);const d=tz62().entregas.find(v=>v.id===viaje?.tzId62);if(!d)return;d.recibidos||=[];if(!d.recibidos.includes(p.codigoQR))d.recibidos.push(p.codigoQR);if(d.pallets.every(x=>d.recibidos.includes(x.codigoQR))){d.receptor=usuarioUva();d.recepcion=fechaUva();}guardarLocal();};
const aceptarAntesTZ62=aceptarRevision37;
aceptarRevision37=function(id){const r=revisionesViaje37.get(id),tz=r?.viaje?.tzId62;const resultado=aceptarAntesTZ62(id);const d=tz62().entregas.find(v=>v.id===tz);if(d?.recepcion)verEntregaTZ62(tz,0,true);return resultado;};
const camaraAntesTZ62=camaraUva;
camaraUva=function(m,op){camaraAntesTZ62(m,op);if(!['ingreso','recepcion'].includes(op))return;const vs=tz62().entregas.filter(v=>v.destino===m&&!v.recepcion);document.getElementById('uva-lista-prueba')?.insertAdjacentHTML('afterbegin',vs.map(v=>'<option value="'+v.viajeOrigen+'">'+v.numero+' · '+v.pallets.length+' pallets</option>').join(''));if(vs.length)document.getElementById('uva-simular').disabled=false;};

const registrosAntesTZ62=registrosEnvio45;
registrosEnvio45=function(m){return m==='zonas'?tz62().recojos.concat(tz62().entregas):registrosAntesTZ62(m);};
const navBaseTZ62=navTo;
const vistaTZ62=document.createElement('section');vistaTZ62.id='view-zonas62';vistaTZ62.className='app-screen hidden tz-modulo62';document.getElementById('app-shell').appendChild(vistaTZ62);
const drawerTZ62=document.createElement('div');drawerTZ62.id='drawer-zonas62';drawerTZ62.className='hidden overlay-local uva-drawer tz-drawer62';drawerTZ62.onclick=()=>closeSidebar('drawer-zonas62');drawerTZ62.innerHTML='<nav onclick="event.stopPropagation()"><h2>Traslado entre Zonas</h2><button onclick="abrirTZ62(\'home\')">⌂ Home</button><button onclick="operacionTZ62(\'maestra\')">☁ Data maestra</button><button onclick="abrirTZ62(\'registro\')">▤ Registro de traslado</button><button onclick="abrirTZ62(\'gestion\')">☑ Gestión de traslado</button><button onclick="abrirTZ62(\'resumen\')">▥ Resumen de traslados</button><button onclick="operacionTZ62(\'envio\')">➤ Enviar información</button><button onclick="closeSidebar(\'drawer-zonas62\');navTo(\'menu\')">← Menú principal</button></nav>';document.getElementById('app-shell').appendChild(drawerTZ62);
function operacionTZ62(op){closeSidebar('drawer-zonas62');modal40(op==='maestra'?'Data maestra · Traslado entre Zonas':'Enviar información · Traslado entre Zonas',operacionHTML44('zonas',op).replace('>zonas<','>Traslado entre Zonas<').replace('--color-op44:#6b118c','--color-op44:#3949ab'),boton40('Cerrar','cerrar40()'));}
document.getElementById('menu-modulos').insertAdjacentHTML('beforeend','<button class="nuevo-modulo tz-menu62" onclick="abrirTZ62()"><i class="fa-solid fa-truck-ramp-box"></i> TRASLADO ENTRE ZONAS</button>');
const versionTZ62=document.querySelector('#view-menu .font-mono');if(versionTZ62)versionTZ62.textContent='QAS - 1.1.62';
tz62();guardarLocal();
