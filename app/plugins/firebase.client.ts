import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  onSnapshot,
  type DocumentData,
} from "firebase/firestore";

export interface FirebaseClient {
  /** Resolves to the anonymous uid once signed in, or null if auth is unavailable. */
  ready: Promise<string | null>;
  /** Current Firebase ID token (for authenticating /listen), or null. */
  idToken: () => Promise<string | null>;
  /**
   * Subscribe to a single webhook document (the only client-readable node).
   * Returns an unsubscribe function. No collection queries are ever issued.
   */
  subscribeWebhook: (
    token: string,
    onData: (data: DocumentData | null) => void,
    onError: (err: unknown) => void
  ) => () => void;
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.firebase as Record<string, string>;

  const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Sign in anonymously. Resolves with the uid, or null if the Anonymous
  // provider isn't enabled yet — in which case the app stays functional
  // (initial requests still load via the API) but the live feed won't update.
  const ready = new Promise<string | null>((resolve) => {
    let settled = false;
    const finish = (v: string | null) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    onAuthStateChanged(auth, (user) => {
      if (user) finish(user.uid);
    });
    signInAnonymously(auth).catch((e: unknown) => {
      const code = (e as { code?: string })?.code || String(e);
      console.warn(
        `[firebase] anonymous sign-in unavailable (${code}). ` +
          `Enable Anonymous auth in the Firebase console to get the live feed.`
      );
      finish(null);
    });
  });

  const client: FirebaseClient = {
    ready,
    idToken: () =>
      auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null),
    subscribeWebhook: (token, onData, onError) =>
      onSnapshot(
        doc(db, "webhooks", token),
        (snap) => onData(snap.exists() ? snap.data() : null),
        onError
      ),
  };

  return { provide: { firebase: client } };
});
