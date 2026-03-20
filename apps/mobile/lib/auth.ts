/**
 * Keycloak OIDC Authentication — expo-auth-session (SDK 55)
 * Flow: Authorization Code + PKCE
 * Client ID: psylib-mobile
 */
import {
  AuthRequest,
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
  TokenResponse,
  refreshAsync,
  revokeAsync,
  RevokeTokenRequestConfig,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { storage } from './storage';

WebBrowser.maybeCompleteAuthSession();

const KEYCLOAK_URL =
  (Constants.expoConfig?.extra?.keycloakUrl as string | undefined) ??
  'http://localhost:8080';
const KEYCLOAK_REALM =
  (Constants.expoConfig?.extra?.keycloakRealm as string | undefined) ??
  'psyscale';
const CLIENT_ID =
  (Constants.expoConfig?.extra?.keycloakClientId as string | undefined) ??
  'psylib-mobile';

export const DISCOVERY_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/.well-known/openid-configuration`;

export const REDIRECT_URI = makeRedirectUri({
  scheme: 'psylib',
  path: 'auth/callback',
});

export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  expiresAt: number; // Unix timestamp ms
}

export function useKeycloakAuth() {
  const discovery = useAutoDiscovery(DISCOVERY_URL);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      usePKCE: true,
    },
    discovery,
  );

  return { request, response, promptAsync, discovery };
}

export async function exchangeCodeForTokens(
  code: string,
  request: AuthRequest,
  discovery: NonNullable<ReturnType<typeof useAutoDiscovery>>,
): Promise<TokenSet> {
  const tokenResponse = await exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      code,
      extraParams: request.codeVerifier
        ? { code_verifier: request.codeVerifier }
        : {},
    },
    discovery,
  );

  const tokenSet = buildTokenSet(tokenResponse);
  await persistTokens(tokenSet);
  return tokenSet;
}

export async function refreshAccessToken(
  refreshToken: string,
  discovery: NonNullable<ReturnType<typeof useAutoDiscovery>>,
): Promise<TokenSet | null> {
  try {
    const tokenResponse = await refreshAsync(
      { clientId: CLIENT_ID, refreshToken },
      discovery,
    );
    const tokenSet = buildTokenSet(tokenResponse);
    await persistTokens(tokenSet);
    return tokenSet;
  } catch {
    await storage.clearAll();
    return null;
  }
}

export async function revokeTokens(
  tokens: TokenSet,
  discovery: NonNullable<ReturnType<typeof useAutoDiscovery>>,
): Promise<void> {
  const config: RevokeTokenRequestConfig = {
    clientId: CLIENT_ID,
    token: tokens.accessToken,
    tokenTypeHint: 'access_token',
  };
  try {
    await revokeAsync(config, discovery);
  } catch {
    // On supprime les tokens locaux meme si la revocation echoue
  }
  await storage.clearAll();
}

export async function loadStoredTokens(): Promise<TokenSet | null> {
  const [accessToken, refreshToken, expiryStr, idToken] = await Promise.all([
    storage.getAccessToken(),
    storage.getRefreshToken(),
    storage.getTokenExpiry(),
    storage.getIdToken(),
  ]);

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken,
    idToken,
    expiresAt: expiryStr ?? 0,
  };
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60_000;
}

function buildTokenSet(response: TokenResponse): TokenSet {
  const expiresIn = response.expiresIn ?? 900;
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? null,
    idToken: response.idToken ?? null,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

async function persistTokens(tokens: TokenSet): Promise<void> {
  await Promise.all([
    storage.setAccessToken(tokens.accessToken),
    tokens.refreshToken
      ? storage.setRefreshToken(tokens.refreshToken)
      : Promise.resolve(),
    storage.setTokenExpiry(tokens.expiresAt),
    tokens.idToken ? storage.setIdToken(tokens.idToken) : Promise.resolve(),
  ]);
}
