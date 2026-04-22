/* Service worker for مركز شباب الزهور
   Handles foreground/background notifications and click actions. */

const CACHE_VERSION = "zohour-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen to messages from the page (for showing notifications via the SW
// even when the tab is in the background).
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SHOW_NOTIFICATION") {
    const { title, body, icon, badge, tag, url } = data.payload || {};
    self.registration.showNotification(title || "إشعار جديد", {
      body: body || "",
      icon: icon || "/logo.jpg",
      badge: badge || "/logo.jpg",
      tag: tag || "zohour-msg",
      data: { url: url || "/" },
      lang: "ar",
      dir: "rtl",
      vibrate: [120, 60, 120],
      requireInteraction: false,
    });
  }
});

// Handle Web Push events (works only when a push provider, e.g. FCM, is set up).
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "إشعار جديد", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "إشعار جديد";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/logo.jpg",
    badge: payload.badge || "/logo.jpg",
    tag: payload.tag || "zohour-msg",
    data: { url: payload.url || "/" },
    lang: "ar",
    dir: "rtl",
    vibrate: [120, 60, 120],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
