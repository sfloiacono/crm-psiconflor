/* =========================================================
   Conexión con Firebase (inicio de sesión y base de datos)
   ========================================================= */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache,
  collection, doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

// Datos del proyecto (no son secretos: identifican el proyecto, no dan acceso a la información).
const firebaseConfig = {
  apiKey: "AIzaSyCo4aZUqfLOdPhvA_X97-EgHwCNvIJb9JU",
  authDomain: "consultorio-psiconflor.firebaseapp.com",
  projectId: "consultorio-psiconflor",
  storageBucket: "consultorio-psiconflor.firebasestorage.app",
  messagingSenderId: "422879130940",
  appId: "1:422879130940:web:384808d22674e89b4eda39"
};

// Cuentas que pueden entrar. Tiene que coincidir con la lista de las reglas de Firestore.
const AUTORIZADOS = [
  'sebastianfelipeloiacono@gmail.com',
  'flordirenzo@gmail.com',
  'licflordirenzo@gmail.com'
];

// Carpeta compartida del consultorio dentro de la base.
const CONSULTORIO = 'psiconflor';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = initializeFirestore(app, { localCache: memoryLocalCache() }); }

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

window.FB = {
  auth, db, provider, AUTORIZADOS,
  fns: { signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut,
    collection, doc, setDoc, getDoc, deleteDoc, onSnapshot },
  datos: () => collection(db, 'consultorios', CONSULTORIO, 'datos'),
  datoRef: id => doc(db, 'consultorios', CONSULTORIO, 'datos', id),
  archivoRef: id => doc(db, 'consultorios', CONSULTORIO, 'archivos', id),
  respaldoRef: id => doc(db, 'consultorios', CONSULTORIO, 'respaldos', id),
  facturasCol: () => collection(db, 'consultorios', CONSULTORIO, 'facturas'),
  facturaRef: id => doc(db, 'consultorios', CONSULTORIO, 'facturas', id)
};
window.dispatchEvent(new Event('fb-ready'));
