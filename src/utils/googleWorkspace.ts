import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Google Workspace scopes
provider.addScope("https://www.googleapis.com/auth/documents");
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/drive.file");

// Flag to track sign-in state
let isSigningIn = false;
// Memory cache for the OAuth access token
let cachedAccessToken: string | null = null;

// Initialize Auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we have a user but no cached token, they might have signed in from a previous session,
        // but since we keep the token strictly in memory as per guidelines, we can prompt for a quick popup click.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign-In with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google Workspace access token from credentials.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve Token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Logout
export const logoutWorkspace = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// --- Google Workspace API Helpers ---

// 1. Google Docs - Create and Populate Document
export async function createGoogleDoc(title: string, contentMarkdown: string): Promise<{ documentId: string; alternateLink: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("Unauthorized: Please sign in with Google first.");

  // Create document
  const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title })
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to create Google Doc. Status ${createRes.status}`);
  }

  const docData = await createRes.json();
  const documentId = docData.documentId;
  const alternateLink = `https://docs.google.com/document/d/${documentId}/edit`;

  // Write content via batchUpdate
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            endOfSegmentLocation: {},
            text: contentMarkdown
          }
        }
      ]
    })
  });

  if (!updateRes.ok) {
    const errData = await updateRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to write content to Google Doc. Status ${updateRes.status}`);
  }

  return { documentId, alternateLink };
}

// 2. Google Sheets - Create and Write Spreadsheet
export async function createGoogleSheet(title: string, headers: string[], rows: (string | number | boolean | null)[][]): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("Unauthorized: Please sign in with Google first.");

  // Create spreadsheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: { title }
    })
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to create Google Sheet. Status ${createRes.status}`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Prepare grid values
  const values = [headers, ...rows];

  // Write values using range 'Sheet1!A1'
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        range: "Sheet1!A1",
        majorDimension: "ROWS",
        values
      })
    }
  );

  if (!writeRes.ok) {
    const errData = await writeRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to write data to Google Sheet. Status ${writeRes.status}`);
  }

  return { spreadsheetId, spreadsheetUrl };
}

// 3. Google Drive - Search/List documents and spreadsheets generated
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

export async function listWorkspaceFiles(): Promise<DriveFile[]> {
  const token = await getAccessToken();
  if (!token) return [];

  // Query files that are Docs or Sheets created by drive.file scope or overall
  // Using v3 API. Request 'webViewLink' and 'createdTime' fields
  const q = encodeURIComponent("mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,webViewLink,createdTime)&orderBy=createdTime desc&pageSize=15`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.files || [];
}
