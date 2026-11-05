/* Captura metadatos solamente al producirse una operación nueva. No recrea horas históricas. */
(function(){
'use strict';
const seen=new WeakSet(),closed=new WeakSet(),grouped=new Set(),inPlant=new WeakSet();
const list=x=>Array.isArray(x)?x:[],clone=x=>JSON.parse(JSON.stringify(x));
const demo76={prepacking:['62-1901','César Santisteban'],calidad50:['62-1902','María López'],TPG:['62-1903','Carlos Rojas'],gasificado:['62-1904','Juan Vásquez'],TGD:['62-1905','Diego Flores'],TGE:['62-1906','Miguel Ramos'],enfriado:['62-1907','Luis Bautista'],TED:['62-1908','Jorge Medina'],despacho:['62-1909','Omar Mariños'],t2:['62-1910','Pedro Salazar'],planta:['62-1911','Ana Torres']};
const identity=m=>({nombre:demo76[m]?.[1]||usuarioUva(),codigo:demo76[m]?.[0]||''});
function stamp(x,m,init,kind='registro'){
 if(!x||typeof x!=='object')return;
 if(!seen.has(x)){seen.add(x);if(!init)x.reporte70={...x.reporte70,actor:identity(m),config:clone(AppState.uva[m]?.config||{}),creado:fechaUva()};}
 if(kind==='pallet'&&x.estado==='CERRADO'&&!closed.has(x)){closed.add(x);if(!init){x.reporte70||={};x.reporte70.cerrado=fechaUva();}}
}
function capture(init=false){
 const u=AppState.uva||{};for(const m of ['prepacking','gasificado','enfriado','despacho']){
  const d=u[m]||{},ps=m==='prepacking'?list(AppState.palletsAcopio):list(d.pallets);
  for(const p of ps)stamp(p,m,init,'pallet');for(const v of list(d.viajes))stamp(v,m,init);
  for(const id of list(d.grupo)){const key=m+'|'+id;if(!grouped.has(key)){grouped.add(key);const p=ps.find(p=>p.id===id);if(!init&&p){p.reporte70||={};p.reporte70.consolidado||=fechaUva();}}}
 }
 for(const v of list(AppState.viajesAcopio)){const fresh=!seen.has(v);stamp(v,'prepacking',init);if(fresh&&!init){v.reporte70.recepcion=fechaUva();v.reporte70.croquista=identity();}}
 for(const k of ['envios','recepciones','cambios','desmedros','devoluciones'])for(const r of list(u.calidad50?.[k])){stamp(r,'calidad50',init);if(k==='devoluciones'&&r.confirmado&&!r.reporte70?.receptor&&!init){r.reporte70||={};r.reporte70.receptor=identity();}}
 for(const k of ['recojos','entregas'])for(const r of list(u.zonas62?.[k]))stamp(r,'zonas62',init);
 for(const v of list(u.logistica?.viajes)){stamp(v,'t2',init);if(v.entradaPlanta&&!inPlant.has(v)){inPlant.add(v);if(!init){v.reporte70||={};v.reporte70.receptorPlanta=identity('planta');}}}
 for(const p of list(u.logistica?.planta))stamp(p,'planta',init);
}
capture(true);
const save=guardarLocal;guardarLocal=function(){capture();return save.apply(this,arguments);};
// Preserva formato y cantidad originales del cambio antes de mutar las líneas.
const operate=guardarOperacionCal50;
guardarOperacionCal50=async function(){const o=operacionCal50,cal=cal50(),before=new Set(['cambios','desmedros','devoluciones'].flatMap(k=>list(cal[k]))),original=list(o?.xs).filter((x,k)=>Number(document.getElementById('cal-cant50-'+k)?.value)>0).map(x=>({...clone(x.item),recepcionId:x.viaje.id}));await operate.apply(this,arguments);let updated=false;for(const k of ['cambios','desmedros','devoluciones'])for(const r of list(cal[k]))if(!before.has(r)&&!r.reporteOriginal70){r.reporteOriginal70=original;updated=true;}if(updated)guardarLocal();};
function rows(kind){return CAPReportes70[kind](AppState);}
window.abrirReportes70=function(){panelReportes71('Reportes Excel','<p>Exportar los registros de este equipo. Los procesos no realizados permanecen vacíos.</p><div class="reportes-lista70">'+[['acopio','Tiempos de acopio y traslados'],['quality','Calidad'],['plant','Recepción en Planta']].map(([k,title])=>'<button onclick="verReporte70(\''+k+'\')"><i class="fa-solid fa-file-excel"></i><span>'+title+'<small>'+rows(k).length+' detalles registrados</small></span></button>').join('')+'</div>',boton40('Volver a módulos','cerrarReportes71()'));};
let reporteActual70=null;
const esc70=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function filtros70(){const value=k=>document.getElementById('r70-'+k)?.value||'';return Object.fromEntries(['inicio','fin','cultivo','parcela','lote','busqueda'].map(k=>[k,value(k)]));}
function filtrarReporte70(kind){return CAPReportes70.filter(kind,rows(kind),reporteActual70===kind&&document.getElementById('r70-inicio')?filtros70():{});}
window.verReporte70=function(kind){
 reporteActual70=kind;const data=rows(kind),hs=CAPReportes70.spec[kind].headers;
 const choices=label=>[...new Set(data.map(r=>r[hs.indexOf(label)]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'es'));
 const crop=hs.includes('Cultivo')?'Cultivo':'Tipo de cultivo';
 const select=(key,label,values)=>'<label>'+label+'<select id="r70-'+key+'" onchange="actualizarReporte70()"><option value="">Todos</option>'+values.map(v=>'<option value="'+esc70(v)+'">'+esc70(v)+'</option>').join('')+'</select></label>';
 panelReportes71(CAPReportes70.spec[kind].title,'<div class="r70-filtros"><label>Fecha inicio<input id="r70-inicio" type="date" onchange="actualizarReporte70()"></label><label>Fecha fin<input id="r70-fin" type="date" onchange="actualizarReporte70()"></label>'+select('cultivo','Cultivo',choices(crop))+select('parcela','Parcela',choices('Parcela'))+(hs.includes('Lote')?select('lote','Lote',choices('Lote')):'')+'</div>'+(kind==='acopio'?'<p class="r79-leyenda">'+esc70(CAPReportes70.legend79)+'</p>':'')+'<div class="r78-busqueda"><label class="r70-buscar">Búsqueda general<input id="r70-busqueda" type="search" placeholder="Buscar en todos los campos…" oninput="actualizarReporte70()"></label>'+boton40('Exportar Excel',"descargarReporte70('"+kind+"')",'id="r70-exportar"')+boton40('Limpiar filtros','limpiarFiltros70()')+'</div><div class="r70-estado"><span id="r70-conteo"></span></div><p id="r70-error" role="alert"></p><div id="r70-preview" class="r70-preview"></div>',boton40('←','abrirReportes70()','aria-label="Volver a reportes" title="Volver a reportes"'));

 actualizarReporte70();
};
window.actualizarReporte70=function(){if(!reporteActual70||!document.getElementById('r70-preview'))return;const el=document.getElementById('r70-preview'),error=document.getElementById('r70-error'),button=document.getElementById('r70-exportar');try{const data=filtrarReporte70(reporteActual70),spec=CAPReportes70.spec[reporteActual70];error.textContent='';button.disabled=false;document.getElementById('r70-conteo').textContent=data.length+' registros filtrados';el.innerHTML=(data.length?'<table><thead><tr>'+spec.groups.map(g=>'<th colspan="'+g.count+'" style="background:#'+g.color+'">'+esc70(g.title)+'</th>').join('')+'</tr><tr>'+spec.headers.map(h=>'<th>'+esc70(h)+'</th>').join('')+'</tr></thead><tbody>'+data.slice(0,20).map(r=>'<tr>'+r.map((v,c)=>'<td'+(spec.headers[c]==='Tipo de Ruta'&&CAPReportes70.routeColor(v)?' style="background:#'+CAPReportes70.routeColor(v)+';font-weight:700"':'')+'>'+esc70(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>':'<p>Sin registros para los filtros seleccionados.</p>')+(data.length>20?'<p>Vista previa de los primeros 20 registros. Excel incluye los '+data.length+' registros filtrados.</p>':'');}catch(e){error.textContent=e.message;document.getElementById('r70-conteo').textContent='';el.innerHTML='';button.disabled=true;}};
window.limpiarFiltros70=function(){for(const k of ['inicio','fin','cultivo','parcela','lote','busqueda'])document.getElementById('r70-'+k)&&(document.getElementById('r70-'+k).value='');actualizarReporte70();};
window.descargarReporte70=function(kind){try{const spec=CAPReportes70.spec[kind];if(!spec)throw Error('Reporte no disponible.');const bytes=CAPReportes70.workbook(spec,filtrarReporte70(kind)),blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=({acopio:'Tiempos_Acopio_Traslados',quality:'Calidad',plant:'Recepcion_Planta'})[kind]+'_CAP_UVA_'+new Date().toLocaleDateString('en-CA')+'.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){avisoApp('No se pudo generar el reporte: '+e.message);}};
function buttons(){const menu=document.getElementById('menu-modulos');if(menu&&!document.getElementById('btn-reportes70'))menu.insertAdjacentHTML('afterend','<button id="btn-reportes70" onclick="abrirReportes70()"><i class="fa-solid fa-file-excel"></i> Reportes Excel</button>');for(const nav of document.querySelectorAll('[id^="drawer-"] nav'))if(!nav.querySelector('[data-reportes70]')){const b=document.createElement('button');b.dataset.reportes70='';b.innerHTML='<i class="fa-solid fa-file-excel"></i> Reportes Excel';b.onclick=()=>{nav.parentElement.classList.add('hidden');abrirReportes70();};nav.appendChild(b);}}
buttons();const style=document.createElement('style');style.textContent='.r70-filtros{display:grid;grid-template-columns:1fr 1fr;gap:10px}.r70-filtros label{display:grid;gap:4px;font-size:12px}.r70-filtros input,.r70-filtros select{min-width:0;width:100%;border:1px solid #b9c9c2;border-radius:7px;padding:8px;background:white;color:#203040}.r70-buscar{grid-column:1/-1}.r70-estado{display:flex;justify-content:space-between;align-items:center;margin:12px 0}.r70-preview{overflow:auto;max-height:300px;border:1px solid #dbe3e7}.r70-preview table{border-collapse:collapse;font-size:11px}.r70-preview th,.r70-preview td{min-width:145px;padding:8px;border:1px solid #dbe3e7;text-align:left;color:#203040}.r70-preview thead{background:#edf2f5}.r70-preview tr:nth-child(even){background:#f3f6f9}#r70-error{color:#b91c1c;font-size:12px}'+'#btn-reportes70{display:block;margin:12px auto;padding:12px 18px;border-radius:10px;background:#d5eee7;color:#164a40;font-weight:700}.reportes-lista70{display:grid;gap:12px;margin-top:15px}.reportes-lista70 button{display:flex;align-items:center;gap:12px;text-align:left;padding:14px;border:1px solid #c8ddd6;border-radius:10px;background:#eaf4ef;color:#183e34}.reportes-lista70 small{display:block;font-size:11px;margin-top:4px}';document.head.appendChild(style);
const version=document.querySelector('#view-menu .font-mono');if(version)version.textContent='QAS - 1.1.83';
})();
