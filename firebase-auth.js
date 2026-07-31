// ============================================
// Insta Food - Firebase Authentication
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBnmncW1VG-_O1APFudasVjc-Gt0c8Ddw0",
    authDomain: "insta-food-8ec99.firebaseapp.com",
    projectId: "insta-food-8ec99",
    storageBucket: "insta-food-8ec99.firebasestorage.app",
    messagingSenderId: "92369606140",
    appId: "1:92369606140:web:055509eeab4885538bce79"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ---------- تحديث الهيدر بناءً على حالة تسجيل الدخول ----------
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.querySelector('.btn-login');
    if (!loginBtn) return;

    if (user) {
        const name = user.displayName ? user.displayName.split(' ')[0] : 'حسابي';
        loginBtn.innerHTML = `👤 ${name}`;
        loginBtn.href = 'profile.html';
    } else {
        loginBtn.innerHTML = '👤 تسجيل الدخول';
        loginBtn.href = 'login.html';
    }
});

export { auth, db, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp };
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBnmncW1VG-_O1APFudasVjc-Gt0c8Ddw0",
    authDomain: "insta-food-8ec99.firebaseapp.com",
    projectId: "insta-food-8ec99",
    storageBucket: "insta-food-8ec99.firebasestorage.app",
    messagingSenderId: "92369606140",
    appId: "1:92369606140:web:055509eeab4885538bce79"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// تحديث الهيدر بناءً على حالة تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.querySelector('.btn-login');
    if (!loginBtn) return;
    if (user) {
        const name = user.displayName ? user.displayName.split(' ')[0] : 'حسابي';
        loginBtn.innerHTML = `👤 ${name}`;
        loginBtn.href = 'profile.html';
    } else {
        loginBtn.innerHTML = '👤 تسجيل الدخول';
        loginBtn.href = 'login.html';
    }
});

export {
    auth, db, googleProvider,
    signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signInWithPopup, signInWithRedirect, getRedirectResult,
    signOut, onAuthStateChanged,
};

