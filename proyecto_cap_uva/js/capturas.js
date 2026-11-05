/* QAS 1.1.58 — Captura del marco móvil. El control nunca forma parte del PNG. */
let carpetaCapturas56=null,capturando56=false;
const botonCaptura56=document.createElement('button');
botonCaptura56.id='cap-captura56';botonCaptura56.type='button';
botonCaptura56.setAttribute('data-html2canvas-ignore','true');
botonCaptura56.setAttribute('aria-label','Guardar captura de pantalla');
botonCaptura56.title='Guardar captura · primera vez: elegir carpeta si el navegador lo permite';
botonCaptura56.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/></svg><span>Captura</span>';
botonCaptura56.addEventListener('click',capturarPantalla56);
const barraMedios57=document.createElement('div');barraMedios57.id='cap-medios57';barraMedios57.setAttribute('data-html2canvas-ignore','true');barraMedios57.setAttribute('data-cap-no-captura','true');barraMedios57.appendChild(botonCaptura56);document.getElementById('app-shell').appendChild(barraMedios57);
function nombreCaptura56(numero){const vista=document.getElementById('view-'+AppState.currentView),modal=document.getElementById('log-modal40'),titulo=document.getElementById('reportes-pc71')?.querySelector('h1')?.textContent||(modal&&!modal.classList.contains('hidden')?modal.querySelector('h2')?.textContent:vista?.querySelector('h1,h2')?.textContent);const parte=String(titulo||AppState.currentView||'Pantalla').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'_').replace(/^_|_$/g,'').slice(0,70);const d=new Date();const momento=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('')+'_'+[d.getHours(),d.getMinutes(),d.getSeconds()].map(n=>String(n).padStart(2,'0')).join('')+'_'+String(d.getMilliseconds()).padStart(3,'0');return 'CAP_UVA_'+String(numero).padStart(6,'0')+'_'+momento+'_'+parte+'.png';}
async function capturarPantalla56(){if(capturando56)return;capturando56=true;botonCaptura56.disabled=true;let destino=null;try{
 // The directory picker must run directly from the user's click.
 if(!carpetaCapturas56&&typeof window.showDirectoryPicker==='function'&&window.isSecureContext){try{carpetaCapturas56=await window.showDirectoryPicker({id:'cap-uva-capturas',mode:'readwrite',startIn:'pictures'});}catch(e){if(e.name==='AbortError')return;if(e.name!=='SecurityError'&&e.name!=='NotAllowedError')throw e;}}
 destino=carpetaCapturas56;
 if(destino?.requestPermission&&await destino.requestPermission({mode:'readwrite'})!=='granted'){carpetaCapturas56=null;destino=null;}
 const marco=document.getElementById('app-shell');if(!marco||typeof html2canvas!=='function')throw Error('No se pudo iniciar la captura. Recargue el aplicativo.');
 botonCaptura56.style.visibility='hidden';barraMedios57.style.visibility='hidden';
 if(document.fonts?.ready)await document.fonts.ready;
 estabilizarCaptura80(marco);
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const rect=marco.getBoundingClientRect(),campos73=camposCaptura73(marco);
 const canvas=await html2canvas(marco,{backgroundColor:null,scale:escalaNitida81(rect),useCORS:true,logging:false,ignoreElements:e=>e.id==='cap-medios57'||e.id==='cap-captura56'||e.hasAttribute('data-cap-no-captura'),onclone:doc=>{prepararClonCaptura80(doc,marco);renderCamposCaptura73(doc,campos73);doc.getElementById('cap-medios57')?.remove();doc.getElementById('cap-captura56')?.remove();},width:Math.round(rect.width),height:Math.round(rect.height)});
 const salida=recortarMarco58(canvas,marco,rect);const blob=await new Promise(r=>salida.toBlob(r,'image/png'));if(!blob)throw Error('No se pudo generar el archivo PNG.');const numero=await siguienteCaptura82(destino),nombre=nombreCaptura56(numero);
 if(destino){const f=await destino.getFileHandle(nombre,{create:true}),w=await f.createWritable();try{await w.write(blob);await w.close();}catch(e){try{await w.abort();}catch{}throw e;}}else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=nombre;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 botonCaptura56.title='Captura guardada'+(destino?' en '+destino.name:' en Descargas');
 }catch(e){await avisoApp('No se pudo guardar la captura. '+(e.message||'Intente nuevamente.'));}finally{botonCaptura56.style.visibility='';barraMedios57.style.visibility='';botonCaptura56.disabled=false;capturando56=false;}}

// Recorte explícito del contorno: elimina el fondo exterior sin tocar el interior.
function recortarMarco58(origen,marco,rect){const estilo=getComputedStyle(marco),w=origen.width,h=origen.height,sx=w/rect.width,sy=h/rect.height;const radio=texto=>{const partes=String(texto||'0').trim().split(/\s+/),valor=(v,medida)=>v.endsWith('%')?parseFloat(v)*medida/100:parseFloat(v)||0;return [Math.max(0,valor(partes[0],rect.width)*sx),Math.max(0,valor(partes[1]||partes[0],rect.height)*sy)];};const rs=[estilo.borderTopLeftRadius,estilo.borderTopRightRadius,estilo.borderBottomRightRadius,estilo.borderBottomLeftRadius].map(radio);const divisor=Math.min(1,w/(rs[0][0]+rs[1][0]||1),w/(rs[3][0]+rs[2][0]||1),h/(rs[0][1]+rs[3][1]||1),h/(rs[1][1]+rs[2][1]||1));rs.forEach(r=>{r[0]*=divisor;r[1]*=divisor;});const out=document.createElement('canvas');out.width=w;out.height=h;const c=out.getContext('2d');if(!c)throw Error('No se pudo preparar el marco de la captura.');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';const [tl,tr,br,bl]=rs;const curva=(cx,cy,r,inicio,fin,x,y)=>{if(r[0]&&r[1])c.ellipse(cx,cy,r[0],r[1],0,inicio,fin);else c.lineTo(x,y);};c.beginPath();c.moveTo(tl[0],0);c.lineTo(w-tr[0],0);curva(w-tr[0],tr[1],tr,-Math.PI/2,0,w,0);c.lineTo(w,h-br[1]);curva(w-br[0],h-br[1],br,0,Math.PI/2,w,h);c.lineTo(bl[0],h);curva(bl[0],h-bl[1],bl,Math.PI/2,Math.PI,0,h);c.lineTo(0,tl[1]);curva(tl[0],tl[1],tl,Math.PI,Math.PI*1.5,0,0);c.closePath();c.clip();c.drawImage(origen,0,0);return out;}

// Los controles nativos se dibujan como texto en el clon para evitar recortes de letras.
function camposCaptura73(marco){return [...marco.querySelectorAll('input,select,textarea')].map(e=>{const cs=getComputedStyle(e),r=e.getBoundingClientRect();return {type:e.type,checked:e.checked,visible:cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0,value:e.type==='password'?'•'.repeat(e.value.length):e.tagName==='SELECT'?[...e.selectedOptions].map(o=>o.textContent).join(', '):e.value||e.placeholder||'',empty:!e.value,width:r.width,height:r.height,style:Object.fromEntries(['fontFamily','fontSize','fontWeight','fontStyle','letterSpacing','textAlign','color','backgroundColor','borderTop','borderRight','borderBottom','borderLeft','borderRadius','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft'].map(k=>[k,cs[k]]))};});}
function renderCamposCaptura73(doc,campos){const fields=[...doc.getElementById('app-shell').querySelectorAll('input,select,textarea')];campos.forEach((data,i)=>{const el=fields[i];if(!el||!data.visible)return;if(['checkbox','radio'].includes(data.type)){el.checked=data.checked;return;}if(['hidden','file','range','color','button','submit','reset'].includes(data.type))return;const text=doc.createElement('div');if(el.id)text.id=el.id;text.textContent=data.value;Object.assign(text.style,data.style,{boxSizing:'border-box',width:data.width+'px',height:data.height+'px',minWidth:'0',maxWidth:'100%',display:'flex',alignItems:'center',justifyContent:data.style.textAlign==='right'?'flex-end':data.style.textAlign==='center'?'center':'flex-start',lineHeight:'1.3',whiteSpace:el.tagName==='TEXTAREA'?'pre-wrap':'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:data.empty?'#64748b':data.style.color});el.replaceWith(text);});}


// Finaliza únicamente animaciones finitas: la captura representa la pantalla abierta.
function estabilizarCaptura80(marco){
 for(const a of marco.getAnimations?.({subtree:true})||[]){
  const timing=a.effect?.getComputedTiming?.();
  if(timing&&Number.isFinite(timing.endTime)&&timing.endTime>0&&a.playState!=='finished'){
   try{a.finish();}catch{}
  }
 }
}
function prepararClonCaptura80(doc,marco){
 const clone=doc.getElementById('app-shell');if(!clone)return;
 // Mapear antes de sustituir controles o retirar la barra: no desplazar los índices.
 const original=[...marco.querySelectorAll('*')],copias=[...clone.querySelectorAll('*')];
 original.forEach((el,k)=>{const c=copias[k];if(c){c.scrollTop=el.scrollTop;c.scrollLeft=el.scrollLeft;}});
 const style=doc.createElement('style');
 style.textContent='#app-shell,#app-shell *{animation:none!important;transition:none!important;caret-color:transparent!important}';
 doc.head.appendChild(style);
 for(const live of marco.querySelectorAll('[id^="drawer-"]')){
  if(live.classList.contains('hidden')||getComputedStyle(live).display==='none')continue;
  const drawer=doc.getElementById(live.id);if(!drawer)continue;
  drawer.classList.remove('hidden');
  const panel=drawer.firstElementChild,livePanel=live.firstElementChild;if(!panel||!livePanel)continue;
  // translateX de la animación no debe reaplicarse al reconstruir el DOM.
  for(const key of ['transform','translate'])panel.style.setProperty(key,'none','important');
  panel.style.setProperty('animation','none','important');
  panel.style.setProperty('transition','none','important');
  panel.style.setProperty('opacity','1','important');
  panel.style.setProperty('visibility','visible','important');
  const width=livePanel.getBoundingClientRect().width;
  if(width>0){panel.style.setProperty('width',width+'px','important');panel.style.setProperty('min-width',width+'px','important');panel.style.setProperty('max-width',width+'px','important');}
  panel.style.setProperty('flex-shrink','0','important');
  for(const e of panel.querySelectorAll('[class*="animate-"]')){e.style.setProperty('transform','none','important');e.style.setProperty('opacity','1','important');}
 }
}


// PNG de alta definición: ~3072 px de ancho, con límite de memoria del lienzo.
function escalaNitida81(rect){
 const width=Math.max(1,Number(rect.width)||1),height=Math.max(1,Number(rect.height)||1);
 const target=3072/width,maxPixels=20000000;
 return Math.max(1,Math.min(12,Math.max(4,target),Math.sqrt(maxPixels/(width*height))));
}


// El número inicial permite ordenar por nombre sin agrupar las capturas por pantalla.
let secuenciaCapturas82=0;
async function siguienteCaptura82(carpeta){
 let max=secuenciaCapturas82;
 try{const n=Number(localStorage.getItem('cap-captura-secuencia82'));if(Number.isSafeInteger(n)&&n>max)max=n;}catch{}
 if(carpeta?.values){
  for await(const entry of carpeta.values()){
   const match=entry.kind==='file'&&/^CAP_UVA_(\d{6,})_/.exec(entry.name);
   if(match){const n=Number(match[1]);if(Number.isSafeInteger(n)&&n>max)max=n;}
  }
 }
 secuenciaCapturas82=max+1;
 try{localStorage.setItem('cap-captura-secuencia82',String(secuenciaCapturas82));}catch{}
 return secuenciaCapturas82;
}
