import { Injectable } from '@nestjs/common';

export interface ScoringResult {
  score: number;
  severity: string;
  description: string;
}

@Injectable()
export class ScoringService {
  scorePhq9(answers: Record<string, number>): ScoringResult {
    const score = Object.values(answers).reduce((sum, v) => sum + v, 0);
    let severity: string;
    let description: string;

    if (score <= 4) { severity = 'minimal'; description = 'Symptômes minimaux'; }
    else if (score <= 9) { severity = 'mild'; description = 'Dépression légère'; }
    else if (score <= 14) { severity = 'moderate'; description = 'Dépression modérée'; }
    else if (score <= 19) { severity = 'moderately_severe'; description = 'Dépression modérément sévère'; }
    else { severity = 'severe'; description = 'Dépression sévère'; }

    return { score, severity, description };
  }

  scoreGad7(answers: Record<string, number>): ScoringResult {
    const score = Object.values(answers).reduce((sum, v) => sum + v, 0);
    let severity: string;
    let description: string;

    if (score <= 4) { severity = 'minimal'; description = 'Anxiété minimale'; }
    else if (score <= 9) { severity = 'mild'; description = 'Anxiété légère'; }
    else if (score <= 14) { severity = 'moderate'; description = 'Anxiété modérée'; }
    else { severity = 'severe'; description = 'Anxiété sévère'; }

    return { score, severity, description };
  }

  scoreCoreOm(answers: Record<string, number>): ScoringResult {
    const values = Object.values(answers);
    const rawScore = values.reduce((sum, v) => sum + v, 0);
    const score = Math.round((rawScore / values.length) * 10);
    let severity: string;
    let description: string;

    if (score <= 5) { severity = 'healthy'; description = 'Bien-être satisfaisant'; }
    else if (score <= 10) { severity = 'low'; description = 'Détresse légère'; }
    else if (score <= 15) { severity = 'moderate'; description = 'Détresse modérée'; }
    else if (score <= 20) { severity = 'moderate_severe'; description = 'Détresse modérément sévère'; }
    else { severity = 'severe'; description = 'Détresse sévère'; }

    return { score, severity, description };
  }

  score(type: string, answers: Record<string, number>): ScoringResult {
    switch (type) {
      case 'PHQ9': return this.scorePhq9(answers);
      case 'GAD7': return this.scoreGad7(answers);
      case 'CORE_OM': return this.scoreCoreOm(answers);
      default: throw new Error(`Unknown assessment type: ${type}`);
    }
  }
}
