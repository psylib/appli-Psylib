export function guardianConsentConfirmedEmail(params: {
  guardianName: string;
  patientFirstName: string;
  consentType: string;
}): { subject: string; html: string } {
  const subject = `[PsyLib] Consentement enregistre pour ${params.patientFirstName}`;

  const html = `
    <h1>Consentement enregistre</h1>
    <p>Le consentement <strong>${params.consentType}</strong> pour <strong>${params.patientFirstName}</strong> a ete approuve par ${params.guardianName}.</p>
    <p>Cette fonctionnalite est maintenant active pour le dossier de ${params.patientFirstName}.</p>
  `;

  return { subject, html };
}
