'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, ClipboardList, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { patientPortalApi } from '@/lib/api/patient-portal';
import type {
  PendingAssessment,
  CompletedAssessment,
  AssessmentQuestion,
} from '@/lib/api/patient-portal';

type Assessment = PendingAssessment | CompletedAssessment;

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  minimal:           { label: 'Minimal',           color: 'text-green-600' },
  healthy:           { label: 'Satisfaisant',      color: 'text-green-600' },
  mild:              { label: 'Léger',              color: 'text-yellow-600' },
  low:               { label: 'Léger',              color: 'text-yellow-600' },
  moderate:          { label: 'Modéré',             color: 'text-orange-600' },
  moderately_severe: { label: 'Modérément sévère',  color: 'text-red-600' },
  moderate_severe:   { label: 'Modérément sévère',  color: 'text-red-600' },
  severe:            { label: 'Sévère',             color: 'text-red-700' },
};

function LikertQuestion({
  question,
  value,
  onChange,
}: {
  question: AssessmentQuestion;
  value: number | undefined;
  onChange: (id: string, v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{question.text}</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${question.labels.length}, 1fr)` }}>
        {question.labels.map((label, i) => {
          const v = question.minValue + i;
          const selected = value === v;
          return (
            <button
              key={i}
              onClick={() => onChange(question.id, v)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                selected
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40 text-muted-foreground'
              }`}
            >
              <span className={`text-lg font-mono font-semibold ${selected ? 'text-primary' : 'text-foreground'}`}>{v}</span>
              <span className="text-xs leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AssessmentForm({
  assessment,
  token,
  onDone,
}: {
  assessment: PendingAssessment;
  token: string;
  onDone: () => void;
}) {
  const questions = assessment.template.questions;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ score: number; severity: string } | null>(null);

  const current = questions[step];
  const answered = current ? answers[current.id] : undefined;
  const progress = Object.keys(answers).length;

  const submit = async () => {
    setSubmitting(true);
    try {
      const data = await patientPortalApi.submitAssessment(token, assessment.id, answers);
      setResult({ score: data.score, severity: data.severity });
      setDone(true);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  if (done && result) {
    const sev = SEVERITY_LABELS[result.severity] ?? { label: result.severity, color: 'text-gray-600' };
    return (
      <div className="text-center space-y-4 py-6">
        <CheckCircle2 size={48} className="mx-auto text-green-500" />
        <h3 className="text-lg font-semibold text-foreground">Merci, c&apos;est enregistré !</h3>
        <div className="bg-surface rounded-xl p-4 inline-block">
          <div className="text-3xl font-mono font-bold text-primary">{result.score}</div>
          <div className="text-sm text-muted-foreground">/ {assessment.template.maxScore}</div>
          <div className={`text-sm font-medium mt-1 ${sev.color}`}>{sev.label}</div>
        </div>
        <p className="text-sm text-muted-foreground">Votre psychologue pourra voir ces résultats.</p>
        <button onClick={onDone} className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          Terminé
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {step + 1} sur {questions.length}</span>
          <span>{Math.round((progress / questions.length) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(progress / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {current && (
        <LikertQuestion
          question={current}
          value={answered}
          onChange={(id, v) => setAnswers((prev) => ({ ...prev, [id]: v }))}
        />
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-surface transition-colors"
          >
            <ChevronLeft size={16} /> Précédent
          </button>
        )}
        <div className="flex-1" />
        {step < questions.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={answered === undefined}
            className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Suivant <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting || answered === undefined}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Terminer
          </button>
        )}
      </div>
    </div>
  );
}

export function PatientAssessmentsContent() {
  const { data: session } = useSession();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = () => {
    if (!session?.accessToken) return;
    patientPortalApi.getAssessments(session.accessToken)
      .then((data) => setAssessments(data))
      .catch(() => setError('Impossible de charger les questionnaires.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [session]);

  const pending = assessments.filter((a) => a.status === 'pending') as PendingAssessment[];
  const completed = assessments.filter((a) => a.status === 'completed') as CompletedAssessment[];

  const activeAssessment = pending.find((a) => a.id === activeId);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <ClipboardList size={22} className="text-primary" />
          Mes évaluations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Questionnaires envoyés par votre psychologue</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Active form */}
          {activeAssessment && session?.accessToken && (
            <div className="bg-white rounded-2xl border border-primary/30 p-6 shadow-sm">
              <h2 className="font-semibold text-foreground mb-1">{activeAssessment.template.name}</h2>
              {activeAssessment.template.description && (
                <p className="text-sm text-muted-foreground mb-5">{activeAssessment.template.description}</p>
              )}
              <AssessmentForm
                assessment={activeAssessment}
                token={session.accessToken as string}
                onDone={() => { setActiveId(null); load(); }}
              />
            </div>
          )}

          {/* Pending */}
          {!activeAssessment && pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-foreground">À compléter</h2>
              {pending.map((a) => (
                <div key={a.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{a.template.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reçu le {new Date(a.createdAt).toLocaleDateString('fr')}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveId(a.id)}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Commencer
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-foreground">Historique</h2>
              {completed.map((a) => {
                const sev = a.severity ? SEVERITY_LABELS[a.severity] : null;
                return (
                  <div key={a.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{a.template.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.completedAt ? new Date(a.completedAt).toLocaleDateString('fr') : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold text-primary text-lg">
                        {a.score}/{a.template.maxScore}
                      </div>
                      {sev && <div className={`text-xs ${sev.color}`}>{sev.label}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {assessments.length === 0 && (
            <div className="bg-white rounded-xl border border-border p-10 text-center space-y-2">
              <ClipboardList size={32} className="mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucun questionnaire pour l&apos;instant.</p>
              <p className="text-xs text-muted-foreground">Votre psychologue vous enverra des évaluations ici.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
