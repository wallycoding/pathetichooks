import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let _db: Firestore | undefined;
let _auth: Auth | undefined;

function ensureApp() {
  if (!getApps().length) initializeApp();
}

export function db(): Firestore {
  if (_db) return _db;
  ensureApp();
  _db = getFirestore();
  return _db;
}

export function auth(): Auth {
  if (_auth) return _auth;
  ensureApp();
  _auth = getAuth();
  return _auth;
}
