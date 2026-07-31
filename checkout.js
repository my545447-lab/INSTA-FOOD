import {
    auth,
    db,
    collection,
    addDoc,
    serverTimestamp,
} from './firebase-auth.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

(function () {
    // ===== بيانات UltraMsg =====
    const ULTRAMSG_INSTANCE = 'instance186689';
    const ULTRAMSG_TOKEN = 'l2rm6z3ajakah4hb';
    const RESTAURANT_PHONE = '201555054885'; // رقم المطعم بالكود الدولي بدون +

    const ORDER_STORAGE_KEY = 'insta-food-last-order';
    let currentUser = null;

    // ===== معرفة حالة تسجيل الدخول =====
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

        container.innerHTML = cart
            .map(
                (item) => `
            <div class="checkout-item-row">
                <span class="checkout-item-name">
                    ${escapeHtml(item.name)}${item.size ? ` (${escapeHtml(item.size)})` : ''}
                    <span class="checkout-item-qty">× ${item.quantity}</span>
                </span>
                <span class="checkout-item-price">EGP ${item.price * item.quantity}</span>
            </div>
        `
            )
            .join('');

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

    // ---------- إرسال تلقائي عن طريق UltraMsg ----------
    function sendWhatsAppAutomatically(message) {
        const url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`;

        const body = new URLSearchParams({
            token: ULTRAMSG_TOKEN,
            to: '+' + RESTAURANT_PHONE,
            body: message,
            priority: '10',
        });

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        })
            .then((res) => res.json())
            .then((data) => console.log('UltraMsg response:', data))
            .catch((err) => console.warn('فشل إرسال رسالة UltraMsg:', err));
    }

    // ---------- حفظ الطلب في Firestore ----------
    async function saveOrderToFirestore(order) {
        if (!currentUser) return; // مش مسجل دخول = مفيش حفظ

        try {
            const orderData = {
                ...order,
                userId: currentUser.uid,
                userEmail: currentUser.email || '',
                createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, 'orders'), orderData);
            console.log('✅ الطلب تحفظ في Firestore');
        } catch (err) {
            console.warn('❌ فشل حفظ الطلب في Firestore:', err);
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

        // إرسال تلقائي لصاحب المطعم
        sendWhatsAppAutomatically(message);

        // حفظ في Firestore لو مسجل دخول
        await saveOrderToFirestore(order);

        // نحفظ تفاصيل الطلب عشان صفحة التأكيد تعرضها للعميل
        sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));

        // نفضي العربة عشان الطلب التالي يبدأ من جديد
        window.CartAPI.clearCart();

        // نوصل العميل لصفحة تفاصيل الطلب
        window.location.href = 'order-confirmation.html';
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderCheckoutSummary();
        document.getElementById('checkout-form').addEventListener('submit', handleSubmit);
    });
})();
