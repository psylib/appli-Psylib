'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Users } from 'lucide-react';
import {
  validateAssistantInvite,
  acceptAssistantInvite,
  type AssistantInviteValidation,
} from '@/lib/api/assistants';

export default function AssistantInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params['token'] as string;

  const [data, setData] = useState<AssistantInviteValidation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    validateAssistantInvite(token)
      .then((d) => {
        if (!d.valid) {
          setError('Cette invitation est invalide ou a expiré.');
        } else {
          setData(d);
        }
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Invitation invalide'),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await acceptAssistantInvite(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'activation");
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

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Compte activé !</h2>
            <p className="text-muted-foreground">
              Votre accès collaborateur a bien été activé. Vous pouvez maintenant
              vous connecter.
            </p>
            <a
              href="/login"
              className="inline-flex items-center justify-center w-full rounded-lg bg-primary text-white font-medium py-3 px-6 hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              Se connecter
            </a>
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
            <h2 className="text-xl font-semibold">Invitation invalide</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle>Rejoindre l&apos;équipe</CardTitle>
          <CardDescription>
            {data?.psychologistName
              ? `${data.psychologistName} vous invite à collaborer sur PsyLib.`
              : 'Vous avez été invité·e à collaborer sur PsyLib.'}{' '}
            Choisissez votre mot de passe pour activer votre accès.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input id="email" type="email" value={data?.email ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-foreground"
              >
                Confirmer le mot de passe
              </label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Activation...' : 'Activer mon accès'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
