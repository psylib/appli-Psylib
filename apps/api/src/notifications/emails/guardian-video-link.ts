export function guardianVideoLinkEmail(params: {
  guardianName: string;
  patientFirstName: string;
  psychologistName: string;
  scheduledDate: string;
  scheduledTime: string;
}): { subject: string; html: string } {
  const subject = `[PsyLib] Consultation video de ${params.patientFirstName} — ${params.scheduledDate}`;

  const html = `
    <h1>Bonjour ${params.guardianName},</h1>
    <p>Une consultation video est prevue pour <strong>${params.patientFirstName}</strong> avec ${params.psychologistName}.</p>
    <div style="background:#F1F0F9;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0;font-size:15px;">
        <strong>${params.scheduledDate}</strong> a <strong>${params.scheduledTime}</strong>
      </p>
    </div>
    <p>En tant que responsable legal, nous vous informons de cette consultation. Le lien de connexion a ete envoye directement a ${params.patientFirstName}.</p>
    <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
      Pour toute question ou si vous souhaitez annuler cette consultation, contactez directement le praticien.
    </p>
  `;

  return { subject, html };
}
