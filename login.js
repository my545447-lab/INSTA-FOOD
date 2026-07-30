import {
    auth,
    googleProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
} from './firebase-auth.js';

import {
    updateProfile,
    signInWithRedirect,
    getRedirectResult,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// لو المستخدم مسجل دخول بالفعل، وديه للصفحة الرئيسية
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'index.html';
    }
});

// استقبال نتيجة Google Redirect بعد الرجوع للصفحة
getRedirectResult(auth).catch(() => {});

function showError(msg) {
    if (!msg) return;
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => (el.style.display = 'none'), 4000);
}

function translateError(code) {
    const errors = {
        'auth/invalid-email': 'الإيميل غير صحيح',
        'auth/user-not-found': 'مفيش حساب بالإيميل ده',
        'auth/wrong-password': 'الباسورد غلط',
        'auth/email-already-in-use': 'الإيميل ده مسجل بالفعل',
        'auth/weak-password': 'الباسورد ضعيف (6 أحرف على الأقل)',
        'auth/popup-closed-by-user': '',
        'auth/invalid-credential': 'الإيميل أو الباسورد غلط',
        'auth/cancelled-popup-request': '',
    };
    return errors[code] ?? 'حصل خطأ، حاول تاني';
}

document.addEventListener('DOMContentLoaded', () => {

    // ---------- التابويبات ----------
    document.getElementById('tab-login').addEventListener('click', () => {
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-register').classList.remove('active');
        document.getElementById('panel-login').classList.add('active');
        document.getElementById('panel-register').classList.remove('active');
    });

    document.getElementById('tab-register').addEventListener('click', () => {
        document.getElementById('tab-register').classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
        document.getElementById('panel-register').classList.add('active');
        document.getElementById('panel-login').classList.remove('active');
    });

    // ---------- تسجيل الدخول بالإيميل ----------
    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        if (!email || !password) return showError('ادخل الإيميل والباسورد');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'index.html';
        } catch (err) {
            showError(translateError(err.code));
        }
    });

    // ---------- إنشاء حساب جديد ----------
    document.getElementById('register-btn').addEventListener('click', async () => {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        if (!name || !email || !password) return showError('ادخل كل البيانات');
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, { displayName: name });
            window.location.href = 'index.html';
        } catch (err) {
            showError(translateError(err.code));
        }
    });

    // ---------- تسجيل الدخول بـ Google (Redirect بدل Popup) ----------
    async function googleSignIn() {
        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (err) {
            showError(translateError(err.code));
        }
    }

    document.getElementById('google-login-btn').addEventListener('click', googleSignIn);
    document.getElementById('google-register-btn').addEventListener('click', googleSignIn);
});