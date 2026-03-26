import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

// ─── Shared layout helpers ────────────────────────────────────────────────────

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8F7FF; font-family: Inter, Arial, sans-serif; color: #1E1B4B; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(61,82,160,0.08); }
    .header { background: #3D52A0; padding: 32px 40px; text-align: center; }
    .header-logo { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .body { padding: 40px; }
    h1 { font-size: 22px; font-weight: 700; color: #1E1B4B; margin: 0 0 16px; }
    p { font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 16px; }
    .btn { display: inline-block; background: #3D52A0; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .info-box { background: #F1F0F9; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
    .badge { display: inline-block; border-radius: 20px; padding: 6px 16px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
    .badge-success { background: #D1FAE5; color: #065F46; }
    .badge-warning { background: #FEF3C7; color: #92400E; }
    .alert-box { border-radius: 8px; padding: 16px 20px; margin: 16px 0; display: flex; align-items: flex-start; gap: 12px; }
    .alert-warning { background: #FEF9C3; border: 1px solid #FDE047; }
    .alert-danger { background: #FEE2E2; border: 1px solid #FCA5A5; }
    .footer { padding: 24px 40px; border-top: 1px solid #E5E7EB; font-size: 13px; color: #9CA3AF; text-align: center; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">PsyLib</div>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      PsyLib — Plateforme sécurisée pour psychologues libéraux<br />
      Données hébergées en France (HDS conforme)
    </div>
  </div>
</body>
</html>`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY is required');
    this.resend = new Resend(apiKey);
    this.from = this.config.get<string>('EMAIL_FROM') ?? 'PsyLib <noreply@psylib.eu>';
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    method: string,
    attachments?: Array<{ filename: string; content: Buffer }>,
  ): Promise<void> {
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html, attachments });
    } catch (error) {
      const masked = to.replace(/^(.{2}).*(@.*)$/, '$1***$2');
      this.logger.error(`[EmailService] ${method} failed for ${masked}: ${(error as Error).message}`);
    }
  }

  // ─── BIENVENUE (fin d'onboarding) ───────────────────────────────────────────

  async sendWelcomeEmail(
    to: string,
    data: { psychologistName: string; dashboardUrl: string },
  ): Promise<void> {
    const html = emailLayout(
      'Bienvenue sur PsyLib',
      `<h1>Bienvenue sur PsyLib, ${data.psychologistName} !</h1>
      <div class="badge badge-success">Compte activé</div>
      <p>
        Votre espace de travail est prêt. Vous pouvez dès maintenant ajouter vos premiers patients,
        rédiger vos notes de séance et utiliser l'assistant IA.
      </p>
      <p>
        14 jours d'essai gratuit — aucune carte de crédit requise.
      </p>
      <div style="text-align:center;">
        <a href="${data.dashboardUrl}" class="btn">Accéder à mon espace</a>
      </div>
      <div class="info-box" style="font-size:14px;color:#6B7280;margin-top:24px;">
        <strong style="color:#1E1B4B;">Pour bien démarrer :</strong><br />
        1. Ajoutez votre premier patient<br />
        2. Planifiez une séance<br />
        3. Essayez le résumé automatique IA
      </div>`,
    );

    await this.send(to, 'Bienvenue sur PsyLib — votre espace est prêt', html, 'sendWelcomeEmail');
  }

  // ─── CONFIRMATION RENDEZ-VOUS ────────────────────────────────────────────────

  async sendAppointmentConfirmation(
    to: string,
    data: {
      patientName: string;
      psychologistName: string;
      scheduledAt: Date;
      duration: number;
    },
  ): Promise<void> {
    const dateFormatted = data.scheduledAt.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = data.scheduledAt.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = emailLayout(
      'Confirmation de rendez-vous',
      `<h1>Bonjour ${data.patientName},</h1>
      <p>
        Votre rendez-vous avec <strong>${data.psychologistName}</strong> est confirmé.
      </p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;">
          <strong>📅 ${dateFormatted}</strong><br />
          <span style="color:#6B7280;">à ${timeFormatted} · durée ${data.duration} min</span>
        </p>
      </div>
      <p style="font-size:14px;color:#6B7280;margin-top:24px;">
        En cas d'empêchement, merci de prévenir votre praticien dans les meilleurs délais.
      </p>`,
    );

    await this.send(
      to,
      `Confirmation RDV — ${dateFormatted} à ${timeFormatted}`,
      html,
      'sendAppointmentConfirmation',
    );
  }

  // ─── RAPPEL RENDEZ-VOUS (J-1) ────────────────────────────────────────────────

  async sendAppointmentReminder(
    to: string,
    data: {
      patientName: string;
      psychologistName: string;
      scheduledAt: Date;
      duration: number;
    },
  ): Promise<void> {
    const dateFormatted = data.scheduledAt.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeFormatted = data.scheduledAt.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = emailLayout(
      'Rappel de rendez-vous',
      `<h1>Rappel — demain à ${timeFormatted}</h1>
      <p>
        Bonjour ${data.patientName},<br />
        Votre rendez-vous avec <strong>${data.psychologistName}</strong> a lieu demain.
      </p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;">
          <strong>📅 ${dateFormatted}</strong><br />
          <span style="color:#6B7280;">à ${timeFormatted} · durée ${data.duration} min</span>
        </p>
      </div>`,
    );

    await this.send(
      to,
      `Rappel RDV demain à ${timeFormatted} avec ${data.psychologistName}`,
      html,
      'sendAppointmentReminder',
    );
  }

  // ─── ABONNEMENT ACTIVÉ ───────────────────────────────────────────────────────

  async sendSubscriptionActivated(
    to: string,
    data: {
      psychologistName: string;
      plan: string;
      trialEndsAt?: Date | null;
    },
  ): Promise<void> {
    const planLabel = { starter: 'Starter', pro: 'Pro', clinic: 'Clinic' }[data.plan] ?? data.plan;
    const trialHtml = data.trialEndsAt
      ? `<p style="font-size:14px;color:#6B7280;">
          Période d'essai jusqu'au <strong>${data.trialEndsAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> — aucun débit avant cette date.
        </p>`
      : '';

    const html = emailLayout(
      'Abonnement activé',
      `<h1>Abonnement ${planLabel} activé !</h1>
      <div class="badge badge-success">Plan ${planLabel}</div>
      <p>
        Bonjour ${data.psychologistName},<br />
        Votre abonnement PsyLib ${planLabel} est maintenant actif. Toutes les fonctionnalités sont débloquées.
      </p>
      ${trialHtml}
      <p style="font-size:14px;color:#6B7280;">
        Vous pouvez gérer votre abonnement et consulter vos factures depuis votre espace.
      </p>`,
    );

    await this.send(
      to,
      `Abonnement PsyLib ${planLabel} activé`,
      html,
      'sendSubscriptionActivated',
    );
  }

  // ─── PAIEMENT ÉCHOUÉ ─────────────────────────────────────────────────────────

  async sendPaymentFailed(
    to: string,
    data: { psychologistName: string; portalUrl: string },
  ): Promise<void> {
    const html = emailLayout(
      'Problème de paiement',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <div class="alert-box alert-danger">
        <div>
          <strong style="color:#991B1B;">Paiement non abouti</strong><br />
          <span style="font-size:14px;color:#7F1D1D;">
            Nous n'avons pas pu débiter votre moyen de paiement. Votre accès aux fonctionnalités premium sera limité si le problème persiste.
          </span>
        </div>
      </div>
      <p>Mettez à jour votre moyen de paiement pour éviter toute interruption de service.</p>
      <div style="text-align:center;">
        <a href="${data.portalUrl}" class="btn">Mettre à jour mon paiement</a>
      </div>
      <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
        Si vous pensez qu'il s'agit d'une erreur, contactez-nous à support@psylib.eu
      </p>`,
    );

    await this.send(
      to,
      'Action requise — problème de paiement PsyLib',
      html,
      'sendPaymentFailed',
    );
  }

  // ─── ABONNEMENT ANNULÉ ───────────────────────────────────────────────────────

  async sendSubscriptionCanceled(
    to: string,
    data: { psychologistName: string; endDate?: Date | null },
  ): Promise<void> {
    const endDateHtml = data.endDate
      ? `<p>Vous conservez l'accès à toutes les fonctionnalités jusqu'au <strong>${data.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>`
      : '<p>Votre compte repasse sur le plan gratuit.</p>';

    const html = emailLayout(
      'Abonnement annulé',
      `<h1>Abonnement annulé</h1>
      <p>Bonjour ${data.psychologistName},</p>
      <p>Votre abonnement PsyLib a été annulé.</p>
      ${endDateHtml}
      <p style="font-size:14px;color:#6B7280;">
        Vos données sont conservées. Vous pouvez vous réabonner à tout moment depuis votre espace.
      </p>
      <p style="font-size:13px;color:#9CA3AF;">
        Si vous avez annulé par erreur ou souhaitez nous faire part de vos retours, écrivez-nous à support@psylib.eu
      </p>`,
    );

    await this.send(to, 'Votre abonnement PsyLib a été annulé', html, 'sendSubscriptionCanceled');
  }

  // ─── FACTURE ENVOYÉE (avec PDF en pièce jointe) ──────────────────────────────

  async sendInvoiceSent(
    to: string,
    data: {
      patientName: string;
      psychologistName: string;
      invoiceNumber: string;
      amountTtc: number;
      issuedAt: Date;
      pdfBuffer: Buffer;
    },
  ): Promise<void> {
    const dateFormatted = data.issuedAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const amountFormatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(data.amountTtc);

    const html = emailLayout(
      'Votre facture',
      `<h1>Bonjour ${data.patientName},</h1>
      <p>
        Veuillez trouver ci-joint votre facture émise par <strong>${data.psychologistName}</strong>.
      </p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;">
          <strong>${data.invoiceNumber}</strong><br />
          <span style="color:#6B7280;">Émise le ${dateFormatted} · Montant : ${amountFormatted}</span>
        </p>
      </div>
      <p style="font-size:14px;color:#6B7280;margin-top:8px;">
        TVA non applicable — Art. 261-4-1° du CGI (psychologues exonérés de TVA).
      </p>
      <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
        Pour toute question concernant cette facture, contactez directement votre praticien.
      </p>`,
    );

    await this.send(
      to,
      `Facture ${data.invoiceNumber} — ${data.psychologistName}`,
      html,
      'sendInvoiceSent',
      [{ filename: `facture-${data.invoiceNumber}.pdf`, content: data.pdfBuffer }],
    );
  }

  // ─── EMAIL D'INVITATION PATIENT ─────────────────────────────────────────────

  async sendPatientInvitation(
    to: string,
    data: {
      patientName: string;
      psychologistName: string;
      invitationUrl: string;
      expiresAt: Date;
    },
  ): Promise<void> {
    const expiresFormatted = data.expiresAt.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const html = emailLayout(
      'Invitation PsyLib',
      `<h1>Bonjour ${data.patientName},</h1>
      <p>
        <strong>${data.psychologistName}</strong> vous invite à accéder à votre espace patient PsyLib.
      </p>
      <p>
        Cet espace sécurisé vous permet de suivre votre humeur, consulter vos exercices thérapeutiques et garder contact avec votre praticien.
      </p>
      <div style="text-align:center;">
        <a href="${data.invitationUrl}" class="btn">Créer mon espace patient</a>
      </div>
      <div class="info-box" style="font-size:13px;color:#6B7280;">
        Cette invitation est valable jusqu'au <strong>${expiresFormatted}</strong>.
      </div>`,
    );

    await this.send(
      to,
      `${data.psychologistName} vous invite sur PsyLib`,
      html,
      'sendPatientInvitation',
    );
  }

  // ─── NOTIFICATION INVITATION ACCEPTÉE ───────────────────────────────────────

  async sendInvitationAccepted(
    to: string,
    data: { patientName: string; psychologistName: string },
  ): Promise<void> {
    const html = emailLayout(
      'Invitation acceptée',
      `<h1>Bonne nouvelle, ${data.psychologistName} !</h1>
      <div class="badge badge-success">Invitation acceptée</div>
      <p>
        Votre patient <strong>${data.patientName}</strong> vient d'activer son espace patient PsyLib.
      </p>
      <p>
        Il peut désormais consulter ses exercices, enregistrer son humeur et vous envoyer des messages via la plateforme.
      </p>`,
    );

    await this.send(
      to,
      `${data.patientName} a rejoint votre espace PsyLib`,
      html,
      'sendInvitationAccepted',
    );
  }

  // ─── NOTIFICATION HUMEUR ENREGISTRÉE ────────────────────────────────────────

  async sendMoodLogged(
    to: string,
    data: {
      patientName: string;
      mood: number;
      note?: string;
      psychologistName: string;
    },
  ): Promise<void> {
    const moodLabels: Record<number, { label: string; color: string; bg: string }> = {
      1: { label: 'Très difficile', color: '#991B1B', bg: '#FEE2E2' },
      2: { label: 'Difficile', color: '#9A3412', bg: '#FFEDD5' },
      3: { label: 'Neutre', color: '#92400E', bg: '#FEF3C7' },
      4: { label: 'Bien', color: '#3F6212', bg: '#ECFCCB' },
      5: { label: 'Très bien', color: '#065F46', bg: '#D1FAE5' },
    };

    const moodLevel = Math.min(5, Math.max(1, Math.round(data.mood / 2)));
    const moodInfo = moodLabels[moodLevel] ?? moodLabels[3]!;

    const noteHtml = data.note
      ? `<div style="background:#F1F0F9;border-left:3px solid #3D52A0;border-radius:4px;padding:12px 16px;margin-top:16px;font-size:15px;color:#374151;font-style:italic;">"${data.note}"</div>`
      : '';

    const html = emailLayout(
      'Humeur enregistrée',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <p><strong>${data.patientName}</strong> vient d'enregistrer son humeur du jour.</p>
      <div style="display:inline-block;background:${moodInfo.bg};color:${moodInfo.color};border-radius:8px;padding:10px 20px;font-size:16px;font-weight:600;margin:8px 0;">
        ${data.mood}/10 — ${moodInfo.label}
      </div>
      ${noteHtml}`,
    );

    await this.send(
      to,
      `${data.patientName} a enregistré son humeur (${data.mood}/10)`,
      html,
      'sendMoodLogged',
    );
  }

  // ─── NOUVELLE DEMANDE DE RDV (notif à la psy) ────────────────────────────────

  async sendBookingRequestToPsy(
    to: string,
    data: {
      patientName: string;
      patientEmail: string;
      patientPhone?: string;
      psychologistName: string;
      scheduledAt: Date;
      duration: number;
      reason?: string;
      dashboardUrl: string;
    },
  ): Promise<void> {
    const dateFormatted = data.scheduledAt.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const timeFormatted = data.scheduledAt.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit',
    });
    const phoneHtml = data.patientPhone
      ? `<br /><span style="color:#6B7280;">Tél : ${data.patientPhone}</span>`
      : '';
    const reasonHtml = data.reason
      ? `<div style="background:#F1F0F9;border-left:3px solid #3D52A0;border-radius:4px;padding:12px 16px;margin-top:12px;font-size:15px;color:#374151;font-style:italic;">"${data.reason}"</div>`
      : '';

    const html = emailLayout(
      'Nouvelle demande de RDV',
      `<h1>Nouvelle demande de RDV</h1>
      <div class="badge badge-warning">En attente de confirmation</div>
      <p>Bonjour ${data.psychologistName},<br />
      <strong>${data.patientName}</strong> souhaite prendre rendez-vous avec vous.</p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;">
          <strong>📅 ${dateFormatted}</strong><br />
          <span style="color:#6B7280;">à ${timeFormatted} · durée ${data.duration} min</span><br />
          <span style="color:#6B7280;">Patient : ${data.patientName} — ${data.patientEmail}</span>
          ${phoneHtml}
        </p>
      </div>
      ${reasonHtml}
      <div style="text-align:center;margin-top:24px;">
        <a href="${data.dashboardUrl}" class="btn">Confirmer ou refuser</a>
      </div>`,
    );

    await this.send(
      to,
      `Nouvelle demande de RDV — ${data.patientName} le ${dateFormatted}`,
      html,
      'sendBookingRequestToPsy',
    );
  }

  // ─── ACCUSÉ DE RÉCEPTION PATIENT ─────────────────────────────────────────────

  async sendBookingReceivedToPatient(
    to: string,
    data: {
      patientName: string;
      psychologistName: string;
      scheduledAt: Date;
      duration: number;
    },
  ): Promise<void> {
    const dateFormatted = data.scheduledAt.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const timeFormatted = data.scheduledAt.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit',
    });

    const html = emailLayout(
      'Demande de RDV reçue',
      `<h1>Bonjour ${data.patientName},</h1>
      <div class="badge badge-warning">En attente de confirmation</div>
      <p>
        Votre demande de rendez-vous avec <strong>${data.psychologistName}</strong> a bien été reçue.
        Vous recevrez une confirmation dès que le praticien aura validé le créneau.
      </p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;">
          <strong>📅 ${dateFormatted}</strong><br />
          <span style="color:#6B7280;">à ${timeFormatted} · durée ${data.duration} min</span>
        </p>
      </div>
      <p style="font-size:14px;color:#6B7280;margin-top:16px;">
        Si vous souhaitez annuler cette demande, répondez à cet email en indiquant votre souhait.
      </p>`,
    );

    await this.send(
      to,
      `Demande de RDV bien reçue — ${data.psychologistName}`,
      html,
      'sendBookingReceivedToPatient',
    );
  }

  // ─── REFUS DE RDV (patient) ───────────────────────────────────────────────────

  async sendBookingDeclined(
    to: string,
    data: {
      patientName: string;
      psychologistName: string;
      scheduledAt: Date;
    },
  ): Promise<void> {
    const dateFormatted = data.scheduledAt.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const timeFormatted = data.scheduledAt.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit',
    });

    const html = emailLayout(
      'Demande de RDV non retenue',
      `<h1>Bonjour ${data.patientName},</h1>
      <p>
        Votre demande de rendez-vous avec <strong>${data.psychologistName}</strong>
        prévue le ${dateFormatted} à ${timeFormatted} n'a pas pu être acceptée.
      </p>
      <p>
        ${data.psychologistName} vous invite à le/la recontacter directement pour trouver
        un autre créneau disponible.
      </p>
      <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
        Si vous avez des questions, contactez directement votre praticien.
      </p>`,
    );

    await this.send(
      to,
      `Demande de RDV — ${data.psychologistName}`,
      html,
      'sendBookingDeclined',
    );
  }

  // ─── SÉQUENCE ACTIVATION — DAY 1 ────────────────────────────────────────────

  async sendActivationDay1(
    to: string,
    data: { psychologistName: string; dashboardUrl: string },
  ): Promise<void> {
    const html = emailLayout(
      'Avez-vous essayé l\'assistant IA ?',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <p>
        Vous êtes sur PsyLib depuis hier — bienvenue !
      </p>
      <p>
        La fonctionnalité que les psys adorent le plus en ce moment :
        le <strong>résumé automatique de séance</strong>.
      </p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;line-height:1.7;">
          <strong>Comment ça marche :</strong><br />
          1. Créez une séance et rédigez vos notes brutes<br />
          2. Cliquez sur "Résumer avec IA"<br />
          3. Obtenez un compte-rendu structuré en quelques secondes
        </p>
      </div>
      <p>
        Essayez maintenant — c'est inclus dans votre période d'essai.
      </p>
      <div style="text-align:center;">
        <a href="${data.dashboardUrl}/sessions/new" class="btn">Créer ma première séance</a>
      </div>
      <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
        Des questions ? Répondez directement à cet email, je lis tout.
      </p>`,
    );

    await this.send(
      to,
      'Avez-vous essayé le résumé IA ? (2 min)',
      html,
      'sendActivationDay1',
    );
  }

  // ─── SÉQUENCE ACTIVATION — DAY 3 ────────────────────────────────────────────

  async sendActivationDay3(
    to: string,
    data: { psychologistName: string; dashboardUrl: string; profileUrl: string },
  ): Promise<void> {
    const html = emailLayout(
      'Votre profil public est votre vitrine',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <p>
        Saviez-vous que PsyLib génère automatiquement une <strong>page de profil publique</strong> pour vous ?
      </p>
      <p>
        Les patients peuvent vous trouver, lire votre approche thérapeutique,
        et <strong>prendre rendez-vous directement en ligne</strong> — sans passer par Doctolib.
      </p>
      <div class="info-box">
        <p style="margin:0;font-size:14px;color:#6B7280;">
          Pour activer votre page :<br />
          Complétez votre profil (bio, spécialité, photo) → configurez vos disponibilités → partagez votre lien
        </p>
      </div>
      <div style="text-align:center;">
        <a href="${data.dashboardUrl}/settings/profile" class="btn">Compléter mon profil</a>
      </div>
      <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
        Votre profil public : <a href="${data.profileUrl}" style="color:#3D52A0;">${data.profileUrl}</a>
      </p>`,
    );

    await this.send(
      to,
      'Votre profil public PsyLib — attirez de nouveaux patients',
      html,
      'sendActivationDay3',
    );
  }

  // ─── SÉQUENCE ACTIVATION — DAY 7 ────────────────────────────────────────────

  async sendActivationDay7(
    to: string,
    data: {
      psychologistName: string;
      dashboardUrl: string;
      daysLeft: number;
    },
  ): Promise<void> {
    const urgencyHtml = data.daysLeft <= 7
      ? `<div class="alert-box alert-warning">
          <div>
            <strong style="color:#92400E;">Il vous reste ${data.daysLeft} jour${data.daysLeft > 1 ? 's' : ''} d'essai</strong><br />
            <span style="font-size:14px;color:#78350F;">Passez au plan Starter (49€/mois) pour continuer à utiliser PsyLib.</span>
          </div>
        </div>`
      : '<p>Votre période d\'essai est toujours en cours — profitez-en !</p>';

    const html = emailLayout(
      '7 jours avec PsyLib',
      `<h1>1 semaine ensemble, ${data.psychologistName} !</h1>
      <p>
        Voici ce que PsyLib peut faire pour vous au quotidien :
      </p>
      <div class="info-box">
        <p style="margin:0;font-size:14px;line-height:1.8;color:#374151;">
          ✅ <strong>Notes de séance</strong> — 5 templates (TCC, psychodynamique, systémique…)<br />
          ✅ <strong>Résumé IA</strong> — compte-rendu structuré en 1 clic<br />
          ✅ <strong>Prise de RDV en ligne</strong> — votre profil public<br />
          ✅ <strong>Facturation PDF</strong> — factures conformes en 30 secondes<br />
          ✅ <strong>Supervision</strong> — groupes d'intervision entre collègues
        </p>
      </div>
      ${urgencyHtml}
      <div style="text-align:center;">
        <a href="${data.dashboardUrl}/settings/billing" class="btn">Voir les plans</a>
      </div>
      <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
        Une question, un retour ? Répondez à cet email — je réponds personnellement.
      </p>`,
    );

    await this.send(
      to,
      '7 jours sur PsyLib — voici la suite',
      html,
      'sendActivationDay7',
    );
  }

  // ─── RE-ENGAGEMENT (inactif 14 jours) ───────────────────────────────────────

  async sendReEngagement(
    to: string,
    data: {
      psychologistName: string;
      daysSinceLastSession: number;
      dashboardUrl: string;
    },
  ): Promise<void> {
    const html = emailLayout(
      'Vos patients vous attendent',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <p>
        Cela fait <strong>${data.daysSinceLastSession} jours</strong> que vous n'avez pas
        enregistré de séance sur PsyLib. Tout va bien ?
      </p>
      <p>
        Votre espace vous attend — notes de séance, suivi patients, facturation, tout est là.
      </p>
      <div class="info-box">
        <p style="margin:0;font-size:14px;line-height:1.8;color:#374151;">
          <strong>Reprendre là où vous vous étiez arrêté(e) :</strong><br />
          📋 Consultez votre liste de patients<br />
          🗒️ Rédigez une note de séance<br />
          📅 Planifiez votre prochaine séance
        </p>
      </div>
      <div style="text-align:center;">
        <a href="${data.dashboardUrl}" class="btn">Reprendre mon activité</a>
      </div>
      <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
        Un problème ou une suggestion ? Répondez directement à cet email.
      </p>`,
    );

    await this.send(
      to,
      'Vos patients vous attendent sur PsyLib',
      html,
      'sendReEngagement',
    );
  }

  // ─── LEAD MAGNET (PDF en pièce jointe) ─────────────────────────────────────

  async sendLeadMagnet(
    to: string,
    data: {
      title: string;
      slug: string;
      pdfBuffer: Buffer;
    },
  ): Promise<void> {
    const html = emailLayout(
      `Votre ressource : ${data.title}`,
      `<h1>Votre ressource est prête !</h1>
      <p>
        Vous trouverez en pièce jointe votre document :
        <strong>${data.title}</strong>.
      </p>
      <p>
        Ce guide a été conçu spécialement pour les psychologues libéraux qui veulent
        structurer et développer leur activité.
      </p>
      <div class="info-box">
        <p style="margin:0;font-size:14px;line-height:1.8;color:#374151;">
          <strong>PsyLib, c'est aussi :</strong><br />
          ✅ Dossiers patients sécurisés (HDS conforme)<br />
          ✅ Notes cliniques structurées + résumé IA<br />
          ✅ Facturation PDF automatique<br />
          ✅ Prise de RDV en ligne
        </p>
      </div>
      <div style="text-align:center;">
        <a href="https://psylib.eu/login" class="btn">Essayer PsyLib gratuitement (14 jours)</a>
      </div>
      <p style="font-size:13px;color:#9CA3AF;margin-top:24px;">
        Des questions ? Répondez directement à cet email.
      </p>`,
    );

    await this.send(
      to,
      `Votre ressource PsyLib : ${data.title}`,
      html,
      'sendLeadMagnet',
      [{ filename: `${data.slug}.pdf`, content: data.pdfBuffer }],
    );
  }

  // ─── NOTIFICATION EXERCICE COMPLÉTÉ ─────────────────────────────────────────

  async sendExerciseCompleted(
    to: string,
    data: {
      patientName: string;
      exerciseTitle: string;
      feedback?: string;
      psychologistName: string;
    },
  ): Promise<void> {
    const feedbackHtml = data.feedback
      ? `<p style="font-size:15px;color:#374151;margin-top:16px;">Retour du patient :</p>
         <div style="background:#F1F0F9;border-left:3px solid #3D52A0;border-radius:4px;padding:12px 16px;font-size:15px;color:#374151;font-style:italic;">"${data.feedback}"</div>`
      : '';

    const html = emailLayout(
      'Exercice complété',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <p><strong>${data.patientName}</strong> vient de terminer un exercice thérapeutique.</p>
      <div class="info-box">
        <span style="font-size:15px;font-weight:600;color:#3D52A0;">${data.exerciseTitle}</span>
        <span class="badge badge-success" style="margin-left:8px;padding:4px 14px;font-size:13px;">Complété</span>
      </div>
      ${feedbackHtml}`,
    );

    await this.send(
      to,
      `${data.patientName} a complété l'exercice "${data.exerciseTitle}"`,
      html,
      'sendExerciseCompleted',
    );
  }

  // ─── SÉQUENCE POST-TRIAL (5 emails sur 14 jours) ─────────────────────────────

  async sendPostTrialDay1(
    to: string,
    data: { psychologistName: string; daysLeft: number; billingUrl: string },
  ): Promise<void> {
    const html = emailLayout(
      'Votre essai se termine bientôt',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <div class="alert-box alert-warning">
        <span style="font-size:24px;">&#9200;</span>
        <div>
          <strong>Il vous reste ${data.daysLeft} jour${data.daysLeft > 1 ? 's' : ''} d'essai gratuit.</strong>
          <p style="margin:4px 0 0;font-size:14px;">Passez au plan payant pour continuer sans interruption.</p>
        </div>
      </div>
      <p>Pendant votre essai, vous avez eu acc&egrave;s &agrave; toutes les fonctionnalit&eacute;s de PsyLib :</p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;">&#10003; Gestion compl&egrave;te des patients<br/>
        &#10003; Notes de s&eacute;ance avec autosave<br/>
        &#10003; R&eacute;sum&eacute;s IA intelligents<br/>
        &#10003; Messagerie s&eacute;curis&eacute;e<br/>
        &#10003; Facturation automatique</p>
      </div>
      <p>Passez au plan Starter d&egrave;s <strong>29,99&euro;/mois</strong> pour continuer.</p>
      <a href="${data.billingUrl}" class="btn">Choisir mon plan</a>`,
    );
    await this.send(to, `Plus que ${data.daysLeft} jours d'essai PsyLib`, html, 'sendPostTrialDay1');
  }

  async sendPostTrialDay3(
    to: string,
    data: { psychologistName: string; billingUrl: string },
  ): Promise<void> {
    const html = emailLayout(
      'Ce que nos psychologues en disent',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <p>Plus de <strong>500 psychologues lib&eacute;raux</strong> ont choisi PsyLib pour simplifier leur quotidien.</p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;font-style:italic;">&laquo; PsyLib m'a fait gagner 5h par semaine sur l'administratif. Les r&eacute;sum&eacute;s IA sont bluffants. &raquo;</p>
        <p style="margin:8px 0 0;font-size:13px;color:#6B7280;">&mdash; Dr. Marie L., psychologue clinicienne</p>
      </div>
      <div class="info-box">
        <p style="margin:0;font-size:15px;font-style:italic;">&laquo; Enfin une solution pens&eacute;e pour nous. Le portail patient a transform&eacute; le suivi. &raquo;</p>
        <p style="margin:8px 0 0;font-size:13px;color:#6B7280;">&mdash; Thomas R., TCC lib&eacute;ral</p>
      </div>
      <p>Rejoignez-les et s&eacute;curisez votre pratique avec un outil conforme HDS.</p>
      <a href="${data.billingUrl}" class="btn">Voir les plans</a>`,
    );
    await this.send(to, 'Ce que les psychologues pensent de PsyLib', html, 'sendPostTrialDay3');
  }

  async sendPostTrialDay5(
    to: string,
    data: { psychologistName: string; billingUrl: string },
  ): Promise<void> {
    const html = emailLayout(
      'Top 3 des fonctionnalités que vous perdrez',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <p>Votre essai gratuit est presque termin&eacute;. Voici ce que vous perdrez sans abonnement :</p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;"><strong>1. R&eacute;sum&eacute;s IA de s&eacute;ance</strong><br/>
        Plus de r&eacute;sum&eacute;s automatiques structur&eacute;s &agrave; partir de vos notes.</p>
      </div>
      <div class="info-box">
        <p style="margin:0;font-size:15px;"><strong>2. Portail patient</strong><br/>
        Vos patients n'auront plus acc&egrave;s au suivi d'humeur, exercices et journal.</p>
      </div>
      <div class="info-box">
        <p style="margin:0;font-size:15px;"><strong>3. Messagerie s&eacute;curis&eacute;e</strong><br/>
        Plus d'&eacute;changes chiffr&eacute;s avec vos patients entre les s&eacute;ances.</p>
      </div>
      <p>Conservez tout &agrave; partir de <strong>29,99&euro;/mois</strong> &mdash; sans engagement.</p>
      <a href="${data.billingUrl}" class="btn">Garder mes fonctionnalit&eacute;s</a>`,
    );
    await this.send(to, 'Ce que vous perdrez sans abonnement PsyLib', html, 'sendPostTrialDay5');
  }

  async sendPostTrialDay10(
    to: string,
    data: { psychologistName: string; billingUrl: string },
  ): Promise<void> {
    const html = emailLayout(
      'Vos questions sur les tarifs',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <p>Vous h&eacute;sitez encore ? Voici les questions les plus fr&eacute;quentes :</p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;"><strong>C'est d&eacute;ductible fiscalement ?</strong><br/>
        Oui ! PsyLib est un outil professionnel, 100% d&eacute;ductible de vos charges BNC.</p>
      </div>
      <div class="info-box">
        <p style="margin:0;font-size:15px;"><strong>Mes donn&eacute;es sont-elles en s&eacute;curit&eacute; ?</strong><br/>
        H&eacute;bergement HDS certifi&eacute; en France, chiffrement AES-256, conforme RGPD.</p>
      </div>
      <div class="info-box">
        <p style="margin:0;font-size:15px;"><strong>Puis-je annuler &agrave; tout moment ?</strong><br/>
        Oui, sans engagement. Annulation en 1 clic depuis votre espace.</p>
      </div>
      <p>Le plan Starter &agrave; <strong>29,99&euro;/mois</strong> revient &agrave; ~1&euro;/jour pour g&eacute;rer tout votre cabinet.</p>
      <a href="${data.billingUrl}" class="btn">D&eacute;marrer maintenant</a>`,
    );
    await this.send(to, 'Vos questions sur PsyLib (FAQ)', html, 'sendPostTrialDay10');
  }

  async sendPostTrialDay14(
    to: string,
    data: { psychologistName: string; billingUrl: string },
  ): Promise<void> {
    const html = emailLayout(
      'Dernière chance',
      `<h1>Bonjour ${data.psychologistName},</h1>
      <div class="alert-box alert-danger">
        <span style="font-size:24px;">&#128680;</span>
        <div>
          <strong>Votre essai gratuit expire aujourd'hui.</strong>
          <p style="margin:4px 0 0;font-size:14px;">Demain, votre acc&egrave;s sera limit&eacute; au plan gratuit (5 patients max, sans IA).</p>
        </div>
      </div>
      <p>Tout ce que vous avez cr&eacute;&eacute; reste sauvegard&eacute;. Mais les fonctionnalit&eacute;s premium seront d&eacute;sactiv&eacute;es.</p>
      <div class="info-box">
        <p style="margin:0;font-size:15px;"><strong>Starter</strong> &mdash; 29,99&euro;/mois (20 patients, IA incluse)<br/>
        <strong>Pro</strong> &mdash; 59,99&euro;/mois (illimit&eacute;, formations)<br/>
        <strong>Clinic</strong> &mdash; 119,99&euro;/mois (multi-praticiens)</p>
      </div>
      <a href="${data.billingUrl}" class="btn">Conserver mon acc&egrave;s</a>
      <p style="font-size:13px;color:#6B7280;margin-top:24px;">Si PsyLib ne vous convient pas, aucun souci. Vos donn&eacute;es restent accessibles sur le plan gratuit.</p>`,
    );
    await this.send(to, 'Dernier jour d\'essai PsyLib', html, 'sendPostTrialDay14');
  }
}
