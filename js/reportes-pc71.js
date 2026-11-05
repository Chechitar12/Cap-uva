/* Vista de reportes de escritorio independiente del marco móvil. */
function panelReportes71(title,body,footer){
 cerrar40();let root=document.getElementById('reportes-pc71');
 if(!root){root=document.createElement('section');root.id='reportes-pc71';root.setAttribute('aria-label','Reportes CAP UVA');document.body.appendChild(root);}
 root.innerHTML='<header class="r71-header"><button onclick="cerrarReportes71()">← Volver a módulos</button><h1>'+safe(title)+'</h1><button onclick="pantallaCompleta71()">Pantalla completa</button></header><main class="r71-main">'+body+'</main><footer class="r71-footer">'+footer+'</footer>';
 document.body.classList.add('reportes-abiertos71');root.querySelector('button')?.focus();
}
function cerrarReportes71(){if(typeof barraMedios57!=='undefined')document.getElementById('app-shell').appendChild(barraMedios57);const root=document.getElementById('reportes-pc71');if(document.fullscreenElement===root)document.exitFullscreen?.().catch(()=>{});root?.remove();document.body.classList.remove('reportes-abiertos71');document.getElementById('btn-reportes70')?.focus();}
async function pantallaCompleta71(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.getElementById('reportes-pc71')?.requestFullscreen?.();}catch{ /* La vista ya ocupa toda la ventana incluso si el navegador no permite fullscreen. */ }}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('reportes-pc71')&&!document.fullscreenElement){e.preventDefault();cerrarReportes71();}});
