(function () {
    const ORDER_STORAGE_KEY = 'insta-food-last-order';

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'numeric',
        });
    }

    function render() {
        const container = document.getElementById('confirmation-content');
        const raw = sessionStorage.getItem(ORDER_STORAGE_KEY);

        if (!raw) {
            container.innerHTML = `
                <div class="confirmation-empty">
                    <h2>مفيش طلب لعرضه</h2>
                    <p>يبدو إنك دخلت الصفحة دي مباشرة من غير ما تعمل طلب.</p>
                    <a href="index.html#menu" class="browse-menu-btn">تصفح المنيو</a>
                </div>
            `;
            return;
        }

        const order = JSON.parse(raw);

        const itemsHtml = order.items
            .map(
                (item) => `
            <div class="confirmation-item-row">
                <span>${escapeHtml(item.name)}${item.size ? ` (${escapeHtml(item.size)})` : ''} × ${item.quantity}</span>
                <span>EGP ${item.price * item.quantity}</span>
            </div>
        `
            )
            .join('');

        container.innerHTML = `
            <div class="confirmation-card">
                <div class="confirmation-check">✅</div>
                <h1>تم استلام طلبك بنجاح</h1>
                <p class="confirmation-sub">هنتواصل معاك قريب لتأكيد الطلب والتوصيل</p>

                <div class="confirmation-order-id">رقم الطلب: <strong>${escapeHtml(order.orderId)}</strong></div>
                <div class="confirmation-time">${formatTime(order.orderTime)}</div>

                <hr>

                <h2>الأصناف</h2>
                <div class="confirmation-items">${itemsHtml}</div>

                <div class="confirmation-total-row">
                    <span>الاجمالي</span>
                    <span>EGP ${order.total.toFixed(0)}</span>
                </div>

                <hr>

                <h2>بيانات التوصيل</h2>
                <div class="confirmation-detail-row"><span>الاسم</span><span>${escapeHtml(order.customerName)}</span></div>
                <div class="confirmation-detail-row"><span>التليفون</span><span>${escapeHtml(order.customerPhone)}</span></div>
                <div class="confirmation-detail-row"><span>المنطقة</span><span>${escapeHtml(order.customerArea)}</span></div>
                <div class="confirmation-detail-row"><span>العنوان</span><span>${escapeHtml(order.customerAddress)}</span></div>
                ${order.customerNotes ? `<div class="confirmation-detail-row"><span>ملاحظات</span><span>${escapeHtml(order.customerNotes)}</span></div>` : ''}
                <div class="confirmation-detail-row"><span>طريقة الدفع</span><span>${escapeHtml(order.paymentMethod)}</span></div>

                <a href="index.html#menu" class="browse-menu-btn">اطلب حاجة تانية</a>
            </div>
        `;
    }

    document.addEventListener('DOMContentLoaded', render);
})();