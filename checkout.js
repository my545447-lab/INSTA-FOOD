(function () {
    const RESTAURANT_PHONE = '201555054885';
    const ORDER_STORAGE_KEY = 'insta-food-last-order';

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

    function handleSubmit(e) {
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

        sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));

     export default {
    async fetch(request) {
        // السماح فقط بطلبات POST
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            // جلب البيانات المرسلة من موقعك
            const orderData = await request.json();
            
            // قراءة المتغيرات السرية من سيرفر فيرسال
            const botToken = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;

            // تنسيق الرسالة لتصلك منظمة ومريحة للعين
            const message = `
📦 *طلب جديد من الموقع!*

👤 *العميل:* ${orderData.name || "غير مسجل"}
📞 *الهاتف:* ${orderData.phone || "غير مسجل"}
📍 *العنوان:* ${orderData.address || "غير مسجل"}
💰 *الإجمالي:* ${orderData.total || "0"} ج.م

🛒 *المنتجات:*
${orderData.items || "لا توجد منتجات"}
            `.trim();

            const telegramUrl = `https://telegram.org{8700661165:AAGWEmhEhH1fvjRSICUQ_hWbHNyD6PZ7RNg}/sendMessage`;

            // إرسال البيانات إلى تليجرام
            const telegramResponse = await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            const result = await telegramResponse.json();

            if (result.ok) {
                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return new Response(JSON.stringify({ success: false, error: result.description }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

        } catch (error) {
            return new Response(JSON.stringify({ success: false, error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};

    }

    document.addEventListener('DOMContentLoaded', function () {
        renderCheckoutSummary();
        document.getElementById('checkout-form').addEventListener('submit', handleSubmit);
    });
})();
