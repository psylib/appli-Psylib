import { test, expect } from '@playwright/test';
import { loginAsPsychologist, mockApi } from './helpers';

// La salle de visio a besoin d'une caméra/micro : on fournit des périphériques
// factices à Chromium et on pré-accorde les permissions.
test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
  permissions: ['camera', 'microphone'],
});

const ROOM_ID = 'appt-e2e-001';

/**
 * Monte la vraie salle de visio psy avec l'API mockée (token LiveKit factice).
 * La connexion LiveKit échoue silencieusement (wsUrl bidon) mais `LiveKitRoom`
 * rend ses enfants immédiatement — ce qui suffit pour valider le polish UX
 * (bouton clavier + overlay d'aide via le raccourci `?`).
 */
async function enterRoom(page: import('@playwright/test').Page) {
  await loginAsPsychologist(page);

  await mockApi(page, 'GET', `/video/rooms/${ROOM_ID}/guests`, []);
  await mockApi(page, 'POST', '/video/rooms', { ok: true });
  // Enregistré en dernier → invoqué en premier (ordre inverse Playwright) pour
  // ne pas être masqué par la route POST `/video/rooms*`. NB: getPsyToken = POST.
  await mockApi(page, 'POST', `/video/rooms/${ROOM_ID}/token`, {
    token: 'fake.livekit.token.for-e2e',
    wsUrl: 'wss://127.0.0.1:1',
    roomName: 'room-e2e',
    durationMin: 50,
    patientId: null,
    scribeEnabled: false,
    patientScribeConsent: false,
  });

  await page.goto(`/video/${ROOM_ID}`);

  // Préflight matériel → entrer dans la salle
  await page.getByRole('button', { name: 'Entrer dans la salle' }).click();
}

test.describe('Salle de visio psy — polish UX', () => {
  test('le bouton clavier ouvre l\'overlay des raccourcis', async ({ page }) => {
    await enterRoom(page);

    const keyboardBtn = page.getByTitle('Raccourcis clavier (?)');
    await expect(keyboardBtn).toBeVisible();

    await keyboardBtn.click();
    await expect(page.getByRole('heading', { name: 'Raccourcis clavier' })).toBeVisible();
    // Les libellés des raccourcis sont présents
    await expect(page.getByText('Couper / activer le micro')).toBeVisible();
    await expect(page.getByText('Plein écran')).toBeVisible();
  });

  test('le raccourci `?` ouvre puis ferme l\'overlay', async ({ page }) => {
    await enterRoom(page);

    // Ouvre via le clavier (Shift+Slash produit la touche "?")
    await page.keyboard.press('Shift+Slash');
    await expect(page.getByRole('heading', { name: 'Raccourcis clavier' })).toBeVisible();

    // Re-presser bascule (ferme) l'overlay
    await page.keyboard.press('Shift+Slash');
    await expect(page.getByRole('heading', { name: 'Raccourcis clavier' })).toBeHidden();
  });
});
