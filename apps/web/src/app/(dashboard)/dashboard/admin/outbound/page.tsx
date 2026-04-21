'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Upload,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  Download,
  Copy,
  Check,
} from 'lucide-react';

type ProspectStatus = 'pending' | 'sent' | 'replied';

interface Prospect {
  id: string;
  name: string;
  email: string;
  city: string;
  specialty: string;
  status: ProspectStatus;
}

const EMAIL_TEMPLATE = (name: string, city: string) => `Bonjour ${name},

Je me permets de vous contacter car je développe PsyLib, une plateforme SaaS conçue spécifiquement pour les psychologues libéraux comme vous à ${city}.

PsyLib vous permet de :
• Gérer votre agenda et vos prises de rendez-vous en ligne
• Rédiger vos notes de séance de façon structurée (conformité HDS)
• Générer vos factures en 1 clic
• Suivre l'évolution de vos patients (outcome tracking)

La plateforme est 100 % conforme HDS (données de santé) et développée en France.

Nous sommes actuellement en version bêta et offrons 3 mois gratuits aux premiers inscrits.

Seriez-vous disponible pour une démo de 20 min cette semaine ?

Cordialement,
L'équipe PsyLib
contact@psylib.eu | https://psylib.eu`;

function parseCSV(text: string): Prospect[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const nameIdx = headers.findIndex((h) => h.includes('nom') || h === 'name');
  const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
  const cityIdx = headers.findIndex((h) => h.includes('ville') || h === 'city');
  const specialtyIdx = headers.findIndex((h) => h.includes('sp') || h.includes('specialty'));

  return lines.slice(1).map((line, i) => {
    const cols = line.split(',').map((c) => c.trim().replace(/"/g, ''));
    return {
      id: String(i),
      name: nameIdx >= 0 ? (cols[nameIdx] ?? '') : `Prospect ${i + 1}`,
      email: emailIdx >= 0 ? (cols[emailIdx] ?? '') : '',
      city: cityIdx >= 0 ? (cols[cityIdx] ?? '') : '',
      specialty: specialtyIdx >= 0 ? (cols[specialtyIdx] ?? '') : '',
      status: 'pending' as ProspectStatus,
    };
  }).filter((p) => p.email);
}

const STATUS_CONFIG: Record<ProspectStatus, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'À envoyer', icon: Clock, color: 'text-muted-foreground' },
  sent: { label: 'Envoyé', icon: Send, color: 'text-primary' },
  replied: { label: 'Répondu', icon: CheckCircle2, color: 'text-accent' },
};

export default function OutboundPage() {
  const { data: session } = useSession();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Gate admin-only
  const userRole = (session?.user as { role?: string })?.role;
  if (userRole && userRole !== 'admin' && userRole !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setProspects(parsed);
      setSelected(null);
    };
    reader.readAsText(file);
  };

  const updateStatus = (id: string, status: ProspectStatus) => {
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    if (selected?.id === id) setSelected((prev) => (prev ? { ...prev, status } : null));
  };

  const handleCopyEmail = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(EMAIL_TEMPLATE(selected.name, selected.city));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportCSV = () => {
    const lines = ['nom,email,ville,spécialité,statut',
      ...prospects.map((p) => `"${p.name}","${p.email}","${p.city}","${p.specialty}","${p.status}"`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outbound_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    pending: prospects.filter((p) => p.status === 'pending').length,
    sent: prospects.filter((p) => p.status === 'sent').length,
    replied: prospects.filter((p) => p.status === 'replied').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outbound ADELI</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import CSV psychologues → génération emails personnalisés → suivi envois
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-surface transition-colors min-h-[44px]"
          >
            <Upload size={16} />
            Importer CSV
          </button>
          {prospects.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-surface transition-colors min-h-[44px]"
            >
              <Download size={16} />
              Exporter
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Stats */}
      {prospects.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {([
            { key: 'pending', label: 'À envoyer', color: 'text-muted-foreground', bg: 'bg-surface' },
            { key: 'sent', label: 'Envoyés', color: 'text-primary', bg: 'bg-primary/10' },
            { key: 'replied', label: 'Réponses', color: 'text-accent', bg: 'bg-accent/10' },
          ] as const).map((s) => (
            <div key={s.key} className="rounded-xl border border-border bg-white p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key]}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {prospects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-16 text-center space-y-3">
          <Upload size={32} className="text-muted-foreground mx-auto" />
          <p className="font-medium text-foreground">Importez un fichier CSV</p>
          <p className="text-sm text-muted-foreground">
            Format attendu : nom, email, ville, spécialité (1 ligne par psychologue)
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg bg-primary text-white px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Choisir un fichier
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Liste prospects */}
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="font-semibold text-foreground">{prospects.length} prospects importés</p>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {prospects.map((p) => {
                const sc = STATUS_CONFIG[p.status];
                const StatusIcon = sc.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`w-full text-left p-4 hover:bg-surface transition-colors ${selected?.id === p.id ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                        {p.city && <p className="text-xs text-muted-foreground">{p.city}</p>}
                      </div>
                      <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${sc.color}`}>
                        <StatusIcon size={12} />
                        {sc.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email template + actions */}
          {selected ? (
            <div className="rounded-xl border border-border bg-white p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                </div>
                <div className="flex gap-2">
                  {(['pending', 'sent', 'replied'] as ProspectStatus[]).map((s) => {
                    const sc = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                          selected.status === s
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-white text-muted-foreground hover:bg-surface'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg bg-surface border border-border p-4">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {EMAIL_TEMPLATE(selected.name, selected.city)}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => void handleCopyEmail()}
                  className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium hover:bg-surface transition-colors flex-1 justify-center"
                >
                  {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
                  {copied ? 'Copié !' : 'Copier le template'}
                </button>
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent('PsyLib — Plateforme pour psychologues libéraux')}&body=${encodeURIComponent(EMAIL_TEMPLATE(selected.name, selected.city))}`}
                  onClick={() => updateStatus(selected.id, 'sent')}
                  className="flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors flex-1 justify-center"
                >
                  <MessageSquare size={16} />
                  Ouvrir dans Mail
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 flex items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                Sélectionnez un prospect pour voir le template email personnalisé
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
