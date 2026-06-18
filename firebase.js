import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Reemplazá este bloque entero por el que copiaste de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBziGx10dxDwbTYRzRKmesI3FKsTAnLlbU",
  authDomain: "kore-hub.firebaseapp.com",
  projectId: "kore-hub",
  storageBucket: "kore-hub.firebasestorage.app",
  messagingSenderId: "803436408351",
  appId: "1:803436408351:web:0c900bcd8a8eeab27def2a"
};
// Inicializamos la app y exportamos la base de datos para usarla en todo Kore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);