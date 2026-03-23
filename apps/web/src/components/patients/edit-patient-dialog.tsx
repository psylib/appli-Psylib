'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { patientsApi } from '@/lib/api/patients';
import type { Patient } from '@psyscale/shared-types';

interface EditPatientDialogProps {
  open: boolean;
  onClose: () => void;
  patient: Patient;
}

export function EditPatientDialog({ open, onClose, patient }: EditPatientDialogProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    notes: '',
    status: '' as string,
    source: '',
  });

  useEffect(() => {
    if (open && patient) {
      setForm({
        name: patient.name,
        email: patient.email ?? '',
        phone: patient.phone ?? '',
        birthDate: patient.birthDate
          ? new Date(patient.birthDate).toISOString().split('T')[0]!
          : '',
        notes: patient.notes ?? '',
        status: patient.status,
        source: patient.source ?? '',
      });
      setError(null);
    }
  }, [open, patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Le nom est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await patientsApi.update(
        patient.id,
        {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          birthDate: form.birthDate ? new Date(form.birthDate) : null,
          notes: form.notes || null,
          status: form.status as Patient['status'],
          source: form.source || null,
        },
        session?.accessToken ?? '',
      );

      await queryClient.invalidateQueries({ queryKey: ['patients', patient.id] });
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Modifier le patient"
      description="Mettez à jour les informations du patient"
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
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <Input
          label="Date de naissance"
          type="date"
          value={form.birthDate}
          onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Statut</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="archived">Archivé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Source</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            >
              <option value="">Non renseignée</option>
              <option value="direct">Direct</option>
              <option value="referral">Recommandation</option>
              <option value="online">En ligne</option>
            </select>
          </div>
        </div>
        <Textarea
          label="Notes cliniques"
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
            Enregistrer
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
