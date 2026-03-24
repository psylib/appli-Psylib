'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Mail } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { patientsApi } from '@/lib/api/patients';

interface CreatePatientDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePatientDialog({ open, onClose, onCreated }: CreatePatientDialogProps) {
  const { data: session } = useSession();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendInvite, setSendInvite] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const hasEmail = form.email.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Le nom est requis'); return; }

    setLoading(true);
    setError(null);

    try {
      const token = session?.accessToken ?? '';
      const patient = await patientsApi.create(
        {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
        },
        token,
      );

      if (sendInvite && hasEmail) {
        try {
          await patientsApi.invite(patient.id, token);
          success(`${form.name} créé(e) — invitation envoyée`);
        } catch {
          success(`${form.name} créé(e)`);
          showError("L'invitation n'a pas pu être envoyée");
        }
      } else {
        success(`${form.name} créé(e)`);
      }

      setForm({ name: '', email: '', phone: '', notes: '' });
      setSendInvite(false);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nouveau patient"
      description="Seuls le prénom et le nom sont requis"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Prénom et nom"
          placeholder="Marie Dupont"
          required
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          placeholder="marie@email.fr"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          label="Téléphone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Textarea
          label="Notes initiales"
          placeholder="Motif de consultation, contexte..."
          hint="Chiffrées et sécurisées (HDS)"
          className="min-h-[80px]"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        {hasEmail && (
          <label className="flex items-center gap-3 p-3 rounded-lg bg-surface cursor-pointer select-none transition-colors hover:bg-border/50">
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <Mail size={16} className="text-muted-foreground flex-shrink-0" aria-hidden />
            <span className="text-sm text-foreground">
              Envoyer une invitation au portail patient
            </span>
          </label>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            {sendInvite && hasEmail ? 'Créer et inviter' : 'Créer le patient'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
