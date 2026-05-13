'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Video, Clock, User, Users, ArrowRight, CheckCircle, Plus, Copy, Check, Search } from 'lucide-react';
import { videoApi } from '@/lib/api/video';
import { patientsApi } from '@/lib/api/patients';

const STATUS_CONFIG = {
  upcoming: { label: 'A venir', color: 'text-muted-foreground', bg: 'bg-muted' },
  ready: { label: 'Pret', color: 'text-accent', bg: 'bg-accent/10' },
  patient_waiting: { label: 'Patient attend', color: 'text-orange-600', bg: 'bg-orange-50' },
  active: { label: 'En cours', color: 'text-green-600', bg: 'bg-green-50' },
  ended: { label: 'Terminee', color: 'text-muted-foreground', bg: 'bg-muted' },
} as const;

export default function VideoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.accessToken || '';

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['video-today'],
    queryFn: () => videoApi.getTodayRooms(token),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const [startError, setStartError] = useState<string | null>(null);
  const [showInstantDialog, setShowInstantDialog] = useState(false);

  const handleStart = async (appointmentId: string) => {
    try {
      setStartError(null);
      await videoApi.createRoom(appointmentId, token);
      router.push(`/video/${appointmentId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de demarrer la visio';
      setStartError(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consultations video</h1>
          <p className="text-sm text-muted-foreground mt-1">Vos visios du jour</p>
        </div>
        <button
          onClick={() => setShowInstantDialog(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle visio
        </button>
      </div>

      {startError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive" role="alert">
          {startError}
        </div>
      )}

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune consultation video aujourd&apos;hui</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur &quot;Nouvelle visio&quot; pour demarrer une consultation instantanee
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rooms.map((room) => {
              const config = STATUS_CONFIG[room.status as keyof typeof STATUS_CONFIG] ?? { label: room.status, color: 'text-muted-foreground', bg: 'bg-muted' };
              const time = new Date(room.scheduledAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              });

              return (
                <div key={room.appointmentId} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold text-foreground w-14">{time}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {room.patientName ?? 'Visio instantanee'}
                        </span>
                        {room.participantCount > 1 && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            <Users className="h-3 w-3" />
                            {room.participantsJoined}/{room.participantCount} connectes
                          </span>
                        )}
                      </div>
                      {room.participantNames && room.participantNames.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          + {room.participantNames.join(', ')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{room.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                      {room.status === 'ended' && <CheckCircle className="h-3 w-3" />}
                      {config.label}
                    </span>
                    {(room.status === 'ready' || room.status === 'patient_waiting') && (
                      <button
                        onClick={() => handleStart(room.appointmentId)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
                      >
                        {room.status === 'patient_waiting' ? 'Rejoindre' : 'Demarrer'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                    {room.status === 'active' && (
                      <button
                        onClick={() => router.push(`/video/${room.appointmentId}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                      >
                        En cours
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showInstantDialog && (
        <InstantVideoDialog
          token={token}
          onClose={() => setShowInstantDialog(false)}
        />
      )}
    </div>
  );
}

// ─── Instant Video Dialog ────────────────────────────────────────────────────

function InstantVideoDialog({ token, onClose }: { token: string; onClose: () => void }) {
  const router = useRouter();
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ appointmentId: string; patientLink: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: patientsData } = useQuery({
    queryKey: ['patients-for-instant', search],
    queryFn: () => patientsApi.list({ limit: 20, search: search || undefined, status: 'active' }, token),
    enabled: !!token,
  });

  const patients = useMemo(() => patientsData?.data ?? [], [patientsData]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const data = await videoApi.createInstantRoom(token, selectedPatientId);
      setResult({ appointmentId: data.appointmentId, patientLink: data.patientLink });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.patientLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (!result) return;
    const params = new URLSearchParams({ patientLink: result.patientLink });
    router.push(`/video/${result.appointmentId}?${params.toString()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Nouvelle visio instantanee</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Demarrez une consultation video immediatement, avec ou sans patient.
          </p>

          {!result ? (
            <>
              {/* Patient selector */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-foreground">
                  Patient (optionnel)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Rechercher un patient..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                  <button
                    type="button"
                    onClick={() => setSelectedPatientId(undefined)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${
                      !selectedPatientId ? 'bg-primary/5 text-primary font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Sans patient
                  </button>
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${
                        selectedPatientId === p.id ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'
                      }`}
                    >
                      {p.name}
                      {p.email && (
                        <span className="text-muted-foreground text-xs ml-2">{p.email}</span>
                      )}
                    </button>
                  ))}
                  {patients.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Aucun patient trouve</div>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creation...' : 'Demarrer la visio'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
                <p className="text-sm font-medium text-green-800 mb-2">Visio creee avec succes !</p>
                <p className="text-xs text-green-700 mb-3">
                  Partagez ce lien avec votre patient pour qu&apos;il rejoigne la consultation :
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={result.patientLink}
                    className="flex-1 text-xs bg-white border border-green-200 rounded px-2 py-1.5 text-foreground"
                  />
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium bg-white border border-green-200 hover:bg-green-50 transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copie !' : 'Copier'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={handleJoin}
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
                >
                  Rejoindre la visio
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
