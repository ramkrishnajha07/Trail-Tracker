// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsVey6bpWHqvz2_M2xzqJcbSpeOm2z0ww",
  authDomain: "trail-tracker-e6867.firebaseapp.com",
  projectId: "trail-tracker-e6867",
  storageBucket: "trail-tracker-e6867.appspot.com",
  messagingSenderId: "755828210439",
  appId: "1:755828210439:web:ecc01f46283ba046b423a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
