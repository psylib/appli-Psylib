export function guardianInvoiceEmail(params: {
  guardianName: string;
  patientFirstName: string;
  psychologistName: string;
  invoiceNumber: string;
  amount: string;
  issuedAt: string;
}): { subject: string; html: string } {
  const subject = `[PsyLib] Facture ${params.invoiceNumber} — Seance de ${params.patientFirstName}`;

  const html = `
    <h1>Bonjour ${params.guardianName},</h1>
    <p>Veuillez trouver ci-joint la facture <strong>${params.invoiceNumber}</strong> pour une seance de ${params.patientFirstName} avec ${params.psychologistName}.</p>
    <div style="background:#F1F0F9;border-radius:8px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0;font-size:15px;">
        <strong>${params.invoiceNumber}</strong><br />
        <span style="color:#6B7280;">Emise le ${params.issuedAt} — Montant : ${params.amount}</span>
      </p>
    </div>
    <p style="font-size:14px;color:#6B7280;margin-top:8px;">
      TVA non applicable — Art. 261-4-1° du CGI (psychologues exoneres de TVA).
    </p>
    <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
      En tant que responsable legal de ${params.patientFirstName}, vous recevez cette facture automatiquement. Pour toute question, contactez directement le praticien.
    </p>
  `;

  return { subject, html };
}
