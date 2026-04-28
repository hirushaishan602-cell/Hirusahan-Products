const loginScreen = document.getElementById('login-screen');
const mainWebsite = document.getElementById('main-website');
const authForm = document.getElementById('authForm');
// Check if user is already authorized
window.addEventListener('load', () => {
    if (localStorage.getItem('hirusahan_auth') === 'granted') {
        showWebsite();
    }
});

// Authentication logic
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('user-email').value;
    const pass = document.getElementById('user-pass').value;

    // Use these credentials
    if (email === "admin@hirusahan.com" && pass === "123456") {
        localStorage.setItem('hirusahan_auth', 'granted');
        showWebsite();
    } else {
        alert("ACCESS DENIED: Unauthorized Credentials.");
    }
});

function showWebsite() {
    loginScreen.style.display = 'none';
    mainWebsite.style.display = 'block';
}

function secureLogout() {
    localStorage.removeItem('hirusahan_auth');
    location.reload(); 
}
// ඔබේ Firebase Config එක මෙතනට දාන්න
const firebaseConfig = {
  apiKey: "AIzaSyCBu7ffSNMSvrbtOCn6PL9Xhd_XLxneGjI",
  authDomain: "hirusahan.firebaseapp.com",
  projectId: "hirusahan",
  storageBucket: "hirusahan.firebasestorage.app",
  messagingSenderId: "249838072125",
  appId: "1:249838072125:web:90f2331d89b98b75b01554",
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

let isAuthInProgress = false; // එකම වෙලාවේ දෙපාරක් ක්ලික් වීම වැලැක්වීමට

async function socialAuth(platform) {
    if (isAuthInProgress) return; // දැනටමත් වැඩේ සිද්ධ වෙනවා නම් ආයෙ කරන්න එපා
    
    isAuthInProgress = true;
    console.log("Login process started...");

    let provider;
    if (platform === 'Google') {
        provider = new firebase.auth.GoogleAuthProvider();
    } else if (platform === 'Facebook') {
        provider = new firebase.auth.FacebookAuthProvider();
    }

    try {
        const result = await firebase.auth().signInWithPopup(provider);
        console.log("Login Success!");
        localStorage.setItem('hirusahan_auth', 'granted');
        showWebsite();
    } catch (error) {
        // "cancelled-popup-request" ආවොත් ඒක Error එකක් විදිහට පෙන්වන්න එපා
        if (error.code !== 'auth/cancelled-popup-request') {
            console.error("Auth Error:", error.message);
            alert("Error: " + error.message);
        }
    } finally {
        isAuthInProgress = false; // අවසානයේ නැවත බටන් එක වැඩ කරන තත්වයට පත් කරන්න
    }
}