/* =========================================================
   Servidor de Consultorio Psiconflor
   Una única función HTTP ("arca") que la app llama con la sesión de Google.
   ========================================================= */
const functions = require('@google-cloud/functions-framework');
const admin = require('firebase-admin');
const arca = require('./arca');

const ENV = process.env.ARCA_ENV === 'prod' ? 'prod' : 'homo';
const PROYECTO = process.env.PROJECT_ID;
const CONSULTORIO = process.env.CONSULTORIO || 'psiconflor';
const ORIGENES = (process.env.ORIGENES || 'https://sfloiacono.github.io').split(',').map(s => s.trim()).filter(Boolean);
const AUTORIZADOS = (process.env.AUTORIZADOS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const cert = () => (process.env.ARCA_CERT || '').trim();
const key = () => (process.env.ARCA_KEY || '').trim();

admin.initializeApp({ projectId: PROYECTO });
const db = admin.firestore();

class ErrorUsuario extends Error {}

/* Ticket de acceso: se guarda 12 h en Firestore (fuera de lo que la app puede leer) */
async function ticket() {
  const ref = db.doc(`servidor/arca-ta-${ENV}`);
  const snap = await ref.get();
  const t = snap.exists ? snap.data() : null;
  if (t && Date.parse(t.vence) - Date.now() > 5 * 60000) return t;
  try {
    const nuevo = await arca.loginCms(ENV, cert(), key());
    await ref.set(nuevo);
    return nuevo;
  } catch (e) {
    if (/ya posee un TA valido/i.test(e.message)) {
      throw new ErrorUsuario('ARCA indica que ya hay un acceso vigente que este servidor no tiene guardado. Esperá unos minutos (como máximo 12 horas) e intentá de nuevo.');
    }
    throw e;
  }
}

async function estado(datos) {
  const out = { entorno: ENV };
  const c = arca.cuitDelCertificado(cert());
  out.cuit = c.cuit;
  out.certificadoVence = c.vence;
  out.arca = await arca.dummy(ENV);
  const t = await ticket();
  out.accesoVence = t.vence;
  const pto = Number(datos.ptoVta || 1);
  out.ptoVta = pto;
  out.ultimoNumero = await arca.ultimoComprobante(ENV, t, c.cuit, pto, 11);
  out.ultimoRecibo = await arca.ultimoComprobante(ENV, t, c.cuit, pto, 15);
  return out;
}

const fechaOK = s => /^\d{8}$/.test(String(s || ''));

async function emitir(datos, usuario) {
  const pto = Number(datos.ptoVta);
  const importe = Number(datos.importe);
  const docTipo = Number(datos.docTipo);
  const docNro = String(datos.docNro || '0').replace(/\D/g, '') || '0';
  const condIva = Number(datos.condIva || 5);
  const clave = String(datos.clave || '').replace(/[^\w\-]/g, '').slice(0, 120);
  const tipo = Number(datos.tipo || 11);
  if (![11, 15].includes(tipo)) throw new ErrorUsuario('El tipo de comprobante no es válido.');
  if (!clave) throw new ErrorUsuario('Falta el identificador de la factura.');
  if (!(pto >= 1 && pto <= 99998)) throw new ErrorUsuario('El punto de venta no es válido.');
  if (!(importe > 0 && importe < 1e9)) throw new ErrorUsuario('El importe tiene que ser mayor que cero.');
  if (![80, 86, 96, 99].includes(docTipo)) throw new ErrorUsuario('El tipo de documento no es válido.');
  if (docTipo !== 99 && docNro === '0') throw new ErrorUsuario('Falta el número de documento del receptor.');
  if (!fechaOK(datos.servDesde) || !fechaOK(datos.servHasta)) throw new ErrorUsuario('Faltan las fechas del servicio facturado.');

  const ref = db.doc(`consultorios/${CONSULTORIO}/facturas/${ENV}-${clave}`);
  // Evita emitir dos veces la misma factura (doble clic, dos dispositivos)
  const previa = await db.runTransaction(async tx => {
    const s = await tx.get(ref);
    if (s.exists) {
      const d = s.data();
      if (d.cae) return d;
      if (d.estado === 'en-proceso' && Date.now() - Date.parse(d.iniciada) < 2 * 60000) {
        throw new ErrorUsuario('Esta factura ya se está emitiendo. Esperá un momento.');
      }
    }
    tx.set(ref, { estado: 'en-proceso', iniciada: new Date().toISOString(), por: usuario }, { merge: true });
    return null;
  });
  if (previa) return { ...previa, duplicada: true };

  try {
    const c = arca.cuitDelCertificado(cert());
    const t = await ticket();
    const fecha = arca.hoyAR();
    let r, numero;
    for (let intento = 0; intento < 2; intento++) {
      numero = (await arca.ultimoComprobante(ENV, t, c.cuit, pto, tipo)) + 1;
      r = await arca.solicitarFacturaC(ENV, t, c.cuit, pto, {
        tipo, numero, fecha, docTipo, docNro, importe, condIva,
        servDesde: datos.servDesde, servHasta: datos.servHasta, vtoPago: fecha
      });
      // 10016: el número ya fue usado (otra factura se emitió al mismo tiempo): reintenta una vez
      if (r.resultado === 'A' || !r.errores.some(e => e.startsWith('10016'))) break;
    }
    if (r.resultado !== 'A' || !r.cae) {
      await ref.set({ estado: 'rechazada', errores: [...r.errores, ...r.observaciones], actualizada: new Date().toISOString() }, { merge: true });
      return { ok: false, errores: [...r.errores, ...r.observaciones] };
    }
    const factura = {
      ok: true, estado: 'emitida', entorno: ENV, clave, tipo, ptoVta: pto, numero, fecha,
      cae: r.cae, caeVence: r.caeVence, observaciones: r.observaciones,
      importe: Math.round(importe * 100) / 100, docTipo, docNro, condIva,
      servDesde: datos.servDesde, servHasta: datos.servHasta,
      receptor: String(datos.receptor || '').slice(0, 120), pid: String(datos.pid || ''),
      sesiones: Array.isArray(datos.sesiones) ? datos.sesiones.slice(0, 60).map(String) : [],
      cuitEmisor: c.cuit, emitidaPor: usuario, emitidaEl: new Date().toISOString()
    };
    await ref.set(factura);
    return factura;
  } catch (e) {
    await ref.set({ estado: 'error', errores: [e.message], actualizada: new Date().toISOString() }, { merge: true }).catch(() => {});
    throw e;
  }
}

functions.http('arca', async (req, res) => {
  const origen = req.get('Origin') || '';
  if (ORIGENES.includes(origen)) {
    res.set('Access-Control-Allow-Origin', origen);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.set('Access-Control-Allow-Methods', 'POST');
  }
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  try {
    const m = (req.get('Authorization') || '').match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ ok: false, error: 'Falta iniciar sesión.' });
    let u;
    try { u = await admin.auth().verifyIdToken(m[1]); }
    catch (e) { return res.status(401).json({ ok: false, error: 'La sesión no es válida. Cerrá sesión y volvé a entrar.' }); }
    const email = String(u.email || '').toLowerCase();
    if (!u.email_verified || !AUTORIZADOS.includes(email)) return res.status(403).json({ ok: false, error: 'Esta cuenta no tiene permiso para facturar.' });
    if (!cert() || !key()) throw new Error('El servidor no tiene cargado el certificado de ARCA.');
    const datos = req.body || {};
    if (datos.accion === 'estado') return res.json({ ok: true, ...(await estado(datos)) });
    if (datos.accion === 'emitir') return res.json(await emitir(datos, email));
    return res.status(400).json({ ok: false, error: 'Acción desconocida.' });
  } catch (e) {
    console.error(e);
    const usuario = e instanceof ErrorUsuario;
    return res.status(usuario ? 400 : 500).json({ ok: false, error: usuario ? e.message : `No se pudo completar la operación con ARCA: ${e.message}` });
  }
});
