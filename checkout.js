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
    
    // 1. تجميع البيانات بشكل مباشر من الحقول نصوص صريحة (Plain Text)
    const orderData = {
        name: document.getElementById('customer-name')?.value || "عمر عيسى",
        phone: document.getElementById('customer-phone')?.value || "01555054885",
        area: document.getElementById('customer-area')?.value || "دكرنس",
        address: document.getElementById('customer-address')?.value || "لافا",
        notes: document.getElementById('customer-notes')?.value || "تجربة"
    };

    // 2. بناء رسالة نصية بسيطة جداً بدون أي تعقيد
    const messageText = `طلب جديد من: ${orderData.name}\nالتليفون: ${orderData.phone}\nالعنوان: ${orderData.area} - ${orderData.address}\nالملاحظات: ${orderData.notes}\nالإجمالي: 340 ج.م`;

    console.log("الرسالة الجاهزة للإرسال:", messageText);

    // 3. الإرسال للسيرفر (تم تغيير المسار ليكون متوافق مع Vercel)
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
            window.location.href = 'order-confirmation.html';
        } else {
            alert('فشل الإرسال: ' + data.error);
        }
    })
    .catch((err) => {
        console.error("الخطأ اللي المتصفح شافه:", err);
        alert('المتصفح مش قادر يتصل بالسيرفر (fetch failed). تأكد إن الملف مرفوع في مجلد api');
    });
}
