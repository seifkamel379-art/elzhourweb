/* Firebase Cloud Messaging Service Worker
   Handles background push notifications and offline push queue. */

importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBtiCT9zHkx28jGmggXLUpe5kuGoG5rNpw",
  authDomain: "zohour-handball-2010-f59c4.firebaseapp.com",
  projectId: "zohour-handball-2010-f59c4",
  storageBucket: "zohour-handball-2010-f59c4.firebasestorage.app",
  messagingSenderId: "733306244703",
  appId: "1:733306244703:web:f1182437c062aa014695ea",
});

const messaging = firebase.messaging();

// Background message handler — fires when the page is closed or in the background.
messaging.onBackgroundMessage((payload) => {
  const notif = payload.notification || {};
  const data = payload.data || {};
  const title = notif.title || data.title || "إشعار جديد";
  const body = notif.body || data.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "/logo.jpg",
    badge: "/logo.jpg",
    tag: data.tag || "zohour-rating",
    data: { url: data.url || "/" },
    lang: "ar",
    dir: "rtl",
    vibrate: [120, 60, 120],
  });
});

// ────────────────────────────────────────
// Background Sync — retry queued push requests when internet returns
// ────────────────────────────────────────

function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("zohoQueue", 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("pushQueue", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function processOfflineQueue() {
  let db;
  try {
    db = await openQueueDB();
  } catch {
    return;
  }

  const tx = db.transaction("pushQueue", "readwrite");
  const store = tx.objectStore("pushQueue");

  const all = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => resolve([]);
  });

  for (const item of all) {
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      store.delete(item.id);
    } catch {
      // Keep in queue if still offline
    }
  }

  return new Promise((resolve) => { tx.oncomplete = resolve; tx.onerror = resolve; });
}

self.addEventListener("sync", (event) => {
  if (event.tag === "retry-push") {
    event.waitUntil(processOfflineQueue());
  }
});

// ────────────────────────────────────────
// Notification click handler
// ────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url).catch(() => {});
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
