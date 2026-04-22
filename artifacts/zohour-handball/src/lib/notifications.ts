import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { db, messaging, VAPID_KEY } from "./firebase";

let activeChatPath: string | null = null;

export const setActiveChatPath = (path: string | null) => {
  activeChatPath = path;
};

let swReg: ServiceWorkerRegistration | null = null;

export async function ensureMessagingSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  if (swReg) return swReg;
  try {
    swReg = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" },
    );
    return swReg;
  } catch (e) {
    console.warn("FCM SW registration failed", e);
    return null;
  }
}

export const ensureServiceWorker = ensureMessagingSW;

export interface NotifyTarget {
  uid: string;
  role: "player" | "coach";
  name: string;
}

async function saveFcmToken(uid: string, role: "player" | "coach", token: string) {
  try {
    await setDoc(
      doc(db, "fcmTokens", `${uid}_${token.slice(-12)}`),
      {
        uid,
        role,
        token,
        userAgent: navigator.userAgent,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (e) {
    console.warn("Save FCM token failed", e);
  }
}

export async function registerFcmForUser(
  uid: string,
  role: "player" | "coach",
): Promise<string | null> {
  if (!messaging) return null;
  if (!("Notification" in window)) return null;

  const reg = await ensureMessagingSW();
  if (!reg) return null;

  if (Notification.permission !== "granted") {
    const result = await Notification.requestPermission();
    if (result !== "granted") return null;
  }

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: reg,
    });
    if (token) {
      await saveFcmToken(uid, role, token);
      return token;
    }
  } catch (e) {
    console.warn("Get FCM token failed", e);
  }
  return null;
}

let foregroundListenerSet = false;
export function setupForegroundListener() {
  if (foregroundListenerSet || !messaging) return;
  foregroundListenerSet = true;
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title || (payload.data as any)?.title;
    const body = payload.notification?.body || (payload.data as any)?.body;
    if (title) {
      toast(title, { description: body });
      playPing();
    }
  });
}

function playPing() {
  if (document.hidden) return;
  try {
    const audioCtx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch {}
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
    ensureMessagingSW();
    setupForegroundListener();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") await ensureMessagingSW();
    return result === "granted";
  }, []);

  const notify = useCallback(
    (
      title: string,
      options?: NotificationOptions & { chatPath?: string },
    ) => {
      // Don't toast if user is already viewing this chat in foreground
      if (
        options?.chatPath &&
        activeChatPath === options.chatPath &&
        !document.hidden
      ) {
        return;
      }

      // In-app toast for foreground notifications
      toast(title, { description: options?.body });
      playPing();

      // Background tab fallback (no FCM): show a local notification
      if (
        permission === "granted" &&
        (document.hidden || !document.hasFocus())
      ) {
        ensureMessagingSW().then((reg) => {
          if (reg && reg.active) {
            reg.active.postMessage({
              type: "SHOW_NOTIFICATION",
              payload: {
                title,
                body: options?.body,
                tag: options?.chatPath || "zohour-msg",
                url: "/",
              },
            });
          }
        });
      }
    },
    [permission],
  );

  return { permission, requestPermission, notify };
}

// Trigger a server-side push to all relevant users via the api-server.
// Falls back silently if the api-server is unreachable.
export async function broadcastPush(payload: {
  title: string;
  body: string;
  excludeUid?: string;
  recipients?: { uid: string; role: "player" | "coach" }[];
  scope?: "team" | "user";
  url?: string;
}) {
  try {
    const base =
      (import.meta as any).env?.VITE_API_BASE_URL || "/api";
    await fetch(`${base}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // silent
  }
}
