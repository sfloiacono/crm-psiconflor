/* =========================================================
   Conexión con los web services de ARCA (WSAA y WSFEv1)
   ========================================================= */
const forge = require('node-forge');
const { XMLParser } = require('fast-xml-parser');

const URLS = {
  homo: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
  },
  prod: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
  }
};
const parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true, parseTagValue: false });
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Fecha y hora de Argentina (UTC-3, sin horario de verano) */
function fechaAR(ms) {
  const d = new Date(ms - 3 * 3600 * 1000);
  return d.toISOString().slice(0, 19) + '-03:00';
}
function hoyAR() { return new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, ''); }

/* CUIT tomado del certificado (serialNumber = "CUIT 20123456789") */
function cuitDelCertificado(certPem) {
  const cert = forge.pki.certificateFromPem(certPem);
  const sn = cert.subject.getField({ type: '2.5.4.5' }) || cert.subject.getField('serialNumber');
  const m = sn && String(sn.value).match(/(\d{11})/);
  if (!m) throw new Error('El certificado no tiene un CUIT válido.');
  return { cuit: m[1], vence: cert.validity.notAfter.toISOString() };
}

/* Ticket de acceso: TRA firmado (CMS) enviado al WSAA */
function firmarTRA(certPem, keyPem, servicio) {
  const ahora = Date.now();
  const tra = `<?xml version="1.0" encoding="UTF-8"?><loginTicketRequest version="1.0"><header>` +
    `<uniqueId>${Math.floor(ahora / 1000)}</uniqueId><generationTime>${fechaAR(ahora - 10 * 60000)}</generationTime>` +
    `<expirationTime>${fechaAR(ahora + 10 * 60000)}</expirationTime></header><service>${servicio}</service></loginTicketRequest>`;
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(tra, 'utf8');
  const cert = forge.pki.certificateFromPem(certPem);
  p7.addCertificate(cert);
  p7.addSigner({
    key: forge.pki.privateKeyFromPem(keyPem),
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() }
    ]
  });
  p7.sign();
  return forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes());
}

async function soap(url, accion, cuerpo) {
  const env = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>${cuerpo}</soap:Body></soap:Envelope>`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: accion },
    body: env,
    signal: AbortSignal.timeout(30000)
  });
  const texto = await r.text();
  const xml = parser.parse(texto);
  const body = xml?.Envelope?.Body;
  if (!body) throw new Error(`Respuesta inesperada de ARCA (${r.status}).`);
  if (body.Fault) {
    const e = new Error(String(body.Fault.faultstring || 'Error de ARCA'));
    e.arcaCodigo = String(body.Fault.faultcode || '');
    throw e;
  }
  return body;
}

async function loginCms(env, certPem, keyPem, servicio = 'wsfe') {
  const cms = firmarTRA(certPem, keyPem, servicio);
  const body = await soap(URLS[env].wsaa, '""',
    `<loginCms xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov"><in0>${cms}</in0></loginCms>`);
  const ticket = parser.parse(String(body.loginCmsResponse.loginCmsReturn));
  const lt = ticket.loginTicketResponse;
  return { token: String(lt.credentials.token), sign: String(lt.credentials.sign), vence: String(lt.header.expirationTime) };
}

const NS = 'http://ar.gov.afip.dif.FEV1/';
const auth = (a, cuit) => `<Auth><Token>${esc(a.token)}</Token><Sign>${esc(a.sign)}</Sign><Cuit>${cuit}</Cuit></Auth>`;
const lista = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
function errores(res) {
  return lista(res?.Errors?.Err).map(e => `${e.Code}: ${e.Msg}`);
}

async function dummy(env) {
  const b = await soap(URLS[env].wsfe, `"${NS}FEDummy"`, `<FEDummy xmlns="${NS}"/>`);
  return b.FEDummyResponse.FEDummyResult;
}

async function ultimoComprobante(env, a, cuit, ptoVta, tipo = 11) {
  const b = await soap(URLS[env].wsfe, `"${NS}FECompUltimoAutorizado"`,
    `<FECompUltimoAutorizado xmlns="${NS}">${auth(a, cuit)}<PtoVta>${ptoVta}</PtoVta><CbteTipo>${tipo}</CbteTipo></FECompUltimoAutorizado>`);
  const r = b.FECompUltimoAutorizadoResponse.FECompUltimoAutorizadoResult;
  const errs = errores(r);
  if (errs.length) throw new Error(errs.join(' | '));
  return Number(r.CbteNro || 0);
}

const imp = n => (Math.round(Number(n) * 100) / 100).toFixed(2);

/* Comprobante C: 11 = Factura C, 15 = Recibo C. f = {tipo, numero, fecha, docTipo, docNro, importe, servDesde, servHasta, vtoPago, condIva} */
async function solicitarFacturaC(env, a, cuit, ptoVta, f) {
  const tipo = f.tipo === 15 ? 15 : 11;
  const det =
    `<Concepto>2</Concepto><DocTipo>${f.docTipo}</DocTipo><DocNro>${f.docNro}</DocNro>` +
    `<CbteDesde>${f.numero}</CbteDesde><CbteHasta>${f.numero}</CbteHasta><CbteFch>${f.fecha}</CbteFch>` +
    `<ImpTotal>${imp(f.importe)}</ImpTotal><ImpTotConc>0.00</ImpTotConc><ImpNeto>${imp(f.importe)}</ImpNeto>` +
    `<ImpOpEx>0.00</ImpOpEx><ImpTrib>0.00</ImpTrib><ImpIVA>0.00</ImpIVA>` +
    `<FchServDesde>${f.servDesde}</FchServDesde><FchServHasta>${f.servHasta}</FchServHasta><FchVtoPago>${f.vtoPago}</FchVtoPago>` +
    `<MonId>PES</MonId><MonCotiz>1</MonCotiz><CondicionIVAReceptorId>${f.condIva}</CondicionIVAReceptorId>`;
  const b = await soap(URLS[env].wsfe, `"${NS}FECAESolicitar"`,
    `<FECAESolicitar xmlns="${NS}">${auth(a, cuit)}<FeCAEReq><FeCabReq><CantReg>1</CantReg><PtoVta>${ptoVta}</PtoVta><CbteTipo>${tipo}</CbteTipo></FeCabReq>` +
    `<FeDetReq><FECAEDetRequest>${det}</FECAEDetRequest></FeDetReq></FeCAEReq></FECAESolicitar>`);
  const r = b.FECAESolicitarResponse.FECAESolicitarResult;
  const d = lista(r?.FeDetResp?.FECAEDetResponse)[0] || {};
  const obs = lista(d?.Observaciones?.Obs).map(o => `${o.Code}: ${o.Msg}`);
  return {
    resultado: String(d.Resultado || r?.FeCabResp?.Resultado || 'R'),
    cae: d.CAE ? String(d.CAE) : '',
    caeVence: d.CAEFchVto ? String(d.CAEFchVto) : '',
    observaciones: obs,
    errores: errores(r)
  };
}

module.exports = { URLS, cuitDelCertificado, firmarTRA, loginCms, dummy, ultimoComprobante, solicitarFacturaC, hoyAR };
