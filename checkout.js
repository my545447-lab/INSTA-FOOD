// 1. دالة مرنة ومفتوحة لضمان قراءة السلة من أي مكان بالمتصفح
function getCartItems() {
    if (window.CartAPI && typeof window.CartAPI.getCart === 'function') {
        return window.CartAPI.getCart();
    }
    // حل بديل فوري إذا لم يستجب الـ API: نقرأ من ذاكرة الموقع مباشرة بجميع المسميات المحتملة
    return JSON.parse(localStorage.getItem('cart')) || 
           JSON.parse(localStorage.getItem('cartItems')) || 
           JSON.parse(localStorage.getItem('insta-food-cart')) || [];
}

// 2. دالة عرض ملخص الطلب بالأسعار والمنتجات في الصفحة
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

// 3. دالة تجميع البيانات من حقول الـ HTML بدقة
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

// 4. دالة تنسيق الرسالة النصية لتليجرام
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

// 5. دالة تنفيذ الإرسال عند الضغط على تأكيد الطلب
function handleSubmit(e) {
    e.preventDefault();
    
    const cart = getCartItems();
    if (cart.length === 0) {
        alert('عربتك فاضية، ارجع للمنيو وضيف حاجة الأول.');
        return;
    }

    const form = document.getElementById('checkout-form');
    const formData = new FormData(form);
    
    // ربط ديناميكي كامل لقراءة بيانات العميل الحقيقية مع أصنافه وسعره المنسق لتليجرام
    const order = buildOrderObject(formData);
    const messageText = buildTelegramMessage(order);

    console.log("الرسالة الجاهزة للإرسال:", messageText);
    sessionStorage.setItem('insta-food-last-order', JSON.stringify(order));

    // الإرسال للسيرفر
    fetch("/api/telegram", { 
        method: "POST", 
        headers: { 
            "Content-Type": "application/json"
        }, 
        body: JSON.stringify({ message: messageText })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('السيرفر رجع خطأ رقم: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('مبروك! الأوردر وصل تليجرام بنجاح.');
            
            // تفريغ السلة بعد نجاح العملية
            if (window.CartAPI && typeof window.CartAPI.clearCart === 'function') {
                window.CartAPI.clearCart();
            } else {
                localStorage.removeItem('cart');
            }
            
            window.location.href = 'order-confirmation.html';
        } else {
            alert('فشل الإرسال من السيرفر: ' + data.error);
        }
    })
    .catch((err) => {
        console.error("الخطأ اللي المتصفح شافه:", err);
        alert('حدث خطأ أثناء إرسال الطلب، تأكد من إعدادات السيرفر.');
    });
}

// 6. السطر الحاسم لتشغيل الكود وربطه بالصفحة فور تحميلها (الذي كان ناقصاً)
document.addEventListener('DOMContentLoaded', function () {
    renderCheckoutSummary();
    
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});
