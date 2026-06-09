export const CALENDAR_SYNC_QUEUE = 'calendar-sync';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  // Requis par exchangeCode() → oauth2.userinfo.get() pour récupérer l'email du compte.
  // Sans ces scopes, Google renvoie "Request is missing required authentication credential"
  // et tout le callback OAuth échoue (connexion jamais enregistrée).
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
];

export const GOOGLE_COLOR_MAP: Record<string, string> = {
  '#3D52A0': '9',
  '#0D9488': '2',
  '#7C3AED': '3',
};

export const DEFAULT_GOOGLE_COLOR = '9';
