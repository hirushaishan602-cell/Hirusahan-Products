importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCBu7ffSNMSvrbtOCn6PL9Xhd_XLxneGjI",
    authDomain: "hirusahan.firebaseapp.com",
    projectId: "hirusahan",
    storageBucket: "hirusahan.firebasestorage.app",
    messagingSenderId: "249838072125",
    appId: "1:249838072125:web:90f2331d89b98b75b01554"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// පසුබිමේ (Background) Notification එක පෙන්වීම
messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png' // ඔබේ ලෝගෝ එකේ path එක
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
});