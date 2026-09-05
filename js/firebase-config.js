

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const firebaseConfig = {
   
     apiKey: "AIzaSyC_-5PjmhOwgvljFFGu4H0dnMweHAmEpJs",
    authDomain: "reddy-syouthassociation.firebaseapp.com",
    projectId: "reddy-syouthassociation",
    storageBucket: "reddy-syouthassociation.firebasestorage.app",
    messagingSenderId: "570084180770",
    appId: "1:570084180770:web:ba45095db01541531b9b7b",
    measurementId: "G-JWJ9YGDHD2"
};


const app = initializeApp(firebaseConfig);


// Firebase Authentication
export const auth = getAuth(app);


// Firebase Firestore
export const db = getFirestore(app);