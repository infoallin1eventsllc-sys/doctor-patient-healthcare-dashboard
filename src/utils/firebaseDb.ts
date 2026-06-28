import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  Firestore,
  FirestoreError
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { DashboardState } from "../data";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db: Firestore = getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  code?: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    code: error instanceof FirestoreError ? error.code : undefined,
    operationType,
    path
  };
  throw new Error(JSON.stringify(errInfo));
}

// Offline/network error codes that should not be treated as fatal
const OFFLINE_CODES = new Set(["unavailable", "failed-precondition", "cancelled"]);

function isOfflineError(error: unknown): boolean {
  if (error instanceof FirestoreError) return OFFLINE_CODES.has(error.code);
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return msg.includes("offline") || msg.includes("network");
}

function patientDocRef(patientId: string) {
  const docId = `${patientId}_ehr`;
  return { ref: doc(db, "patient_states", docId), path: `patient_states/${docId}` };
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "system_meta", "connection_test"));
    return true;
  } catch {
    return false;
  }
}

export async function saveStateToFirestore(state: DashboardState): Promise<void> {
  const patientId = state.patient?.id ?? "unknown";
  const { ref, path } = patientDocRef(patientId);
  try {
    const cleanedState = JSON.parse(JSON.stringify(state));
    await setDoc(ref, cleanedState);
  } catch (error) {
    if (isOfflineError(error)) return;
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadStateFromFirestore(patientId = "pat_1"): Promise<DashboardState | null> {
  const { ref, path } = patientDocRef(patientId);
  try {
    const docSnap = await getDoc(ref);
    return docSnap.exists() ? (docSnap.data() as DashboardState) : null;
  } catch (error) {
    if (isOfflineError(error)) return null;
    handleFirestoreError(error, OperationType.GET, path);
  }
}
