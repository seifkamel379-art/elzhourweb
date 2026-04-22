import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  initializeApp,
  cert,
  getApps,
  type App,
} from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let initError: string | null = null;

function ensureAdmin(): App | null {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    initError = "FIREBASE_SERVICE_ACCOUNT secret is not set";
    return null;
  }
  try {
    const serviceAccount = JSON.parse(raw);
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || "zohour-handball-2010-f59c4",
    });
    return adminApp;
  } catch (e: any) {
    initError = `Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${e.message}`;
    logger.error({ err: e }, initError);
    return null;
  }
}

const router: IRouter = Router();

interface NotifyPayload {
  title: string;
  body: string;
  excludeUid?: string;
  recipients?: { uid: string; role: "player" | "coach" }[];
  scope?: "team" | "user";
  url?: string;
}

router.post("/notify", async (req, res) => {
  const app = ensureAdmin();
  if (!app) {
    return res
      .status(503)
      .json({ ok: false, error: initError || "Push not configured" });
  }

  const payload = req.body as NotifyPayload;
  if (!payload?.title || !payload?.body) {
    return res.status(400).json({ ok: false, error: "title and body required" });
  }

  try {
    const firestore = getFirestore(app);
    const tokensSnap = await firestore.collection("fcmTokens").get();

    const recipientUids = new Set<string>();
    const allowAll = payload.scope === "team" || !payload.recipients;
    if (payload.recipients) {
      for (const r of payload.recipients) recipientUids.add(r.uid);
    }

    const tokens: string[] = [];
    const tokenDocIds: string[] = [];
    tokensSnap.forEach((doc) => {
      const d = doc.data() as { uid: string; token: string };
      if (!d.token) return;
      if (payload.excludeUid && d.uid === payload.excludeUid) return;
      if (allowAll || recipientUids.has(d.uid)) {
        tokens.push(d.token);
        tokenDocIds.push(doc.id);
      }
    });

    if (tokens.length === 0) {
      return res.json({ ok: true, sent: 0 });
    }

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        title: payload.title,
        body: payload.body,
        url: payload.url || "/",
      },
      webpush: {
        notification: {
          icon: "/logo.jpg",
          badge: "/logo.jpg",
          tag: "zohour-msg",
          dir: "rtl",
          lang: "ar",
        },
        fcmOptions: { link: payload.url || "/" },
      },
    });

    // Cleanup invalid tokens
    const invalidIds: string[] = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-argument") ||
          code.includes("invalid-registration-token")
        ) {
          invalidIds.push(tokenDocIds[i]);
        }
      }
    });
    if (invalidIds.length) {
      const batch = firestore.batch();
      invalidIds.forEach((id) =>
        batch.delete(firestore.collection("fcmTokens").doc(id)),
      );
      await batch.commit();
    }

    res.json({
      ok: true,
      sent: response.successCount,
      failed: response.failureCount,
      cleaned: invalidIds.length,
    });
  } catch (e: any) {
    logger.error({ err: e }, "notify failed");
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get("/notify/status", (_req, res) => {
  const app = ensureAdmin();
  res.json({ ready: !!app, error: initError });
});

export default router;
