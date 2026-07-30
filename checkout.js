// ============================================
// Insta Food - Checkout
// بيقرا العربة، يبني رسالة الطلب، ويبعتها تلقائيًا
// على واتساب عن طريق CallMeBot API (من غير ما حد يدوس إرسال)
// وبعدين يوديك لصفحة "تفاصيل الطلب" (order-confirmation.html)
// ============================================

(function () {
    // ===== بيانات UltraMsg =====
    const ULTRAMSG_INSTANCE = 'instance186689';
    const ULTRAMSG_TOKEN = 'l2rm6z3ajakah4hb';
    const RESTAURANT_PHONE = '201555054885'; // رقم المطعم بالكود الدولي بدون +

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

        // إرسال تلقائي لصاحب المطعم
        sendWhatsAppAutomatically(message);

        // نحفظ تفاصيل الطلب عشان صفحة التأكيد تعرضها للعميل
        sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));

        // نفضي العربة عشان الطلب التالي يبدأ من جديد
        window.CartAPI.clearCart();

        // نوصل العميل لصفحة تفاصيل الطلب (مش واتساب)
        window.location.href = 'order-confirmation.html';
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderCheckoutSummary();
        document.getElementById('checkout-form').addEventListener('submit', handleSubmit);
    });
})();
const firebaseConfig = { 
  apiKey: "AIzaSyBnmncW1VG-_O1APFudasVjc-Gt0c8Ddw0", 
  authDomain: "://firebaseapp.com",  
  projectId: "insta-food-8ec99", 
  storageBucket: "insta-food-8ec99.firebasestorage.app", 
  messagingSenderId: "92369606140", 
  appId: "1:92369606140:web:055509eeab4885538bce79" 
};


// 2. تهيئة Firebase وقاعدة البيانات بالطريقة المتوافقة العادية
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. الاستماع لحدث إرسال الفورم عند الضغط على زر "تأكيد الطلب"
const checkoutForm = document.getElementById("checkout-form");

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // منع الصفحة من إعادة التحميل

    // سحب القيم المكتوبة داخل الحقول بناءً على الـ ID
    const customerName = document.getElementById("customer-name").value;
    const customerPhone = document.getElementById("customer-phone").value;
    const customerArea = document.getElementById("customer-area").value;
    const customerAddress = document.getElementById("customer-address").value;
    const customerNotes = document.getElementById("customer-notes").value;
    
    // سحب قيمة إجمالي الحساب من الـ Span (تأكد أن الـ ID الخاص بالسعر في كودك القديم هو checkout-total أو قم بتعديله هنا ليطابقه)
    const totalElement = document.getElementById("checkout-total");
    const totalAmount = totalElement ? totalElement.innerText : "0";

    try {
      // إرسال البيانات إلى تجميعة 'orders' في Cloud Firestore
      const docRef = await db.collection("orders").add({
        name: customerName,
        phone: customerPhone,
        area: customerArea,
        address: customerAddress,
        notes: customerNotes,
        total: totalAmount,
        status: "pending", 
        createdAt: firebase.firestore.FieldValue.serverTimestamp() // وقت السيرفر
      });

      // تنبيه بنجاح العملية
      alert(`تم إرسال طلبك بنجاح! رقم الأوردر: ${docRef.id}`);
      
      // تفريغ الفورم بعد النجاح
      checkoutForm.reset();

    } catch (error) {
      console.error("حدث خطأ أثناء تسجيل الأوردر: ", error);
      alert("عذراً، حدث خطأ أثناء إتمام الطلب، يرجى المحاولة مرة أخرى.");
    }
  });
}
