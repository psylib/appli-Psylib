/**
 * Patient Auth hook — login, state, token management
 */
import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { loginPatient, getPatientToken, clearPatientToken } from '@/lib/patient-auth';

interface PatientInfo {
  id: string;
  name: string;
  email: string;
  psychologistId: string;
}

interface PatientAuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  patient: PatientInfo | null;
  token: string | null;
  error: string | null;
  login: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const PatientAuthContext = createContext<PatientAuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  patient: null,
  token: null,
  error: null,
  login: async () => {},
  logout: async () => {},
});

export function usePatientAuthProvider(): PatientAuthContextValue {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    void (async () => {
      const stored = await getPatientToken();
      if (stored) {
        setToken(stored);
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginPatient(email, code);
      setToken(result.token);
      setPatient(result.patient);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await clearPatientToken();
    setToken(null);
    setPatient(null);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, isLoading, patient, token, error, login, logout };
}

export function usePatientAuth(): PatientAuthContextValue {
  return useContext(PatientAuthContext);
}
