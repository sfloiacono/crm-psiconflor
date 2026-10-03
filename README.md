# Consultorio Psiconflor

Aplicación web para organizar un consultorio de psicología: agenda, registro de sesiones, cobros, comprobantes de pago y gastos.

## Qué incluye

- **Agenda** con vistas de día, semana y mes. Las sesiones se generan solas a partir del horario habitual de cada paciente (semanal, quincenal o mensual).
- **Panel de pendientes**, con las sesiones pasadas que falta registrar y los pagos pendientes.
- **Registro en dos niveles**: primero el estado de la sesión (Realizada, Canceló paciente, Feriado, etc.) y, por separado, el pago.
- **Cancelaciones que se cobran**: los estados configurados como "A elegir" permiten decidir en cada sesión si se cobra.
- **Semanas**: análisis semanal con gráfico, tabla y detalle editable.
- **Caja**: cobrado, pendiente, porcentaje para instituciones, gastos y neto, por día, por semana o por mes.
- **Pacientes**: ficha completa, historial de horarios y comprobantes de pago (imagen o PDF).
- **Gastos**: egresos del consultorio por categoría.
- **Facturas**: Factura C mensual por paciente con las sesiones cobradas en el mes (según la fecha de cobro), con vista previa, emisión en ARCA a través del servidor y PDF con el formato de ARCA, firma y código QR.
- **Altas que liberan la agenda**: al pasar un paciente a "Alta por abandono", "Alta por finalización" o "Derivación", la app cierra sus horarios desde la fecha indicada y quita las sesiones futuras, con confirmación, "Deshacer" y opción de reabrir el horario.
- **Feriados de Argentina**: calendario oficial cargado (2026), con feriados propios agregables. Las sesiones en feriados nacionales se marcan solas como "Feriado" (configurable).
- **Tablas ordenables**: tocando el título de una columna se ordena de menor a mayor o de mayor a menor.
- **Aviso de pagos atrasados**: una ventana emergente avisa cuando un pago lleva más de 7 días pendiente (el plazo se cambia en Configuración), con acceso a marcarlo como pagado o a recordarle al paciente por WhatsApp.
- **Configuración**: todas las listas desplegables son editables, y se puede elegir la paleta de colores y la tipografía.

## Dónde se guardan los datos

Los datos se guardan en **Firebase** (Google), en el proyecto `consultorio-psiconflor`, y se sincronizan al instante entre todos los dispositivos.

- Se ingresa con una **cuenta de Google**. Solo pueden entrar las cuentas autorizadas.
- Todas las cuentas autorizadas **comparten los mismos datos** del consultorio.
- Si no hay conexión, la app sigue funcionando y guarda los cambios cuando vuelve internet.
- Los comprobantes (imágenes o PDF) se guardan achicados en la misma base, con un máximo de 700 KB por archivo.

### Sumar o quitar una cuenta autorizada

Hay que cambiarla en **dos lugares**, y las dos listas tienen que coincidir:

1. **En Firebase:** Firestore Database > Reglas. Agregar o borrar el email en la lista y tocar **Publicar**.
2. **En este repositorio:** en el archivo `firebase.js`, en la lista `AUTORIZADOS`. Después, subir el archivo a GitHub.

## PIN y bloqueo automático

- Cada dispositivo puede tener su propio PIN de 4 dígitos (Configuración > Seguridad de este dispositivo).
- La app se bloquea al abrirla, después de un tiempo sin uso (de 1 a 30 minutos) y, si se elige, al cambiar de app o de pestaña.
- Después de 5 intentos fallidos se cierra la sesión de Google. "Olvidé mi PIN" también pide volver a iniciar sesión.

## Copias de seguridad y papelera

- **Copias automáticas en la nube:** cada día, la primera vez que alguien abre la app, se guarda una copia completa. Se conservan las últimas 20.
- **Copias antes de acciones riesgosas:** también se guarda una copia antes de borrar todos los datos, restaurar una copia o eliminar definitivamente a un paciente.
- **Restaurar:** en Configuración > Copias de seguridad, cada copia tiene su botón "Restaurar". Antes de restaurar, se guarda una copia del estado actual.
- **Copia descargada:** una vez por mes, la app recuerda descargar una copia al dispositivo. Conviene guardarla en Google Drive o en un pendrive, porque protege incluso si se pierde el acceso al proyecto de Firebase. No incluye los archivos de los comprobantes.
- **Papelera:** los pacientes eliminados van a Configuración > Papelera, con sus sesiones y comprobantes, y se pueden restaurar.
- **Confirmaciones:** borrar todos los datos o eliminar un paciente definitivamente requiere escribir una palabra para confirmar. Los gastos eliminados se pueden recuperar con "Deshacer".

## Servidor (facturación electrónica con ARCA)

La carpeta `servidor/` contiene una función de Google Cloud que emite Factura C en ARCA. El certificado y la clave privada **no** están en el repositorio: se guardan en Secret Manager (`arca-homo-cert`, `arca-homo-key`; para producción, `arca-prod-cert`, `arca-prod-key`).

Para instalarlo o actualizarlo, en **Cloud Shell** (console.cloud.google.com, ícono de terminal arriba a la derecha):

```
[ -d ~/crm-psiconflor ] && git -C ~/crm-psiconflor pull || git clone https://github.com/sfloiacono/crm-psiconflor.git ~/crm-psiconflor
bash ~/crm-psiconflor/servidor/desplegar.sh homo
```

La primera vez pide los emails autorizados a facturar y los guarda solo en Cloud Shell.

Servidor de homologación instalado en: `https://arca-qe54wqshhq-rj.a.run.app`. En la app: Configuración > Facturación electrónica > "Probar conexión con ARCA".

## Estructura

```
index.html             Estructura de la página
firebase.js            Conexión con Firebase y lista de cuentas autorizadas
servidor/              Servidor de facturación (ARCA)
styles.css             Estilos, paletas y tipografías
app.js                 Lógica de la aplicación
manifest.webmanifest   Datos para instalarla en el celular
sw.js                  Permite instalarla y abrirla sin conexión
icons/                 Íconos de la aplicación
```

## Publicarla con GitHub Pages

1. En el repositorio, entrá a **Settings > Pages**.
2. En **Source**, elegí **Deploy from a branch**.
3. En **Branch**, elegí `main` y la carpeta `/ (root)`, y tocá **Save**.
4. En uno o dos minutos, la aplicación queda disponible en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.

### Instalarla en el celular

- **Android (Chrome):** abrí la dirección, tocá el menú ⋮ y elegí **Instalar aplicación** o **Agregar a la pantalla principal**.
- **iPhone (Safari):** abrí la dirección, tocá **Compartir** y elegí **Agregar a inicio**.

### Actualizar la aplicación

Cuando subas cambios, abrí `sw.js` y aumentá el número de `VERSION` (por ejemplo, de `'v1'` a `'v2'`). Así los dispositivos que ya la instalaron descargan la versión nueva.

## Privacidad

- Este repositorio contiene **solo el código**. Nunca subas datos reales de pacientes (planillas, copias de seguridad, comprobantes).
- El archivo `.gitignore` bloquea por defecto las planillas de Excel, los CSV y las copias de seguridad de la app.

## Próximos pasos

- PIN de 4 dígitos para abrir la app en el día a día.
- Revisión de los requisitos de la Ley 25.326 de Protección de Datos Personales para datos de salud.
