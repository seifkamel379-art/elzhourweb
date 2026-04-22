import { useEffect, useState } from "react";
import { toast } from "sonner";

// Keep track of active chats globally to avoid notifying for open chats
let activeChatPath: string | null = null;

export const setActiveChatPath = (path: string | null) => {
  activeChatPath = path;
};

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    "default"
  );

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  };

  const notify = (
    title: string,
    options?: NotificationOptions & { chatPath?: string }
  ) => {
    // If the chat is currently active and window is focused, don't notify
    if (
      options?.chatPath &&
      activeChatPath === options.chatPath &&
      !document.hidden
    ) {
      return;
    }

    // In-app toast
    toast(title, {
      description: options?.body,
    });

    // Audio ping
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(
        440,
        audioCtx.currentTime + 0.1
      ); // Drop to A4

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.3
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio notification failed", e);
    }

    // Browser notification
    if (permission === "granted" && (document.hidden || !document.hasFocus())) {
      try {
        new Notification(title, {
          icon: "/logo.jpg",
          badge: "/logo.jpg",
          dir: "rtl",
          lang: "ar",
          ...options,
        });
      } catch (e) {
        console.warn("Browser notification failed", e);
      }
    }
  };

  return { permission, requestPermission, notify };
}
