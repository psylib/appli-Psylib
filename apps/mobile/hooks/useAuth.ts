/**
 * useAuth — Hook d'authentification Keycloak pour l'app mobile
 *
 * Gère :
 * - Chargement initial des tokens depuis SecureStore
 * - Login via OIDC Authorization Code + PKCE
 * - Logout (révocation + suppression tokens)
 * - Refresh automatique avant expiration
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  useKeycloakAuth,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeTokens,
  loadStoredTokens,
  isTokenExpired,
  KEYCLOAK_DISCOVERY,
  type TokenSet,
} from '@/lib/auth';
import type { AuthRequest, AuthSessionResult } from 'expo-auth-session';

export interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
}

const initialState: AuthState = {
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Context exporté pour SessionProvider dans _layout.tsx
export const AuthContext = createContext<AuthContextValue>({
  ...initialState,
  login: async () => {},
  logout: async () => {},
  getValidToken: async () => null,
});

export function useAuthProvider(): AuthContextValue {
  const [state, setState] = useState<AuthState>(initialState);
  const [tokenSet, setTokenSet] = useState<TokenSet | null>(null);

  const discovery = KEYCLOAK_DISCOVERY;
  const { request, response, promptAsync } = useKeycloakAuth();

  // Chargement initial des tokens depuis SecureStore
  useEffect(() => {
    void (async () => {
      try {
        const stored = await loadStoredTokens();
        if (!stored) {
          setState({ accessToken: null, isAuthenticated: false, isLoading: false, error: null });
          return;
        }

        // Tenter un refresh si expiré
        if (isTokenExpired(stored.expiresAt) && stored.refreshToken && discovery) {
          const refreshed = await refreshAccessToken(stored.refreshToken, discovery);
          if (refreshed) {
            setTokenSet(refreshed);
            setState({
              accessToken: refreshed.accessToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            setState({ accessToken: null, isAuthenticated: false, isLoading: false, error: null });
          }
          return;
        }

        setTokenSet(stored);
        setState({
          accessToken: stored.accessToken,
          isAuthenticated: !isTokenExpired(stored.expiresAt),
          isLoading: false,
          error: null,
        });
      } catch {
        setState({ accessToken: null, isAuthenticated: false, isLoading: false, error: null });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Traitement de la réponse OIDC après le callback
  useEffect(() => {
    if (!response || !request || !discovery) return;

    void (async () => {
      if (response.type === 'success' && response.params.code) {
        try {
          const tokens = await exchangeCodeForTokens(
            response.params.code,
            request as AuthRequest,
            discovery,
          );
          setTokenSet(tokens);
          setState({
            accessToken: tokens.accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Erreur de connexion',
          }));
        }
      } else if (response.type === 'error') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.error?.message ?? 'Connexion annulée',
        }));
      }
    })();
  }, [response, request, discovery]);

  const login = useCallback(async () => {
    if (!discovery) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Impossible de joindre le serveur d\'authentification. Vérifiez votre connexion.',
      }));
      return;
    }
    if (!request) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Préparation de l\'authentification en cours, réessayez dans quelques secondes.',
      }));
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result: AuthSessionResult = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erreur inattendue',
      }));
    }
  }, [promptAsync, discovery, request]);

  const logout = useCallback(async () => {
    if (tokenSet && discovery) {
      await revokeTokens(tokenSet, discovery);
    }
    setTokenSet(null);
    setState({ accessToken: null, isAuthenticated: false, isLoading: false, error: null });
  }, [tokenSet, discovery]);

  /**
   * Retourne un token valide, en le rafraîchissant si nécessaire
   */
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!tokenSet) return null;

    if (!isTokenExpired(tokenSet.expiresAt)) {
      return tokenSet.accessToken;
    }

    if (!tokenSet.refreshToken || !discovery) {
      return null;
    }

    const refreshed = await refreshAccessToken(tokenSet.refreshToken, discovery);
    if (!refreshed) {
      setTokenSet(null);
      setState({ accessToken: null, isAuthenticated: false, isLoading: false, error: null });
      return null;
    }

    setTokenSet(refreshed);
    setState((prev) => ({ ...prev, accessToken: refreshed.accessToken, isAuthenticated: true }));
    return refreshed.accessToken;
  }, [tokenSet, discovery]);

  return {
    ...state,
    login,
    logout,
    getValidToken,
  };
}

/**
 * Hook consommateur — à utiliser dans les composants
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
