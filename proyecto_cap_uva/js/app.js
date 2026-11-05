/**
 * LÓGICA ESTRUCTURAL: COSECHA, TRANSPORTE INTERNO Y ACOPIO
 */

const AppState = {
  currentView: 'menu',
  cultivoSeleccionado: 'Uva',
  contenedorRegistro: 'J1-JABA UVA 8 G',
  tabCosechaJaba: 'JABA',
  acopioSubtab: 'recepcion',

  // Inicio sin datos operativos de demostración.
  jabasCosecha: [],
  viajesAcopio: [],
  palletsAcopio: [],

  palletEnCierreId: null,
  camaraGenericaCallback: null
};

const CULTIVOS = ['Arándano', 'Caqui', 'Cereza', 'Limón', 'Mandarina', 'Mango', 'Palta', 'Pitahaya', 'Uva'];

document.addEventListener('DOMContentLoaded', () => {
  renderDespachoCosecha();
  renderViajesRecepcionAcopio();
  renderPalletsEnProceso();
  renderPalletsCerradosTransferencia();
  renderResumenAcopio();
  renderModalCultivo();
  iniciarReloj();
});

function navTo(screenId) {
  document.querySelectorAll('.app-screen').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`view-${screenId}`);
  if (target) {
    target.classList.remove('hidden');
    AppState.currentView = screenId;
    document.querySelectorAll('[id^="drawer-"]').forEach(x=>x.classList.add('hidden'));
    if(screenId==='cosecha-resumen') renderResumenDespachos();
    window.scrollTo(0, 0);
  }
}

// CONTROL DE DRAWERS LATERALES DESLIZANTES
function openSidebar(id) {
  const sb = document.getElementById(id);
  if (sb) sb.classList.remove('hidden');
}

function closeSidebar(id) {
  const sb = document.getElementById(id);
  if (sb) sb.classList.add('hidden');
}

function toggleMenu(id) {
  const menu = document.getElementById(id);
  if (menu) menu.classList.toggle('hidden');
}

function iniciarReloj() {
  function updateTime() {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const clock = document.getElementById('live-clock');
    if (clock) clock.innerText = `${hrs}:${mins}`;
  }
  updateTime();
  setInterval(updateTime, 30000);
}

// =======================================================
//                  MÓDULO COSECHA
// =======================================================

function openModalCultivo() {
  document.getElementById('cosecha-popover').classList.add('hidden');
  document.getElementById('modal-cultivo').classList.remove('hidden');
}

function closeModalCultivo() {
  document.getElementById('modal-cultivo').classList.add('hidden');
}

function renderModalCultivo() {
  const c = document.getElementById('lista-cultivos-modal');
  if (!c) return;
  c.innerHTML = '';
  CULTIVOS.forEach(cul => {
    const isSel = cul === AppState.cultivoSeleccionado;
    const btn = document.createElement('button');
    btn.className = `w-full p-2.5 rounded-xl border text-left flex justify-between items-center ${isSel ? 'border-amber-500 bg-amber-50 font-bold text-amber-900' : 'bg-white'}`;
    btn.innerHTML = `<span>${cul}</span>${isSel ? '<i class="fa-solid fa-circle-check text-amber-500"></i>' : ''}`;
    btn.onclick = () => {
      AppState.cultivoSeleccionado = cul;
      document.getElementById('lbl-cosecha-cultivo').innerText = cul;
      closeModalCultivo();
      renderModalCultivo();
    };
    c.appendChild(btn);
  });
}

async function confirmarAsociarCaseta() {
  document.getElementById('cosecha-popover').classList.add('hidden');
  if (await confirmarApp('¿Seguro que quieres asociar una nueva caseta?')) {
    document.getElementById('lbl-titulo-camara-generica').innerText = 'Asociar Caseta';
    AppState.camaraGenericaCallback = () => {
      document.getElementById('lbl-cosecha-caseta').innerText = '0010062190101';
      document.getElementById('lbl-cosecha-jabero').innerText = 'MARIA MERCEDES ADANAQUE CRISANTO';
      avisoApp('Caseta asociada con éxito: 0010062190101\\nJabero: MARIA MERCEDES ADANAQUE CRISANTO');
    };
    document.getElementById('modal-camara-generica').classList.remove('hidden');
  }
}

function openModalSelectorContenedor() {
  document.getElementById('modal-selector-contenedor').classList.remove('hidden');
}

function closeModalSelectorContenedor() {
  document.getElementById('modal-selector-contenedor').classList.add('hidden');
}

function seleccionarContenedorRegistro(nom) {
  AppState.contenedorRegistro = nom;
  document.getElementById('lbl-contenedor-seleccionado').innerText = nom;
  closeModalSelectorContenedor();
}

function iniciarCapturaCosecha() {
  navTo('cosecha-capturar');
  actualizarMetricasCapturaCosecha();
}

function setTabJaba(tipo) {
  AppState.tabCosechaJaba = tipo;
  const t1 = document.getElementById('tab-cosecha-entera');
  const t2 = document.getElementById('tab-cosecha-media');
  if (tipo === 'JABA') {
    t1.className = 'flex-1 py-2.5 text-amber-600 border-b-2 border-amber-500 font-bold';
    t2.className = 'flex-1 py-2.5 text-gray-500 border-b-2 border-transparent font-bold';
  } else {
    t2.className = 'flex-1 py-2.5 text-amber-600 border-b-2 border-amber-500 font-bold';
    t1.className = 'flex-1 py-2.5 text-gray-500 border-b-2 border-transparent font-bold';
  }
}

function simularEscanerFotocheck(cod, nom) {
  const tipoCont = AppState.contenedorRegistro.includes('J2') ? 'J2' : 'J1';
  const nuevaJaba = {
    id: Date.now(),
    tipo: tipoCont,
    trabajador: nom,
    codigo: cod,
    sel: false
  };
  AppState.jabasCosecha.push(nuevaJaba);
  document.getElementById('lbl-ultimo-codigo-cosecha').innerText = cod;
  document.getElementById('badge-cod-trabajador').innerText = cod;

  actualizarMetricasCapturaCosecha();
  renderDespachoCosecha();

  reproducirVoz(`${AppState.jabasCosecha.length} jaba Sweet Globe`);
}

function reproducirVoz(texto) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-ES';
    speechSynthesis.speak(u);
  }
}

function simularErrorJaberoActivo() {
  avisoApp('Lectura no permitida\\nEl trabajador (MARIA MERCEDES ADANAQUE CRISANTO) pertenece a una planilla de JABERO activa');
}

async function limpiarLecturas() {
  if (await confirmarApp('¿Desea limpiar las lecturas capturadas?')) {
    AppState.jabasCosecha = [];
    actualizarMetricasCapturaCosecha();
    renderDespachoCosecha();
  }
}

function actualizarMetricasCapturaCosecha() {
  const tot = AppState.jabasCosecha.length;
  document.getElementById('badge-total-cosecha').innerText = tot;
  document.getElementById('badge-kilos-cosecha').innerText = (tot * 8).toFixed(2);
}

// DESPACHO COSECHA (8 LÍNEAS + BOTÓN PEQUEÑO CAMBIAR FORMATO)
function renderDespachoCosecha() {
  const c = document.getElementById('lista-despacho-cosecha');
  const exp = document.getElementById('lbl-cosecha-total-exp');
  if (!c) return;
  c.innerHTML = '';
  if (exp) exp.innerText = AppState.jabasCosecha.length;

  AppState.jabasCosecha.slice().reverse().forEach(j => {
    const card = document.createElement('div');
    card.className = `bg-white p-3 rounded-xl border flex items-center justify-between shadow-sm transition ${j.sel ? 'border-amber-500 bg-amber-50/50' : 'border-gray-200'}`;
    card.innerHTML = `
      <div class="flex items-center space-x-3">
        <input type="checkbox" onchange="toggleSelectCosecha(${j.id}, this.checked)" ${j.sel ? 'checked' : ''} class="w-4 h-4 rounded text-amber-500">
        <div class="text-xs">
          <p class="font-bold text-gray-800">${j.tipo}-JABA UVA 8 G SWEET GLOBE EXPORTABLE</p>
          <span class="text-[10px] text-gray-400 font-mono">CONVENCIONAL 1.0/1.0 - ${j.trabajador}</span>
        </div>
      </div>
      <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">C</div>
    `;
    c.appendChild(card);
  });

  const selCount = AppState.jabasCosecha.filter(x => x.sel).length;
  const qrBtn=document.getElementById('btn-generar-qr');if(qrBtn) qrBtn.disabled=selCount===0;
  const btnSmall = document.getElementById('btn-cambiar-formato-small');
  const lblCount = document.getElementById('lbl-cosecha-sel-count');
  if (btnSmall && lblCount) {
    if (selCount > 0) {
      btnSmall.classList.remove('hidden');
      lblCount.innerText = selCount;
    } else {
      btnSmall.classList.add('hidden');
    }
  }
}

function toggleSelectCosecha(id, chk) {
  const item = AppState.jabasCosecha.find(x => x.id === id);
  if (item) item.sel = chk;
  renderDespachoCosecha();
}

function toggleSelectAllCosecha(chk) {
  AppState.jabasCosecha.forEach(x => x.sel = chk);
  renderDespachoCosecha();
}

// VENTANITA MODAL: CAMBIAR CONTENEDOR
function openModalCambiarContenedor() {
  const selCount = AppState.jabasCosecha.filter(x => x.sel).length;
  if (selCount === 0) return;
  document.getElementById('lbl-modal-count-jabas').innerText = selCount;
  document.getElementById('modal-cambiar-contenedor-cosecha').classList.remove('hidden');
}

function closeModalCambiarContenedor() {
  document.getElementById('modal-cambiar-contenedor-cosecha').classList.add('hidden');
}

function aplicarCambioContenedorCosecha() {
  const nuevo = document.getElementById('sel-tipo-contenedor-modal').value;
  AppState.jabasCosecha.forEach(x => {
    if (x.sel) {
      x.tipo = nuevo;
      x.sel = false;
    }
  });
  const chkAll = document.getElementById('chk-cosecha-todo');
  if (chkAll) chkAll.checked = false;

  closeModalCambiarContenedor();
  renderDespachoCosecha();
  avisoApp(`Formato actualizado a ${nuevo} para las jabas seleccionadas.`);
}

async function solicitarGenerarBoletaCosecha() {
  const seleccion=AppState.jabasCosecha.filter(x=>x.sel);
  if(!seleccion.length) return avisoApp('Seleccione al menos una línea para generar la boleta.');
  if(!await confirmarApp(`¿Generar la boleta de cosecha?\nJabas seleccionadas: ${seleccion.length}\nParcela: PARCELA 800 | Lote: L11000`)) return;
  const b={id:'B-'+Date.now(),hora:horaActual(),items:seleccion.map(x=>({...x,sel:false})),estado:'PENDIENTE',viaje:null};
  AppState.boletasCosecha ||= [];
  AppState.boletasCosecha.push(b);
  AppState.jabasCosecha=AppState.jabasCosecha.filter(x=>!seleccion.includes(x));
  AppState.boletaActual=b;renderDespachoCosecha();mostrarBoleta(b.id);
}

function confirmarBoletaYPasarAResumen() {
  navTo('cosecha-resumen');
}

function sincronizarVinculacionCosecha() {
  avisoApp('Las boletas se muestran con su estado actual. La vinculación con viajes reales requiere conectar Transporte Interno.');
}

// =======================================================
//             MÓDULO TRANSPORTE INTERNO
// =======================================================

async function confirmarIniciarViajeTransporte() {
  if (await confirmarApp('¿Seguro que quiere iniciar un nuevo viaje?\\nFundo: AGRICULTOR\\nAcopio: ACOPIO 64\\nPlaca: BFJ788')) {
    navTo('transporte-viaje-detalle');
    switchTabTransporte('recojo');
  }
}

function switchTabTransporte(tab) {
  const b1 = document.getElementById('btn-tab-recojo-t');
  const b2 = document.getElementById('btn-tab-entrega-t');
  const p1 = document.getElementById('panel-recojo-t');
  const p2 = document.getElementById('panel-entrega-t');
  if (tab === 'recojo') {
    b1.className = 'bg-[#6B118C] text-white py-2.5 rounded-xl text-xs font-bold shadow';
    b2.className = 'bg-white text-purple-800 border py-2.5 rounded-xl text-xs font-bold';
    p1.classList.remove('hidden');
    p2.classList.add('hidden');
  } else {
    b2.className = 'bg-[#6B118C] text-white py-2.5 rounded-xl text-xs font-bold shadow';
    b1.className = 'bg-white text-purple-800 border py-2.5 rounded-xl text-xs font-bold';
    p2.classList.remove('hidden');
    p1.classList.add('hidden');
  }
}

function abrirModalOpcionesRecojoTransporte() {
  document.getElementById('modal-opciones-recojo-t').classList.remove('hidden');
}

function cerrarModalOpcionesRecojoTransporte() {
  document.getElementById('modal-opciones-recojo-t').classList.add('hidden');
}

function iniciarRecojoPorQRTransporte(tipo) {
  cerrarModalOpcionesRecojoTransporte();
  document.getElementById('lbl-titulo-camara-generica').innerText = tipo === 'caseta' ? 'Escanear QR Caseta' : 'Escanear QR Jabero';
  AppState.camaraGenericaCallback = () => navTo('transporte-recojo-manual');
  document.getElementById('modal-camara-generica').classList.remove('hidden');
}

async function confirmarRecepcionTransporteFinal() {
  if (await confirmarApp('CONFIRMACIÓN\\n¿Seguro que quieres confirmar la recepción de 2 contenedores?')) {
    navTo('transporte-qr');
    document.getElementById('lbl-titulo-qr-transporte').innerText = 'Transporte de Materia Prima';
    document.getElementById('lbl-subtitulo-qr-transporte').innerText = 'QR DE CONFIRMACIÓN';
    const qr = document.getElementById('qrcode-transporte');
    qr.innerHTML = '';
    new QRCode(qr, { text: 'TRANSPORTE|RECOJO|TOTAL:2', width: 160, height: 160 });
  }
}

function continuarDespuesDeQRTransporte() {
  navTo('transporte-viaje-detalle');
  switchTabTransporte('entrega');
}

async function confirmarEntregaEnAcopioTransporte() {
  if (await confirmarApp('CONFIRMACIÓN\\n¿Seguro que quieres realizar la entrega de 2 Contenedores en ACOPIO 64?')) {
    navTo('transporte-qr');
    document.getElementById('lbl-titulo-qr-transporte').innerText = 'Entrega de Contenedores';
    document.getElementById('lbl-subtitulo-qr-transporte').innerText = 'QR DE ENTREGA A ACOPIO';
    const qr = document.getElementById('qrcode-transporte');
    qr.innerHTML = '';
    new QRCode(qr, { text: 'ENTREGA|ACOPIO64|TOTAL:2', width: 160, height: 160 });
  }
}

// =======================================================
//                  MÓDULO ACOPIO
// =======================================================

function switchSubtabAcopio(tab) {
  AppState.acopioSubtab = tab;
  ['recepcion', 'paletizado', 'transferencia'].forEach(t => {
    const el = document.getElementById(`subview-acopio-${t}`);
    const b = document.getElementById({recepcion:'tab-acopio-recep',paletizado:'tab-acopio-palet',transferencia:'tab-acopio-transf'}[t]);
    if (t === tab) {
      el.classList.remove('hidden');
      if (b) b.className = 'flex flex-col items-center text-purple-700 py-1 font-bold';
    } else {
      el.classList.add('hidden');
      if (b) b.className = 'flex flex-col items-center hover:text-purple-700 py-1 font-medium';
    }
  });

  if (tab === 'paletizado') renderPalletsEnProceso();
  if (tab === 'transferencia') renderPalletsCerradosTransferencia();
}

function buscarSupervisorAcopio() {
  const val = document.getElementById('acopio-cod-supervisor').value.trim();
  if (val === '621902') {
    document.getElementById('acopio-lbl-supervisor').innerText = 'MARJENN GLORICEL CHAVARRI LOPEZ';
    avisoApp('Supervisor encontrado: MARJENN GLORICEL CHAVARRI LOPEZ');
  } else {
    avisoApp('Código no registrado. Ingrese 621902 para la prueba.');
  }
}

async function guardarRegistroAcopioFinal() {
  if (await confirmarApp('¿Seguro que quiere realizar el registro?')) {
    avisoApp('Registro de acopio guardado con éxito.');
    navTo('acopio-home');
  }
}

function renderViajesRecepcionAcopio() {
  const c = document.getElementById('lista-viajes-acopio-recep');
  if (!c) return;
  c.innerHTML = '';
  let countSel = 0;

  AppState.viajesAcopio.forEach(v => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-xs';
    card.innerHTML = `
      <div class="bg-gray-100 p-2.5 border-b flex justify-between items-start text-[11px]">
        <div>
          <p class="font-bold text-gray-800">Viaje: <span class="font-mono text-gray-600">${v.id.substring(0, 16)}...</span></p>
          <p class="text-gray-500 text-[10px]">Conductor: ${v.conductor} | Placa: ${v.placa}</p>
        </div>
        <div class="text-right">
          <span class="bg-purple-100 text-purple-800 font-extrabold px-2 py-0.5 rounded text-[10px]">${v.items.reduce((a,i)=>a+i.cant,0)} 📦</span>
          <span class="block text-[10px] font-bold text-rose-600 mt-0.5">Temp: ${v.temperatura}°C</span>
        </div>
      </div>
      <div class="p-2.5 space-y-1.5" id="cont-viaje-${v.id}"></div>
    `;

    const sub = card.querySelector(`#cont-viaje-${v.id}`);
    v.items.filter(it=>it.cant>0).forEach(it => {
      if (it.sel) countSel++;
      const div = document.createElement('div');
      div.className = `p-2 rounded-xl border flex items-center justify-between transition ${it.sel ? 'border-purple-600 bg-purple-50/60' : 'border-gray-200 bg-white'}`;
      div.innerHTML = `
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" onchange="toggleCheckItemAcopio('${v.id}', ${it.id}, this.checked)" ${it.sel ? 'checked' : ''} class="w-4 h-4 rounded text-purple-600">
          <div>
            <p class="font-bold text-gray-800 text-[11px]">${it.cant} ${it.formato}-JABA UVA 8 G SWEET GLOBE</p>
            <span class="text-[9px] text-gray-400 font-mono">CONVENCIONAL (1.0/1.0)</span>
          </div>
        </div>
        <div class="w-5 h-5 rounded-full ${it.sel ? 'bg-purple-600 text-white' : 'bg-emerald-100 text-emerald-700'} flex items-center justify-center text-[10px] font-bold">
          ${it.sel ? '<i class="fa-solid fa-check text-[10px]"></i>' : 'C'}
        </div>
      `;
      sub.appendChild(div);
    });

    c.appendChild(card);
  });

  const menu = document.getElementById('menu-flotante-acopio');
  const lbl = document.getElementById('lbl-acopio-sel-count');
  if (menu && lbl) {
    if (countSel > 0) {
      menu.classList.remove('hidden');
      lbl.innerText = countSel;
    } else {
      menu.classList.add('hidden');
    }
  }
}

function toggleCheckItemAcopio(vid, iid, chk) {
  const v = AppState.viajesAcopio.find(x => x.id === vid);
  if (v) {
    const it = v.items.find(x => x.id === iid);
    if (it) it.sel = chk;
  }
  renderViajesRecepcionAcopio();
}

async function abrirScannerRecepcionAcopio() {
  if (!await confirmarApp('Simular un nuevo QR de viaje de Transporte Interno')) return;
  AppState.recepcionPendienteId = 'BFJ788-' + Date.now();
  document.getElementById('input-acopio-temp').value='';
  document.querySelector('#view-acopio-confirmar-recep .font-mono').textContent=AppState.recepcionPendienteId;
  recalcularTotalRecepAcopio(); navTo('acopio-confirmar-recep');
}

function recalcularTotalRecepAcopio() {
  const j2 = parseInt(document.getElementById('inp-recep-j2').value) || 0;
  const j1 = parseInt(document.getElementById('inp-recep-j1').value) || 0;
  document.getElementById('lbl-total-recep-acopio').innerText = j2 + j1;
}

async function confirmarRecepcionAcopioFinal() {
  const raw = document.getElementById('input-acopio-temp').value.trim();
  const temp = Number(raw);
  const j1 = Number(document.getElementById('inp-recep-j1').value);
  const j2 = Number(document.getElementById('inp-recep-j2').value);
  if (!raw || !Number.isFinite(temp)) return avisoApp('Registre la temperatura del viaje antes de confirmar.');
  if (![j1,j2].every(n => Number.isInteger(n) && n >= 0) || j1+j2 === 0) return avisoApp('Ingrese cantidades enteras válidas.');
  if (!AppState.recepcionPendienteId) return avisoApp('Inicie una nueva recepción desde el escáner.');
  const id = AppState.recepcionPendienteId;
  if (AppState.viajesAcopio.some(v => v.id === id)) return avisoApp('Este viaje ya fue recibido.');
  if (!await confirmarApp(`¿Confirmar ${j1+j2} contenedores a ${temp} °C?`)) return;
  AppState.viajesAcopio.push({id, placa:'BFJ788', conductor:'SANTISTEBAN YAUCE CESAR', parcela:'PARCELA 800', tipo:'CONVENCIONAL', temperatura:temp,
    items:[{id:Date.now(),formato:'J1',nombre:'J1-JABA UVA 8 G SWEET GLOBE EXPORTABLE',cant:j1,sel:false},{id:Date.now()+1,formato:'J2',nombre:'J2-JABA UVA 8 G SWEET GLOBE EXPORTABLE',cant:j2,sel:false}]});
  document.getElementById('lbl-qr-acopio-recep-cant').innerText=j1+j2;
  document.getElementById('lbl-qr-acopio-recep-temp').innerText=`${temp} °C`;
  generarQR('qrcode-acopio-recep',{tipo:'RECEPCION',viaje:id,cant:j1+j2,temperatura:temp});
  AppState.recepcionPendienteId=null;
  actualizarAcopio(); navTo('acopio-qr-confirmar');
}

function volverAGestionAcopio() {
  navTo('acopio-gestion');
  switchSubtabAcopio('recepcion');
}

// Lógica de Paletizado y Restricción
function accionPaletizarAcopio() {
  const sel = seleccionAcopio();
  if (!validarCalibre(sel)) return;
  AppState.operacionPallet = sel;
  pintarCantidades('lista-inputs-agrupar-pallet',sel,'inp-agrupar');
  navTo('acopio-paletizar-agrupar'); recalcularTotalPalletAgrupado();
}

function recalcularTotalPalletAgrupado() {
  const lineas = leerCantidades(AppState.operacionPallet || [],'inp-agrupar',false);
  document.getElementById('lbl-total-pallet-agrupado').innerText = lineas ? lineas.reduce((a,x)=>a+x.cant,0) : '—';
  document.getElementById('lbl-temp-pallet').innerText = lineas && lineas.length ? promedioViajes(lineas).toFixed(2)+' °C' : '—';
}

function cerrarRestriccionPaletizadoModal() {
  document.getElementById('modal-restriccion-paletizado').classList.add('hidden');
}

async function confirmarCrearPalletAcopio() {
  const sel=AppState.operacionPallet || [];
  if (!validarCalibre(sel)) return;
  const lineas=leerCantidades(sel,'inp-agrupar'); if(!lineas) return;
  const tot=lineas.reduce((a,x)=>a+x.cant,0);
  if (!await confirmarApp(`¿Paletizar ${tot} jabas del calibre ${lineas[0].item.formato}?`)) return;
  const p={id:'PALLET-'+Date.now(),codigoQR:'',estado:'PROCESO',formato:lineas[0].item.formato,cant:tot,tempPromedio:promedioViajes(lineas),destino:null,horaInicio:horaActual(),horaFin:'',origenes:lineas.map(x=>({viaje:x.viaje.id,item:x.item.id,cant:x.cant,temperatura:x.viaje.temperatura})),detalles:[`${tot} ${lineas[0].item.formato}-JABA UVA 8 G SWEET GLOBE EXPORTABLE`]};
  lineas.forEach(x=>x.item.cant-=x.cant);
  AppState.palletsAcopio.push(p); AppState.operacionPallet=null;
  limpiarSeleccionAcopio(); actualizarAcopio(); navTo('acopio-gestion'); switchSubtabAcopio('paletizado');
}

// RENDER: PALLETS EN PROCESO
function renderPalletsEnProceso() {
  const c = document.getElementById('lista-pallets-proceso');
  if (!c) return;
  c.innerHTML = '';
  const abiertos = AppState.palletsAcopio;

  if (abiertos.length === 0) {
    c.innerHTML = '<div class="text-center py-8 text-gray-400 text-xs"><p>No hay pallets en proceso.</p></div>';
    return;
  }

  abiertos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-sm border p-3.5 space-y-2 text-xs';
    card.innerHTML = `
      <div class="flex justify-between items-center border-b pb-1">
        <span class="font-bold uppercase text-gray-800">PALLET ${p.codigoQR || ''}</span>
        <div class="flex items-center space-x-2">
          <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">ESTADO: ${p.estado}</span>
          <button ${p.estado === 'CERRADO' ? 'disabled style="display:none"' : ''} onclick="cerrarPalletAcopioClick('${p.id}', ${p.cant})" class="w-7 h-7 bg-purple-700 text-white rounded-lg flex items-center justify-center hover:bg-purple-800"><i class="fa-solid fa-lock text-xs"></i></button>
        </div>
      </div>
      <div class="text-[11px] text-gray-500 space-y-0.5">
        <p>Tipo Embalaje: <strong>JBU - Jaba Uva</strong></p>
        <p>Inicio: ${p.horaInicio} | Cantidad: <strong>${p.cant}</strong> | Temp Prom: <strong class="text-rose-600">${Number(p.tempPromedio).toFixed(2)}°C</strong></p>
      </div>
      <div class="bg-purple-50/50 p-2 rounded-xl border border-purple-100">
        <p class="font-bold text-gray-800 text-[11px]">${p.detalles[0]}</p>
        <span class="text-[10px] text-gray-400 font-mono">CONVENCIONAL (1.0/1.0)</span>
      </div>
    `;
    c.appendChild(card);
  });
}

async function cerrarPalletAcopioClick(pid, cant) {
  const p=AppState.palletsAcopio.find(x=>x.id===pid);
  if(!p || p.estado!=='PROCESO') return;
  if(!await confirmarApp(`¿Cerrar el pallet de ${cant} contenedores?`)) return;
  AppState.palletEnCierreId=pid;
  document.getElementById('lbl-modal-id-pallet').innerText='P'+Date.now();
  document.getElementById('modal-destino-pallet').classList.remove('hidden');
}

function cerrarModalDestinoPallet() {
  document.getElementById('modal-destino-pallet').classList.add('hidden');
}

function confirmarDestinoPalletFinal() {
  const dest = document.querySelector('input[name="opt-destino-pallet"]:checked').value;
  const p = AppState.palletsAcopio.find(x => x.id === AppState.palletEnCierreId);
  if (p) {
    p.estado = 'CERRADO';
    p.codigoQR = document.getElementById('lbl-modal-id-pallet').innerText;
    p.destino = dest;
    p.horaFin = horaActual();
    cerrarModalDestinoPallet();
    renderPalletsEnProceso();
    renderPalletsCerradosTransferencia();
    renderResumenAcopio();
    switchSubtabAcopio('transferencia');
  }
}

function renderPalletsCerradosTransferencia() {
  const c = document.getElementById('lista-pallets-cerrados-historial');
  if (!c) return;
  c.innerHTML = '';
  const cerrados = AppState.palletsAcopio.filter(p => p.estado === 'CERRADO');

  if (cerrados.length === 0) {
    c.innerHTML = '<div class="text-center py-8 text-gray-400 text-xs"><p>Aún no hay pallets cerrados enviados.</p></div>';
    return;
  }

  cerrados.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-sm border p-3.5 space-y-2 text-xs';
    card.innerHTML = `
      <div class="flex justify-between items-start border-b pb-1">
        <div>
          <span class="font-mono font-bold text-purple-700">PALLET: ${p.codigoQR}</span>
          <span class="block text-[10px] font-bold text-emerald-700 mt-0.5">Destino: ${p.destino}</span>
        </div>
        <span class="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">CERRADO</span>
      </div>
      <div class="text-[11px] text-gray-500 space-y-0.5">
        <p>Parcela: <strong>PARCELA 800</strong> | Cantidad: <strong>${p.cant}</strong></p>
        <p>Fin: ${p.horaFin} | Temp: <strong class="text-rose-600">${Number(p.tempPromedio).toFixed(2)}°C</strong></p>
      </div>
      <div class="bg-gray-50 p-2 rounded-xl border">
        <p class="font-bold text-gray-800 text-[11px]">${p.detalles[0]}</p>
        <span class="text-[10px] text-gray-400 font-mono">CONVENCIONAL (1.0/1.0)</span>
      </div>
    `;
    c.appendChild(card);
  });
}

// RENDER: PANTALLA RESUMEN ACOPIO
function renderResumenAcopio() {
  const c = document.getElementById('lista-resumen-pallets-acopio');
  if (!c) return;
  c.innerHTML = '';

  AppState.palletsAcopio.forEach(p => {
    const item = document.createElement('div');
    item.className = 'p-2.5 rounded-xl border bg-gray-50 flex justify-between items-center text-xs';
    item.innerHTML = `
      <div>
        <span class="font-mono font-bold ${p.estado === 'CERRADO' ? 'text-purple-700' : 'text-amber-600'}">${p.codigoQR ? p.codigoQR : 'EN PROCESO'}</span>
        <p class="font-bold text-gray-800 text-[11px]">${p.detalles[0]}</p>
        <span class="text-[10px] text-gray-500">${p.destino ? p.destino : 'En acopio'} | Temp: ${Number(p.tempPromedio).toFixed(2)}°C</span>
      </div>
      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${p.estado === 'CERRADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
        ${p.estado}
      </span>
    `;
    c.appendChild(item);
  });
}

// Transferencias
let transfItemActual = null;
function accionTransferirAcopio(tipo) {
  const sel=seleccionAcopio(); if(!validarCalibre(sel)) return;
  transfItemActual={seleccion:sel,tipo};
  document.getElementById('lbl-titulo-transf-acopio').innerText=`Transferir Contenedor | ${tipo}`;
  pintarCantidades('lista-transferencia-detalle',sel,'inp-transferir');
  navTo('acopio-transferir');
}

async function confirmarTransferenciaAcopio() {
  if(!transfItemActual || !validarCalibre(transfItemActual.seleccion)) return;
  const lineas=leerCantidades(transfItemActual.seleccion,'inp-transferir'); if(!lineas) return;
  const cant=lineas.reduce((a,x)=>a+x.cant,0);
  if(!await confirmarApp(`¿Transferir ${cant} jabas a ${transfItemActual.tipo}?`)) return;
  transfItemActual.lineas=lineas;
  transfItemActual.id='TRANSFERENCIA-'+Date.now();
  document.getElementById('lbl-cant-qr-transf').innerText=cant;
  generarQR('qrcode-acopio-transf',{id:transfItemActual.id,destino:transfItemActual.tipo,calibre:lineas[0].item.formato,origenes:lineas.map(x=>({viaje:x.viaje.id,item:x.item.id,cant:x.cant}))});
  navTo('acopio-qr-transf');
}

function finalizarTransferenciaAcopio() {
  if(!transfItemActual?.lineas) return;
  const t=transfItemActual;
  if(t.lineas.some(x=>x.cant>x.item.cant)) return avisoApp('El saldo cambió. Revise las cantidades.');
  t.lineas.forEach(x=>x.item.cant-=x.cant);
  AppState.transferencias ||= [];
  AppState.transferencias.push({id:t.id,destino:t.tipo,fecha:new Date().toISOString(),origenes:t.lineas.map(x=>({viaje:x.viaje.id,item:x.item.id,calibre:x.item.formato,cant:x.cant,temperatura:x.viaje.temperatura}))});
  transfItemActual=null; limpiarSeleccionAcopio(); actualizarAcopio(); navTo('acopio-gestion'); switchSubtabAcopio('recepcion');
}

// Auxiliares Cámara
function cerrarCamaraGenerica() {
  document.getElementById('modal-camara-generica').classList.add('hidden');
}

function simularLecturaCamaraExitosa() {
  cerrarCamaraGenerica();
  if (AppState.camaraGenericaCallback) AppState.camaraGenericaCallback();
}
// Reglas compartidas: cantidades, calibre y promedio SIMPLE por viaje distinto.
function horaActual(){return new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',hour12:false});}
function seleccionAcopio(){return AppState.viajesAcopio.flatMap(v=>v.items.filter(i=>i.sel&&i.cant>0).map(i=>({viaje:v,item:i})));}
function validarCalibre(sel){
 if(!sel.length){avisoApp('Seleccione al menos un contenedor.');return false;}
 if(new Set(sel.map(x=>x.item.formato)).size!==1){document.getElementById('modal-restriccion-paletizado').classList.remove('hidden');return false;}
 return true;
}
function pintarCantidades(id,sel,prefijo){
 document.getElementById(id).innerHTML=sel.map((x,i)=>`<div class="linea-origen"><small>Viaje: ${x.viaje.id}</small><div class="flex items-center justify-between gap-2"><span>${x.item.nombre}<br><small>Disponible: ${x.item.cant} | ${x.viaje.temperatura} °C</small></span><input aria-label="Cantidad del viaje ${i+1}" type="number" min="0" step="1" max="${x.item.cant}" id="${prefijo}-${i}" value="${x.item.cant}" oninput="${prefijo==='inp-agrupar'?'recalcularTotalPalletAgrupado()':''}" class="w-20 border rounded p-2"></div></div>`).join('');
}
function leerCantidades(sel,prefijo,avisar=true){
 const lineas=sel.map((x,i)=>({...x,cant:Number(document.getElementById(`${prefijo}-${i}`).value)}));
 if(!lineas.length||lineas.some(x=>!Number.isInteger(x.cant)||x.cant<0||x.cant>x.item.cant)||!lineas.some(x=>x.cant>0)){
  if(avisar)avisoApp('Ingrese cantidades enteras, sin superar el saldo disponible, y al menos una cantidad mayor a cero.');return null;
 }
 return lineas.filter(x=>x.cant>0);
}
function promedioViajes(lineas){const viajes=new Map(lineas.filter(x=>x.cant>0).map(x=>[x.viaje.id,Number(x.viaje.temperatura)]));return [...viajes.values()].reduce((a,t)=>a+t,0)/viajes.size;}
function limpiarSeleccionAcopio(){AppState.viajesAcopio.forEach(v=>v.items.forEach(i=>i.sel=false));}
function actualizarAcopio(){renderViajesRecepcionAcopio();renderPalletsEnProceso();renderPalletsCerradosTransferencia();renderResumenAcopio();
 const valores=[AppState.viajesAcopio.reduce((a,v)=>a+v.items.reduce((b,i)=>b+i.cant,0),0),AppState.palletsAcopio.filter(p=>p.estado==='PROCESO').reduce((a,p)=>a+p.cant,0),AppState.palletsAcopio.filter(p=>p.estado==='CERRADO').reduce((a,p)=>a+p.cant,0)];
 document.querySelectorAll('#view-acopio-resumen .text-lg.font-extrabold').forEach((e,i)=>e.textContent=valores[i]);
}
function generarQR(id,datos){const e=document.getElementById(id);e.innerHTML='';const texto=JSON.stringify(datos);if(typeof QRCode==='function'){try{new QRCode(e,{text:texto,width:200,height:200});return;}catch{e.innerHTML='';}}generarQRLocalCAP(e,texto);}
document.addEventListener('DOMContentLoaded',actualizarAcopio);

function renderResumenDespachos(){
 const c=document.getElementById('lista-boletas-cosecha');
 c.innerHTML='';
 const lista=AppState.boletasCosecha||[];
 if(!lista.length){c.innerHTML='<p class="estado-vacio">Aún no hay boletas generadas. Seleccione las líneas en Despacho.</p>';return;}
 lista.slice().reverse().forEach(b=>{
  const card=document.createElement('article');card.className='boleta-card';
  card.innerHTML=`<div class="boleta-encabezado"><strong>Boleta ${safe(b.id)}</strong></div><p>Estado: ${safe(b.estado)} · ${safe(b.hora)}</p><p>Viaje: ${safe(b.viaje||'Pendiente de vinculación')}</p><p>Parcela: PARCELA 800 · Lote: L11000</p><p>${b.items.length} jabas</p><p class="boleta-lineas">${safe(detalleBoleta(b))}</p><p>JABA UVA 8 G SWEET GLOBE EXPORTABLE</p>${b.estado==='PENDIENTE'?'<div class="boleta-acciones"><button type="button" class="boleta-carrito" aria-label="Abrir QR y detalle del despacho pendiente" title="Abrir QR del despacho pendiente"><i class="fa-solid fa-truck" aria-hidden="true"></i></button></div>':''}`;
  const boton=card.querySelector('.boleta-carrito');if(boton)boton.onclick=()=>mostrarBoleta(b.id);
  c.appendChild(card);
 });
}
function lineasBoleta(b){const grupos=new Map();b.items.forEach(i=>{const tipo=i.tipo||i.formato,descripcion=i.descripcion||i.nombre||tipo+'-JABA UVA 8 G SWEET GLOBE EXPORTABLE';const key=tipo+'|'+descripcion;if(!grupos.has(key))grupos.set(key,{tipo,descripcion,cantidad:0});grupos.get(key).cantidad++;});return [...grupos.values()];}
function detalleBoleta(b){return lineasBoleta(b).map(x=>`${x.cantidad} ${x.descripcion}`).join('\n');}
function mostrarBoleta(id){
 const b=(AppState.boletasCosecha||[]).find(x=>x.id===id);if(!b)return;
 document.getElementById('boleta-cantidad').textContent=b.items.length;
 document.getElementById('boleta-detalle').textContent=detalleBoleta(b);
 document.getElementById('boleta-hora').textContent='Hora: '+b.hora+' | '+b.id;
 generarQR('qrcode-cosecha-boleta',{boleta:b.id,total:b.items.length,lineas:lineasBoleta(b)});navTo('cosecha-boleta');
}
const colaDialogos=[];let dialogoActivo=null;
function confirmarApp(mensaje){return new Promise(resolve=>{colaDialogos.push({mensaje,resolve,confirmacion:true});presentarDialogo();});}
function avisoApp(mensaje){colaDialogos.push({mensaje,resolve:()=>{},confirmacion:false});presentarDialogo();}
function presentarDialogo(){
 if(dialogoActivo||!colaDialogos.length)return;
 dialogoActivo=colaDialogos.shift();const d=document.getElementById('dialogo-app');
 d.dataset.modulo=AppState.currentView.startsWith('enfriado')?'enfriado':AppState.currentView.startsWith('despacho')?'despacho':AppState.currentView.startsWith('cosecha')?'cosecha':AppState.currentView.startsWith('acopio')?'acopio':'transporte';
 document.getElementById('dialogo-titulo').textContent=dialogoActivo.confirmacion?'Confirmar operación':'Información';
 document.getElementById('dialogo-texto').textContent=dialogoActivo.mensaje.replace(/\\n/g,'\n');
 document.getElementById('dialogo-no').hidden=!dialogoActivo.confirmacion;
 document.getElementById('dialogo-si').textContent=dialogoActivo.confirmacion?'Sí, continuar':'Entendido';
 dialogoActivo.foco=document.activeElement;d.classList.remove('hidden');document.getElementById(dialogoActivo.confirmacion?'dialogo-no':'dialogo-si').focus();
}
function resolverDialogo(valor){
 if(!dialogoActivo)return;const actual=dialogoActivo;dialogoActivo=null;document.getElementById('dialogo-app').classList.add('hidden');actual.foco?.focus();actual.resolve(valor);presentarDialogo();
}
document.addEventListener('keydown',e=>{if(!dialogoActivo)return;if(e.key==='Escape'){e.preventDefault();resolverDialogo(false);}if(e.key==='Tab'){const no=document.getElementById('dialogo-no'),si=document.getElementById('dialogo-si');e.preventDefault();(document.activeElement===no||no.hidden?si:no).focus();}});


/* CAP UVA: extensión de interfaz y operación del prototipo. */
const STORAGE_CAP='cap-uva-v21-recepcion-viaje-limpio';
try{if(!localStorage.getItem(STORAGE_CAP)){localStorage.removeItem('cap-secuencia-pallet');localStorage.removeItem('cap-secuencia-sap');}}catch{}
try{['cap-uva-v20-conformidad-limpio','cap-uva-v19-salida-masiva-limpio','cap-uva-v18-todo-limpio','cap-uva-v17-pruebas-limpias','cap-uva-v16-pruebas-limpias','cap-uva-v15-pruebas-limpias','cap-uva-v14-pruebas-limpias','cap-uva-v13-pruebas-limpias','cap-uva-v12-pruebas-limpias','cap-uva-v11-pruebas-limpias','cap-uva-v10-resumenes-limpios','cap-uva-v3','cap-uva-v4-limpio','cap-uva-v5-nuevas-pruebas','cap-uva-v6-registros-limpios','cap-uva-v7-cadena-limpia','cap-uva-v8-transferencias-limpias','cap-uva-v9-ramas-despacho-limpias'].forEach(k=>localStorage.removeItem(k));}catch{}
AppState.viajesAcopio=[];AppState.palletsAcopio=[];AppState.jabasCosecha=[];AppState.boletasCosecha=[];AppState.transferencias=[];AppState.viajeTransporte=null;
const persona={croquista:'SANTISTEBAN YAUCE CESAR',supervisor:'MARJENN GLORICEL CHAVARRI LOPEZ',fundo:'AGRICULTOR',acopio:'ACOPIO 64'};
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+'-'+(globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
const suma=xs=>xs.reduce((a,x)=>a+Number(x.cant||0),0);
const industrial=x=>(x.producto||x.nombre||'').toUpperCase().includes('INDUSTRIAL');
const textoLinea=(x,tipo='CONVENCIONAL')=>`${safe(x.nombre)}${String(x.nombre).includes(tipo)?'':' '+safe(tipo)}`;
const metaLinea=x=>safe(x.factores||'(1.0/1.0)');
let resumenTab='total',palletEdicion=null,scannerStream=null,scannerTimer=null,scannerCallback=null,scannerSesion=0;
function guardarLocal(){try{localStorage.setItem(STORAGE_CAP,JSON.stringify({viajesAcopio:AppState.viajesAcopio,palletsAcopio:AppState.palletsAcopio,jabasCosecha:AppState.jabasCosecha,boletasCosecha:AppState.boletasCosecha||[],transferencias:AppState.transferencias||[],viajeTransporte:AppState.viajeTransporte,uva:AppState.uva,contenedorRegistro:AppState.contenedorRegistro}));}catch(e){if(!document.getElementById('estado-guardado')){const n=document.createElement('p');n.id='estado-guardado';n.textContent='No fue posible guardar en este navegador. Mantenga esta pestaña abierta.';document.getElementById('app-shell').appendChild(n);}}}
try{const raw=localStorage.getItem(STORAGE_CAP);if(raw){const d=JSON.parse(raw);if(Array.isArray(d.viajesAcopio)&&Array.isArray(d.palletsAcopio)&&Array.isArray(d.jabasCosecha))Object.assign(AppState,d);}}catch(e){}
function normalizarDatos(){
 AppState.boletasCosecha ||= [];AppState.transferencias ||= [];
 AppState.viajesAcopio.forEach(v=>{v.fundo ||= persona.fundo;v.acopio ||= persona.acopio;v.horaRecepcion ||= '—';v.items.forEach(i=>{i.sel=false;i.factores ||= '(1.0/1.0)';i.recibido ??= i.cant;});});
 AppState.palletsAcopio.forEach(p=>{p.embalaje ||= 'JBU - Jaba Uva';p.producto ||= 'EXPORTABLE';p.parcela ||= 'PARCELA 800';p.tipo ||= 'CONVENCIONAL';p.lineas ||= [{nombre:p.formato+'-JABA UVA 8 G SWEET GLOBE '+p.producto,cant:p.cant,formato:p.formato,factores:'(1.0/1.0)'}];});
 AppState.jabasCosecha.forEach(j=>j.sel=false);
}
normalizarDatos();
function encabezado(total,pallets){return `<div><p>Croquista: ${safe(persona.croquista)}</p><p>Supervisor: ${safe(persona.supervisor)}</p><p>Acopio: ${safe(persona.fundo)} (Fundo) - ${safe(persona.acopio)}</p></div><div class="contadores">${pallets!==undefined?`<strong>${pallets} ${iconoConteo('pallet')}</strong>`:''}<strong>${total} ${iconoConteo('jaba')}</strong></div>`;}
function totalesHTML(lineas,pallets){return `Exportable: <b>${suma(lineas.filter(x=>!industrial(x)))}</b> cajas${pallets?` · ${pallets.filter(p=>!industrial(p)).length} pallets`:''}<span>Industrial: <b>${suma(lineas.filter(industrial))}</b> cajas${pallets?` · ${pallets.filter(industrial).length} pallets`:''}</span>`;}
function pasaFiltro(v,items){const q=(document.getElementById('buscar-gestion')?.value||'').toUpperCase(),cal=document.getElementById('filtro-calibre')?.value;return (!q||JSON.stringify(v).toUpperCase().includes(q))&&(!cal||items.some(i=>i.formato===cal));}
function renderViajesRecepcionAcopio(){
 const c=document.getElementById('lista-viajes-acopio-recep');if(!c)return;c.innerHTML='';
 AppState.viajesAcopio.map((v,vi)=>({v,vi})).reverse().forEach(({v,vi})=>{const items=v.items.filter(i=>i.cant>0);if(!items.length||!pasaFiltro(v,items))return;
 const card=document.createElement('article');card.className='viaje-card';const all=items.every(i=>i.sel),some=items.some(i=>i.sel);
 card.innerHTML=`<div class="viaje-cabecera"><div><p>Viaje: ${safe(v.id)}</p><p>Placa: ${safe(v.placa)}</p><p>Conductor: ${safe(v.conductor)}</p><p>Temperatura: <b>${v.temperatura} °C</b></p></div><div class="contadores"><b>${suma(items)} ${iconoConteo('jaba')}</b><button aria-label="Contraer o expandir viaje" onclick="plegarViaje(${vi})"><i class="fa-solid fa-chevron-${v.plegado?'down':'up'}"></i></button></div></div><div class="viaje-cuerpo ${v.plegado?'hidden':''}"><div class="fila-parcela"><span>Parcela: ${safe(v.parcela)}</span><span>Tipo: ${safe(v.tipo)}</span></div><div class="fila-parcela"><small>Exportable: ${suma(items.filter(i=>!industrial(i)))} · Industrial: ${suma(items.filter(industrial))}</small><label class="seleccionar-todos"><input type="checkbox" aria-label="Seleccionar todos los contenedores del viaje ${vi+1}" ${all?'checked':''} onchange="seleccionarViaje(${vi},this.checked)"> Seleccionar todos</label></div><div class="lineas-viaje"></div></div>`;
 card.querySelector('input').indeterminate=some&&!all;
 items.forEach(it=>{const line=document.createElement('label');line.className='linea-contenedor '+(it.sel?'seleccionada':'');line.innerHTML=`<input type="checkbox" ${it.sel?'checked':''}><span>${it.cant} ${textoLinea(it,v.tipo)}<small>${metaLinea(it)}</small></span>`;line.querySelector('input').onchange=e=>toggleCheckItemAcopio(v.id,it.id,e.target.checked);card.querySelector('.lineas-viaje').appendChild(line);});c.appendChild(card);
 });
 if(!c.children.length)c.innerHTML='<p class="estado-vacio">No hay contenedores disponibles para esta búsqueda.</p>';
 const sel=seleccionAcopio(),menu=document.getElementById('menu-flotante-acopio');menu.classList.toggle('hidden',!sel.length||AppState.acopioSubtab!=='recepcion');document.getElementById('lbl-acopio-sel-count').textContent=`${sel.length} líneas · ${sel.reduce((a,x)=>a+x.item.cant,0)} jabas`;
 const h=document.getElementById('gestion-encabezado');if(h)h.innerHTML=encabezado(AppState.viajesAcopio.reduce((a,v)=>a+suma(v.items),0),AppState.palletsAcopio.length);
}
function seleccionarViaje(idx,checked){AppState.viajesAcopio[idx].items.forEach(i=>i.sel=checked&&i.cant>0);renderViajesRecepcionAcopio();}
function plegarViaje(idx){AppState.viajesAcopio[idx].plegado=!AppState.viajesAcopio[idx].plegado;renderViajesRecepcionAcopio();}
const switchSubtabOriginal=switchSubtabAcopio;
switchSubtabAcopio=function(tab){switchSubtabOriginal(tab);renderViajesRecepcionAcopio();};
function tarjetaPallet(p,editable=false){
 const idx=AppState.palletsAcopio.indexOf(p),cerrado=p.estado==='CERRADO';const card=document.createElement('article');card.className='pallet-card';
 card.innerHTML=`<div class="fila-parcela"><strong>PALLET${p.codigoQR?': '+safe(p.codigoQR):''}</strong><div class="acciones-pallet">${editable&&!cerrado?`<button onclick="eliminarPallet(${idx})" aria-label="Eliminar pallet"><i class="fa-solid fa-trash text-rose-600"></i></button>`:''}<span class="estado ${cerrado?'cerrado':'proceso'}">${safe(p.estado)}</span>${editable&&!cerrado?`<button onclick="escanearPallet(${idx})" aria-label="Escanear QR del pallet"><i class="fa-solid fa-camera"></i></button>`:''}</div></div><p>Tipo Embalaje: ${safe(p.embalaje)} ${editable&&!cerrado?`<button onclick="editarEmbalaje(${idx})" aria-label="Editar embalaje"><i class="fa-solid fa-pencil"></i></button>`:''}</p><div class="fila-parcela"><span>Inicio: ${safe(p.horaInicio)} · Fin: ${safe(p.horaFin||'—')}</span></div><div class="fila-parcela fila-temperatura"><span>Temp. prom.: <b>${Number(p.tempPromedio).toFixed(2)} °C</b></span><b class="cantidad-jabas">${p.cant} ${iconoConteo('jaba')}</b></div>${cerrado?`<p class="destino ${p.destino==='PLANTA ENFRIADO'?'enfriado':'despacho'}">Destino: ${safe(p.destino||'Pendiente')} · Envío: ${safe(p.horaEnvio||p.horaFin||'—')}</p>`:''}<div class="detalle-producto"><div class="fila-parcela"><b>Parcela: ${safe(p.parcela)}</b><span>Tipo: ${safe(p.tipo)}</span></div>${(p.lineas||[]).map(i=>`<p>${i.cant} ${textoLinea(i,p.tipo)}<small>${metaLinea(i)}</small></p>`).join('')}</div>`;return card;
}
function renderPalletsEnProceso(){const c=document.getElementById('lista-pallets-proceso');if(!c)return;c.innerHTML='';AppState.palletsAcopio.filter(p=>p.estado!=='CERRADO'&&pasaFiltro(p,p.lineas||[{formato:p.formato}])).reverse().forEach(p=>c.appendChild(tarjetaPallet(p,true)));if(!c.children.length)c.innerHTML='<p class="estado-vacio">No hay pallets para mostrar.</p>';}
function renderPalletsCerradosTransferencia(){const c=document.getElementById('lista-pallets-cerrados-historial');if(!c)return;c.innerHTML='';const ps=AppState.palletsAcopio.filter(p=>p.estado==='CERRADO'&&pasaFiltro(p,p.lineas||[]));const t=document.createElement('div');t.className='resumen-totales';t.innerHTML=totalesHTML(ps.flatMap(p=>p.lineas||[]),ps);c.appendChild(t);ps.slice().reverse().forEach(p=>c.appendChild(tarjetaPallet(p)));if(!ps.length)c.innerHTML+='<p class="estado-vacio">Aún no hay pallets cerrados.</p>';}
function editarEmbalaje(idx){palletEdicion=AppState.palletsAcopio[idx];document.getElementById('editar-embalaje').value=palletEdicion.embalaje;document.getElementById('modal-embalaje').classList.remove('hidden');document.getElementById('editar-embalaje').focus();}
function guardarEmbalaje(){const t=document.getElementById('editar-embalaje').value.trim();if(!t){avisoApp('Ingrese el tipo de embalaje.');return;}if(!palletEdicion||palletEdicion.estado!=='PROCESO')return;palletEdicion.embalaje=t;document.getElementById('modal-embalaje').classList.add('hidden');actualizarAcopio();}
async function eliminarPallet(idx){const p=AppState.palletsAcopio[idx];if(!p||p.estado!=='PROCESO')return;if(!p.origenes?.length)return avisoApp('Este pallet de demostración no tiene saldos de origen para devolver.');if(!await confirmarApp(`¿Eliminar el pallet y devolver ${p.cant} jabas a sus viajes de origen?`))return;p.origenes.forEach(o=>{const i=AppState.viajesAcopio.find(v=>v.id===o.viaje)?.items.find(i=>i.id===o.item);if(i)i.cant+=o.cant;});AppState.palletsAcopio=AppState.palletsAcopio.filter(x=>x!==p);actualizarAcopio();}
function cambiarResumen(tab){resumenTab=tab;renderResumenAcopio();}
function lineasRecibidas(v){return v.items.map(i=>({...i,cant:i.recibido??i.cant}));}
function renderResumenAcopio(){
 const c=document.getElementById('lista-resumen-pallets-acopio');if(!c)return;c.innerHTML='';const q=(document.getElementById('buscar-resumen')?.value||'').toUpperCase();
 const viajes=AppState.viajesAcopio.filter(v=>!q||JSON.stringify(v).toUpperCase().includes(q));const ps=AppState.palletsAcopio.filter(p=>p.estado==='CERRADO'&&(!q||JSON.stringify(p).toUpperCase().includes(q)));
 const lineas=resumenTab==='transferencia'?ps.flatMap(p=>p.lineas||[]):viajes.flatMap(lineasRecibidas);
 document.getElementById('resumen-encabezado').innerHTML=encabezado(suma(lineas),resumenTab==='transferencia'?ps.length:undefined);
 document.getElementById('resumen-totales').innerHTML=totalesHTML(lineas,resumenTab==='transferencia'?ps:null);
 document.querySelectorAll('[data-resumen]').forEach(b=>b.classList.toggle('activo',b.dataset.resumen===resumenTab));
 if(resumenTab==='transferencia'){ps.slice().reverse().forEach(p=>c.appendChild(tarjetaPallet(p)));}
 else if(resumenTab==='recepcion'){viajes.slice().reverse().forEach(v=>{const idx=AppState.viajesAcopio.indexOf(v),card=document.createElement('article');card.className='recepcion-card';card.innerHTML=`<div class="fila-parcela"><b>Viaje: ${safe(v.id)}</b><button onclick="verRecepcionQR(${idx})" aria-label="Ver QR de recepción"><i class="fa-solid fa-qrcode"></i></button></div><div class="fila-parcela"><span>Acopio: ${safe(v.fundo)} - ${safe(v.acopio)}</span><span>Placa: ${safe(v.placa)}</span></div><p>Conductor: ${safe(v.conductor)}</p><div class="fila-parcela"><span>Inicio: ${safe(v.horaRecepcion)}</span><b>${suma(lineasRecibidas(v))} ${iconoConteo('jaba')}</b></div><p>Temperatura: <b>${v.temperatura} °C</b></p>${detalleViajeHTML(v,lineasRecibidas(v))}`;c.appendChild(card);});}
 else {const grupos=new Map();viajes.forEach(v=>{const key=v.parcela+'|'+v.tipo;if(!grupos.has(key))grupos.set(key,{parcela:v.parcela,tipo:v.tipo,items:new Map()});const g=grupos.get(key);lineasRecibidas(v).forEach(i=>{const k=i.nombre+'|'+i.factores;if(!g.items.has(k))g.items.set(k,{...i,cant:0});g.items.get(k).cant+=i.cant;});});grupos.forEach(g=>{const card=document.createElement('details');card.open=true;card.className='total-parcela';const xs=[...g.items.values()];card.innerHTML=`<summary>Parcela: ${safe(g.parcela)} · Tipo: ${safe(g.tipo)} <b>${suma(xs)} ${iconoConteo('jaba')}</b></summary>${xs.map(i=>`<p>${i.cant} ${textoLinea(i,g.tipo)}<small>${metaLinea(i)}</small></p>`).join('')}`;c.appendChild(card);});}
 if(!c.children.length)c.innerHTML='<p class="estado-vacio">No hay registros para mostrar.</p>';
}
function detalleViajeHTML(v,items){return `<div class="detalle-producto"><div class="fila-parcela"><b>Parcela: ${safe(v.parcela)}</b><span>Tipo: ${safe(v.tipo)}</span></div>${items.filter(i=>i.cant>0).map(i=>`<p>${i.cant} ${textoLinea(i,v.tipo)}<small>${metaLinea(i)}</small></p>`).join('')}</div>`;}
function comprobanteHTML(v,qrId,temperatura=false){return `<div class="qr-tarjeta"><div id="${qrId}" class="qr-centro"></div><b>${suma(v.items)} ${iconoConteo('jaba')}</b></div><div class="recepcion-card"><p>Croquista: ${safe(persona.croquista)}</p><p>Fundo: ${safe(v.fundo)} · Acopio: ${safe(v.acopio)}</p><p>Viaje: ${safe(v.id)}</p><p>Conductor: ${safe(v.conductor)}</p><p>Placa: ${safe(v.placa)}</p>${temperatura?`<p>Inicio: ${safe(v.horaRecepcion)}<br>Temperatura: <b>${v.temperatura} °C</b></p>`:''}</div>${detalleViajeHTML(v,v.items)}`;}
function verRecepcionQR(idx){const v=AppState.viajesAcopio[idx],datos={...v,items:lineasRecibidas(v)};document.getElementById('detalle-qr-contenido').innerHTML=comprobanteHTML(datos,'qr-recepcion-detalle',true);generarQR('qr-recepcion-detalle',{tipo:'RECEPCION',viaje:v.id,cant:suma(datos.items),temperatura:v.temperatura});navTo('acopio-detalle-qr');}
function actualizarAcopio(){renderViajesRecepcionAcopio();renderPalletsEnProceso();renderPalletsCerradosTransferencia();renderResumenAcopio();guardarLocal();}
// Conserva la operación de cosecha y añade filtros, totales seleccionados y guardado.
const renderDespachoBase=renderDespachoCosecha;
renderDespachoCosecha=function(){renderDespachoBase();const n=AppState.jabasCosecha.filter(i=>i.sel).length;const chk=document.getElementById('chk-cosecha-todo');chk.checked=n>0&&n===AppState.jabasCosecha.length;chk.indeterminate=n>0&&n<AppState.jabasCosecha.length;document.getElementById('btn-generar-qr').textContent=n?`Generar QR · ${n} jabas`:'Generar boleta QR';guardarLocal();};
const resumenDespachosBase=renderResumenDespachos;
renderResumenDespachos=function(){const q=(document.getElementById('buscar-boletas')?.value||'').toUpperCase(),estado=document.getElementById('filtro-boleta')?.value;resumenDespachosBase();document.querySelectorAll('#lista-boletas-cosecha article').forEach(c=>c.hidden=(!c.textContent.toUpperCase().includes(q)||(estado&&!c.textContent.includes(estado))));};
function campoError(id,mensaje){const e=document.getElementById(id);e.setAttribute('aria-invalid','true');let m=document.getElementById(id+'-error');if(!m){m=document.createElement('small');m.id=id+'-error';m.className='campo-error';e.insertAdjacentElement('afterend',m);}m.textContent=mensaje;e.focus();e.addEventListener('input',()=>{e.removeAttribute('aria-invalid');m.textContent='';},{once:true});}
const leerCantidadesBase=leerCantidades;
leerCantidades=function(sel,prefijo,avisar=true){let invalido=false;sel.forEach((x,i)=>{const e=document.getElementById(`${prefijo}-${i}`),n=Number(e.value);if(!Number.isInteger(n)||n<0||n>x.item.cant){invalido=true;if(avisar)campoError(e.id,`Ingrese entre 0 y ${x.item.cant} jabas enteras.`);}});if(invalido)return null;return leerCantidadesBase(sel,prefijo,avisar);};
async function confirmarCrearPalletAcopio(){
 const sel=AppState.operacionPallet||[];if(!validarCalibre(sel))return;const xs=leerCantidades(sel,'inp-agrupar');if(!xs)return;
 const n=xs.reduce((a,x)=>a+x.cant,0);if(!await confirmarApp(`¿Paletizar ${n} jabas?\nCalibre: ${xs[0].item.formato}\nTemperatura promedio: ${promedioViajes(xs).toFixed(2)} °C`))return;
 if(xs.some(x=>x.cant>x.item.cant))return avisoApp('El saldo cambió. Revise las cantidades.');
 const p={id:uid('PALLET'),codigoQR:'',estado:'PROCESO',formato:xs[0].item.formato,cant:n,tempPromedio:promedioViajes(xs),destino:null,horaInicio:horaActual(),horaFin:'',embalaje:'JBU - Jaba Uva',producto:industrial(xs[0].item)?'INDUSTRIAL':'EXPORTABLE',parcela:[...new Set(xs.map(x=>x.viaje.parcela))].join(', '),tipo:xs[0].viaje.tipo,origenes:xs.map(x=>({viaje:x.viaje.id,item:x.item.id,cant:x.cant,temperatura:x.viaje.temperatura})),lineas:xs.map(x=>({...x.item,cant:x.cant,sel:false})),detalles:[`${n} ${xs[0].item.nombre}`]};
 xs.forEach(x=>x.item.cant-=x.cant);AppState.palletsAcopio.push(p);AppState.operacionPallet=null;limpiarSeleccionAcopio();actualizarAcopio();navTo('acopio-gestion');switchSubtabAcopio('paletizado');
}
async function confirmarRecepcionAcopioFinal(){
 const e=document.getElementById('input-acopio-temp'),raw=e.value.trim(),t=Number(raw),j1=Number(document.getElementById('inp-recep-j1').value),j2=Number(document.getElementById('inp-recep-j2').value),id=AppState.recepcionPendienteId;
 if(!raw||!Number.isFinite(t))return campoError('input-acopio-temp','Ingrese la temperatura medida del viaje.');
 if(![j1,j2].every(n=>Number.isInteger(n)&&n>=0)||j1+j2===0)return campoError('inp-recep-j1','Ingrese cantidades enteras válidas.');
 if(!id)return avisoApp('Inicie una recepción.');if(AppState.viajesAcopio.some(v=>v.id===id))return avisoApp('Este viaje ya fue recibido.');
 if(!await confirmarApp(`¿Confirmar recepción?\nViaje: ${id}\nCantidad: ${j1+j2} jabas\nTemperatura: ${t} °C`))return;
 const base=AppState.viajeTransporte?.id===id?AppState.viajeTransporte:{placa:'BFJ788',conductor:persona.croquista,parcela:'PARCELA 800',tipo:'CONVENCIONAL',fundo:persona.fundo,acopio:persona.acopio};
 const v={...base,id,temperatura:t,horaRecepcion:horaActual(),items:[['J1',j1],['J2',j2]].filter(([f,n])=>n>0).map(([f,n])=>({id:uid('ITEM'),formato:f,nombre:f+'-JABA UVA 8 G SWEET GLOBE EXPORTABLE',cant:n,recibido:n,sel:false,factores:'(1.0/1.0)'}))};
 AppState.viajesAcopio.push(v);AppState.recepcionPendienteId=null;actualizarAcopio();
 const c=document.querySelector('#view-acopio-qr-confirmar > div:nth-child(2)');c.innerHTML=comprobanteHTML(v,'qrcode-acopio-recep',true)+'<button class="boton-principal" onclick="volverAGestionAcopio()">Continuar</button>';generarQR('qrcode-acopio-recep',{tipo:'RECEPCION',viaje:id,cant:j1+j2,temperatura:t});navTo('acopio-qr-confirmar');
}
async function abrirScannerRecepcionAcopio(){
 const v=AppState.viajeTransporte;
 if(v&&v.entregado&&!AppState.viajesAcopio.some(x=>x.id===v.id)){AppState.recepcionPendienteId=v.id;document.getElementById('inp-recep-j1').value=suma(v.items.filter(x=>x.formato==='J1'));document.getElementById('inp-recep-j2').value=suma(v.items.filter(x=>x.formato==='J2'));}
 else {if(!await confirmarApp('¿Abrir una recepción de demostración?'))return;AppState.recepcionPendienteId=uid('VIAJE');}
 document.getElementById('input-acopio-temp').value='';document.querySelector('#view-acopio-confirmar-recep .font-mono').textContent=AppState.recepcionPendienteId;recalcularTotalRecepAcopio();navTo('acopio-confirmar-recep');
}
// Cámara para etiqueta física. Si el navegador no permite leer QR, acepta el código de la etiqueta.
const camaraOriginalHTML=document.getElementById('modal-camara-generica').innerHTML;
function crearScanner(){const m=document.getElementById('modal-camara-generica');m.innerHTML=`<div class="scanner-header"><h2 id="lbl-titulo-camara-generica">Escanear QR del pallet</h2><button onclick="cerrarCamaraGenerica()" aria-label="Cerrar cámara">✕</button></div><video id="video-qr" autoplay playsinline muted></video><p id="scanner-estado">Activando cámara…</p><div class="scanner-manual"><label for="codigo-etiqueta">Código de la etiqueta QR</label><input id="codigo-etiqueta" maxlength="150" autocomplete="off"><button onclick="aceptarCodigoEscaner(document.getElementById('codigo-etiqueta').value)">Usar código</button></div>`;}
async function escanearPallet(idx){const p=AppState.palletsAcopio[idx];if(!p||p.estado!=='PROCESO')return;crearScanner();document.getElementById('modal-camara-generica').classList.remove('hidden');scannerCallback=async code=>{if(!/^\d{11}$/.test(code))return avisoApp('El código del pallet debe tener 11 dígitos numéricos.');if(AppState.palletsAcopio.some(x=>x!==p&&x.codigoQR===code)){avisoApp('Ese QR ya está asociado a otro pallet.');return;}if(!await confirmarApp(`¿Cerrar este pallet con ${p.cant} jabas?\nEtiqueta QR: ${code}`))return;AppState.palletEnCierreId=p.id;AppState.codigoPalletLeido=code;document.getElementById('lbl-modal-id-pallet').textContent=code;document.getElementById('modal-destino-pallet').classList.remove('hidden');};const sesion=++scannerSesion;
 try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});if(sesion!==scannerSesion){stream.getTracks().forEach(t=>t.stop());return;}scannerStream=stream;const video=document.getElementById('video-qr');video.srcObject=stream;await video.play();const estado=document.getElementById('scanner-estado');if('BarcodeDetector' in window){const detector=new BarcodeDetector({formats:['qr_code']});estado.textContent='Apunte al QR del pallet.';let leyendo=false;scannerTimer=setInterval(async()=>{if(leyendo||!scannerCallback)return;leyendo=true;try{const r=await detector.detect(video);if(r.length)aceptarCodigoEscaner(r[0].rawValue);}catch(e){}finally{leyendo=false;}},350);}else estado.textContent='Cámara activa. Este navegador no admite lectura automática: ingrese el código de la etiqueta.';}catch(e){document.getElementById('scanner-estado').textContent='No se pudo activar la cámara. Permita el acceso en HTTPS o localhost, o ingrese el código de la etiqueta.';}
}
function cerrarCamaraGenerica(){scannerSesion++;clearInterval(scannerTimer);scannerStream?.getTracks().forEach(t=>t.stop());scannerStream=null;scannerCallback=null;const modal=document.getElementById('modal-camara-generica');modal.classList.add('hidden');modal.innerHTML=camaraOriginalHTML;}
function aceptarCodigoEscaner(raw){const code=String(raw).trim();if(!code||code.length>150)return avisoApp('Ingrese un código de etiqueta de hasta 150 caracteres.');const callback=scannerCallback;cerrarCamaraGenerica();callback?.(code);}
function confirmarDestinoPalletFinal(){const p=AppState.palletsAcopio.find(x=>x.id===AppState.palletEnCierreId);if(!p||p.estado!=='PROCESO'||!AppState.codigoPalletLeido)return;const code=AppState.codigoPalletLeido;if(AppState.palletsAcopio.some(x=>x!==p&&x.codigoQR===code))return avisoApp('QR duplicado.');p.codigoQR=code;if(!/^\d{11}$/.test(code))return avisoApp('El código del pallet debe tener 11 dígitos numéricos.');p.estado='CERRADO';p.horaFin=horaActual();p.horaEnvio=p.horaFin;p.destino=document.querySelector('input[name="opt-destino-pallet"]:checked').value;AppState.codigoPalletLeido=null;AppState.palletEnCierreId=null;cerrarModalDestinoPallet();actualizarAcopio();switchSubtabAcopio('transferencia');}
// Transporte: comprobante completo a partir del viaje actual.
function viajeActual(){if(!AppState.viajeTransporte)AppState.viajeTransporte={id:'BFJ788364510949571944448000000000',placa:'BFJ788',conductor:persona.croquista,fundo:persona.fundo,acopio:persona.acopio,parcela:'PARCELA 800',tipo:'CONVENCIONAL',items:[]};return AppState.viajeTransporte;}
function mostrarQRTransporte(tipo){const v=viajeActual(),c=document.querySelector('#view-transporte-qr > div:nth-child(2)');document.getElementById('lbl-titulo-qr-transporte').textContent=tipo==='ENTREGA'?'Entrega a Acopio':'Confirmación de recojo';c.innerHTML=comprobanteHTML(v,'qrcode-transporte')+'<button class="boton-principal" onclick="continuarDespuesDeQRTransporte()">Continuar</button>';generarQR('qrcode-transporte',{tipo,viaje:v.id,cant:suma(v.items),items:v.items.map(i=>({calibre:i.formato,cant:i.cant}))});navTo('transporte-qr');guardarLocal();}
async function confirmarEntregaEnAcopioTransporte(){const v=viajeActual();if(!suma(v.items))return avisoApp('No hay contenedores para entregar.');if(!await confirmarApp(`¿Generar QR de entrega a ${v.acopio}?\nViaje: ${v.id}\nCantidad: ${suma(v.items)} jabas`))return;v.entregado=true;mostrarQRTransporte('ENTREGA');}
async function confirmarRecepcionTransporteFinal(){if(!await confirmarApp('¿Confirmar el recojo de los contenedores mostrados?'))return;const b=AppState.boletaRecojo;if(b&&!b.viaje){const v=viajeActual();if(v.entregado)return avisoApp('Inicie un nuevo viaje para recoger más contenedores.');['J1','J2'].forEach(f=>{const n=b.items.filter(i=>i.tipo===f).length;if(!n)return;const item=v.items.find(i=>i.formato===f);if(item)item.cant+=n;else v.items.push({formato:f,nombre:f+'-JABA UVA 8 G SWEET GLOBE EXPORTABLE',cant:n,factores:'(1.0/1.0)'});});b.estado='VINCULADO';b.viaje=v.id;}mostrarQRTransporte('RECOJO');}
async function confirmarIniciarViajeTransporte(){if(!await confirmarApp('¿Iniciar un nuevo viaje de Transporte Interno?'))return;AppState.viajeTransporte={...viajeActual(),id:uid('BFJ788'),entregado:false,items:[]};guardarLocal();navTo('transporte-viaje-detalle');switchTabTransporte('recojo');}
const switchTransporteBase=switchTabTransporte;
switchTabTransporte=function(tab){switchTransporteBase(tab);const v=viajeActual();document.getElementById('lbl-transporte-cant-cargada').textContent=suma(v.items);document.querySelector('#panel-entrega-t > div').innerHTML=detalleViajeHTML(v,v.items);document.querySelector('#view-transporte-viaje-detalle > div:nth-child(2)').innerHTML=`<p>Viaje: ${safe(v.id)} · Acopio: ${safe(v.acopio)}</p><p>Conductor: ${safe(v.conductor)}</p><p>Placa: ${safe(v.placa)}</p>`;};
// Escaneos demostrativos originales: se conserva su acceso sin alterar la cámara de pallets.
iniciarRecojoPorQRTransporte=function(){cerrarModalOpcionesRecojoTransporte();const b=AppState.boletasCosecha.find(b=>!b.viaje);AppState.boletaRecojo=b||null;const v=b?{...viajeActual(),items:['J1','J2'].map(f=>({formato:f,nombre:f+'-JABA UVA 8 G SWEET GLOBE EXPORTABLE',cant:b.items.filter(i=>i.tipo===f).length})).filter(x=>x.cant)}:viajeActual();document.querySelector('#view-transporte-recojo-manual > div:nth-child(2) > div').innerHTML=`<h2>RECOJO ${b?safe(b.id):'DE DEMOSTRACIÓN'}</h2>${detalleViajeHTML(v,v.items)}<p>Total: ${suma(v.items)}</p>`;navTo('transporte-recojo-manual');};
// Bloqueo por operación durante confirmaciones asíncronas y guardado posterior.
['solicitarGenerarBoletaCosecha','confirmarCrearPalletAcopio','confirmarRecepcionAcopioFinal','confirmarTransferenciaAcopio','eliminarPallet','confirmarEntregaEnAcopioTransporte','confirmarRecepcionTransporteFinal','confirmarIniciarViajeTransporte'].forEach(name=>{const original=window[name];let busy=false;window[name]=async function(...args){if(busy)return;busy=true;try{return await original.apply(this,args);}finally{busy=false;guardarLocal();}};});
['aplicarCambioContenedorCosecha','simularEscanerFotocheck','seleccionarContenedorRegistro','finalizarTransferenciaAcopio'].forEach(name=>{const original=window[name];window[name]=function(...args){const r=original.apply(this,args);guardarLocal();return r;};});
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('lbl-contenedor-seleccionado').textContent=AppState.contenedorRegistro;renderResumenDespachos();renderDespachoCosecha();actualizarAcopio();});

// Enfriado Uva y Despacho Uva: registros históricos y asignación única por pallet.
AppState.uva ||= {enfriado:{config:null,pallets:[]},despacho:{config:null,pallets:[],viajes:[],grupo:[],guia:'',precinto:''}};
let uvaTabs={enfriado:'ingreso',despacho:'recepcion'},uvaResumen={enfriado:'total',despacho:'total'},uvaBusy=false;
function usuarioUva(){return AppState.usuario?.nombre||document.querySelector('#view-menu h2')?.textContent.trim()||persona.croquista;}
function fechaUva(){return new Date().toISOString();}
function horaUva(f){return f?new Date(f).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false}):'Pendiente';}
function registroUva(m){return AppState.uva[m];}
function abrirUva(m,p){navTo(m+'-'+p);renderUva(m,p);}
function cabeceraUva(m){const d=registroUva(m);return `<div class="uva-persona"><p>Usuario: <b>${safe(usuarioUva())}</b></p><p>${m==='enfriado'?'Lugar de enfriado':'Acopio'}: <b>${safe(d.config?.lugar||'Sin registrar')}</b></p></div>`;}
function iconoConteo(tipo){return tipo==='pallet'?'<svg class="icono-conteo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 2h14v16H5zM2 19h20v3h-3v-1H5v1H2z"/><path fill="white" d="M9 6h6v2H9z"/></svg>':'<svg class="icono-conteo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 2h16a2 2 0 0 1 2 2v17H2V4a2 2 0 0 1 2-2z"/><path fill="white" d="M5 4h14v3H5zM9 11h6v2H9z"/></svg>';}
function conteosPallets(ps){return `<div class="conteos-centrados"><span aria-label="${ps.length} pallets">${ps.length} ${iconoConteo('pallet')}</span><span aria-label="${suma(ps)} jabas">${suma(ps)} ${iconoConteo('jaba')}</span></div>`;}
function tarjetaUva(p,m,accion=''){
 const v=m==='despacho'?registroUva(m).viajes.find(v=>v.id===p.viaje):null;
 const horas=m==='enfriado'?`Inicio: ${horaUva(p.ingreso)}${p.salida?' · Fin: '+horaUva(p.salida):''}`:AppState.currentView==='despacho-resumen'?`Inicio: ${horaUva(p.ingreso)} · Fin: ${v?horaUva(v.cierre):'—'}`:v?`Fin: ${horaUva(v.cierre)}`:`Inicio: ${horaUva(p.ingreso)}`;
 return `<article class="uva-pallet pallet-card"><div class="fila-parcela"><b>PALLET: ${safe(p.codigoQR)}</b>${accion}</div><p>Tipo Embalaje: ${safe(p.embalaje)}</p><p>${horas}</p><div class="fila-parcela fila-temperatura"><span>Temp. prom.: <b>${Number(p.tempPromedio).toFixed(2)} °C</b></span><b class="cantidad-jabas">${p.cant} ${iconoConteo('jaba')}</b></div><div class="detalle-producto"><div class="fila-parcela"><b>Parcela: ${safe(p.parcela)}</b><span>Tipo: ${safe(p.tipo)}</span></div>${(p.lineas||[]).map(i=>`<p>${i.cant} ${textoLinea(i,p.tipo)}<small>${metaLinea(i)}</small></p>`).join('')}</div></article>`;
}
function tarjetaViajeUva(v){const d=registroUva('despacho'),ps=d.pallets.filter(p=>v.palletIds.includes(p.id));return `<article class="uva-viaje"><div class="fila-parcela"><b>AGRUPACIÓN:</b><button class="obtener-viaje" onclick="obtenerViajeSAP('${v.id}',this)" ${v.viajeSAP?'disabled':''}>${v.viajeSAP?'Viaje obtenido':'↻ Obtener viaje'}</button>${conteosPallets(ps)}${v.estado!=='CONFIRMADO'?`<button class="uva-qr" onclick="verViajeUva('${v.id}')" aria-label="Abrir QR y detalle"><i class="fa-solid fa-qrcode"></i></button>`:''}</div><p>CÓDIGO DE DESPACHO T2: ${safe(v.id)}</p><p>GUÍA DE REMISIÓN: ${safe(v.guia)}</p><p>PRECINTO: ${safe(v.precinto)}</p><div class="fila-parcela"><b>CONDUCTOR: ${safe(v.conductor||'—')}</b><b class="estado-transferencia ${v.estado==='CONFIRMADO'?'confirmado':'pendiente'}">ESTADO: ${safe(v.estado||'EN PROCESO')}</b></div><p>PLACA: ${safe(v.placa||'—')}</p>${ps.map(p=>`<div class="pallet-en-viaje"><p><b>Viaje SAP:</b> ${safe(p.viajeSAP||'')}</p>${tarjetaUva(p,'despacho')}</div>`).join('')}</article>`;}
function renderUva(m,p){const el=document.getElementById('uva-'+m+'-'+p),d=registroUva(m),nombre=m==='enfriado'?'enfriado':'despacho';if(!el)return;
 if(p==='home'){const pendientes=d.pallets.filter(x=>m==='enfriado'?!x.salida:!x.viaje).length,terminados=d.pallets.length-pendientes;el.innerHTML=`<div class="uva-home-subtitulo">${m==='enfriado'?'Enfriado':'Despacho'} Uva</div><div class="uva-home-cifras"><div><b>${pendientes}</b><span>Pendientes</span></div><div><b>${terminados}</b><span>Finalizados</span></div></div>`;return;}
 if(p==='maestra'){el.innerHTML=maestraHTML();return;}
 if(p==='registro'){el.innerHTML=`<div class="uva-persona uva-registro"><label>Fundo<select id="uva-fundo-${m}"><option value="">Seleccionar fundo</option><option>AGRICULTOR</option></select></label><label>${m==='enfriado'?'Lugar de enfriado':'Acopio'}<select id="uva-lugar-${m}"><option value="">Seleccionar</option>${(m==='enfriado'?['PLANTA ENFRIADO']:['ACOPIO 64','ACOPIO PLANTA']).map(v=>`<option>${v}</option>`).join('')}</select></label><button class="boton-principal" onclick="guardarRegistroUva('${m}')">Guardar</button></div>`;document.getElementById('uva-fundo-'+m).value=d.config?.fundo||'';document.getElementById('uva-lugar-'+m).value=d.config?.lugar||'';return;}
 if(p==='gestion'){const tab=uvaTabs[m],seleccion=m==='enfriado'?(tab==='ingreso'?d.pallets.filter(x=>!x.salida):d.pallets.filter(x=>x.salida)):d.pallets.filter(x=>!x.viaje&&!d.grupo.includes(x.id));el.innerHTML=cabeceraUva(m)+(m==='despacho'&&tab==='transferencia'?'':`<div class="uva-contadores">${conteosPallets(seleccion)}<button onclick="camaraUva('${m}','${m==='enfriado'?tab:(tab==='transferencia'?'agregar':'recepcion')}')" aria-label="Escanear pallet"><i class="fa-solid fa-camera"></i></button></div>`)+(m==='despacho'&&tab==='transferencia'?grupoHTMLUva():seleccion.slice().reverse().map(x=>tarjetaUva(x,m)).join('')||'<p class="estado-vacio">No hay pallets registrados en esta sección.</p>')+`<div class="uva-tabs">${(m==='enfriado'?['ingreso','salida']:['recepcion','transferencia']).map(t=>`<button class="${t===tab?'activo':''}" onclick="tabUva('${m}','${t}')">${m==='enfriado'?(t==='ingreso'?'Ingreso enfriado':'Salida enfriado'):(t==='recepcion'?'Recepción':'Transferencia')}</button>`).join('')}</div>`;return;}
 if(p==='resumen'){const t=uvaResumen[m],ps=d.pallets;el.innerHTML=cabeceraUva(m)+`<div class="uva-contadores">${conteosPallets(ps)}</div>`+(m==='despacho'&&t==='transferencia'?d.viajes.slice().reverse().map(tarjetaViajeUva).join(''):ps.slice().reverse().map(x=>tarjetaUva(x,m)).join(''))+'<p class="estado-vacio">'+((m==='despacho'&&t==='transferencia'?d.viajes.length:ps.length)?'':'Aún no hay registros.')+'</p>'+(m==='despacho'?`<div class="uva-tabs"><button class="${t==='total'?'activo':''}" onclick="resumenUva('total')">Total</button><button class="${t==='transferencia'?'activo':''}" onclick="resumenUva('transferencia')">Transferencia</button></div>`:'<div class="uva-tabs"><button class="activo">▤ Recepción</button></div>');}
}
function tabUva(m,t){uvaTabs[m]=t;renderUva(m,'gestion');}
function resumenUva(t){uvaResumen.despacho=t;renderUva('despacho','resumen');}
async function guardarRegistroUva(m){const fundo=document.getElementById('uva-fundo-'+m).value,lugar=document.getElementById('uva-lugar-'+m).value;if(!fundo||!lugar)return avisoApp('Seleccione el fundo y '+(m==='enfriado'?'el lugar de enfriado.':'el acopio.'));if(!await confirmarApp('¿Guardar el registro de '+m+'?'))return;registroUva(m).config={fundo,lugar};guardarLocal();abrirUva(m,'gestion');avisoApp('Registro guardado correctamente.');}
function codigoUva(raw){try{const x=JSON.parse(raw);return String(x.codigoQR||x.pallet||x.id||raw);}catch{return String(raw).trim();}}
async function leerPalletUva(m,operacion,raw){if(uvaBusy)return;uvaBusy=true;try{const d=registroUva(m);if(!d.config)return avisoApp('Guarde primero el registro de '+m+'.');const code=codigoUva(raw);if(!/^\d{11}$/.test(code))return avisoApp('El código del pallet debe tener 11 dígitos numéricos.');if(m==='enfriado'&&operacion==='salida'){const p=d.pallets.find(x=>x.codigoQR===code);if(!p)return avisoApp('Este pallet no tiene ingreso registrado en Enfriado Uva.');if(p.salida)return avisoApp('La salida de este pallet ya fue registrada.');if(!await confirmarApp('¿Registrar salida del pallet '+code+'?'))return;p.salida=fechaUva();guardarLocal();tabUva(m,'salida');avisoApp('Salida registrada.\nIngreso: '+horaUva(p.ingreso)+'\nSalida: '+horaUva(p.salida));return;}
 if(m==='despacho'&&operacion==='agregar'){const p=d.pallets.find(x=>x.codigoQR===code);if(!p)return avisoApp('Recepcione este pallet antes de añadirlo a un viaje.');if(p.viaje||d.grupo.includes(p.id))return avisoApp('Este pallet ya está asignado a una transferencia.');if(!await confirmarApp('¿Añadir el pallet '+code+' al viaje?'))return;d.grupo.push(p.id);guardarLocal();tabUva(m,'transferencia');return;}
 if(d.pallets.some(x=>x.codigoQR===code))return avisoApp('Este pallet ya fue recepcionado.');const source=AppState.palletsAcopio.find(x=>x.codigoQR===code&&x.estado==='CERRADO');if(!source)return avisoApp('QR no encontrado: se requiere un pallet cerrado de Acopio.');const cold=registroUva('enfriado').pallets.find(x=>x.codigoQR===code);if(m==='enfriado'&&source.destino!=='PLANTA ENFRIADO')return avisoApp('Este pallet tiene destino directo a Despacho.');if(m==='despacho'&&source.destino==='PLANTA ENFRIADO'&&!cold?.salida)return avisoApp('Este pallet debe completar su salida de Enfriado Uva antes de recepcionarse en Despacho.');const cantidad=await cantidadRecepcionUva(source.cant,code);if(cantidad===null)return;const copia=JSON.parse(JSON.stringify(source));ajustarCantidadPallet(copia,cantidad);d.pallets.push({...copia,ingreso:fechaUva(),salida:null,viaje:null});guardarLocal();tabUva(m,m==='enfriado'?'ingreso':'recepcion');}finally{uvaBusy=false;}}
function grupoHTMLUva(){const d=registroUva('despacho'),ps=d.pallets.filter(p=>d.grupo.includes(p.id));return `<div class="uva-persona"><div class="fila-parcela"><b>Agrupación:</b>${conteosPallets(ps)}<span class="uva-estado activo">En proceso</span></div><div class="uva-grupo-botones"><button onclick="camaraUva('despacho','agregar')"><i class="fa-solid fa-camera"></i> Añadir</button><button onclick="abrirGuiaUva()">Guía y precinto</button><button onclick="cerrarViajeUva()" ${!ps.length?'disabled':''}><i class="fa-solid fa-lock"></i> Cerrar</button></div>${d.guia&&d.precinto?`<p>Guía: ${safe(d.guia)} · Precinto: ${safe(d.precinto)}</p>`:''}</div>`+d.grupo.slice().reverse().map(id=>ps.find(p=>p.id===id)).filter(Boolean).map(p=>tarjetaUva(p,'despacho',`<button onclick="quitarGrupoUva('${p.id}')" aria-label="Quitar pallet del viaje"><i class="fa-solid fa-trash"></i></button>`)).join('');}
async function quitarGrupoUva(id){if(!await confirmarApp('¿Quitar el pallet del viaje y devolverlo a Recepción?'))return;const d=registroUva('despacho');d.grupo=d.grupo.filter(x=>x!==id);guardarLocal();renderUva('despacho','gestion');}
function abrirGuiaUva(){const d=registroUva('despacho');document.getElementById('uva-guia').value=d.guia;document.getElementById('uva-precinto').value=d.precinto;document.getElementById('modal-uva-form').classList.remove('hidden');}
function cerrarFormUva(){document.getElementById('modal-uva-form').classList.add('hidden');}
function guardarGuiaUva(){const d=registroUva('despacho'),g=document.getElementById('uva-guia').value.trim(),p=document.getElementById('uva-precinto').value.trim();if(!g||!p)return avisoApp('Complete guía de remisión y precinto.');d.guia=g;d.precinto=p;guardarLocal();cerrarFormUva();renderUva('despacho','gestion');avisoApp('Guía y precinto guardados.');}
async function cerrarViajeUva(){if(uvaBusy)return;uvaBusy=true;try{const d=registroUva('despacho'),ps=d.pallets.filter(p=>d.grupo.includes(p.id)&&!p.viaje);if(!ps.length)return avisoApp('Añada al menos un pallet.');if(!d.guia||!d.precinto)return avisoApp('Registre guía de remisión y precinto antes de cerrar.');if(!await confirmarApp(`¿Cerrar viaje para Transporte Externo?\n${ps.length} pallets · ${suma(ps)} jabas\nGuía: ${d.guia}\nPrecinto: ${d.precinto}`))return;const v={id:uid('T2'),palletIds:ps.map(p=>p.id),cant:suma(ps),guia:d.guia,precinto:d.precinto,cierre:fechaUva(),estado:'EN PROCESO',usuario:usuarioUva(),...d.config};ps.forEach(p=>p.viaje=v.id);d.viajes.push(v);d.grupo=[];d.guia='';d.precinto='';guardarLocal();verViajeUva(v.id);}finally{uvaBusy=false;}}
function verViajeUva(id){const d=registroUva('despacho'),v=d.viajes.find(x=>x.id===id);if(!v)return;abrirUva('despacho','qr');const el=document.getElementById('uva-despacho-qr');const ps=d.pallets.filter(x=>v.palletIds.includes(x.id));el.innerHTML=`<h2 class="text-center font-bold">QR DE ENTREGA A TRANSPORTE EXTERNO</h2><div id="uva-qr-viaje" class="qr-centro"></div><div class="uva-persona"><b>Viaje: ${safe(v.id)}</b><p>${ps.length} pallets · ${v.cant} jabas</p><p>Usuario: ${safe(v.usuario)}</p><p>Fundo: ${safe(v.fundo)} · Acopio: ${safe(v.lugar)}</p><p>Guía: ${safe(v.guia)}</p><p>Precinto: ${safe(v.precinto)}</p><p>Cierre: ${horaUva(v.cierre)}</p></div>`+ps.map(p=>tarjetaUva(p,'despacho')).join('')+'<button class="boton-principal" onclick="abrirUva(\'despacho\',\'gestion\')">Continuar</button>';generarQR('uva-qr-viaje',{tipo:'DESPACHO_UVA',viaje:v.id,guia:v.guia,precinto:v.precinto,pallets:ps.map(p=>({qr:p.codigoQR,cant:p.cant})),cant:v.cant});}
async function camaraUva(m,op){if(!registroUva(m).config)return avisoApp('Guarde primero el registro de '+m+'.');crearScanner();document.getElementById('lbl-titulo-camara-generica').textContent=op==='agregar'?'Añadir pallet al viaje':op==='salida'?'Salida enfriado':'Recepcionar pallet';document.getElementById('modal-camara-generica').classList.remove('hidden');scannerCallback=code=>leerPalletUva(m,op,code);const sesion=++scannerSesion;try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});if(sesion!==scannerSesion){stream.getTracks().forEach(t=>t.stop());return;}scannerStream=stream;const video=document.getElementById('video-qr');video.srcObject=stream;await video.play();if('BarcodeDetector' in window){const detector=new BarcodeDetector({formats:['qr_code']});let busy=false;document.getElementById('scanner-estado').textContent='Apunte al QR del pallet.';scannerTimer=setInterval(async()=>{if(busy||!scannerCallback)return;busy=true;try{const xs=await detector.detect(video);if(xs.length)aceptarCodigoEscaner(xs[0].rawValue);}catch{}finally{busy=false;}},350);}else document.getElementById('scanner-estado').textContent='Ingrese el código de la etiqueta si la lectura automática no está disponible.';}catch{if(sesion===scannerSesion)document.getElementById('scanner-estado').textContent='Permita la cámara en HTTPS o localhost, o ingrese el código del pallet.';}}

// Selector de simulación: utiliza los mismos controles y validaciones que el lector QR.
const camaraUvaReal=camaraUva;
camaraUva=function(m,op){if(!registroUva(m).config)return avisoApp('Guarde primero el registro de '+m+'.');const modal=document.getElementById('modal-uva-prueba');modal.dataset.modulo=m;modal.dataset.operacion=op;const d=registroUva(m);let ps;if(op==='salida')ps=d.pallets.filter(p=>!p.salida);else if(op==='agregar')ps=d.pallets.filter(p=>!p.viaje&&!d.grupo.includes(p.id));else {prepararDatosPruebaUva(m);ps=AppState.palletsAcopio.filter(p=>p.estado==='CERRADO'&&!d.pallets.some(x=>x.codigoQR===p.codigoQR)&&(m==='enfriado'?p.destino==='PLANTA ENFRIADO':p.destino!=='PLANTA ENFRIADO'||registroUva('enfriado').pallets.some(x=>x.codigoQR===p.codigoQR&&x.salida)));}document.getElementById('uva-lista-prueba').innerHTML=ps.map(p=>`<option value="${safe(p.codigoQR)}">${safe(p.codigoQR)} · ${safe(p.formato)} · ${p.cant} jabas</option>`).join('');document.getElementById('uva-simular').disabled=!ps.length;document.getElementById('uva-prueba-nota').textContent=ps.length?'Seleccione un pallet para simular su lectura.':'No hay pallets disponibles para esta acción.';modal.classList.remove('hidden');};
function prepararDatosPruebaUva(m){['J1','J2'].forEach((f,i)=>{if(AppState.palletsAcopio.some(p=>p.demostracion&&p.formato===f&&p.destino===(m==='enfriado'?'PLANTA ENFRIADO':'DESPACHO')&&!registroUva(m).pallets.some(x=>x.codigoQR===p.codigoQR)))return;const code=nuevoCodigoPallet();AppState.palletsAcopio.push({id:code,codigoQR:code,demostracion:true,estado:'CERRADO',formato:f,cant:66,tempPromedio:14+i,embalaje:'JBU - Jaba Uva',parcela:'PARCELA 800',tipo:'CONVENCIONAL',producto:'EXPORTABLE',horaInicio:horaActual(),horaFin:horaActual(),destino:m==='enfriado'?'PLANTA ENFRIADO':'DESPACHO',lineas:[{formato:f,nombre:f+'-JABA UVA 8 G SWEET GLOBE EXPORTABLE',cant:66,factores:'(1.0/1.0)'}],origenes:[]});});guardarLocal();}
function simularPalletUva(){const modal=document.getElementById('modal-uva-prueba'),code=document.getElementById('uva-lista-prueba').value;if(!code)return;modal.classList.add('hidden');leerPalletUva(modal.dataset.modulo,modal.dataset.operacion,code);}
function usarCamaraRealUva(){const modal=document.getElementById('modal-uva-prueba');modal.classList.add('hidden');camaraUvaReal(modal.dataset.modulo,modal.dataset.operacion);}

// Data maestra común: actualización local del prototipo.
function maestraHTML(){return `<div class="uva-persona"><h2>Data maestra</h2><p>Actualizar los datos locales disponibles en este prototipo.</p><div class="maestra-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="maestra-avance"></div></div><p id="maestra-porcentaje">0%</p><button id="maestra-actualizar" class="boton-principal" onclick="actualizarMaestraUva()">Actualizar data maestra</button><p id="maestra-resultado"></p></div>`;}
function abrirMaestraComun(){document.querySelectorAll('[id^="drawer-"]').forEach(x=>x.classList.add('hidden'));document.getElementById('maestra-comun-body').innerHTML=maestraHTML();document.getElementById('modal-maestra-comun').classList.remove('hidden');}
function actualizarMaestraUva(){const b=document.getElementById('maestra-actualizar');if(!b||b.disabled)return;b.disabled=true;let n=0;const t=setInterval(()=>{n+=20;document.getElementById('maestra-avance').style.width=n+'%';document.getElementById('maestra-porcentaje').textContent=n+'%';document.querySelector('.maestra-barra').setAttribute('aria-valuenow',n);if(n===100){clearInterval(t);normalizarDatos();guardarLocal();document.getElementById('maestra-resultado').textContent='Datos locales actualizados. 100%';b.disabled=false;}},120);}
async function simularConfirmacionT2Uva(id){const d=registroUva('despacho'),v=d.viajes.find(x=>x.id===id);if(!v||v.estado==='CONFIRMADO')return;if(!await confirmarApp('¿Simular la confirmación del viaje por T2? Esta acción es solo para pruebas.'))return;v.estado='CONFIRMADO';v.confirmacion=fechaUva();v.conductor='CONDUCTOR DE PRUEBA';v.placa='PRUEBA';guardarLocal();abrirUva('despacho','resumen');resumenUva('transferencia');}
const verViajeUvaBase=verViajeUva;
verViajeUva=function(id){verViajeUvaBase(id);const v=registroUva('despacho').viajes.find(x=>x.id===id);if(v&&v.estado!=='CONFIRMADO')document.getElementById('uva-despacho-qr').insertAdjacentHTML('beforeend',`<button class="boton-principal uva-prueba-t2" onclick="simularConfirmacionT2Uva('${id}')">Simular confirmación T2 (prueba)</button>`);};
function actualizarHomesComunes(){for(const m of ['transporte','acopio']){const el=document.getElementById('home-cifras-'+m);if(!el)continue;const ps=m==='acopio'?AppState.palletsAcopio:(AppState.viajeTransporte?[AppState.viajeTransporte]:[]);const pendientes=ps.filter(p=>m==='acopio'?p.estado!=='CERRADO':!p.entregado).length;el.innerHTML=`<div><b>${pendientes}</b><span>Pendientes</span></div><div><b>${ps.length-pendientes}</b><span>Finalizados</span></div>`;}}
const navToAnterior=navTo;
navTo=function(id){navToAnterior(id);actualizarHomesComunes();};
const openSidebarAnterior=openSidebar;
openSidebar=function(id){openSidebarAnterior(id);const sb=document.getElementById(id);sb?.querySelectorAll('button').forEach(b=>b.classList.toggle('opcion-activa',(b.getAttribute('onclick')||'').includes("'"+AppState.currentView+"'")));};
document.addEventListener('DOMContentLoaded',actualizarHomesComunes);

// Ajustes finales: simulación renovable y cantidades exclusivamente en recepción.
function nuevoCodigoPallet(){let n=Number(localStorage.getItem('cap-secuencia-pallet')||'20903551073');let c;do{c=String(++n).padStart(11,'0');}while(AppState.palletsAcopio.some(p=>p.codigoQR===c));localStorage.setItem('cap-secuencia-pallet',String(n));return c;}
function ajustarCantidadPallet(p,n){const ls=p.lineas||[];let restante=n,total=ls.reduce((a,i)=>a+i.cant,0);ls.forEach((i,k)=>{i.cant=k===ls.length-1?restante:Math.floor(n*i.cant/(total||1));restante-=i.cant;});p.cant=n;}
function cantidadRecepcionUva(n,code){return new Promise(resolve=>{const modal=document.createElement('div');modal.className='cantidad-overlay';modal.innerHTML=`<div class="cantidad-dialog"><h3>Recepción de pallet</h3><p>${safe(code)}</p><label>Cantidad de jabas<input type="number" min="1" step="1" value="${n}" inputmode="numeric"></label><p class="campo-error"></p><div><button data-cancel>Cancelar</button><button data-save>Aceptar</button></div></div>`;document.getElementById('app-shell').appendChild(modal);const input=modal.querySelector('input');input.focus();const terminar=x=>{modal.remove();resolve(x);};modal.querySelector('[data-cancel]').onclick=()=>terminar(null);modal.querySelector('[data-save]').onclick=()=>{const v=Number(input.value);if(!Number.isSafeInteger(v)||v<1){modal.querySelector('.campo-error').textContent='Ingrese una cantidad entera mayor a cero.';return;}terminar(v);};});}
async function obtenerViajeSAP(id,boton){const d=registroUva('despacho'),v=d.viajes.find(x=>x.id===id);if(!v||v.obtenerBusy)return;if(v.viajeSAP)return;v.obtenerBusy=true;boton.disabled=true;boton.textContent='Obteniendo viaje…';try{await new Promise(r=>setTimeout(r,700));let n=Number(localStorage.getItem('cap-secuencia-sap')||15393400)+1;localStorage.setItem('cap-secuencia-sap',String(n));v.viajeSAP=String(n).padStart(12,'0');d.pallets.filter(p=>v.palletIds.includes(p.id)).forEach(p=>p.viajeSAP=v.viajeSAP);}finally{delete v.obtenerBusy;guardarLocal();renderUva('despacho','resumen');}}
function generarLineasPrueba(){for(let i=0;i<20;i++){const id=Date.now()+i;AppState.jabasCosecha.push({id,tipo:i%2?'J2':'J1',trabajador:'TRABAJADOR DE PRUEBA '+(i+1),codigo:String(i+1).padStart(8,'0'),sel:false});}renderDespachoCosecha();}
function generarViajePrueba(destino){const items=['J1','J2'].map((f,i)=>({id:Date.now()+i,formato:f,nombre:f+'-JABA UVA 8 G SWEET GLOBE EXPORTABLE',cant:66,recibido:66,sel:false,factores:'(1.0/1.0)'}));const v={id:uid('T1'),items,placa:'ABC-123',conductor:'CONDUCTOR DE PRUEBA',parcela:'PARCELA 800',tipo:'CONVENCIONAL',fundo:persona.fundo,acopio:persona.acopio,temperatura:14,horaRecepcion:horaActual(),entregado:false};if(destino==='acopio'){AppState.recepcionPendienteId=v.id;AppState.viajeSimulacion=v;document.getElementById('inp-recep-j1').value=66;document.getElementById('inp-recep-j2').value=66;document.getElementById('input-acopio-temp').value=14;navTo('acopio-confirmar-recep');}else{AppState.viajeTransporte=v;navTo('transporte-viaje-detalle');switchTabTransporte('recojo');}guardarLocal();}
const recepcionFinalOriginal=confirmarRecepcionAcopioFinal;
confirmarRecepcionAcopioFinal=async function(){const v=AppState.viajeSimulacion;if(!v)return recepcionFinalOriginal();const j1=Number(document.getElementById('inp-recep-j1').value),j2=Number(document.getElementById('inp-recep-j2').value),t=Number(document.getElementById('input-acopio-temp').value);if(![j1,j2].every(n=>Number.isSafeInteger(n)&&n>=0)||j1+j2===0||!Number.isFinite(t))return avisoApp('Revise las cantidades y temperatura.');v.items.forEach((i,k)=>{i.cant=i.recibido=k?j2:j1;});v.temperatura=t;v.horaRecepcion=horaActual();AppState.viajesAcopio.push(v);AppState.viajeSimulacion=null;guardarLocal();navTo('acopio-gestion');switchSubtabAcopio('recepcion');actualizarAcopio();};
document.addEventListener('DOMContentLoaded',()=>{[['lista-despacho-cosecha','Generar 20 líneas de prueba','generarLineasPrueba()'],['lista-viajes-acopio-recep','Generar viaje de prueba','generarViajePrueba("acopio")']].forEach(([id,label,action])=>{const el=document.getElementById(id);if(el){const b=document.createElement('button');b.className='boton-principal';b.textContent=label;b.onclick=()=>{if(id==='lista-despacho-cosecha')generarLineasPrueba();else generarViajePrueba('acopio');};el.before(b);}});const el=document.getElementById('view-transporte-viaje-detalle');if(el){const b=document.createElement('button');b.className='boton-principal';b.textContent='Generar viaje de simulación';b.onclick=()=>generarViajePrueba('transporte');el.appendChild(b);}});

const QRLocalCAP=(()=>{const factories={
'./QR8bitByte':function(module,exports,require){
var QRMode = require('./QRMode');

function QR8bitByte(data) {
	this.mode = QRMode.MODE_8BIT_BYTE;
	this.data = data;
}

QR8bitByte.prototype = {

	getLength : function() {
		return this.data.length;
	},
	
	write : function(buffer) {
		for (var i = 0; i < this.data.length; i++) {
			// not JIS ...
			buffer.put(this.data.charCodeAt(i), 8);
		}
	}
};

module.exports = QR8bitByte;

},
'./QRBitBuffer':function(module,exports,require){
function QRBitBuffer() {
	this.buffer = [];
	this.length = 0;
}

QRBitBuffer.prototype = {

	get : function(index) {
		var bufIndex = Math.floor(index / 8);
		return ( (this.buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
	},
	
	put : function(num, length) {
		for (var i = 0; i < length; i++) {
			this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
		}
	},
	
	getLengthInBits : function() {
		return this.length;
	},
	
	putBit : function(bit) {
	
		var bufIndex = Math.floor(this.length / 8);
		if (this.buffer.length <= bufIndex) {
			this.buffer.push(0);
		}
	
		if (bit) {
			this.buffer[bufIndex] |= (0x80 >>> (this.length % 8) );
		}
	
		this.length++;
	}
};

module.exports = QRBitBuffer;

},
'./QRErrorCorrectLevel':function(module,exports,require){
module.exports = {
	L : 1,
	M : 0,
	Q : 3,
	H : 2
};


},
'./QRMaskPattern':function(module,exports,require){
module.exports = {
	PATTERN000 : 0,
	PATTERN001 : 1,
	PATTERN010 : 2,
	PATTERN011 : 3,
	PATTERN100 : 4,
	PATTERN101 : 5,
	PATTERN110 : 6,
	PATTERN111 : 7
};

},
'./QRMath':function(module,exports,require){
var QRMath = {

	glog : function(n) {
	
		if (n < 1) {
			throw new Error("glog(" + n + ")");
		}
		
		return QRMath.LOG_TABLE[n];
	},
	
	gexp : function(n) {
	
		while (n < 0) {
			n += 255;
		}
	
		while (n >= 256) {
			n -= 255;
		}
	
		return QRMath.EXP_TABLE[n];
	},
	
	EXP_TABLE : new Array(256),
	
	LOG_TABLE : new Array(256)

};
	
for (var i = 0; i < 8; i++) {
	QRMath.EXP_TABLE[i] = 1 << i;
}
for (var i = 8; i < 256; i++) {
	QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4]
		^ QRMath.EXP_TABLE[i - 5]
		^ QRMath.EXP_TABLE[i - 6]
		^ QRMath.EXP_TABLE[i - 8];
}
for (var i = 0; i < 255; i++) {
	QRMath.LOG_TABLE[QRMath.EXP_TABLE[i] ] = i;
}

module.exports = QRMath;

},
'./QRMode':function(module,exports,require){
module.exports = {
    MODE_NUMBER :       1 << 0,
    MODE_ALPHA_NUM :    1 << 1,
    MODE_8BIT_BYTE :    1 << 2,
    MODE_KANJI :        1 << 3
};

},
'./QRPolynomial':function(module,exports,require){
var QRMath = require('./QRMath');

function QRPolynomial(num, shift) {
	if (num.length === undefined) {
		throw new Error(num.length + "/" + shift);
	}

	var offset = 0;

	while (offset < num.length && num[offset] === 0) {
		offset++;
	}

	this.num = new Array(num.length - offset + shift);
	for (var i = 0; i < num.length - offset; i++) {
		this.num[i] = num[i + offset];
	}
}

QRPolynomial.prototype = {

	get : function(index) {
		return this.num[index];
	},
	
	getLength : function() {
		return this.num.length;
	},
	
	multiply : function(e) {
	
		var num = new Array(this.getLength() + e.getLength() - 1);
	
		for (var i = 0; i < this.getLength(); i++) {
			for (var j = 0; j < e.getLength(); j++) {
				num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i) ) + QRMath.glog(e.get(j) ) );
			}
		}
	
		return new QRPolynomial(num, 0);
	},
	
	mod : function(e) {
	
		if (this.getLength() - e.getLength() < 0) {
			return this;
		}
	
		var ratio = QRMath.glog(this.get(0) ) - QRMath.glog(e.get(0) );
	
		var num = new Array(this.getLength() );
		
		for (var i = 0; i < this.getLength(); i++) {
			num[i] = this.get(i);
		}
		
		for (var x = 0; x < e.getLength(); x++) {
			num[x] ^= QRMath.gexp(QRMath.glog(e.get(x) ) + ratio);
		}
	
		// recursive call
		return new QRPolynomial(num, 0).mod(e);
	}
};

module.exports = QRPolynomial;

},
'./QRRSBlock':function(module,exports,require){
var QRErrorCorrectLevel = require('./QRErrorCorrectLevel');

function QRRSBlock(totalCount, dataCount) {
	this.totalCount = totalCount;
	this.dataCount  = dataCount;
}

QRRSBlock.RS_BLOCK_TABLE = [

	// L
	// M
	// Q
	// H

	// 1
	[1, 26, 19],
	[1, 26, 16],
	[1, 26, 13],
	[1, 26, 9],
	
	// 2
	[1, 44, 34],
	[1, 44, 28],
	[1, 44, 22],
	[1, 44, 16],

	// 3
	[1, 70, 55],
	[1, 70, 44],
	[2, 35, 17],
	[2, 35, 13],

	// 4		
	[1, 100, 80],
	[2, 50, 32],
	[2, 50, 24],
	[4, 25, 9],
	
	// 5
	[1, 134, 108],
	[2, 67, 43],
	[2, 33, 15, 2, 34, 16],
	[2, 33, 11, 2, 34, 12],
	
	// 6
	[2, 86, 68],
	[4, 43, 27],
	[4, 43, 19],
	[4, 43, 15],
	
	// 7		
	[2, 98, 78],
	[4, 49, 31],
	[2, 32, 14, 4, 33, 15],
	[4, 39, 13, 1, 40, 14],
	
	// 8
	[2, 121, 97],
	[2, 60, 38, 2, 61, 39],
	[4, 40, 18, 2, 41, 19],
	[4, 40, 14, 2, 41, 15],
	
	// 9
	[2, 146, 116],
	[3, 58, 36, 2, 59, 37],
	[4, 36, 16, 4, 37, 17],
	[4, 36, 12, 4, 37, 13],
	
	// 10		
	[2, 86, 68, 2, 87, 69],
	[4, 69, 43, 1, 70, 44],
	[6, 43, 19, 2, 44, 20],
	[6, 43, 15, 2, 44, 16],

	// 11
	[4, 101, 81],
	[1, 80, 50, 4, 81, 51],
	[4, 50, 22, 4, 51, 23],
	[3, 36, 12, 8, 37, 13],

	// 12
	[2, 116, 92, 2, 117, 93],
	[6, 58, 36, 2, 59, 37],
	[4, 46, 20, 6, 47, 21],
	[7, 42, 14, 4, 43, 15],

	// 13
	[4, 133, 107],
	[8, 59, 37, 1, 60, 38],
	[8, 44, 20, 4, 45, 21],
	[12, 33, 11, 4, 34, 12],

	// 14
	[3, 145, 115, 1, 146, 116],
	[4, 64, 40, 5, 65, 41],
	[11, 36, 16, 5, 37, 17],
	[11, 36, 12, 5, 37, 13],

	// 15
	[5, 109, 87, 1, 110, 88],
	[5, 65, 41, 5, 66, 42],
	[5, 54, 24, 7, 55, 25],
	[11, 36, 12],

	// 16
	[5, 122, 98, 1, 123, 99],
	[7, 73, 45, 3, 74, 46],
	[15, 43, 19, 2, 44, 20],
	[3, 45, 15, 13, 46, 16],

	// 17
	[1, 135, 107, 5, 136, 108],
	[10, 74, 46, 1, 75, 47],
	[1, 50, 22, 15, 51, 23],
	[2, 42, 14, 17, 43, 15],

	// 18
	[5, 150, 120, 1, 151, 121],
	[9, 69, 43, 4, 70, 44],
	[17, 50, 22, 1, 51, 23],
	[2, 42, 14, 19, 43, 15],

	// 19
	[3, 141, 113, 4, 142, 114],
	[3, 70, 44, 11, 71, 45],
	[17, 47, 21, 4, 48, 22],
	[9, 39, 13, 16, 40, 14],

	// 20
	[3, 135, 107, 5, 136, 108],
	[3, 67, 41, 13, 68, 42],
	[15, 54, 24, 5, 55, 25],
	[15, 43, 15, 10, 44, 16],

	// 21
	[4, 144, 116, 4, 145, 117],
	[17, 68, 42],
	[17, 50, 22, 6, 51, 23],
	[19, 46, 16, 6, 47, 17],

	// 22
	[2, 139, 111, 7, 140, 112],
	[17, 74, 46],
	[7, 54, 24, 16, 55, 25],
	[34, 37, 13],

	// 23
	[4, 151, 121, 5, 152, 122],
	[4, 75, 47, 14, 76, 48],
	[11, 54, 24, 14, 55, 25],
	[16, 45, 15, 14, 46, 16],

	// 24
	[6, 147, 117, 4, 148, 118],
	[6, 73, 45, 14, 74, 46],
	[11, 54, 24, 16, 55, 25],
	[30, 46, 16, 2, 47, 17],

	// 25
	[8, 132, 106, 4, 133, 107],
	[8, 75, 47, 13, 76, 48],
	[7, 54, 24, 22, 55, 25],
	[22, 45, 15, 13, 46, 16],

	// 26
	[10, 142, 114, 2, 143, 115],
	[19, 74, 46, 4, 75, 47],
	[28, 50, 22, 6, 51, 23],
	[33, 46, 16, 4, 47, 17],

	// 27
	[8, 152, 122, 4, 153, 123],
	[22, 73, 45, 3, 74, 46],
	[8, 53, 23, 26, 54, 24],
	[12, 45, 15, 28, 46, 16],

	// 28
	[3, 147, 117, 10, 148, 118],
	[3, 73, 45, 23, 74, 46],
	[4, 54, 24, 31, 55, 25],
	[11, 45, 15, 31, 46, 16],

	// 29
	[7, 146, 116, 7, 147, 117],
	[21, 73, 45, 7, 74, 46],
	[1, 53, 23, 37, 54, 24],
	[19, 45, 15, 26, 46, 16],

	// 30
	[5, 145, 115, 10, 146, 116],
	[19, 75, 47, 10, 76, 48],
	[15, 54, 24, 25, 55, 25],
	[23, 45, 15, 25, 46, 16],

	// 31
	[13, 145, 115, 3, 146, 116],
	[2, 74, 46, 29, 75, 47],
	[42, 54, 24, 1, 55, 25],
	[23, 45, 15, 28, 46, 16],

	// 32
	[17, 145, 115],
	[10, 74, 46, 23, 75, 47],
	[10, 54, 24, 35, 55, 25],
	[19, 45, 15, 35, 46, 16],

	// 33
	[17, 145, 115, 1, 146, 116],
	[14, 74, 46, 21, 75, 47],
	[29, 54, 24, 19, 55, 25],
	[11, 45, 15, 46, 46, 16],

	// 34
	[13, 145, 115, 6, 146, 116],
	[14, 74, 46, 23, 75, 47],
	[44, 54, 24, 7, 55, 25],
	[59, 46, 16, 1, 47, 17],

	// 35
	[12, 151, 121, 7, 152, 122],
	[12, 75, 47, 26, 76, 48],
	[39, 54, 24, 14, 55, 25],
	[22, 45, 15, 41, 46, 16],

	// 36
	[6, 151, 121, 14, 152, 122],
	[6, 75, 47, 34, 76, 48],
	[46, 54, 24, 10, 55, 25],
	[2, 45, 15, 64, 46, 16],

	// 37
	[17, 152, 122, 4, 153, 123],
	[29, 74, 46, 14, 75, 47],
	[49, 54, 24, 10, 55, 25],
	[24, 45, 15, 46, 46, 16],

	// 38
	[4, 152, 122, 18, 153, 123],
	[13, 74, 46, 32, 75, 47],
	[48, 54, 24, 14, 55, 25],
	[42, 45, 15, 32, 46, 16],

	// 39
	[20, 147, 117, 4, 148, 118],
	[40, 75, 47, 7, 76, 48],
	[43, 54, 24, 22, 55, 25],
	[10, 45, 15, 67, 46, 16],

	// 40
	[19, 148, 118, 6, 149, 119],
	[18, 75, 47, 31, 76, 48],
	[34, 54, 24, 34, 55, 25],
	[20, 45, 15, 61, 46, 16]
];

QRRSBlock.getRSBlocks = function(typeNumber, errorCorrectLevel) {
	
	var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);
	
	if (rsBlock === undefined) {
		throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
	}

	var length = rsBlock.length / 3;
	
	var list = [];
	
	for (var i = 0; i < length; i++) {

		var count = rsBlock[i * 3 + 0];
		var totalCount = rsBlock[i * 3 + 1];
		var dataCount  = rsBlock[i * 3 + 2];

		for (var j = 0; j < count; j++) {
			list.push(new QRRSBlock(totalCount, dataCount) );	
		}
	}
	
	return list;
};

QRRSBlock.getRsBlockTable = function(typeNumber, errorCorrectLevel) {

	switch(errorCorrectLevel) {
	case QRErrorCorrectLevel.L :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
	case QRErrorCorrectLevel.M :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
	case QRErrorCorrectLevel.Q :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
	case QRErrorCorrectLevel.H :
		return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
	default :
		return undefined;
	}
};

module.exports = QRRSBlock;

},
'./QRUtil':function(module,exports,require){
var QRMode = require('./QRMode');
var QRPolynomial = require('./QRPolynomial');
var QRMath = require('./QRMath');
var QRMaskPattern = require('./QRMaskPattern');

var QRUtil = {

    PATTERN_POSITION_TABLE : [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],        
        [6, 32, 58],
        [6, 34, 62],
        [6, 26, 46, 66],
        [6, 26, 48, 70],
        [6, 26, 50, 74],
        [6, 30, 54, 78],
        [6, 30, 56, 82],
        [6, 30, 58, 86],
        [6, 34, 62, 90],
        [6, 28, 50, 72, 94],
        [6, 26, 50, 74, 98],
        [6, 30, 54, 78, 102],
        [6, 28, 54, 80, 106],
        [6, 32, 58, 84, 110],
        [6, 30, 58, 86, 114],
        [6, 34, 62, 90, 118],
        [6, 26, 50, 74, 98, 122],
        [6, 30, 54, 78, 102, 126],
        [6, 26, 52, 78, 104, 130],
        [6, 30, 56, 82, 108, 134],
        [6, 34, 60, 86, 112, 138],
        [6, 30, 58, 86, 114, 142],
        [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150],
        [6, 24, 50, 76, 102, 128, 154],
        [6, 28, 54, 80, 106, 132, 158],
        [6, 32, 58, 84, 110, 136, 162],
        [6, 26, 54, 82, 110, 138, 166],
        [6, 30, 58, 86, 114, 142, 170]
    ],

    G15 : (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0),
    G18 : (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0),
    G15_MASK : (1 << 14) | (1 << 12) | (1 << 10)    | (1 << 4) | (1 << 1),

    getBCHTypeInfo : function(data) {
        var d = data << 10;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
            d ^= (QRUtil.G15 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) ) );    
        }
        return ( (data << 10) | d) ^ QRUtil.G15_MASK;
    },

    getBCHTypeNumber : function(data) {
        var d = data << 12;
        while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
            d ^= (QRUtil.G18 << (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) ) );    
        }
        return (data << 12) | d;
    },

    getBCHDigit : function(data) {

        var digit = 0;

        while (data !== 0) {
            digit++;
            data >>>= 1;
        }

        return digit;
    },

    getPatternPosition : function(typeNumber) {
        return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    },

    getMask : function(maskPattern, i, j) {
        
        switch (maskPattern) {
            
        case QRMaskPattern.PATTERN000 : return (i + j) % 2 === 0;
        case QRMaskPattern.PATTERN001 : return i % 2 === 0;
        case QRMaskPattern.PATTERN010 : return j % 3 === 0;
        case QRMaskPattern.PATTERN011 : return (i + j) % 3 === 0;
        case QRMaskPattern.PATTERN100 : return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 === 0;
        case QRMaskPattern.PATTERN101 : return (i * j) % 2 + (i * j) % 3 === 0;
        case QRMaskPattern.PATTERN110 : return ( (i * j) % 2 + (i * j) % 3) % 2 === 0;
        case QRMaskPattern.PATTERN111 : return ( (i * j) % 3 + (i + j) % 2) % 2 === 0;

        default :
            throw new Error("bad maskPattern:" + maskPattern);
        }
    },

    getErrorCorrectPolynomial : function(errorCorrectLength) {

        var a = new QRPolynomial([1], 0);

        for (var i = 0; i < errorCorrectLength; i++) {
            a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0) );
        }

        return a;
    },

    getLengthInBits : function(mode, type) {

        if (1 <= type && type < 10) {

            // 1 - 9

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 10;
            case QRMode.MODE_ALPHA_NUM  : return 9;
            case QRMode.MODE_8BIT_BYTE  : return 8;
            case QRMode.MODE_KANJI      : return 8;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 27) {

            // 10 - 26

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 12;
            case QRMode.MODE_ALPHA_NUM  : return 11;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 10;
            default :
                throw new Error("mode:" + mode);
            }

        } else if (type < 41) {

            // 27 - 40

            switch(mode) {
            case QRMode.MODE_NUMBER     : return 14;
            case QRMode.MODE_ALPHA_NUM  : return 13;
            case QRMode.MODE_8BIT_BYTE  : return 16;
            case QRMode.MODE_KANJI      : return 12;
            default :
                throw new Error("mode:" + mode);
            }

        } else {
            throw new Error("type:" + type);
        }
    },

    getLostPoint : function(qrCode) {
        
        var moduleCount = qrCode.getModuleCount();
        var lostPoint = 0;
        var row = 0; 
        var col = 0;

        
        // LEVEL1
        
        for (row = 0; row < moduleCount; row++) {

            for (col = 0; col < moduleCount; col++) {

                var sameCount = 0;
                var dark = qrCode.isDark(row, col);

                for (var r = -1; r <= 1; r++) {

                    if (row + r < 0 || moduleCount <= row + r) {
                        continue;
                    }

                    for (var c = -1; c <= 1; c++) {

                        if (col + c < 0 || moduleCount <= col + c) {
                            continue;
                        }

                        if (r === 0 && c === 0) {
                            continue;
                        }

                        if (dark === qrCode.isDark(row + r, col + c) ) {
                            sameCount++;
                        }
                    }
                }

                if (sameCount > 5) {
                    lostPoint += (3 + sameCount - 5);
                }
            }
        }

        // LEVEL2

        for (row = 0; row < moduleCount - 1; row++) {
            for (col = 0; col < moduleCount - 1; col++) {
                var count = 0;
                if (qrCode.isDark(row,     col    ) ) count++;
                if (qrCode.isDark(row + 1, col    ) ) count++;
                if (qrCode.isDark(row,     col + 1) ) count++;
                if (qrCode.isDark(row + 1, col + 1) ) count++;
                if (count === 0 || count === 4) {
                    lostPoint += 3;
                }
            }
        }

        // LEVEL3

        for (row = 0; row < moduleCount; row++) {
            for (col = 0; col < moduleCount - 6; col++) {
                if (qrCode.isDark(row, col) && 
                        !qrCode.isDark(row, col + 1) && 
                         qrCode.isDark(row, col + 2) && 
                         qrCode.isDark(row, col + 3) && 
                         qrCode.isDark(row, col + 4) && 
                        !qrCode.isDark(row, col + 5) && 
                         qrCode.isDark(row, col + 6) ) {
                    lostPoint += 40;
                }
            }
        }

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount - 6; row++) {
                if (qrCode.isDark(row, col) &&
                        !qrCode.isDark(row + 1, col) &&
                         qrCode.isDark(row + 2, col) &&
                         qrCode.isDark(row + 3, col) &&
                         qrCode.isDark(row + 4, col) &&
                        !qrCode.isDark(row + 5, col) &&
                         qrCode.isDark(row + 6, col) ) {
                    lostPoint += 40;
                }
            }
        }

        // LEVEL4
        
        var darkCount = 0;

        for (col = 0; col < moduleCount; col++) {
            for (row = 0; row < moduleCount; row++) {
                if (qrCode.isDark(row, col) ) {
                    darkCount++;
                }
            }
        }
        
        var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;

        return lostPoint;       
    }

};

module.exports = QRUtil;

},
'./index':function(module,exports,require){
//---------------------------------------------------------------------
// QRCode for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//   http://www.opensource.org/licenses/mit-license.php
//
// The word "QR Code" is registered trademark of 
// DENSO WAVE INCORPORATED
//   http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------
// Modified to work in node for this project (and some refactoring)
//---------------------------------------------------------------------

var QR8bitByte = require('./QR8bitByte');
var QRUtil = require('./QRUtil');
var QRPolynomial = require('./QRPolynomial');
var QRRSBlock = require('./QRRSBlock');
var QRBitBuffer = require('./QRBitBuffer');

function QRCode(typeNumber, errorCorrectLevel) {
	this.typeNumber = typeNumber;
	this.errorCorrectLevel = errorCorrectLevel;
	this.modules = null;
	this.moduleCount = 0;
	this.dataCache = null;
	this.dataList = [];
}

QRCode.prototype = {
	
	addData : function(data) {
		var newData = new QR8bitByte(data);
		this.dataList.push(newData);
		this.dataCache = null;
	},
	
	isDark : function(row, col) {
		if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
			throw new Error(row + "," + col);
		}
		return this.modules[row][col];
	},

	getModuleCount : function() {
		return this.moduleCount;
	},
	
	make : function() {
		// Calculate automatically typeNumber if provided is < 1
		if (this.typeNumber < 1 ){
			var typeNumber = 1;
			for (typeNumber = 1; typeNumber < 40; typeNumber++) {
				var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, this.errorCorrectLevel);

				var buffer = new QRBitBuffer();
				var totalDataCount = 0;
				for (var i = 0; i < rsBlocks.length; i++) {
					totalDataCount += rsBlocks[i].dataCount;
				}

				for (var x = 0; x < this.dataList.length; x++) {
					var data = this.dataList[x];
					buffer.put(data.mode, 4);
					buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
					data.write(buffer);
				}
				if (buffer.getLengthInBits() <= totalDataCount * 8)
					break;
			}
			this.typeNumber = typeNumber;
		}
		this.makeImpl(false, this.getBestMaskPattern() );
	},
	
	makeImpl : function(test, maskPattern) {
		
		this.moduleCount = this.typeNumber * 4 + 17;
		this.modules = new Array(this.moduleCount);
		
		for (var row = 0; row < this.moduleCount; row++) {
			
			this.modules[row] = new Array(this.moduleCount);
			
			for (var col = 0; col < this.moduleCount; col++) {
				this.modules[row][col] = null;//(col + row) % 3;
			}
		}
	
		this.setupPositionProbePattern(0, 0);
		this.setupPositionProbePattern(this.moduleCount - 7, 0);
		this.setupPositionProbePattern(0, this.moduleCount - 7);
		this.setupPositionAdjustPattern();
		this.setupTimingPattern();
		this.setupTypeInfo(test, maskPattern);
		
		if (this.typeNumber >= 7) {
			this.setupTypeNumber(test);
		}
	
		if (this.dataCache === null) {
			this.dataCache = QRCode.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
		}
	
		this.mapData(this.dataCache, maskPattern);
	},

	setupPositionProbePattern : function(row, col)  {
		
		for (var r = -1; r <= 7; r++) {
			
			if (row + r <= -1 || this.moduleCount <= row + r) continue;
			
			for (var c = -1; c <= 7; c++) {
				
				if (col + c <= -1 || this.moduleCount <= col + c) continue;
				
				if ( (0 <= r && r <= 6 && (c === 0 || c === 6) ) || 
                     (0 <= c && c <= 6 && (r === 0 || r === 6) ) || 
                     (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
					this.modules[row + r][col + c] = true;
				} else {
					this.modules[row + r][col + c] = false;
				}
			}		
		}		
	},
	
	getBestMaskPattern : function() {
	
		var minLostPoint = 0;
		var pattern = 0;
	
		for (var i = 0; i < 8; i++) {
			
			this.makeImpl(true, i);
	
			var lostPoint = QRUtil.getLostPoint(this);
	
			if (i === 0 || minLostPoint >  lostPoint) {
				minLostPoint = lostPoint;
				pattern = i;
			}
		}
	
		return pattern;
	},
	
	createMovieClip : function(target_mc, instance_name, depth) {
	
		var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
		var cs = 1;
	
		this.make();

		for (var row = 0; row < this.modules.length; row++) {
			
			var y = row * cs;
			
			for (var col = 0; col < this.modules[row].length; col++) {
	
				var x = col * cs;
				var dark = this.modules[row][col];
			
				if (dark) {
					qr_mc.beginFill(0, 100);
					qr_mc.moveTo(x, y);
					qr_mc.lineTo(x + cs, y);
					qr_mc.lineTo(x + cs, y + cs);
					qr_mc.lineTo(x, y + cs);
					qr_mc.endFill();
				}
			}
		}
		
		return qr_mc;
	},

	setupTimingPattern : function() {
		
		for (var r = 8; r < this.moduleCount - 8; r++) {
			if (this.modules[r][6] !== null) {
				continue;
			}
			this.modules[r][6] = (r % 2 === 0);
		}
	
		for (var c = 8; c < this.moduleCount - 8; c++) {
			if (this.modules[6][c] !== null) {
				continue;
			}
			this.modules[6][c] = (c % 2 === 0);
		}
	},
	
	setupPositionAdjustPattern : function() {
	
		var pos = QRUtil.getPatternPosition(this.typeNumber);
		
		for (var i = 0; i < pos.length; i++) {
		
			for (var j = 0; j < pos.length; j++) {
			
				var row = pos[i];
				var col = pos[j];
				
				if (this.modules[row][col] !== null) {
					continue;
				}
				
				for (var r = -2; r <= 2; r++) {
				
					for (var c = -2; c <= 2; c++) {
					
						if (Math.abs(r) === 2 || 
                            Math.abs(c) === 2 ||
                            (r === 0 && c === 0) ) {
							this.modules[row + r][col + c] = true;
						} else {
							this.modules[row + r][col + c] = false;
						}
					}
				}
			}
		}
	},
	
	setupTypeNumber : function(test) {
	
		var bits = QRUtil.getBCHTypeNumber(this.typeNumber);
        var mod;
	
		for (var i = 0; i < 18; i++) {
			mod = (!test && ( (bits >> i) & 1) === 1);
			this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
		}
	
		for (var x = 0; x < 18; x++) {
			mod = (!test && ( (bits >> x) & 1) === 1);
			this.modules[x % 3 + this.moduleCount - 8 - 3][Math.floor(x / 3)] = mod;
		}
	},
	
	setupTypeInfo : function(test, maskPattern) {
	
		var data = (this.errorCorrectLevel << 3) | maskPattern;
		var bits = QRUtil.getBCHTypeInfo(data);
        var mod;
	
		// vertical		
		for (var v = 0; v < 15; v++) {
	
			mod = (!test && ( (bits >> v) & 1) === 1);
	
			if (v < 6) {
				this.modules[v][8] = mod;
			} else if (v < 8) {
				this.modules[v + 1][8] = mod;
			} else {
				this.modules[this.moduleCount - 15 + v][8] = mod;
			}
		}
	
		// horizontal
		for (var h = 0; h < 15; h++) {
	
			mod = (!test && ( (bits >> h) & 1) === 1);
			
			if (h < 8) {
				this.modules[8][this.moduleCount - h - 1] = mod;
			} else if (h < 9) {
				this.modules[8][15 - h - 1 + 1] = mod;
			} else {
				this.modules[8][15 - h - 1] = mod;
			}
		}
	
		// fixed module
		this.modules[this.moduleCount - 8][8] = (!test);
	
	},
	
	mapData : function(data, maskPattern) {
		
		var inc = -1;
		var row = this.moduleCount - 1;
		var bitIndex = 7;
		var byteIndex = 0;
		
		for (var col = this.moduleCount - 1; col > 0; col -= 2) {
	
			if (col === 6) col--;
	
			while (true) {
	
				for (var c = 0; c < 2; c++) {
					
					if (this.modules[row][col - c] === null) {
						
						var dark = false;
	
						if (byteIndex < data.length) {
							dark = ( ( (data[byteIndex] >>> bitIndex) & 1) === 1);
						}
	
						var mask = QRUtil.getMask(maskPattern, row, col - c);
	
						if (mask) {
							dark = !dark;
						}
						
						this.modules[row][col - c] = dark;
						bitIndex--;
	
						if (bitIndex === -1) {
							byteIndex++;
							bitIndex = 7;
						}
					}
				}
								
				row += inc;
	
				if (row < 0 || this.moduleCount <= row) {
					row -= inc;
					inc = -inc;
					break;
				}
			}
		}
		
	}

};

QRCode.PAD0 = 0xEC;
QRCode.PAD1 = 0x11;

QRCode.createData = function(typeNumber, errorCorrectLevel, dataList) {
	
	var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
	
	var buffer = new QRBitBuffer();
	
	for (var i = 0; i < dataList.length; i++) {
		var data = dataList[i];
		buffer.put(data.mode, 4);
		buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber) );
		data.write(buffer);
	}

	// calc num max data.
	var totalDataCount = 0;
	for (var x = 0; x < rsBlocks.length; x++) {
		totalDataCount += rsBlocks[x].dataCount;
	}

	if (buffer.getLengthInBits() > totalDataCount * 8) {
		throw new Error("code length overflow. (" + 
            buffer.getLengthInBits() + 
            ">" +  
            totalDataCount * 8 + 
            ")");
	}

	// end code
	if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
		buffer.put(0, 4);
	}

	// padding
	while (buffer.getLengthInBits() % 8 !== 0) {
		buffer.putBit(false);
	}

	// padding
	while (true) {
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD0, 8);
		
		if (buffer.getLengthInBits() >= totalDataCount * 8) {
			break;
		}
		buffer.put(QRCode.PAD1, 8);
	}

	return QRCode.createBytes(buffer, rsBlocks);
};

QRCode.createBytes = function(buffer, rsBlocks) {

	var offset = 0;
	
	var maxDcCount = 0;
	var maxEcCount = 0;
	
	var dcdata = new Array(rsBlocks.length);
	var ecdata = new Array(rsBlocks.length);
	
	for (var r = 0; r < rsBlocks.length; r++) {

		var dcCount = rsBlocks[r].dataCount;
		var ecCount = rsBlocks[r].totalCount - dcCount;

		maxDcCount = Math.max(maxDcCount, dcCount);
		maxEcCount = Math.max(maxEcCount, ecCount);
		
		dcdata[r] = new Array(dcCount);
		
		for (var i = 0; i < dcdata[r].length; i++) {
			dcdata[r][i] = 0xff & buffer.buffer[i + offset];
		}
		offset += dcCount;
		
		var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
		var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);

		var modPoly = rawPoly.mod(rsPoly);
		ecdata[r] = new Array(rsPoly.getLength() - 1);
		for (var x = 0; x < ecdata[r].length; x++) {
            var modIndex = x + modPoly.getLength() - ecdata[r].length;
			ecdata[r][x] = (modIndex >= 0)? modPoly.get(modIndex) : 0;
		}

	}
	
	var totalCodeCount = 0;
	for (var y = 0; y < rsBlocks.length; y++) {
		totalCodeCount += rsBlocks[y].totalCount;
	}

	var data = new Array(totalCodeCount);
	var index = 0;

	for (var z = 0; z < maxDcCount; z++) {
		for (var s = 0; s < rsBlocks.length; s++) {
			if (z < dcdata[s].length) {
				data[index++] = dcdata[s][z];
			}
		}
	}

	for (var xx = 0; xx < maxEcCount; xx++) {
		for (var t = 0; t < rsBlocks.length; t++) {
			if (xx < ecdata[t].length) {
				data[index++] = ecdata[t][xx];
			}
		}
	}

	return data;

};

module.exports = QRCode;

},
};const cache={};function require(name){if(!cache[name]){const module={exports:{}};cache[name]=module;factories[name](module,module.exports,require);}return cache[name].exports;}return require('./index');})();
function generarQRLocalCAP(e,texto){const q=new QRLocalCAP(-1,1);q.addData(texto);q.make();const n=q.getModuleCount(),quiet=4,cell=4,canvas=document.createElement('canvas');canvas.width=canvas.height=(n+quiet*2)*cell;canvas.style.width='200px';canvas.style.height='200px';canvas.setAttribute('aria-label','QR del viaje');const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle='black';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(q.isDark(y,x))c.fillRect((x+quiet)*cell,(y+quiet)*cell,cell,cell);e.appendChild(canvas);}

// Gasificado obligatorio entre Acopio y Enfriado/Despacho.
AppState.uva.gasificado ||= {config:null,pallets:[]};uvaTabs.gasificado='ingreso';
const ubicacionesUva={gasificado:'',enfriado:''};
const tarjetaAntesGas=tarjetaUva;
tarjetaUva=function(p,m,accion=''){let html=tarjetaAntesGas(p,m==='gasificado'?'enfriado':m,accion);if(m==='gasificado')html=html.replace('<p>Tipo Embalaje:',`<p>Campo: <b>${safe(p.camara||'—')}</b></p><p>Tipo Embalaje:`);if(m==='enfriado')html=html.replace('<p>Tipo Embalaje:',`<p>Túnel: <b>${safe(p.tunel||'—')}</b></p><p>Tipo Embalaje:`);if(m==='gasificado'&&p.salida)html=html.replace('<div class="detalle-producto">',`<p class="gas-envio">Enviado a: ${p.destinoSalida==='enfriado'?'Enfriado':'Despacho'} · Hora de envío: ${horaUva(p.salida)}</p><div class="detalle-producto">`);return html;};
const renderAntesGas=renderUva;
function selectorLugarUva(m){return `<label class="selector-lugar">${m==='gasificado'?'Campo':'Seleccionar tipo de túnel'}<select onchange="ubicacionesUva['${m}']=this.value"><option value="">Seleccionar</option>${[1,2].map(n=>{const v=(m==='gasificado'?'Cámara ':'Túnel ')+n;return `<option ${ubicacionesUva[m]===v?'selected':''}>${v}</option>`;}).join('')}</select></label>`;}
renderUva=function(m,p){if(m!=='gasificado'){renderAntesGas(m,p);if(m==='enfriado'&&p==='gestion'&&uvaTabs.enfriado==='ingreso'){const el=document.getElementById('uva-enfriado-gestion');el.querySelector('.uva-contadores')?.insertAdjacentHTML('beforebegin',selectorLugarUva(m));}return;}const el=document.getElementById('uva-gasificado-'+p),d=registroUva(m);if(!el)return;const cabeza=`<div class="uva-persona"><p>Usuario: <b>${safe(usuarioUva())}</b></p><p>Planta gasificada: <b>${safe(d.config?.lugar||'Sin registrar')}</b></p></div>`;
if(p==='home'){el.innerHTML='<div class="uva-home-subtitulo">Gasificado Uva</div><div class="uva-home-cifras"><div><b>'+d.pallets.filter(x=>!x.salida).length+'</b><span>Pendientes</span></div><div><b>'+d.pallets.filter(x=>x.salida).length+'</b><span>Finalizados</span></div></div>';return;}
if(p==='maestra'){el.innerHTML=maestraHTML();return;}
if(p==='registro'){el.innerHTML=`<div class="uva-persona uva-registro"><label>Fundo<select id="uva-fundo-gasificado"><option value="">Seleccionar fundo</option><option>AGRICULTOR</option></select></label><label>Planta gasificada<select id="uva-lugar-gasificado"><option value="">Seleccionar</option><option>PLANTA GASIFICADA</option></select></label><button class="boton-principal" onclick="guardarRegistroUva('gasificado')">Guardar</button></div>`;document.getElementById('uva-fundo-gasificado').value=d.config?.fundo||'';document.getElementById('uva-lugar-gasificado').value=d.config?.lugar||'';return;}
const tab=uvaTabs.gasificado,ps=(p==='resumen'?d.pallets:d.pallets.filter(x=>tab==='ingreso'?!x.salida:!!x.salida)).slice().reverse();el.innerHTML=cabeza+(p==='gestion'&&tab==='ingreso'?selectorLugarUva(m):'')+`<div class="uva-contadores">${conteosPallets(ps)}${p==='gestion'?`<button onclick="camaraUva('gasificado','${tab}')" aria-label="Leer pallet"><i class="fa-solid fa-camera"></i></button>`:''}</div>`+ps.map(x=>tarjetaUva(x,m)).join('')+(!ps.length?'<p class="estado-vacio">No hay pallets registrados.</p>':'')+(p==='gestion'?`<div class="uva-tabs"><button class="${tab==='ingreso'?'activo':''}" onclick="tabUva('gasificado','ingreso')">Ingreso gasificado</button><button class="${tab==='salida'?'activo':''}" onclick="tabUva('gasificado','salida')">Salida gasificado</button></div>`:'<div class="uva-tabs"><button class="activo">▤ Recepción</button></div>');};
confirmarDestinoPalletFinal=function(){const p=AppState.palletsAcopio.find(x=>x.id===AppState.palletEnCierreId);if(!p||p.estado!=='PROCESO')return;const code=AppState.codigoPalletLeido||p.codigoQR;if(!/^\d{11}$/.test(code))return avisoApp('El pallet requiere 11 dígitos numéricos.');if(AppState.palletsAcopio.some(x=>x!==p&&x.codigoQR===code))return avisoApp('QR duplicado.');Object.assign(p,{codigoQR:code,estado:'CERRADO',destino:'GASIFICADO',horaFin:horaActual(),horaEnvio:horaActual()});AppState.codigoPalletLeido=null;AppState.palletEnCierreId=null;cerrarModalDestinoPallet();actualizarAcopio();switchSubtabAcopio('transferencia');};
cerrarPalletAcopioClick=async function(pid){const p=AppState.palletsAcopio.find(x=>x.id===pid);if(!p||p.estado!=='PROCESO')return;if(!await confirmarApp('¿Cerrar y enviar el pallet a Gasificado?'))return;AppState.palletEnCierreId=pid;AppState.codigoPalletLeido=p.codigoQR||nuevoCodigoPallet();confirmarDestinoPalletFinal();};
prepararDatosPruebaUva=function(m){if(m!=='gasificado')return;['J1','J2'].forEach((f,i)=>{if(AppState.palletsAcopio.some(p=>p.demostracion&&p.formato===f&&!registroUva(m).pallets.some(x=>x.codigoQR===p.codigoQR)))return;const code=nuevoCodigoPallet();AppState.palletsAcopio.push({id:code,codigoQR:code,demostracion:true,estado:'CERRADO',destino:'GASIFICADO',formato:f,cant:66,tempPromedio:14+i,embalaje:'JBU - Jaba Uva',parcela:'PARCELA 800',tipo:'CONVENCIONAL',horaInicio:horaActual(),horaFin:horaActual(),horaEnvio:horaActual(),lineas:[{formato:f,nombre:f+'-JABA UVA 8 G SWEET GLOBE EXPORTABLE',cant:66,factores:'(1.0/1.0)'}],origenes:[]});});guardarLocal();};
function elegirDestinoGasificado(){return new Promise(resolve=>{const modal=document.createElement('div');modal.className='cantidad-overlay';modal.innerHTML=`<div class="cantidad-dialog destino-gas-dialog" role="dialog" aria-modal="true" aria-labelledby="destino-gas-titulo"><h3 id="destino-gas-titulo">¿Dónde desea enviar el pallet?</h3><div class="destinos-verticales"><label><input type="radio" name="destino-gas" value="enfriado"> Enviar a Enfriado</label><label><input type="radio" name="destino-gas" value="despacho"> Enviar a Despacho</label></div><p class="campo-error"></p><footer><button data-cancel>Cancelar</button><button data-confirm disabled>Confirmar envío</button></footer></div>`;document.getElementById('app-shell').appendChild(modal);const confirmar=modal.querySelector('[data-confirm]');modal.querySelectorAll('input').forEach(i=>i.onchange=()=>{confirmar.disabled=false;});const terminar=x=>{modal.remove();resolve(x);};modal.querySelector('[data-cancel]').onclick=()=>terminar(null);confirmar.onclick=()=>{const seleccionado=modal.querySelector('input:checked');if(seleccionado)terminar(seleccionado.value);};modal.querySelector('input').focus();});}
const leerAntesGas=leerPalletUva;
leerPalletUva=async function(m,op,raw){const code=codigoUva(raw);if(!/^\d{11}$/.test(code))return avisoApp('El código del pallet debe tener 11 dígitos numéricos.');if(m!=='gasificado'){if(op==='ingreso'||op==='recepcion'){const gas=registroUva('gasificado').pallets.find(p=>p.codigoQR===code);if(!gas?.salida)return avisoApp('El pallet debe completar Gasificado antes de recepcionarse.');if(m==='enfriado'&&gas.destinoSalida!=='enfriado')return avisoApp('Este pallet fue enviado a Despacho.');if(m==='despacho'&&gas.destinoSalida==='enfriado'&&!registroUva('enfriado').pallets.some(p=>p.codigoQR===code&&p.salida))return avisoApp('El pallet debe completar Enfriado.');if(m==='enfriado'&&!ubicacionesUva.enfriado)return avisoApp('Seleccione el túnel.');}await leerAntesGas(m,op,raw);const p=registroUva(m).pallets.find(p=>p.codigoQR===code);if(m==='enfriado'&&op==='ingreso'&&p&&!p.tunel){p.tunel=ubicacionesUva.enfriado;guardarLocal();renderUva(m,'gestion');}return;}
if(uvaBusy)return;uvaBusy=true;try{const d=registroUva(m);if(!d.config)return avisoApp('Guarde primero el registro de Gasificado.');if(op==='salida'){const p=d.pallets.find(p=>p.codigoQR===code);if(!p||p.salida)return avisoApp('Seleccione un pallet pendiente de salida.');if(!await confirmarApp('¿Confirmar salida con '+p.cant+' jabas?'))return;const destino=await elegirDestinoGasificado();if(!destino)return;Object.assign(p,{salida:fechaUva(),destinoSalida:destino,usuarioSalida:usuarioUva()});const origen=AppState.palletsAcopio.find(x=>x.codigoQR===code);if(origen){origen.destino=destino==='enfriado'?'PLANTA ENFRIADO':'DESPACHO';ajustarCantidadPallet(origen,p.cant);}guardarLocal();tabUva(m,'salida');return;}
if(!ubicacionesUva.gasificado)return avisoApp('Seleccione Cámara 1 o Cámara 2.');if(d.pallets.some(p=>p.codigoQR===code))return avisoApp('Este pallet ya fue recepcionado.');const source=AppState.palletsAcopio.find(p=>p.codigoQR===code&&p.estado==='CERRADO'&&p.destino==='GASIFICADO');if(!source)return avisoApp('Se requiere un pallet enviado desde Acopio a Gasificado.');const n=await cantidadRecepcionUva(source.cant,code);if(n===null)return;const p=JSON.parse(JSON.stringify(source));ajustarCantidadPallet(p,n);Object.assign(p,{ingreso:fechaUva(),salida:null,camara:ubicacionesUva.gasificado,usuarioIngreso:usuarioUva()});d.pallets.push(p);guardarLocal();tabUva(m,'ingreso');}finally{uvaBusy=false;}};
camaraUva=function(m,op){const d=registroUva(m);if(!d.config)return avisoApp('Guarde primero el registro.');if((m==='gasificado'||m==='enfriado')&&op==='ingreso'&&!ubicacionesUva[m])return avisoApp(m==='gasificado'?'Seleccione una cámara.':'Seleccione un túnel.');const modal=document.getElementById('modal-uva-prueba');modal.dataset.modulo=m;modal.dataset.operacion=op;let ps;if(op==='salida')ps=d.pallets.filter(p=>!p.salida);else if(op==='agregar')ps=d.pallets.filter(p=>!p.viaje&&!d.grupo.includes(p.id));else{prepararDatosPruebaUva(m);ps=AppState.palletsAcopio.filter(p=>p.estado==='CERRADO'&&!d.pallets.some(x=>x.codigoQR===p.codigoQR)&&(m==='gasificado'?p.destino==='GASIFICADO':registroUva('gasificado').pallets.some(g=>g.codigoQR===p.codigoQR&&g.salida&&(m==='enfriado'?g.destinoSalida==='enfriado':g.destinoSalida==='despacho'||registroUva('enfriado').pallets.some(e=>e.codigoQR===p.codigoQR&&e.salida)))));}
document.getElementById('uva-lista-prueba').innerHTML=ps.slice().reverse().map(p=>`<option value="${safe(p.codigoQR)}">${safe(p.codigoQR)} · ${safe(p.formato)} · ${p.cant} jabas</option>`).join('');document.getElementById('uva-simular').disabled=!ps.length;document.getElementById('uva-prueba-nota').textContent=ps.length?'Seleccione un pallet para simular su lectura.':'No hay pallets disponibles; complete la etapa anterior.';modal.classList.remove('hidden');};

// Trazabilidad de origen conservada en Recepción, Transferencia, QR y Resumen.
function trazaOrigenDespacho(code){const gas=registroUva('gasificado').pallets.find(x=>x.codigoQR===code),frio=registroUva('enfriado').pallets.find(x=>x.codigoQR===code&&x.salida);if(frio)return {modulo:'Enfriado',ubicacion:frio.tunel||'—',camaraGasificado:gas?.camara||'',tunelEnfriado:frio.tunel||''};return {modulo:'Gasificado',ubicacion:gas?.camara||'—',camaraGasificado:gas?.camara||'',tunelEnfriado:''};}
const leerAntesTraza=leerPalletUva;
leerPalletUva=async function(m,op,raw){await leerAntesTraza(m,op,raw);if(m==='despacho'&&op==='recepcion'){const p=registroUva(m).pallets.find(x=>x.codigoQR===codigoUva(raw));if(p&&!p.origenTraza){p.origenTraza=trazaOrigenDespacho(p.codigoQR);guardarLocal();renderUva(m,'gestion');}}};
const tarjetaAntesTraza=tarjetaUva;
tarjetaUva=function(p,m,accion=''){let html=tarjetaAntesTraza(p,m,accion);if(m==='despacho'){const t=p.origenTraza||trazaOrigenDespacho(p.codigoQR);html=html.replace('</p><p>Hora',`</p><div class="traza-pallet"><p class="origen-pallet">Origen gasificado: <b>${safe(t.camaraGasificado|| (t.modulo==='Gasificado'?t.ubicacion:'—'))}</b></p>${t.tunelEnfriado?`<p class="origen-pallet">Origen enfriado: <b>${safe(t.tunelEnfriado)}</b></p>`:''}</div><p>Hora`);}return html;};

// Catálogo definitivo de fundos/acopios en los tres registros.
const acopiosPorFundoCAP={Agroalegre:['Acopio Agro'],Terra:['Acopio 1','Acopio 3']};
function actualizarAcopiosRegistro(m,seleccion=''){const fundo=document.getElementById('uva-fundo-'+m).value,el=document.getElementById('uva-lugar-'+m);el.innerHTML='<option value="">Seleccionar pre-packing</option>'+(acopiosPorFundoCAP[fundo]||[]).map(a=>`<option>${a}</option>`).join('');el.disabled=!fundo;el.value=(acopiosPorFundoCAP[fundo]||[]).includes(seleccion)?seleccion:'';}
const renderAntesCatalogo=renderUva;
renderUva=function(m,p){if(p!=='registro'||!['gasificado','enfriado','despacho'].includes(m))return renderAntesCatalogo(m,p);const d=registroUva(m),el=document.getElementById('uva-'+m+'-registro');el.innerHTML=`<div class="uva-persona uva-registro"><label>Fundo<select id="uva-fundo-${m}" onchange="actualizarAcopiosRegistro('${m}')"><option value="">Seleccionar fundo</option><option>Agroalegre</option><option>Terra</option></select></label><label>Pre-packing<select id="uva-lugar-${m}" disabled><option value="">Seleccionar pre-packing</option></select></label><button class="boton-principal" onclick="guardarRegistroUva('${m}')">Guardar</button></div>`;document.getElementById('uva-fundo-'+m).value=acopiosPorFundoCAP[d.config?.fundo]?d.config.fundo:'';actualizarAcopiosRegistro(m,d.config?.lugar);};
guardarRegistroUva=async function(m){const fundo=document.getElementById('uva-fundo-'+m).value,lugar=document.getElementById('uva-lugar-'+m).value;if(!(acopiosPorFundoCAP[fundo]||[]).includes(lugar))return avisoApp('Seleccione un fundo y su acopio habilitado.');if(!await confirmarApp('¿Guardar el registro?'))return;registroUva(m).config={fundo,lugar};guardarLocal();abrirUva(m,'gestion');};

// Orden por la operación más reciente, incluida salida y cierre de pallets.
function marcarRegistroReciente(lista,p){if(!p)return;const i=lista.indexOf(p);if(i>=0){lista.splice(i,1);lista.push(p);}}
const cerrarAntesOrden=confirmarDestinoPalletFinal;
confirmarDestinoPalletFinal=function(){const p=AppState.palletsAcopio.find(x=>x.id===AppState.palletEnCierreId);cerrarAntesOrden();if(p?.estado==='CERRADO'){marcarRegistroReciente(AppState.palletsAcopio,p);actualizarAcopio();}};
const leerAntesOrden=leerPalletUva;
leerPalletUva=async function(m,op,raw){const p=registroUva(m).pallets.find(x=>x.codigoQR===codigoUva(raw)),prev=p?.salida;await leerAntesOrden(m,op,raw);if(op==='salida'&&p?.salida&&p.salida!==prev){marcarRegistroReciente(registroUva(m).pallets,p);guardarLocal();renderUva(m,'gestion');}};

// Los pallets nacen exclusivamente del armado en Acopio.
prepararDatosPruebaUva=function(){/* Sin generación automática de pallets. */};

// Sin datos ficticios en formularios o comprobantes antes del primer registro.
document.addEventListener('DOMContentLoaded',()=>{if(!AppState.viajesAcopio.length){['inp-recep-j1','inp-recep-j2'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=0;});}if(!AppState.viajeTransporte){const e=document.getElementById('lbl-transporte-cant-cargada');if(e)e.textContent='0';}});
