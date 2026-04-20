'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z
  .object({
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirm: z.string(),
    consentAi: z.boolean().default(false),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm'],
  });
type FormData = z.infer<typeof schema>;

interface InvitationInfo {
  email: string;
  patientName: string;
  psychologistName: string;
}

function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  
  } = useForm<FormData>({ resolver: zodResolver(schema as any) });

  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

  useEffect(() => {
    if (!token) {
      setLoadError('Lien d\'invitation invalide');
      return;
    }
    fetch(`${apiUrl}/api/v1/patient-portal/auth/invitation/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setInfo(d as InvitationInfo))
      .catch(() => setLoadError('Invitation introuvable ou expirée'));
  }, [token, apiUrl]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/patient-portal/auth/accept-invitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password, consentAi: data.consentAi }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        setSubmitError(err.message ?? 'Erreur lors de la création du compte');
        return;
      }

      // Auto-login après création
      const result = await signIn('patient-credentials', {
        email: info?.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/patient/login');
      } else {
        router.push('/patient-portal');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-base font-semibold text-slate-900">{loadError}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Demandez à votre psychologue de vous renvoyer une invitation.
          </p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-[#3D52A0]">PsyLib</span>
          <p className="mt-2 text-sm text-slate-500">Votre espace patient</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-slate-900">Créer votre compte</h1>
            <p className="mt-1 text-sm text-slate-500">
              Invitation de <strong>{info.psychologistName}</strong> pour{' '}
              <strong>{info.patientName}</strong>
            </p>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {info.email}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Choisissez un mot de passe
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/30 focus:border-[#3D52A0]"
                placeholder="Minimum 8 caractères"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                {...register('confirm')}
                type="password"
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/30 focus:border-[#3D52A0]"
                placeholder="••••••••"
              />
              {errors.confirm && (
                <p className="mt-1 text-xs text-red-500">{errors.confirm.message}</p>
              )}
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input
                {...register('consentAi')}
                type="checkbox"
                id="consentAi"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3D52A0] focus:ring-[#3D52A0]/30"
              />
              <label htmlFor="consentAi" className="text-xs text-slate-500 leading-relaxed">
                J&apos;autorise le traitement de mes données par intelligence artificielle
                pour personnaliser mes exercices thérapeutiques. <span className="text-slate-400">(Optionnel)</span>
              </label>
            </div>

            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#3D52A0] text-white text-sm font-medium hover:bg-[#2d3f7c] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense>
      <AcceptInvitationForm />
    </Suspense>
  );
}
