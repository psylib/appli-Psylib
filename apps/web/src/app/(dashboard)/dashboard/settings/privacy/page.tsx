'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { Dialog } from '@/components/ui/dialog';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
const CONFIRM_WORD = 'SUPPRIMER';

export default function PrivacyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { error: showError } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleExport = async () => {
    if (!session?.accessToken) {
      showError('Session expirée. Veuillez vous reconnecter.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/patients/me/export`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mes-donnees.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      showError("Erreur lors de l'export. Veuillez réessayer.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!session?.accessToken) {
      showError('Session expirée. Veuillez vous reconnecter.');
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      await signOut({ callbackUrl: '/' });
    } catch {
      showError('Erreur lors de la suppression. Contactez le support à tony@psylib.eu.');
      setIsDeleting(false);
    }
  };

  if (status === 'loading' || status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Confidentialité & RGPD</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestion de vos consentements et de vos données personnelles.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h2 className="text-base font-medium text-foreground">Vos données</h2>
        <p className="text-sm text-muted-foreground">
          Vos données sont hébergées en France sur une infrastructure certifiée HDS (Hébergeur de Données de Santé), conformément à l&apos;article L.1111-8 du Code de la santé publique.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-4 w-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
            Chiffrement AES-256-GCM des données sensibles
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-4 w-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
            Hébergement HDS France (AZNetwork — HDS V2 + ISO 27001)
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-4 w-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
            Authentification forte (MFA) obligatoire
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-4 w-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
            Journal d&apos;audit complet de tous les accès
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h2 className="text-base font-medium text-foreground">Consentements</h2>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              disabled
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Traitement des données professionnelles</p>
              <p className="text-xs text-muted-foreground">Nécessaire au fonctionnement du service — ne peut pas être désactivé.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              disabled
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Emails transactionnels</p>
              <p className="text-xs text-muted-foreground">Confirmations, rappels de rendez-vous et notifications importantes.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              disabled
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Emails marketing</p>
              <p className="text-xs text-muted-foreground">Conseils pratiques, nouvelles fonctionnalités et offres PsyLib. (Bientôt disponible)</p>
            </div>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h2 className="text-base font-medium text-foreground">Droits RGPD</h2>
        <p className="text-sm text-muted-foreground">
          Conformément au RGPD, vous disposez des droits d&apos;accès, de rectification, de portabilité et d&apos;effacement de vos données.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => void handleExport()}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
          >
            Exporter mes données
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Supprimer mon compte
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pour toute demande RGPD : <span className="font-medium">tony@psylib.eu</span>
        </p>
      </div>

      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          if (!isDeleting) {
            setShowDeleteDialog(false);
            setConfirmInput('');
          }
        }}
        title="Supprimer mon compte"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 space-y-1">
            <p className="font-semibold">Cette action est irréversible.</p>
            <p>Seront supprimés définitivement :</p>
            <ul className="list-disc list-inside space-y-0.5 mt-1 text-red-700">
              <li>Votre compte et votre profil</li>
              <li>Tous vos patients et leurs dossiers</li>
              <li>Toutes vos séances, notes et rendez-vous</li>
              <li>Votre abonnement (annulé immédiatement)</li>
              <li>Vos données de comptabilité</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="confirm-delete">
              Tapez <span className="font-mono font-bold text-red-600">{CONFIRM_WORD}</span> pour confirmer
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRM_WORD}
              disabled={isDeleting}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowDeleteDialog(false);
                setConfirmInput('');
              }}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteConfirm()}
              disabled={confirmInput !== CONFIRM_WORD || isDeleting}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
