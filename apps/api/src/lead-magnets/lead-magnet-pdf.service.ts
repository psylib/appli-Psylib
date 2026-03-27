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
  'guide-rgpd-hds': {
    title: 'Guide RGPD & HDS pour Psychologues Liberaux',
    subtitle: 'Tout ce que vous devez savoir pour proteger les donnees de vos patients et etre en conformite avec la loi',
    sections: [
      {
        heading: 'Chapitre 1 — Pourquoi vos donnees patients sont des donnees de sante',
        items: [
          'Definition legale : l\'article L.1111-8 du Code de la sante publique qualifie de "donnees de sante" toute information relative a la sante physique ou mentale d\'une personne',
          'Les notes de seance, diagnostics, comptes-rendus, scores psychometriques et echanges patient-praticien sont des donnees de sante au sens de la loi',
          'Le simple fait de stocker le nom d\'un patient associe a un rendez-vous chez un psychologue constitue une donnee de sante (jurisprudence CNIL 2023)',
          'Sanctions CNIL : amende administrative jusqu\'a 20 millions d\'euros ou 4% du chiffre d\'affaires annuel mondial (RGPD art. 83)',
          'Sanctions penales : jusqu\'a 5 ans d\'emprisonnement et 300 000 EUR d\'amende pour traitement illicite de donnees de sante (Code penal art. 226-17)',
          'Responsabilite professionnelle : le Code de deontologie des psychologues impose le secret professionnel et la protection des informations confiees',
          'Cas concret : en 2024, un praticien a recu un avertissement CNIL pour stockage de notes cliniques sur Google Drive (hebergement non-HDS)',
        ],
      },
      {
        heading: 'Chapitre 2 — L\'hebergement de donnees de sante (HDS) decrypte',
        items: [
          'La certification HDS est delivree par un organisme accredite COFRAC, selon le referentiel de l\'ANS (Agence du Numerique en Sante)',
          'Deux types de certification : "hebergeur d\'infrastructure physique" et "hebergeur infogéreur" — les deux couvrent des perimetres differents',
          'Un hebergeur HDS garantit : securite physique des datacenters, chiffrement des donnees, tracabilite des acces, plan de continuite d\'activite',
          'Providers certifies HDS en France : OVHcloud, Scaleway, Outscale (Dassault), AWS eu-west-3 Paris (depuis 2022), Azure France Central',
          'ATTENTION : etre heberge chez un provider HDS ne suffit pas — l\'application elle-meme doit implementer le chiffrement et le controle d\'acces',
          'Le Cloud Act americain (2018) permet aux autorites US d\'acceder aux donnees stockees par des entreprises americaines, meme en Europe',
          'Le FISA Section 702 autorise la surveillance des communications de non-citoyens US sans mandat — risque reel pour les donnees patients hebergees chez Google, Microsoft ou Amazon US',
          'Recommandation : privilegier un hebergeur francais ou europeen HDS, ou a minima une region EU d\'un provider certifie HDS',
        ],
      },
      {
        heading: 'Chapitre 3 — Les outils que vous ne devez plus utiliser',
        items: [
          'Google Drive / Google Docs : serveurs hors HDS, soumis au Cloud Act, pas de chiffrement applicatif — ILLEGAL pour les donnees patients',
          'Dropbox : hebergement US (meme Dropbox Business), pas certifie HDS, pas de chiffrement de bout en bout — ILLEGAL',
          'Notion : serveurs US (AWS us-east-1), pas certifie HDS, donnees accessibles en clair par Notion Labs — ILLEGAL',
          'Apple Notes / iCloud : serveurs US et Irlande, pas certifie HDS, chiffrement partiel — ILLEGAL pour notes de seance',
          'WhatsApp / Telegram pour communiquer avec les patients : pas de certification HDS, metadonnees accessibles par Meta/Telegram — ILLEGAL',
          'Excel / Word sur ordinateur personnel : pas de chiffrement, pas d\'audit des acces, risque de perte (vol, panne) — NON CONFORME',
          'Doctolib : conforme HDS pour la prise de RDV, mais NE GERE PAS les notes de seance ni les dossiers patients',
          'Alternatives conformes : utiliser un logiciel metier certifie HDS avec chiffrement applicatif (AES-256) et audit des acces',
        ],
      },
      {
        heading: 'Chapitre 4 — RGPD : vos obligations en tant que psychologue',
        items: [
          'Base legale du traitement : interet legitime (art. 6.1.f RGPD) pour la gestion du cabinet + consentement explicite (art. 9.2.a) pour les donnees de sante',
          'Registre des traitements (art. 30 RGPD) : document obligatoire listant tous les traitements de donnees personnelles — modele inclus ci-dessous',
          'Information des patients (art. 13-14 RGPD) : afficher en cabinet et/ou remettre un document expliquant quelles donnees sont collectees, pourquoi, combien de temps, et les droits du patient',
          'Duree de conservation : notes cliniques 5 ans apres le dernier contact (recommandation CNIL) ; donnees administratives 10 ans (obligation fiscale)',
          'Droit d\'acces (art. 15) : le patient peut demander une copie de toutes ses donnees — delai de reponse : 1 mois maximum',
          'Droit de rectification (art. 16) : corriger les donnees inexactes sur demande du patient',
          'Droit a l\'effacement (art. 17) : supprimer les donnees sur demande, sauf obligation legale de conservation',
          'Droit a la portabilite (art. 20) : fournir les donnees dans un format structure et lisible par machine',
          'Notification de violation (art. 33-34) : en cas de fuite de donnees, notifier la CNIL sous 72h et informer les patients si risque eleve',
          'DPO (Delegue a la Protection des Donnees) : non obligatoire pour un cabinet individuel, mais recommande pour les cabinets de groupe',
        ],
      },
      {
        heading: 'Chapitre 5 — Checklist de mise en conformite (15 points)',
        items: [
          '[ ] 1. Inventorier TOUS les outils ou vous stockez des donnees patients (cloud, local, papier)',
          '[ ] 2. Verifier la certification HDS de chaque outil numerique utilise',
          '[ ] 3. Migrer les donnees patients vers un logiciel certifie HDS avec chiffrement applicatif',
          '[ ] 4. Supprimer definitivement les donnees patients des outils non conformes (Google Drive, Notion, etc.)',
          '[ ] 5. Activer le chiffrement du disque dur de votre ordinateur (BitLocker / FileVault)',
          '[ ] 6. Mettre en place un mot de passe fort + MFA (authentification multi-facteurs) sur tous vos outils',
          '[ ] 7. Rediger et afficher votre politique de confidentialite patient (modele fourni)',
          '[ ] 8. Creer votre registre des traitements RGPD (modele fourni)',
          '[ ] 9. Recueillir le consentement eclaire de chaque patient pour le traitement numerique de ses donnees',
          '[ ] 10. Definir une procedure de reponse aux demandes d\'acces/effacement (delai 1 mois)',
          '[ ] 11. Sauvegarder vos donnees regulierement (backup chiffre, idealement automatique)',
          '[ ] 12. Ne jamais envoyer de donnees patients par email non chiffre, SMS ou messagerie instantanee',
          '[ ] 13. Utiliser un VPN sur les reseaux Wi-Fi publics (cabinet partage, coworking)',
          '[ ] 14. Former vos eventuels collaborateurs aux bonnes pratiques de securite',
          '[ ] 15. Planifier un audit annuel de conformite (auto-evaluation ou accompagnement)',
        ],
      },
      {
        heading: 'Modele — Registre des traitements (extrait)',
        items: [
          'Nom du traitement : Gestion des dossiers patients',
          'Responsable : [Votre nom], psychologue liberal(e), ADELI n° [votre numero]',
          'Finalites : suivi therapeutique, facturation, prise de rendez-vous',
          'Categories de donnees : identite, coordonnees, donnees de sante (notes, diagnostics, scores)',
          'Categories de personnes : patients, anciens patients',
          'Base legale : consentement explicite (art. 9.2.a RGPD)',
          'Destinataires : psychologue uniquement (pas de partage avec des tiers sauf obligation legale)',
          'Transferts hors UE : aucun (hebergement HDS en France)',
          'Duree de conservation : 5 ans apres le dernier contact ; donnees administratives 10 ans',
          'Mesures de securite : hebergement HDS, chiffrement AES-256, MFA, audit des acces',
        ],
      },
      {
        heading: 'Modele — Information patient sur le traitement des donnees',
        items: [
          '[Nom du cabinet] collecte et traite vos donnees personnelles dans le cadre de votre suivi therapeutique',
          'Donnees collectees : identite, coordonnees, antecedents, notes de seance, evaluations psychologiques',
          'Finalite : assurer la qualite et la continuite de votre prise en charge psychologique',
          'Base legale : votre consentement explicite (article 9.2.a du RGPD)',
          'Hebergement : vos donnees sont hebergees en France sur une infrastructure certifiee HDS (Hebergement de Donnees de Sante)',
          'Securite : chiffrement AES-256 des donnees sensibles, authentification multi-facteurs, audit des acces',
          'Duree : vos donnees sont conservees 5 ans apres notre dernier echange, sauf demande de suppression de votre part',
          'Vos droits : acces, rectification, effacement, portabilite, opposition — exercez-les par email a [votre email]',
          'Reclamation : vous pouvez saisir la CNIL (www.cnil.fr) si vous estimez que vos droits ne sont pas respectes',
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
