// --- CONFIGURATION START ---

// 1. Project A (Authentication - දැනට පවතින එක)
const authConfig = {
  apiKey: "AIzaSyCBu7ffSNMSvrbtOCn6PL9Xhd_XLxneGjI",
  authDomain: "hirusahan.firebaseapp.com",
  projectId: "hirusahan",
  storageBucket: "hirusahan.firebasestorage.app",
  messagingSenderId: "249838072125",
  appId: "1:249838072125:web:90f2331d89b98b75b01554"
};

// 2. Project B (Realtime Database - Screenshot 160 හි ඇති අලුත් එක)
const dbConfig = {
  apiKey: "AIzaSyBT9c1jMHhU_JD8n7-ImWFCDt40TbfzLX0",
  authDomain: "stock-793e9.firebaseapp.com",
  databaseURL: "https://stock-793e9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "stock-793e9",
  storageBucket: "stock-793e9.firebasestorage.app",
  messagingSenderId: "91336977852",
  appId: "1:91336977852:web:77e0821c73739b67744fb9"
};

// Initialize Firebase Projects
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

// Database එකෙන් items load කරන function එක
function syncStock() {
    db.ref('products').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            displayProducts(data);
        } else {
            document.getElementById('product-container').innerHTML = "<p>Loading products...</p>";
        }
    });
}

window.addEventListener('load', () => {
    const isAuth = localStorage.getItem('hirusahan_auth') === 'granted';
    const savedEmail = localStorage.getItem('remembered_email');

    if (isAuth && savedEmail) {
        authForm.style.display = 'none';
        reAuthContainer.style.display = 'block';
    } else {
        authForm.style.display = 'block';
        reAuthContainer.style.display = 'none';
    }

    if (savedEmail) {
        emailField.value = savedEmail;
        rememberMeCheckbox.checked = true;
    }
    syncStock(); 
});

togglePassword.addEventListener('click', function () {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailField.value.trim(); // හිස්තැන් ඉවත් කරයි
    const password = passwordField.value;

    loadingOverlay.style.display = 'flex';
    try {
        // මුලින්ම Login වීමට උත්සාහ කරයි
        await auth.signInWithEmailAndPassword(email, password);
        handleSuccessAuth(email);
    } catch (error) {
        console.log("Login Error Code:", error.code);
        
        // වැරදි credentials නම් හෝ user නැත්නම් අලුත් account එකක් සාදයි
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
        loadingOverlay.style.display = 'none';
    }
});

function handleSuccessAuth(email) {
    localStorage.setItem('hirusahan_auth', 'granted');
    if (rememberMeCheckbox.checked) localStorage.setItem('remembered_email', email);
    else localStorage.removeItem('remembered_email');
    showWebsite();
}

function showWebsite() {
    loginScreen.style.display = 'none';
    mainWebsite.style.display = 'block';
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

function displayProducts(products) {
    const container = document.getElementById('product-container');
    const productArray = Array.isArray(products) ? products : Object.values(products);
    
    container.innerHTML = productArray.map((p, index) => {
        // 'instock' හෝ 'inStock' යන දෙකම පරීක්ෂා කිරීම
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

window.addToListFromDB = function(index, name, price) {
    const weightSelect = document.getElementById(`weight-${index}`);
    const weightMultiplier = parseFloat(weightSelect.value);
    const weightLabel = weightSelect.options[weightSelect.selectedIndex].text;
    const qty = parseInt(document.getElementById(`qty-${index}`).value);
    
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
    document.getElementById('grandTotal').innerText = grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2});
}

window.removeItem = function(index) {
    orderList.splice(index, 1);
    updateOrderTable();
};

window.sendToWhatsApp = function() {
    if (orderList.length === 0) {
        alert("ඔබේ Order List එක හිස්!");
        return;
    }
    let phoneNumber = "94723961127"; 
    let message = "📦 *NEW ORDER - HIRUSAHAN PRODUCTS*\n\n";
    orderList.forEach((item, index) => {
        message += `*${index + 1}. ${item.name}*\n   Weight: ${item.weight}\n   Qty: ${item.qty} packets\n   Subtotal: LKR ${item.total.toFixed(2)}\n\n`;
    });
    const grandTotal = orderList.reduce((sum, item) => sum + item.total, 0);
    message += `*GRAND TOTAL: LKR ${grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}*`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

async function socialAuth(platform) {
    let provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
        handleSuccessAuth(auth.currentUser.email);
    } catch (error) { console.log(error); }
}// මෙය Initialize App එකට පහළින් දාන්න
const messaging = firebase.messaging(authApp); 

async function requestNotificationPermission() {
    try {
        // Notification අවසර ඉල්ලීම දැන් වැඩ කරනු ඇත
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log("Notification අවසර ලැබුණා!");
            
            // මෙතැනට ඔබේ Firebase Console එකේ ඇති VAPID Key එක දාන්න
            const token = await messaging.getToken({ 
                vapidKey: 'BH7KdzPiKwNhLvvAfdppx2qZXTxWtF47dTe-9NFO3Zs3fnSjBC9HS0JSsWa1AlAMNreIcpYsPo0EPrBNDIM-0vY' 
            });
            console.log("Token:", token);
        }
    } catch (error) {
        console.error("Notification Error:", error);
    }
}