// --- 1. පවතින Login & UI Logic ---
const loginScreen = document.getElementById('login-screen');
const mainWebsite = document.getElementById('main-website');
const authForm = document.getElementById('authForm');

// Authorize වෙලාද බලනවා
window.addEventListener('load', () => {
    if (localStorage.getItem('hirusahan_auth') === 'granted') {
        showWebsite();
    }
    // Remember Me චෙක් කරනවා
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
        document.getElementById("user-email").value = savedEmail;
        document.getElementById("rememberMe").checked = true;
    }
});

// Authentication logic
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('user-email').value;
    const pass = document.getElementById('user-pass').value;
    const rememberMe = document.getElementById("rememberMe").checked;

    try {
        // Firebase Login
        await auth.signInWithEmailAndPassword(email, pass);
        if (rememberMe) {
            localStorage.setItem("rememberedEmail", email);
        }
        localStorage.setItem('hirusahan_auth', 'granted');
        showWebsite();
    } catch (error) {
        // User නැත්නම් Auto Sign-up වෙනවා
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-login-credentials') {
            try {
                await auth.createUserWithEmailAndPassword(email, pass);
                localStorage.setItem('hirusahan_auth', 'granted');
                showWebsite();
            } catch (signUpError) {
                alert("Error: " + signUpError.message);
            }
        } else {
            alert("Login Failed: " + error.message);
        }
    }
});

function showWebsite() {
    loginScreen.style.display = 'none';
    mainWebsite.style.display = 'block';
}

function secureLogout() {
    auth.signOut().then(() => {
        localStorage.removeItem('hirusahan_auth');
        location.reload(); 
    });
}

// Password ඇස (Eye icon) එක පාලනය
function togglePasswordVisibility() {
    const passInput = document.getElementById("user-pass");
    const eyeIcon = document.getElementById("toggleEye");
    if (passInput.type === "password") {
        passInput.type = "text";
        eyeIcon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        passInput.type = "password";
        eyeIcon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

// --- 2. Firebase Config (ඔයාගේ Original Config එක) ---
const firebaseConfig = {
    apiKey: "AIzaSyCBu7ffSNMSvrbtOCn6PL9Xhd_XLxneGjI",
    authDomain: "hirusahan.firebaseapp.com",
    projectId: "hirusahan",
    storageBucket: "hirusahan.firebasestorage.app",
    messagingSenderId: "249838072125",
    appId: "1:249838072125:web:90f2331d89b98b75b01554",
    measurementId: "G-F3YMBL1PM1"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

// --- 3. අලුත් Add to Cart & Price System එක ---
let currentProduct = { name: "", basePrice: 0 };

// බටන් එක එබුවම Modal එක පෙන්වනවා
function addToCart(name, price) {
    currentProduct.name = name;
    currentProduct.basePrice = price; // 100g සඳහා මිල
    
    document.getElementById("modal-product-name").innerText = name.toUpperCase();
    
    // Modal එක ඇතුළේ අගයන් මුලට (Reset) කරනවා
    document.getElementById("weight-select").value = "100";
    document.getElementById("packet-count").value = "1";
    
    updateTotalPrice(); // මිල මුලින්ම ගණනය කරනවා
    document.getElementById("qty-modal").style.display = "block";
}

// මිල ගණනය කිරීමේ මධ්‍යස්ථානය
function updateTotalPrice() {
    const weightSelect = document.getElementById("weight-select");
    const packetInput = document.getElementById("packet-count");
    
    if (weightSelect && packetInput) {
        const weight = parseInt(weightSelect.value);
        const packets = parseInt(packetInput.value) || 1; // අගයක් නැත්නම් 1 ලෙස ගන්නවා
        
        // ගණනය: (බර / 100) * මූලික මිල * පැකට් ගණන
        const total = (weight / 100) * currentProduct.basePrice * packets;
        
        // UI එකට මිල යවනවා
        document.getElementById("total-price-display").innerText = total.toFixed(2);
    }
}

// Listeners: මේවායින් තමයි ක්ලික් කරද්දී එවලේම මිල මාරු කරන්නේ
document.getElementById("weight-select").addEventListener("change", updateTotalPrice);
document.getElementById("packet-count").addEventListener("input", updateTotalPrice);

function closeModal() {
    document.getElementById("qty-modal").style.display = "none";
}

function addToFinalCart() {
    const weight = document.getElementById("weight-select").value;
    const packets = document.getElementById("packet-count").value;
    const finalPrice = document.getElementById("total-price-display").innerText;

    alert(`Cart එකට එකතු කළා:\n${currentProduct.name}\nබර: ${weight}g\nපැකට්: ${packets}\nමුළු මිල: LKR ${finalPrice}`);
    closeModal();
}