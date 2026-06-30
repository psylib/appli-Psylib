import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Résultat de la vérification d'un numéro ADELI/RPPS contre l'annuaire
 * officiel des professionnels de santé (API FHIR de l'Agence du Numérique
 * en Santé — https://gateway.api.esante.gouv.fr/fhir/v2).
 */
export type RppsVerificationStatus =
  | 'verified' // numéro trouvé, profession = psychologue
  | 'invalid_format' // ni 9 (ADELI) ni 11 (RPPS) chiffres
  | 'obvious_fake' // suite/répétition évidente (123456789, 111111111…)
  | 'not_found' // aucun professionnel avec ce numéro
  | 'not_psychologist' // numéro trouvé mais profession ≠ psychologue
  | 'api_unavailable'; // clé absente / API injoignable → dégradation gracieuse

export interface RppsVerificationResult {
  /** true uniquement si on a la certitude que le compte peut être créé. */
  ok: boolean;
  /** true si la vérification doit BLOQUER la création du compte. */
  blocking: boolean;
  status: RppsVerificationStatus;
  /** Nom du professionnel tel qu'enregistré (si trouvé). */
  matchedName?: string;
  /** Message lisible (FR) à renvoyer au front en cas de blocage. */
  message?: string;
}

const ESANTE_DEFAULT_URL =
  'https://gateway.api.esante.gouv.fr/fhir/v2/Practitioner';

// Code "Psychologue" dans la nomenclature TRE-G15-ProfessionSante (RPPS).
const PSYCHOLOGUE_PROFESSION_CODE = '93';

@Injectable()
export class RppsVerificationService {
  private readonly logger = new Logger(RppsVerificationService.name);
  private readonly apiUrl: string;
  private readonly apiKey?: string;
  /** Si true, exiger explicitement la profession « psychologue ». */
  private readonly requirePsychologistProfession: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiUrl = config.get<string>('ESANTE_API_URL') ?? ESANTE_DEFAULT_URL;
    this.apiKey = config.get<string>('ESANTE_API_KEY');
    this.requirePsychologistProfession =
      config.get<string>('RPPS_REQUIRE_PSYCHOLOGIST') !== 'false';
  }

  /**
   * Normalise le numéro : retire espaces et caractères non numériques.
   */
  static normalize(raw: string): string {
    return (raw ?? '').replace(/\D/g, '');
  }

  /**
   * Validation hors-ligne du format. ADELI = 9 chiffres, RPPS = 11 chiffres.
   * (Le faux compte du 2026-06-01 avait 10 chiffres → rejeté ici.)
   */
  static isValidFormat(normalized: string): boolean {
    return normalized.length === 9 || normalized.length === 11;
  }

  /**
   * Détecte un numéro manifestement bidon : tous les chiffres identiques
   * (111111111) ou suite arithmétique de pas ±1 modulo 10, ascendante ou
   * descendante (123456789, 987654321, 12345678901, 0123456789…).
   *
   * Objectif : bloquer les inscriptions de test/bots MÊME quand l'annuaire ANS
   * est indisponible (sinon la dégradation gracieuse les laisse passer). Un vrai
   * RPPS porte une clé de Luhn → la probabilité qu'il soit une suite parfaite est
   * négligeable, et un tel cas serait de toute façon rattrapé en revue manuelle.
   */
  static isObviousFake(normalized: string): boolean {
    if (normalized.length < 2) return false;
    const d = [...normalized].map(Number);

    const allSame = d.every((x) => x === d[0]);
    if (allSame) return true;

    const isRun = (step: number) =>
      d.every((x, i) => i === 0 || x === (d[i - 1]! + step + 10) % 10);

    return isRun(1) || isRun(-1);
  }

  /**
   * Normalise un nom pour comparaison : minuscules, accents retirés, tirets et
   * apostrophes → espaces, ponctuation supprimée, tokens dédupliqués.
   */
  private static nameTokens(raw: string): string[] {
    return (raw ?? '')
      .normalize('NFD')
      // U+0300–U+036F = marques diacritiques combinantes (accents) retirées
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[-'’]/g, ' ') // tirets + apostrophes (droite/typographique)
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean); // garde les initiales (« J. Bernard » à l'annuaire)
  }

  /**
   * Compare le nom saisi à l'inscription au nom enregistré à l'annuaire officiel.
   *
   * Objectif : démasquer une usurpation (numéro volé d'un autre psychologue) sans
   * bloquer à tort des cas légitimes (nom marital, nom composé, ordre prénom/nom).
   * On exige donc une correspondance SOUPLE :
   *   - le nom de famille saisi est présent dans le nom annuaire, ET
   *   - le prénom saisi est présent (ou partage son initiale avec un token annuaire).
   * En cas de doute → renvoie false → le compte passe en revue manuelle (pas un
   * rejet sec). Un voleur qui met SON nom avec le numéro d'un AUTRE échoue ici.
   */
  static namesMatch(
    firstName: string,
    lastName: string,
    annuaireName?: string,
  ): boolean {
    if (!annuaireName) return false;

    const annuaire = new Set(RppsVerificationService.nameTokens(annuaireName));
    if (annuaire.size === 0) return false;

    // Tokens « pleins » (≥ 2 lettres) saisis. Le DTO impose MinLength(2) sur
    // prénom/nom, donc on n'a jamais d'initiale côté saisie.
    const first = RppsVerificationService.nameTokens(firstName).filter(
      (t) => t.length > 1,
    );
    const last = RppsVerificationService.nameTokens(lastName).filter(
      (t) => t.length > 1,
    );
    if (first.length === 0 || last.length === 0) return false;

    const has = (t: string) => annuaire.has(t);
    // Annuaire abrégé « J. Bernard » → token 'j' présent : on tolère que
    // l'initiale du prénom saisi corresponde à un token mono-lettre annuaire.
    const matchesAbbrev = (t: string) => annuaire.has(t[0]!);

    // Au moins un token du nom de famille doit matcher exactement l'annuaire.
    const lastMatch = last.some(has);
    // Le prénom : match exact, ou correspondance avec une initiale annuaire.
    const firstMatch = first.some((t) => has(t) || matchesAbbrev(t));

    return lastMatch && firstMatch;
  }

  /**
   * Vérifie un numéro ADELI/RPPS. Stratégie :
   *  1. Format invalide → blocage immédiat (offline, toujours actif).
   *  2. Pas de clé API / API injoignable → dégradation : on laisse passer
   *     mais on signale (`api_unavailable`) pour revue manuelle.
   *  3. API OK : numéro introuvable ou non-psychologue → blocage.
   */
  async verify(raw: string): Promise<RppsVerificationResult> {
    const number = RppsVerificationService.normalize(raw);

    if (!RppsVerificationService.isValidFormat(number)) {
      return {
        ok: false,
        blocking: true,
        status: 'invalid_format',
        message:
          'Numéro ADELI (9 chiffres) ou RPPS (11 chiffres) invalide. Vérifiez votre numéro.',
      };
    }

    // Numéro manifestement bidon (suite/répétition) → blocage hors-ligne, même
    // si l'annuaire ANS est indisponible. Stoppe les inscriptions de test/bots.
    if (RppsVerificationService.isObviousFake(number)) {
      return {
        ok: false,
        blocking: true,
        status: 'obvious_fake',
        message:
          'Ce numéro ADELI/RPPS est invalide. Vérifiez votre numéro sur votre carte CPS.',
      };
    }

    // Pas de clé configurée → on ne bloque pas (éviter de perdre des
    // inscriptions légitimes), mais on signale pour vérification manuelle.
    if (!this.apiKey) {
      this.logger.warn(
        'ESANTE_API_KEY absente — vérification annuaire désactivée (format seul).',
      );
      return { ok: true, blocking: false, status: 'api_unavailable' };
    }

    try {
      const url = `${this.apiUrl}?identifier=${encodeURIComponent(number)}&_count=5`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        headers: {
          'ESANTE-API-KEY': this.apiKey,
          Accept: 'application/fhir+json',
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        this.logger.warn(`Annuaire Santé API status ${res.status}`);
        // API en erreur → dégradation gracieuse, ne pas bloquer.
        return { ok: true, blocking: false, status: 'api_unavailable' };
      }

      const bundle = (await res.json()) as FhirBundle;
      const entries = bundle?.entry ?? [];

      if (!bundle || bundle.total === 0 || entries.length === 0) {
        return {
          ok: false,
          blocking: true,
          status: 'not_found',
          message:
            "Ce numéro ADELI/RPPS n'a pas été trouvé dans l'annuaire officiel des professionnels de santé.",
        };
      }

      const practitioner = entries[0]?.resource;
      const matchedName = this.extractName(practitioner);

      if (this.requirePsychologistProfession) {
        const isPsy = entries.some((e) => this.isPsychologist(e?.resource));
        if (!isPsy) {
          return {
            ok: false,
            blocking: true,
            status: 'not_psychologist',
            matchedName,
            message:
              "Ce numéro correspond bien à un professionnel de santé, mais pas à un psychologue. L'accès à PsyLib est réservé aux psychologues.",
          };
        }
      }

      return { ok: true, blocking: false, status: 'verified', matchedName };
    } catch (err) {
      const aborted = (err as Error)?.name === 'AbortError';
      this.logger.warn(
        `Vérification annuaire échouée (${aborted ? 'timeout' : (err as Error).message}) — dégradation gracieuse.`,
      );
      return { ok: true, blocking: false, status: 'api_unavailable' };
    }
  }

  /** Détecte la profession « psychologue » dans une ressource Practitioner. */
  private isPsychologist(p?: FhirPractitioner): boolean {
    if (!p) return false;
    const codings = (p.qualification ?? [])
      .flatMap((q) => q.code?.coding ?? [])
      .filter(Boolean);

    for (const c of codings) {
      if (c.code === PSYCHOLOGUE_PROFESSION_CODE) return true;
      const text = `${c.display ?? ''} ${c.code ?? ''}`.toLowerCase();
      if (text.includes('psycholog')) return true;
    }
    return false;
  }

  private extractName(p?: FhirPractitioner): string | undefined {
    const n = p?.name?.[0];
    if (!n) return undefined;
    const given = (n.given ?? []).join(' ');
    return [given, n.family].filter(Boolean).join(' ').trim() || n.text;
  }
}

// ── Types FHIR minimaux (sous-ensemble utilisé) ────────────────────
interface FhirCoding {
  system?: string;
  code?: string;
  display?: string;
}
interface FhirQualification {
  code?: { coding?: FhirCoding[]; text?: string };
}
interface FhirHumanName {
  text?: string;
  family?: string;
  given?: string[];
}
interface FhirPractitioner {
  resourceType?: string;
  name?: FhirHumanName[];
  qualification?: FhirQualification[];
}
interface FhirBundle {
  total?: number;
  entry?: { resource?: FhirPractitioner }[];
}
