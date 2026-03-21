/**
 * Patient Auth — Email/code login (NOT Keycloak)
 * Separate JWT from psy auth.
 */
import Constants from 'expo-constants';

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://api.psylib.eu';

const PATIENT_TOKEN_KEY = 'psylib_patient_token';

interface PatientLoginResponse {
  token: string;
  patient: {
    id: string;
    name: string;
    email: string;
    psychologistId: string;
  };
}

export async function loginPatient(email: string, code: string): Promise<PatientLoginResponse> {
  const response = await fetch(`${API_BASE}/api/v1/patient-portal/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(error.message ?? 'Code invalide');
  }

  const data = (await response.json()) as PatientLoginResponse;
  await setPatientToken(data.token);
  return data;
}

export async function acceptInvitation(token: string): Promise<PatientLoginResponse> {
  const response = await fetch(`${API_BASE}/api/v1/invitations/${token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Invitation invalide ou expiree');
  }

  return (await response.json()) as PatientLoginResponse;
}

async function setPatientToken(token: string): Promise<void> {
  // Use a separate key from psy auth
  if (typeof globalThis !== 'undefined') {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(PATIENT_TOKEN_KEY, token);
    } catch {
      // Fallback
    }
  }
}

export async function getPatientToken(): Promise<string | null> {
  try {
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(PATIENT_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function clearPatientToken(): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(PATIENT_TOKEN_KEY);
  } catch {
    // ignore
  }
}
