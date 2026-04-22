import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { db, messaging, VAPID_KEY } from "./firebase";

const PUSH_QUEUE_KEY = "zohour_push_queue";

function getPushQueue(): any[] {
  try {
    return JSON.parse(localStorage.getItem(PUSH_QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setPushQueue(q: any[]) {
  try {
    localStorage.setItem(PUSH_QUEUE_KEY, JSON.stringify(q));
  } catch {}
}

async function flushPushQueue() {
  const q = getPushQueue();
  if (!q.length) return;
  const remaining: any[] = [];
  const base = (import.meta as any).env?.VITE_API_BASE_URL || "/api";
  for (const payload of q) {
    try {
      await fetch(`${base}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      remaining.push(payload);
    }
  }
  setPushQueue(remaining);
}

// Flush queue when internet returns
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushPushQueue().catch(() => {});
  });
}

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
    // Flush any queued pushes on mount
    if (navigator.onLine) flushPushQueue().catch(() => {});
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") await ensureMessagingSW();
    return result === "granted";
  }, []);

  const notify = useCallback(
    (title: string, options?: { body?: string }) => {
      toast(title, { description: options?.body });
      playPing();
    },
    [],
  );

  return { permission, requestPermission, notify };
}

// Trigger a server-side push (ratings only). Queues offline and retries when online.
export async function broadcastPush(payload: {
  title: string;
  body: string;
  excludeUid?: string;
  recipients?: { uid: string; role: "player" | "coach" }[];
  scope?: "team" | "user";
  url?: string;
}) {
  const base = (import.meta as any).env?.VITE_API_BASE_URL || "/api";

  if (navigator.onLine) {
    await flushPushQueue().catch(() => {});
  }

  try {
    await fetch(`${base}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Queue for retry when internet returns
    const q = getPushQueue();
    q.push(payload);
    setPushQueue(q);
    // Register background sync in SW if supported
    ensureMessagingSW().then((reg) => {
      if (reg && "sync" in (reg as any)) {
        (reg as any).sync.register("retry-push").catch(() => {});
      }
    });
  }
}
