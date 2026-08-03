(function () {
    const ORDER_STORAGE_KEY = 'insta-food-last-order';

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // جلب السلة من موقعك (تم تحسينها لتقرأ من الـ localStorage مباشرة إذا لم يجد الـ API)
    function getCartItems() {
        if (window.CartAPI && typeof window.CartAPI.getCart === 'function') {
            return window.CartAPI.getCart();
        }
        return JSON.parse(localStorage.getItem('cart')) || [];
    }

    function renderCheckoutSummary() {
        const cart = getCartItems();
        const container = document.getElementById('checkout-items');
        const totalEl = document.getElementById('checkout-total');
        const confirmBtn = document.querySelector('.confirm-checkout-btn');

        if (!container || !totalEl) return;

        if (cart.length === 0) {
            container.innerHTML = `<p class="empty-checkout-msg">عربتك فاضية. <a href="index.html#menu">تصفح المنيو</a></p>`;
            totalEl.textContent = 'EGP 0';
            if (confirmBtn) confirmBtn.disabled = true;
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

    function buildOrderObject() {
        const cart = getCartItems();
        const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

        // هنا قمنا بالربط مع الـ IDs الحقيقية المفتوحة في لقطة الشاشة لموقعك
        return {
            orderId: 'ORD-' + Date.now().toString().slice(-6),
            orderTime: new Date().toISOString(),
            items: cart,
            total: total,
            customerName: document.getElementById('customer-name')?.value || document.querySelector('input[type="text"]')?.value || "عمر عيسى",
            customerPhone: document.getElementById('customer-phone')?.value || document.querySelector('input[type="tel"]')?.value || "01555054885",
            customerArea: document.getElementById('customer-region')?.value || "دكرنس",
            customerAddress: document.getElementById('customer-address')?.value || "لافا",
            customerNotes: document.getElementById('customer-notes')?.value || "تجربه",
            paymentMethod: 'كاش عند الاستلام',
        };
    }

    function buildTelegramMessage(order) {
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

    function handleSubmit(e) {
        e.preventDefault();
        const cart = getCartItems();
        
        if (cart.length === 0) {
            alert('عربتك فاضية، ارجع للمنيو وضيف حاجة الأول.');
            return;
        }

        const order = buildOrderObject();
        const message = buildTelegramMessage(order);

        sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));

        // إرسال الطلب إلى مسار الـ API في فيرسال
        fetch("/api/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        })
        .then(async (response) => {
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'فشل إرسال الرسالة');
            }
            // تفريغ السلة بعد النجاح
            if (window.CartAPI && typeof window.CartAPI.clearCart === 'function') {
                window.CartAPI.clearCart();
            } else {
                localStorage.removeItem('cart');
            }
            window.location.href = 'order-confirmation.html';
        })
        .catch((err) => {
            console.error(err);
            alert('حدث خطأ أثناء إرسال الطلب للبوت، حاول مرة أخرى.');
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderCheckoutSummary();
        const form = document.getElementById('checkout-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
    });
})();
