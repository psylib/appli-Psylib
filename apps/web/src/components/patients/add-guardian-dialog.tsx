'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { guardiansApi } from '@/lib/api/guardian-portal';
import { GuardianRelationship, DEFAULT_GUARDIAN_PERMISSIONS } from '@psyscale/shared-types';
import type { LegalGuardian, GuardianPermissions } from '@psyscale/shared-types';

interface AddGuardianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  accessToken: string;
  onSuccess: () => void;
  planAllowsPermissions: boolean;
  guardian?: LegalGuardian;
}

const RELATIONSHIP_OPTIONS = [
  { value: GuardianRelationship.MOTHER, label: 'Mere' },
  { value: GuardianRelationship.FATHER, label: 'Pere' },
  { value: GuardianRelationship.LEGAL_GUARDIAN, label: 'Tuteur legal' },
  { value: GuardianRelationship.OTHER, label: 'Autre' },
] as const;

const PERMISSION_OPTIONS: { key: keyof GuardianPermissions; label: string }[] = [
  { key: 'portal', label: 'Acces au portail' },
  { key: 'invoices', label: 'Voir les factures' },
  { key: 'video', label: 'Participer aux visios' },
  { key: 'documents', label: 'Voir les documents' },
  { key: 'messaging', label: 'Messagerie' },
];

export function AddGuardianDialog({
  open,
  onOpenChange,
  patientId,
  accessToken,
  onSuccess,
  planAllowsPermissions,
  guardian,
}: AddGuardianDialogProps) {
  const isEdit = !!guardian;
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState<string>(GuardianRelationship.MOTHER);
  const [isPrimary, setIsPrimary] = useState(false);
  const [permissions, setPermissions] = useState<GuardianPermissions>({ ...DEFAULT_GUARDIAN_PERMISSIONS });

  // Populate form when editing
  useEffect(() => {
    if (open && guardian) {
      setName(guardian.name);
      setEmail(guardian.email);
      setPhone(guardian.phone ?? '');
      setRelationship(guardian.relationship);
      setIsPrimary(guardian.isPrimary);
      setPermissions({ ...guardian.permissions });
    } else if (open && !guardian) {
      setName('');
      setEmail('');
      setPhone('');
      setRelationship(GuardianRelationship.MOTHER);
      setIsPrimary(false);
      setPermissions({ ...DEFAULT_GUARDIAN_PERMISSIONS });
    }
    setError(null);
  }, [open, guardian]);

  const togglePermission = (key: keyof GuardianPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClose = () => onOpenChange(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!email.trim()) {
      setError('L&apos;email est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit && guardian) {
        await guardiansApi.update(
          patientId,
          guardian.id,
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            relationship,
            isPrimary,
            permissions,
          },
          accessToken,
        );
        success('Tuteur mis a jour');
      } else {
        await guardiansApi.create(
          patientId,
          {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            relationship,
            isPrimary,
            permissions,
          },
          accessToken,
        );
        success('Tuteur ajoute');
      }
      handleClose();
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l&apos;enregistrement';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Modifier le tuteur' : 'Ajouter un tuteur'}
      description="Responsable legal du patient mineur"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom complet"
          placeholder="Marie Dupont"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email"
            type="email"
            placeholder="marie@email.fr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Telephone"
            type="tel"
            placeholder="+33 6 12 34 56 78"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Lien de parente
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            >
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Tuteur principal</span>
            </label>
          </div>
        </div>

        {/* Permissions */}
        {planAllowsPermissions && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Permissions
            </label>
            <div className="space-y-2">
              {PERMISSION_OPTIONS.map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center gap-3 p-2 rounded-lg bg-surface cursor-pointer select-none hover:bg-border/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={permissions[perm.key]}
                    onChange={() => togglePermission(perm.key)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Enregistrer' : 'Ajouter le tuteur'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
