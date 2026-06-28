import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  Firestore
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { DashboardState } from "../data";

// Initialize Firebase App
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
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

// Global error handler complying with the firebase-integration skill specifications
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on startup
export async function testConnection(): Promise<boolean> {
  try {
    // Attempting direct server read to verify database availability
    await getDocFromServer(doc(db, 'system_meta', 'connection_test'));
    console.log("Firebase connection verified successfully.");
    return true;
  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn("Firebase connection test resulted in offline or fallback mode:", errMsg);
    return false;
  }
}

// Cloud Persistence: Save EHR state to Firestore
export async function saveStateToFirestore(state: DashboardState): Promise<void> {
  const docPath = "patient_states/sarah_jenkins_ehr";
  try {
    const docRef = doc(db, "patient_states", "sarah_jenkins_ehr");
    // Convert dates and custom types safely to standard JS objects for Firestore
    const cleanedState = JSON.parse(JSON.stringify(state));
    await setDoc(docRef, cleanedState);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (
      errMsg.includes("offline") || 
      errMsg.includes("failed-precondition") || 
      errMsg.includes("unavailable") || 
      errMsg.includes("network")
    ) {
      console.warn("Firestore client is offline or network is down. Save is queued locally or bypassed.");
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// Cloud Persistence: Load EHR state from Firestore
export async function loadStateFromFirestore(): Promise<DashboardState | null> {
  const docPath = "patient_states/sarah_jenkins_ehr";
  try {
    const docRef = doc(db, "patient_states", "sarah_jenkins_ehr");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as DashboardState;
    }
    return null;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (
      errMsg.includes("offline") || 
      errMsg.includes("failed-precondition") || 
      errMsg.includes("unavailable") || 
      errMsg.includes("network")
    ) {
      console.warn("Firestore client is offline or network is down. Falling back to local storage state.");
      return null;
    }
    handleFirestoreError(error, OperationType.GET, docPath);
    return null;
  }
}
