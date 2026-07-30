// استيراد الدوال الأساسية المطلوبة من حزمة Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// كود الإعدادات الخاص بمشروعك (Insta Food)
const firebaseConfig = { 
  apiKey: "AIzaSyBnmncW1VG-_O1APFudasVjc-Gt0c8Ddw0", 
  authDomain: "insta-food-8ec99.firebaseapp.com", 
  projectId: "insta-food-8ec99", 
  storageBucket: "insta-food-8ec99.firebasestorage.app", 
  messagingSenderId: "92369606140", 
  appId: "1:92369606140:web:055509eeab4885538bce79" 
};

// تهيئة تطبيق Firebase
const app = initializeApp(firebaseConfig);

// تهيئة قاعدة البيانات Cloud Firestore وتصديرها للاستخدام في بقية الملفات
export const db = getFirestore(app);
