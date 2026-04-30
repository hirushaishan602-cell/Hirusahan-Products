// --- CONFIGURATION START ---

// 1. Project A (Authentication)
const authConfig = {
  apiKey: "AIzaSyCBu7ffSNMSvrbtOCn6PL9Xhd_XLxneGjI",
  authDomain: "hirusahan.firebaseapp.com",
  projectId: "hirusahan",
  storageBucket: "hirusahan.firebasestorage.app",
  messagingSenderId: "249838072125",
  appId: "1:249838072125:web:90f2331d89b98b75b01554"
};

// 2. Project B (Realtime Database)
const dbConfig = {
  apiKey: "AIzaSyBT9c1jMHhU_JD8n7-ImWFCDt40TbfzLX0",
  authDomain: "stock-793e9.firebaseapp.com",
  databaseURL: "https://stock-793e9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "stock-793e9",
  storageBucket: "stock-793e9.firebasestorage.app",
  messagingSenderId: "91336977852",
  appId: "1:91336977852:web:77e0821c73739b67744fb9"
};

// මුලින්ම පවතින Firebase instance තිබේදැයි බලා පිරිසිදු කිරීම
if (!firebase.apps.length) {
    firebase.initializeApp(authConfig);
}
const authApp = firebase.initializeApp(authConfig, "authApp");
const dbApp = firebase.initializeApp(dbConfig, "dbApp");

const auth = firebase.auth(authApp);
const db = firebase.database(dbApp);

// --- CONFIGURATION END ---

// HTML Elements
const loginScreen = document.getElementById('login-screen');
const mainWebsite = document.getElementById('main-website');
const authForm = document.getElementById('authForm');
const reAuthContainer = document.getElementById('reAuthContainer');
const emailField = document.getElementById('user-email');
const passwordField = document.getElementById('user-pass');
const togglePassword = document.getElementById('togglePassword');
const rememberMeCheckbox = document.getElementById('remember-me');
const loadingOverlay = document.getElementById('loading-overlay');

let orderList = []; // [cite: 1]

// Stock Sync[cite: 1]
function syncStock() {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            displayProducts(data);
        } else {
            const container = document.getElementById('product-container');
            if(container) container.innerHTML = "<p>Loading products...</p>";
        }
    });
}

// Initialization[cite: 1]
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

// Password Toggle[cite: 1]
if(togglePassword) {
    togglePassword.addEventListener('click', function () {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// Authentication Logic[cite: 1]
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
                } catch (regError) {
                    alert("Registration Error: " + regError.message);
                }
            } else {
                alert("Login Failed: " + error.message);
            }
        } finally {
            if(loadingOverlay) loadingOverlay.style.display = 'none';
        }
    });
}

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

window.clearSavedSession = function() {
    auth.signOut();
    localStorage.removeItem('hirusahan_auth');
    localStorage.removeItem('remembered_email');
    location.reload();
}

window.secureLogout = function() {
    localStorage.removeItem('hirusahan_auth');
    location.reload(); 
}

// Display Products[cite: 1]
function displayProducts(products) {
    const container = document.getElementById('product-container');
    if(!container) return;
    
    const productArray = Array.isArray(products) ? products : Object.values(products);
    
    container.innerHTML = productArray.map((p, index) => {
        const stockValue = p.inStock !== undefined ? p.inStock : p.instock;
        const isAvailable = String(stockValue).toLowerCase() === "true";
        
        const statusText = isAvailable ? "AVAILABLE" : "OUT OF STOCK";
        const statusClass = isAvailable ? "status-available" : "status-out";
        const isDisable = isAvailable ? "" : "disabled";

        return `
            <div class="product-card ${isAvailable ? '' : 'product-unavailable'}">
                <div class="stock-badge ${statusClass}">${statusText}</div>
                <div class="product-img-container">
                    ${p.img && (p.img.includes('/') || p.img.includes('.')) 
                        ? `<img src="${p.img}" alt="${p.name}" class="product-image">` 
                        : `<span class="product-emoji">${p.img || '📦'}</span>`}
                </div>
                <h3>${p.name}</h3>
                <div class="product-options">
                    <div class="option-group">
                        <label>Weight:</label>
                        <select id="weight-${index}" class="item-weight" ${isDisable}>
                            <option value="0.5">50g</option>
                            <option value="1" selected>100g</option>
                            <option value="2.5">250g</option>
                            <option value="5">500g</option>
                        </select>
                    </div>
                    <div class="option-group">
                        <label>Packets:</label>
                        <input type="number" id="qty-${index}" class="item-qty" value="1" min="1" ${isDisable}>
                    </div>
                </div>
                <p class="price-tag">LKR ${p.price ? p.price.toFixed(2) : '0.00'} (100g)</p>
                <button class="add-cart" onclick="addToListFromDB(${index}, '${p.name}', ${p.price})" ${isDisable}>
                    ${isAvailable ? 'ADD TO LIST' : 'OUT OF STOCK'}
                </button>
            </div>
        `;
    }).join('');
}

// Order Management[cite: 1]
window.addToListFromDB = function(index, name, price) {
    const weightSelect = document.getElementById(`weight-${index}`);
    const qtyInput = document.getElementById(`qty-${index}`);
    
    if(!weightSelect || !qtyInput) return;
    
    const weightMultiplier = parseFloat(weightSelect.value);
    const weightLabel = weightSelect.options[weightSelect.selectedIndex].text;
    const qty = parseInt(qtyInput.value);
    
    if (qty < 1) return;
    const subtotal = price * weightMultiplier * qty;
    orderList.push({ name: name, weight: weightLabel, qty: qty, total: subtotal });
    updateOrderTable();
};

function updateOrderTable() {
    const tableBody = document.getElementById('orderItems');
    if(!tableBody) return;
    
    tableBody.innerHTML = orderList.map((item, index) => `
        <tr>
            <td>${item.name}</td>
            <td>${item.weight}</td>
            <td>${item.qty}</td>
            <td>LKR ${item.total.toFixed(2)}</td>
            <td><button class="remove-item" onclick="removeItem(${index})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
    
    const grandTotal = orderList.reduce((sum, item) => sum + item.total, 0);
    const totalDisplay = document.getElementById('grandTotal');
    if(totalDisplay) totalDisplay.innerText = grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2});
}

window.removeItem = function(index) {
    orderList.splice(index, 1);
    updateOrderTable();
};

// --- CONFIGURATION කොටස ඔබ සතු මුල් කේතයම මෙතනට දාන්න ---[cite: 1]

// ... (මුල් කේතයේ ඇති displayProducts, syncStock වැනි function සියල්ල එලෙසම තබන්න)[cite: 1]

// --- PROFESSIONAL INVOICE WITH CUSTOMER DETAILS ---
window.sendToWhatsApp = function() {
    if (orderList.length === 0) {
        alert("ඔබේ Order List එක හිස්!");
        return;
    }

    // පාරිභෝගික විස්තර ලබා ගැනීම
    const name = document.getElementById('cust-name').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();

    if (!name || !address || !phone) {
        alert("කරුණාකර ඔබගේ නම, ලිපිනය සහ දුරකථන අංකය ඇතුළත් කරන්න.");
        return;
    }
    
    let phoneNumber = "94723961127"; 
    
    // Header Section
    let message = "━━━━━━━━━━━━━━━━━━━━━━\n";
    message += "   *HIRUSAHAN PRODUCTS - INVOICE*   \n";
    message += "━━━━━━━━━━━━━━━━━━━━━━\n";
    message += `📅 Date: ${new Date().toLocaleDateString()}\n`;
    
    // Customer Details (මෙය Invoice එකේ පෙන්වන ආකාරය)
    message += "━━━━━━━━━━━━━━━━━━━━━━\n";
    message += `👤 *CUSTOMER DETAILS:*\n`;
    message += `Name: ${name}\n`;
    message += `Address: ${address}\n`;
    message += `Phone: ${phone}\n`;
    message += "━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    // Order Items Section
    message += "*ORDER ITEMS:*\n";
    orderList.forEach((item, index) => {
        message += `${index + 1}. *${item.name}*\n`;
        message += `   (${item.weight} x ${item.qty} packets) - LKR ${item.total.toFixed(2)}\n`;
    });

    // Grand Total Section
    const grandTotal = orderList.reduce((sum, item) => sum + item.total, 0);
    message += "\n━━━━━━━━━━━━━━━━━━━━━━\n";
    message += `*TOTAL AMOUNT: LKR ${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}*\n`;
    message += "━━━━━━━━━━━━━━━━━━━━━━\n\n";
    message += "✅ Please confirm my order. Thank you!";
    
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

// ... (ඉතිරි මුල් කේතය එලෙසම පවතිනු ඇත)[cite: 1]