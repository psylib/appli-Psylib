'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { patientsApi } from '@/lib/api/patients';

interface CreatePatientDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePatientDialog({ open, onClose, onCreated }: CreatePatientDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Le nom est requis'); return; }

    setLoading(true);
    setError(null);

    try {
      await patientsApi.create(
        {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
        },
        session?.accessToken ?? '',
      );
      setForm({ name: '', email: '', phone: '', notes: '' });
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

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            Créer le patient
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
