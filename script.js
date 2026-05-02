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
  apiKey: "AIzaSyBT9c1jMHhU_JD8-ImWFCDt40TbfzLX0", 
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

let orderList = [];

// Stock Sync - Database එකෙන් Items කියවීම[cite: 2]
function syncStock() {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) { 
            displayProducts(data); 
        }
    });
}

// Initialization
window.addEventListener('load', () => {
    const isAuth = localStorage.getItem('hirusahan_auth') === 'granted';
    const savedEmail = localStorage.getItem('remembered_email');
    const savedOrderId = localStorage.getItem('active_order_id');

    if (isAuth && savedEmail) {
        if(authForm) authForm.style.display = 'none';
        if(reAuthContainer) reAuthContainer.style.display = 'block';
    }

    // කලින් Order එකක් තිබුණා නම් එය පෙන්වන්න[cite: 2]
    if (isAuth && savedOrderId) {
        checkExistingOrder(savedOrderId);
    }

    if (savedEmail && emailField) {
        emailField.value = savedEmail;
        rememberMeCheckbox.checked = true;
    }
    syncStock(); 
});

function checkExistingOrder(orderId) {
    db.ref('orders/' + orderId).once('value', (snapshot) => {
        if (snapshot.exists()) {
            showTrackingUI(orderId);
            trackOrderStatus(orderId);
        } else {
            localStorage.removeItem('active_order_id');
        }
    });
}

function showTrackingUI(orderId) {
    if(document.getElementById('customer-details')) document.getElementById('customer-details').style.display = 'none';
    const orderBtn = document.querySelector('.whatsapp-btn');
    if(orderBtn) orderBtn.style.display = 'none';
    const trackingSection = document.getElementById('tracking-section');
    if(trackingSection) {
        trackingSection.style.display = 'block';
        document.getElementById('display-order-id').innerText = orderId;
    }
}

// Password Toggle[cite: 2]
if(togglePassword) {
    togglePassword.addEventListener('click', function () {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// Auth Logic[cite: 2]
if(authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailField.value.trim(); 
        const password = passwordField.value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
            handleSuccessAuth(email);
        } catch (error) {
            alert("Failed: " + error.message);
        }
    });
}

window.socialAuth = async function(platform) {
    if (platform === 'Google') {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const result = await auth.signInWithPopup(provider);
            handleSuccessAuth(result.user.email);
        } catch (error) {
            alert("Google Login Failed: " + error.message);
        }
    }
};

function handleSuccessAuth(email) {
    localStorage.setItem('hirusahan_auth', 'granted');
    if (rememberMeCheckbox.checked) localStorage.setItem('remembered_email', email);
    showWebsite();
}

function showWebsite() {
    if(loginScreen) loginScreen.style.display = 'none';
    if(mainWebsite) mainWebsite.style.display = 'block';
}

window.secureLogout = function() {
    localStorage.removeItem('hirusahan_auth');
    localStorage.removeItem('active_order_id');
    location.reload(); 
}

// Display Products (ඔයාගේ Original Style එකමයි)[cite: 2]
function displayProducts(products) {
    const container = document.getElementById('product-container');
    if(!container) return;
    
    // JSON Object එකක් ආවත් Array එකක් ආවත් වැඩ කරන විදිහ[cite: 2]
    const productArray = Object.keys(products).map(key => ({
        id: key,
        ...products[key]
    }));
    
    container.innerHTML = productArray.map((p, index) => {
        const stockValue = p.inStock !== undefined ? p.inStock : p.instock;
        const isAvailable = String(stockValue).toLowerCase() === "true";
        
        const isGold = p.isBestSale === true || String(p.isBestSale).toLowerCase() === "true";
        const isSilver = p.isSilverSale === true || String(p.isSilverSale).toLowerCase() === "true";

        let saleClass = "";
        if (isGold) saleClass = "best-sale-card";
        else if (isSilver) saleClass = "silver-sale-card";

        return `
            <div class="product-card ${isAvailable ? '' : 'product-unavailable'} ${saleClass}" style="position: relative;">
                ${isGold ? `<div class="best-sale-badge"><i class="fas fa-fire"></i> BEST SALE</div>` : ''}
                ${isSilver ? `<div class="silver-sale-badge">⭐ TOP RATED</div>` : ''}
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
                <button class="add-cart" onclick="addToListFromDB(${index}, '${p.name.replace(/'/g, "\\'")}', ${p.price})" ${isAvailable ? '' : 'disabled'}>
                    ${isAvailable ? 'ADD TO LIST' : 'OUT OF STOCK'}
                </button>
            </div>
        `;
    }).join('');
}

// Order Management[cite: 2]
window.addToListFromDB = function(index, name, price) {
    // 1. දැනටමත් Active Order එකක් තියෙනවාද කියලා බලනවා
    const activeOrderId = localStorage.getItem('active_order_id');

    if (activeOrderId) {
        // 2. ඒ Order එකේ status එක 'delivered' ද කියලා Database එකෙන් චෙක් කරනවා
        db.ref('orders/' + activeOrderId + '/status').once('value', (snapshot) => {
            const status = snapshot.val();
            if (status && status.toLowerCase() === 'delivered') {
                // 3. Status එක Delivered නම්, Tracking අයින් කරලා පරණ ID එක Delete කරනවා
                localStorage.removeItem('active_order_id');
                
                // UI එක සාමාන්‍ය තත්ත්වයට පත් කරනවා
                const trackingSection = document.getElementById('tracking-section');
                const customerDetails = document.getElementById('customer-details');
                const orderBtn = document.querySelector('.whatsapp-btn');
                
                if(trackingSection) trackingSection.style.display = 'none';
                if(customerDetails) customerDetails.style.display = 'block';
                if(orderBtn) orderBtn.style.display = 'inline-block';
            }
        });
    }

    // 4. සාමාන්‍ය විදිහට ලිස්ට් එකට බඩු එකතු කරන Logic එක
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

// රතු පාට Delete Button Logic එක[cite: 2]
window.removeItem = function(index) {
    orderList.splice(index, 1);
    const dot = document.getElementById('cart-dot-count');
    if(dot) dot.innerText = orderList.length;
    if(orderList.length === 0) {
        const cart = document.getElementById('floating-cart');
        if(cart) cart.style.display = 'none';
    }
    updateOrderTable();
};

window.scrollToOrderTable = function() {
    const section = document.getElementById('order-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
};

// Database එකට Order එක යැවීම සහ Tracking පෙන්වීම[cite: 2]
window.submitOrderToDB = async function() {
    if (orderList.length === 0) { alert("ඔබේ Order List එක හිස්!"); return; }
    
    const name = document.getElementById('cust-name').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();

    if (!name || !address || !phone) { alert("විස්තර සම්පූර්ණ කරන්න."); return; }
    
    const totalAmount = orderList.reduce((s, i) => s + i.total, 0);
    const orderData = {
        customerName: name,
        deliveryAddress: address,
        phoneNumber: phone,
        items: orderList,
        totalAmount: totalAmount,
        orderDate: new Date().toLocaleString(),
        status: "Pending"
    };

    try {
        // 1. මුලින්ම Database එකට සේව් කරනවා
        const newRef = db.ref('orders').push();
        const orderId = newRef.key;
        await newRef.set(orderData);
        localStorage.setItem('active_order_id', orderId);

        // 2. දැන් WhatsApp එකට විස්තර ටික හදනවා
        let message = `*--- NEW ORDER ---*\n`;
        message += `*Order ID:* ${orderId}\n`;
        message += `*Name:* ${name}\n`;
        message += `*Phone:* ${phone}\n`;
        message += `*Address:* ${address}\n\n`;
        message += `*--- ITEMS ---*\n`;

        orderList.forEach((item, index) => {
            message += `${index + 1}. ${item.name} (${item.weight}) x ${item.qty}\n`;
        });

        message += `\n*Total Amount: LKR ${totalAmount.toFixed(2)}*`;

        // 3. WhatsApp link එක සාදා වෙනත් Tab එකක Open කරනවා
        const whatsappNumber = "94723961127"; // ඔයාගේ WhatsApp අංකය මෙතනට දාන්න
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        // Tracking UI එක පෙන්වනවා
        showTrackingUI(orderId);
        trackOrderStatus(orderId);
        
        alert("සාර්ථකයි! දැන් WhatsApp හරහා Order එක අප වෙත එවන්න.");
        
        // WhatsApp එකට යොමු කරනවා
        window.open(whatsappURL, '_blank');

        // පරණ ලිස්ට් එක ක්ලියර් කරනවා
        orderList = [];
        updateOrderTable();
        
    } catch (e) { alert("දෝෂයක්: " + e.message); }
};
function trackOrderStatus(orderId) {
    db.ref('orders/' + orderId).on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        const statusText = document.getElementById('status-text');
        const statusDesc = document.getElementById('status-desc');
        const progressFill = document.getElementById('progress-fill');

        const currentStatus = data.status ? data.status.toLowerCase() : "pending";
        if(statusText) statusText.innerText = currentStatus.toUpperCase();

        if (progressFill) {
            if (currentStatus === "pending") {
                if(statusDesc) statusDesc.innerText = "ඔබේ ඇණවුම තහවුරු කරන තෙක් රැඳී සිටින්න.";
                progressFill.style.width = "25%";
                progressFill.style.background = "var(--primary)";
            } 
            else if (currentStatus === "packing") {
                if(statusDesc) statusDesc.innerText = "දැන් ඇසුරුම් කරමින් පවතී.";
                progressFill.style.width = "50%";
                progressFill.style.background = "#ffcc00";
            } 
            else if (currentStatus === "shipped") {
                // ඔයා Database එකේ manually ලියන "May 11 - 15" වගේ අගය මෙතනට ගන්නවා
                // එහෙම එකක් ලියලා නැත්නම් විතරක් "Processing..." කියලා පෙන්වනවා
                const manualRange = data.deliveryRange ? data.deliveryRange : "Processing...";

                if(statusDesc) {
                    statusDesc.innerHTML = `ඇණවුම ප්‍රවාහනය සඳහා භාර දී ඇත. <br>
                    <b style="color: #00ffff; font-size: 1.1rem;">ලැබෙන කාලය: ${manualRange} අතරතුර</b>`;
                }
                
                progressFill.style.width = "75%";
                progressFill.style.background = "#00ffff";
            } 
            else if (currentStatus === "delivered") {
                if(statusDesc) statusDesc.innerText = "ඇණවුම සාර්ථකව ලැබී ඇත. ස්තූතියි!";
                progressFill.style.width = "100%";
                progressFill.style.background = "#00ff00";
            }
        }
    });
}

// 🌸 Animation
function createFlower() {
    const flower = document.createElement('div');
    flower.classList.add('flower-rain');
    flower.innerHTML = '🌸'; 
    flower.style.left = Math.random() * window.innerWidth + 'px';
    flower.style.animationDuration = Math.random() * 3 + 2 + 's';
    document.body.appendChild(flower);
    setTimeout(() => { flower.remove(); }, 5000);
}
setInterval(createFlower, 300);