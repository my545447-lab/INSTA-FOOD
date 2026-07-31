import { auth, db, onAuthStateChanged, signOut } from './firebase-auth.js';
import { collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ar-EG', {
        hour: '2-digit', minute: '2-digit',
        day: 'numeric', month: 'numeric', year: 'numeric',
    });
}

async function loadOrders(userId) {
    const container = document.getElementById('orders-list');
    try {
        const q = query(
            collection(db, 'orders'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="no-orders">
                    <p>لسه معملتش أي طلب.</p>
                    <a href="index.html#menu" class="browse-menu-btn">اطلب دلوقتي</a>
                </div>
            `;
            return;
        }

        container.innerHTML = snapshot.docs.map((doc) => {
            const order = doc.data();
            const itemsHtml = order.items.map((item) =>
                `<span>${escapeHtml(item.name)}${item.size ? ` (${escapeHtml(item.size)})` : ''} × ${item.quantity}</span>`
            ).join('<br>');

            return `
                <div class="order-card">
                    <div class="order-card-header">
                        <span class="order-id">${escapeHtml(order.orderId)}</span>
                        <span class="order-date">${formatTime(order.orderTime)}</span>
                    </div>
                    <div class="order-items">${itemsHtml}</div>
                    <div class="order-total">الاجمالي: <strong>EGP ${order.total.toFixed(0)}</strong></div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p class="orders-error">حصل خطأ في تحميل الطلبات.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('profile-name').textContent = user.displayName || 'مستخدم';
        document.getElementById('profile-email').textContent = user.email;
        if (user.photoURL) {
            document.getElementById('profile-avatar').innerHTML = `<img src="${user.photoURL}" alt="avatar">`;
        }

        loadOrders(user.uid);
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'index.html';
    });
});