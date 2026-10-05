/* ============ Utilidades ============ */
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d||1,12)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const mondayOf=s=>{const d=parse(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)};
const dow=s=>((parse(s).getDay()+6)%7)+1;
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/86400000);
const monthKey=s=>s.slice(0,7);
const lastOfMonth=m=>{const[y,mm]=m.split('-').map(Number);return iso(new Date(y,mm,0,12))};
const addMonths=(m,n)=>{const[y,mm]=m.split('-').map(Number);const d=new Date(y,mm-1+n,1,12);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`};
const TODAY=iso(new Date());
const DIAS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DIAS_C=['lun','mar','mié','jue','vie','sáb','dom'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_C=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fmtMoney=new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0});
const money=n=>fmtMoney.format(Math.round(n||0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-5);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const dayNum=s=>parse(s).getDate();
const monName=s=>MESES[parse(s).getMonth()];
const fmtLong=s=>{const d=parse(s);return `${DIAS[dow(s)-1].toLowerCase()} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`};
const fmtShort=s=>{const d=parse(s);return `${d.getDate()}/${d.getMonth()+1}`};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

/* ============ Configuración por defecto ============ */
const LISTS=[
  {key:'estadosSesion',titulo:'Estados de sesión',desc:'Qué pasó con cada sesión. "Se cobra" define si genera honorario. "A elegir" sirve para casos como las cancelaciones tardías: lo decidís en cada sesión.',color:true,extra:[{k:'cobra',label:'Se cobra',type:'select',opts:[['no','Nunca'],['si','Siempre'],['opcional','A elegir en cada sesión']]}]},
  {key:'estadosPago',titulo:'Estados de pago',desc:'Cómo está el cobro de cada sesión.',color:true,extra:[{k:'tipo',label:'Cuenta como',type:'select',opts:[['pendiente','Pendiente'],['cobrado','Cobrado'],['sin_cargo','Sin cargo']]}]},
  {key:'mediosPago',titulo:'Medios de pago',desc:'Transferencias, efectivo, billeteras virtuales, etc.'},
  {key:'facturacion',titulo:'Facturación',desc:'Qué comprobante se le emite al paciente cada mes.',extra:[{k:'comprobante',label:'Comprobante',type:'select',opts:[['15','Recibo C'],['11','Factura C (con detalle por sesión)'],['0','No se emite']]}]},
  {key:'instituciones',titulo:'Instituciones y derivaciones',desc:'Quién deriva al paciente y qué porcentaje le corresponde.',extra:[{k:'porcentaje',label:'% institución',type:'number'}]},
  {key:'modalidades',titulo:'Modalidades de atención',desc:'Virtual, presencial y sus variantes.'},
  {key:'estadosPaciente',titulo:'Estados del paciente',desc:'"En agenda": genera sesiones automáticamente. "Libera la agenda": al pasar a ese estado, cierra los horarios y quita las sesiones futuras (pide confirmación).',color:true,extra:[{k:'agenda',label:'En agenda',type:'bool'},{k:'libera',label:'Libera la agenda',type:'bool'}]},
  {key:'frecuencias',titulo:'Frecuencias',desc:'Cada cuántas semanas se repite la sesión.',extra:[{k:'semanas',label:'Cada',suffix:'sem.',type:'number'}]},
  {key:'categoriasGasto',titulo:'Categorías de gasto',desc:'Para clasificar los egresos del consultorio.'},
  {key:'legajos',titulo:'Tipos de legajo',desc:'Dónde guardás la historia clínica.'}
];
const it=(id,nombre,extra={})=>({id,nombre,...extra});
function defaultConfig(){
  return {version:1,general:{profesional:'',finDeSemana:false,inicio:8,fin:21,duracion:50,vistaInicial:'',paleta:'rosa-salvia',fuente:'serena',textura:true},lists:{
    estadosSesion:[
      it('programada','Programada',{color:'#8A9A9C',cobra:'no',fijo:true}),
      it('realizada','Realizada',{color:'#2B6B64',cobra:'si'}),
      it('cancelo_paciente','Canceló paciente',{color:'#C0793A',cobra:'opcional'}),
      it('cancele_yo','Cancelé yo',{color:'#8B5CA8',cobra:'no'}),
      it('feriado','Feriado',{color:'#3F74B5',cobra:'no'}),
      it('vacaciones','Vacaciones',{color:'#4A9BA8',cobra:'no'}),
      it('ausente_aviso','Ausente con aviso',{color:'#B39A2E',cobra:'no'}),
      it('ausente_sin_aviso','Ausente sin aviso',{color:'#B04848',cobra:'si'}),
      it('reprogramada','Reprogramada',{color:'#6D7F99',cobra:'no'}),
      it('enfermedad','Enfermedad',{color:'#9C6B8E',cobra:'no'})
    ],
    estadosPago:[
      it('pendiente','Pendiente de pago',{color:'#B07A2A',tipo:'pendiente',fijo:true}),
      it('pagado','Pagado',{color:'#2E7D4F',tipo:'cobrado'}),
      it('adelantado','Pagado por adelantado',{color:'#3F74B5',tipo:'cobrado'}),
      it('sin_cargo','Sin cargo',{color:'#8A9A9C',tipo:'sin_cargo'})
    ],
    mediosPago:[it('transferencia','Transferencia bancaria'),it('mp','Transferencia MP'),it('efectivo','Efectivo'),it('usd','Dólares')],
    facturacion:[it('recibo_c','Recibo C',{comprobante:'15'}),it('reintegro','Reintegro',{comprobante:'11'}),it('sin_factura','Sin factura',{comprobante:'0'})],
    instituciones:[it('particular','Particular',{porcentaje:0}),it('bellocq','Bellocq',{porcentaje:30}),it('meraki','Meraki',{porcentaje:50})],
    modalidades:[it('virtual','Virtual'),it('presencial','Presencial')],
    estadosPaciente:[
      it('activo','Activo',{color:'#2E7D4F',agenda:true}),
      it('pausa','En pausa',{color:'#B39A2E',agenda:false}),
      it('alta_fin','Alta por finalización',{color:'#3F74B5',agenda:false,libera:true}),
      it('alta_abandono','Alta por abandono',{color:'#8A9A9C',agenda:false,libera:true}),
      it('derivacion','Derivación',{color:'#8B5CA8',agenda:false,libera:true})
    ],
    frecuencias:[it('semanal','Semanal',{semanas:1}),it('quincenal','Quincenal',{semanas:2}),it('mensual','Mensual',{semanas:4})],
    categoriasGasto:[it('supervision','Supervisión'),it('especializacion','Especialización'),it('mala_praxis','Seguro de mala praxis'),it('monotributo','Monotributo'),it('analisis','Análisis personal'),it('alquiler','Alquiler de consultorio')],
    legajos:[it('digital','Digital'),it('papel','Papel')]
  }};
}
function mergeConfig(c){
  const d=defaultConfig();
  c.general={...d.general,...(c.general||{})};
  c.lists=c.lists||{};
  for(const L of LISTS) if(!Array.isArray(c.lists[L.key])) c.lists[L.key]=d.lists[L.key];
  for(const e of c.lists.facturacion){ if(e.comprobante==null) e.comprobante=e.id==='reintegro'?'11':e.id==='sin_factura'?'0':'15'; }
  for(const e of c.lists.estadosPaciente){ if(e.libera==null) e.libera=['alta_fin','alta_abandono','derivacion'].includes(e.id); }
  for(const e of c.lists.estadosSesion){ if(typeof e.cobra==='boolean'||e.cobra==null){ e.cobra=e.cobra===true?'si':(e.id==='cancelo_paciente'?'opcional':'no'); } }
  const pend=c.lists.estadosPago.find(i=>i.id==='pendiente');if(pend&&pend.nombre==='Pendiente')pend.nombre='Pendiente de pago';
  return c;
}

/* ============ Estado ============ */
const S={config:null,patients:[],gastos:[],ses:{},view:'agenda',ag:'semana',cursor:TODAY,month:monthKey(TODAY),
  q:'',filtroEstado:'',comps:[],facturas:[],facturasSim:[],firma:'',fileCache:{},awaitPay:new Set(),visible:{},edit:null,ready:false,downloads:null};
const list=k=>S.config.lists[k]||[];
const item=(k,id)=>list(k).find(i=>i.id===id);
const pat=id=>S.patients.find(p=>p.id===id);
const fullName=p=>p?[p.nombre,p.apellido].filter(Boolean).join(' '):'';
const sortName=p=>p?`${p.apellido||''} ${p.nombre||''}`.trim().toLowerCase():'';
const nameBlock=p=>p?`<span class="nm1">${esc(p.nombre||'')}</span>${p.apellido?`<span class="nm2">${esc(p.apellido)}</span>`:''}`:'<span class="nm1">Paciente eliminado</span>';
const instOf=p=>item('instituciones',p?.institucion);
const montoOf=s=>s.monto!=null?Number(s.monto):Number(pat(s.pid)?.honorario||0);
const porcOf=s=>s.porc!=null?Number(s.porc):Number(instOf(pat(s.pid))?.porcentaje||0);
const colorOf=(k,id)=>item(k,id)?.color||'#8A9A9C';
function options(k,sel,empty){
  let h=empty?`<option value="">${esc(empty)}</option>`:'';
  for(const i of list(k)) h+=`<option value="${esc(i.id)}"${i.id===sel?' selected':''}>${esc(i.nombre)}</option>`;
  if(sel&&!item(k,sel)) h+=`<option value="${esc(sel)}" selected>(eliminado)</option>`;
  return h;
}

/* ============ Almacenamiento ============ */
const LKEY='consultorio-psico-v1';
const Store={mode:'local',col:null,local:{},queue:{},writing:{},revs:{},
  async init(){
    if(document.querySelector('script[src="firebase.js"]')){
      if(!await waitFB()){gate('error');return new Promise(()=>{})}
      await authFB();
      this.col=fbCol();this.mode='db';this.fb=true;
      watchSync();
    }
    else if(window.claude&&typeof window.claude.use==='function'){
      try{
        const [db,user,dl,as]=await Promise.all([claude.use('db'),claude.use('user'),claude.use('downloads'),claude.use('assets')]);
        S.downloads=dl;S.assets=as;
        if(db&&user){const id=await user.id(); if(id){this.col=db.collection('data/users/'+id);this.mode='db';}}
      }catch(e){console.warn(e)}
    }
    if(this.mode==='db'){
      return await new Promise(resolve=>{
        let first=true;
        this.col.onSnapshot(snap=>{
          const docs={};snap.docs.forEach(d=>{docs[d.id]=d.data()});
          if(first){first=false;resolve(docs);return}
          let changed=false;
          for(const ch of snap.docChanges()){
            const id=ch.doc.id;
            if(this.writing[id]||this.queue[id]) continue;
            const data=ch.type==='removed'?null:ch.doc.data();
            const mine=this.revs[id]||0;
            if(mine&&(data?Number(data._rev||0):0)<mine) continue;
            applyDoc(id,data);changed=true;
          }
          if(changed&&!S.dlgOpen&&!(document.activeElement?.dataset?.note)){render();if(S.popId)renderPop()}
        },err=>{console.warn(err);if(this.fb){gate('error',err?.code);return}if(first){first=false;this.mode='local';resolve(this.loadLocal())}});
      });
    }
    return this.loadLocal();
  },
  loadLocal(){try{const r=localStorage.getItem(LKEY);if(r)this.local=JSON.parse(r)||{}}catch(e){this.local={}}return JSON.parse(JSON.stringify(this.local))},
  save(id,data){
    const copy=JSON.parse(JSON.stringify(data));
    copy._rev=Math.max(Date.now(),(this.revs[id]||0)+1);this.revs[id]=copy._rev;
    if(this.mode!=='db'){
      this.local[id]=copy;clearTimeout(this.t);
      this.t=setTimeout(()=>{try{localStorage.setItem(LKEY,JSON.stringify(this.local))}catch(e){toast('No se pudo guardar en este navegador.')}},250);
      return;
    }
    this.queue[id]=copy; if(!this.writing[id]) this.flush(id);
  },
  async flush(id){
    this.writing[id]=true;syncState();
    while(this.queue[id]){
      const d=this.queue[id];delete this.queue[id];
      try{await this.col.doc(id).set(d)}
      catch(e){
        if(e?.code==='unavailable'){await sleep(700+Math.random()*900);try{await this.col.doc(id).set(d)}catch(e2){toast('No se pudo guardar. Revisá la conexión e intentá de nuevo.')}}
        else if(e?.code==='quota_exceeded'||e?.code==='resource-exhausted') toast('Se alcanzó el límite de almacenamiento.');
        else if(e?.code==='permission-denied') toast('Tu cuenta no tiene permiso para guardar. Revisá la lista de emails autorizados.');
        else toast('No se pudo guardar el cambio.');
      }
    }
    this.writing[id]=false;syncState();
  },
  async remove(id){
    delete this.revs[id];
    if(this.mode!=='db'){delete this.local[id];try{localStorage.setItem(LKEY,JSON.stringify(this.local))}catch(e){}return}
    try{await this.col.doc(id).delete()}catch(e){toast('No se pudo borrar.')}
  }
};
/* ---- Firebase: acceso y sincronización ---- */
function waitFB(){
  if(window.FB) return Promise.resolve(true);
  return new Promise(res=>{const t=setTimeout(()=>res(false),15000);window.addEventListener('fb-ready',()=>{clearTimeout(t);res(true)},{once:true})});
}
function fbCol(){
  return {
    doc:id=>({set:d=>FB.fns.setDoc(FB.datoRef(id),d),delete:()=>FB.fns.deleteDoc(FB.datoRef(id))}),
    onSnapshot:(next,err)=>FB.fns.onSnapshot(FB.datos(),snap=>next({docs:snap.docs,docChanges:()=>snap.docChanges()}),err)
  };
}
const LOGO_SVG=`<svg class="logo" viewBox="0 0 96 96" width="72" height="72" role="img" aria-label="Consultorio Psiconflor"><rect width="96" height="96" rx="22" fill="#F6DDE3"/><rect x="18" y="20" width="60" height="58" rx="9" fill="#FFFEFD"/><path d="M18 29a9 9 0 0 1 9-9h42a9 9 0 0 1 9 9v6H18z" fill="#557F66"/><ellipse cx="48" cy="57" rx="8.5" ry="14" fill="#557F66"/><path d="M48 45v27" stroke="#FFFEFD" stroke-width="2" stroke-linecap="round"/></svg>`;
function gate(state,info){
  let g=document.getElementById('gate');
  if(!g){g=document.createElement('div');g.id='gate';g.className='gate';document.body.appendChild(g)}
  if(state===null){g.remove();return}
  const logo=LOGO_SVG;
  const body={
    cargando:`<p class="muted">Conectando…</p>`,
    login:`<p>Ingresá con tu cuenta de Google para ver la agenda y los datos del consultorio.</p>
      <button class="btn primary big" data-a="login">Iniciar sesión con Google</button>
      ${info?`<p class="gate-err">${esc(info)}</p>`:''}`,
    denegado:`<p>La cuenta <b>${esc(info||'')}</b> no tiene acceso a este consultorio.</p>
      <button class="btn primary big" data-a="logout">Entrar con otra cuenta</button>`,
    error:`<p>No se pudo conectar con la base de datos${info==='permission-denied'?': tu cuenta no tiene permiso':''}. Revisá tu conexión a internet e intentá de nuevo.</p>
      <button class="btn primary big" data-a="reload">Reintentar</button>`
  }[state];
  g.innerHTML=`<div class="gate-card">${logo}<h1>Consultorio Psiconflor</h1>${body}</div>`;
}
async function authFB(){
  const {auth,fns,AUTORIZADOS}=FB;
  gate('cargando');
  let redirErr='';
  try{await fns.getRedirectResult(auth)}catch(e){redirErr=loginMsg(e)}
  const user=await new Promise(res=>{fns.onAuthStateChanged(auth,u=>{if(u)res(u);else gate('login',redirErr)})});
  const email=String(user.email||'').toLowerCase();
  if(!AUTORIZADOS.includes(email)){gate('denegado',email);await new Promise(()=>{})}
  Store.email=email;gate('cargando');
}
function loginMsg(e){
  const c=e?.code||'';
  if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request') return '';
  if(c==='auth/unauthorized-domain') return 'Esta dirección no está autorizada en Firebase (Authentication > Configuración > Dominios autorizados).';
  if(c==='auth/network-request-failed') return 'No hay conexión a internet.';
  return 'No se pudo iniciar sesión. Intentá de nuevo.';
}
async function doLogin(){
  const {auth,fns,provider}=FB;
  try{await fns.signInWithPopup(auth,provider)}
  catch(e){
    if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/web-storage-unsupported'].includes(e?.code)){await fns.signInWithRedirect(auth,provider);return}
    const m=loginMsg(e);if(m)gate('login',m);
  }
}
async function doLogout(){try{await FB.fns.signOut(FB.auth)}catch(e){}location.reload()}
function syncState(){
  const el=document.getElementById('sync');if(!el||!Store.fb)return;
  const busy=Object.values(Store.writing).some(Boolean);
  el.className='sync '+(!navigator.onLine?'off':busy?'busy':'ok');
  el.textContent=!navigator.onLine?'Sin conexión: los cambios se guardan al volver':busy?'Guardando…':'Todo sincronizado';
}
function watchSync(){window.addEventListener('online',syncState);window.addEventListener('offline',syncState)}
function applyDoc(id,data){
  data=data?JSON.parse(JSON.stringify(data)):null; // los datos de la cuenta llegan de solo lectura: se trabaja sobre una copia
  if(id==='config') S.config=mergeConfig(data||defaultConfig());
  else if(id==='patients'){ S.patients=(data?.items||[]).map(p=>{ if(p.apellido==null){const t=String(p.nombre||'').trim().split(/\s+/);p={...p,nombre:t.shift()||'',apellido:t.join(' ')}} return p; }).map(p=>({...p,horarios:(p.horarios||[]).map(h=>({...h,id:h.id||('h_'+p.id+'_'+h.dia+'_'+String(h.hora||'').replace(':','')),duracion:Number(h.duracion||S.config?.general?.duracion||50)}))})); }
  else if(id==='gastos') S.gastos=data?.items||[];
  else if(id==='comprobantes') S.comps=data?.items||[];
  else if(id==='respaldos') S.respaldos=data?.items||[];
  else if(id==='firma') S.firma=data?.data||'';
  else if(id==='facturasSim') S.facturasSim=data?.items||[];
  else if(id.startsWith('ses-')){ if(data) S.ses[id]=data; else delete S.ses[id]; }
}
const saveConfig=()=>Store.save('config',S.config);
const savePatients=()=>Store.save('patients',{items:S.patients});
const saveGastos=()=>Store.save('gastos',{items:S.gastos});
/* ============ Comprobantes de pago ============ */
const ACCEPT=['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
const compsOf=pid=>S.comps.filter(c=>c.pid===pid).sort((a,b)=>((b.fecha||'')+(b.subido||'')).localeCompare((a.fecha||'')+(a.subido||'')));
const compsOfSes=sid=>S.comps.filter(c=>c.sid===sid);
const compUrl=c=>c.asset?('/_blob/'+c.asset):c.fileDoc?(S.fileCache[c.id]||''):(c.data||'');
const saveComps=()=>Store.save('comprobantes',{items:S.comps});
const fmtSize=b=>b>1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
function compChip(c){
  return `<button class="compchip" data-a="comp-view" data-id="${esc(c.id)}" title="Ver comprobante">${c.tipo==='application/pdf'?'PDF':'IMG'}<span>${esc(c.nombre||'Comprobante')}</span></button>`;
}
function sesCompRow(s){
  if(item('estadosPago',s.pago)?.tipo!=='cobrado') return '';
  const cs=compsOfSes(s.id);
  return `<div class="pop-sec"><span class="dual-lbl">Comprobante</span><div class="comp-inline">${cs.map(compChip).join('')}
    <button class="btn sm" data-a="comp-add" data-pid="${esc(s.pid)}" data-sid="${esc(s.id)}">${cs.length?'Adjuntar otro':'Adjuntar comprobante'}</button></div></div>`;
}
/* Oferta después de registrar un pago */
let offerT;
function offerAttach(s){
  if(!s) return;
  const el=document.getElementById('offer');const p=pat(s.pid);
  el.innerHTML=`<span>Pago de ${esc(p?.nombre||'')} registrado. ¿Querés adjuntar el comprobante?</span>
    <button class="btn primary sm" data-a="comp-add" data-pid="${esc(s.pid)}" data-sid="${esc(s.id)}">Adjuntar</button>
    <button class="btn ghost sm" data-a="offer-close">Ahora no</button>`;
  el.hidden=false;clearTimeout(offerT);offerT=setTimeout(()=>{el.hidden=true},10000);
}
function closeOffer(){clearTimeout(offerT);document.getElementById('offer').hidden=true}
/* Selección y carga del archivo */
function pickFile(pid,sid){
  S.attachFor={pid,sid:sid||null};closeOffer();
  const inp=document.getElementById('fileIn');inp.value='';inp.click();
}
async function toJpeg(file,max=2000,q=.85){
  try{
    const url=URL.createObjectURL(file);
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});
    const k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
    const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
    return await new Promise(r=>c.toBlob(b=>r(b),'image/jpeg',q));
  }catch(e){return null}
}
const blobToDataUrl=b=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(b)});
async function handleFile(file){
  const tgt=S.attachFor;S.attachFor=null;if(!file||!tgt) return;
  const isPdf=file.type==='application/pdf'||/\.pdf$/i.test(file.name);
  const isImg=file.type.startsWith('image/')||/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
  if(!isPdf&&!isImg){toast('Elegí una imagen o un PDF.');return}
  let blob=file,type=isPdf?'application/pdf':file.type;
  if(isImg){const j=await toJpeg(file);if(j){blob=j;type='image/jpeg'}else if(!ACCEPT.includes(type)){toast('No se pudo leer esa imagen. Probá con una captura o un JPG.');return}}
  const s=tgt.sid?(S.visible[tgt.sid]||findSession(tgt.sid)):null;
  const base=(file.name||'comprobante').replace(/\.[^.]+$/,'');
  const rec={id:'c_'+uid(),pid:tgt.pid,sid:tgt.sid,fecha:s?.fecha||TODAY,subido:new Date().toISOString(),nombre:base+(type==='application/pdf'?'.pdf':'.jpg'),tipo:type,size:blob.size};
  toast('Subiendo comprobante…');
  if(Store.fb){
    const LIM=700*1024;
    if(isImg&&blob.size>LIM){const j=await toJpeg(file,1400,.65);if(j){blob=j;type='image/jpeg'}}
    if(blob.size>LIM){toast(isPdf?'El PDF es muy pesado (máximo 700 KB). Probá adjuntar una captura de pantalla.':'La imagen es muy pesada. Probá con una captura de pantalla.');return}
    const data=await blobToDataUrl(blob);
    rec.size=blob.size;rec.fileDoc=true;S.fileCache[rec.id]=data;
    FB.fns.setDoc(FB.archivoRef(rec.id),{data,pid:rec.pid,tipo:type}).catch(()=>toast('No se pudo guardar el archivo en la nube.'));
  } else if(S.assets){
    try{const r=await S.assets.upload(blob,{type});rec.asset=r.id;rec.size=r.sizeBytes}
    catch(e){
      const m={too_large:'El archivo es demasiado grande (máximo 20 MB).',unsupported_type:'Ese tipo de archivo no se puede adjuntar. Usá una imagen o un PDF.',quota_or_state:'Se llenó el espacio para archivos.',rate_limited:'Demasiadas subidas seguidas. Esperá un momento.',not_granted:'No tenés permiso para adjuntar archivos en esta app.'};
      if(e?.code==='store_unavailable'){try{const r=await S.assets.upload(blob,{type});rec.asset=r.id;rec.size=r.sizeBytes}catch(e2){toast('No se pudo subir el archivo. Intentá de nuevo.');return}}
      else{toast(m[e?.code]||'No se pudo subir el archivo.');return}
    }
  } else {
    if(blob.size>1.5*1048576){toast('En esta versión sin cuenta, el archivo debe pesar menos de 1,5 MB.');return}
    rec.data=await blobToDataUrl(blob);
  }
  S.comps.push(rec);saveComps();
  toast('Comprobante adjuntado');
  if(dlg.open&&S.edit?.id===tgt.pid&&document.getElementById('pac-form')){readPacForm();renderPacDialog()}
  else if(dlg.open&&S.edit?.id===tgt.sid){sesSheet()}
  else if(S.popId) renderPop();
}
async function viewComp(id){
  const c=S.comps.find(x=>x.id===id);if(!c)return;const p=pat(c.pid);
  if(c.fileDoc&&!S.fileCache[c.id]){
    toast('Abriendo comprobante…');
    try{const snap=await FB.fns.getDoc(FB.archivoRef(c.id));S.fileCache[c.id]=snap.exists()?snap.data().data:''}catch(e){toast('No se pudo abrir el comprobante. Revisá la conexión.');return}
    if(!S.fileCache[c.id]){toast('No se encontró el archivo de este comprobante.');return}
  }
  const url=compUrl(c);
  const v=document.getElementById('viewer');
  v.innerHTML=`<div class="dlg-head"><div><h2>${esc(c.nombre)}</h2><p class="muted small">${esc(fullName(p))}, sesión del ${fmtShort(c.fecha)}. Subido el ${fmtShort(c.subido.slice(0,10))}, ${fmtSize(c.size||0)}</p></div><button class="btn ghost icon" data-a="viewer-close" aria-label="Cerrar">✕</button></div>
    <div class="viewer-body">${c.tipo==='application/pdf'?`<iframe src="${esc(url)}" title="${esc(c.nombre)}"></iframe>`:`<img src="${esc(url)}" alt="Comprobante de ${esc(fullName(p))}">`}</div>
    <div class="dlg-foot"><button class="btn danger" data-a="comp-del" data-id="${esc(c.id)}">Eliminar comprobante</button>${url.startsWith('data:')?`<a class="btn" href="${esc(url)}" download="${esc(c.nombre)}">Descargar</a>`:`<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Abrir en otra pestaña</a>`}</div>`;
  if(!v.open)v.showModal();
}
async function deleteComp(id){
  const c=S.comps.find(x=>x.id===id);if(!c)return;
  const ok=await confirmBox('Eliminar comprobante',`Se elimina "${c.nombre}" del historial de ${fullName(pat(c.pid))}. No se puede deshacer.`,'Eliminar');
  if(!ok)return;
  if(c.asset&&S.assets){try{await S.assets.delete(c.asset)}catch(e){}}
  if(c.fileDoc&&Store.fb){FB.fns.deleteDoc(FB.archivoRef(c.id)).catch(()=>{});delete S.fileCache[c.id]}
  S.comps=S.comps.filter(x=>x.id!==id);saveComps();
  const v=document.getElementById('viewer');if(v.open)v.close();
  if(dlg.open&&document.getElementById('pac-form')){readPacForm();renderPacDialog()} else if(S.popId) renderPop();
  toast('Comprobante eliminado');
}
function compSection(pid){
  const cs=compsOf(pid);
  const paid=[];for(const d of Object.values(S.ses)) for(const s of Object.values(d.items||{})) if(s.pid===pid&&!s.oculta&&item('estadosPago',s.pago)?.tipo==='cobrado') paid.push(s);
  paid.sort((a,b)=>b.fecha.localeCompare(a.fecha));
  return `<div class="fieldset-title">Comprobantes de pago</div>
    <div class="full">
      ${cs.length?`<ul class="comp-list">${cs.map(c=>`<li><button class="comp-open" data-a="comp-view" data-id="${esc(c.id)}"><span class="comp-ico">${c.tipo==='application/pdf'?'PDF':'IMG'}</span>
        <span class="comp-txt"><b>${c.sid?`Sesión del ${fmtShort(c.fecha)}`:'Sin sesión asociada'}</b><span>${esc(c.nombre)}, subido el ${fmtShort(c.subido.slice(0,10))}</span></span></button></li>`).join('')}</ul>`:'<p class="hint">Todavía no hay comprobantes. Podés adjuntarlos al registrar un pago o desde acá.</p>'}
      <div class="comp-add"><select class="select sm" id="compSes" aria-label="Sesión del comprobante"><option value="">Sin sesión asociada</option>${paid.map(s=>`<option value="${esc(s.id)}">Sesión del ${fmtShort(s.fecha)}, ${money(montoOf(s))}</option>`).join('')}</select>
      <button class="btn sm" data-a="comp-add-pac" data-pid="${esc(pid)}">Adjuntar comprobante</button></div>
    </div>`;
}


function seedExample(){
  S.config=defaultConfig();
  const pid='p_ejemplo';
  const mon=mondayOf(TODAY);
  const desde=addDays(mon,1-7*4);
  S.patients=[{id:pid,hc:'1',nombre:'Paciente de ejemplo',dni:'',telefono:'',email:'',fechaDerivacion:desde,
    estado:'activo',modalidad:'virtual',institucion:'bellocq',supervisa:false,legajo:'digital',
    honorario:40000,medioPago:'transferencia',facturacion:'recibo_c',
    horarios:[{id:'h_ej1',dia:2,hora:'18:00',duracion:50,frecuencia:'semanal',desde}],
    observaciones:'Paciente ficticio para probar el sistema. Podés editarlo o eliminarlo.'}];
  const ejemplos=[[-4,'realizada','pagado'],[-3,'realizada','pagado'],[-2,'cancelo_paciente','pendiente'],[-1,'realizada','pendiente']];
  for(const [w,estado,pago] of ejemplos){
    const fecha=addDays(mon,1+7*w);
    const id=`${pid}_${fecha}_1800`;
    const k='ses-'+monthKey(fecha);
    (S.ses[k]=S.ses[k]||{items:{}}).items[id]={id,pid,fecha,hora:'18:00',dur:50,estado,pago,medio:'transferencia',monto:40000,porc:30,nota:''};
  }
  const m=monthKey(TODAY);
  S.gastos=[
    {id:uid(),fecha:m+'-05',categoria:'monotributo',descripcion:'Cuota mensual',monto:32000,medio:'transferencia'},
    {id:uid(),fecha:m+'-10',categoria:'supervision',descripcion:'Supervisión de casos',monto:45000,medio:'transferencia'}
  ];
  saveConfig();savePatients();saveGastos();
  for(const k in S.ses) Store.save(k,S.ses[k]);
}


/* ============ Sesiones ============ */
const nowHM=()=>{const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}`};
const toMin=h=>{if(!h)return null;const[a,b]=h.split(':').map(Number);return a*60+(b||0)};
const fromMin=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const defDur=()=>Number(S.config.general.duracion||50);
const durOf=s=>Number(s.dur||defDur());
const isPast=s=>s.fecha<TODAY||(s.fecha===TODAY&&!!s.hora&&s.hora<=nowHM());
const firstCobrado=()=>list('estadosPago').find(x=>x.tipo==='cobrado')?.id||'pagado';
const modeOf=e=>(e?.cobra===true||e?.cobra==='si')?'si':e?.cobra==='opcional'?'opcional':'no';
const cobraOf=s=>{const m=modeOf(item('estadosSesion',s.estado));return m==='si'||(m==='opcional'&&!!s.cobrar)};
const realizadaId=()=>item('estadosSesion','realizada')?'realizada':(list('estadosSesion').find(x=>modeOf(x)==='si')?.id||'realizada');

function monthsBetween(from,to){const out=[];let m=monthKey(from);const e=monthKey(to);while(m<=e){out.push(m);m=addMonths(m,1)}return out}
/* ============ Copias de seguridad y papelera ============ */
const BK_MAX=20, BK_AUTO_HORAS=20, DESCARGA_DIAS=30, LK_DESC='psiconflor-ultima-descarga', LK_POSP='psiconflor-recordar-descarga';
const vivo=p=>p&&!p.eliminado;
const pidVivo=pid=>{const p=pat(pid);return !p||!p.eliminado};
function allDocs(){return {config:S.config,patients:{items:S.patients},gastos:{items:S.gastos},comprobantes:{items:S.comps},...S.ses}}
function fmtFechaHora(isoStr){const d=new Date(isoStr);return `${DIAS_C[(d.getDay()+6)%7]} ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`}
function makeBackup(motivo){
  if(!Store.fb||!S.config) return null;
  const rid='r'+Date.now();const docs=JSON.parse(JSON.stringify(allDocs()));const ids=Object.keys(docs);
  for(const id of ids) FB.fns.setDoc(FB.respaldoRef(`${rid}__${id}`),{rid,id,data:docs[id]}).catch(()=>{});
  const entry={id:rid,fecha:new Date().toISOString(),por:Store.email||'',motivo,docs:ids,pacientes:S.patients.filter(vivo).length};
  const items=[entry,...(S.respaldos||[])];
  for(const o of items.slice(BK_MAX)) for(const id of (o.docs||[])) FB.fns.deleteDoc(FB.respaldoRef(`${o.id}__${id}`)).catch(()=>{});
  S.respaldos=items.slice(0,BK_MAX);Store.save('respaldos',{items:S.respaldos});
  return entry;
}
function autoBackup(){
  if(!Store.fb) return;
  const last=(S.respaldos||[]).find(r=>r.motivo==='Automática');
  if(!last||(Date.now()-new Date(last.fecha).getTime())>BK_AUTO_HORAS*3600*1000) makeBackup('Automática');
}
async function restoreBackup(rid){
  const e=(S.respaldos||[]).find(r=>r.id===rid);if(!e)return;
  const ok=await confirmBox('Restaurar copia',`Los datos del consultorio vuelven a como estaban el ${fmtFechaHora(e.fecha)}, para todas las cuentas. Antes de restaurar se guarda una copia del estado actual, por si necesitás volver atrás.`,'Restaurar',false);
  if(!ok) return;
  toast('Restaurando la copia…');
  let snaps;
  try{snaps=await Promise.all(e.docs.map(id=>FB.fns.getDoc(FB.respaldoRef(`${rid}__${id}`))))}catch(err){toast('No se pudo leer la copia. Revisá la conexión.');return}
  const docs={};for(const s of snaps){if(s.exists()){const v=s.data();docs[v.id]=v.data}}
  if(!docs.config){toast('Esta copia está incompleta y no se puede restaurar.');return}
  makeBackup('Antes de restaurar');
  for(const id of ['patients','gastos','comprobantes',...Object.keys(S.ses)]) if(!(id in docs)) await Store.remove(id);
  S.ses={};for(const [id,d] of Object.entries(docs)){applyDoc(id,d);Store.save(id,d)}
  render();toast('Copia restaurada');
}
function downloadBackup(){
  const data=JSON.stringify({app:'consultorio-psiconflor',version:3,exportado:TODAY,docs:allDocs()},null,2);
  const filename=`psiconflor-copia-${TODAY}.json`;
  const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const l=document.createElement('a');l.href=url;l.download=filename;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  try{localStorage.setItem(LK_DESC,TODAY);localStorage.removeItem(LK_POSP)}catch(e){}
  toast('Copia descargada. Guardala en un lugar seguro, por ejemplo en tu Google Drive.');
}
function lastDownload(){try{return localStorage.getItem(LK_DESC)||''}catch(e){return ''}}
function needDownloadReminder(){
  if(!Store.fb) return false;
  try{const posp=localStorage.getItem(LK_POSP);if(posp&&posp>TODAY)return false}catch(e){}
  const l=lastDownload();return !l||daysBetween(l,TODAY)>=DESCARGA_DIAS;
}
function downloadNotice(){
  if(!needDownloadReminder()) return '';
  const l=lastDownload();
  return `<div class="notice">${ICONS.info}<p style="flex:1">${l?`Hace más de un mes que no descargás una copia de seguridad a este dispositivo (la última fue el ${fmtShort(l)}).`:'Todavía no descargaste ninguna copia de seguridad a este dispositivo.'} La nube guarda copias automáticas, pero conviene tener también una propia.</p>
    <button class="btn sm" data-a="export">Descargar ahora</button><button class="btn ghost sm" data-a="dl-later">Más tarde</button></div>`;
}
/* Confirmación escribiendo una palabra */
function typedConfirm(title,text,word,okLabel){
  const c=document.getElementById('confirm');
  c.innerHTML=`<div class="dlg-head"><h2>${esc(title)}</h2></div><div class="dlg-body"><p>${esc(text)}</p>
    <label class="field" style="margin-top:14px"><span class="small muted">Para confirmar, escribí <b>${esc(word)}</b></span><input class="input" id="typedIn" autocomplete="off" autocapitalize="characters"></label></div>
    <div class="dlg-foot"><span></span><div class="btn-group"><button class="btn" value="no">Cancelar</button><button class="btn primary" value="ok" id="typedOk" disabled style="background:var(--danger);border-color:var(--danger)">${esc(okLabel)}</button></div></div>`;
  return new Promise(res=>{
    const inp=c.querySelector('#typedIn'),okb=c.querySelector('#typedOk');
    inp.oninput=()=>{okb.disabled=inp.value.trim().toUpperCase()!==word};
    c.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.value==='ok'&&okb.disabled)return;c.close();res(b.value==='ok')});
    c.oncancel=()=>res(false);c.showModal();inp.focus();
  });
}
/* Aviso con "Deshacer" */
function toastUndo(msg,undo){
  const el=document.getElementById('offer');
  el.innerHTML=`<span>${esc(msg)}</span><button class="btn sm" data-a="undo">Deshacer</button>`;
  S.undoFn=undo;el.hidden=false;clearTimeout(offerT);offerT=setTimeout(()=>{el.hidden=true;S.undoFn=null},8000);
}
/* Paneles de Configuración */
function backupPanel(){
  if(!Store.fb) return '';
  const rs=S.respaldos||[];
  return `<section class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Copias de seguridad</h2>
      <p class="small muted" style="margin-top:3px">La app guarda una copia automática en la nube cada día, apenas alguien la abre, y conserva las últimas ${BK_MAX}. También se guarda una antes de borrar o restaurar datos.</p></div>
      <button class="btn" data-a="bk-now">Hacer una copia ahora</button></div>
    ${rs.length?`<div class="scroll"><table data-sort="respaldos"><thead><tr><th>Fecha</th><th>Motivo</th><th>Hecha por</th><th class="num">Pacientes</th><th></th></tr></thead><tbody>
      ${rs.map(r=>`<tr><td data-v="${esc(r.fecha)}">${fmtFechaHora(r.fecha)}</td><td>${esc(r.motivo)}</td><td class="small">${esc(r.por)}</td><td class="num">${r.pacientes??'—'}</td><td class="num"><button class="btn sm" data-a="bk-restore" data-id="${esc(r.id)}">Restaurar</button></td></tr>`).join('')}
    </tbody></table></div>`:'<p class="panel-body muted">Todavía no hay copias. La primera se hace automáticamente.</p>'}
    <div class="panel-body"><p class="small muted">${lastDownload()?`Última copia descargada a este dispositivo: ${fmtShort(lastDownload())}.`:'Todavía no descargaste copias a este dispositivo.'} Una vez por mes, conviene descargar una y guardarla en tu Google Drive o en un pendrive. Los archivos de los comprobantes no se incluyen en la descarga.</p></div></section>`;
}
function trashPanel(){
  const del=S.patients.filter(p=>p.eliminado);
  return `<section class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Papelera</h2>
    <p class="small muted" style="margin-top:3px">Los pacientes eliminados quedan acá, con sus sesiones y comprobantes, hasta que los restaures o los elimines definitivamente.</p></div></div>
    ${del.length?`<div class="scroll"><table><tbody>${del.map(p=>`<tr><td><b>${esc(fullName(p))}</b><div class="small muted">Eliminado el ${fmtShort(p.eliminadoEl||TODAY)}</div></td>
      <td class="num"><button class="btn sm" data-a="trash-restore" data-id="${esc(p.id)}">Restaurar</button> <button class="btn danger sm" data-a="trash-purge" data-id="${esc(p.id)}">Eliminar definitivamente</button></td></tr>`).join('')}</tbody></table></div>`
    :'<p class="panel-body muted">La papelera está vacía.</p>'}</section>`;
}
function purgePatient(pid){
  S.patients=S.patients.filter(x=>x.id!==pid);savePatients();
  for(const [k,d] of Object.entries(S.ses)){let ch=false;for(const id in d.items){if(d.items[id].pid===pid){delete d.items[id];ch=true}}if(ch)Store.save(k,d)}
  const cs=S.comps.filter(c=>c.pid===pid);
  for(const c of cs){if(c.fileDoc&&Store.fb)FB.fns.deleteDoc(FB.archivoRef(c.id)).catch(()=>{});if(c.asset&&S.assets)S.assets.delete(c.asset).catch(()=>{})}
  if(cs.length){S.comps=S.comps.filter(c=>c.pid!==pid);saveComps()}
}

/* ============ Aviso de pagos atrasados ============ */
const LK_ALERTA='psiconflor-alerta-vista';
const alertaDias=()=>Math.max(1,Number(S.config?.general?.alertaDias||7));
const pendDesde=s=>String(s.registradoEl||s.fecha).slice(0,10);
const diasPend=s=>daysBetween(pendDesde(s),TODAY);
function overdueList(){
  const n=alertaDias();
  return debtList().filter(s=>diasPend(s)>=n&&!(s.alertaHasta&&s.alertaHasta>TODAY)).sort((a,b)=>diasPend(b)-diasPend(a));
}
function waNum(p){let t=String(p?.telefono||'').replace(/\D/g,'');if(!t)return '';t=t.replace(/^0+/,'');if(!t.startsWith('54'))t='549'+t.replace(/^15/,'');return t.length>=12?t:''}
function waLink(s){
  const p=pat(s.pid);const t=waNum(p);if(!t)return '';
  const msg=`Hola ${p.nombre||''}, ¿cómo estás? Te escribo para recordarte que está pendiente el pago de la sesión del ${fmtShort(s.fecha)} (${money(montoOf(s))}). ¡Muchas gracias!`;
  return `https://wa.me/${t}?text=${encodeURIComponent(msg)}`;
}
function checkOverdue(force){
  if(LOCK.on) return;
  const list=overdueList();const d=document.getElementById('alerta');
  if(!list.length){if(d.open)d.close();return}
  let seen={};try{seen=JSON.parse(localStorage.getItem(LK_ALERTA)||'{}')}catch(e){}
  const vistos=seen.fecha===TODAY?(seen.ids||[]):[];
  if(!force&&list.every(s=>vistos.includes(s.id))) return;
  if(!force&&(dlg.open||document.getElementById('confirm').open)) return;
  renderAlerta(list);
  try{localStorage.setItem(LK_ALERTA,JSON.stringify({fecha:TODAY,ids:[...new Set([...vistos,...list.map(s=>s.id)])]}))}catch(e){}
}
function renderAlerta(list){
  const d=document.getElementById('alerta');list=list||overdueList();
  if(!list.length){if(d.open)d.close();toast('No quedan pagos atrasados');return}
  const tot=list.reduce((a,s)=>a+montoOf(s),0);
  d.innerHTML=`<div class="dlg-head"><div><h2>Pagos pendientes hace más de ${alertaDias()} días</h2><p class="muted small">${list.length} ${list.length===1?'sesión':'sesiones'}, ${money(tot)} en total.</p></div><button class="btn ghost icon" data-a="alerta-close" aria-label="Cerrar">✕</button></div>
    <div class="dlg-body"><ul class="alert-list">${list.map(s=>{S.visible[s.id]=s;const p=pat(s.pid);const e=item('estadosSesion',s.estado);const wa=waLink(s);
      return `<li><div class="al-main"><b>${esc(fullName(p))}</b><span class="small muted">Sesión del ${DIAS_C[dow(s.fecha)-1]} ${fmtShort(s.fecha)}${s.estado!==realizadaId()?` (${esc(e?.nombre||'')})`:''}, ${money(montoOf(s))}</span>
        <span class="al-days">Pendiente hace ${diasPend(s)} días</span></div>
        <div class="al-act"><button class="btn primary sm" data-a="al-pay" data-id="${esc(s.id)}">Pagado</button>
        ${wa?`<a class="btn sm" href="${esc(wa)}" target="_blank" rel="noopener">Recordar por WhatsApp</a>`:''}
        <button class="btn ghost sm" data-a="al-snooze" data-id="${esc(s.id)}">Avisarme en 3 días</button>
        <button class="btn ghost sm" data-a="al-goto" data-id="${esc(s.id)}">Ver en la agenda</button></div></li>`}).join('')}</ul></div>
    <div class="dlg-foot"><span class="small muted">Podés cambiar la cantidad de días en Configuración.</span><button class="btn" data-a="alerta-close">Cerrar</button></div>`;
  if(!d.open)d.showModal();
}

/* ============ PIN y bloqueo por inactividad ============ */
const pinKey=()=>'psiconflor-pin:'+(Store.email||'local');
const LK_PIN_SUG='psiconflor-pin-sugerido';
function pinCfg(){try{return JSON.parse(localStorage.getItem(pinKey())||'null')}catch(e){return null}}
function pinSave(c){try{if(c)localStorage.setItem(pinKey(),JSON.stringify(c));else localStorage.removeItem(pinKey())}catch(e){toast('No se pudo guardar el PIN en este dispositivo.')}}
async function pinHash(pin,salt){
  const enc=new TextEncoder();
  const key=await crypto.subtle.importKey('raw',enc.encode(pin),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:150000,hash:'SHA-256'},key,256);
  return [...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
const LOCK={on:false,flow:null,buf:'',fails:0,last:Date.now(),hiddenAt:0,waitUntil:0};
function closeAllLayers(){
  for(const id of ['dlg','viewer','alerta','confirm']){const d=document.getElementById(id);if(d?.open)d.close()}
  if(!pop().hidden)closePop();closeOffer();
}
function pinScreen(){
  let el=document.getElementById('lock');
  if(!el){el=document.createElement('div');el.id='lock';el.className='pinlock';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');document.body.appendChild(el)}
  const f=LOCK.flow;
  const titles={unlock:'Ingresá tu PIN',verify:'Ingresá tu PIN actual',set1:'Elegí un PIN de 4 dígitos',set2:'Repetí el PIN'};
  const subs={unlock:Store.email?esc(Store.email):'Consultorio Psiconflor',verify:'Para continuar, confirmá que sos vos.',set1:'Lo vas a usar para abrir la app en este dispositivo.',set2:'Para confirmar que lo escribiste bien.'};
  const dots=[0,1,2,3].map(i=>`<span class="${i<LOCK.buf.length?'on':''}"></span>`).join('');
  const keys=['1','2','3','4','5','6','7','8','9','','0','del'].map(k=>k===''?'<span></span>':`<button class="pkey${k==='del'?' del':''}" data-a="pin-key" data-k="${k}" aria-label="${k==='del'?'Borrar':k}">${k==='del'?'⌫':k}</button>`).join('');
  const waiting=LOCK.waitUntil>Date.now();
  el.innerHTML=`<div class="lock-card">${LOGO_SVG.replace('width="72" height="72"','width="60" height="60"')}
    <h2>${titles[f.mode]}</h2><p class="muted small">${subs[f.mode]}</p>
    <div class="pin-dots" aria-live="polite" aria-label="${LOCK.buf.length} de 4 dígitos">${dots}</div>
    <p class="pin-err" role="alert">${esc(f.err||'')}</p>
    <div class="keypad${waiting?' disabled':''}">${keys}</div>
    <div class="lock-foot">${f.mode==='unlock'?'<button class="btn ghost sm" data-a="pin-forgot">Olvidé mi PIN</button>':'<button class="btn ghost sm" data-a="pin-cancel">Cancelar</button>'}</div></div>`;
  el.hidden=false;
}
function startPinFlow(mode,onDone){closeAllLayers();LOCK.flow={mode,onDone,err:''};LOCK.buf='';pinScreen()}
function hideLock(){const el=document.getElementById('lock');if(el)el.hidden=true;LOCK.flow=null;LOCK.buf=''}
function lockNow(){
  if(!pinCfg()||LOCK.on) return;
  LOCK.on=true;startPinFlow('unlock',()=>{LOCK.on=false;LOCK.fails=0;LOCK.last=Date.now();hideLock();render()});
}
async function pinDigit(k){
  const f=LOCK.flow;if(!f)return;
  if(LOCK.waitUntil>Date.now()){f.err=`Esperá ${Math.ceil((LOCK.waitUntil-Date.now())/1000)} segundos.`;pinScreen();return}
  if(k==='del'){LOCK.buf=LOCK.buf.slice(0,-1);f.err='';pinScreen();return}
  if(LOCK.buf.length>=4)return;
  LOCK.buf+=k;f.err='';pinScreen();
  if(LOCK.buf.length<4)return;
  const pin=LOCK.buf;await sleep(120);
  if(f.mode==='unlock'||f.mode==='verify'){
    const c=pinCfg();const ok=c&&(await pinHash(pin,c.salt))===c.hash;
    if(ok){LOCK.buf='';f.onDone();return}
    LOCK.fails++;LOCK.buf='';
    if(LOCK.fails>=5){
      if(Store.fb){pinSave(null);f.err='Demasiados intentos. Por seguridad, cerramos la sesión.';pinScreen();await sleep(1600);doLogout();return}
      LOCK.waitUntil=Date.now()+30000;LOCK.fails=0;f.err='Demasiados intentos. Esperá 30 segundos.';
    } else f.err=`PIN incorrecto. ${5-LOCK.fails===1?'Te queda 1 intento':`Te quedan ${5-LOCK.fails} intentos`}.`;
    pinScreen();return;
  }
  if(f.mode==='set1'){LOCK.flow={...f,mode:'set2',first:pin,err:''};LOCK.buf='';pinScreen();return}
  if(f.mode==='set2'){
    if(pin!==f.first){LOCK.flow={...f,mode:'set1',first:'',err:'Los PIN no coinciden. Probá de nuevo.'};LOCK.buf='';pinScreen();return}
    const salt=uid()+uid();const old=pinCfg();
    pinSave({salt,hash:await pinHash(pin,salt),min:old?.min||5,alSalir:old?.alSalir??true});
    LOCK.buf='';f.onDone();
  }
}
async function pinForgot(){
  const msg=Store.fb?'Para crear un PIN nuevo, tenés que volver a iniciar sesión con tu cuenta de Google. Tus datos no se pierden.':'Se borra el PIN de este dispositivo.';
  const el=document.getElementById('lock');el.hidden=true;
  const ok=await confirmBox('Olvidé mi PIN',msg,Store.fb?'Iniciar sesión de nuevo':'Borrar PIN',false);
  if(!ok){el.hidden=false;return}
  pinSave(null);
  if(Store.fb){doLogout();return}
  LOCK.on=false;hideLock();render();toast('PIN eliminado');
}
function pinActivity(){LOCK.last=Date.now()}
function pinTick(){
  const c=pinCfg();if(!c||LOCK.on)return;
  if(Date.now()-LOCK.last>=(Number(c.min)||5)*60000) lockNow();
}
function pinInit(){
  ['pointerdown','keydown','wheel','touchstart'].forEach(ev=>document.addEventListener(ev,pinActivity,{passive:true,capture:true}));
  document.addEventListener('visibilitychange',()=>{
    const c=pinCfg();if(!c)return;
    if(document.visibilityState==='hidden'){LOCK.hiddenAt=Date.now();if(c.alSalir)lockNow()}
    else pinTick();
  });
  setInterval(pinTick,15000);
  if(pinCfg()) lockNow();
}
function pinPanel(){
  const c=pinCfg();
  const mins=[1,3,5,10,15,30];
  return `<section class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Seguridad de este dispositivo</h2>
    <p class="small muted" style="margin-top:3px">El PIN se guarda solo en este dispositivo: cada computadora o celular tiene el suyo. Evita que alguien que tome el dispositivo vea la agenda.</p></div></div>
    <div class="panel-body">${c?`<div class="form cols3">
      <div class="field"><label>PIN</label><p class="ok-txt" style="margin:6px 0 0">Activado</p></div>
      <div class="field"><label for="pinMin">Bloquear después de</label><select class="select" id="pinMin" data-c="pin-min">${mins.map(m=>`<option value="${m}"${Number(c.min)===m?' selected':''}>${m} ${m===1?'minuto':'minutos'} sin uso</option>`).join('')}</select></div>
      <div class="field"><label>Al salir de la app</label><label class="check"><input type="checkbox" data-c="pin-salir" ${c.alSalir?'checked':''}>Bloquear apenas cambio de app o de pestaña</label></div>
      </div><div class="btn-group" style="margin-top:12px"><button class="btn" data-a="pin-lock">Bloquear ahora</button><button class="btn" data-a="pin-change">Cambiar PIN</button><button class="btn danger" data-a="pin-off">Desactivar PIN</button></div>`
    :`<p class="muted" style="margin-bottom:12px">Todavía no hay un PIN en este dispositivo.</p><button class="btn primary" data-a="pin-on">Activar PIN</button>`}</div></section>`;
}
function pinSuggest(){
  if(pinCfg())return '';
  try{if(localStorage.getItem(LK_PIN_SUG))return ''}catch(e){}
  return `<div class="notice">${ICONS.info}<p style="flex:1">Protegé este dispositivo con un PIN de 4 dígitos, así nadie más puede abrir la agenda.</p><button class="btn sm" data-a="pin-on">Activar PIN</button><button class="btn ghost sm" data-a="pin-sug-no">Ahora no</button></div>`;
}

/* ============ Feriados de Argentina ============ */
// Fuente: calendario oficial 2026 (Ley 27.399, Decreto 614/2025 y Resolución 164/2025 de Jefatura de Gabinete).
// tipo 'feriado' = feriado nacional; 'turistico' = día no laborable con fines turísticos.
const FERIADOS_AR={
  '2026-01-01':['Año Nuevo','feriado'],
  '2026-02-16':['Carnaval','feriado'],
  '2026-02-17':['Carnaval','feriado'],
  '2026-03-23':['Día no laborable con fines turísticos','turistico'],
  '2026-03-24':['Día Nacional de la Memoria por la Verdad y la Justicia','feriado'],
  '2026-04-02':['Día del Veterano y de los Caídos en la Guerra de Malvinas','feriado'],
  '2026-04-03':['Viernes Santo','feriado'],
  '2026-05-01':['Día del Trabajador','feriado'],
  '2026-05-25':['Día de la Revolución de Mayo','feriado'],
  '2026-06-15':['Paso a la Inmortalidad del General Martín Miguel de Güemes','feriado'],
  '2026-06-20':['Paso a la Inmortalidad del General Manuel Belgrano','feriado'],
  '2026-07-09':['Día de la Independencia','feriado'],
  '2026-07-10':['Día no laborable con fines turísticos','turistico'],
  '2026-08-17':['Paso a la Inmortalidad del General José de San Martín','feriado'],
  '2026-10-12':['Día del Respeto a la Diversidad Cultural','feriado'],
  '2026-11-23':['Día de la Soberanía Nacional','feriado'],
  '2026-12-07':['Día no laborable con fines turísticos','turistico'],
  '2026-12-08':['Inmaculada Concepción de María','feriado'],
  '2026-12-25':['Navidad','feriado']
};
const FER_TIPOS={feriado:'Feriado',turistico:'No laborable (turístico)'};
function feriadoDe(fecha){
  const g=S.config?.general||{};
  const extra=(g.feriadosExtra||[]).find(f=>f.fecha===fecha);
  if(extra) return {nombre:extra.nombre,tipo:extra.tipo||'feriado',propio:true};
  if((g.feriadosQuitados||[]).includes(fecha)) return null;
  const f=FERIADOS_AR[fecha];return f?{nombre:f[0],tipo:f[1]}:null;
}
function feriadoAuto(fecha){
  const f=feriadoDe(fecha);if(!f)return false;
  const modo=S.config?.general?.feriadosAuto||'nacionales';
  return modo==='todos'||(modo==='nacionales'&&f.tipo==='feriado');
}
function ferTag(fecha,corto){
  const f=feriadoDe(fecha);if(!f)return '';
  return `<span class="fer ${f.tipo}" title="${esc(f.nombre)}">${corto?(f.tipo==='feriado'?'Feriado':'No laborable'):esc(f.nombre)}</span>`;
}
/* ============ Facturación electrónica (ARCA) ============ */
const SERVIDOR_DEF='https://arca-qe54wqshhq-rj.a.run.app';
const facCfg=()=>({url:SERVIDOR_DEF,ptoVta:1,...(S.config?.general?.facturacion||{})});
async function llamarServidor(datos){
  if(!Store.fb) throw new Error('La facturación funciona solo en la versión real de la app (la de GitHub), con la sesión de Google iniciada.');
  const u=FB.auth.currentUser;if(!u) throw new Error('Iniciá sesión con Google para continuar.');
  const token=await u.getIdToken();
  let r;
  try{r=await fetch(facCfg().url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(datos),signal:AbortSignal.timeout(60000)})}
  catch(e){throw new Error('No se pudo conectar con el servidor. Revisá la conexión a internet.')}
  let j={};try{j=await r.json()}catch(e){}
  if(!r.ok||j.ok===false) throw new Error(j.error||(j.errores||[]).join(' | ')||`El servidor respondió con un error (${r.status}).`);
  return j;
}
function facturacionPanel(){
  const f=facCfg();const res=S.facPrueba;
  const fmtF=s=>{if(!s)return '—';const d=new Date(s);return isNaN(d)?esc(s):`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`};
  let out='';
  if(res?.cargando) out='<p class="muted">Conectando con ARCA… puede tardar unos segundos.</p>';
  else if(res?.error) out=`<div class="notice warn">${ICONS.info}<p>${esc(res.error)}</p></div>`;
  else if(res?.ok){const a=res.arca||{};const okA=a.AppServer==='OK'&&a.DbServer==='OK'&&a.AuthServer==='OK';
    out=`<div class="fac-ok"><p class="ok-txt" style="margin:0 0 8px">✓ Conexión con ARCA funcionando</p><dl class="fac-dl">
      <dt>Entorno</dt><dd>${res.entorno==='prod'?'<b>Producción</b> (facturas reales)':'Homologación (facturas de prueba, sin validez fiscal)'}</dd>
      <dt>CUIT</dt><dd>${esc(res.cuit)}</dd>
      <dt>Servidores de ARCA</dt><dd>${okA?'Funcionando':esc(JSON.stringify(a))}</dd>
      <dt>Certificado vence</dt><dd>${fmtF(res.certificadoVence)}</dd>
      <dt>Punto de venta</dt><dd>${esc(res.ptoVta)}</dd>
      <dt>Última Factura C emitida</dt><dd>${res.ultimoNumero?`N.º ${esc(res.ultimoNumero)}`:'Ninguna todavía'}</dd>
      ${res.ultimoRecibo!=null?`<dt>Último Recibo C emitido</dt><dd>${res.ultimoRecibo?`N.º ${esc(res.ultimoRecibo)}`:'Ninguno todavía'}</dd>`:''}</dl></div>`;}
  return `<section class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Facturación electrónica (ARCA)</h2>
    <p class="small muted" style="margin-top:3px">Emisión de Factura C a través del servidor del consultorio. El certificado de ARCA está guardado en Google Secret Manager y la app nunca lo ve.</p></div></div>
    <div class="panel-body"><div class="form cols3">
      <div class="field full"><label for="facUrl">Dirección del servidor</label><input class="input" id="facUrl" data-c="fac" data-k="url" value="${esc(f.url)}"></div>
      <div class="field"><label for="facPto">Punto de venta</label><input class="input" type="number" min="1" id="facPto" data-c="fac" data-k="ptoVta" value="${esc(f.ptoVta)}"><p class="hint">En homologación sirve cualquier número.</p></div>
    </div>
    <div class="btn-group" style="margin-top:12px"><button class="btn primary" data-a="fac-test" ${res?.cargando?'disabled':''}>Probar conexión con ARCA</button></div>
    <div style="margin-top:14px" aria-live="polite">${out}</div>
    ${Store.fb?'':'<p class="hint" style="margin-top:10px">En esta versión de prueba no se puede conectar con ARCA: probalo en la versión real de GitHub.</p>'}
    </div></section>`;
}
/* ============ PDF de la factura (formato del modelo de ARCA) ============ */
const LIBS={jspdf:'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',qr:'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'};
function cargarScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`)){res();return}const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('No se pudo cargar la herramienta para armar el PDF. Revisá la conexión a internet.'));document.head.appendChild(s)})}
async function libsPDF(){
  if(!window.jspdf) await cargarScript(LIBS.jspdf);
  if(!window.qrcode) await cargarScript(LIBS.qr);
}
const nro2=n=>(Math.round(Number(n||0)*100)/100).toFixed(2).replace('.',',');
const pad0=(n,l)=>String(n).padStart(l,'0');
const ddmmaaaa=s=>{s=String(s||'');if(/^\d{8}$/.test(s))return `${s.slice(6,8)}/${s.slice(4,6)}/${s.slice(0,4)}`;if(/^\d{4}-\d{2}-\d{2}/.test(s))return `${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`;return s};
const isoDe=s=>{s=String(s||'');return /^\d{8}$/.test(s)?`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`:s.slice(0,10)};
function qrTexto(f){
  const d={ver:1,fecha:isoDe(f.fecha),cuit:Number(f.cuitEmisor),ptoVta:Number(f.ptoVta),tipoCmp:Number(f.tipo||11),nroCmp:Number(f.numero),importe:Number(f.importe),moneda:'PES',ctz:1,tipoDocRec:Number(f.docTipo),nroDocRec:Number(f.docNro),tipoCodAut:'E',codAut:Number(f.cae)};
  return 'https://www.afip.gob.ar/fe/qr/?p='+btoa(JSON.stringify(d));
}
/* f: datos de la factura (incluye emisor, detalle, receptor) */
async function facturaPDF(f){
  await libsPDF();
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:'mm',format:'a4'});
  const E=f.emisor||{};const L=10,R=200,W=R-L;let y=10;
  doc.setDrawColor(0);doc.setLineWidth(.3);
  const box=(x,yy,w,h)=>doc.rect(x,yy,w,h);
  const txt=(t,x,yy,o={})=>{doc.setFont('helvetica',o.b?'bold':o.i?'italic':'normal');doc.setFontSize(o.s||9);doc.text(String(t??''),x,yy,o.a?{align:o.a}:undefined)};
  const lab=(l,v,x,yy,s=9)=>{doc.setFont('helvetica','bold');doc.setFontSize(s);doc.text(l,x,yy);const w=doc.getTextWidth(l+' ');doc.setFont('helvetica','normal');doc.text(String(v??''),x+w,yy)};
  const REC0=Number(f.tipo)===15;
  const pagina=(copia)=>{y=10;
  // Encabezado
  box(L,y,W,10);txt(copia,105,y+7,{b:1,s:13,a:'center'});y+=10;
  const hTop=52;box(L,y,W,hTop);doc.line(105,y+16,105,y+hTop);
  const REC=Number(f.tipo)===15;
  box(98,y,14,16);txt('C',105,y+9,{b:1,s:20,a:'center'});txt(REC?'COD. 15':'COD. 011',105,y+14,{b:1,s:6,a:'center'});
  doc.setFont('helvetica','bold');doc.setFontSize(10);
  doc.text(doc.splitTextToSize(String(E.nombreFantasia||E.razonSocial||'').toUpperCase(),80),55,y+10,{align:'center'});
  lab('Razón Social:',E.razonSocial||'',L+3,y+27);
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('Domicilio Comercial:',L+3,y+36);
  doc.setFont('helvetica','normal');doc.text(doc.splitTextToSize(E.domicilio||'',52),L+38,y+36);
  lab('Condición frente al IVA:',E.condIva||'Responsable Monotributo',L+3,y+48);
  txt(REC?'RECIBO':'FACTURA',114,y+12,{b:1,s:20});
  lab('Punto de Venta:',pad0(f.ptoVta,5),114,y+22,9.5);lab('Comp. Nro:',pad0(f.numero,8),160,y+22,9.5);
  lab('Fecha de Emisión:',ddmmaaaa(f.fecha),114,y+28,9.5);
  lab('CUIT:',f.cuitEmisor||'',114,y+37);lab('Ingresos Brutos:',E.iibb||'',114,y+42);lab('Fecha de Inicio de Actividades:',ddmmaaaa(E.inicioAct),114,y+47);
  y+=hTop;
  box(L,y,W,9);lab('Período Facturado Desde:',ddmmaaaa(f.servDesde),L+3,y+6,9.5);lab('Hasta:',ddmmaaaa(f.servHasta),88,y+6,9.5);lab('Fecha de Vto. para el pago:',ddmmaaaa(f.vtoPago||f.fecha),128,y+6,9.5);y+=9;
  box(L,y,W,24);lab('DNI:',f.docNro,L+2,y+5,8.5);lab('Apellido y Nombre / Razón Social:',String(f.receptor||'').toUpperCase(),88,y+5,8.5);
  lab('Condición frente al IVA:','Consumidor Final',L+2,y+12,8);lab(REC?'Domicilio Comercial:':'Domicilio:','',REC?105:120,y+12,8);lab('Condición de venta:',f.condVenta||'',L+2,y+19,8);y+=27;
  if(REC){
    box(L,y-3,W,6);y+=12;
    lab('Recibi(mos) la suma de:','',L+2,y,9);txt('$ '+nro2(f.importe),L+42,y,{s:11});y+=6;
    txt('en concepto de:',L+2,y,{b:1,s:9});y+=7;
    doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text(doc.splitTextToSize((f.detalle?.[0]?.texto)||CONCEPTO_RECIBO_DEF,180),L+3,y);
    y=212;box(L,y,W,34);
    const fila=(l,v,yy,s=9.5)=>{doc.setFont('helvetica','bold');doc.setFontSize(s);doc.text(l,170,yy,{align:'right'});doc.text(v,R-3,yy,{align:'right'})};
    fila('Subtotal: $',nro2(f.importe),y+6);
    doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text('Bonif: %0',118,y+12);fila('Importe Bonif: $','0,00',y+12);
    fila('Subtotal c/Bonif.: $',nro2(f.importe),y+18);fila('Importe Otros Tributos: $','0,00',y+24);fila('Importe Total: $',nro2(f.importe),y+30,10.5);
    y+=38;
  } else {
  // Tabla
  const cols=[[L,14,'Código'],[L+14,58,'Producto / Servicio'],[L+72,20,'Cantidad'],[L+92,18,'U. Medida'],[L+110,24,'Precio Unit.'],[L+134,14,'% Bonif'],[L+148,20,'Imp. Bonif.'],[L+168,22,'Subtotal']];
  doc.setFillColor(204,204,204);doc.rect(L,y,W,7,'FD');
  cols.forEach(([x,w,t],i)=>{if(i)doc.line(x,y,x,y+7);txt(t,i===1?x+2:x+w/2,y+5,{b:1,s:7.5,a:i===1?undefined:'center'})});y+=10;
  for(const it of (f.detalle||[])){
    doc.setFont('helvetica','normal');doc.setFontSize(7.5);const lines=doc.splitTextToSize(it.texto||'',55);
    doc.text(lines,L+16,y);txt('1,00',L+90,y,{s:7.5,a:'right'});txt('unidades',L+94,y,{s:6.5});
    txt(nro2(it.importe),L+133,y,{s:7.5,a:'right'});txt('0,00',L+136,y,{s:7.5});txt('0,00',L+167,y,{s:7.5,a:'right'});txt(nro2(it.importe),R-1,y,{s:7.5,a:'right'});
    y+=lines.length*3.3+2;
  }
  if(f.firma){try{const pr=doc.getImageProperties(f.firma);const fw=38,fh=Math.min(28,fw*pr.height/pr.width);doc.addImage(f.firma,R-fw-6,Math.min(y,205),fw,fh)}catch(e){}}
  // Totales
  y=Math.max(y+30,215);box(L,y,W,26);
  lab('Subtotal: $','',150,y+8,9.5);txt(nro2(f.importe),R-3,y+8,{b:1,s:9.5,a:'right'});
  lab('Importe Otros Tributos: $','',127,y+15,9.5);txt('0,00',R-3,y+15,{b:1,s:9.5,a:'right'});
  lab('Importe Total: $','',143,y+22,10.5);txt(nro2(f.importe),R-3,y+22,{b:1,s:10.5,a:'right'});y+=30;
  }
  const ley=String(E.leyendaPie||'').trim().replace(/^["'“”«»]+|["'“”«»]+$/g,'').trim();
  if(ley){box(L,y,W,9);txt(`"${ley}"`,105,y+6,{i:1,s:9,a:'center'});y+=11}
  // Pie con QR y CAE
  const qr=window.qrcode(0,'M');qr.addData(qrTexto(f));qr.make();doc.addImage(qr.createDataURL(4,0),'GIF',L,y+2,30,30);
  txt('ARCA',L+34,y+10,{b:1,s:16});txt('AGENCIA DE RECAUDACIÓN Y CONTROL ADUANERO',L+34,y+13.5,{s:4.5});
  txt('Comprobante Autorizado',L+34,y+21,{b:1,i:1,s:8});
  doc.setFont('helvetica','bolditalic');doc.setFontSize(5.5);doc.text('Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación',L+34,y+26);
  txt('Pág. 1/1',105,y+8,{b:1,s:9,a:'center'});
  lab('CAE N°:',f.cae||'',150,y+8,10);lab('Fecha de Vto. de CAE:',ddmmaaaa(f.caeVence),132,y+14,9.5);
  // Marca de agua para pruebas
  const marca=f.simulada?'SIMULACIÓN · SIN VALIDEZ FISCAL':f.entorno!=='prod'?'HOMOLOGACIÓN · SIN VALIDEZ FISCAL':'';
  if(marca){doc.setTextColor(200,60,60);doc.setFont('helvetica','bold');doc.setFontSize(26);doc.saveGraphicsState&&doc.saveGraphicsState();
    try{doc.setGState(new doc.GState({opacity:.18}))}catch(e){}
    doc.text(marca,105,160,{align:'center',angle:30});doc.restoreGraphicsState&&doc.restoreGraphicsState();doc.setTextColor(0)}
  };
  const copias=REC0?['ORIGINAL','DUPLICADO','TRIPLICADO']:['ORIGINAL'];
  copias.forEach((c,k)=>{if(k)doc.addPage();pagina(c)});
  return doc;
}
function nombrePDF(f){return `${f.tipo===15?'Recibo':'Factura'}-C-${pad0(f.ptoVta,5)}-${pad0(f.numero,8)}${f.simulada?'-SIMULACION':f.entorno!=='prod'?'-PRUEBA':''}.pdf`}
async function descargarPDF(f){
  try{
    toast('Armando el PDF…');
    const doc=await facturaPDF(f);const name=nombrePDF(f);
    if(S.downloads){try{await S.downloads.save({filename:name,data:doc.output('arraybuffer')});return}catch(e){if(e?.code==='cancelled')return}}
    doc.save(name);
  }catch(e){toast(e.message||'No se pudo armar el PDF.')}
}

/* ============ Facturas ============ */
const PLANTILLA_DEF='Sesión individual psicoterapia prestado a {paciente}[, número afiliado a {prepaga}: {afiliado}] Fecha: {fecha} {profesional}';
const emisorCfg=()=>({condIva:'Responsable Monotributo',plantilla:PLANTILLA_DEF,...(S.config?.general?.emisor||{})});
const entornoFac=()=>Store.fb?(S.config?.general?.facturacion?.entorno||'homo'):'sim';
const fechaCobro=s=>String(s.pagadoEl||s.fecha);
function facturasActivas(){
  if(!Store.fb) return S.facturasSim||[];
  const env=entornoFac();return (S.facturas||[]).filter(f=>f.entorno===env);
}
function sesionesFacturadas(){const set=new Set();for(const f of facturasActivas()) if(f.estado==='emitida'||f.ok) for(const id of (f.sesiones||[])) set.add(id);return set}
function textoLinea(s,p){
  const E=emisorCfg();let t=E.plantilla||PLANTILLA_DEF;
  const conPrepaga=!!(p?.prepaga&&p?.afiliado);
  t=t.replace(/\[([^\]]*)\]/g,(m,inner)=>conPrepaga?inner:'');
  const nombre=[p?.nombre,p?.apellido].filter(Boolean).join(' ');
  return t.replace(/\{paciente\}/g,nombre).replace(/\{prepaga\}/g,p?.prepaga||'').replace(/\{afiliado\}/g,p?.afiliado||'')
    .replace(/\{fecha\}/g,fmtDMY(s.fecha)).replace(/\{profesional\}/g,E.profesional||'').replace(/\s+/g,' ').trim();
}
const TIPOS_CBTE={11:'Factura C',15:'Recibo C'};
const CONCEPTO_RECIBO_DEF='Honorarios profesionales psicoterapia';
function tipoCbte(p){const it=item('facturacion',p?.facturacion);if(!it)return null;const n=Number(it.comprobante);return [11,15].includes(n)?n:0}
function fmtDMY(s){return `${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`}
const aaaammdd=s=>s.replace(/-/g,'');
/* Sesiones cobradas en el mes y todavía sin facturar, agrupadas por paciente */
function porFacturar(mes){
  const fact=sesionesFacturadas();const by={};
  for(const d of Object.values(S.ses)) for(const s of Object.values(d.items||{})){
    if(s.oculta||!pidVivo(s.pid)||fact.has(s.id)) continue;
    if(item('estadosPago',s.pago)?.tipo!=='cobrado') continue;
    if(monthKey(fechaCobro(s))!==mes) continue;
    (by[s.pid]=by[s.pid]||[]).push(s);
  }
  return Object.entries(by).map(([pid,ss])=>{ss.sort((a,b)=>a.fecha.localeCompare(b.fecha));const p=pat(pid);return {pid,p,tipo:tipoCbte(p),ss,total:ss.reduce((a,s)=>a+montoOf(s),0)}})
    .sort((a,b)=>sortName(a.p).localeCompare(sortName(b.p)));
}
function faltantesEmisor(){const E=emisorCfg();return [['razonSocial','razón social'],['domicilio','domicilio comercial'],['inicioAct','fecha de inicio de actividades'],['iibb','ingresos brutos']].filter(([k])=>!String(E[k]||'').trim()).map(([,l])=>l)}
function dniValido(p){return /^\d{7,8}$/.test(String(p?.dni||'').replace(/\D/g,''))}
function claveFactura(pid,mes,ss,tipo){let h=0;for(const c of ss.map(s=>s.id).sort().join('|'))h=(h*31+c.charCodeAt(0))>>>0;return `${pid}_${mes}_${tipo===15?'r':'f'}${h.toString(36)}`}
function datosFactura(g,mes){
  const p=g.p;const E=emisorCfg();const medios={};for(const s of g.ss){const m=s.medio||p?.medioPago||'';medios[m]=(medios[m]||0)+1}
  const medio=Object.entries(medios).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
  return {
    tipo:g.tipo===15?15:11,clave:claveFactura(g.pid,mes,g.ss,g.tipo),ptoVta:Number(facCfg().ptoVta)||1,docTipo:96,docNro:String(p?.dni||'').replace(/\D/g,''),
    importe:Math.round(g.total*100)/100,servDesde:aaaammdd(g.ss[0].fecha),servHasta:aaaammdd(g.ss[g.ss.length-1].fecha),condIva:5,
    receptor:[p?.apellido,p?.nombre].filter(Boolean).join(' '),pid:g.pid,sesiones:g.ss.map(s=>s.id),
    detalle:g.tipo===15?[{texto:E.conceptoRecibo||CONCEPTO_RECIBO_DEF,importe:Math.round(g.total*100)/100}]:g.ss.map(s=>({texto:textoLinea(s,p),importe:montoOf(s),fecha:s.fecha})),
    condVenta:item('mediosPago',medio)?.nombre||'',emisor:{...E,plantilla:undefined},mes
  };
}
function viewFacturas(){
  libsPDF().catch(()=>{});
  const m=S.facMes||(S.facMes=monthKey(TODAY));const [y,mm]=m.split('-');
  const todos=porFacturar(m);const grupos=todos.filter(g=>g.tipo!==0);const sinCbte=todos.filter(g=>g.tipo===0);const env=entornoFac();
  const emitidas=facturasActivas().filter(f=>(f.estado==='emitida'||f.ok)&&(f.mes||monthKey(isoDe(f.fecha)))===m).sort((a,b)=>(b.numero||0)-(a.numero||0));
  const falt=faltantesEmisor();
  const aviso=env==='sim'?`<div class="notice">${ICONS.info}<p>Versión de prueba: las facturas se <b>simulan</b> (no se envían a ARCA) para que puedas probar el circuito completo.</p></div>`
    :env==='homo'?`<div class="notice warn">${ICONS.info}<p>Estás en <b>homologación</b>: las facturas son de prueba y no tienen validez fiscal.</p></div>`:'';
  const rows=grupos.map(g=>{const ok=dniValido(g.p);const tl=g.tipo?TIPOS_CBTE[g.tipo]:'';return `<tr><td><b>${esc(fullName(g.p))}</b><div class="small muted">${ok?'DNI '+esc(g.p.dni):'<span class="warn-txt">Falta el DNI</span>'}${g.p?.prepaga?' · '+esc(g.p.prepaga):''}</div></td>
    <td>${tl?`<span class="chip sm">${tl}</span>`:'<span class="warn-txt small">Sin definir</span>'}</td>
    <td>${g.ss.map(s=>fmtShort(s.fecha)).join(', ')}</td><td class="num">${g.ss.length}</td><td class="num"><b>${money(g.total)}</b></td>
    <td class="num">${!g.tipo?`<button class="btn sm" data-a="pac-open" data-id="${esc(g.pid)}">Elegir comprobante</button>`:!ok?`<button class="btn sm" data-a="pac-open" data-id="${esc(g.pid)}">Completar DNI</button>`:`<button class="btn primary sm" data-a="fac-prev" data-pid="${esc(g.pid)}">Revisar y emitir</button>`}</td></tr>`}).join('');
  const em=emitidas.map(f=>`<tr><td data-v="${f.numero}"><span class="small muted">${TIPOS_CBTE[f.tipo]||'Factura C'}</span><br>${pad0(f.ptoVta,5)}-${pad0(f.numero,8)}</td><td>${ddmmaaaa(f.fecha)}</td><td>${esc(f.receptor||fullName(pat(f.pid)))}</td><td class="num">${money(f.importe)}</td><td class="small">${esc(f.cae||'')}</td>
    <td data-v="${esc(f.enviadaEl||'')}">${f.enviadaEl?`<span class="ok-txt">Enviada el ${fmtShort(f.enviadaEl)}</span>`:'<span class="muted">Sin enviar</span>'}</td>
    <td class="num nowrap"><button class="btn sm" data-a="fac-pdf" data-id="${esc(f.id||f.clave)}">PDF</button> <button class="btn sm wa" data-a="fac-send" data-id="${esc(f.id||f.clave)}">Enviar por WhatsApp</button></td></tr>`).join('');
  return `<div class="view-head"><div><h1>Facturas de ${MESES[Number(mm)-1]} ${y}</h1><p class="sub">Un comprobante por paciente con las sesiones <b>cobradas</b> en el mes que todavía no tienen comprobante.</p></div>
    <div class="btn-group"><button class="btn icon" data-a="fac-mes" data-n="-1" aria-label="Mes anterior">‹</button><button class="btn" data-a="fac-mes" data-n="0">Este mes</button><button class="btn icon" data-a="fac-mes" data-n="1" aria-label="Mes siguiente">›</button></div></div>
    ${aviso}
    ${falt.length?`<div class="notice warn">${ICONS.info}<p style="flex:1">Faltan tus datos de emisor: ${falt.join(', ')}.</p><button class="btn sm" data-a="nav" data-v="config">Completar en Configuración</button></div>`:''}
    <div class="panel"><div class="panel-head"><h2>Para emitir</h2><span class="small muted">${grupos.length?`${grupos.length} ${grupos.length===1?'paciente':'pacientes'}, ${money(grupos.reduce((a,g)=>a+g.total,0))}`:''}</span></div>
    <div class="scroll"><table data-sort="fac-pend"><thead><tr><th>Paciente</th><th>Comprobante</th><th data-nosort>Sesiones cobradas</th><th class="num">Cant.</th><th class="num">Total</th><th data-nosort></th></tr></thead>
    <tbody>${rows||'<tr><td colspan="6" class="muted">No hay sesiones cobradas sin comprobante en este mes.</td></tr>'}</tbody></table></div>
    ${sinCbte.length?`<p class="hint panel-body" style="padding-top:8px">${sinCbte.length===1?'1 paciente tiene':`${sinCbte.length} pacientes tienen`} "Sin factura" en su ficha y no ${sinCbte.length===1?'aparece':'aparecen'} en esta lista: ${sinCbte.map(g=>esc(fullName(g.p))).join(', ')}.</p>`:''}
    <p class="hint panel-body" style="padding-top:${sinCbte.length?0:8}px">El comprobante depende de "Facturación" en la ficha de cada paciente: Reintegro emite Factura C con el detalle de cada sesión; Recibo C emite un recibo por el total.</p></div>
    <div class="panel"><div class="panel-head"><h2>Comprobantes emitidos de este mes</h2></div>
    <div class="scroll"><table data-sort="fac-emit"><thead><tr><th>Número</th><th>Fecha</th><th>Receptor</th><th class="num">Importe</th><th>CAE</th><th>Envío</th><th data-nosort></th></tr></thead>
    <tbody>${em||'<tr><td colspan="7" class="muted">Todavía no hay comprobantes emitidos en este mes.</td></tr>'}</tbody></table></div></div>`;
}
function facPreview(pid){
  const m=S.facMes;const g=porFacturar(m).find(x=>x.pid===pid);if(!g)return;
  const d=datosFactura(g,m);S.facDraft=d;const env=entornoFac();
  const TL=TIPOS_CBTE[d.tipo];
  openDlg(`<div class="dlg-head"><div><h2>Vista previa: ${TL}</h2><p class="muted small">${env==='prod'?'<b class="neg-txt">Factura real: se envía a ARCA y no se puede borrar.</b>':env==='homo'?'Homologación: factura de prueba, sin validez fiscal.':'Simulación: no se envía a ARCA.'}</p></div><button class="btn ghost icon" data-a="dlg-close" aria-label="Cerrar">✕</button></div>
  <div class="dlg-body"><dl class="fac-dl">
    <dt>Receptor</dt><dd>${esc(d.receptor.toUpperCase())}</dd><dt>DNI</dt><dd>${esc(d.docNro)}</dd><dt>Condición frente al IVA</dt><dd>Consumidor Final</dd>
    <dt>Período facturado</dt><dd>${ddmmaaaa(d.servDesde)} al ${ddmmaaaa(d.servHasta)}</dd><dt>Condición de venta</dt><dd>${esc(d.condVenta||'—')}</dd><dt>Punto de venta</dt><dd>${pad0(d.ptoVta,5)}</dd></dl>
    <div class="fac-lines">${d.detalle.map(it=>`<div class="fac-line"><span>${esc(it.texto)}</span><b>${money(it.importe)}</b></div>`).join('')}</div>
    <div class="fac-total"><span>Importe total</span><b>${money(d.importe)}</b></div>
    <p class="hint">Revisá los datos antes de emitir. Si algo está mal, cerrá esta ventana y corregilo en la ficha del paciente o en Configuración.</p></div>
  <div class="dlg-foot"><span></span><div class="btn-group"><button class="btn" data-a="dlg-close">Cancelar</button><button class="btn primary" data-a="fac-emit" id="facEmitBtn">Emitir ${TL}</button></div></div>`);
}
async function facEmitir(){
  const d=S.facDraft;if(!d)return;const btn=document.getElementById('facEmitBtn');const btnTxt=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Emitiendo…'}
  try{
    let f;
    if(!Store.fb){
      const ult=(S.facturasSim||[]).filter(x=>(x.tipo||11)===d.tipo).reduce((a,x)=>Math.max(a,x.numero||0),0);
      f={...d,id:'sim-'+d.clave,ok:true,estado:'emitida',entorno:'sim',simulada:true,numero:ult+1,fecha:aaaammdd(TODAY),vtoPago:aaaammdd(TODAY),cae:String(Date.now()).padEnd(14,'0').slice(0,14),caeVence:aaaammdd(addDays(TODAY,10)),cuitEmisor:'20123456786'};
      S.facturasSim=[...(S.facturasSim||[]),f];Store.save('facturasSim',{items:S.facturasSim});
    } else {
      const r=await llamarServidor({accion:'emitir',...d,detalle:undefined,emisor:undefined,condVenta:undefined,mes:undefined});
      if(r.entorno&&r.entorno!==entornoFac()){S.config.general.facturacion={...facCfg(),entorno:r.entorno};saveConfig()}
      f={...d,...r,id:`${r.entorno}-${d.clave}`,vtoPago:r.fecha};
      {const reg=JSON.parse(JSON.stringify({...f,ok:true,estado:'emitida'}));delete reg.id;await FB.fns.setDoc(FB.facturaRef(f.id),reg,{merge:true}).catch(()=>{});}
      if(!S.facturas.some(x=>x.id===f.id)) S.facturas=[...S.facturas,f];
    }
    closeDlg();render();toast(`${TIPOS_CBTE[f.tipo]||'Factura C'} N.º ${pad0(f.ptoVta,5)}-${pad0(f.numero,8)} emitido`);
    descargarPDF({...f,firma:S.firma});
  }catch(e){if(btn){btn.disabled=false;btn.textContent=btnTxt}
    const box=document.querySelector('#dlg .dlg-body');if(box)box.insertAdjacentHTML('afterbegin',`<div class="notice warn">${ICONS.info}<p>${esc(e.message)}</p></div>`)}
}
/* ---- Enviar factura por WhatsApp ---- */
const MSG_FAC_DEF='Hola {nombre}, ¿cómo estás? Te envío {comprobante} de las sesiones de {mes}. ¡Gracias!';
function msgFactura(f){
  const p=pat(f.pid);const E=emisorCfg();const m=f.mes||monthKey(isoDe(f.fecha));
  return String(E.msgFactura||MSG_FAC_DEF).replace(/\{nombre\}/g,p?.nombre||'').replace(/\{mes\}/g,MESES[Number(m.slice(5))-1]+' '+m.slice(0,4)).replace(/\{numero\}/g,`${pad0(f.ptoVta,5)}-${pad0(f.numero,8)}`).replace(/\{comprobante\}/g,f.tipo===15?'el recibo':'la factura');
}
const puedeCompartirArchivos=()=>{try{return !!(navigator.canShare&&navigator.canShare({files:[new File(['x'],'x.pdf',{type:'application/pdf'})]}))}catch(e){return false}};
function facSendDialog(id){
  const f=facturaPorId(id);if(!f)return;const p=pat(f.pid);const num=waNum(p);const msg=msgFactura(f);
  S.facSend={id};const share=puedeCompartirArchivos();
  const wa=num?`https://wa.me/${num}?text=${encodeURIComponent(msg)}`:'';
  openDlg(`<div class="dlg-head"><div><h2>Enviar por WhatsApp</h2><p class="muted small">${esc(fullName(p))}, ${TIPOS_CBTE[f.tipo]||'Factura C'} ${pad0(f.ptoVta,5)}-${pad0(f.numero,8)}</p></div><button class="btn ghost icon" data-a="dlg-close" aria-label="Cerrar">✕</button></div>
  <div class="dlg-body">
    ${!num?`<div class="notice warn">${ICONS.info}<p style="flex:1">${esc(p?.nombre||'Este paciente')} no tiene un teléfono válido en su ficha.</p><button class="btn sm" data-a="pac-open" data-id="${esc(f.pid)}">Completar teléfono</button></div>`:''}
    <label class="field"><span class="small muted">Mensaje</span><textarea class="input" id="waMsg" rows="3">${esc(msg)}</textarea></label>
    ${share?`<div class="send-step"><b>Desde este dispositivo</b><p class="small muted">Se abre el menú para compartir con el PDF ya adjunto. Elegí WhatsApp y después a ${esc(p?.nombre||'la persona')}.</p>
      <button class="btn primary" data-a="fac-share">Compartir PDF por WhatsApp</button></div>`:''}
    ${num?`<div class="send-step"><b>${share?'Otra opción: abrir el chat y adjuntar el PDF':'Abrir el chat y adjuntar el PDF'}</b>
      <ol class="small"><li><button class="btn sm" data-a="fac-pdf" data-id="${esc(id)}">Descargar el PDF</button></li>
      <li><a class="btn sm wa" id="waOpen" href="${esc(wa)}" target="_blank" rel="noopener" data-a="fac-wa">Abrir el chat con ${esc(p?.nombre||'la persona')}</a></li>
      <li>En el chat, adjuntá el PDF descargado (en la computadora, podés arrastrarlo) y enviá.</li></ol></div>`:''}
  </div>
  <div class="dlg-foot"><span class="small muted">${f.enviadaEl?`Marcada como enviada el ${fmtShort(f.enviadaEl)}.`:''}</span><div class="btn-group">
    ${f.enviadaEl?'<button class="btn" data-a="fac-unsent">Quitar marca de enviada</button>':'<button class="btn" data-a="fac-sent">Marcar como enviada</button>'}<button class="btn primary" data-a="dlg-close">Listo</button></div></div>`);
}
async function marcarEnviada(id,fecha){
  const f=facturaPorId(id);if(!f)return;
  if(Store.fb){f.enviadaEl=fecha||null;await FB.fns.setDoc(FB.facturaRef(f.id),{enviadaEl:fecha||null},{merge:true}).catch(()=>toast('No se pudo guardar la marca.'))}
  else{S.facturasSim=(S.facturasSim||[]).map(x=>(x.id||x.clave)===id?{...x,enviadaEl:fecha||null}:x);Store.save('facturasSim',{items:S.facturasSim})}
}
async function facShare(){
  const id=S.facSend?.id;const f=facturaPorId(id);if(!f)return;
  try{
    const doc=await facturaPDF({...f,firma:S.firma});
    const file=new File([doc.output('blob')],nombrePDF(f),{type:'application/pdf'});
    await navigator.share({files:[file],text:document.getElementById('waMsg')?.value||msgFactura(f)});
    await marcarEnviada(id,TODAY);closeDlg();render();toast('Factura compartida y marcada como enviada');
  }catch(e){if(e?.name!=='AbortError')toast('No se pudo abrir el menú para compartir. Usá la otra opción.')}
}
function facturaPorId(id){return facturasActivas().find(f=>(f.id||f.clave)===id)||(S.facturas||[]).find(f=>f.id===id)}
/* Configuración: datos del emisor */
function emisorPanel(){
  const E=emisorCfg();
  const F2=(k,l,ph='',type='text')=>`<div class="field"><label for="em_${k}">${l}</label><input class="input" id="em_${k}" type="${type}" data-c="emisor" data-k="${k}" value="${esc(E[k]||'')}" placeholder="${esc(ph)}"></div>`;
  return `<section class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Datos del emisor (para las facturas)</h2>
    <p class="small muted" style="margin-top:3px">Aparecen en todas las facturas. El CUIT se toma del certificado de ARCA.</p></div>
    <div class="btn-group"><button class="btn" data-a="fac-ejemplo">Ver factura de ejemplo</button><button class="btn" data-a="fac-ejemplo" data-t="15">Ver recibo de ejemplo</button></div></div>
    <div class="panel-body"><div class="form">
      ${F2('nombreFantasia','Nombre que encabeza la factura','Ej.: Licenciada Apellido, Nombre')}
      ${F2('razonSocial','Razón social','Como figura en ARCA')}
      ${F2('domicilio','Domicilio comercial','Calle, número, piso, departamento, localidad').replace('<div class="field">','<div class="field full">')}
      ${F2('condIva','Condición frente al IVA')}
      ${F2('iibb','Ingresos brutos','Ej.: EXENTO')}
      ${F2('inicioAct','Fecha de inicio de actividades','','date')}
      ${F2('profesional','Firma en el texto de cada sesión','Ej.: Lic. Nombre Apellido')}
      ${F2('leyendaPie','Leyenda al pie (opcional)','Ej.: Lic. Nombre Apellido')}
      <div class="field full"><label for="em_conceptoRecibo">Concepto del Recibo C</label><input class="input" id="em_conceptoRecibo" data-c="emisor" data-k="conceptoRecibo" value="${esc(E.conceptoRecibo||CONCEPTO_RECIBO_DEF)}"></div>
      <div class="field full"><label for="em_plantilla">Texto de cada sesión (Factura C)</label><textarea class="input" id="em_plantilla" data-c="emisor" data-k="plantilla" rows="3">${esc(E.plantilla||PLANTILLA_DEF)}</textarea>
        <p class="hint">Palabras que se reemplazan solas: {paciente}, {prepaga}, {afiliado}, {fecha}, {profesional}. Lo que va entre corchetes [ ] aparece solo si el paciente tiene prepaga y número de afiliado.</p></div>
      <div class="field full"><label for="em_msgFactura">Mensaje para enviar el comprobante por WhatsApp</label><textarea class="input" id="em_msgFactura" data-c="emisor" data-k="msgFactura" rows="2">${esc(E.msgFactura||MSG_FAC_DEF)}</textarea>
        <p class="hint">Palabras que se reemplazan solas: {nombre} (nombre del paciente), {mes}, {comprobante} ("la factura" o "el recibo") y {numero}.</p></div>
      <div class="field full"><label>Firma y sello</label>
        <div class="firma-box">${S.firma?`<img src="${esc(S.firma)}" alt="Firma cargada">`:'<span class="muted small">Todavía no cargaste tu firma.</span>'}</div>
        <div class="btn-group" style="margin-top:8px"><label class="btn">${S.firma?'Cambiar imagen':'Subir imagen de la firma'}<input type="file" accept="image/png,image/jpeg" data-c="firma" hidden></label>${S.firma?'<button class="btn danger" data-a="firma-del">Quitar</button>':''}</div>
        <p class="hint">Ideal: una foto o escaneo de tu firma y sello sobre papel blanco, o un PNG con fondo transparente.</p></div>
    </div></div></section>`;
}
async function cargarFirma(file){
  if(!file)return;
  try{
    const url=URL.createObjectURL(file);
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});
    const k=Math.min(1,600/img.naturalWidth,300/img.naturalHeight);
    const c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);
    const x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
    // Fondo blanco a transparente (para fotos de la firma sobre papel)
    const d=x.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4){const v=(d.data[i]+d.data[i+1]+d.data[i+2])/3;if(v>215)d.data[i+3]=0;else if(v>170)d.data[i+3]=Math.round(255*(215-v)/45)}
    x.putImageData(d,0,0);
    S.firma=c.toDataURL('image/png');Store.save('firma',{data:S.firma});render();toast('Firma cargada');
  }catch(e){toast('No se pudo leer la imagen. Probá con un PNG o JPG.')}
}
function facturaEjemplo(tipo){
  const E=emisorCfg();const REC=tipo===15;
  const base={simulada:true,entorno:'sim',emisor:E,ptoVta:Number(facCfg().ptoVta)||2,numero:1,fecha:aaaammdd(TODAY),vtoPago:aaaammdd(TODAY),cuitEmisor:'20123456786',
    receptor:'PACIENTE DE EJEMPLO',docTipo:96,docNro:'30111222',condVenta:'Transferencia bancaria',servDesde:aaaammdd(addDays(TODAY,-21)),servHasta:aaaammdd(TODAY),
    detalle:[-21,-14,-7,0].map(n=>({texto:textoLinea({fecha:addDays(TODAY,n)},{nombre:'Paciente',apellido:'de Ejemplo',prepaga:'Prepaga',afiliado:'0000000000'}),importe:50000})),
    importe:200000,cae:'00000000000000',caeVence:aaaammdd(addDays(TODAY,10)),firma:S.firma,tipo:REC?15:11};
  if(REC) base.detalle=[{texto:E.conceptoRecibo||CONCEPTO_RECIBO_DEF,importe:200000}];
  return base;
}

function feriadosPanel(){
  const g=S.config.general;const y=S.ferYear||Number(TODAY.slice(0,4));
  const lista=[];
  for(const [fecha,[nombre,tipo]] of Object.entries(FERIADOS_AR)) if(fecha.startsWith(y+'-')) lista.push({fecha,nombre,tipo,quitado:(g.feriadosQuitados||[]).includes(fecha)});
  for(const f of (g.feriadosExtra||[])) if(f.fecha.startsWith(y+'-')) lista.push({...f,propio:true});
  lista.sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const hayOficial=Object.keys(FERIADOS_AR).some(f=>f.startsWith(y+'-'));
  const modo=g.feriadosAuto||'nacionales';
  return `<section class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Feriados</h2>
    <p class="small muted" style="margin-top:3px">Calendario oficial de Argentina. Podés agregar feriados provinciales o municipales, o quitar los que no apliquen a tu consultorio.</p></div>
    <div class="btn-group"><button class="btn icon" data-a="fer-year" data-n="-1" aria-label="Año anterior">‹</button><span class="fer-year">${y}</span><button class="btn icon" data-a="fer-year" data-n="1" aria-label="Año siguiente">›</button></div></div>
    <div class="panel-body"><div class="field" style="max-width:520px"><label for="ferAuto">Sesiones que caen en un feriado</label>
      <select class="select" id="ferAuto" data-c="gen" data-k="feriadosAuto">
        <option value="nacionales"${modo==='nacionales'?' selected':''}>Marcar como "Feriado" en feriados nacionales; en no laborables, solo avisar</option>
        <option value="todos"${modo==='todos'?' selected':''}>Marcar como "Feriado" en feriados y en no laborables</option>
        <option value="ninguno"${modo==='ninguno'?' selected':''}>Solo avisar: decido yo en cada caso</option>
      </select><p class="hint">Las sesiones marcadas como "Feriado" no se cobran ni quedan para registrar. Si atendés ese día, cambiale el estado a "Realizada".</p></div></div>
    ${!hayOficial?`<p class="panel-body muted" style="padding-top:0">El calendario oficial de ${y} todavía no está cargado en la app. Cuando el Gobierno lo publique, pedile a Claude que lo agregue. Mientras tanto, podés sumar feriados abajo.</p>`:''}
    ${lista.length?`<div class="scroll"><table data-sort="feriados"><thead><tr><th>Fecha</th><th>Motivo</th><th>Tipo</th><th data-nosort></th></tr></thead><tbody>
      ${lista.map(f=>`<tr class="${f.quitado?'fer-off':''}"><td data-v="${f.fecha}">${DIAS_C[dow(f.fecha)-1]} ${fmtShort(f.fecha)}</td><td>${esc(f.nombre)}${f.propio?' <span class="chip sm">Agregado</span>':''}</td><td>${FER_TIPOS[f.tipo]||''}</td>
      <td class="num">${f.propio?`<button class="btn danger sm" data-a="fer-del" data-f="${f.fecha}">Eliminar</button>`:f.quitado?`<button class="btn sm" data-a="fer-back" data-f="${f.fecha}">Volver a incluir</button>`:`<button class="btn ghost sm" data-a="fer-off" data-f="${f.fecha}">Quitar</button>`}</td></tr>`).join('')}
    </tbody></table></div>`:''}
    <div class="panel-body"><div class="toolbar"><input class="input" type="date" id="ferFecha" aria-label="Fecha del feriado"><input class="input" id="ferNombre" placeholder="Motivo, por ejemplo: feriado provincial" style="flex:1;min-width:200px" aria-label="Motivo">
      <select class="select" id="ferTipo" aria-label="Tipo"><option value="feriado">Feriado</option><option value="turistico">No laborable</option></select><button class="btn" data-a="fer-add">Agregar</button></div></div></section>`;
}

function sessionsInRange(from,to){
  const out=new Map();
  for(const m of monthsBetween(from,to)){
    const doc=S.ses['ses-'+m]; if(!doc) continue;
    for(const s of Object.values(doc.items||{})) if(s.fecha>=from&&s.fecha<=to&&pidVivo(s.pid)) out.set(s.id,s);
  }
  for(let d=from;d<=to;d=addDays(d,1)){
    const wd=dow(d);
    for(const p of S.patients){
      if(p.eliminado) continue;
      if(d>=TODAY&&!item('estadosPaciente',p.estado)?.agenda) continue;
      for(const h of (p.horarios||[])){
        if(Number(h.dia)!==wd||!h.hora) continue;
        if(h.desde&&d<h.desde) continue;
        if(h.hasta&&d>h.hasta) continue;
        const sem=Math.max(1,Number(item('frecuencias',h.frecuencia)?.semanas||1));
        const diff=Math.round(daysBetween(mondayOf(h.ancla||h.desde||d),mondayOf(d))/7);
        if(((diff%sem)+sem)%sem!==0) continue;
        const id=`${p.id}_${d}_${h.hora.replace(':','')}`;
        if(!out.has(id)) out.set(id,{id,pid:p.id,fecha:d,hora:h.hora,dur:Number(h.duracion||defDur()),estado:(feriadoAuto(d)&&item('estadosSesion','feriado'))?'feriado':'programada',pago:'pendiente',virtual:true});
      }
    }
  }
  return [...out.values()].filter(s=>!s.oculta).sort((a,b)=>(a.fecha+(a.hora||'')).localeCompare(b.fecha+(b.hora||'')));
}
function saveSession(s){
  const p=pat(s.pid);const c={...s};delete c.virtual;delete c.isNew;
  if(c.monto==null||c.monto==='') c.monto=Number(p?.honorario||0);
  if(c.porc==null) c.porc=Number(instOf(p)?.porcentaje||0);
  if(!c.medio) c.medio=p?.medioPago||'';
  if(!c.dur) c.dur=defDur();
  {const old=findSession(c.id);
   if(cobraOf(c)){if(!c.registradoEl||!old||!cobraOf(old))c.registradoEl=(old&&cobraOf(old)&&old.registradoEl)||TODAY}
   else delete c.registradoEl;
   const cob=x=>item('estadosPago',x?.pago)?.tipo==='cobrado';
   if(cob(c)){if(!c.pagadoEl)c.pagadoEl=(old&&cob(old)&&old.pagadoEl)||TODAY}
   else delete c.pagadoEl;}
  const k='ses-'+monthKey(c.fecha);
  const doc=S.ses[k]||(S.ses[k]={items:{}});doc.items=doc.items||{};doc.items[c.id]=c;
  Store.save(k,doc);
  return c;
}
function deleteSession(s){
  const k='ses-'+monthKey(s.fecha);const doc=S.ses[k];
  if(doc?.items?.[s.id]){delete doc.items[s.id];Store.save(k,doc)}
}
function moveSession(s,fecha,hora){
  if(s.extra){ if(monthKey(s.fecha)!==monthKey(fecha)) deleteSession(s); return saveSession({...s,fecha,hora}); }
  saveSession({...s,estado:item('estadosSesion','reprogramada')?'reprogramada':s.estado,nota:`${s.nota||''} Pasó al ${fmtShort(fecha)} ${hora}.`.trim()});
  return saveSession({id:'x_'+uid(),pid:s.pid,fecha,hora,dur:durOf(s),estado:'programada',pago:'pendiente',extra:true,monto:s.monto??null,nota:`Reprogramada del ${fmtShort(s.fecha)}.`});
}
function markDone(s){return saveSession({...s,estado:realizadaId(),pago:firstCobrado()})}
function stats(arr){
  const r={realizadas:0,total:arr.length,cobrado:0,pendiente:0,inst:0,sinMarcar:0,canceladas:0};
  for(const s of arr){
    const e=item('estadosSesion',s.estado),pg=item('estadosPago',s.pago),m=montoOf(s);
    if(modeOf(e)==='si') r.realizadas++; else if(s.estado!=='programada') r.canceladas++;
    if(s.estado==='programada'&&isPast(s)) r.sinMarcar++;
    if(pg?.tipo==='cobrado'){r.cobrado+=m;r.inst+=m*porcOf(s)/100}
    else if(pg?.tipo!=='sin_cargo'&&cobraOf(s)) r.pendiente+=m;
  }
  return r;
}
const gastosMes=m=>S.gastos.filter(g=>monthKey(g.fecha||'')===m);
const unmarkedList=()=>sessionsInRange(addDays(TODAY,-90),TODAY).filter(s=>s.estado==='programada'&&isPast(s));
function debtList(){
  const arr=[];for(const d of Object.values(S.ses)) for(const s of Object.values(d.items||{})){
    if(s.oculta||!pidVivo(s.pid)) continue;
    if(cobraOf(s)&&item('estadosPago',s.pago)?.tipo==='pendiente') arr.push(s);
  }
  return arr.sort((a,b)=>(a.fecha+(a.hora||'')).localeCompare(b.fecha+(b.hora||'')));
}

/* ============ Render ============ */
const ICONS={
  agenda:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  pendientes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l2.5 2.5L16 9"/><rect x="3.5" y="3.5" width="17" height="17" rx="3"/></svg>',
  semanas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V11M9.5 20V6M15 20v-7M20.5 20V9"/></svg>',
  facturas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  caja:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M15 10v10"/></svg>',
  pacientes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c1.9.6 3 2.4 3.5 5.5"/></svg>',
  gastos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M17 7.5c-.6-1.6-2.4-2.5-5-2.5-2.8 0-4.5 1.3-4.5 3.2 0 4.6 10 2.2 10 7 0 2-1.9 3.3-5 3.3-2.7 0-4.7-1-5.5-2.8"/></svg>',
  config:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>'
};
const VIEWS=[['agenda','Agenda'],['semanas','Semanas'],['caja','Caja'],['facturas','Facturas'],['pacientes','Pacientes'],['gastos','Gastos'],['config','Configuración']];
function renderNav(){
  const prof=S.config?.general?.profesional;const n=unmarkedList().length+debtList().length;
  document.getElementById('nav').innerHTML=`
    <div class="brand"><strong>Consultorio Psiconflor</strong><span>${esc(prof||'Organizador de pacientes')}</span></div>
    ${VIEWS.map(([v,l])=>`<button data-a="nav" data-v="${v}" ${S.view===v?'aria-current="page"':''}>${ICONS[v]}<span>${l}</span>${v==='agenda'&&n?`<em class="badge" aria-label="${n} pendientes">${n}</em>`:''}</button>`).join('')}
    <div class="foot">${Store.fb?`<span id="sync" class="sync ok">Todo sincronizado</span><span class="who">${esc(Store.email||'')}</span>`:Store.mode==='db'?'Datos guardados en tu cuenta, visibles solo para vos.':'Datos guardados solo en este navegador.'}</div>`;
  syncState();
}
function applyLook(){
  const g=S.config?.general||{};const r=document.documentElement;
  r.dataset.palette=g.paleta||'rosa-salvia';r.dataset.font=g.fuente||'serena';
  if(g.textura!==false) r.dataset.textura='papel'; else delete r.dataset.textura;
}
/* ---- Orden de columnas ---- */
S.sort={};
function cellVal(td){
  if(!td) return null;
  const dv=td.dataset.v;
  if(dv!=null){const n=Number(dv);return isNaN(n)||/^\d{4}-/.test(dv)?dv:n}
  const t=td.textContent.replace(/\s+/g,' ').trim();
  if(!t||t==='—') return null;
  const m=t.replace(/\s/g,'').match(/^([−-])?\$?([\d.]+)(?:,(\d+))?(%|días)?/);
  if(m&&/^[−-]?\$?\d/.test(t.replace(/\s/g,''))){const n=Number(m[2].replace(/\./g,'')+(m[3]?'.'+m[3]:''));return m[1]?-n:n}
  return t.toLowerCase();
}
function applySorts(){
  document.querySelectorAll('#main table[data-sort]').forEach(t=>{
    const key=t.dataset.sort;const head=t.tHead?.rows[0];if(!head)return;
    const st=S.sort[key];
    [...head.cells].forEach((th,i)=>{
      if(th.hasAttribute('data-nosort')||!th.textContent.trim())return;
      const dir=st&&st.i===i?st.dir:0;
      th.setAttribute('aria-sort',dir===1?'ascending':dir===-1?'descending':'none');
      th.innerHTML=`<button class="thsort" data-a="sort" data-t="${key}" data-i="${i}" title="Ordenar">${th.innerHTML}<span class="arr" aria-hidden="true">${dir===1?'▲':dir===-1?'▼':'↕'}</span></button>`;
    });
    if(!st)return;
    const tb=t.tBodies[0];if(!tb)return;
    const rows=[...tb.rows];if(rows.length<2)return;
    rows.sort((a,b)=>{
      const x=cellVal(a.cells[st.i]),y=cellVal(b.cells[st.i]);
      if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;
      return (typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),'es',{numeric:true}))*st.dir;
    });
    rows.forEach(r=>tb.appendChild(r));
  });
}
function render(){
  if(!S.ready) return;
  applyLook();
  flushNotes();
  renderNav();
  const m=document.getElementById('main');
  S.visible={};
  m.innerHTML=({agenda:viewAgenda,facturas:viewFacturas,semanas:viewSemanas,caja:viewCaja,pacientes:viewPacientes,gastos:viewGastos,config:viewConfig}[S.view])();
  if(S.view==='agenda'&&S.ag!=='mes') scrollCalToNow();
  applySorts();
}

/* ---- Agenda ---- */
const PX=1.1, PXD=3.5;
function agRange(){
  if(S.ag==='dia') return [S.cursor,S.cursor];
  if(S.ag==='semana'){const f=mondayOf(S.cursor);return [f,addDays(f,6)]}
  const m=monthKey(S.cursor);return [m+'-01',lastOfMonth(m)];
}
function agTitle(from,to){
  if(S.ag==='dia') return cap(fmtLong(from));
  if(S.ag==='mes') return `${cap(MESES[parse(from).getMonth()])} ${parse(from).getFullYear()}`;
  const a=parse(from),b=parse(to);
  if(a.getMonth()===b.getMonth()) return `${a.getDate()} al ${b.getDate()} de ${MESES[a.getMonth()]} de ${b.getFullYear()}`;
  return `${a.getDate()} de ${MESES[a.getMonth()]} al ${b.getDate()} de ${MESES[b.getMonth()]} de ${b.getFullYear()}`;
}
function viewAgenda(){
  const [from,to]=agRange();
  const all=sessionsInRange(from,to);const st=stats(all);
  const um=unmarkedList(),debts=debtList();
  const pendCount=um.length+debts.length;
  const panelOpen=S.config.general.panel??(window.innerWidth>=760);
  let body='';
  if(S.ag==='mes') body=monthGrid(from,to,all);
  else{
    let dates=[];
    if(S.ag==='dia') dates=[from];
    else{const n=(S.config.general.finDeSemana||all.some(s=>dow(s.fecha)>=6))?7:5;for(let i=0;i<n;i++)dates.push(addDays(from,i))}
    body=timeGrid(dates,all,S.ag==='dia');
  }
  const seg=[['dia','Día'],['semana','Semana'],['mes','Mes']].map(([v,l])=>`<button data-a="ag-view" data-v="${v}" aria-pressed="${S.ag===v}">${l}</button>`).join('');
  const lbl={dia:'este día',semana:'esta semana',mes:'este mes'}[S.ag];
  const hint={dia:'Elegí el estado y escribí la nota directamente en cada sesión. Tocá un espacio libre para agregar una.',
    semana:'Tocá una sesión para elegir su estado, registrar el pago o agregar una nota. Tocá un espacio libre para agregar una sesión. En computadora, podés arrastrarla para reprogramarla.',
    mes:'Tocá una sesión para elegir su estado y agregar una nota, o tocá el número de un día para verlo en detalle.'}[S.ag];
  return `<div class="view-head"><div><h1>${agTitle(from,to)}</h1><p class="sub">${st.total} ${st.total===1?'sesión':'sesiones'} ${lbl}, ${st.realizadas} realizadas, ${money(st.cobrado)} cobrado${st.pendiente?`, ${money(st.pendiente)} pendiente`:''}</p></div>
    <div class="btn-group"><div class="seg" role="group" aria-label="Vista">${seg}</div>
    <button class="btn icon" data-a="ag-nav" data-n="-1" aria-label="Anterior">‹</button><button class="btn" data-a="ag-nav" data-n="0">Hoy</button><button class="btn icon" data-a="ag-nav" data-n="1" aria-label="Siguiente">›</button>
    <button class="btn${panelOpen?' on':''}" data-a="panel-toggle" aria-expanded="${panelOpen}">Pendientes${pendCount?` <em class="count">${pendCount}</em>`:''}</button></div></div>
    ${(()=>{const o=overdueList();return o.length?`<div class="notice warn">${ICONS.info}<p style="flex:1">${o.length===1?'Hay 1 pago pendiente':`Hay ${o.length} pagos pendientes`} hace más de ${alertaDias()} días.</p><button class="btn sm" data-a="alerta-open">Ver</button></div>`:''})()}
    ${pinSuggest()}
    ${downloadNotice()}
    ${S.patients.length?'':`<div class="notice">${ICONS.info}<p>Todavía no cargaste pacientes. Creá uno en Pacientes con su horario y la agenda se completa sola.</p></div>`}
    <div class="ag-layout${panelOpen?' with-panel':''}">
      <div class="ag-main">${body}<p class="hint" style="margin-top:10px">${hint}</p></div>
      ${panelOpen?`<aside class="ag-side" aria-label="Pendientes">${sidePanel(um,debts)}</aside>`:''}
    </div>`;
}
function regEstado(s,val){
  const [estado,cb]=String(val).split('|');
  const saved=saveSession({...s,estado,...(cb!=null?{cobrar:cb==='1'}:{})});const e=item('estadosSesion',estado);
  render();
  if(cobraOf(saved)&&item('estadosPago',saved.pago)?.tipo==='pendiente'){
    toast(`Registrada como ${e.nombre}${modeOf(e)==='opcional'?' (se cobra)':''}. El pago quedó en "Pendientes de pago".`);
    const d=document.querySelector(`.debt-line[data-id="${CSS.escape(saved.id)}"]`);
    if(d){d.scrollIntoView({block:'nearest'});d.classList.add('flash');setTimeout(()=>d.classList.remove('flash'),1800)}
  } else toast(`Registrada como ${e?.nombre||''}`);
}
function estadoOpts(s){
  if(s.estado==='programada'&&isPast(s)) return `<option value="programada" selected>¿Qué pasó? Elegí el estado…</option>`+list('estadosSesion').filter(i=>i.id!=='programada').map(i=>`<option value="${esc(i.id)}">${esc(i.nombre)}</option>`).join('');
  return options('estadosSesion',s.estado);
}
function payApplies(s){return s.estado==='programada'||cobraOf(s)}
function payToggle(s){
  if(s.estado==='programada'&&isPast(s)) return '<span class="no-pay">Se registra después de elegir el estado de la sesión</span>';
  if(modeOf(item('estadosSesion',s.estado))==='opcional'){
    const ct=`<div class="paytg" role="group" aria-label="¿Se cobra?"><button data-a="set-cobrar" data-id="${esc(s.id)}" data-v="0" aria-pressed="${!s.cobrar}">No se cobra</button><button class="is-pend" data-a="set-cobrar" data-id="${esc(s.id)}" data-v="1" aria-pressed="${!!s.cobrar}">Se cobra</button></div>`;
    if(!s.cobrar) return ct;
    return `<div class="stack">${ct}${payButtons(s)}</div>`;
  }
  if(!payApplies(s)) return '<span class="no-pay">No corresponde cobro</span>';
  return payButtons(s);
}
function payButtons(s){
  const pend=list('estadosPago').find(x=>x.tipo==='pendiente');const cob=list('estadosPago').find(x=>x.tipo==='cobrado');
  const opts=[pend,cob].filter(Boolean);const cur=item('estadosPago',s.pago);
  if(cur&&!opts.includes(cur)) opts.push(cur);
  return `<div class="paytg" role="group" aria-label="Pago">${opts.map(o=>`<button class="${o.tipo==='cobrado'?'is-ok':o.tipo==='pendiente'?'is-pend':''}" data-a="set-pago" data-id="${esc(s.id)}" data-v="${esc(o.id)}" aria-pressed="${o.id===s.pago}">${esc(o.nombre)}</button>`).join('')}</div>`;
}
function sidePanel(um,debts){
  const otros=list('estadosSesion').filter(e=>e.id!=='programada');
  const rows=[...um].sort((a,b)=>(b.fecha+(b.hora||'')).localeCompare(a.fecha+(a.hora||'')));
  const umRows=rows.map(s=>{S.visible[s.id]=s;const p=pat(s.pid);
    return `<div class="side-row"><div class="side-top"><button class="side-date" data-a="goto-ses" data-id="${esc(s.id)}" title="Ver en el calendario">${DIAS_C[dow(s.fecha)-1]} ${fmtShort(s.fecha)}, ${esc(s.hora||'')}</button><b>${esc(fullName(p)||'Paciente eliminado')}</b></div>
      <select class="select sm reg" data-c="reg-estado" data-id="${esc(s.id)}" aria-label="Estado de la sesión de ${esc(fullName(p)||'')} del ${fmtShort(s.fecha)}"><option value="">¿Qué pasó? Elegí el estado…</option>${otros.map(o=>modeOf(o)==='opcional'?`<option value="${esc(o.id)}|0">${esc(o.nombre)} (no se cobra)</option><option value="${esc(o.id)}|1">${esc(o.nombre)} (se cobra)</option>`:`<option value="${esc(o.id)}">${esc(o.nombre)}</option>`).join('')}</select></div>`;
  }).join('');
  const byP={};for(const s of debts)(byP[s.pid]=byP[s.pid]||[]).push(s);
  const debtRows=Object.entries(byP).sort((a,b)=>sortName(pat(a[0])).localeCompare(sortName(pat(b[0])))).map(([pid,ss])=>{
    const p=pat(pid);const tot=ss.reduce((a,s)=>a+montoOf(s),0);
    return `<div class="side-row"><div class="side-top"><b>${esc(fullName(p)||'Paciente eliminado')}</b><span class="side-amt">${money(tot)}</span></div>
      <div class="debt-lines">${ss.map(s=>{S.visible[s.id]=s;return `<div class="debt-line" data-id="${esc(s.id)}"><button class="side-date" data-a="goto-ses" data-id="${esc(s.id)}" title="Ver en el calendario">${DIAS_C[dow(s.fecha)-1]} ${fmtShort(s.fecha)}, ${esc(s.hora||'')}</button>${diasPend(s)>=alertaDias()?`<span class="late" title="Pendiente desde el ${fmtShort(pendDesde(s))}">${diasPend(s)} días</span>`:''}<span class="small">${money(montoOf(s))}</span><button class="btn sm" data-a="ses-pay" data-id="${esc(s.id)}">Pagado</button></div>`}).join('')}</div>
      ${ss.length>1?`<button class="btn sm" data-a="pay-all" data-pid="${esc(pid)}">Marcar las ${ss.length} como pagadas</button>`:''}</div>`}).join('');
  return `<section class="side-sec"><div class="side-head"><h2>Para registrar</h2><span class="muted small">${rows.length||''}</span></div>
      <p class="side-desc">Sesiones que ya pasaron y todavía no tienen estado. Al elegirlo, la sesión sale de esta lista.</p>
      ${umRows||'<p class="side-empty">Estás al día: todas las sesiones pasadas están registradas.</p>'}
      ${um.length>1?`<div class="side-foot"><button class="btn sm" data-a="all-done">Registrar las ${um.length} como realizadas</button></div>`:''}</section>
    <section class="side-sec"><div class="side-head"><h2>Pendientes de pago</h2><span class="muted small">${debts.length?money(debts.reduce((a,s)=>a+montoOf(s),0)):''}</span></div>
      <p class="side-desc">Sesiones que se cobran y todavía no pagaron. Al marcarlas como pagadas, salen de esta lista.</p>
      ${debtRows||'<p class="side-empty">Nadie te debe sesiones.</p>'}
</section>
    ${um.length||debts.length?'<p class="side-empty side-tip">Tocá una fecha para ver esa sesión en el calendario.</p>':''}`;
}
function gridBounds(all){
  const g=S.config.general;let ini=Number(g.inicio??8),fin=Number(g.fin??21);
  for(const s of all){const m=toMin(s.hora);if(m==null)continue;ini=Math.min(ini,Math.floor(m/60));fin=Math.max(fin,Math.ceil((m+durOf(s))/60))}
  return [ini,Math.max(fin,ini+1)];
}
function layoutDay(ss,ini){
  const items=ss.map(s=>{const st=toMin(s.hora)??ini*60;return{s,st,en:st+durOf(s)}}).sort((a,b)=>a.st-b.st);
  const out=[];let cl=[],clEnd=-1;
  const flush=()=>{const lanes=[];for(const it of cl){let l=lanes.findIndex(e=>e<=it.st);if(l<0){l=lanes.length;lanes.push(0)}lanes[l]=it.en;it.lane=l}cl.forEach(it=>it.lanes=lanes.length);out.push(...cl);cl=[];clEnd=-1};
  for(const it of items){if(cl.length&&it.st>=clEnd)flush();cl.push(it);clEnd=Math.max(clEnd,it.en)}
  if(cl.length)flush();return out;
}
function blk(it,ini,detail,px){
  const s=it.s;S.visible[s.id]=s;
  const p=pat(s.pid),e=item('estadosSesion',s.estado),pg=item('estadosPago',s.pago);
  const unmarked=s.estado==='programada'&&isPast(s);
  const off=modeOf(e)!=='si'&&s.estado!=='programada';
  const paid=pg?.tipo==='cobrado',debe=cobraOf(s)&&pg?.tipo==='pendiente';
  const top=(it.st-ini*60)*px, h=Math.max(durOf(s)*px,detail?170:26)-2;
  const w=100/it.lanes;
  const canDone=s.estado==='programada'&&(isPast(s)||s.fecha===TODAY);
  const estTag=unmarked?'<span class="tag">Sin registrar</span>':s.estado!=='programada'?`<span class="tag est" style="--c:${esc(colorOf('estadosSesion',s.estado))}">${esc(e?.nombre||'')}</span>`:'';
  const payTag=paid?'<span class="tag ok">Pagado</span>':debe?'<span class="tag debe">Debe</span>':'';
  const tag=detail?estTag:(payTag||estTag);
  const note=s.nota?`<span class="tag note" title="${esc(s.nota)}">Nota</span>`:'';
  const pgCls=paid?'pago-cobrado':debe?'pago-pendiente':'';
  const inner=detail?`
    <div class="bl1"><span class="bt">${esc(s.hora||'')}</span><span class="bn inline">${esc(fullName(p)||'Paciente eliminado')}</span>${tag}<span class="bd">${esc(instOf(p)?.nombre||'')}${instOf(p)?', ':''}${money(montoOf(s))}</span></div>
    <div class="bctl">
      <div class="dual-row"><span class="dual-lbl">Sesión</span><select class="select sm" aria-label="Estado de la sesión" data-c="ses-field" data-f="estado" data-id="${esc(s.id)}">${estadoOpts(s)}</select></div>
      <div class="dual-row"><span class="dual-lbl">Pago</span>${payToggle(s)}</div>
    </div>
    <textarea class="input note-in" rows="1" placeholder="Nota" aria-label="Nota de la sesión" data-note="${esc(s.id)}">${esc(s.nota||'')}</textarea>`
  :`<div class="bl1"><span class="bt">${esc(s.hora||'')}</span>${tag}${note}</div>
    <div class="bn two">${nameBlock(p)}</div>
`;
  return `<div class="blk${detail?' detail':''}${unmarked?' unmarked':''}${off?' off':''}" ${detail?'':'role="button" tabindex="0" data-a="open-ses"'} data-id="${esc(s.id)}"
    style="--c:${esc(colorOf('estadosSesion',s.estado))};top:${top}px;height:${h}px;left:calc(${it.lane*w}% + 2px);width:calc(${w}% - 4px)"
    title="${detail?'':esc(`${s.hora||''} ${fullName(p)||''}: ${e?.nombre||''}, ${pg?.nombre||''}${s.nota?'. Nota: '+s.nota:''}`)}">${inner}
    ${detail?`<button class="blk-more" data-a="open-ses" data-id="${esc(s.id)}" aria-label="Más opciones de la sesión" title="Monto, reprogramar y más">⋯</button>`:''}
  </div>`;
}
function timeGrid(dates,all,detail){
  const px=detail?PXD:PX;
  const [ini,fin]=gridBounds(all);const H=(fin-ini)*60*px;const n=dates.length;
  const split=monthKey(dates[0])!==monthKey(dates[n-1]);
  const head=dates.map(d=>`<button class="ch${d===TODAY?' today':''}${feriadoDe(d)?' is-fer':''}" data-a="goto-day" data-d="${d}" aria-label="${fmtLong(d)}${feriadoDe(d)?', '+esc(feriadoDe(d).nombre):''}"><span class="chd"><span>${DIAS_C[dow(d)-1]}</span><b>${dayNum(d)}</b>${split||detail?`<small>${MESES_C[parse(d).getMonth()]}</small>`:''}</span>${ferTag(d,!detail)}</button>`).join('');
  let gut='';for(let h=ini+1;h<fin;h++) gut+=`<span style="top:${(h-ini)*60*px}px">${pad(h)}:00</span>`;
  const cols=dates.map(d=>{
    const ss=all.filter(s=>s.fecha===d);
    let now='';if(d===TODAY){const m=toMin(nowHM());if(m>=ini*60&&m<=fin*60)now=`<div class="nowline" style="top:${(m-ini*60)*px}px"></div>`}
    return `<div class="tcol${d===TODAY?' today':''}${feriadoDe(d)?' fer-col':''}" data-a="grid-add" data-d="${d}" data-ini="${ini}" data-px="${px}" style="height:${H}px;--hh:${60*px}px">${layoutDay(ss,ini).map(it=>blk(it,ini,detail,px)).join('')}${now}</div>`;
  }).join('');
  return `<div class="cal"><div class="cal-scroll${detail?' tall':''}" id="calScroll"><div class="cal-inner${detail?' single':''}" style="--n:${n}">
    <div class="cal-head"><div class="corner"></div>${head}</div>
    <div class="cal-body"><div class="gutter" style="height:${H}px">${gut}</div>${cols}</div></div></div></div>`;
}
function scrollCalToNow(){
  const el=document.getElementById('calScroll');if(!el)return;
  const now=el.querySelector('.nowline');
  const first=[...el.querySelectorAll('.blk')].sort((x,y)=>x.offsetTop-y.offsetTop)[0];
  const target=now?now.offsetTop-160:first?first.offsetTop-40:0;
  el.scrollTop=Math.max(0,target);
}
function monthGrid(from,to,all){
  const start=mondayOf(from);const m=monthKey(from);
  let h=DIAS_C.map(d=>`<div class="mh">${cap(d)}</div>`).join('');
  for(let d=start;d<=to||dow(d)!==1;d=addDays(d,1)){
    const ss=all.filter(s=>s.fecha===d);const out=monthKey(d)!==m;
    const items=ss.slice(0,4).map(s=>{S.visible[s.id]=s;const p=pat(s.pid);const pg=item('estadosPago',s.pago),e=item('estadosSesion',s.estado);
      const mark=pg?.tipo==='cobrado'?'<span class="mk ok" title="Pagada">$</span>':(cobraOf(s)&&pg?.tipo==='pendiente')?'<span class="mk debe" title="Debe">$</span>':'';
      return `<button class="mitem${modeOf(e)!=='si'&&s.estado!=='programada'?' off':''}${s.estado==='programada'&&isPast(s)?' um':''}" style="--c:${esc(colorOf('estadosSesion',s.estado))}" data-a="open-ses" data-id="${esc(s.id)}"><span class="dot"></span><span class="t">${esc(s.hora||'')}</span><span class="n">${esc(fullName(p)||'')}</span>${mark}</button>`}).join('');
    h+=`<div class="mc${out?' out':''}${d===TODAY?' today':''}${!out&&feriadoDe(d)?' fer-col':''}"><button class="mnum" data-a="goto-day" data-d="${d}" aria-label="${fmtLong(d)}">${dayNum(d)}</button>${out?'':ferTag(d,true)+items}${!out&&ss.length>4?`<button class="more" data-a="goto-day" data-d="${d}">${ss.length-4} más</button>`:''}</div>`;
    if(addDays(d,1)>to&&dow(d)===7) break;
  }
  return `<div class="month">${h}</div>`;
}

function focusSession(id){
  const el=document.querySelector(`.blk[data-id="${CSS.escape(id)}"], .mitem[data-id="${CSS.escape(id)}"]`);
  if(!el){toast('No se encontró la sesión en esta vista');return}
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});
  el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
  setTimeout(()=>el.classList.remove('flash'),reduce?0:1800);
  const s=S.visible[id];
  if(el.classList.contains('detail')){el.querySelector('select')?.focus({preventScroll:true})}
  else if(s&&window.innerWidth>=760) openPop(s,el);
  else el.focus?.({preventScroll:true});
}
/* ---- Ficha rápida de sesión (junto a la sesión) ---- */
const pop=()=>document.getElementById('pop');
function openPop(s,anchor){
  S.popId=s.id;S.popAnchor=anchor?anchor.getBoundingClientRect():null;
  renderPop();
}
function renderPop(){
  const s=S.visible[S.popId]||findSession(S.popId);if(!s){closePop();return}
  const p=pat(s.pid),e=item('estadosSesion',s.estado),pg=item('estadosPago',s.pago);
  const done=cobraOf(s)&&pg?.tipo==='cobrado';
  const el=pop();
  el.innerHTML=`<div class="pop-head"><div><b>${esc(fullName(p)||'Paciente eliminado')}</b><p class="muted small">${cap(fmtLong(s.fecha))}, ${esc(s.hora||'')}, ${money(montoOf(s))}</p></div>
      <button class="btn ghost icon" data-a="pop-close" aria-label="Cerrar">✕</button></div>
    <div class="pop-sec"><span class="dual-lbl">Sesión</span><select class="select" data-c="pop-field" data-f="estado">${estadoOpts(s)}</select></div>
    <div class="pop-sec"><span class="dual-lbl">Pago</span>${payToggle(s)}</div>
    ${sesCompRow(s)}
    <label class="field"><span>Nota</span><textarea class="input" rows="3" data-note="${esc(s.id)}" id="popNote" placeholder="Texto libre: avisó por WhatsApp, pagó con recargo, etc.">${esc(s.nota||'')}</textarea></label>
    <p class="save-state muted small" id="noteState">&nbsp;</p>
    <div class="pop-foot"><button class="btn ghost sm" data-a="pop-more">Monto, reprogramar y más</button></div>`;
  el.hidden=false;
  positionPop();
}
function positionPop(){
  const el=pop();const r=S.popAnchor;
  if(window.innerWidth<760||!r){el.classList.add('sheet');el.style.left='';el.style.top='';return}
  el.classList.remove('sheet');
  const w=el.offsetWidth,h=el.offsetHeight,m=10;
  let left=r.right+m;if(left+w>window.innerWidth-m) left=r.left-w-m;
  if(left<m) left=Math.max(m,Math.min(window.innerWidth-w-m,r.left));
  let top=Math.min(Math.max(m,r.top),window.innerHeight-h-m);
  el.style.left=left+'px';el.style.top=top+'px';
}
function closePop(){flushNotes();const el=pop();el.hidden=true;S.popId=null;}
function findSession(id){
  for(const d of Object.values(S.ses)) if(d.items?.[id]) return d.items[id];
  return null;
}
/* Notas: se guardan solas, una escritura por pausa */
const noteTimers={};
function queueNote(id,text){
  clearTimeout(noteTimers[id]);
  const st=document.getElementById('noteState');if(st)st.textContent='Guardando…';
  noteTimers[id]=setTimeout(()=>saveNote(id,text),700);
}
function saveNote(id,text){
  delete noteTimers[id];
  const s=S.visible[id]||findSession(id);if(!s)return;
  if((s.nota||'')===text) {const st=document.getElementById('noteState');if(st)st.textContent='Guardado';return}
  const saved=saveSession({...s,nota:text});S.visible[id]=saved;
  const st=document.getElementById('noteState');if(st)st.textContent='Guardado';
}
function flushNotes(){
  document.querySelectorAll('[data-note]').forEach(t=>{if(noteTimers[t.dataset.note]){clearTimeout(noteTimers[t.dataset.note]);saveNote(t.dataset.note,t.value.trim())}});
}

/* ---- Semanas (análisis semanal) ---- */
function weeksOfMonth(m){
  const first=m+'-01',last=lastOfMonth(m);const out=[];
  for(let d=mondayOf(first);d<=last;d=addDays(d,7)) out.push(d);
  return out;
}
function wkLabel(from){
  const to=addDays(from,6);const a=parse(from),b=parse(to);
  return a.getMonth()===b.getMonth()?`${a.getDate()} al ${b.getDate()} de ${MESES[b.getMonth()]}`:`${a.getDate()} de ${MESES_C[a.getMonth()]} al ${b.getDate()} de ${MESES_C[b.getMonth()]}`;
}
function wkStats(ss){
  const st=stats(ss);
  st.sinRegistrar=ss.filter(s=>s.estado==='programada'&&isPast(s)).length;
  st.futuras=ss.filter(s=>s.estado==='programada'&&!isPast(s)).length;
  st.registradas=ss.filter(s=>s.estado!=='programada').length;
  st.pct=st.registradas?Math.round(st.realizadas/st.registradas*100):null;
  const by={};for(const s of ss) if(s.estado!=='programada'&&modeOf(item('estadosSesion',s.estado))!=='si') by[s.estado]=(by[s.estado]||0)+1;
  st.motivos=by;
  return st;
}
function wkChart(rows){
  const W=720,H=170,pb=40,pt=18;const n=rows.length;const bw=W/n;
  const max=Math.max(1,...rows.map(r=>r.st.total));
  const y=v=>(v/max)*(H-pb-pt);
  let g='';
  rows.forEach((r,i)=>{
    const x=i*bw+bw*.25,w=bw*.5;let base=H-pb;
    const parts=[[r.st.realizadas,'var(--accent)'],[r.st.registradas-r.st.realizadas,'var(--warn)'],[r.st.sinRegistrar+r.st.futuras,'var(--line)']];
    let rects='';for(const [v,c] of parts){if(!v)continue;const hh=y(v);base-=hh;rects+=`<rect x="${x}" y="${base}" width="${w}" height="${hh}" fill="${c}" rx="2"/>`}
    const sel=r.from===S.wkSel;
    g+=`<g class="wkbar${sel?' sel':''}" data-a="wk-sel" data-d="${r.from}" role="button" tabindex="0" aria-label="Semana del ${wkLabel(r.from)}"><title>Semana del ${wkLabel(r.from)}: ${r.st.realizadas} realizadas de ${r.st.total}, ${money(r.st.cobrado)} cobrado</title>
      <rect x="${i*bw+2}" y="0" width="${bw-4}" height="${H}" fill="${sel?'var(--accent-soft)':'transparent'}" rx="8"/>${rects}
      <text x="${i*bw+bw/2}" y="${base-5}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)">${r.st.total||''}</text>
      <text x="${i*bw+bw/2}" y="${H-22}" text-anchor="middle" font-size="12" fill="var(--muted)">${dayNum(r.from)}/${parse(r.from).getMonth()+1}</text>
      <text x="${i*bw+bw/2}" y="${H-7}" text-anchor="middle" font-size="11" fill="var(--muted)">al ${dayNum(addDays(r.from,6))}/${parse(addDays(r.from,6)).getMonth()+1}</text></g>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sesiones por semana">${g}</svg>
    <div class="legend"><span><i class="dot" style="--c:var(--accent)"></i>Realizadas</span><span><i class="dot" style="--c:var(--warn)"></i>No realizadas</span><span><i class="dot" style="--c:var(--line)"></i>Sin registrar o futuras</span></div>`;
}
function wkCard(s){
  S.visible[s.id]=s;const p=pat(s.pid);const e=item('estadosSesion',s.estado);
  const unreg=s.estado==='programada'&&isPast(s);
  return `<article class="wcard${unreg?' unreg':''}${modeOf(e)!=='si'&&s.estado!=='programada'?' off':''}" style="--c:${esc(colorOf('estadosSesion',s.estado))}" data-id="${esc(s.id)}">
    <div class="wc-top"><span class="time">${esc(s.hora||'')}</span><div class="wc-name">${nameBlock(p)}</div>
      <button class="blk-more static" data-a="open-ses" data-id="${esc(s.id)}" aria-label="Más opciones" title="Monto, reprogramar y más">⋯</button></div>
    <div class="ses-meta">${esc(instOf(p)?.nombre||'')}${instOf(p)?', ':''}${money(montoOf(s))}</div>
    <div class="dual-row"><span class="dual-lbl">Sesión</span><select class="select sm" data-c="ses-field" data-f="estado" data-id="${esc(s.id)}" aria-label="Estado de la sesión">${estadoOpts(s)}</select></div>
    <div class="dual-row"><span class="dual-lbl">Pago</span>${payToggle(s)}</div>
    ${s.nota?`<button class="notechip" data-a="open-ses" data-id="${esc(s.id)}" title="${esc(s.nota)}"><span aria-hidden="true">✎</span> Tiene una nota</button>`:''}
  </article>`;
}
function viewSemanas(){
  const m=S.wkMonth||(S.wkMonth=monthKey(TODAY));
  const weeks=weeksOfMonth(m);
  if(!S.wkSel||!weeks.includes(S.wkSel)) S.wkSel=weeks.includes(mondayOf(TODAY))?mondayOf(TODAY):weeks[0];
  const rows=weeks.map(from=>({from,ss:sessionsInRange(from,addDays(from,6))})).map(r=>({...r,st:wkStats(r.ss)}));
  const [y,mm]=m.split('-');
  const tbl=rows.map(r=>{const st=r.st;const split=monthKey(r.from)!==monthKey(addDays(r.from,6));
    const mot=Object.entries(st.motivos).map(([id,n])=>`<span class="chip sm"><span class="dot" style="--c:${esc(colorOf('estadosSesion',id))}"></span>${esc(item('estadosSesion',id)?.nombre||id)} ${n}</span>`).join(' ');
    return `<tr class="clickable${r.from===S.wkSel?' is-sel':''}" data-a="wk-sel" data-d="${r.from}">
      <td data-v="${r.from}"><b>${wkLabel(r.from)}</b>${split?'<div class="small muted">Se reparte entre dos meses</div>':''}</td>
      <td class="num">${st.total}</td><td class="num">${st.realizadas}</td>
      <td>${mot||'<span class="muted">—</span>'}</td>
      <td class="num">${st.pct==null?'—':st.pct+'%'}</td>
      <td class="num">${st.sinRegistrar?`<span style="color:var(--warn)">${st.sinRegistrar}</span>`:'—'}</td></tr>`}).join('');
  const sel=rows.find(r=>r.from===S.wkSel);const st=sel.st;
  const showWE=S.config.general.finDeSemana||sel.ss.some(s=>dow(s.fecha)>=6);
  let days='';
  for(let i=0;i<(showWE?7:5);i++){
    const d=addDays(sel.from,i);const ss=sel.ss.filter(s=>s.fecha===d);
    const other=monthKey(d)!==m;
    days+=`<section class="wday${d===TODAY?' today':''}${other?' other':''}"><div class="wday-head"><div><span class="dname">${DIAS[i]}</span>${other?`<span class="mtag">${cap(monName(d))}</span>`:''}${ferTag(d,false)}</div><span class="dnum">${dayNum(d)}</span></div>
      <div class="wday-body">${ss.length?ss.map(wkCard).join(''):'<p class="empty-day">Sin sesiones</p>'}</div></section>`;
  }
  return `<div class="view-head"><div><h1>Semanas de ${MESES[Number(mm)-1]} ${y}</h1><p class="sub">Cada semana va de lunes a domingo, con sus fechas. Tocá una semana para ver su detalle.</p></div>
    <div class="btn-group"><button class="btn icon" data-a="wk-month" data-n="-1" aria-label="Mes anterior">‹</button><button class="btn" data-a="wk-month" data-n="0">Este mes</button><button class="btn icon" data-a="wk-month" data-n="1" aria-label="Mes siguiente">›</button></div></div>
    <div class="panel"><div class="panel-head"><h2>Sesiones por semana</h2></div><div class="panel-body chart wkchart">${wkChart(rows)}</div>
    <div class="scroll"><table class="wk-table" data-sort="semanas"><thead><tr><th>Semana</th><th class="num">Sesiones</th><th class="num">Realizadas</th><th>No realizadas</th><th class="num">% realizadas</th><th class="num">Sin registrar</th></tr></thead>
    <tbody>${tbl}</tbody></table></div>
    <p class="hint panel-body" style="padding-top:8px">"% realizadas" se calcula sobre las sesiones ya registradas. Las semanas que se reparten entre dos meses muestran sus siete días completos.</p></div>
    <div class="wk-detail-head"><div><h2>Semana del ${wkLabel(sel.from)}</h2><p class="sub">${st.total} sesiones, ${st.realizadas} realizadas${st.sinRegistrar?`, ${st.sinRegistrar} sin registrar`:''}.</p></div>
      <div class="btn-group"><button class="btn sm" data-a="caja-go" data-v="semana" data-d="${sel.from}">Ver cobros y neto en Caja</button><button class="btn icon" data-a="wk-step" data-n="-1" aria-label="Semana anterior">‹</button><button class="btn icon" data-a="wk-step" data-n="1" aria-label="Semana siguiente">›</button></div></div>
    <div class="wweek" style="--cols:${showWE?7:5}">${days}</div>`;
}

/* ---- Caja mensual ---- */
function monthNav(){
  return `<div class="btn-group"><button class="btn icon" data-a="month" data-n="-1" aria-label="Mes anterior">‹</button><button class="btn" data-a="month" data-n="0">Este mes</button><button class="btn icon" data-a="month" data-n="1" aria-label="Mes siguiente">›</button></div>`;
}
function pillFor(s){
  S.visible[s.id]=s;
  const e=item('estadosSesion',s.estado),pg=item('estadosPago',s.pago);
  const c=esc(colorOf('estadosSesion',s.estado));
  const t=`${fmtShort(s.fecha)} ${s.hora||''}: ${e?.nombre||''}, ${pg?.nombre||''}`;
  if(pg?.tipo==='cobrado') return `<button class="pill" style="--c:${c}" data-a="open-ses" data-id="${esc(s.id)}" title="${esc(t)}"><span class="dot"></span>${fmtShort(s.fecha)} ${money(montoOf(s))}</button>`;
  if(cobraOf(s)&&pg?.tipo==='pendiente') return `<button class="pill debe" data-a="open-ses" data-id="${esc(s.id)}" title="${esc(t)}">${fmtShort(s.fecha)} debe ${money(montoOf(s))}</button>`;
  return `<button class="pill ${s.estado==='programada'?'soft':''}" style="--c:${c}" data-a="open-ses" data-id="${esc(s.id)}" title="${esc(t)}"><span class="dot"></span>${fmtShort(s.fecha)} ${esc(e?.nombre||'')}</button>`;
}
const neg=n=>n?`<span class="neg-txt">−${money(n)}</span>`:'—';
function cajaRange(){
  const c=S.cajaCur||TODAY;
  if(S.cajaV==='dia') return [c,c];
  if(S.cajaV==='semana'){const f=mondayOf(c);return [f,addDays(f,6)]}
  const m=monthKey(c);return [m+'-01',lastOfMonth(m)];
}
function periodMoney(from,to,ss){
  const all=ss||sessionsInRange(from,to);const st=stats(all);
  const gastos=S.gastos.filter(g=>(g.fecha||'')>=from&&(g.fecha||'')<=to).reduce((a,g)=>a+Number(g.monto||0),0);
  const fut=all.filter(s=>s.estado==='programada'&&!isPast(s));
  return {all,st,gastos,neto:st.cobrado-st.inst-gastos,prevN:fut.length,prev:fut.reduce((a,s)=>a+montoOf(s),0)};
}
function cajaTitle(from,to){
  if(S.cajaV==='dia') return cap(fmtLong(from));
  if(S.cajaV==='mes') return `${cap(MESES[parse(from).getMonth()])} ${parse(from).getFullYear()}`;
  const a=parse(from),b=parse(to);
  return a.getMonth()===b.getMonth()?`Del ${a.getDate()} al ${b.getDate()} de ${MESES[b.getMonth()]}`:`Del ${a.getDate()} de ${MESES[a.getMonth()]} al ${b.getDate()} de ${MESES[b.getMonth()]}`;
}
function viewCaja(){
  S.cajaV=S.cajaV||'mes';S.cajaCur=S.cajaCur||TODAY;
  const [from,to]=cajaRange();const P=periodMoney(from,to);const st=P.st;
  const lbl={dia:'del día',semana:'de la semana',mes:'del mes'}[S.cajaV];
  const seg=[['dia','Día'],['semana','Semana'],['mes','Mes']].map(([v,l])=>`<button data-a="caja-view" data-v="${v}" aria-pressed="${S.cajaV===v}">${l}</button>`).join('');
  let body='';
  if(S.cajaV==='dia') body=cajaDia(from,P);
  else if(S.cajaV==='semana') body=cajaSemana(from);
  else {const m=monthKey(from);body=cajaMesPacientes(P)+weekdayPanel(m,P.all)+yearChart(m.slice(0,4))}
  return `<div class="view-head"><div><h1>Caja</h1><p class="sub">${cajaTitle(from,to)}${S.cajaV==='dia'&&feriadoDe(from)?` (${esc(feriadoDe(from).nombre)})`:''}${S.cajaV==='semana'?`, ${parse(from).getFullYear()}`:''}. Cada sesión cuenta en la fecha en que se atendió.</p></div>
    <div class="btn-group"><div class="seg" role="group" aria-label="Período">${seg}</div>
    <button class="btn icon" data-a="caja-nav" data-n="-1" aria-label="Anterior">‹</button><button class="btn" data-a="caja-nav" data-n="0">Hoy</button><button class="btn icon" data-a="caja-nav" data-n="1" aria-label="Siguiente">›</button></div></div>
    <div class="kpis">
      <div class="kpi"><span>Cobrado</span><b>${money(st.cobrado)}</b></div>
      <div class="kpi ${st.pendiente?'warn':''}"><span>Pendiente de cobro</span><b>${money(st.pendiente)}</b></div>
      <div class="kpi ${st.inst?'minus':''}"><span>Para instituciones</span><b>${st.inst?'−'+money(st.inst):money(0)}</b></div>
      <div class="kpi ${P.gastos?'minus':''}"><span>Gastos</span><b>${P.gastos?'−'+money(P.gastos):money(0)}</b></div>
      <div class="kpi neto ${P.neto<0?'neg':''}"><span>Neto ${lbl}</span><b>${money(P.neto)}</b></div>
    </div>
    <p class="hint caja-note">Neto = cobrado − para instituciones − gastos.${P.prevN?` Además hay ${P.prevN} ${P.prevN===1?'sesión programada':'sesiones programadas'} que todavía no ${P.prevN===1?'ocurrió':'ocurrieron'}, por ${money(P.prev)}; se suman cuando se cobran.`:''}</p>
    ${body}`;
}
function cajaDia(d,P){
  const ss=P.all;
  const rows=ss.map(s=>{S.visible[s.id]=s;const p=pat(s.pid),e=item('estadosSesion',s.estado),pg=item('estadosPago',s.pago);
    const cob=pg?.tipo==='cobrado';const cuenta=cobraOf(s);
    return `<tr><td>${esc(s.hora||'')}</td><td><button class="linkish" data-a="open-ses" data-id="${esc(s.id)}">${esc(fullName(p)||'Paciente eliminado')}</button><div class="small muted">${esc(instOf(p)?.nombre||'')}</div></td>
      <td><span class="chip sm"><span class="dot" style="--c:${esc(colorOf('estadosSesion',s.estado))}"></span>${s.estado==='programada'&&isPast(s)?'Sin registrar':esc(e?.nombre||'')}</span></td>
      <td>${cuenta||s.estado==='programada'?`<span class="${cob?'ok-txt':cuenta?'warn-txt':'muted'}">${esc(cob?pg.nombre:cuenta?'Pendiente de pago':'—')}</span>`:'<span class="muted">No se cobra</span>'}</td>
      <td class="num">${cuenta||cob||s.estado==='programada'?money(montoOf(s)):'—'}</td><td class="num">${cob&&porcOf(s)?neg(montoOf(s)*porcOf(s)/100):'—'}</td></tr>`}).join('');
  const gs=S.gastos.filter(g=>g.fecha===d);
  return `<div class="panel"><div class="panel-head"><h2>Sesiones del día</h2><button class="btn sm" data-a="caja-agenda" data-d="${d}">Ver en la agenda</button></div><div class="scroll"><table data-sort="caja-dia">
    <thead><tr><th>Hora</th><th>Paciente</th><th>Sesión</th><th>Pago</th><th class="num">Honorario</th><th class="num">Institución (−)</th></tr></thead>
    <tbody>${rows||'<tr><td colspan="6" class="muted">No hay sesiones este día.</td></tr>'}</tbody></table></div></div>
    <div class="panel"><div class="panel-head"><h2>Gastos del día</h2><button class="btn sm" data-a="nav" data-v="gastos">Cargar un gasto</button></div>
    ${gs.length?`<div class="scroll"><table><tbody>${gs.map(g=>`<tr><td>${esc(item('categoriasGasto',g.categoria)?.nombre||'Sin categoría')}</td><td>${esc(g.descripcion||'')}</td><td class="num">${neg(Number(g.monto||0))}</td></tr>`).join('')}</tbody></table></div>`:'<p class="panel-body muted">No hay gastos este día.</p>'}</div>`;
}
function cajaSemana(from){
  const days=[];const T={ses:0,cob:0,pend:0,inst:0,gas:0,neto:0};
  for(let i=0;i<7;i++){const d=addDays(from,i);const P=periodMoney(d,d);const n=P.all.filter(s=>s.estado!=='programada'||isPast(s)).length;
    if(i>=5&&!P.all.length&&!P.gastos&&!S.config.general.finDeSemana) continue;
    days.push({d,P,n});T.ses+=P.all.length;T.cob+=P.st.cobrado;T.pend+=P.st.pendiente;T.inst+=P.st.inst;T.gas+=P.gastos;T.neto+=P.neto}
  const max=Math.max(1,...days.map(x=>Math.abs(x.P.neto)));
  const rows=days.map(({d,P})=>`<tr class="clickable${d===TODAY?' is-sel':''}" data-a="caja-day" data-d="${d}"><td data-v="${d}"><b>${DIAS[dow(d)-1]}</b> <span class="muted">${fmtShort(d)}</span> ${ferTag(d,true)}</td>
    <td class="num">${P.all.length||'—'}</td><td class="num">${P.st.cobrado?money(P.st.cobrado):'—'}</td><td class="num">${P.st.pendiente?`<span class="warn-txt">${money(P.st.pendiente)}</span>`:'—'}</td>
    <td class="num">${neg(P.st.inst)}</td><td class="num">${neg(P.gastos)}</td>
    <td class="num netcell"><span class="nbar ${P.neto<0?'neg':''}" style="width:${Math.round(Math.abs(P.neto)/max*100)}%"></span><b>${money(P.neto)}</b></td></tr>`).join('');
  return `<div class="panel"><div class="panel-head"><h2>Día por día</h2><span class="small muted">Tocá un día para ver su detalle</span></div><div class="scroll"><table data-sort="caja-semana">
    <thead><tr><th>Día</th><th class="num">Sesiones</th><th class="num">Cobrado</th><th class="num">Pendiente</th><th class="num">Instituciones (−)</th><th class="num">Gastos (−)</th><th class="num">Neto</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td>Total de la semana</td><td class="num">${T.ses}</td><td class="num">${money(T.cob)}</td><td class="num">${money(T.pend)}</td><td class="num">${neg(T.inst)}</td><td class="num">${neg(T.gas)}</td><td class="num">${money(T.neto)}</td></tr></tfoot>
    </table></div></div>`;
}
function cajaMesPacientes(P){
  const all=P.all,st=P.st;
  const byP={};for(const s of all)(byP[s.pid]=byP[s.pid]||[]).push(s);
  const pids=Object.keys(byP).sort((a,b)=>sortName(pat(a)).localeCompare(sortName(pat(b))));
  const rows=pids.map(pid=>{
    const p=pat(pid);const ss=byP[pid];const r=stats(ss);
    return `<tr><td class="pname">${esc(fullName(p)||'Paciente eliminado')}<div class="small muted">${esc(instOf(p)?.nombre||'')}</div></td>
      <td class="pills-cell">${ss.map(pillFor).join('')}</td>
      <td class="num">${r.realizadas}</td>
      <td class="num">${money(r.cobrado)}</td><td class="num">${r.pendiente?`<span class="warn-txt">${money(r.pendiente)}</span>`:'—'}</td>
      <td class="num">${neg(r.inst)}</td><td>${esc(item('facturacion',p?.facturacion)?.nombre||'')}</td></tr>`;
  }).join('');
  return `<div class="panel"><div class="panel-head"><h2>Por paciente</h2></div><div class="scroll"><table class="caja-table" data-sort="caja-mes">
      <thead><tr><th>Paciente</th><th>Sesiones del mes</th><th class="num">Realizadas</th><th class="num">Cobrado</th><th class="num">Pendiente</th><th class="num">Institución (−)</th><th>Facturación</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="7" class="muted">No hay sesiones en este mes.</td></tr>'}</tbody>
      ${rows?`<tfoot><tr><td>Total</td><td>${st.total} sesiones, ${st.canceladas} sin realizar</td><td class="num">${st.realizadas}</td><td class="num">${money(st.cobrado)}</td><td class="num">${money(st.pendiente)}</td><td class="num">${neg(st.inst)}</td><td></td></tr></tfoot>`:''}
    </table></div></div>`;
}
function weekdayPanel(m,all){
  const first=m+'-01',last=lastOfMonth(m);
  const rows=[];
  for(let wd=1;wd<=7;wd++){
    const fechas=[];for(let d=first;d<=last;d=addDays(d,1)) if(dow(d)===wd) fechas.push(d);
    const ss=all.filter(s=>dow(s.fecha)===wd&&(s.estado==='programada'||cobraOf(s)));
    const noRe=all.filter(s=>dow(s.fecha)===wd&&s.estado!=='programada'&&!cobraOf(s)).length;
    if(!ss.length&&!noRe) continue;
    let total=0,cob=0;for(const s of ss){const mt=montoOf(s);total+=mt;if(item('estadosPago',s.pago)?.tipo==='cobrado')cob+=mt}
    rows.push({wd,fechas,ses:ss.length,pac:new Set(ss.map(s=>s.pid)).size,total,cob,pend:total-cob,noRe});
  }
  if(!rows.length) return '';
  const T=rows.reduce((a,r)=>({ses:a.ses+r.ses,total:a.total+r.total,cob:a.cob+r.cob,pend:a.pend+r.pend,noRe:a.noRe+r.noRe}),{ses:0,total:0,cob:0,pend:0,noRe:0});
  const pacT=new Set(all.filter(s=>s.estado==='programada'||cobraOf(s)).map(s=>s.pid)).size;
  return `<div class="panel"><div class="panel-head"><div><h2>Por día de la semana</h2>
    <p class="small muted" style="margin-top:3px">Pacientes y sesiones que se atienden cada día, estén pagadas o no. Incluye las sesiones realizadas, las que se cobran aunque se hayan cancelado y las que todavía no ocurrieron.</p></div></div>
    <div class="scroll"><table data-sort="caja-dias"><thead><tr><th>Día</th><th data-nosort>Fechas del mes</th><th class="num">Pacientes</th><th class="num">Sesiones</th><th class="num">Total a facturar</th><th class="num">Cobrado</th><th class="num">Falta cobrar</th><th class="num">No realizadas</th></tr></thead>
    <tbody>${rows.map(r=>`<tr><td data-v="${r.wd}"><b>${DIAS[r.wd-1]}</b></td><td class="small muted">${r.fechas.map(d=>dayNum(d)).join(', ')}</td>
      <td class="num">${r.pac}</td><td class="num">${r.ses}</td><td class="num"><b>${money(r.total)}</b></td><td class="num">${money(r.cob)}</td>
      <td class="num">${r.pend?`<span style="color:var(--warn)">${money(r.pend)}</span>`:'—'}</td><td class="num">${r.noRe||'—'}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Total del mes</td><td></td><td class="num">${pacT}</td><td class="num">${T.ses}</td><td class="num">${money(T.total)}</td><td class="num">${money(T.cob)}</td><td class="num">${T.pend?money(T.pend):'—'}</td><td class="num">${T.noRe||'—'}</td></tr></tfoot>
    </table></div>
    <p class="hint panel-body" style="padding-top:8px">"Falta cobrar" suma lo pendiente de pago y las sesiones que todavía no ocurrieron. "No realizadas" cuenta las cancelaciones y ausencias que no se cobran; no suman al total.</p></div>`;
}
function yearChart(y){
  const data=[];
  for(let i=1;i<=12;i++){
    const m=`${y}-${pad(i)}`;const doc=S.ses['ses-'+m];
    const st=stats(Object.values(doc?.items||{}).filter(s=>!s.oculta&&pidVivo(s.pid)));
    const g=gastosMes(m).reduce((a,x)=>a+Number(x.monto||0),0);
    data.push({c:st.cobrado,g,n:st.cobrado-st.inst-g});
  }
  const max=Math.max(1,...data.map(d=>Math.max(d.c,d.g)));
  const W=720,H=200,pl=8,pb=24,bw=(W-pl*2)/12;
  let bars='';
  data.forEach((d,i)=>{
    const x=pl+i*bw;const hc=(d.c/max)*(H-pb-10);const hg=(d.g/max)*(H-pb-10);
    bars+=`<g><title>${cap(MESES[i])}: cobrado ${money(d.c)}, gastos ${money(d.g)}, neto ${money(d.n)}</title>
      <rect x="${x+bw*.18}" y="${H-pb-hc}" width="${bw*.32}" height="${hc}" rx="3" fill="var(--accent)"/>
      <rect x="${x+bw*.52}" y="${H-pb-hg}" width="${bw*.3}" height="${hg}" rx="3" fill="var(--warn)" opacity=".7"/>
      <text x="${x+bw/2}" y="${H-6}" text-anchor="middle" font-size="12" fill="var(--muted)">${MESES_C[i]}</text></g>`;
  });
  return `<div class="panel"><div class="panel-head"><h2>Año ${y}</h2><span class="small muted">Solo cuenta sesiones ya marcadas</span></div>
    <div class="panel-body chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cobrado y gastos por mes de ${y}">
    <line x1="0" x2="${W}" y1="${H-pb}" y2="${H-pb}" stroke="var(--line)"/>${bars}</svg>
    <div class="legend"><span><i class="dot" style="--c:var(--accent)"></i>Cobrado</span><span><i class="dot" style="--c:var(--warn)"></i>Gastos</span></div></div></div>`;
}

/* ---- Pacientes ---- */
const activeH=p=>(p.horarios||[]).filter(h=>h.hora&&(!h.hasta||h.hasta>=TODAY));
function horarioTxt(p){
  return activeH(p).map(h=>`${DIAS_C[(h.dia||1)-1]} ${h.hora}, ${(item('frecuencias',h.frecuencia)?.nombre||'').toLowerCase()}`).join('; ')||'Sin horario';
}
function patientHistory(pid){
  const arr=[];for(const d of Object.values(S.ses)) for(const s of Object.values(d.items||{})) if(s.pid===pid&&!s.oculta) arr.push(s);
  return stats(arr);
}
function viewPacientes(){
  const q=S.q.trim().toLowerCase();
  const ps=S.patients.filter(p=>!p.eliminado&&(!S.filtroEstado||p.estado===S.filtroEstado)&&(!q||fullName(p).toLowerCase().includes(q)||(p.hc||'').includes(q)))
    .sort((a,b)=>sortName(a).localeCompare(sortName(b)));
  const rows=ps.map(p=>{const h=patientHistory(p.id);const e=item('estadosPaciente',p.estado);
    return `<tr class="clickable" data-a="pac-open" data-id="${esc(p.id)}"><td>${esc(p.hc||'')}</td><td><b>${esc(fullName(p))}</b><div class="small muted">${esc(item('modalidades',p.modalidad)?.nombre||'')}</div></td>
    <td>${esc(horarioTxt(p))}</td><td>${esc(instOf(p)?.nombre||'')}</td><td class="num">${money(p.honorario)}</td>
    <td><span class="chip"><span class="dot" style="--c:${esc(e?.color||'#999')}"></span>${esc(e?.nombre||'Sin estado')}</span></td>
    <td class="num">${h.pendiente?`<span style="color:var(--warn)">${money(h.pendiente)}</span>`:'—'}</td></tr>`}).join('');
  return `<div class="view-head"><div><h1>Pacientes</h1><p class="sub">${S.patients.filter(vivo).length} en total, ${S.patients.filter(p=>vivo(p)&&item('estadosPaciente',p.estado)?.agenda).length} en agenda</p></div>
    <button class="btn primary" data-a="pac-new">Nuevo paciente</button></div>
    <div class="panel"><div class="panel-head"><div class="toolbar">
      <input class="input" type="search" placeholder="Buscar por nombre o HC" value="${esc(S.q)}" data-c="pac-q" aria-label="Buscar paciente">
      <select class="select" data-c="pac-f" aria-label="Filtrar por estado">${options('estadosPaciente',S.filtroEstado,'Todos los estados')}</select></div></div>
    <div class="scroll"><table data-sort="pacientes"><thead><tr><th>HC</th><th>Nombre</th><th>Horario</th><th>Institución</th><th class="num">Honorario</th><th>Estado</th><th class="num">Debe</th></tr></thead>
    <tbody>${rows||`<tr><td colspan="7" class="muted">${S.patients.length?'Ningún paciente coincide con la búsqueda.':'Todavía no hay pacientes. Creá el primero con "Nuevo paciente".'}</td></tr>`}</tbody></table></div></div>`;
}

/* ---- Gastos ---- */
function viewGastos(){
  const m=S.month;const gs=gastosMes(m).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  const total=gs.reduce((a,g)=>a+Number(g.monto||0),0);
  const prev=gastosMes(addMonths(m,-1));
  const rows=gs.map(g=>`<tr><td data-v="${esc(g.fecha)}">${esc(fmtShort(g.fecha))}</td><td>${esc(item('categoriasGasto',g.categoria)?.nombre||'Sin categoría')}</td><td>${esc(g.descripcion||'')}</td>
    <td>${esc(item('mediosPago',g.medio)?.nombre||'')}</td><td class="num">${money(g.monto)}</td>
    <td class="num"><button class="btn danger icon" data-a="gasto-del" data-id="${esc(g.id)}" aria-label="Eliminar gasto">✕</button></td></tr>`).join('');
  const [y,mm]=m.split('-');
  return `<div class="view-head"><div><h1>Gastos de ${MESES[Number(mm)-1]} ${y}</h1><p class="sub">Total del mes: ${money(total)}</p></div>${monthNav()}</div>
    <div class="panel"><div class="panel-head"><h2>Nuevo gasto</h2>${prev.length&&!gs.length?`<button class="btn" data-a="gasto-copy">Copiar los ${prev.length} gastos del mes anterior</button>`:''}</div>
    <div class="panel-body"><div class="toolbar">
      <input class="input" type="date" id="g_fecha" value="${m===monthKey(TODAY)?TODAY:m+'-01'}" aria-label="Fecha">
      <select class="select" id="g_cat" aria-label="Categoría">${options('categoriasGasto','')}</select>
      <input class="input" id="g_desc" placeholder="Descripción" aria-label="Descripción" style="flex:1;min-width:160px">
      <select class="select" id="g_medio" aria-label="Medio de pago">${options('mediosPago','','Medio de pago')}</select>
      <input class="input" id="g_monto" type="number" min="0" step="100" placeholder="Monto" aria-label="Monto" style="width:130px">
      <button class="btn primary" data-a="gasto-add">Agregar gasto</button></div></div></div>
    <div class="panel"><div class="scroll"><table data-sort="gastos"><thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Medio</th><th class="num">Monto</th><th></th></tr></thead>
    <tbody>${rows||'<tr><td colspan="6" class="muted">No hay gastos cargados en este mes.</td></tr>'}</tbody>
    ${rows?`<tfoot><tr><td colspan="4">Total</td><td class="num">${money(total)}</td><td></td></tr></tfoot>`:''}</table></div></div>`;
}

/* ---- Configuración ---- */
function cfgExtra(L,i){
  return (L.extra||[]).map(x=>{
    if(x.type==='bool') return `<label class="cfg-extra"><input type="checkbox" data-c="cfg" data-list="${L.key}" data-id="${esc(i.id)}" data-k="${x.k}" ${i[x.k]?'checked':''}>${x.label}</label>`;
    if(x.type==='number') return `<label class="cfg-extra">${x.label}<input class="input" type="number" min="0" data-c="cfg" data-list="${L.key}" data-id="${esc(i.id)}" data-k="${x.k}" value="${esc(i[x.k]??0)}">${x.suffix||(x.k==='porcentaje'?'%':'')}</label>`;
    if(x.type==='select') return `<label class="cfg-extra">${x.label}<select class="select" data-c="cfg" data-list="${L.key}" data-id="${esc(i.id)}" data-k="${x.k}">${x.opts.map(([v,t])=>`<option value="${v}"${i[x.k]===v?' selected':''}>${t}</option>`).join('')}</select></label>`;
  }).join('');
}
function hourOpts(sel){let h='';for(let i=0;i<=24;i++)h+=`<option value="${i}"${Number(sel)===i?' selected':''}>${pad(i)}:00</option>`;return h}
const PALETAS=[
  ['rosa-salvia','Rosa y salvia','Fondo rosado, acentos verde salvia',['#F8F3F1','#F6DDE3','#557F66','#33302F']],
  ['rosa','Rosa cuarzo','Todo en rosas suaves',['#FAF3F2','#F7DFE4','#A5566D','#3B2F34']],
  ['salvia','Verde salvia','Verdes calmos y naturales',['#F1F6F1','#DAECDD','#4D7A5D','#2B3A31']],
  ['original','Original','La paleta con la que empezamos',['#EDF1EF','#DDEBE8','#2B6B64','#17272A']]];
const FUENTES=[
  ['serena','Serena','Títulos en Lora y textos en Nunito','"Lora",Georgia,serif'],
  ['suave','Suave','Todo en Nunito, redondeada','"Nunito",system-ui,sans-serif'],
  ['original','Original','Instrument Sans','"Instrument Sans",system-ui,sans-serif']];
function lookPanel(g){
  const pal=g.paleta||'rosa-salvia',fu=g.fuente||'serena';
  return `<section class="panel"><div class="panel-head"><div><h2>Apariencia</h2><p class="small muted" style="margin-top:3px">Se aplica al instante. Probá las combinaciones y quedate con la que te resulte más cómoda.</p></div></div>
    <div class="panel-body">
      <h3 class="lbl">Paleta de colores</h3>
      <div class="look-grid">${PALETAS.map(([id,n,d,c])=>`<button class="look" data-a="look" data-k="paleta" data-v="${id}" aria-pressed="${pal===id}"><span class="sw">${c.map(x=>`<i style="background:${x}"></i>`).join('')}</span><span class="lt"><b>${n}</b><span>${d}</span></span></button>`).join('')}</div>
      <h3 class="lbl" style="margin-top:18px">Tipografía</h3>
      <div class="look-grid">${FUENTES.map(([id,n,d,ff])=>`<button class="look" data-a="look" data-k="fuente" data-v="${id}" aria-pressed="${fu===id}"><span class="lt"><span class="fsample" style="font-family:${ff}">Martes 22 de septiembre</span><b>${n}</b><span>${d}</span></span></button>`).join('')}</div>
      <label class="check" style="margin-top:14px"><input type="checkbox" data-c="gen" data-k="textura" ${g.textura!==false?'checked':''}>Textura de papel sutil en el fondo</label>
    </div></section>`;
}
function viewConfig(){
  const g=S.config.general;
  const panels=LISTS.map(L=>`<section class="panel"><div class="panel-head"><div><h2>${L.titulo}</h2><p class="small muted" style="margin-top:3px">${L.desc}</p></div></div>
    <div class="panel-body">
    ${list(L.key).map(i=>`<div class="cfg-item${L.color?'':' nocolor'}">
      ${L.color?`<input type="color" value="${esc(i.color||'#8A9A9C')}" data-c="cfg" data-list="${L.key}" data-id="${esc(i.id)}" data-k="color" aria-label="Color de ${esc(i.nombre)}">`:''}
      <input class="input" value="${esc(i.nombre)}" data-c="cfg" data-list="${L.key}" data-id="${esc(i.id)}" data-k="nombre" aria-label="Nombre">
      ${i.fijo?'<span class="lock" title="Este valor lo usa el sistema y no se puede eliminar">fijo</span>':`<button class="btn danger icon" data-a="cfg-del" data-list="${L.key}" data-id="${esc(i.id)}" aria-label="Eliminar ${esc(i.nombre)}">✕</button>`}
      <div class="extras">${cfgExtra(L,i)}</div>
    </div>`).join('')}
    <div class="cfg-add"><input class="input" placeholder="Nuevo valor" id="add_${L.key}" aria-label="Nuevo valor para ${L.titulo}" data-enter="cfg-add" data-list="${L.key}"><button class="btn" data-a="cfg-add" data-list="${L.key}">Agregar</button></div>
    </div></section>`).join('');
  return `<div class="view-head"><div><h1>Configuración</h1><p class="sub">Los cambios se guardan automáticamente.</p></div></div>
    ${lookPanel(g)}
    ${pinPanel()}
    ${feriadosPanel()}
    ${facturacionPanel()}
    ${emisorPanel()}
    <section class="panel" style="margin-top:16px"><div class="panel-head"><h2>General</h2></div><div class="panel-body"><div class="form cols3">
      <div class="field full"><label for="c_prof">Nombre del profesional o consultorio</label><input class="input" id="c_prof" data-c="gen" data-k="profesional" value="${esc(g.profesional)}" placeholder="Ej.: Lic. Nombre Apellido"></div>
      <div class="field"><label for="c_ini">La agenda empieza a las</label><select class="select" id="c_ini" data-c="gen" data-k="inicio" data-num="1">${hourOpts(g.inicio)}</select></div>
      <div class="field"><label for="c_fin">Y termina a las</label><select class="select" id="c_fin" data-c="gen" data-k="fin" data-num="1">${hourOpts(g.fin)}</select></div>
      <div class="field"><label for="c_dur">Duración habitual de la sesión (min)</label><input class="input" type="number" min="10" step="5" id="c_dur" data-c="gen" data-k="duracion" data-num="1" value="${esc(g.duracion)}"></div>
      <div class="field"><label for="c_alerta">Avisar pagos pendientes después de (días)</label><input class="input" type="number" min="1" step="1" id="c_alerta" data-c="gen" data-k="alertaDias" data-num="1" value="${esc(alertaDias())}"></div>
      <div class="field"><label for="c_vista">Vista inicial de la agenda</label><select class="select" id="c_vista" data-c="gen" data-k="vistaInicial">${[['dia','Día'],['semana','Semana'],['mes','Mes']].map(([v,l])=>`<option value="${v}"${g.vistaInicial===v?' selected':''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>Fin de semana</label><label class="check"><input type="checkbox" data-c="gen" data-k="finDeSemana" ${g.finDeSemana?'checked':''}>Mostrar sábado y domingo siempre</label></div>
    </div></div></section>
    <div class="cfg-grid" style="margin-top:16px">${panels}</div>
    <section class="panel" style="margin-top:16px"><div class="panel-head"><div><h2>Tus datos</h2><p class="small muted" style="margin-top:3px">${Store.fb?`Se guardan en la nube y se sincronizan entre las cuentas autorizadas. Sesión iniciada como ${esc(Store.email||'')}.`:Store.mode==='db'?'Se guardan en tu cuenta y solo vos podés verlos.':'Se guardan solo en este navegador. Descargá copias de seguridad seguido.'}</p></div></div>
    <div class="panel-body btn-group">
      <button class="btn" data-a="export">Descargar copia de seguridad</button>
      <label class="btn">Restaurar desde una copia<input type="file" accept=".json,application/json" data-c="import" hidden></label>
      ${Store.fb?'<button class="btn" data-a="logout">Cerrar sesión</button>':''}
      <button class="btn danger" data-a="reset">Borrar todos los datos</button>
    </div></section>
    ${backupPanel()}${trashPanel()}`;
}

/* ============ Diálogos ============ */
const dlg=document.getElementById('dlg');
dlg.addEventListener('close',()=>{S.dlgOpen=false;S.edit=null;render()});
function openDlg(html){dlg.innerHTML=html;if(!dlg.open)dlg.showModal();S.dlgOpen=true}
function closeDlg(){if(dlg.open)dlg.close()}
function confirmBox(title,text,okLabel='Confirmar',danger=true){
  const c=document.getElementById('confirm');
  c.innerHTML=`<div class="dlg-head"><h2>${esc(title)}</h2></div><div class="dlg-body"><p>${esc(text)}</p></div>
    <div class="dlg-foot"><span></span><div class="btn-group"><button class="btn" value="no">Cancelar</button><button class="btn primary" value="ok" style="${danger?'background:var(--danger);border-color:var(--danger)':''}">${esc(okLabel)}</button></div></div>`;
  return new Promise(res=>{
    c.querySelectorAll('button').forEach(b=>b.onclick=()=>{c.close();res(b.value==='ok')});
    c.oncancel=()=>res(false);c.showModal();
  });
}
function chipBtn(f,i,sel){return `<button class="chipbtn" style="--c:${esc(i.color||'var(--accent)')}" data-a="sheet-set" data-f="${f}" data-v="${esc(i.id)}" aria-pressed="${i.id===sel}"><span class="dot"></span>${esc(i.nombre)}</button>`}
function sesSheet(){
  const s=S.edit;const p=pat(s.pid);const pg=item('estadosPago',s.pago);
  const done=cobraOf(s)&&pg?.tipo==='cobrado';
  const detOpen=document.getElementById('sheetMore')?.open;
  openDlg(`<div class="dlg-head"><div><h2>${esc(fullName(p)||'Paciente eliminado')}</h2><p class="muted small">${cap(fmtLong(s.fecha))}, ${esc(s.hora||'sin hora')}, ${durOf(s)} min, ${money(montoOf(s))}</p></div><button class="btn ghost icon" data-a="dlg-close" aria-label="Cerrar">✕</button></div>
  <div class="dlg-body">
    <h3 class="lbl">Sesión: ¿qué pasó?</h3><div class="chips">${list('estadosSesion').map(i=>chipBtn('estado',i,s.estado)).join('')}</div>
    ${modeOf(item('estadosSesion',s.estado))==='opcional'?`<h3 class="lbl">¿Se cobra?</h3><div class="chips"><button class="chipbtn" data-a="set-cobrar" data-id="${esc(s.id)}" data-v="0" aria-pressed="${!s.cobrar}">No se cobra</button><button class="chipbtn" data-a="set-cobrar" data-id="${esc(s.id)}" data-v="1" aria-pressed="${!!s.cobrar}">Se cobra</button></div>`:''}
    <h3 class="lbl">Pago</h3>${payApplies(s)?`<div class="chips">${list('estadosPago').map(i=>chipBtn('pago',i,s.pago)).join('')}</div>`:'<p class="no-pay" style="margin-bottom:16px">Esta sesión no genera honorario, así que no corresponde cobro.</p>'}
 ${sesCompRow(s)?`<div style="margin-bottom:14px">${sesCompRow(s)}</div>`:''}
    <details id="sheetMore" ${detOpen?'open':''}><summary>Monto, medio de pago y nota</summary><div class="form" style="margin-top:12px">
      ${s.extra?`<div class="field"><label for="f_fecha">Fecha</label><input class="input" type="date" id="f_fecha" value="${esc(s.fecha)}"></div>
      <div class="field"><label for="f_hora">Hora</label><input class="input" type="time" id="f_hora" value="${esc(s.hora||'')}"></div>`:''}
      <div class="field"><label for="f_monto">Honorario de esta sesión</label><input class="input" type="number" min="0" step="100" id="f_monto" value="${esc(montoOf(s))}"></div>
      ${item('estadosPago',s.pago)?.tipo==='cobrado'?`<div class="field"><label for="f_pagado">Fecha de cobro</label><input class="input" type="date" id="f_pagado" value="${esc(s.pagadoEl||s.fecha)}"></div>`:''}
      <div class="field"><label for="f_medio">Medio de pago</label><select class="select" id="f_medio">${options('mediosPago',s.medio||p?.medioPago||'','Sin especificar')}</select></div>
      <div class="field full"><label for="f_nota">Nota administrativa</label><textarea class="input" id="f_nota" placeholder="Ej.: avisó por WhatsApp, pagó con recargo">${esc(s.nota||'')}</textarea></div>
      <div class="full"><button class="btn" data-a="sheet-save">Guardar estos datos</button></div></div></details>
    <div id="reprog" hidden><div class="form" style="margin-top:14px">
      <div class="fieldset-title">Reprogramar</div>
      <div class="field"><label for="r_fecha">Nueva fecha</label><input class="input" type="date" id="r_fecha" value="${esc(addDays(s.fecha,1))}"></div>
      <div class="field"><label for="r_hora">Nueva hora</label><input class="input" type="time" id="r_hora" value="${esc(s.hora||'')}"></div>
      <p class="hint full">${s.extra?'La sesión se mueve a la nueva fecha.':'Esta sesión queda como "Reprogramada" y se crea una nueva en la fecha elegida.'}</p>
      <div class="full"><button class="btn primary" data-a="ses-reprog-save">Confirmar reprogramación</button></div></div></div>
  </div>
  <div class="dlg-foot"><div class="btn-group"><button class="btn danger" data-a="ses-hide">${s.extra?'Eliminar sesión':'Quitar de la agenda'}</button><button class="btn ghost" data-a="ses-reprog">Reprogramar</button></div>
    <button class="btn primary" data-a="dlg-close">Listo</button></div>`);
}
function newSesDialog(fecha,hora){
  S.edit={id:'x_'+uid(),fecha,hora:hora||'',extra:true,isNew:true};
  openDlg(`<div class="dlg-head"><div><h2>Nueva sesión</h2><p class="muted small">Sesión fuera del horario habitual, única o de un paciente nuevo</p></div><button class="btn ghost icon" data-a="dlg-close" aria-label="Cerrar">✕</button></div>
  <div class="dlg-body"><div class="form">
    <div class="field full"><label for="f_pid">Paciente</label><select class="select" id="f_pid">${S.patients.filter(vivo).sort((a,b)=>sortName(a).localeCompare(sortName(b))).map(x=>`<option value="${esc(x.id)}">${esc(fullName(x))}</option>`).join('')}</select></div>
    <div class="field"><label for="f_fecha">Fecha</label><input class="input" type="date" id="f_fecha" value="${esc(fecha)}"></div>
    <div class="field"><label for="f_hora">Hora</label><input class="input" type="time" id="f_hora" value="${esc(hora||'')}"></div>
    <div class="field"><label for="f_dur">Duración (min)</label><input class="input" type="number" min="10" step="5" id="f_dur" value="${defDur()}"></div>
    <div class="field"><label for="f_monto">Honorario</label><input class="input" type="number" min="0" step="100" id="f_monto" placeholder="El habitual del paciente"></div>
    <div class="field"><label for="f_estado">Estado de la sesión</label><select class="select" id="f_estado">${options('estadosSesion','programada')}</select></div>
    <div class="field"><label for="f_pago">Pago</label><select class="select" id="f_pago">${options('estadosPago','pendiente')}</select></div>
    <div class="field full"><label for="f_nota">Nota administrativa</label><textarea class="input" id="f_nota"></textarea></div>
  </div></div>
  <div class="dlg-foot"><span></span><div class="btn-group"><button class="btn" data-a="dlg-close">Cancelar</button><button class="btn primary" data-a="new-save">Agregar sesión</button></div></div>`);
}
function pacDialog(p){
  const isNew=!p;
  S.edit=p?JSON.parse(JSON.stringify(p)):{id:'p_'+uid(),apellido:'',hc:String(S.patients.reduce((a,x)=>Math.max(a,Number(x.hc)||0),0)+1),nombre:'',dni:'',telefono:'',email:'',fechaDerivacion:TODAY,
    estado:list('estadosPaciente')[0]?.id||'',modalidad:list('modalidades')[0]?.id||'',institucion:list('instituciones')[0]?.id||'',supervisa:false,legajo:list('legajos')[0]?.id||'',
    honorario:'',medioPago:list('mediosPago')[0]?.id||'',facturacion:list('facturacion')[0]?.id||'',horarios:[],observaciones:''};
  S.edit.isNew=isNew;
  S.edit.horarios=activeH(S.edit).length||isNew?activeH(S.edit):[];
  if(isNew) S.edit.horarios=[{id:'h_'+uid(),dia:1,hora:'',duracion:defDur(),frecuencia:list('frecuencias')[0]?.id||'',desde:TODAY}];
  renderPacDialog();
}
function renderPacDialog(){
  const e=S.edit;const h=e.isNew?null:patientHistory(e.id);
  const orig=e.isNew?null:pat(e.id);
  const closed=(orig?.horarios||[]).filter(x=>x.hasta&&x.hasta<TODAY);
  const F=(id,label,val,type='text',extra='')=>`<div class="field"><label for="pf_${id}">${label}</label><input class="input" id="pf_${id}" name="${id}" type="${type}" value="${esc(val??'')}" ${extra}></div>`;
  const Sel=(id,label,k,val,empty)=>`<div class="field"><label for="pf_${id}">${label}</label><select class="select" id="pf_${id}" name="${id}">${options(k,val,empty)}</select></div>`;
  openDlg(`<div class="dlg-head"><div><h2>${e.isNew?'Nuevo paciente':esc(fullName(e))}</h2>${e.isNew?'':`<p class="muted small">HC ${esc(e.hc)}</p>`}</div><button class="btn ghost icon" data-a="dlg-close" aria-label="Cerrar">✕</button></div>
  <div class="dlg-body" id="pac-form">
    ${h?`<div class="summary-row"><div><span class="muted">Sesiones realizadas</span><b>${h.realizadas}</b></div><div><span class="muted">Cobrado total</span><b>${money(h.cobrado)}</b></div><div><span class="muted">Pendiente de cobro</span><b style="color:${h.pendiente?'var(--warn)':'inherit'}">${money(h.pendiente)}</b></div></div>`:''}
    <div class="form">
      <div class="fieldset-title">Datos personales</div>
      ${F('nombre','Nombre',e.nombre,'text','required autocomplete="off"')}
      ${F('apellido','Apellido',e.apellido,'text','autocomplete="off"')}
      ${F('hc','N.º de historia clínica',e.hc)}
      ${F('dni','DNI',e.dni,'text','inputmode="numeric"')}
      ${F('telefono','Teléfono',e.telefono,'tel')}
      ${F('email','Email',e.email,'email')}
      ${F('fechaDerivacion','Fecha de derivación o inicio',e.fechaDerivacion,'date')}
      <div class="fieldset-title">Tratamiento</div>
      ${Sel('estado','Estado','estadosPaciente',e.estado)}
      <div class="field full libera-box" id="liberaBox" ${liberaVisible(e)?'':'hidden'}>
        <label for="pf_fechaFin" id="liberaLbl">${liberaLabel(e.estado)}</label>
        <input class="input" type="date" id="pf_fechaFin" name="fechaFin" value="${esc(e.fechaFin||TODAY)}" max="${addDays(TODAY,365)}">
        <p class="hint">Al guardar, la app te muestra qué horarios se liberan y qué sesiones se quitan de la agenda, y te pide confirmar.</p>
      </div>
      ${Sel('modalidad','Modalidad','modalidades',e.modalidad)}
      ${Sel('institucion','Institución o derivación','instituciones',e.institucion)}
      ${Sel('legajo','Legajo','legajos',e.legajo,'Sin especificar')}
      <div class="field"><label>Supervisión</label><label class="check"><input type="checkbox" name="supervisa" ${e.supervisa?'checked':''}>Se supervisa el caso</label></div>
      <div class="fieldset-title">Cobro</div>
      ${F('honorario','Honorario por sesión',e.honorario,'number','min="0" step="100"')}
      ${F('prepaga','Obra social o prepaga',e.prepaga,'text','placeholder="Ej.: Osde Flux" autocomplete="off"')}
      ${F('afiliado','Número de afiliado',e.afiliado,'text','autocomplete="off"')}
      ${Sel('medioPago','Medio de pago habitual','mediosPago',e.medioPago,'Sin especificar')}
      ${Sel('facturacion','Facturación','facturacion',e.facturacion,'Sin especificar')}
      <p class="hint full">Cambiar el honorario no modifica las sesiones que ya marcaste.</p>
      <div class="fieldset-title">Horario habitual</div>
      <div class="full" id="horarios">${(e.horarios||[]).map((h,i)=>`<div class="hor-row" data-i="${i}" data-hid="${esc(h.id||'')}">
        <div class="field"><label>Día</label><select class="select" name="h_dia">${DIAS.map((d,di)=>`<option value="${di+1}"${Number(h.dia)===di+1?' selected':''}>${d}</option>`).join('')}</select></div>
        <div class="field"><label>Hora</label><input class="input" type="time" name="h_hora" value="${esc(h.hora||'')}"></div>
        <div class="field"><label>Minutos</label><input class="input" type="number" min="10" step="5" name="h_dur" value="${esc(h.duracion||defDur())}"></div>
        <div class="field"><label>Frecuencia</label><select class="select" name="h_frec">${options('frecuencias',h.frecuencia)}</select></div>
        <div class="field"><label>Desde</label><input class="input" type="date" name="h_desde" value="${esc(h.desde||'')}"></div>
        <button class="btn danger icon" data-a="hor-del" data-i="${i}" aria-label="Quitar horario">✕</button></div>`).join('')||'<p class="hint">Sin horario fijo. Podés agregar sesiones sueltas desde la agenda.</p>'}
        <button class="btn" data-a="hor-add">Agregar horario</button>
        <p class="hint" style="margin-top:8px">Si cambiás o quitás un horario, el cambio rige desde hoy: las sesiones anteriores quedan como estaban. En quincenal, "Desde" marca la semana de la primera sesión.</p>
        ${closed.length?`<div class="closed-h"><p class="hint" style="margin:10px 0 6px">Horarios anteriores:</p>${closed.map(x=>`<div class="closed-row"><span>${DIAS_C[x.dia-1]} ${esc(x.hora)}, ${(item('frecuencias',x.frecuencia)?.nombre||'').toLowerCase()}, hasta el ${fmtShort(x.hasta)}</span>${(e.horarios||[]).some(h=>h.reabiertoDe===x.id)?'<span class="muted small">Reabierto</span>':`<button class="btn sm" data-a="hor-reopen" data-hid="${esc(x.id)}">Reabrir horario</button>`}</div>`).join('')}</div>`:''}</div>
      ${e.isNew?'':compSection(e.id)}
      <div class="fieldset-title">Observaciones</div>
      <div class="field full"><textarea class="input" name="observaciones" aria-label="Observaciones">${esc(e.observaciones||'')}</textarea></div>
    </div></div>
  <div class="dlg-foot"><div>${e.isNew?'':'<button class="btn danger" data-a="pac-del">Eliminar paciente</button>'}</div>
    <div class="btn-group"><button class="btn" data-a="dlg-close">Cancelar</button><button class="btn primary" data-a="pac-save">${e.isNew?'Crear paciente':'Guardar cambios'}</button></div></div>`);
}
const liberaEst=id=>!!item('estadosPaciente',id)?.libera;
function liberaVisible(e){const o=e.isNew?null:pat(e.id);return !e.isNew&&liberaEst(e.estado)&&!(o&&liberaEst(o.estado))}
function liberaLabel(est){return est==='alta_abandono'?'¿Desde qué fecha dejó de venir?':'¿Desde qué fecha termina el tratamiento?'}
/* Plan para liberar la agenda de un paciente desde una fecha */
function planLibera(p,desde){
  const now=nowHM();
  const fut=s=>s.fecha>TODAY||(s.fecha===TODAY&&(s.hora||'')>now);
  const abiertos=(p.horarios||[]).filter(h=>h.hora&&(!h.hasta||h.hasta>=desde));
  const hasta=TODAY>addDays(desde,90)?TODAY:addDays(desde,90);
  const ses=sessionsInRange(desde<TODAY?desde:TODAY,addDays(hasta,120)).filter(s=>s.pid===p.id&&s.fecha>=desde);
  const pagada=s=>item('estadosPago',s.pago)?.tipo==='cobrado';
  const intermedias=ses.filter(s=>!fut(s)&&s.estado==='programada'&&!pagada(s));
  const futGuardadas=ses.filter(s=>fut(s)&&!s.virtual&&!pagada(s));
  const futHoy=ses.filter(s=>fut(s)&&s.virtual&&s.fecha===TODAY);
  const conservadas=ses.filter(s=>pagada(s)&&s.fecha>=desde&&(fut(s)||s.estado==='programada'));
  return {desde,abiertos,intermedias,futGuardadas,futHoy,conservadas};
}
async function aplicarLibera(p,orig,plan){
  const prevPat=JSON.parse(JSON.stringify(orig));const backups=new Map();
  const toca=s=>{if(!backups.has(s.id)){const prev=findSession(s.id);backups.set(s.id,{prev:prev?JSON.parse(JSON.stringify(prev)):null,fecha:s.fecha})}};
  const abandono=p.estado==='alta_abandono';
  for(const s of plan.intermedias){toca(s);
    if(abandono&&item('estadosSesion','cancelo_paciente')) saveSession({...s,estado:'cancelo_paciente',cobrar:false,nota:((s.nota||'')+' Alta por abandono.').trim()});
    else saveSession({...s,oculta:true});}
  for(const s of plan.futGuardadas){toca(s);if(s.extra)deleteSession(s);else saveSession({...s,oculta:true})}
  for(const s of plan.futHoy){toca(s);saveSession({...s,oculta:true})}
  const corte=addDays(plan.desde,-1);
  p.horarios=(p.horarios||[]).map(h=>h.hora&&(!h.hasta||h.hasta>=plan.desde)?{...h,hasta:corte}:h);
  p.fechaFin=plan.desde;
  return ()=>{
    for(const [id,b] of backups){if(b.prev)saveSession(b.prev);else deleteSession({id,fecha:b.fecha})}
    const i=S.patients.findIndex(x=>x.id===prevPat.id);if(i>=0)S.patients[i]=prevPat;savePatients();render();toast('Cambios deshechos');
  };
}
function readPacForm(){
  const f=document.getElementById('pac-form');if(!f) return;const e=S.edit;
  f.querySelectorAll('[name]').forEach(el=>{
    if(el.name.startsWith('h_')) return;
    if(el.name==='fechaFin'&&document.getElementById('liberaBox')?.hidden) return;
    e[el.name]=el.type==='checkbox'?el.checked:(el.type==='number'?(el.value===''?'':Number(el.value)):el.value.trim());
  });
  e.horarios=[...f.querySelectorAll('.hor-row')].map(r=>{
    const prev=(e.horarios||[]).find(h=>h.id===r.dataset.hid)||{};
    return {...prev,id:r.dataset.hid||'h_'+uid(),dia:Number(r.querySelector('[name=h_dia]').value),hora:r.querySelector('[name=h_hora]').value,
      duracion:Number(r.querySelector('[name=h_dur]').value||defDur()),frecuencia:r.querySelector('[name=h_frec]').value,desde:r.querySelector('[name=h_desde]').value};
  });
}
function mergeHorarios(origH,edited){
  const y=addDays(TODAY,-1);const out=[];let split=false;
  for(const o of origH){
    if(o.hasta&&o.hasta<TODAY){out.push(o);continue}
    const e=edited.find(x=>x.id===o.id);
    const started=(o.desde||'0000-00-00')<TODAY;
    if(!e){if(started){out.push({...o,hasta:y});split=true}continue}
    const changed=['dia','hora','frecuencia','duracion'].some(k=>String(e[k]??'')!==String(o[k]??''));
    if(changed&&started){
      out.push({...o,hasta:y});split=true;
      const n={...e,id:'h_'+uid(),desde:e.desde&&e.desde>TODAY?e.desde:TODAY};
      if(e.frecuencia===o.frecuencia) n.ancla=o.ancla||o.desde; else delete n.ancla;
      delete n.hasta;out.push(n);
    } else out.push({...o,...e});
  }
  for(const e of edited) if(!origH.find(o=>o.id===e.id)) out.push(e);
  return {horarios:out,split};
}

/* ============ Eventos ============ */
let toastT;
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600)}
const val=id=>document.getElementById(id)?.value;
let suppressClick=false;

document.addEventListener('click',async ev=>{
  if(suppressClick){suppressClick=false;ev.preventDefault();return}
  if(ev.target.closest('select,textarea,input')) return;
  if(LOCK.flow&&!ev.target.closest('#lock')&&!ev.target.closest('#confirm')) return;
  const a=ev.target.closest('[data-a]');
  if(!pop().hidden&&!ev.target.closest('#pop,dialog,#offer')){closePop();if(!a||!['open-ses','set-pago','ses-done','goto-ses','ses-pay','comp-add','comp-view'].includes(a.dataset.a))return}
  if(!a) return;
  const act=a.dataset.a;
  switch(act){
    case 'nav': if(dlg.open)closeDlg();if(!pop().hidden)closePop();S.view=a.dataset.v;render();window.scrollTo(0,0);break;
    case 'ag-view': S.ag=a.dataset.v;render();break;
    case 'ag-nav':{const n=Number(a.dataset.n);
      if(!n) S.cursor=TODAY; else if(S.ag==='dia') S.cursor=addDays(S.cursor,n); else if(S.ag==='semana') S.cursor=addDays(S.cursor,7*n); else S.cursor=addMonths(monthKey(S.cursor),n)+'-01';
      render();break}
    case 'goto-day': S.ag='dia';S.cursor=a.dataset.d;render();break;
    case 'grid-add':{
      if(!S.patients.length){toast('Primero creá un paciente');S.view='pacientes';render();break}
      const r=a.getBoundingClientRect();const ini=Number(a.dataset.ini);const px=Number(a.dataset.px||PX);
      const mins=Math.max(0,Math.round(((ev.clientY-r.top)/px)/15)*15)+ini*60;
      newSesDialog(a.dataset.d,fromMin(Math.min(mins,23*60+45)));break}
    case 'wk-month':{const n=Number(a.dataset.n);S.wkMonth=n?addMonths(S.wkMonth||monthKey(TODAY),n):monthKey(TODAY);S.wkSel=null;render();break}
    case 'wk-sel':{S.wkSel=a.dataset.d;render();document.querySelector('.wk-detail-head')?.scrollIntoView({block:'start'});break}
    case 'wk-step':{const d=addDays(S.wkSel,7*Number(a.dataset.n));const m=monthKey(addDays(d,3));S.wkMonth=m;S.wkSel=d;render();break}
    case 'alerta-close': document.getElementById('alerta').close();break;
    case 'al-pay':{const s=S.visible[a.dataset.id]||findSession(a.dataset.id);if(!s)break;const saved=saveSession({...s,pago:firstCobrado()});render();renderAlerta();offerAttach(saved);break}
    case 'al-snooze':{const s=S.visible[a.dataset.id]||findSession(a.dataset.id);if(!s)break;saveSession({...s,alertaHasta:addDays(TODAY,3)});render();renderAlerta();toast('Te vuelvo a avisar en 3 días');break}
    case 'al-goto':{const s=S.visible[a.dataset.id]||findSession(a.dataset.id);document.getElementById('alerta').close();if(!s)break;S.view='agenda';S.cursor=s.fecha;render();focusSession(s.id);break}
    case 'alerta-open': checkOverdue(true);break;
    case 'pin-key': pinDigit(a.dataset.k);break;
    case 'pin-forgot': pinForgot();break;
    case 'pin-cancel': hideLock();break;
    case 'pin-on': startPinFlow('set1',()=>{hideLock();try{localStorage.setItem(LK_PIN_SUG,'1')}catch(e){}render();toast('PIN activado en este dispositivo')});break;
    case 'pin-change': startPinFlow('verify',()=>{LOCK.flow={mode:'set1',onDone:()=>{hideLock();render();toast('PIN cambiado')},err:''};LOCK.buf='';pinScreen()});break;
    case 'pin-off': startPinFlow('verify',()=>{pinSave(null);hideLock();render();toast('PIN desactivado en este dispositivo')});break;
    case 'pin-lock': lockNow();break;
    case 'pin-sug-no':{try{localStorage.setItem(LK_PIN_SUG,'1')}catch(e){}render();break}
    case 'sort':{const k=a.dataset.t,i=Number(a.dataset.i);const cur=S.sort[k];
      S.sort[k]=!cur||cur.i!==i?{i,dir:1}:cur.dir===1?{i,dir:-1}:null;render();
      document.querySelector(`[data-a="sort"][data-t="${k}"][data-i="${i}"]`)?.focus();break}
    case 'fer-year':{S.ferYear=(S.ferYear||Number(TODAY.slice(0,4)))+Number(a.dataset.n);render();break}
    case 'fer-off':{const g=S.config.general;g.feriadosQuitados=[...new Set([...(g.feriadosQuitados||[]),a.dataset.f])];saveConfig();render();toast('Feriado quitado');break}
    case 'fer-back':{const g=S.config.general;g.feriadosQuitados=(g.feriadosQuitados||[]).filter(f=>f!==a.dataset.f);saveConfig();render();break}
    case 'fer-del':{const g=S.config.general;g.feriadosExtra=(g.feriadosExtra||[]).filter(f=>f.fecha!==a.dataset.f);saveConfig();render();toast('Feriado eliminado');break}
    case 'fer-add':{const fecha=val('ferFecha'),nombre=val('ferNombre').trim()||'Feriado',tipo=val('ferTipo');
      if(!fecha){toast('Elegí la fecha');break}
      const g=S.config.general;g.feriadosExtra=[...(g.feriadosExtra||[]).filter(f=>f.fecha!==fecha),{fecha,nombre,tipo}];S.ferYear=Number(fecha.slice(0,4));saveConfig();render();toast('Feriado agregado');break}
    case 'fac-test':{S.facPrueba={cargando:true};render();
      try{S.facPrueba=await llamarServidor({accion:'estado',ptoVta:Number(facCfg().ptoVta)||1});if(S.facPrueba.entorno&&S.facPrueba.entorno!==S.config.general.facturacion?.entorno){S.config.general.facturacion={...facCfg(),entorno:S.facPrueba.entorno};saveConfig()}}catch(e){S.facPrueba={error:e.message}}
      if(S.view==='config')render();break}
    case 'fac-mes':{const n=Number(a.dataset.n);S.facMes=n?addMonths(S.facMes||monthKey(TODAY),n):monthKey(TODAY);render();break}
    case 'fac-prev': facPreview(a.dataset.pid);break;
    case 'fac-emit': facEmitir();break;
    case 'fac-pdf':{const f=facturaPorId(a.dataset.id);if(f)descargarPDF({...f,firma:S.firma});break}
    case 'fac-send': facSendDialog(a.dataset.id);break;
    case 'fac-share': facShare();break;
    case 'fac-wa':{const t=document.getElementById('waMsg')?.value;const f=facturaPorId(S.facSend?.id);const num=waNum(pat(f?.pid));if(num&&t!=null)a.href=`https://wa.me/${num}?text=${encodeURIComponent(t)}`;
      if(f&&!f.enviadaEl){await marcarEnviada(f.id||f.clave,TODAY);toast('Marcada como enviada. Si al final no la enviaste, podés quitar la marca.')}break}
    case 'fac-sent':{await marcarEnviada(S.facSend?.id,TODAY);closeDlg();render();toast('Marcada como enviada');break}
    case 'fac-unsent':{await marcarEnviada(S.facSend?.id,null);closeDlg();render();break}
    case 'fac-ejemplo': descargarPDF(facturaEjemplo(Number(a.dataset.t||11)));break;
    case 'firma-del':{S.firma='';Store.save('firma',{data:''});render();toast('Firma quitada');break}
    case 'caja-view': S.cajaV=a.dataset.v;render();break;
    case 'caja-nav':{const n=Number(a.dataset.n);const c=S.cajaCur||TODAY;
      S.cajaCur=!n?TODAY:S.cajaV==='dia'?addDays(c,n):S.cajaV==='semana'?addDays(c,7*n):addMonths(monthKey(c),n)+'-01';render();break}
    case 'caja-day': S.cajaV='dia';S.cajaCur=a.dataset.d;render();window.scrollTo(0,0);break;
    case 'caja-go': S.view='caja';S.cajaV=a.dataset.v;S.cajaCur=a.dataset.d;render();window.scrollTo(0,0);break;
    case 'caja-agenda': S.view='agenda';S.ag='dia';S.cursor=a.dataset.d;render();window.scrollTo(0,0);break;
    case 'month':{const n=Number(a.dataset.n);S.month=n?addMonths(S.month,n):monthKey(TODAY);render();break}
    case 'open-ses':{const s=S.visible[a.dataset.id];if(s) openPop(s,a.closest('.blk,.mitem,.side-row')||a);break}
    case 'pop-close': closePop();break;
    case 'goto-ses':{
      const s=S.visible[a.dataset.id]||findSession(a.dataset.id);if(!s)break;
      if(!pop().hidden)closePop();
      S.cursor=s.fecha;render();focusSession(s.id);break}
    case 'pop-done':{const s=S.visible[S.popId]||findSession(S.popId);if(!s)break;S.visible[s.id]=markDone(s);render();renderPop();toast('Realizada y pagada');break}
    case 'pop-more':{const s=S.visible[S.popId]||findSession(S.popId);closePop();if(s){S.edit={...s};sesSheet()}break}
    case 'panel-toggle':{const cur=S.config.general.panel??(window.innerWidth>=760);S.config.general.panel=!cur;saveConfig();render();break}
    case 'ses-done':{const s=S.visible[a.dataset.id];if(!s)break;saveSession({...s,estado:realizadaId()});render();toast('Sesión marcada como realizada');break}
    case 'reg-estado':{const s=S.visible[a.dataset.id]||findSession(a.dataset.id);if(!s)break;regEstado(s,a.dataset.v);break}
    case 'reg-pago':{const s=S.visible[a.dataset.id]||findSession(a.dataset.id);if(!s)break;saveSession({...s,pago:a.dataset.v});S.awaitPay.delete(s.id);render();
      toast(item('estadosPago',a.dataset.v)?.tipo==='cobrado'?'Registrada: realizada y pagada':'Registrada. Quedó en "Pendientes de pago".');break}
    case 'reg-undo':{const s=S.visible[a.dataset.id]||findSession(a.dataset.id);if(!s)break;S.awaitPay.delete(s.id);saveSession({...s,estado:'programada'});render();break}
    case 'login': doLogin();break;
    case 'logout': doLogout();break;
    case 'reload': location.reload();break;
    case 'look':{S.config.general[a.dataset.k]=a.dataset.v;saveConfig();render();break}
    case 'set-cobrar':{const s=(S.edit&&S.edit.id===a.dataset.id&&dlg.open)?S.edit:(S.visible[a.dataset.id]||findSession(a.dataset.id));if(!s)break;
      const pendId=list('estadosPago').find(x=>x.tipo==='pendiente')?.id||'pendiente';const saved=saveSession({...s,cobrar:a.dataset.v==='1',...(a.dataset.v==='1'?{}:{pago:pendId})});
      if(dlg.open&&S.edit?.id===saved.id){S.edit=saved;sesSheet();break}
      render();S.visible[saved.id]=saved;if(S.popId===saved.id)renderPop();
      toast(a.dataset.v==='1'?'Esta sesión se cobra. Quedó en "Pendientes de pago".':'Esta sesión no se cobra');break}
    case 'set-pago':{const s=S.visible[a.dataset.id]||findSession(a.dataset.id);if(!s)break;const saved=saveSession({...s,pago:a.dataset.v});render();S.visible[saved.id]=saved;if(S.popId===saved.id)renderPop();if(item('estadosPago',a.dataset.v)?.tipo==='cobrado'){if(S.popId!==saved.id)offerAttach(saved)}else toast(`Pago: ${item('estadosPago',a.dataset.v)?.nombre||''}`);break}
    case 'ses-debe':{const s=S.visible[a.dataset.id];if(!s)break;saveSession({...s,estado:realizadaId(),pago:'pendiente'});render();toast('Realizada, queda pendiente el pago');break}
    case 'ses-pay':{const s=S.visible[a.dataset.id];if(!s)break;const saved=saveSession({...s,pago:firstCobrado()});render();offerAttach(saved);break}
    case 'pay-all':{const ss=debtList().filter(s=>s.pid===a.dataset.pid);ss.forEach(s=>saveSession({...s,pago:firstCobrado()}));render();toast(`${ss.length} sesiones marcadas como pagadas`);break}
    case 'all-done':{
      const um=unmarkedList();
      const ok=await confirmBox('Registrar todas como realizadas',`Las ${um.length} sesiones quedan como realizadas y pendientes de pago. Después marcás los pagos en "Pendientes de pago".`,'Registrar',false);
      if(!ok)break;um.forEach(s=>saveSession({...s,estado:realizadaId()}));render();toast('Sesiones marcadas como realizadas');break}
    case 'sheet-done':{markDone(S.edit);closeDlg();toast('Realizada y pagada');break}
    case 'sheet-set':{S.edit=saveSession({...S.edit,[a.dataset.f]:a.dataset.v});sesSheet();renderNav();break}
    case 'comp-add': pickFile(a.dataset.pid,a.dataset.sid);break;
    case 'comp-add-pac': pickFile(a.dataset.pid,document.getElementById('compSes')?.value||null);break;
    case 'comp-view': viewComp(a.dataset.id);break;
    case 'comp-del': deleteComp(a.dataset.id);break;
    case 'viewer-close': document.getElementById('viewer').close();break;
    case 'offer-close': closeOffer();break;
    case 'sheet-save':{
      const e=S.edit;const s={...e};
      if(e.extra){s.fecha=val('f_fecha')||e.fecha;s.hora=val('f_hora')||e.hora}
      s.medio=val('f_medio');s.nota=val('f_nota').trim();if(val('f_pagado'))s.pagadoEl=val('f_pagado');const mv=val('f_monto');s.monto=mv===''?null:Number(mv);
      if(e.extra&&monthKey(s.fecha)!==monthKey(e.fecha)) deleteSession(e);
      saveSession(s);closeDlg();toast('Cambios guardados');break}
    case 'new-save':{
      const hora=val('f_hora');if(!hora){toast('Elegí la hora de la sesión');document.getElementById('f_hora').focus();break}
      const mv=val('f_monto');
      saveSession({id:S.edit.id,pid:val('f_pid'),fecha:val('f_fecha'),hora,dur:Number(val('f_dur')||defDur()),estado:val('f_estado'),pago:val('f_pago'),
        monto:mv===''?null:Number(mv),nota:val('f_nota').trim(),extra:true});
      closeDlg();toast('Sesión agregada');break}
    case 'dlg-close': closeDlg();break;
    case 'ses-hide':{
      const e=S.edit;
      const ok=await confirmBox(e.extra?'Eliminar sesión':'Quitar de la agenda',e.extra?'La sesión se borra de la agenda y de la caja.':'Esta sesión deja de aparecer en la agenda y en la caja. El horario habitual del paciente no cambia.',e.extra?'Eliminar':'Quitar');
      if(!ok) break;
      if(e.extra) deleteSession(e); else saveSession({...e,oculta:true});
      closeDlg();toast(e.extra?'Sesión eliminada':'Sesión quitada de la agenda');break}
    case 'ses-reprog':{const r=document.getElementById('reprog');if(r){r.hidden=!r.hidden;if(!r.hidden)document.getElementById('r_fecha').focus()}break}
    case 'ses-reprog-save':{
      const nf=val('r_fecha'),nh=val('r_hora');if(!nf||!nh){toast('Elegí la nueva fecha y hora');break}
      moveSession(S.edit,nf,nh);closeDlg();toast('Sesión reprogramada');break}
    case 'pac-new': pacDialog(null);break;
    case 'pac-open': pacDialog(pat(a.dataset.id));break;
    case 'hor-add': readPacForm();S.edit.horarios.push({id:'h_'+uid(),dia:1,hora:'',duracion:defDur(),frecuencia:list('frecuencias')[0]?.id||'',desde:TODAY});renderPacDialog();break;
    case 'hor-del': readPacForm();S.edit.horarios.splice(Number(a.dataset.i),1);renderPacDialog();break;
    case 'pac-save':{
      readPacForm();const e=S.edit;if(!e.nombre){toast('Escribí el nombre del paciente');document.getElementById('pf_nombre')?.focus();break}
      const p={...e};delete p.isNew;
      const edited=(p.horarios||[]).filter(h=>h.hora);
      const orig=pat(p.id);const {horarios,split}=mergeHorarios(orig?.horarios||[],edited);p.horarios=horarios;
      let deshacer=null;
      const transicion=orig&&liberaEst(p.estado)&&!liberaEst(orig.estado);if(!transicion&&orig)p.fechaFin=orig.fechaFin;
      if(orig&&liberaEst(p.estado)&&!liberaEst(orig.estado)){
        const desde=p.fechaFin||TODAY;const pl=planLibera({...p,horarios:orig.horarios},desde);
        const hs=pl.abiertos.map(x=>`${DIAS_C[x.dia-1]} ${x.hora} ${(item('frecuencias',x.frecuencia)?.nombre||'').toLowerCase()}`);
        const lineas=[
          `${item('estadosPaciente',p.estado)?.nombre} de ${fullName(p)}, desde el ${fmtShort(desde)}.`,
          hs.length?`Se liberan sus horarios: ${hs.join('; ')}.`:'No tiene horarios habituales abiertos.',
          pl.intermedias.length?`${pl.intermedias.length} ${pl.intermedias.length===1?'sesión sin registrar':'sesiones sin registrar'} desde esa fecha ${p.estado==='alta_abandono'?'se marcan como "Canceló paciente" (no se cobra)':'se quitan de la agenda'}.`:'',
          (()=>{const n=pl.futGuardadas.length+pl.futHoy.length;return n?(n===1?'Se quita 1 sesión futura ya cargada.':`Se quitan ${n} sesiones futuras ya cargadas.`):''})(),
          pl.conservadas.length?`${pl.conservadas.length} ${pl.conservadas.length===1?'sesión pagada por adelantado queda':'sesiones pagadas por adelantado quedan'} en la agenda para que decidas qué hacer con el pago.`:'',
          'El pasado registrado (sesiones atendidas, pagos y deudas) no se modifica.'].filter(Boolean).join(' ');
        const ok=await confirmBox('Liberar la agenda',lineas,'Confirmar',false);
        if(!ok)break;
        p.horarios=orig.horarios;deshacer=await aplicarLibera(p,orig,pl);
      }
      const i=S.patients.findIndex(x=>x.id===p.id);if(i>=0)S.patients[i]=p;else S.patients.push(p);
      savePatients();closeDlg();
      if(deshacer){render();toastUndo(`Agenda de ${fullName(p)} liberada.`,deshacer)}
      else toast(e.isNew?'Paciente creado':split?'Ficha actualizada. El nuevo horario rige desde hoy.':'Ficha actualizada');break}
    case 'hor-reopen':{readPacForm();const o=pat(S.edit.id);const x=(o?.horarios||[]).find(h=>h.id===a.dataset.hid);if(!x)break;
      const n={...x,id:'h_'+uid(),desde:TODAY,ancla:x.ancla||x.desde,reabiertoDe:x.id};delete n.hasta;S.edit.horarios.push(n);
      if(!item('estadosPaciente',S.edit.estado)?.agenda){const act=list('estadosPaciente').find(s=>s.agenda);if(act)S.edit.estado=act.id}
      renderPacDialog();toast('Horario reabierto desde hoy. Revisalo y tocá "Guardar cambios".');break}
    case 'pac-del':{
      const e=S.edit;
      const ok=await confirmBox('Mover a la papelera',`La ficha de ${fullName(e)} se mueve a la papelera, con sus sesiones y comprobantes, y deja de aparecer en la agenda y en la caja. La podés restaurar desde Configuración > Papelera. Si terminó el tratamiento, conviene cambiar su estado a un alta en lugar de eliminarla.`,'Mover a la papelera');
      if(!ok) break;
      const pp=pat(e.id);if(pp){pp.eliminado=true;pp.eliminadoEl=TODAY;savePatients()}
      closeDlg();toastUndo(`${fullName(e)} se movió a la papelera.`,()=>{const q=pat(e.id);if(q){delete q.eliminado;delete q.eliminadoEl;savePatients();render();toast('Paciente restaurado')}});break}
    case 'trash-restore':{const q=pat(a.dataset.id);if(q){delete q.eliminado;delete q.eliminadoEl;savePatients();render();toast(`${fullName(q)} volvió a la lista de pacientes`)}break}
    case 'trash-purge':{const q=pat(a.dataset.id);if(!q)break;
      const ok=await typedConfirm('Eliminar definitivamente',`Se borran para siempre la ficha de ${fullName(q)}, todas sus sesiones y sus comprobantes. Esta acción no se puede deshacer, salvo restaurando una copia de seguridad anterior.`,'ELIMINAR','Eliminar definitivamente');
      if(!ok)break;makeBackup('Antes de eliminar un paciente');purgePatient(q.id);render();toast('Paciente eliminado definitivamente');break}
    case 'bk-now':{const r=makeBackup('Manual');render();toast(r?'Copia guardada en la nube':'No se pudo hacer la copia');break}
    case 'bk-restore': restoreBackup(a.dataset.id);break;
    case 'dl-later':{try{localStorage.setItem(LK_POSP,addDays(TODAY,7))}catch(e){}render();break}
    case 'undo':{const f=S.undoFn;S.undoFn=null;closeOffer();if(f)f();break}
    case 'gasto-add':{
      const monto=Number(val('g_monto'));const fecha=val('g_fecha');
      if(!fecha||!monto){toast('Completá la fecha y el monto');break}
      S.gastos.push({id:uid(),fecha,categoria:val('g_cat'),descripcion:val('g_desc').trim(),medio:val('g_medio'),monto});
      saveGastos();if(monthKey(fecha)!==S.month)S.month=monthKey(fecha);render();toast('Gasto agregado');break}
    case 'gasto-del':{const g=S.gastos.find(x=>x.id===a.dataset.id);if(!g)break;S.gastos=S.gastos.filter(x=>x.id!==g.id);saveGastos();render();
      toastUndo('Gasto eliminado.',()=>{S.gastos.push(g);saveGastos();render();toast('Gasto restaurado')});break}
    case 'gasto-copy':{
      const prev=gastosMes(addMonths(S.month,-1));
      for(const g of prev){const day=Math.min(Number(g.fecha.slice(8)),Number(lastOfMonth(S.month).slice(8)));S.gastos.push({...g,id:uid(),fecha:`${S.month}-${pad(day)}`})}
      saveGastos();render();toast(`Se copiaron ${prev.length} gastos. Revisá los montos.`);break}
    case 'cfg-add':{
      const k=a.dataset.list;const inp=document.getElementById('add_'+k);const nombre=inp.value.trim();if(!nombre){inp.focus();break}
      const L=LISTS.find(x=>x.key===k);const ni={id:'c_'+uid(),nombre};
      if(L.color) ni.color='#6D7F99';
      for(const x of (L.extra||[])) ni[x.k]=x.type==='bool'?false:x.type==='number'?(x.k==='semanas'?1:0):x.opts[0][0];
      S.config.lists[k].push(ni);saveConfig();render();document.getElementById('add_'+k)?.focus();toast(`"${nombre}" agregado`);break}
    case 'cfg-del':{
      const k=a.dataset.list,id=a.dataset.id;const i=item(k,id);
      const ok=await confirmBox('Eliminar opción',`¿Eliminar "${i?.nombre}"? Los registros que lo usan van a mostrar "(eliminado)" hasta que les elijas otra opción.`,'Eliminar');
      if(!ok) break;
      S.config.lists[k]=list(k).filter(x=>x.id!==id);saveConfig();render();break}
    case 'export':{
      if(Store.fb){downloadBackup();render();break}
      const docs={config:S.config,patients:{items:S.patients},gastos:{items:S.gastos},comprobantes:{items:S.comps},...S.ses};
      const data=JSON.stringify({app:'consultorio',version:2,exportado:TODAY,docs},null,2);
      const filename=`consultorio-copia-${TODAY}.json`;
      if(S.downloads){try{await S.downloads.save({filename,data})}catch(e){if(e?.code!=='cancelled')toast('No se pudo descargar la copia.')}}
      else{const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const l=document.createElement('a');l.href=url;l.download=filename;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
      break}
    case 'reset':{
      const ok=await typedConfirm('Borrar todos los datos',`Se eliminan pacientes, sesiones, gastos, comprobantes y configuración${Store.fb?' para todas las cuentas autorizadas':''}.${Store.fb?' Antes de borrar se guarda una copia de seguridad en la nube, desde la que podés recuperar todo.':' Esta acción no se puede deshacer.'}`,'BORRAR','Borrar todo');
      if(!ok) break;
      makeBackup('Antes de borrar todo');
      const ids=['config','patients','gastos','comprobantes',...Object.keys(S.ses)];
      S.comps=[];
      S.ses={};S.patients=[];S.gastos=[];S.config=defaultConfig();
      for(const id of ids) await Store.remove(id);
      saveConfig();render();toast('Datos borrados');break}
  }
});

document.addEventListener('change',async ev=>{
  if(ev.target.id==='pf_estado'&&S.edit){const box=document.getElementById('liberaBox');if(box){const o=pat(S.edit.id);const v=ev.target.value;box.hidden=!(!S.edit.isNew&&liberaEst(v)&&!(o&&liberaEst(o.estado)));document.getElementById('liberaLbl').textContent=liberaLabel(v)}}
  const el=ev.target.closest('[data-c]');if(!el) return;
  const c=el.dataset.c;
  if(c==='reg-estado'){const s=S.visible[el.dataset.id]||findSession(el.dataset.id);if(s&&el.value)regEstado(s,el.value);return}
  if(c==='pop-field'){const s=S.visible[S.popId]||findSession(S.popId);if(!s)return;const saved=saveSession({...s,[el.dataset.f]:el.value});render();S.visible[saved.id]=saved;renderPop();renderNav();return}
  if(c==='ses-field'){const s=S.visible[el.dataset.id];if(!s||!el.value)return;saveSession({...s,[el.dataset.f]:el.value});render();toast('Sesión actualizada')}
  else if(c==='pac-f'){S.filtroEstado=el.value;render()}
  else if(c==='pin-min'||c==='pin-salir'){const p=pinCfg();if(p){if(c==='pin-min')p.min=Number(el.value);else p.alSalir=el.checked;pinSave(p);toast('Guardado')}}
  else if(c==='fac'){const g=S.config.general;g.facturacion={...facCfg(),[el.dataset.k]:el.dataset.k==='ptoVta'?Math.max(1,Number(el.value)||1):el.value.trim()};saveConfig();S.facPrueba=null}
  else if(c==='emisor'){const g=S.config.general;g.emisor={...emisorCfg(),[el.dataset.k]:el.value.trim()};saveConfig()}
  else if(c==='firma'){cargarFirma(el.files?.[0]);el.value=''}
  else if(c==='gen'){const k=el.dataset.k;S.config.general[k]=el.type==='checkbox'?el.checked:el.dataset.num?Number(el.value):el.value.trim();saveConfig();renderNav();applyLook();if(el.dataset.k==='feriadosAuto')render()}
  else if(c==='cfg'){
    const i=item(el.dataset.list,el.dataset.id);if(!i)return;const k=el.dataset.k;
    if(k==='nombre'){const v=el.value.trim();if(!v){el.value=i.nombre;return}i.nombre=v}
    else i[k]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value||0):el.value;
    saveConfig();renderNav();
  }
  else if(c==='import'){
    const file=el.files?.[0];if(!file)return;
    try{
      const j=JSON.parse(await file.text());if(!j?.docs?.config) throw new Error();
      const ok=await confirmBox('Restaurar copia',`Se reemplazan todos los datos actuales por los de la copia del ${j.exportado||'archivo elegido'}.${Store.fb?' Antes se guarda una copia del estado actual en la nube.':''}`,'Restaurar');
      if(!ok){el.value='';return}
      makeBackup('Antes de restaurar desde archivo');
      for(const id of ['config','patients','gastos',...Object.keys(S.ses)]) if(!(id in j.docs)) await Store.remove(id);
      S.ses={};for(const [id,d] of Object.entries(j.docs)){applyDoc(id,d);Store.save(id,d)}
      render();toast('Copia restaurada');
    }catch(e){toast('El archivo no es una copia válida de esta aplicación.')}
    el.value='';
  }
});
document.getElementById('fileIn').addEventListener('change',ev=>{handleFile(ev.target.files?.[0])});
document.addEventListener('input',ev=>{
  const el=ev.target;
  if(el.dataset?.note){queueNote(el.dataset.note,el.value.trim());return}
  if(el.dataset?.c==='pac-q'){S.q=el.value;clearTimeout(S.qt);S.qt=setTimeout(()=>{const pos=el.selectionStart;render();const n=document.querySelector('[data-c="pac-q"]');if(n){n.focus();n.setSelectionRange(pos,pos)}},200)}
});
document.addEventListener('focusout',ev=>{const el=ev.target;if(el.dataset?.note&&noteTimers[el.dataset.note]){clearTimeout(noteTimers[el.dataset.note]);saveNote(el.dataset.note,el.value.trim())}});
window.addEventListener('resize',()=>{if(!pop().hidden)positionPop()});
document.addEventListener('keydown',ev=>{
  if(LOCK.flow){if(/^[0-9]$/.test(ev.key)){ev.preventDefault();pinDigit(ev.key)}else if(ev.key==='Backspace'){ev.preventDefault();pinDigit('del')}else if(ev.key==='Escape'&&LOCK.flow.mode!=='unlock'){hideLock()}return}
  const el=ev.target;
  if(ev.key==='Escape'&&!pop().hidden&&!dlg.open){closePop();return}
  if(ev.key==='Enter'&&el.dataset?.enter==='cfg-add'){ev.preventDefault();document.querySelector(`[data-a="cfg-add"][data-list="${el.dataset.list}"]`)?.click()}
  if((ev.key==='Enter'||ev.key===' ')&&el.getAttribute?.('role')==='button'&&el.dataset.a){ev.preventDefault();el.click()}
});

/* ---- Arrastrar para reprogramar (mouse) ---- */
let drag=null;
document.addEventListener('pointerdown',ev=>{
  const b=ev.target.closest('.blk');
  if(!b||ev.pointerType!=='mouse'||ev.button!==0||ev.target.closest('button,select,textarea,input'))return;
  const r=b.getBoundingClientRect();
  drag={b,id:b.dataset.id,x:ev.clientX,y:ev.clientY,offY:ev.clientY-r.top,moved:false,target:null};
});
document.addEventListener('pointermove',ev=>{
  if(!drag)return;
  if(!drag.moved){if(Math.hypot(ev.clientX-drag.x,ev.clientY-drag.y)<6)return;drag.moved=true;if(!pop().hidden)closePop();drag.b.classList.add('dragging');document.body.classList.add('is-dragging')}
  const col=document.elementsFromPoint(ev.clientX,ev.clientY).find(el=>el.classList?.contains('tcol'));
  if(!col)return;
  const r=col.getBoundingClientRect();const ini=Number(col.dataset.ini);const px=Number(col.dataset.px||PX);
  let mins=Math.round(((ev.clientY-drag.offY-r.top)/px)/15)*15+ini*60;
  mins=Math.max(ini*60,Math.min(mins,23*60+45));
  if(drag.b.parentElement!==col) col.appendChild(drag.b);
  drag.b.style.top=((mins-ini*60)*px)+'px';drag.b.style.left='2px';drag.b.style.width='calc(100% - 4px)';
  drag.target={fecha:col.dataset.d,hora:fromMin(mins)};
  const t=drag.b.querySelector('.bt');if(t)t.textContent=drag.target.hora;
});
document.addEventListener('pointerup',async ()=>{
  if(!drag)return;const d=drag;drag=null;
  if(!d.moved)return;
  suppressClick=true;setTimeout(()=>{suppressClick=false},0);
  document.body.classList.remove('is-dragging');
  const s=S.visible[d.id];
  if(!s||!d.target||(d.target.fecha===s.fecha&&d.target.hora===s.hora)){render();return}
  const p=pat(s.pid);
  const ok=await confirmBox('Reprogramar sesión',`¿Mover la sesión de ${fullName(p)||'este paciente'} al ${fmtLong(d.target.fecha)} a las ${d.target.hora}?`,'Reprogramar',false);
  if(ok){moveSession(s,d.target.fecha,d.target.hora);toast('Sesión reprogramada')}
  render();
});

/* ============ Inicio ============ */
(async function start(){
  {const r=document.documentElement;r.dataset.palette=r.dataset.palette||'rosa-salvia';r.dataset.font=r.dataset.font||'serena';r.dataset.textura='papel';}
  const docs=await Store.init();
  if(!docs.config){
    if(Store.fb){
      gate(null);
      const loc=Store.loadLocal();
      if(loc.config&&await confirmBox('Datos en este dispositivo','Encontramos datos cargados en este navegador de una versión anterior. ¿Querés subirlos a la nube para tenerlos en todos tus dispositivos?','Subir a la nube',false)){
        for(const [id,d] of Object.entries(loc)){
          if(id==='comprobantes'){for(const c of (d.items||[])){if(c.data){FB.fns.setDoc(FB.archivoRef(c.id),{data:c.data,pid:c.pid,tipo:c.tipo}).catch(()=>{});S.fileCache[c.id]=c.data;delete c.data;c.fileDoc=true}}}
          applyDoc(id,d);Store.save(id,d);
        }
        toast('Datos subidos a la nube');
      } else { S.config=defaultConfig();saveConfig(); }
    } else seedExample();
  }
  else { for(const [id,d] of Object.entries(docs)) applyDoc(id,d); }
  gate(null);
  setTimeout(autoBackup,3000);
  if(Store.fb&&FB.facturasCol){try{FB.fns.onSnapshot(FB.facturasCol(),snap=>{S.facturas=snap.docs.map(d=>({id:d.id,...d.data()}));if(S.view==='facturas'&&!S.dlgOpen)render()},()=>{})}catch(e){}}
  setTimeout(()=>checkOverdue(false),1500);
  setInterval(()=>{if(document.visibilityState==='visible')checkOverdue(false)},30*60*1000);
  S.ag=S.config.general.vistaInicial||(window.innerWidth<760?'dia':'semana');
  if(window.innerWidth<760&&S.ag==='semana') S.ag='dia';
  S.ready=true;render();
  pinInit();
  setInterval(()=>{const f=document.activeElement;if(!S.dlgOpen&&!drag&&pop().hidden&&!(f&&f.dataset?.note)&&S.view==='agenda'&&document.visibilityState==='visible')render()},5*60*1000);
})();


/* ============ App instalable (PWA) ============ */
if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})});
}
