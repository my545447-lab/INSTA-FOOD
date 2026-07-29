// ============================================
// Insta Food - Cart System
// - كارت المنيو نفسه فيه عداد كمية (+ / -) مباشر
// - تغيير الحجم (Medium/Large) بيصفر الكمية القديمة
// - الدوس على أي حتة تانية بالكارت يودي لصفحة تفاصيل المنتج
// - العربة بتتخزن في localStorage
// ============================================

(function () {
    const CART_KEY = 'insta-food-cart';
    const DIRECT_ADD_SECTIONS = ['extras-section', 'drinks-section'];

    // ---------- Storage Helpers ----------
    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadge();
    }

    function addToCart(item, quantity = 1) {
        const cart = getCart();
        const existing = cart.find((i) => i.id === item.id);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({ ...item, quantity });
        }
        saveCart(cart);
    }

    function removeFromCart(id) {
        let cart = getCart();
        cart = cart.filter((i) => i.id !== id);
        saveCart(cart);
        renderCartPage();
    }

    function updateQuantity(id, quantity) {
        let cart = getCart();
        if (quantity <= 0) {
            cart = cart.filter((i) => i.id !== id);
        } else {
            const item = cart.find((i) => i.id === id);
            if (item) item.quantity = quantity;
        }
        saveCart(cart);
        renderCartPage();
    }

    function clearCart() {
        saveCart([]);
        renderCartPage();
    }

    function getItemQuantity(id) {
        const item = getCart().find((i) => i.id === id);
        return item ? item.quantity : 0;
    }

    // ---------- Cart Badge (رقم العربة في الهيدر) ----------
    function updateCartBadge() {
        const cart = getCart();
        const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
        const badge = document.querySelector('.cart-badge');
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    // ---------- قراءة بيانات الكارت ----------
    function readCardData(card) {
        const name = card.querySelector('h3').textContent.trim();
        const img = card.querySelector('img').getAttribute('src');
        const descEl = card.querySelector('.product-desc');
        const desc = descEl ? descEl.textContent.trim() : '';
        const priceEl = card.querySelector('.selected-price span');
        const price = parseInt(priceEl.textContent.trim(), 10);

        let size = null;
        const checkedRadio = card.querySelector('.size-selector input[type="radio"]:checked');
        if (checkedRadio) {
            const label = card.querySelector('label[for="' + checkedRadio.id + '"]');
            size = label ? label.textContent.trim() : null;
        }

        return { name, img, desc, price, size };
    }

    function readAllSizes(card) {
        const radios = card.querySelectorAll('.size-selector input[type="radio"]');
        if (radios.length === 0) return null;

        const sizes = [];
        radios.forEach((radio) => {
            const label = card.querySelector('label[for="' + radio.id + '"]');
            sizes.push({
                label: label ? label.textContent.trim() : '',
                price: parseInt(radio.value, 10),
            });
        });
        return sizes;
    }

    function computeCardId(card) {
        const data = readCardData(card);
        const id = data.name + '-' + data.price + (data.size ? '-' + data.size : '');
        return { id, data };
    }

    // ---------- أنيميشن ضغط بسيط لأي زرار ----------
    function animatePress(el) {
        el.classList.add('pressed');
        setTimeout(() => el.classList.remove('pressed'), 150);
    }

    // ---------- رسالة تأكيد سريعة (Toast) في أي صفحة ----------
    function getOrCreateToast() {
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        return toast;
    }

    function showToast(message) {
        const toast = getOrCreateToast();
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._hideTimeout);
        toast._hideTimeout = setTimeout(() => toast.classList.remove('show'), 1800);
    }

    // ---------- التوجيه لصفحة تفاصيل المنتج ----------
    function goToProductPage(card) {
        const data = readCardData(card);
        const sizes = readAllSizes(card);

        const queryObj = { name: data.name, img: data.img, desc: data.desc };
        if (sizes) {
            queryObj.sizes = JSON.stringify(sizes);
        } else {
            queryObj.price = data.price;
        }

        const query = new URLSearchParams(queryObj).toString();
        window.location.href = 'product.html?' + query;
    }

    // ---------- ويدجت الكمية على الكارت نفسه ----------
    function renderAddState(card, wrapper) {
        wrapper.dataset.currentId = '';
        wrapper.innerHTML = `<button type="button" class="add-btn">+ اضافة</button>`;

        const addBtn = wrapper.querySelector('.add-btn');
        addBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            animatePress(addBtn);

            const { id, data } = computeCardId(card);
            addToCart({ id, ...data });
            wrapper.dataset.currentId = id;
            renderQtyState(card, wrapper, id);
        });
    }

    function renderQtyState(card, wrapper, id) {
        const qty = getItemQuantity(id);
        wrapper.innerHTML = `
            <div class="card-qty-control">
                <button type="button" class="qty-btn minus">−</button>
                <span class="qty-value">${qty}</span>
                <button type="button" class="qty-btn plus">+</button>
            </div>
            <button type="button" class="confirm-order-btn">تأكيد ✓</button>
        `;

        const plusBtn = wrapper.querySelector('.plus');
        const minusBtn = wrapper.querySelector('.minus');
        const valueEl = wrapper.querySelector('.qty-value');
        const confirmBtn = wrapper.querySelector('.confirm-order-btn');

        plusBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            animatePress(plusBtn);
            const newQty = getItemQuantity(id) + 1;
            updateQuantity(id, newQty);
            valueEl.textContent = newQty;
        });

        minusBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            animatePress(minusBtn);
            const newQty = getItemQuantity(id) - 1;
            updateQuantity(id, newQty);

            if (newQty <= 0) {
                renderAddState(card, wrapper);
            } else {
                valueEl.textContent = newQty;
            }
        });

        confirmBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            animatePress(confirmBtn);
            const data = readCardData(card);
            const currentQty = getItemQuantity(id);
            showToast(`تم تأكيد ${data.name} × ${currentQty} ✓`);
            renderAddState(card, wrapper);
        });
    }

    function setupCardWidget(card, originalBtn) {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-qty-wrapper';
        originalBtn.replaceWith(wrapper);
        renderAddState(card, wrapper);
        return wrapper;
    }

    // ---------- تجهيز كل كارت في المنيو ----------
    function initProductCards() {
        document.querySelectorAll('.product-card').forEach((card) => {
            const btn = card.querySelector('.add-btn');
            if (!btn) return;

            const section = card.closest('.menu-category');
            const sectionId = section ? section.id : '';
            const isDirectSection = DIRECT_ADD_SECTIONS.includes(sectionId);

            const wrapper = setupCardWidget(card, btn);

            // الدوس على أي حتة تانية بالكارت يودي لصفحة التفاصيل
            // (ده مش شغال في قسمي الاضافات والمشروبات لأنهم مالهمش صفحة تفاصيل)
            if (!isDirectSection) {
                card.classList.add('clickable-card');
                card.addEventListener('click', function (e) {
                    if (e.target.closest('.card-qty-wrapper') || e.target.closest('.size-selector')) return;
                    goToProductPage(card);
                });
            }

            // تغيير الحجم (Medium/Large) بيصفر الكمية القديمة
            const sizeRadios = card.querySelectorAll('.size-selector input[type="radio"]');
            sizeRadios.forEach((radio) => {
                radio.addEventListener('change', function () {
                    const oldId = wrapper.dataset.currentId;
                    if (oldId) {
                        removeFromCart(oldId);
                    }
                    renderAddState(card, wrapper);
                });
            });
        });
    }

    // ---------- عرض صفحة العربة (cart.html) ----------
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderCartPage() {
        const container = document.getElementById('cart-container');
        if (!container) return; // مش في صفحة العربة

        const cart = getCart();
        const titleEl = document.getElementById('cart-title');

        if (cart.length === 0) {
            if (titleEl) titleEl.textContent = 'عربة التسوق';
            container.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛍️</div>
                    <h2>عربة التسوق فارغة</h2>
                    <p>أضف حاجة لذيذة عشان تبدأ.</p>
                    <a href="index.html#menu" class="browse-menu-btn">تصفح المنيو</a>
                </div>
            `;
            return;
        }

        if (titleEl) titleEl.textContent = `عربة التسوق (${cart.length})`;

        const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const total = subtotal;

        const itemsHtml = cart
            .map(
                (item) => `
            <div class="cart-item" data-id="${escapeHtml(item.id)}">
                <img src="${item.img}" alt="${escapeHtml(item.name)}">
                <div class="cart-item-info">
                    <h3>${escapeHtml(item.name)}${item.size ? ` <span class="cart-item-size">(${escapeHtml(item.size)})</span>` : ''}</h3>
                    ${item.desc ? `<p>${escapeHtml(item.desc)}</p>` : ''}
                </div>
                <div class="cart-qty">
                    <button class="qty-btn minus" type="button">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn plus" type="button">+</button>
                </div>
                <div class="cart-item-price">EGP ${item.price * item.quantity}</div>
                <button class="remove-btn" type="button" aria-label="حذف">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                    </svg>
                </button>
            </div>
        `
            )
            .join('');

        container.innerHTML = `
            <div class="cart-layout">
                <div class="cart-items">
                    <button class="clear-all-btn" type="button">🗑 حذف الكل</button>
                    ${itemsHtml}
                </div>
                <div class="order-summary">
                    <h2>ملخص الطلب</h2>
                    <div class="summary-row total"><span>الاجمالي</span><span>EGP ${total.toFixed(0)}</span></div>
                    <button class="checkout-btn" type="button">إتمام الطلب</button>
                </div>
            </div>
        `;

        container.querySelectorAll('.cart-item').forEach((itemEl) => {
            const id = itemEl.getAttribute('data-id');
            const cartItem = cart.find((i) => i.id === id);
            if (!cartItem) return;

            itemEl.querySelector('.plus').addEventListener('click', () => {
                updateQuantity(id, cartItem.quantity + 1);
            });
            itemEl.querySelector('.minus').addEventListener('click', () => {
                updateQuantity(id, cartItem.quantity - 1);
            });
            itemEl.querySelector('.remove-btn').addEventListener('click', () => {
                removeFromCart(id);
            });
        });

        const checkoutBtn = container.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                window.location.href = 'checkout.html';
            });
        }

        const clearAllBtn = container.querySelector('.clear-all-btn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('متأكد إنك عايز تمسح كل حاجة من العربة؟')) {
                    clearCart();
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        initProductCards();
        updateCartBadge();
        renderCartPage();
    });

    window.CartAPI = { addToCart, getCart, removeFromCart, updateQuantity, clearCart };
})();