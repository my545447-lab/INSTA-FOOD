import { auth, db, onAuthStateChanged } from './firebase-auth.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

(function () {
    const RESTAURANT_PHONE = '201555054885';
    const ORDER_STORAGE_KEY = 'insta-food-last-order';
    let currentUser = null;

    onAuthStateChanged(auth, (user) => {
        currentUser = user;
    });

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderCheckoutSummary() {
        const cart = window.CartAPI.getCart();
        const container = document.getElementById('checkout-items');
        const totalEl = document.getElementById('checkout-total');

        if (cart.length === 0) {
            container.innerHTML = `<p class="empty-checkout-msg">عربتك فاضية. <a href="index.html#menu">تصفح المنيو</a></p>`;
            totalEl.textContent = 'EGP 0';
            document.querySelector('.confirm-checkout-btn').disabled = true;
            return;
        }

        const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

        container.innerHTML = cart.map((item) => `
            <div class="checkout-item-row">
                <span class="checkout-item-name">
                    ${escapeHtml(item.name)}${item.size ? ` (${escapeHtml(item.size)})` : ''}
                    <span class="checkout-item-qty">× ${item.quantity}</span>
                </span>
                <span class="checkout-item-price">EGP ${item.price * item.quantity}</span>
            </div>
        `).join('');

        totalEl.textContent = 'EGP ' + total.toFixed(0);
    }

    function buildOrderObject(formData) {
        const cart = window.CartAPI.getCart();
        const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return {
            orderId: 'ORD-' + Date.now().toString().slice(-6),
            orderTime: new Date().toISOString(),
            items: cart,
            total: total,
            customerName: formData.get('customer-name'),
            customerPhone: formData.get('customer-phone'),
            customerArea: formData.get('customer-area'),
            customerAddress: formData.get('customer-address'),
            customerNotes: formData.get('customer-notes') || '',
            paymentMethod: 'كاش عند الاستلام',
            userId: currentUser ? currentUser.uid : null,
            userEmail: currentUser ? currentUser.email : null,
        };
    }

    function buildWhatsAppMessage(order) {
        let message = `🍔 *طلب جديد - INSTA FOOD*\n`;
        message += `🔖 *رقم الطلب:* ${order.orderId}\n\n`;
        message += `*الأصناف:*\n`;
        order.items.forEach((item) => {
            const sizeLabel = item.size ? ` (${item.size})` : '';
            message += `• ${item.name}${sizeLabel} × ${item.quantity} = EGP ${item.price * item.quantity}\n`;
        });
        message += `\n*الاجمالي: EGP ${order.total.toFixed(0)}*\n`;
        message += `\n---------------------------\n`;
        message += `👤 *الاسم:* ${order.customerName}\n`;
        message += `📞 *التليفون:* ${order.customerPhone}\n`;
        message += `📍 *المنطقة:* ${order.customerArea}\n`;
        message += `🏠 *العنوان:* ${order.customerAddress}\n`;
        if (order.customerNotes && order.customerNotes.trim()) {
            message += `📝 *ملاحظات:* ${order.customerNotes}\n`;
        }
        message += `💳 *طريقة الدفع:* ${order.paymentMethod}\n`;
        return message;
    }

    async function saveOrderToFirestore(order) {
        try {
            if (!currentUser) return;
            await addDoc(collection(db, 'orders'), {
                ...order,
                createdAt: new Date(),
            });
        } catch (err) {
            console.warn('فشل حفظ الطلب في Firestore:', err);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const cart = window.CartAPI.getCart();
        if (cart.length === 0) {
            alert('عربتك فاضية، ارجع للمنيو وضيف حاجة الأول.');
            return;
        }

        const form = document.getElementById('checkout-form');
        const formData = new FormData(form);
        const order = buildOrderObject(formData);
        const message = buildWhatsAppMessage(order);

        // حفظ الطلب في Firestore لو المستخدم مسجل دخول
        await saveOrderToFirestore(order);

        // حفظ الطلب في sessionStorage عشان صفحة التأكيد
        sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));

        // فتح واتساب
        const url = `https://wa.me/${RESTAURANT_PHONE}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        // تصفير العربة
        window.CartAPI.clearCart();

        // الانتقال لصفحة التأكيد
        window.location.href = 'order-confirmation.html';
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderCheckoutSummary();
        document.getElementById('checkout-form').addEventListener('submit', handleSubmit);
    });
})();