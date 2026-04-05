#!/usr/bin/env tsx
/**
 * Script d'extraction des psychologues libéraux depuis le RPPS (ex-ADELI)
 *
 * Source : https://annuaire.sante.fr/web/site-pro/extractions-publiques
 *          (ou data.gouv.fr — "Annuaire santé extractions des données en libre accès")
 *
 * USAGE
 * -----
 * 1. Télécharger manuellement le fichier RPPS (Personne + activité) depuis :
 *    https://annuaire.sante.fr/web/site-pro/extractions-publiques
 *    Format : ZIP contenant un fichier .txt pipe-delimited (|)
 *
 * 2. Dézipper le fichier dans ./tmp/rpps/
 *
 * 3. Lancer le script :
 *    pnpm tsx scripts/extract-rpps-psys.ts ./tmp/rpps/PS_LibreAcces_Personne_activite_*.txt
 *
 * 4. Output : ./tmp/psychologues-liberaux.csv
 *
 * RÉGLEMENTATION
 * --------------
 * - Le RPPS est en open data (licence Etalab 2.0) = utilisation libre
 * - Les données exportées sont publiques (nom, prénom, ville, profession)
 * - MAIS : enrichissement email + envoi cold email soumis à RGPD/CNIL
 * - Utiliser uniquement l'email professionnel cabinet (affiché publiquement)
 * - Conforme CNIL B2B : intérêt légitime + lien désabonnement obligatoire
 *
 * STRUCTURE DU FICHIER SOURCE
 * ---------------------------
 * Colonnes (pipe-delimited, ordre approximatif) :
 * 0.  Type d'identifiant (1=RPPS, 8=ADELI)
 * 1.  Identifiant PP (RPPS ou ADELI)
 * 2.  Identification nationale PP
 * 3.  Code civilité d'exercice
 * 4.  Libellé civilité d'exercice
 * 5.  Code civilité
 * 6.  Libellé civilité
 * 7.  Nom d'exercice
 * 8.  Prénom d'exercice
 * 9.  Code profession
 * 10. Libellé profession
 * 11. Code catégorie professionnelle
 * 12. Libellé catégorie professionnelle
 * 13. Code type savoir-faire
 * 14. Libellé type savoir-faire
 * 15. Code savoir-faire
 * 16. Libellé savoir-faire
 * 17. Code mode exercice
 * 18. Libellé mode exercice ← "Libéral" vs "Salarié" vs "Autre"
 * ... (nombreuses colonnes d'adresse activité)
 *
 * CODES PROFESSIONS CIBLES
 * ------------------------
 * 93 = Psychologue
 *
 * Note : les psychologues sont majoritairement en ADELI (8), pas RPPS (1)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

// ============================================================================
// Configuration
// ============================================================================

const PROFESSION_CODE_PSYCHOLOGUE = '93';
const MODE_EXERCICE_LIBERAL_KEYWORDS = ['libéral', 'liberal', 'libérale', 'lib,', 'lib.', 'indép'];

interface Psychologue {
  identifiant: string;
  civilite: string;
  nom: string;
  prenom: string;
  profession: string;
  modeExercice: string;
  ville: string;
  codePostal: string;
  departement: string;
  telephone: string;
  email: string;
}

// ============================================================================
// Utilities
// ============================================================================

function normalizeText(text: string | undefined): string {
  if (!text) return '';
  return text.trim();
}

function extractDepartement(codePostal: string): string {
  if (!codePostal || codePostal.length < 2) return '';
  // Corse : 2A/2B
  if (codePostal.startsWith('20')) {
    const num = parseInt(codePostal.slice(2, 3), 10);
    return num <= 1 ? '2A' : '2B';
  }
  // DOM-TOM
  if (codePostal.startsWith('97')) return codePostal.slice(0, 3);
  return codePostal.slice(0, 2);
}

function detectFieldIndices(headerLine: string): {
  identifiant: number;
  civilite: number;
  nom: number;
  prenom: number;
  codeProfession: number;
  libelleProfession: number;
  libelleModeExercice: number;
  codePostalActivite: number;
  communeActivite: number;
  telephoneActivite: number;
  emailActivite: number;
} {
  const headers = headerLine.split('|').map((h) => h.trim().toLowerCase());

  const find = (patterns: string[]): number => {
    // First pass : exact match
    for (const pattern of patterns) {
      const idx = headers.findIndex((h) => h === pattern.toLowerCase());
      if (idx >= 0) return idx;
    }
    // Second pass : includes (but skip if header starts with "type d'")
    for (const pattern of patterns) {
      const idx = headers.findIndex(
        (h) => h.includes(pattern.toLowerCase()) && !h.startsWith("type d'"),
      );
      if (idx >= 0) return idx;
    }
    return -1;
  };

  return {
    identifiant: find(['identifiant pp', 'identification nationale pp']),
    civilite: find(["libellé civilité d'exercice", 'libelle civilite exercice']),
    nom: find(["nom d'exercice", 'nom exercice']),
    prenom: find(["prénom d'exercice", 'prenom exercice']),
    codeProfession: find(['code profession']),
    libelleProfession: find(['libellé profession', 'libelle profession']),
    libelleModeExercice: find(['libellé mode exercice', 'libelle mode exercice', 'mode exercice']),
    codePostalActivite: find(["code postal (coord. structure)", 'code postal structure', 'code postal']),
    communeActivite: find(['libellé commune', 'libelle commune', 'commune']),
    telephoneActivite: find(['téléphone', 'telephone']),
    emailActivite: find(['adresse e-mail', 'adresse bal', 'e-mail', 'email', 'courriel']),
  };
}

function toCsvField(value: string): string {
  const cleaned = value.replace(/"/g, '""');
  if (cleaned.includes(',') || cleaned.includes('"') || cleaned.includes('\n')) {
    return `"${cleaned}"`;
  }
  return cleaned;
}

// ============================================================================
// Main extraction logic
// ============================================================================

async function extractPsychologues(inputPath: string, outputPath: string): Promise<void> {
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Fichier introuvable : ${inputPath}`);
    process.exit(1);
  }

  console.log(`📂 Lecture du fichier : ${inputPath}`);
  console.log(`   Taille : ${(fs.statSync(inputPath).size / 1024 / 1024).toFixed(2)} MB`);

  const fileStream = fs.createReadStream(inputPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;
  let indices: ReturnType<typeof detectFieldIndices> | null = null;
  let totalProfessionnels = 0;
  let psychologuesLiberaux = 0;
  const results: Psychologue[] = [];

  for await (const line of rl) {
    lineNumber++;

    if (lineNumber === 1) {
      // Header line
      indices = detectFieldIndices(line);
      console.log('📊 Colonnes détectées :');
      console.log(`   identifiant: col ${indices.identifiant}`);
      console.log(`   nom/prenom: col ${indices.nom}/${indices.prenom}`);
      console.log(`   profession: col ${indices.codeProfession} (${indices.libelleProfession})`);
      console.log(`   mode exercice: col ${indices.libelleModeExercice}`);
      console.log(`   commune: col ${indices.communeActivite}`);
      console.log(`   CP: col ${indices.codePostalActivite}`);
      continue;
    }

    if (!indices) continue;

    const fields = line.split('|');
    totalProfessionnels++;

    // Filter : profession = psychologue (code 93)
    const codeProfession = normalizeText(fields[indices.codeProfession]);
    if (codeProfession !== PROFESSION_CODE_PSYCHOLOGUE) continue;

    // Filter : mode exercice = libéral
    const modeExercice = normalizeText(fields[indices.libelleModeExercice]).toLowerCase();
    const isLiberal = MODE_EXERCICE_LIBERAL_KEYWORDS.some((kw) => modeExercice.includes(kw));
    if (!isLiberal) continue;

    psychologuesLiberaux++;

    const codePostal = normalizeText(fields[indices.codePostalActivite]);
    const psy: Psychologue = {
      identifiant: normalizeText(fields[indices.identifiant]),
      civilite: normalizeText(fields[indices.civilite]),
      nom: normalizeText(fields[indices.nom]),
      prenom: normalizeText(fields[indices.prenom]),
      profession: normalizeText(fields[indices.libelleProfession]),
      modeExercice: normalizeText(fields[indices.libelleModeExercice]),
      ville: normalizeText(fields[indices.communeActivite]),
      codePostal,
      departement: extractDepartement(codePostal),
      telephone: normalizeText(fields[indices.telephoneActivite]),
      email: normalizeText(fields[indices.emailActivite]),
    };

    // Dedup par identifiant (un psy peut avoir plusieurs lignes si plusieurs adresses)
    if (!results.find((r) => r.identifiant === psy.identifiant)) {
      results.push(psy);
    }

    if (lineNumber % 100000 === 0) {
      console.log(`   ... ${lineNumber} lignes lues, ${psychologuesLiberaux} psys libéraux trouvés`);
    }
  }

  console.log('\n✅ Extraction terminée');
  console.log(`   Total lignes professionnels : ${totalProfessionnels.toLocaleString('fr-FR')}`);
  console.log(`   Psychologues libéraux trouvés : ${psychologuesLiberaux.toLocaleString('fr-FR')}`);
  console.log(`   Psychologues uniques (dédup) : ${results.length.toLocaleString('fr-FR')}`);

  // Breakdown by departement
  const byDept = new Map<string, number>();
  results.forEach((p) => {
    const count = byDept.get(p.departement) || 0;
    byDept.set(p.departement, count + 1);
  });
  const topDepts = Array.from(byDept.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log('\n📍 Top 10 départements :');
  topDepts.forEach(([dept, count]) => {
    console.log(`   ${dept} : ${count} psys`);
  });

  // Breakdown email
  const withEmail = results.filter((p) => p.email && p.email.includes('@')).length;
  console.log(`\n📧 Psys avec email direct : ${withEmail} / ${results.length} (${((withEmail / results.length) * 100).toFixed(1)}%)`);
  console.log('   → Pour les autres : enrichissement via Hunter.io, Dropcontact ou recherche manuelle');

  // Write CSV
  const csvHeader = [
    'identifiant',
    'civilite',
    'nom',
    'prenom',
    'profession',
    'modeExercice',
    'ville',
    'codePostal',
    'departement',
    'telephone',
    'email',
  ].join(',');

  const csvRows = results.map((p) =>
    [
      p.identifiant,
      p.civilite,
      p.nom,
      p.prenom,
      p.profession,
      p.modeExercice,
      p.ville,
      p.codePostal,
      p.departement,
      p.telephone,
      p.email,
    ]
      .map(toCsvField)
      .join(','),
  );

  const csv = [csvHeader, ...csvRows].join('\n');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, csv, 'utf-8');

  console.log(`\n💾 Fichier CSV écrit : ${outputPath}`);
  console.log(`   Taille : ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);

  // Write Brevo-ready segment (only psys with email)
  const brevoCsv = [
    'EMAIL,FIRSTNAME,LASTNAME,CITY,DEPARTEMENT,PHONE,SOURCE',
    ...results
      .filter((p) => p.email && p.email.includes('@'))
      .map((p) =>
        [p.email, p.prenom, p.nom, p.ville, p.departement, p.telephone, 'rpps-2026-q2']
          .map(toCsvField)
          .join(','),
      ),
  ].join('\n');

  const brevoPath = outputPath.replace('.csv', '-brevo-ready.csv');
  fs.writeFileSync(brevoPath, brevoCsv, 'utf-8');
  console.log(`\n📤 Fichier Brevo-ready (avec email) : ${brevoPath}`);
  console.log(`   Import direct dans Brevo → liste "Prospects Psychologues Cold 2026-Q2"`);
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage : pnpm tsx scripts/extract-rpps-psys.ts <input-file> [output-file]

Arguments :
  input-file    Chemin vers le fichier RPPS téléchargé (.txt pipe-delimited)
  output-file   (optionnel) CSV de sortie. Défaut : ./tmp/psychologues-liberaux.csv

Exemple :
  pnpm tsx scripts/extract-rpps-psys.ts ./tmp/rpps/PS_LibreAcces_Personne_activite_202604050000.txt

Télécharger le fichier source :
  https://annuaire.sante.fr/web/site-pro/extractions-publiques
  (fichier : PS_LibreAcces_Personne_activite — ZIP ~200 MB)
    `);
    process.exit(1);
  }

  const inputPath = args[0]!;
  const outputPath = args[1] ?? './tmp/psychologues-liberaux.csv';

  await extractPsychologues(inputPath, outputPath);
}

main().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
