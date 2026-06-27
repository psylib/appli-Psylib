import { shouldSkipActivationEmail, type SequenceBehaviorSignals } from './email-sequence.service';

const ACTIVE: SequenceBehaviorSignals = {
  bioFilled: true,
  aiUsed: true,
  patientInvited: true,
  isPaid: true,
};

const FRESH: SequenceBehaviorSignals = {
  bioFilled: false,
  aiUsed: false,
  patientInvited: false,
  isPaid: false,
};

const DAY = {
  day1: 'EMAIL_SEQUENCE_DAY_1',
  day3: 'EMAIL_SEQUENCE_DAY_3',
  day5: 'EMAIL_SEQUENCE_DAY_5',
  day7: 'EMAIL_SEQUENCE_DAY_7',
  day10: 'EMAIL_SEQUENCE_DAY_10',
  day14: 'EMAIL_SEQUENCE_DAY_14',
};

describe('shouldSkipActivationEmail — ciblage comportemental', () => {
  it('envoie tous les emails à un psy fraîchement inscrit (rien fait)', () => {
    for (const action of Object.values(DAY)) {
      expect(shouldSkipActivationEmail(action, FRESH).skip).toBe(false);
    }
  });

  it('supprime tous les emails ciblés pour un psy déjà pleinement actif', () => {
    expect(shouldSkipActivationEmail(DAY.day1, ACTIVE).skip).toBe(true); // IA utilisée
    expect(shouldSkipActivationEmail(DAY.day3, ACTIVE).skip).toBe(true); // bio remplie
    expect(shouldSkipActivationEmail(DAY.day7, ACTIVE).skip).toBe(true); // payant
    expect(shouldSkipActivationEmail(DAY.day10, ACTIVE).skip).toBe(true); // patient invité
    expect(shouldSkipActivationEmail(DAY.day14, ACTIVE).skip).toBe(true); // payant
  });

  it('day1 (wow IA) : supprimé seulement si l’IA a déjà servi', () => {
    expect(shouldSkipActivationEmail(DAY.day1, { ...FRESH, aiUsed: true })).toEqual({
      skip: true,
      reason: 'ai-already-used',
    });
    expect(shouldSkipActivationEmail(DAY.day1, { ...FRESH, aiUsed: false }).skip).toBe(false);
  });

  it('day3 (profil public) : supprimé seulement si la bio est remplie', () => {
    expect(shouldSkipActivationEmail(DAY.day3, { ...FRESH, bioFilled: true }).reason).toBe(
      'profile-already-filled',
    );
    expect(shouldSkipActivationEmail(DAY.day3, { ...FRESH, bioFilled: false }).skip).toBe(false);
  });

  it('day7 et day14 (upsell) : supprimés seulement si déjà payant', () => {
    expect(shouldSkipActivationEmail(DAY.day7, { ...FRESH, isPaid: true }).reason).toBe('already-paid');
    expect(shouldSkipActivationEmail(DAY.day14, { ...FRESH, isPaid: true }).reason).toBe('already-paid');
    expect(shouldSkipActivationEmail(DAY.day7, { ...FRESH, isPaid: false }).skip).toBe(false);
    expect(shouldSkipActivationEmail(DAY.day14, { ...FRESH, isPaid: false }).skip).toBe(false);
  });

  it('day10 (portail patient) : supprimé seulement si un patient a déjà été invité', () => {
    expect(shouldSkipActivationEmail(DAY.day10, { ...FRESH, patientInvited: true }).reason).toBe(
      'patient-already-invited',
    );
    expect(shouldSkipActivationEmail(DAY.day10, { ...FRESH, patientInvited: false }).skip).toBe(false);
  });

  it('day5 (info visio) : jamais supprimé (pas de signal de complétion fiable)', () => {
    expect(shouldSkipActivationEmail(DAY.day5, ACTIVE).skip).toBe(false);
    expect(shouldSkipActivationEmail(DAY.day5, FRESH).skip).toBe(false);
  });

  it('action inconnue : jamais supprimée (fail-open, on n’interrompt pas un flux non géré)', () => {
    expect(shouldSkipActivationEmail('SOME_OTHER_ACTION', ACTIVE).skip).toBe(false);
  });
});
