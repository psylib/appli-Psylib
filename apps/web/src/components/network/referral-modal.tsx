'use client';

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { networkApi } from '@/lib/api/network';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReferralModalProps {
  psyId: string;
  psyName: string;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReferralModal({ psyId, psyName, onClose, onSuccess, token }: ReferralModalProps) {
  const [patientInitials, setPatientInitials] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await networkApi.createReferral(token, {
        toPsyId: psyId,
        patientInitials: patientInitials.trim() || undefined,
        reason: reason.trim() || undefined,
        message: message.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Adresser un patient"
      description={`L'adressage sera envoyé à ${psyName}`}
    >
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle size={24} className="text-green-600" aria-hidden />
          </div>
          <p className="font-semibold text-foreground">Adressage envoyé !</p>
          <p className="text-sm text-muted-foreground">
            {psyName} recevra une notification et pourra accepter ou décliner la demande.
          </p>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {/* Destinataire (lecture seule) */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Adresser à</p>
            <div className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground">
              {psyName}
            </div>
          </div>

          {/* Initiales du patient */}
          <Input
            label="Initiales du patient"
            value={patientInitials}
            onChange={(e) => setPatientInitials(e.target.value)}
            placeholder="Ex : M.D."
            maxLength={10}
          />
          <p className="text-xs text-muted-foreground -mt-3">
            Pour des raisons de confidentialité, utilisez des initiales.
          </p>

          {/* Motif */}
          <Input
            label="Motif d'adressage"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex : TCC dépression légère"
            maxLength={200}
          />

          {/* Message confidentiel */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Message confidentiel
              </label>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock size={11} aria-hidden />
                Chiffré
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Informations complémentaires pour votre confrère..."
              className="min-h-[90px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Ce message sera chiffré et visible uniquement par {psyName}.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} aria-hidden />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              <Send size={14} aria-hidden />
              Envoyer l&apos;adressage
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
