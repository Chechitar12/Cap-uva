/* QAS 1.1.78. Columnas enlazadas y trazabilidad por detalle de jabas. */
function qualityTime78(state,p,item,k){
 const cal=state.uva?.calidad50||{},line=(p.lineas||[])[k]||{};
 const source=[item,line,(p.origenes||[])[k]].filter(Boolean);
 const exact=source.find(x=>x.calidadRecepcion78);
 if(exact)return exact.calidadRecepcion78;
 const rid=source.find(x=>x.retornoCalidad)?.retornoCalidad;
 if(!rid)return '';
 const ret=(cal.devoluciones||[]).find(x=>x.id===rid);
 if(!ret)return '';
 const x=(ret.items||[]).find(x=>x.id===item.id||x.id===line.id);
 const direct=x?.calidadRecepcion78;if(direct)return direct;
 const index=(ret.items||[]).indexOf(x);
 const original=index>=0?ret.reporteOriginal70?.[index]:null;
 const receipt=(cal.recepciones||[]).find(r=>r.id===(x?.calidadRegistro78||original?.recepcionId));
 return receipt?.confirmado||'';
}
(function(){
 const R=CAPReportes70,A=x=>Array.isArray(x)?x:[],clone=x=>JSON.parse(JSON.stringify(x)),q=x=>Number(x?.cant)||0;
 const time=x=>{if(!x)return '';if(/^\d{1,2}:\d{2}(:\d{2})?$/.test(x))return String(x).split(':').map(a=>a.padStart(2,'0')).concat(String(x).split(':').length===2?['00']:[]).join(':');const d=new Date(x);return isNaN(+d)?'':d.toLocaleTimeString('es-PE',{hour12:false});};
 const day=x=>{if(!x)return '';if(/^\d{2}\/\d{2}\/\d{4}$/.test(x))return x;const d=new Date(x);return isNaN(+d)?'':d.toLocaleDateString('es-PE');};
 const fmt=x=>x?.formato||String(x?.nombre||'').match(/J[12]/)?.[0]||'';
 function project(kind,order,remove){
  const spec=R.spec[kind],old=spec.headers.slice(),builder=R[kind],blocks=[];let pos=0;
  for(const g of spec.groups){const indexes=Array.from({length:g.count},(_,i)=>pos+i).filter(i=>!remove.includes(old[i]));blocks.push({g,indexes});pos+=g.count;}
  const sorted=order.map(i=>blocks[i]),indexes=sorted.flatMap(b=>b.indexes);
  spec.headers=indexes.map(i=>old[i]);spec.groups=sorted.filter(b=>b.indexes.length).map(b=>({...b.g,count:b.indexes.length}));
  R[kind]=state=>builder(state).map(row=>indexes.map(i=>row[i]));
 }
 // General, Prepacking, Calidad, TPG, Gasificado, TGE, Enfriado, TED, TGD, Despacho, T2, Planta.
 project('acopio',[0,1,2,3,7,5,8,6,4,9,10,11],['Lote','ENF Código Viaje Transferencia','T2Guia Remision','T2Precinto']);
 project('plant',[0,1],['Lote','Tipo de lectura']);
 const qs=R.spec.quality;
 qs.headers=qs.headers.filter(h=>h!=='Lote').map(h=>h==='Hora transferencia a Calidad'?'Hora transferencia a Pre-packing':h);
 qs.groups[0].count=6;qs.groups[1].count=qs.headers.length-6;
 R.quality=function(state){
  const cal=state.uva?.calidad50||{},lots=[];
  for(const rec of A(cal.recepciones))for(const i of A(rec.itemsIniciales||rec.items)){
   lots.push({rec,item:clone(i),initial:clone(i),cantidad:q(i),action:'',actionTime:'',motivo:'',ret:null,removed:false});
  }
  const events=['cambios','desmedros','devoluciones'].flatMap(kind=>A(cal[kind]).map(r=>({kind,r}))).sort((a,b)=>String(a.r.hora||'').localeCompare(String(b.r.hora||'')));
  for(const {kind,r}of events)A(r.items).forEach((i,k)=>{
   const orig=r.reporteOriginal70?.[k]||i;let left=q(i);
   let recId=orig.recepcionId||i.calidadRegistro78;
   if(!recId){
    const matches=A(cal.recepciones).filter(rec=>A(rec.itemsIniciales||rec.items).some(x=>x.id===orig.id));
    if(matches.length===1)recId=matches[0].id;
   }
   if(!recId)return;
   const candidates=lots.filter(l=>l.rec.id===recId&&!l.removed&&!l.ret&&fmt(l.item)===fmt(orig)&&(!orig.viajeOrigen||l.item.viajeOrigen===orig.viajeOrigen)&&(!orig.producto||l.item.producto===orig.producto));
   for(const lot of candidates){
    if(!left)break;const n=Math.min(left,lot.cantidad);if(!n)continue;
    left-=n;lot.cantidad-=n;const piece={...lot,item:clone(lot.item),cantidad:n};
    if(kind==='cambios'){piece.item=clone(i);piece.action='Cambio';piece.actionTime=r.hora;}
    if(kind==='desmedros'){piece.action='Desmedro';piece.actionTime=r.hora;piece.motivo=r.motivo||'';piece.removed=true;}
    if(kind==='devoluciones')piece.ret=r;
    lots.push(piece);
   }
  });
  return lots.filter(l=>l.cantidad>0).map(l=>{
   const {rec,item:i,initial,ret}=l,vid=i.viajeOrigen||rec.viajeOrigen,v=A(state.viajesAcopio).find(x=>x.id===vid)||{};
   return [day(rec.confirmado||v.fecha||v.inicio),v.fundo||rec.fundo||'',i.parcela||v.parcela||rec.parcela||'','Uva',i.variedad||v.variedad||'',i.tipo||v.tipo||rec.tipo||'',vid||'','62-1901','César Santisteban',time(ret?.hora),time(rec.confirmado),i.producto||(/INDUSTRIAL/i.test(i.nombre||'')?'INDUSTRIAL':'EXPORTABLE'),initial.contenedor||initial.nombre||fmt(initial),l.cantidad,'62-1902','María López',l.action,time(l.actionTime),fmt(i),i.contenedor||i.nombre||fmt(i),l.cantidad,l.motivo,ret?'62-1901':'',ret?'César Santisteban':''];
  });
 };
})();

(function(){
 const colors={'Información General':'C7D2DE','Pre-packing':'C5A3DF','Calidad':'7FC8C0',
 'Traslado de Pre-packing a Gasificado':'E0B76A','Gasificado':'B9C866',
 'Traslado de Gasificado a Enfriado':'C3A08B','Enfriado':'85B6E0',
 'Traslado de Enfriado a Despacho':'A7B3E2','Traslado de Gasificado a Despacho':'DF9890',
 'Despacho':'E9B483','Transporte Externo T2':'D99DC1','Planta':'E5838D',
 'Recepción en Planta':'E5838D'};
 for(const spec of Object.values(CAPReportes70.spec))for(const g of spec.groups)g.color=colors[g.title]||g.color;
 CAPReportes70.legend79='Rutas: morado = Pre-packing → T2 → Planta; verde = vía Gasificado y Despacho; azul = vía Gasificado, Enfriado y Despacho. TPG: Pre-packing a Gasificado · TGD: Gasificado a Despacho · TGE: Gasificado a Enfriado · TED: Enfriado a Despacho.';
})();
