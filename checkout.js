// دالة مرنة ومفتوحة لضمان قراءة السلة من أي مكان بالمتصفح
function getCartItems() {
    if (window.CartAPI && typeof window.CartAPI.getCart === 'function') {
        return window.CartAPI.getCart();
    }
    // حل بديل فوري إذا لم يستجب الـ API: نقرأ من ذاكرة الموقع مباشرة بجميع المسميات المحتملة
    return JSON.parse(localStorage.getItem('cart')) || 
           JSON.parse(localStorage.getItem('cartItems')) || 
           JSON.parse(localStorage.getItem('insta-food-cart')) || [];
}

// دالة عرض ملخص الطلب بالأسعار والمنتجات في الصفحة
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
    
    // بناء الأسطر الخاصة بالمنتجات ديناميكياً
    container.innerHTML = cart.map((item) => `
        <div class="checkout-item-row">
            <span class="checkout-item-name">
                ${item.name}${item.size ? ` (${item.size})` : ''}
                <span class="checkout-item-qty">× ${item.quantity}</span>
            </span>
            <span class="checkout-item-price">EGP ${item.price * item.quantity}</span>
        </div>
    `).join('');
    
    totalEl.textContent = 'EGP ' + total.toFixed(0);
}

// دالة تجميع البيانات من حقول الـ HTML بدقة
function buildOrderObject(formData) {
    const cart = getCartItems();
    const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    
    return {
        orderId: 'ORD-' + Date.now().toString().slice(-6),
        orderTime: new Date().toISOString(),
        items: cart,
        total: total,
        customerName: formData.get('customer-name') || document.getElementById('customer-name')?.value || "عمر عيسى",
        customerPhone: formData.get('customer-phone') || document.getElementById('customer-phone')?.value || "01555054885",
        customerArea: formData.get('customer-area') || document.getElementById('customer-area')?.value || "دكرنس",
        customerAddress: formData.get('customer-address') || document.getElementById('customer-address')?.value || "لافا",
        customerNotes: formData.get('customer-notes') || document.getElementById('customer-notes')?.value || '',
        paymentMethod: 'كاش عند الاستلام',
    };
}

// دالة تنسيق الرسالة النصية لتليجرام
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

// دالة تنفيذ الإرسال عند الضغط على تأكيد الطلب
function handleSubmit(e) {
    e.preventDefault();
    
    const cart = getCartItems();
    if (cart.length === 0) {
        alert('عربتك فاضية، ارجع للمنيو وضيف حاجة الأول.');
        return;
    }

    const form = document.getElementById('checkout-form');
    const formData = new FormData(form);
    
    const order = buildOrderObject(formData);
    const message = buildTelegramMessage(order);

    sessionStorage.setItem('insta-food-last-order', JSON.stringify(order));

    // إرسال البيانات فوراً إلى السيرفر الخلفي في فيرسال
    fetch("/api/telegram", { 
        method: "POST", 
        headers: { 
            "Content-Type": "application/json" 
        }, 
        body: JSON.stringify({ message: message })
    })
    .then(async (response) => {
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            console.error("خطأ سيرفر:", data);
            throw new Error(data.error || 'فشل إرسال الرسالة');
        }
        
        // تفريغ السلة بعد نجاح العملية
        if (window.CartAPI && typeof window.CartAPI.clearCart === 'function') {
            window.CartAPI.clearCart();
        } else {
            localStorage.removeItem('cart');
            localStorage.removeItem('cartItems');
        }
        window.location.href = 'order-confirmation.html';
    })
    .catch((err) => {
        console.error("تفاصيل الخطأ:", err);
        alert('حدث خطأ أثناء إرسال الطلب للبوت، حاول مرة أخرى.');
    });
}

// تشغيل الأكواد فور جاهزية الصفحة لضمان المزامنة والترتيب الصحيح
document.addEventListener('DOMContentLoaded', function () {
    renderCheckoutSummary();
    
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});
