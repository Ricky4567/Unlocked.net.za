// import {initializeApp, auth} from "firebase/compat/app"
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyAcvKpgVk3naoKRzPIjq5qNI-Eay9pQrBE",
  authDomain: "movie-sites-b3d76.firebaseapp.com",
  projectId: "movie-sites-b3d76",
  storageBucket: "movie-sites-b3d76.appspot.com",
  messagingSenderId: "867991943478",
  appId: "1:867991943478:web:80127a27ebed2c5e1adb97"
};
export const firebaseApp = initializeApp(firebaseConfig);
// export const auth = firebaseApp.auth();

export const auth = getAuth();
