import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

interface LeadMagnetContent {
  title: string;
  subtitle: string;
  sections: Array<{ heading: string; items: string[] }>;
}

const LEAD_MAGNETS: Record<string, LeadMagnetContent> = {
  'kit-demarrage-cabinet': {
    title: 'Kit de Demarrage Cabinet Psy',
    subtitle: 'Checklist complete pour ouvrir votre cabinet de psychologue liberal',
    sections: [
      {
        heading: '1. Enregistrement ADELI',
        items: [
          'Contacter l\'ARS de votre departement',
          'Fournir diplome (Master 2 Psychologie) + piece d\'identite',
          'Delai moyen : 2 a 4 semaines',
          'Le numero ADELI est obligatoire pour exercer et facturer',
          'A apposer sur toutes vos factures et documents officiels',
        ],
      },
      {
        heading: '2. Assurance RC Professionnelle',
        items: [
          'Obligatoire pour tout professionnel de sante liberal',
          'Tarif moyen : 150 a 300 EUR/an selon les garanties',
          'Assureurs specialises : MACSF, GPM, Agipi',
          'Verifier la couverture : teleconsultation, supervision de groupe',
          'Demander une attestation pour affichage en cabinet',
        ],
      },
      {
        heading: '3. Choix du local',
        items: [
          'Bail professionnel ou mixte (habitation + profession liberale)',
          'Accessibilite PMR obligatoire (ERP 5e categorie)',
          'Isolation phonique renforcee (confidentialite des echanges)',
          'Salle d\'attente separee de l\'espace de consultation',
          'Budget moyen Paris : 500-1200 EUR/mois ; Province : 300-700 EUR/mois',
        ],
      },
      {
        heading: '4. Declaration URSSAF',
        items: [
          'S\'inscrire sur guichet-entreprises.fr ou autoentrepreneur.urssaf.fr',
          'Code APE : 86.90F (Activite de psychologue)',
          'Regime fiscal : BNC (Benefices Non Commerciaux)',
          'Cotisations sociales : environ 22% du CA (micro-BNC) ou reel',
          'Declaration trimestrielle ou mensuelle selon le regime',
        ],
      },
      {
        heading: '5. Logiciel de gestion HDS',
        items: [
          'Obligatoire : hebergement certifie HDS pour les donnees patients',
          'Fonctionnalites cles : dossiers patients, notes, facturation, agenda',
          'PsyLib : plateforme tout-en-un conforme HDS (essai 14 jours gratuit)',
          'Eviter les solutions non-conformes : Google Docs, Excel, Notion',
          'Verifier le chiffrement des donnees au repos et en transit',
        ],
      },
      {
        heading: '6. Communication et visibilite',
        items: [
          'Creer votre fiche Google Business Profile',
          'S\'inscrire sur les annuaires : Doctolib, MonPsy, PsyLib',
          'Respecter le Code de deontologie (pas de publicite directe)',
          'Site web sobre avec mentions legales et numero ADELI',
          'Reseautage : groupes d\'intervision, associations professionnelles',
        ],
      },
    ],
  },
  'templates-notes-tcc': {
    title: 'Templates Notes Cliniques TCC',
    subtitle: 'Grilles et modeles pour structurer vos notes en therapie cognitive et comportementale',
    sections: [
      {
        heading: '1. Grille de pensees automatiques',
        items: [
          'Situation declenchante : decrire le contexte factuel',
          'Emotion ressentie : nommer et noter l\'intensite (0-100%)',
          'Pensee automatique : la pensee exacte qui traverse l\'esprit',
          'Distorsion cognitive identifiee (ex : catastrophisation, lecture de pensee)',
          'Pensee alternative : reformulation plus equilibree',
          'Resultat emotionnel apres restructuration (0-100%)',
        ],
      },
      {
        heading: '2. Tableau ABC (Ellis)',
        items: [
          'A — Activating event : l\'evenement declencheur objectif',
          'B — Beliefs : les croyances activees (rationnelles vs irrationnelles)',
          'C — Consequences : emotions et comportements resultants',
          'D — Disputation : remise en question des croyances irrationnelles',
          'E — Effect : nouveau ressenti apres disputation',
          'Utiliser en seance et comme exercice inter-seances',
        ],
      },
      {
        heading: '3. Analyse fonctionnelle SECCA',
        items: [
          'S — Situation : contexte spatio-temporel et interpersonnel',
          'E — Emotion : nature et intensite de l\'emotion',
          'C — Cognition : pensees automatiques et schemas actives',
          'C — Comportement : reaction observable du patient',
          'A — Anticipation : consequences attendues et maintien du probleme',
          'Template ideal pour la conceptualisation de cas',
        ],
      },
      {
        heading: '4. Restructuration cognitive',
        items: [
          'Identifier la pensee automatique negative',
          'Evaluer les preuves pour et contre cette pensee',
          'Identifier la distorsion cognitive (liste de Beck)',
          'Formuler une pensee alternative realiste',
          'Evaluer le degre de croyance dans la nouvelle pensee',
          'Planifier une experience comportementale pour tester',
        ],
      },
      {
        heading: '5. Plan de prevention de la rechute',
        items: [
          'Liste des signaux d\'alerte personnels (cognitifs, emotionnels, comportementaux)',
          'Strategies d\'adaptation validees en therapie',
          'Personnes-ressources et numeros utiles',
          'Activites de bien-etre et routine protectrice',
          'Plan d\'action gradue selon l\'intensite des signaux',
          'Date de seance de suivi prevue',
        ],
      },
      {
        heading: '6. Notes de seance structurees (format SOAP)',
        items: [
          'S (Subjectif) : verbatim du patient, plaintes, ressenti exprime',
          'O (Objectif) : observations cliniques, scores PHQ-9/GAD-7, comportement',
          'A (Analyse) : conceptualisation, hypotheses, evolution',
          'P (Plan) : objectifs de la prochaine seance, exercices, ajustements',
        ],
      },
    ],
  },
  'guide-tarifs-facturation': {
    title: 'Guide Tarifs et Facturation Psychologue',
    subtitle: 'Tarifs moyens, TVA, URSSAF et modele de facture pour psychologues liberaux',
    sections: [
      {
        heading: '1. Tarifs moyens en France (2026)',
        items: [
          'Consultation individuelle (45-60 min) : 50 a 80 EUR',
          'Paris et grandes metropoles : 70 a 120 EUR',
          'Therapie de groupe : 25 a 45 EUR par participant',
          'Teleconsultation : generalement meme tarif que presentiel',
          'Bilan psychologique : 200 a 500 EUR (selon la complexite)',
          'Supervision individuelle : 80 a 120 EUR/heure',
        ],
      },
      {
        heading: '2. Exoneration TVA — Article 261-4-1 du CGI',
        items: [
          'Les psychologues sont exoneres de TVA sur les actes de soins',
          'Condition : etre titulaire du titre de psychologue (diplome + ADELI)',
          'Mention obligatoire sur facture : "TVA non applicable, art. 261-4-1 du CGI"',
          'Les formations et supervisions sont egalement exonerees',
          'Pas de declaration de TVA ni de numero de TVA intracommunautaire',
          'Exception : activites de conseil en entreprise (soumises a TVA)',
        ],
      },
      {
        heading: '3. Obligations URSSAF',
        items: [
          'Declaration des revenus : mensuelle ou trimestrielle',
          'Micro-BNC : taux de cotisation environ 22% du CA',
          'Regime reel (declaration controlee) : charges reelles deductibles',
          'Seuil micro-BNC : 77 700 EUR de CA annuel (2026)',
          'CFP (Contribution Formation Professionnelle) : 0,20% du CA',
          'Possibilite d\'opter pour le versement liberatoire (impot sur le revenu)',
        ],
      },
      {
        heading: '4. Mentions obligatoires sur facture',
        items: [
          'Nom, prenom et adresse du psychologue',
          'Numero ADELI',
          'Numero SIRET',
          'Nom et prenom du patient',
          'Date de la consultation',
          'Nature de la prestation (consultation, bilan, etc.)',
          'Montant TTC et mention TVA non applicable',
          'Mode de reglement (cheque, CB, especes, virement)',
        ],
      },
      {
        heading: '5. Remboursement et dispositif MonPsy',
        items: [
          'Dispositif MonPsy : 8 seances remboursees par an (sur adressage medecin)',
          'Tarif conventionnel MonPsy : 50 EUR (1ere seance) puis 40 EUR',
          'Remboursement Secu : 60%, le reste par la mutuelle',
          'Hors MonPsy : seances non remboursees par la Securite sociale',
          'Certaines mutuelles proposent des forfaits psy (50 a 300 EUR/an)',
          'Fournir un recu/facture au patient pour sa mutuelle',
        ],
      },
      {
        heading: '6. Outils de facturation',
        items: [
          'Logiciel conforme HDS obligatoire pour les donnees patients',
          'PsyLib : facturation PDF automatique, conforme Art. 261 (essai gratuit)',
          'Conserver les factures 10 ans (obligation legale)',
          'Numerotation sequentielle obligatoire (PSY-2026-001, PSY-2026-002...)',
          'Export comptable recommande pour le bilan annuel',
          'Envoyer les factures par email securise (pas de WhatsApp/SMS)',
        ],
      },
    ],
  },
};

@Injectable()
export class LeadMagnetPdfService {
  generatePdf(slug: string): Promise<Buffer> {
    const content = LEAD_MAGNETS[slug];
    if (!content) {
      throw new Error(`Unknown lead magnet slug: ${slug}`);
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.buildPdf(doc, content);
      doc.end();
    });
  }

  private buildPdf(doc: PDFKit.PDFDocument, content: LeadMagnetContent): void {
    const PRIMARY = '#3D52A0';
    const TEXT = '#1E1B4B';
    const LIGHT = '#7B9CDA';
    const MARGIN = 50;
    const PAGE_WIDTH = 595.28;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

    // Header
    doc
      .fontSize(24)
      .fillColor(PRIMARY)
      .font('Helvetica-Bold')
      .text('PsyLib', MARGIN, MARGIN);

    doc
      .fontSize(10)
      .fillColor(LIGHT)
      .font('Helvetica')
      .text('Plateforme de gestion cabinet psychologie', MARGIN, MARGIN + 28);

    // Separator
    doc
      .moveTo(MARGIN, MARGIN + 50)
      .lineTo(PAGE_WIDTH - MARGIN, MARGIN + 50)
      .strokeColor(LIGHT)
      .lineWidth(1)
      .stroke();

    // Title
    doc
      .fontSize(20)
      .fillColor(PRIMARY)
      .font('Helvetica-Bold')
      .text(content.title, MARGIN, MARGIN + 65, { width: CONTENT_WIDTH });

    doc
      .fontSize(12)
      .fillColor(TEXT)
      .font('Helvetica')
      .text(content.subtitle, MARGIN, doc.y + 8, { width: CONTENT_WIDTH });

    doc.moveDown(1.5);

    // Sections
    for (const section of content.sections) {
      // Check if we need a new page
      if (doc.y > 680) {
        doc.addPage();
      }

      doc
        .fontSize(14)
        .fillColor(PRIMARY)
        .font('Helvetica-Bold')
        .text(section.heading, MARGIN, doc.y, { width: CONTENT_WIDTH });

      doc.moveDown(0.5);

      for (const item of section.items) {
        if (doc.y > 720) {
          doc.addPage();
        }

        doc
          .fontSize(10)
          .fillColor(TEXT)
          .font('Helvetica')
          .text(`  •  ${item}`, MARGIN + 10, doc.y, {
            width: CONTENT_WIDTH - 10,
          });

        doc.moveDown(0.3);
      }

      doc.moveDown(1);
    }

    // CTA section
    if (doc.y > 650) {
      doc.addPage();
    }

    doc
      .moveTo(MARGIN, doc.y)
      .lineTo(PAGE_WIDTH - MARGIN, doc.y)
      .strokeColor(LIGHT)
      .lineWidth(0.5)
      .stroke();

    doc.moveDown(1);

    doc
      .rect(MARGIN, doc.y, CONTENT_WIDTH, 60)
      .fillColor('#F1F0F9')
      .fill();

    const ctaY = doc.y + 12;
    doc
      .fontSize(12)
      .fillColor(PRIMARY)
      .font('Helvetica-Bold')
      .text('Gerez votre cabinet avec PsyLib', MARGIN + 15, ctaY, {
        width: CONTENT_WIDTH - 30,
      });

    doc
      .fontSize(10)
      .fillColor(TEXT)
      .font('Helvetica')
      .text(
        'Essai gratuit 14 jours — sans carte bancaire. Rendez-vous sur psylib.eu',
        MARGIN + 15,
        ctaY + 18,
        { width: CONTENT_WIDTH - 30 },
      );

    // Footer
    const footerY = 780;
    doc
      .moveTo(MARGIN, footerY)
      .lineTo(PAGE_WIDTH - MARGIN, footerY)
      .strokeColor(LIGHT)
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(8)
      .fillColor(LIGHT)
      .font('Helvetica')
      .text(
        'PsyLib — psylib.eu — Donnees hebergees en France (HDS conforme)',
        MARGIN,
        footerY + 8,
        { width: CONTENT_WIDTH, align: 'center' },
      );
  }
}
