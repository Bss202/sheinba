document.addEventListener('DOMContentLoaded', () => {
    const isAdminPage = document.getElementById('addOrderForm');
    const isTrackingPage = document.getElementById('searchInput');

    if (isAdminPage) {
        initAdminAuth();
    }

    if (isTrackingPage) {
        initTrackingPage();
    }
});

// --- Admin Authentication ---

const ADMIN_PASSWORD = '16720';

function initAdminAuth() {
    const loginOverlay = document.getElementById('loginOverlay');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;

        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showDashboard();
            loginError.style.display = 'none';
            loginForm.reset();
        } else {
            loginError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminLoggedIn');
        hideDashboard();
    });

    function showDashboard() {
        loginOverlay.style.display = 'none';
        adminDashboard.style.display = 'block';
        initAdminPage();
    }

    function hideDashboard() {
        loginOverlay.style.display = 'flex';
        adminDashboard.style.display = 'none';
    }
}

// --- Data Management ---

function getOrders() {
    const orders = localStorage.getItem('orders');
    return orders ? JSON.parse(orders) : [];
}

function saveOrders(orders) {
    localStorage.setItem('orders', JSON.stringify(orders));
}

function generateTrackingCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function addOrder(order) {
    const orders = getOrders();
    order.trackingCode = generateTrackingCode();
    order.status = 'ordered';
    orders.unshift(order);
    saveOrders(orders);
    return order.trackingCode;
}

function updateStatus(id, newStatus) {
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        saveOrders(orders);
    }
}

function deleteOrder(id) {
    let orders = getOrders();
    orders = orders.filter(order => order.id !== id);
    saveOrders(orders);
    return orders;
}

const statusLabels = {
    'ordered': 'تم الطلب',
    'preparing': 'قيد التجهيز',
    'shipped': 'تم الشحن',
    'out-for-delivery': 'قيد التوصيل',
    'delivered': 'تم التوصيل'
};

// --- Admin Page Logic ---

function initAdminPage() {
    const form = document.getElementById('addOrderForm');
    const tableBody = document.getElementById('ordersTableBody');
    const noOrdersMsg = document.getElementById('noOrdersMessage');
    const addProductBtn = document.getElementById('addProductBtn');
    const productsContainer = document.getElementById('productsContainer');
    const totalPriceEl = document.getElementById('totalPrice');

    let productCount = 0;

    document.getElementById('orderDate').valueAsDate = new Date();

    // Add first product automatically
    addProductField();

    // Add Product Button
    addProductBtn.addEventListener('click', () => {
        addProductField();
    });

    function addProductField() {
        productCount++;
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.dataset.id = productCount;

        productItem.innerHTML = `
            <div class="product-item-header">
                <span class="product-number">المنتج ${productCount}</span>
                <button type="button" class="btn-remove-product" onclick="removeProduct(this)">حذف</button>
            </div>
            <div class="product-row">
                <div class="form-group">
                    <label>اسم المنتج</label>
                    <input type="text" class="product-name" placeholder="مثال: ساعة ذكية" required>
                </div>
                <div class="form-group">
                    <label>رابط المنتج (اختياري)</label>
                    <input type="url" class="product-link" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label>السعر</label>
                    <input type="number" class="product-price" placeholder="0.00" required>
                </div>
            </div>
        `;

        productsContainer.appendChild(productItem);

        // Update total when price changes
        const priceInput = productItem.querySelector('.product-price');
        priceInput.addEventListener('input', updateTotalPrice);
    }

    window.removeProduct = function (btn) {
        const productItem = btn.closest('.product-item');
        if (productsContainer.children.length > 1) {
            productItem.remove();
            updateTotalPrice();
            renumberProducts();
        } else {
            alert('يجب أن يحتوي الطلب على منتج واحد على الأقل');
        }
    };

    function renumberProducts() {
        const products = productsContainer.querySelectorAll('.product-item');
        products.forEach((product, index) => {
            product.querySelector('.product-number').textContent = `المنتج ${index + 1}`;
        });
    }

    function updateTotalPrice() {
        const prices = Array.from(document.querySelectorAll('.product-price'))
            .map(input => parseFloat(input.value) || 0);
        const total = prices.reduce((sum, price) => sum + price, 0);
        totalPriceEl.textContent = total.toFixed(2);
    }

    function getProductsFromForm() {
        const productItems = productsContainer.querySelectorAll('.product-item');
        const products = [];

        productItems.forEach(item => {
            const name = item.querySelector('.product-name').value.trim();
            const link = item.querySelector('.product-link').value.trim();
            const price = parseFloat(item.querySelector('.product-price').value) || 0;

            if (name && price > 0) {
                products.push({ name, link, price });
            }
        });

        return products;
    }

    // Initial render
    renderOrdersTable();

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const products = getProductsFromForm();
        if (products.length === 0) {
            alert('الرجاء إضافة منتج واحد على الأقل');
            return;
        }

        const totalPrice = products.reduce((sum, p) => sum + p.price, 0);

        const newOrder = {
            id: Date.now().toString(),
            customerName: document.getElementById('customerName').value.trim(),
            products: products,
            totalPrice: totalPrice,
            date: document.getElementById('orderDate').value
        };

        addOrder(newOrder);
        form.reset();
        productsContainer.innerHTML = '';
        productCount = 0;
        addProductField();
        document.getElementById('orderDate').valueAsDate = new Date();
        totalPriceEl.textContent = '0.00';
        renderOrdersTable();
        alert('تم إضافة الطلب بنجاح!');
    });

    // Event Delegation for Delete and Status Change
    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
                deleteOrder(id);
                renderOrdersTable();
            }
        }
    });

    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select')) {
            const id = e.target.dataset.id;
            const newStatus = e.target.value;
            updateStatus(id, newStatus);
            renderOrdersTable();
        }
    });

    function renderOrdersTable() {
        const orders = getOrders();
        tableBody.innerHTML = '';

        if (orders.length === 0) {
            noOrdersMsg.style.display = 'block';
        } else {
            noOrdersMsg.style.display = 'none';
            orders.forEach(order => {
                const row = document.createElement('tr');

                // Products display
                let productsDisplay = '';
                if (order.products && order.products.length > 0) {
                    productsDisplay = order.products.map(p => {
                        if (p.link) {
                            return `<span class="product-badge"><a href="${p.link}" target="_blank" class="product-link">${p.name}</a></span>`;
                        }
                        return `<span class="product-badge">${p.name}</span>`;
                    }).join('');
                } else {
                    // Backward compatibility for old orders
                    productsDisplay = order.productName || '-';
                }

                // Total price - handle old and new format
                const totalPrice = order.totalPrice || order.price || 0;

                // Status Dropdown
                const statusOptions = Object.entries(statusLabels).map(([value, label]) =>
                    `<option value="${value}" ${order.status === value ? 'selected' : ''}>${label}</option>`
                ).join('');

                row.innerHTML = `
                    <td><span class="status-badge status-${order.status}">${order.trackingCode || '-'}</span></td>
                    <td>${order.customerName}</td>
                    <td>${productsDisplay}</td>
                    <td>${totalPrice}</td>
                    <td>${order.date}</td>
                    <td>
                        <select class="status-select" data-id="${order.id}">
                            ${statusOptions}
                        </select>
                    </td>
                    <td>
                        <button class="delete-btn" data-id="${order.id}">حذف</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    }
}

// --- Tracking Page Logic ---

function initTrackingPage() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('searchResults');
    const messageState = document.getElementById('searchMessage');

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    function performSearch() {
        const query = searchInput.value.trim();

        if (!query) {
            alert('الرجاء إدخال رقم التتبع');
            return;
        }

        const orders = getOrders();
        const results = orders.filter(order =>
            order.trackingCode === query
        );

        displayResults(results);
    }

    function displayResults(results) {
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            messageState.style.display = 'block';
            messageState.textContent = 'لا يوجد طلب بهذا الرقم. تأكد من رقم التتبع.';
        } else {
            messageState.style.display = 'none';
            results.forEach(order => {
                const card = document.createElement('div');
                card.className = 'order-card';

                // Products display
                let productsDisplay = '';
                if (order.products && order.products.length > 0) {
                    productsDisplay = order.products.map(p => {
                        if (p.link) {
                            return `
                                <div class="order-detail">
                                    <span>${p.name}:</span>
                                    <strong><a href="${p.link}" target="_blank" class="product-link">رابط المنتج</a></strong>
                                </div>
                            `;
                        }
                        return `
                            <div class="order-detail">
                                <span>${p.name}:</span>
                                <strong>${p.price}</strong>
                            </div>
                        `;
                    }).join('');
                } else {
                    // Backward compatibility
                    productsDisplay = `
                        <div class="order-detail">
                            <span>المنتج:</span>
                            <strong>${order.productName || '-'}</strong>
                        </div>
                    `;
                }

                const statusLabel = statusLabels[order.status] || order.status;
                const totalPrice = order.totalPrice || order.price || 0;

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3>الطلب #${order.trackingCode}</h3>
                        <span class="status-badge status-${order.status}">${statusLabel}</span>
                    </div>
                    <div class="order-detail">
                        <span>العميل:</span>
                        <strong>${order.customerName}</strong>
                    </div>
                    ${productsDisplay}
                    <div class="order-detail">
                        <span>السعر الكلي:</span>
                        <strong>${totalPrice}</strong>
                    </div>
                    <div class="order-detail">
                        <span>التاريخ:</span>
                        <strong>${order.date}</strong>
                    </div>
                `;
                resultsContainer.appendChild(card);
            });
        }
    }
}
