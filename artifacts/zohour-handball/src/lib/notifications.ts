import { useEffect, useState } from "react";
import { toast } from "sonner";

let activeChatPath: string | null = null;

export const setActiveChatPath = (path: string | null) => {
  activeChatPath = path;
};

let swReg: ServiceWorkerRegistration | null = null;

export async function ensureServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  if (swReg) return swReg;
  try {
    const base = (import.meta as any).env?.BASE_URL || "/";
    swReg = await navigator.serviceWorker.register(`${base}sw.js`, {
      scope: base,
    });
    return swReg;
  } catch (e) {
    console.warn("SW registration failed", e);
    return null;
  }
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
    ensureServiceWorker();
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await ensureServiceWorker();
    }
    return result === "granted";
  };

  const notify = (
    title: string,
    options?: NotificationOptions & { chatPath?: string },
  ) => {
    // If chat is open and tab focused, skip
    if (
      options?.chatPath &&
      activeChatPath === options.chatPath &&
      !document.hidden
    ) {
      return;
    }

    // In-app toast
    toast(title, { description: options?.body });

    // Audio ping (only if focused; background gets system sound)
    if (!document.hidden) {
      try {
        const audioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          440,
          audioCtx.currentTime + 0.1,
        );
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + 0.3,
        );
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch {}
    }

    // System notification when tab is hidden / blurred — via SW for
    // background-tab reliability across browsers.
    if (
      permission === "granted" &&
      (document.hidden || !document.hasFocus())
    ) {
      ensureServiceWorker().then((reg) => {
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
        } else {
          try {
            new Notification(title, {
              icon: "/logo.jpg",
              badge: "/logo.jpg",
              dir: "rtl",
              lang: "ar",
              ...options,
            });
          } catch {}
        }
      });
    }
  };

  return { permission, requestPermission, notify };
}
