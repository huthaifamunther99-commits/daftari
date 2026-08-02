import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB9-5zpxNEc6jM4Uz7SoCIwsNacTIzGajs",
  authDomain: "daftari-45574.firebaseapp.com",
  projectId: "daftari-45574",
  storageBucket: "daftari-45574.firebasestorage.app",
  messagingSenderId: "201891589847",
  appId: "1:201891589847:web:88d3cb484bf7c1f6398a92",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

let resolveUid;
const authReady = new Promise((resolve) => { resolveUid = resolve; });

onAuthStateChanged(auth, (user) => {
  if (user) resolveUid(user.uid);
  else signInAnonymously(auth).catch((err) => console.error("Firebase auth error:", err));
});

export async function backupData(dataObject) {
  const uid = await authReady;
  await setDoc(doc(db, "backups", uid), {
    data: JSON.stringify(dataObject),
    updatedAt: serverTimestamp(),
  });
}

export async function restoreData() {
  const uid = await authReady;
  const snap = await getDoc(doc(db, "backups", uid));
  if (!snap.exists()) return null;
  return JSON.parse(snap.data().data);
}
