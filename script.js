const loginScreen = document.getElementById('login-screen');
const mainWebsite = document.getElementById('main-website');
const authForm = document.getElementById('authForm');
const reAuthContainer = document.getElementById('reAuthContainer');
const emailField = document.getElementById('user-email');
const passwordField = document.getElementById('user-pass');
const togglePassword = document.getElementById('togglePassword');
const rememberMeCheckbox = document.getElementById('remember-me');
const loadingOverlay = document.getElementById('loading-overlay');

const productData = [
    { name: "Premium Chili Powder", img: "🌶️", price: 450 },
    { name: "Organic Turmeric", img: "🌿", price: 380 },
    { name: "Ceylon Cinnamon", img: "🪵", price: 950 },
    { name: "Black Pepper Grains", img: "🧂", price: 620 },
    { name: "Curry Powder (Mixed)", img: "🍂", price: 350 },
    { name: "Nutmeg Spices", img: "🌰", price: 890 },
    { name: "Cardamom Pods", img: "🍀", price: 1200 }
];

let orderList = [];

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBu7ffSNMSvrbtOCn6PL9Xhd_XLxneGjI",
  authDomain: "hirusahan.firebaseapp.com",
  projectId: "hirusahan",
  storageBucket: "hirusahan.firebasestorage.app",
  messagingSenderId: "249838072125",
  appId: "1:249838072125:web:90f2331d89b98b75b01554",
  measurementId: "G-F3YMBL1PM1"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

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
    displayProducts();
});

togglePassword.addEventListener('click', function () {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailField.value;
    const password = passwordField.value;
    
    loadingOverlay.style.display = 'flex';

    try {
        await auth.signInWithEmailAndPassword(email, password);
        handleSuccessAuth(email);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            try {
                await auth.createUserWithEmailAndPassword(email, password);
                handleSuccessAuth(email);
            } catch (regError) { alert("Error: " + regError.message); }
        } else { alert("Login Failed: " + error.message); }
    } finally {
        loadingOverlay.style.display = 'none';
    }
});

function handleSuccessAuth(email) {
    localStorage.setItem('hirusahan_auth', 'granted');
    if (rememberMeCheckbox.checked) {
        localStorage.setItem('remembered_email', email);
    } else {
        localStorage.removeItem('remembered_email');
    }
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

function displayProducts() {
    const container = document.getElementById('product-container');
    container.innerHTML = productData.map((p, index) => `
        <div class="product-card">
            <span class="product-img">${p.img}</span>
            <h3>${p.name}</h3>
            <div class="product-options">
                <div class="option-group">
                    <label>Weight:</label>
                    <select id="weight-${index}" class="item-weight">
                        <option value="0.5">50g</option>
                        <option value="1" selected>100g</option>
                        <option value="2.5">250g</option>
                        <option value="5">500g</option>
                    </select>
                </div>
                <div class="option-group">
                    <label>Packets:</label>
                    <input type="number" id="qty-${index}" class="item-qty" value="1" min="1">
                </div>
            </div>
            <p class="price-tag">LKR ${p.price.toFixed(2)} (100g)</p>
            <button class="add-cart" onclick="addToList(${index})">ADD TO LIST</button>
        </div>
    `).join('');
}

window.addToList = function(index) {
    const product = productData[index];
    const weightSelect = document.getElementById(`weight-${index}`);
    const weightMultiplier = parseFloat(weightSelect.value);
    const weightLabel = weightSelect.options[weightSelect.selectedIndex].text;
    const qty = parseInt(document.getElementById(`qty-${index}`).value);
    if (qty < 1) return;
    const subtotal = product.price * weightMultiplier * qty;
    orderList.push({ name: product.name, weight: weightLabel, qty: qty, total: subtotal });
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
    let phoneNumber = "947XXXXXXXX"; 
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
}