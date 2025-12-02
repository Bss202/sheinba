document.addEventListener('DOMContentLoaded', () => {
    // Check which page we are on
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

const ADMIN_PASSWORD = '16720'; // Change this to your desired password

function initAdminAuth() {
    const loginOverlay = document.getElementById('loginOverlay');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check if already logged in
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
    }

    // Handle login
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

    // Handle logout
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
    order.status = 'ordered'; // Default status
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
    'preparing': 'قيد التجهيز  ',
    'shipped': 'تم الشحن',
    'out-for-delivery': 'قيد التوصيل',
    'delivered': 'تم التوصيل'
};

// --- Admin Page Logic ---

function initAdminPage() {
    const form = document.getElementById('addOrderForm');
    const tableBody = document.getElementById('ordersTableBody');
    const noOrdersMsg = document.getElementById('noOrdersMessage');

    // Set today's date as default
    document.getElementById('orderDate').valueAsDate = new Date();

    // Initial render
    renderOrdersTable();

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newOrder = {
            id: Date.now().toString(),
            customerName: document.getElementById('customerName').value.trim(),
            productName: document.getElementById('productName').value.trim(),
            productLink: document.getElementById('productLink').value.trim(),
            price: document.getElementById('price').value,
            date: document.getElementById('orderDate').value
        };

        addOrder(newOrder);
        form.reset();
        document.getElementById('orderDate').valueAsDate = new Date(); // Reset date to today
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
            renderOrdersTable(); // Re-render to update badge color
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

                let productDisplay = order.productName;
                if (order.productLink) {
                    productDisplay = `<a href="${order.productLink}" target="_blank" class="product-link">${order.productName}</a>`;
                }

                // Status Dropdown
                const statusOptions = Object.entries(statusLabels).map(([value, label]) =>
                    `<option value="${value}" ${order.status === value ? 'selected' : ''}>${label}</option>`
                ).join('');

                row.innerHTML = `
                    <td><span class="status-badge status-${order.status}">${order.trackingCode || '-'}</span></td>
                    <td>${order.customerName}</td>
                    <td>${productDisplay}</td>
                    <td>${order.price}</td>
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
        // Search by tracking code
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

                let productDisplay = order.productName;
                if (order.productLink) {
                    productDisplay = `<a href="${order.productLink}" target="_blank" class="product-link">${order.productName}</a>`;
                }

                const statusLabel = statusLabels[order.status] || order.status;

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <h3>${productDisplay}</h3>
                        <span class="status-badge status-${order.status}">${statusLabel}</span>
                    </div>
                    <div class="order-detail">
                        <span>رقم التتبع:</span>
                        <strong>${order.trackingCode}</strong>
                    </div>
                    <div class="order-detail">
                        <span>العميل:</span>
                        <strong>${order.customerName}</strong>
                    </div>
                    <div class="order-detail">
                        <span>السعر:</span>
                        <strong>${order.price}</strong>
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
