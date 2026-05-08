const CONSENT_TYPE_LABELS: Record<string, string> = {
  data_processing: 'Traitement des donnees',
  ai_processing: 'Utilisation de l\'intelligence artificielle',
  video_consultation: 'Consultation video',
};

export function guardianConsentRequestEmail(params: {
  guardianName: string;
  patientFirstName: string;
  psychologistName: string;
  consentType: string;
  consentUrl: string;
}): { subject: string; html: string } {
  const label = CONSENT_TYPE_LABELS[params.consentType] ?? params.consentType;
  const subject = `[PsyLib] Consentement requis pour ${params.patientFirstName} — ${label}`;

  const html = `
    <h1>Bonjour ${params.guardianName},</h1>
    <p>${params.psychologistName} demande votre consentement pour activer la fonctionnalite suivante pour ${params.patientFirstName} :</p>
    <div style="background:#F1F0F9;padding:16px;border-radius:8px;margin:16px 0;">
      <strong>${label}</strong>
    </div>
    <p>En tant que responsable legal, votre approbation est requise avant l'activation de cette fonctionnalite.</p>
    <p style="text-align: center;">
      <a href="${params.consentUrl}" style="display:inline-block;background:#3D52A0;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Consulter et repondre</a>
    </p>
    <p style="color: #9CA3AF; font-size: 14px;">Ce lien est valable 30 jours. Votre adresse IP et la date seront enregistrees conformement au RGPD.</p>
  `;

  return { subject, html };
}
