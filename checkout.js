(function () {
    // 1. ضع هنا الأكواد والوظائف التي كتبتها بنفسك ونجحت في قراءة السلة وعرضها في الصفحة
    // (مثل: renderCheckoutSummary أو getCart وكل الأجزاء التي تصلح القيمة صفر)
    
    // ... اترک أكواد السلة الحالية كما هي دون تغيير ...

    // 2. هذه هي الدالة المسؤولة عن تجميع البيانات بعد أن أصبحت تظهر كاملة عندك
    function buildOrderObject(formData) {
        // تأكد أن الدالة الحالية لديك تجمع البيانات بنفس هذه الـ Keys
        const cart = window.CartAPI ? window.CartAPI.getCart() : [];
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

    // 3. دالة بناء نص الرسالة المنسق لتليجرام
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

    // 4. الدالة النهائية المعدلة لإرسال البيانات دون أخطاء
    function handleSubmit(e) {
        e.preventDefault();
        
        const form = document.getElementById('checkout-form');
        const formData = new FormData(form);
        
        // بناء كائن الطلب ونص الرسالة
        const order = buildOrderObject(formData);
        const message = buildTelegramMessage(order);

        // حفظ تفاصيل الطلب مؤقتاً لعرضها في صفحة الشكر
        sessionStorage.setItem('insta-food-last-order', JSON.stringify(order));

        // إرسال البيانات إلى السيرفر الخلفي في فيرسال
        fetch("/api/telegram", { 
            method: "POST", 
            headers: { 
                "Content-Type": "application/json" 
            }, 
            body: JSON.stringify({ message: message }) // نرسل النص المنسق داخل كائن يحمل اسم message
        })
        .then(async (response) => {
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                // إذا أرجع السيرفر خطأ، سنطبعه في الـ console لنعرف سببه تحديداً
                console.error("خطأ من السيرفر:", data);
                throw new Error(data.error || 'فشل إرسال الرسالة');
            }
            
            // إذا نجح الإرسال، نقوم بتفريغ السلة والتوجه لصفحة النجاح
            if (window.CartAPI && typeof window.CartAPI.clearCart === 'function') {
                window.CartAPI.clearCart();
            }
            window.location.href = 'order-confirmation.html';
        })
        .catch((err) => {
            console.error("تفاصيل الخطأ:", err);
            alert('حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.');
        });
    }

    // 5. ربط الأحداث عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', function () {
        // تأكد من استدعاء دالة ريندر السلة الخاصة بك هنا لكي تظهر البيانات فوراً
        if (typeof renderCheckoutSummary === 'function') {
            renderCheckoutSummary();
        }
        
        const form = document.getElementById('checkout-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
    });
})();
