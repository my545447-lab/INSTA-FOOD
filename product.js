// ============================================
// Insta Food - Product Detail Page Logic
// كمية بلا حد أقصى لكل حاجة + اختيار حجم (لو موجود)
// مع تصفير الكمية تلقائيًا عند تغيير الحجم
// ============================================

(function () {
    const params = new URLSearchParams(window.location.search);

    const name = params.get('name') || '';
    const img = params.get('img') || '';
    const desc = params.get('desc') || '';
    const sizesParam = params.get('sizes');
    const sizes = sizesParam ? JSON.parse(sizesParam) : null;
    const flatPrice = parseInt(params.get('price'), 10) || 0;

    let selectedSizeIndex = 0;
    let mainQty = 1;
    const addonQty = {}; // مثال: { 'extra-0': 2, 'drink-1': 1 }

    // ---------- Helpers ----------
    function getCurrentPrice() {
        return sizes ? sizes[selectedSizeIndex].price : flatPrice;
    }

    function getCurrentSizeLabel() {
        return sizes ? sizes[selectedSizeIndex].label : null;
    }

    function getMainId() {
        return name + '-' + getCurrentPrice() + (getCurrentSizeLabel() ? '-' + getCurrentSizeLabel() : '');
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 1500);
    }

    // ---------- عرض المنتج الأساسي ----------
    function renderMainProduct() {
        document.getElementById('product-name').textContent = name;
        document.getElementById('product-desc').textContent = desc;
        document.getElementById('product-img').src = img;
        document.getElementById('product-img').alt = name;
        updateUnitPriceDisplay();
    }

    function updateUnitPriceDisplay() {
        document.getElementById('product-unit-price').textContent = getCurrentPrice();
    }

    // ---------- اختيار الحجم ----------
    function renderSizePicker() {
        const wrapper = document.getElementById('size-picker');
        if (!sizes) {
            wrapper.style.display = 'none';
            return;
        }
        wrapper.style.display = 'flex';
        wrapper.innerHTML = sizes
            .map(
                (s, i) => `
            <button type="button" class="size-btn ${i === selectedSizeIndex ? 'active' : ''}" data-index="${i}">
                ${s.label}
            </button>
        `
            )
            .join('');

        wrapper.querySelectorAll('.size-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const newIndex = parseInt(btn.dataset.index, 10);
                if (newIndex === selectedSizeIndex) return;

                selectedSizeIndex = newIndex;
                mainQty = 0; // تصفير الكمية عند تغيير الحجم عشان متتلخبطش مع الحجم التاني

                renderSizePicker();
                updateMainQtyDisplay();
                updateUnitPriceDisplay();
                calculateTotal();
            });
        });
    }

    // ---------- عداد كمية المنتج الأساسي ----------
    function updateMainQtyDisplay() {
        document.getElementById('main-qty').textContent = mainQty;
    }

    function initMainQtyButtons() {
        document.getElementById('main-qty-minus').addEventListener('click', () => {
            if (mainQty > 0) mainQty--;
            updateMainQtyDisplay();
            calculateTotal();
        });
        document.getElementById('main-qty-plus').addEventListener('click', () => {
            mainQty++;
            updateMainQtyDisplay();
            calculateTotal();
        });
    }

    // ---------- عرض قوائم الاضافات/المشروبات مع عداد لكل واحدة ----------
    function renderAddonList(containerId, data, prefix) {
        const container = document.getElementById(containerId);
        container.innerHTML = data
            .map(
                (item, i) => `
            <div class="addon-item">
                <img src="${item.img}" alt="${item.name}">
                <span class="addon-name">${item.name}</span>
                <span class="addon-price">EGP ${item.price}</span>
                <div class="qty-control small">
                    <button type="button" class="qty-btn minus" data-key="${prefix}-${i}">−</button>
                    <span class="qty-value" data-display="${prefix}-${i}">0</span>
                    <button type="button" class="qty-btn plus" data-key="${prefix}-${i}">+</button>
                </div>
            </div>
        `
            )
            .join('');

        container.addEventListener('click', function (e) {
            const btn = e.target.closest('.qty-btn');
            if (!btn) return;

            const key = btn.dataset.key;
            const current = addonQty[key] || 0;

            if (btn.classList.contains('plus')) {
                addonQty[key] = current + 1;
            } else if (btn.classList.contains('minus') && current > 0) {
                addonQty[key] = current - 1;
            }

            const displayEl = container.querySelector(`[data-display="${key}"]`);
            if (displayEl) displayEl.textContent = addonQty[key] || 0;

            calculateTotal();
        });
    }

    // ---------- حساب الاجمالي ----------
    function calculateTotal() {
        let total = getCurrentPrice() * mainQty;

        extrasData.forEach((item, i) => {
            const qty = addonQty['extra-' + i] || 0;
            total += item.price * qty;
        });

        drinksData.forEach((item, i) => {
            const qty = addonQty['drink-' + i] || 0;
            total += item.price * qty;
        });

        document.getElementById('product-total').textContent = 'EGP ' + total;
    }

    // ---------- إضافة كل حاجة للعربة ----------
    function addAllToCart() {
        let addedSomething = false;

        if (mainQty > 0) {
            window.CartAPI.addToCart(
                {
                    id: getMainId(),
                    name: name,
                    desc: desc,
                    img: img,
                    price: getCurrentPrice(),
                    size: getCurrentSizeLabel(),
                },
                mainQty
            );
            addedSomething = true;
        }

        extrasData.forEach((item, i) => {
            const qty = addonQty['extra-' + i] || 0;
            if (qty > 0) {
                window.CartAPI.addToCart(
                    { id: 'اضافة-' + item.name, name: item.name, img: item.img, price: item.price },
                    qty
                );
                addedSomething = true;
            }
        });

        drinksData.forEach((item, i) => {
            const qty = addonQty['drink-' + i] || 0;
            if (qty > 0) {
                window.CartAPI.addToCart(
                    { id: 'مشروب-' + item.name, name: item.name, img: item.img, price: item.price },
                    qty
                );
                addedSomething = true;
            }
        });

        if (!addedSomething) {
            showToast('اختار كمية على الأقل قبل الإضافة');
            return;
        }

        // تصفير كل الكميات بعد الإضافة عشان يقدر يضيف تشكيلة تانية (حجم مختلف مثلاً) من غير لخبطة
        mainQty = 0;
        Object.keys(addonQty).forEach((key) => (addonQty[key] = 0));
        document.querySelectorAll('.qty-value[data-display]').forEach((el) => (el.textContent = '0'));
        updateMainQtyDisplay();
        calculateTotal();

        showToast('تمت الإضافة للعربة ✓');
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderMainProduct();
        renderSizePicker();
        initMainQtyButtons();
        renderAddonList('extras-list', extrasData, 'extra');
        renderAddonList('drinks-list', drinksData, 'drink');
        calculateTotal();

        document.getElementById('add-to-cart-btn').addEventListener('click', addAllToCart);
    });
})();