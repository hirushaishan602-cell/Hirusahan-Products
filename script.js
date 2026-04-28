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
    apiKey: "AIzaSyDoJDmPr_FTnIce2RCTCMB3xHOWvWeHf_4",
    authDomain: "hirusahan-products.firebaseapp.com",
    projectId: "hirusahan-products",
    storageBucket: "hirusahan-products.firebasestorage.app",
    messagingSenderId: "1030397143651",
    appId: "1:1030397143651:web:3d433fc3317b57d2abe656"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

function socialAuth(platform) {
    console.log("Login started for:", platform); // මෙය Console එකේ වැටෙනවාද බලන්න
    
    let provider;
    if (platform === 'Google') {
        provider = new firebase.auth.GoogleAuthProvider();
    } else if (platform === 'Facebook') {
        provider = new firebase.auth.FacebookAuthProvider();
    }

    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Success!");
            localStorage.setItem('hirusahan_auth', 'granted');
            showWebsite();
        })
        .catch((error) => {
            console.error("Full Error Info:", error); // වැරැද්ද මොකක්ද කියලා මෙතනින් බලාගන්න පුළුවන්
            alert("Error: " + error.message);
        });
}