'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

const CONSENT_LABELS: Record<string, { title: string; description: string }> = {
  data_processing: {
    title: 'Traitement des donnees',
    description:
      'Autoriser le traitement numerique des donnees de votre enfant dans le cadre du suivi psychologique.',
  },
  ai_processing: {
    title: 'Intelligence artificielle',
    description:
      "Autoriser l'utilisation d'outils d'IA pour aider le praticien a generer des resumes de seance et des exercices personnalises.",
  },
  video_consultation: {
    title: 'Consultation video',
    description:
      'Autoriser les consultations video securisees entre votre enfant et le praticien.',
  },
};

interface ConsentData {
  guardianName: string;
  patientFirstName: string;
  psychologistName: string;
  consentType: string;
  status: string;
}

export default function GuardianConsentPage() {
  const params = useParams();
  const token = params['token'] as string;
  const [data, setData] = useState<ConsentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'approved' | 'refused' | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/v1/guardian-consents/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(b.message ?? 'Lien invalide');
        }
        return res.json();
      })
      .then((d) => setData(d as ConsentData))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Erreur inconnue'),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleAction = async (action: 'approve' | 'refuse') => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/v1/guardian-consents/${token}/${action}`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(b.message ?? 'Erreur');
      }
      setResult(action === 'approve' ? 'approved' : 'refused');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            {result === 'approved' ? (
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            )}
            <h2 className="text-xl font-semibold">
              {result === 'approved'
                ? 'Consentement approuve'
                : 'Consentement refuse'}
            </h2>
            <p className="text-muted-foreground">
              {result === 'approved'
                ? `La fonctionnalite a ete activee pour ${data?.patientFirstName}. Le praticien a ete notifie.`
                : 'Le praticien a ete notifie de votre refus.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Lien invalide</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const consent = CONSENT_LABELS[data?.consentType ?? ''] ?? {
    title: data?.consentType,
    description: '',
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <ShieldCheck className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle>Demande de consentement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            {data?.psychologistName} demande votre consentement pour{' '}
            {data?.patientFirstName}.
          </p>
          <div className="bg-muted rounded-lg p-4 space-y-1">
            <h3 className="font-medium">{consent.title}</h3>
            <p className="text-sm text-muted-foreground">
              {consent.description}
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleAction('refuse')}
              disabled={submitting}
            >
              Je refuse
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleAction('approve')}
              disabled={submitting}
            >
              J&apos;approuve
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Votre adresse IP et la date seront enregistrees conformement au
            RGPD.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
