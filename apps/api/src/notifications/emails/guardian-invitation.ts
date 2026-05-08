export function guardianInvitationEmail(params: {
  guardianName: string;
  patientFirstName: string;
  psychologistName: string;
  activationUrl: string;
}): { subject: string; html: string } {
  const subject = `[PsyLib] ${params.psychologistName} vous invite a suivre le dossier de ${params.patientFirstName}`;

  const html = `
    <h1>Bonjour ${params.guardianName},</h1>
    <p>${params.psychologistName} vous invite a acceder au portail de suivi de <strong>${params.patientFirstName}</strong> sur PsyLib.</p>
    <p>En tant que responsable legal, vous pourrez :</p>
    <ul>
      <li>Suivre le bien-etre de votre enfant</li>
      <li>Consulter les exercices therapeutiques</li>
      <li>Acceder aux documents partages</li>
      <li>Recevoir les factures</li>
    </ul>
    <p style="text-align: center;">
      <a href="${params.activationUrl}" style="display:inline-block;background:#3D52A0;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Activer mon acces</a>
    </p>
    <p style="color: #9CA3AF; font-size: 14px;">Ce lien est valable 7 jours. Si vous n'etes pas concerne par cette invitation, vous pouvez l'ignorer.</p>
  `;

  return { subject, html };
}
