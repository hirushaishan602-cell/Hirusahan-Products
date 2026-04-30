// --- CONFIGURATION START ---
const authConfig = {
  apiKey: "AIzaSyCBu7ffSNMSvrbtOCn6PL9Xhd_XLxneGjI",
  authDomain: "hirusahan.firebaseapp.com",
  projectId: "hirusahan",
  storageBucket: "hirusahan.firebasestorage.app",
  messagingSenderId: "249838072125",
  appId: "1:249838072125:web:90f2331d89b98b75b01554"
};

const dbConfig = {
  apiKey: "AIzaSyBT9c1jMHhU_JD8n7-ImWFCDt40TbfzLX0",
  authDomain: "stock-793e9.firebaseapp.com",
  databaseURL: "https://stock-793e9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "stock-793e9",
  storageBucket: "stock-793e9.firebasestorage.app",
  messagingSenderId: "91336977852",
  appId: "1:91336977852:web:77e0821c73739b67744fb9"
};

if (!firebase.apps.length) {
    firebase.initializeApp(authConfig);
}
const authApp = firebase.initializeApp(authConfig, "authApp");
const dbApp = firebase.initializeApp(dbConfig, "dbApp");
const auth = firebase.auth(authApp);
const db = firebase.database(dbApp);
// --- CONFIGURATION END ---

const loginScreen = document.getElementById('login-screen');
const mainWebsite = document.getElementById('main-website');
const authForm = document.getElementById('authForm');
const reAuthContainer = document.getElementById('reAuthContainer');
const emailField = document.getElementById('user-email');
const passwordField = document.getElementById('user-pass');
const togglePassword = document.getElementById('togglePassword');
const rememberMeCheckbox = document.getElementById('remember-me');
const loadingOverlay = document.getElementById('loading-overlay');

let orderList = [];

// Stock Sync
function syncStock() {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) { displayProducts(data); }
        else {
            const container = document.getElementById('product-container');
            if(container) container.innerHTML = "<p>Loading products...</p>";
        }
    });
}

// Initialization[cite: 3]
window.addEventListener('load', () => {
    const isAuth = localStorage.getItem('hirusahan_auth') === 'granted';
    const savedEmail = localStorage.getItem('remembered_email');
    if (isAuth && savedEmail) {
        if(authForm) authForm.style.display = 'none';
        if(reAuthContainer) reAuthContainer.style.display = 'block';
    } else {
        if(authForm) authForm.style.display = 'block';
        if(reAuthContainer) reAuthContainer.style.display = 'none';
    }
    if (savedEmail && emailField) {
        emailField.value = savedEmail;
        rememberMeCheckbox.checked = true;
    }
    syncStock(); 
});

// Password Toggle
if(togglePassword) {
    togglePassword.addEventListener('click', function () {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// Auth Logic
if(authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailField.value.trim(); 
        const password = passwordField.value;
        if(loadingOverlay) loadingOverlay.style.display = 'flex';
        try {
            await auth.signInWithEmailAndPassword(email, password);
            handleSuccessAuth(email);
        } catch (error) {
            if (error.code === 'auth/invalid-login-credentials' || error.code === 'auth/user-not-found') {
                try {
                    await auth.createUserWithEmailAndPassword(email, password);
                    handleSuccessAuth(email);
                } catch (regError) { alert("Error: " + regError.message); }
            } else { alert("Failed: " + error.message); }
        } finally { if(loadingOverlay) loadingOverlay.style.display = 'none'; }
    });
}

// Google Login Function - මෙය දැන් නිවැරදිව ක්‍රියා කරයි
window.socialAuth = async function(platform) {
    if (platform === 'Google') {
        const provider = new firebase.auth.GoogleAuthProvider();
        if(loadingOverlay) loadingOverlay.style.display = 'flex';
        try {
            const result = await auth.signInWithPopup(provider);
            handleSuccessAuth(result.user.email);
        } catch (error) {
            console.error("Google Auth Error:", error);
            alert("Google Login Failed: " + error.message);
        } finally {
            if(loadingOverlay) loadingOverlay.style.display = 'none';
        }
    }
};

function handleSuccessAuth(email) {
    localStorage.setItem('hirusahan_auth', 'granted');
    if (rememberMeCheckbox.checked) localStorage.setItem('remembered_email', email);
    else localStorage.removeItem('remembered_email');
    showWebsite();
}

function showWebsite() {
    if(loginScreen) loginScreen.style.display = 'none';
    if(mainWebsite) mainWebsite.style.display = 'block';
}

window.secureLogout = function() {
    localStorage.removeItem('hirusahan_auth');
    location.reload(); 
}

window.clearSavedSession = function() {
    auth.signOut();
    localStorage.removeItem('hirusahan_auth');
    localStorage.removeItem('remembered_email');
    location.reload();
}

// Display Products
function displayProducts(products) {
    const container = document.getElementById('product-container');
    if(!container) return;
    const productArray = Array.isArray(products) ? products : Object.values(products);
    container.innerHTML = productArray.map((p, index) => {
        const stockValue = p.inStock !== undefined ? p.inStock : p.instock;
        const isAvailable = String(stockValue).toLowerCase() === "true";
        return `
            <div class="product-card ${isAvailable ? '' : 'product-unavailable'}" style="position: relative;">
                ${!isAvailable ? `<div class="stock-badge status-out">OUT OF STOCK</div>` : ''}
                <div class="product-img-container">
                    ${p.img && (p.img.includes('/') || p.img.includes('.')) 
                        ? `<img src="${p.img}" alt="${p.name}" class="product-image">` 
                        : `<span class="product-emoji">${p.img || '📦'}</span>`}
                </div>
                <h3>${p.name}</h3>
                <div class="product-options">
                    <div class="option-group">
                        <label>Weight:</label>
                        <select id="weight-${index}" class="item-weight" ${isAvailable ? '' : 'disabled'}>
                            <option value="0.5">50g</option>
                            <option value="1" selected>100g</option>
                            <option value="2.5">250g</option>
                            <option value="5">500g</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label>Packets:</label>
                        <input type="number" id="qty-${index}" class="item-qty" value="1" min="1" ${isAvailable ? '' : 'disabled'}>
                    </div>
                </div>
                <p class="price-tag">LKR ${p.price ? p.price.toFixed(2) : '0.00'} (100g)</p>
                <button class="add-cart" onclick="addToListFromDB(${index}, '${p.name}', ${p.price})" ${isAvailable ? '' : 'disabled'}>
                    ${isAvailable ? 'ADD TO LIST' : 'OUT OF STOCK'}
                </button>
            </div>
        `;
    }).join('');
}

// Order Management
window.addToListFromDB = function(index, name, price) {
    const weightSelect = document.getElementById(`weight-${index}`);
    const qtyInput = document.getElementById(`qty-${index}`);
    const weightMultiplier = parseFloat(weightSelect.value);
    const weightLabel = weightSelect.options[weightSelect.selectedIndex].text;
    const qty = parseInt(qtyInput.value);
    if (qty < 1) return;
    const subtotal = price * weightMultiplier * qty;
    orderList.push({ name: name, weight: weightLabel, qty: qty, total: subtotal });
    
    const floatingCart = document.getElementById('floating-cart');
    if (floatingCart) {
        floatingCart.style.display = 'flex';
        document.getElementById('cart-dot-count').innerText = orderList.length;
    }
    updateOrderTable();
};

function updateOrderTable() {
    const tableBody = document.getElementById('orderItems');
    if(!tableBody) return;
    tableBody.innerHTML = orderList.map((item, index) => `
        <tr><td>${item.name}</td><td>${item.weight}</td><td>${item.qty}</td><td>LKR ${item.total.toFixed(2)}</td>
        <td><button class="remove-item" onclick="removeItem(${index})"><i class="fas fa-trash"></i></button></td></tr>
    `).join('');
    const grandTotal = orderList.reduce((sum, item) => sum + item.total, 0);
    document.getElementById('grandTotal').innerText = grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2});
}

window.removeItem = function(index) {
    orderList.splice(index, 1);
    document.getElementById('cart-dot-count').innerText = orderList.length;
    if(orderList.length === 0) document.getElementById('floating-cart').style.display = 'none';
    updateOrderTable();
};

// Scroll Function
window.scrollToOrderTable = function() {
    const section = document.getElementById('order-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
};

// WhatsApp Invoice[cite: 3]
window.sendToWhatsApp = function() {
    if (orderList.length === 0) { alert("ඔබේ Order List එක හිස්!"); return; }
    const name = document.getElementById('cust-name').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    if (!name || !address || !phone) { alert("කරුණාකර ඔබගේ විස්තර සම්පූර්ණ කරන්න."); return; }
    
    let msg = "━━━━━━━━━━━━━━━━━━━━━━\n   *HIRUSAHAN PRODUCTS - INVOICE*   \n━━━━━━━━━━━━━━━━━━━━━━\n";
    msg += `📅 Date: ${new Date().toLocaleDateString()}\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 *CUSTOMER:*\nName: ${name}\nAddress: ${address}\nPhone: ${phone}\n━━━━━━━━━━━━━━━━━━━━━━\n\n*ITEMS:*\n`;
    orderList.forEach((item, i) => { msg += `${i+1}. *${item.name}* (${item.weight} x ${item.qty}) - LKR ${item.total.toFixed(2)}\n`; });
    const total = orderList.reduce((sum, item) => sum + item.total, 0);
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━\n*TOTAL: LKR ${total.toLocaleString()}*\n━━━━━━━━━━━━━━━━━━━━━━\n✅ Please confirm. Thank you!`;
    window.open(`https://wa.me/94723961127?text=${encodeURIComponent(msg)}`, '_blank');
};