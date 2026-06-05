export function assistantInvitationEmail(params: {
  assistantName: string;
  psychologistName: string;
  activationUrl: string;
}): { subject: string; html: string } {
  const subject = `${params.psychologistName} vous invite comme assistant·e sur PsyLib`;

  const html = `
    <h1>Bonjour ${params.assistantName},</h1>
    <p><strong>${params.psychologistName}</strong> vous invite à le/la seconder sur PsyLib, la plateforme sécurisée de gestion de cabinet pour psychologues.</p>
    <p>En tant qu'assistant·e, vous pourrez :</p>
    <ul>
      <li>Gérer l'agenda et les rendez-vous</li>
      <li>Accéder aux informations administratives des dossiers patients</li>
      <li>Préparer la facturation et le suivi des paiements</li>
    </ul>
    <div class="info-box" style="font-size:14px;color:#6B7280;">
      <strong style="color:#1E1B4B;">Confidentialité :</strong> vous n'avez <strong>pas accès aux notes cliniques</strong> ni au contenu thérapeutique des séances. Vous êtes tenu·e au secret professionnel et au respect du RGPD.
    </div>
    <p style="text-align: center;">
      <a href="${params.activationUrl}" class="btn" style="display:inline-block;background:#3D52A0;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">Activer mon accès</a>
    </p>
    <p style="color: #9CA3AF; font-size: 14px;">Ce lien est valable 7 jours. Si vous n'êtes pas concerné·e par cette invitation, vous pouvez l'ignorer.</p>
  `;

  return { subject, html };
}
