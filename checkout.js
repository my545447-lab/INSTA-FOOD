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

// 3. دالة تنفيذ الإرسال المباشر إلى تليجرام عند الضغط على تأكيد الطلب
function handleSubmit(e) {
    e.preventDefault();
    
    const cart = getCartItems();
    if (cart.length === 0) {
        alert('عربتك فاضية، ارجع للمنيو وضيف حاجة الأول.');
        return;
    }

    // تجميع البيانات ديناميكياً من حقول الـ HTML الخاصة بموقعك
    const orderData = {
        orderId: 'ORD-' + Date.now().toString().slice(-6),
        name: document.getElementById('customer-name')?.value || "عمر عيسى",
        phone: document.getElementById('customer-phone')?.value || "01555054885",
        area: document.getElementById('customer-area')?.value || "دكرنس",
        address: document.getElementById('customer-address')?.value || "لافا",
        notes: document.getElementById('customer-notes')?.value || ""
    };

    // بناء قائمة المنتجات ديناميكياً للرسالة
    let productsText = "";
    cart.forEach(item => {
        const sizeLabel = item.size ? ` (${item.size})` : '';
        productsText += `• ${item.name}${sizeLabel} × ${item.quantity} = EGP ${item.price * item.quantity}\n`;
    });

    const totalAmount = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // تنسيق نص الرسالة النهائي ليظهر بشكل احترافي ومنظم في تليجرام
    const messageText = `🍔 *طلب جديد - INSTA FOOD*\n🔖 *رقم الطلب:* ${orderData.orderId}\n\n👤 *الاسم:* ${orderData.name}\n📞 *التليفون:* ${orderData.phone}\n📍 *المنطقة:* ${orderData.area}\n🏠 *العنوان:* ${orderData.address}\n${orderData.notes ? `📝 *ملاحظات:* ${orderData.notes}\n` : ''}\n🛒 *الأصناف:*\n${productsText}\n💰 *الإجمالي النهائي:* EGP ${totalAmount.toFixed(0)}`;

    // ==========================================
    // ⚠️ ضع بيانات البوت الخاصة بك هنا مباشرة ⚠️
    // ==========================================
    const botToken = "7449557457:AAFlw9fO8hSg6Vsh0E8C4w_kF-mS-8g_I2U"; // استبدل هذا بالتوكن الحقيقي الخاص بك من BotFather
    const chatId = "5116514547";     // استبدل هذا بـ الـ Chat ID الحقيقي الخاص بك
    // ==========================================

    const telegramUrl = `https://telegram.org{botToken}/sendMessage`;

    // الإرسال المباشر الفوري من المتصفح إلى سيرفر تليجرام
    fetch(telegramUrl, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
            chat_id: chatId, 
            text: messageText,
            parse_mode: "Markdown" // لتنسيق النصوص والخط العريض
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            alert('مبروك! الأوردر وصل تليجرام فوراً وبنجاح 🎉');
            
            // مسح وتفريغ السلة بعد نجاح الشراء لكي لا تتكرر
            if (window.CartAPI && typeof window.CartAPI.clearCart === 'function') {
                window.CartAPI.clearCart();
            } else {
                localStorage.removeItem('cart');
                localStorage.removeItem('cartItems');
            }
            
            // التوجه لصفحة النجاح
            window.location.href = 'order-confirmation.html';
        } else {
            alert('تليجرام رفض الإرسال، تأكد من التوكن والـ ID المكتوبين: ' + data.description);
        }
    })
    .catch((err) => {
        console.error(err);
        alert('حدث خطأ أثناء الاتصال بتليجرام، تأكد من إنترنت جهازك.');
    });
}

// 4. تشغيل الأكواد وعرض السلة فور تحميل الصفحة
document.addEventListener('DOMContentLoaded', function () {
    renderCheckoutSummary();
    
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});
