/* QAS 1.1.46. Cerrar una entrega publica su QR; el siguiente módulo la recibe.
 * La lectura simulada usa exactamente el mismo código de viaje que la cámara.
 */
// Ya no se incorpora un viaje T2 automáticamente desde el módulo remitente.
recepcionarEntregaT2CAP=async function(){avisoApp('La entrega está disponible para recibirla desde Transporte Externo → Nuevo recojo.');};
const comprobanteAntes46=abrirComprobanteV11;
abrirComprobanteV11=function(id){comprobanteAntes46(id);const dato=viajeEntregaV11(id);if(!['prepacking','despacho'].includes(dato?.m))return;document.querySelectorAll('#cap-detalle button').forEach(b=>{const a=b.getAttribute('onclick')||'';if(/continuarT2DesdeQR14|confirmarT2PreCAP|simularConfirmacionT2Uva/.test(a))b.remove();});};
viajesCamara41=function(){return disponibles40().map(x=>x.v);};
const selectorAntes46=selector40;
selector40=function(op){if(op!=='recojo')return selectorAntes46(op);const vs=viajesCamara41();modal40('Recepción de viaje · T2',`<label>Viaje<select id="log-select40">${vs.map(v=>`<option value="${safe(v.id)}">Viaje ${safe(v.id)} · ${v.cant||0} jabas</option>`).join('')}</select></label><input id="log-codigo40" placeholder="Código o contenido del QR de entrega"><p>${vs.length?'Seleccione el código del viaje para simular su lectura o abra la cámara.':'No hay entregas disponibles para recepción. Cierre el viaje de transferencia en pre-packing o despacho.'}</p>`,boton40('Simular lectura',"usarSelector40('recojo',true)",vs.length?'':'disabled')+boton40('Usar código',"usarSelector40('recojo',false)")+boton40('Abrir cámara',"camara40('recojo')"));document.getElementById('log-select40').value=vs[0]?.id||'';};
revisarRecojo40=function(id){const t=actual40(),dato=disponibles40().find(x=>x.v.id===id);if(!t)return avisoApp('Inicie primero un nuevo viaje en Transporte Externo.');if(t.entrega||!dato)return avisoApp('Este viaje ya fue recepcionado o no está disponible para T2.');const ps=psOrigen40(dato.m,dato.v);if(!ps.length||ps.some(p=>t.pallets.some(x=>x.codigoQR===p.codigoQR)))return avisoApp('El viaje contiene pallets ya recepcionados.');log40().revision={t2:t.id,origenId:id,m:dato.m,pallets:copia40(ps),fase:'revision'};guardarLocal();mostrarRecojo40();};
mostrarRecojo40=function(){const r=log40().revision;if(!r)return;modal40('Recepción de viaje · T2',cabeceraRecojo43(r)+r.pallets.map((p,i)=>tarjeta40(p)+`<label>Jabas<input type="number" min="1" step="1" id="log-cant40-${i}" value="${p.cant}"></label>`).join('')+conteosPallets(r.pallets),boton40('RECEPCIONAR VIAJE','confirmarRecojo40()'));};
confirmarRecojo40=async function(){const r=log40().revision;if(!r||r.fase!=='revision'||confirmandoRecojo43)return;const ns=r.pallets.map((p,i)=>Number(document.getElementById('log-cant40-'+i).value));if(ns.some(n=>!Number.isSafeInteger(n)||n<1))return avisoApp('Ingrese cantidades enteras positivas.');confirmandoRecojo43=true;try{if(!await confirmarApp(`¿Recepcionar ${r.pallets.length} pallets y ${ns.reduce((a,b)=>a+b,0)} contenedores?`))return;if(log40().revision!==r||r.fase!=='revision')return;r.pallets.forEach((p,i)=>ajustarCantidadPallet(p,ns[i]));r.fase='qr';aceptarRecojo40(r.origenId);if(!log40().revision)avisoApp('Viaje recepcionado correctamente en Transporte Externo.');}finally{confirmandoRecojo43=false;}};
// Publicar la entrega no abre Planta ni registra su recepción.
entrega40=async function(id){const v=viaje40(id);if(!v?.pallets.length)return avisoApp('Registre un recojo antes de entregar.');if(entregando44)return;entregando44=true;try{if(!v.entrega){if(!await confirmarApp(`¿Generar entrega de ${v.pallets.length} pallets y ${suma(v.pallets)} contenedores a Planta?`))return;v.entrega=fechaUva();guardarLocal();}modal40('QR de entrega a Planta',encabezado40(v)+'<div id="log-qr40" class="qr-centro qr-grande46"></div>'+totales40(v.pallets)+v.pallets.map(p=>tarjeta40(p)).join(''),boton40('CONTINUAR','cerrar40()'));generarQR('log-qr40',{tipo:'ENTREGA_T2_PLANTA',viaje:v.id,pallets:v.pallets.map(p=>({qr:p.codigoQR,cant:p.cant}))});}finally{entregando44=false;}};
abrirPlantaDesde40=function(){avisoApp('Ingrese a Planta → Recepción Planta y seleccione el viaje desde la cámara.');};
// La cámara de cada pallet ofrece cantidad editable y apertura de cámara real.
tarjetaPlanta44=function(v,p){const r=recibidos44(v).find(x=>x.codigoQR===p.codigoQR),dato=r||p;return `<div class="planta-pallet44 ${r?'verde44':'rojo44'}">${tarjeta40(dato,true,r?'<b class="planta-confirmado44">✓ CONFIRMADO</b>':boton40('<i class="fa-solid fa-camera"></i>',`opcionesPallet46('${v.id}','${p.codigoQR}')`,'class="camara-pallet46" aria-label="Lecturar este pallet"'))}</div>`;};
function opcionesPallet46(id,code){confirmarPallet40(id,code);const v=viaje40(id);if(!v||recibidos44(v).some(r=>r.codigoQR===code))return;const pie=document.querySelector('#log-modal40 footer');pie?.insertAdjacentHTML('afterbegin',boton40('<i class="fa-solid fa-camera"></i> Abrir cámara',`camaraPallet46('${id}','${code}')`));}
let palletEsperado46=null;
function camaraPallet46(id,code){palletEsperado46={id,code};camara40('pallet-planta46');}
const leerAntes46=leer40;
leer40=function(op,raw){if(op!=='pallet-planta46')return leerAntes46(op,raw);const p=palletEsperado46;palletEsperado46=null;if(!p||idQR40(raw)!==p.code)return avisoApp('El QR no corresponde al pallet seleccionado.');confirmarPallet40(p.id,p.code);};
const detalleAntes46=detallePlanta40;
detallePlanta40=async function(id){await detalleAntes46(id);document.getElementById('log-qr40')?.classList.add('qr-grande46');};
// El botón del viaje es más visible; solo está disponible al completar los pallets.
const listaPlantaAntes46=listaPlanta44;
listaPlanta44=function(){listaPlantaAntes46();document.querySelectorAll('#planta-lista44 button[aria-label="Abrir QR de confirmación del viaje"]').forEach(b=>b.classList.add('qr-viaje46'));};
const version46=document.querySelector('#view-menu .font-mono');if(version46)version46.textContent='QAS - 1.1.46';
guardarLocal();
