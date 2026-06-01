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
