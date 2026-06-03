'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserPlus, Copy, Check, Mail, MessageSquare, Loader2, Share2 } from 'lucide-react';
import { videoApi } from '@/lib/api/video';

interface GuestInvitePopoverProps {
  appointmentId: string;
}

/**
 * Bouton « Inviter » (style Zoom) intégré à la barre de contrôles visio.
 * Génère un lien à usage partagé que le psy diffuse (copier / email / SMS /
 * partage natif). L'invité atterrit dans la salle d'attente.
 */
export function GuestInvitePopover({ appointmentId }: GuestInvitePopoverProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && !link && session?.accessToken) {
      setLoading(true);
      setError(null);
      try {
        const res = await videoApi.createGuestInvite(appointmentId, session.accessToken);
        setLink(res.inviteUrl);
      } catch {
        setError('Lien indisponible. Réessayez.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = 'Vous êtes invité·e à rejoindre une consultation vidéo PsyLib :';
  const mailto = link
    ? `mailto:?subject=${encodeURIComponent('Invitation visio PsyLib')}&body=${encodeURIComponent(`${shareText}\n\n${link}`)}`
    : '#';
  const sms = link ? `sms:?&body=${encodeURIComponent(`${shareText} ${link}`)}` : '#';

  const handleNativeShare = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Invitation visio PsyLib', text: shareText, url: link });
      } catch {
        /* annulé */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className={`rounded-full p-3 text-white transition-colors ${open ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'}`}
        title="Inviter une personne"
      >
        <UserPlus className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 rounded-xl border border-white/10 bg-gray-900/95 p-4 shadow-2xl backdrop-blur">
          <p className="text-sm font-medium text-white">Inviter une personne</p>
          <p className="mt-0.5 text-xs text-white/50">
            Partagez ce lien. La personne attendra votre validation avant d&apos;entrer.
          </p>

          {loading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" /> Génération du lien…
            </div>
          ) : error ? (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          ) : link ? (
            <>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
                <input
                  readOnly
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 bg-transparent text-xs text-white/80 outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="inline-flex shrink-0 items-center gap-1 rounded bg-[#0D9488] px-2 py-1 text-xs font-medium text-white hover:bg-[#0b7d72]"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <a
                  href={mailto}
                  className="flex flex-col items-center gap-1 rounded-lg bg-white/5 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  <Mail className="h-4 w-4" /> Email
                </a>
                <a
                  href={sms}
                  className="flex flex-col items-center gap-1 rounded-lg bg-white/5 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  <MessageSquare className="h-4 w-4" /> SMS
                </a>
                <button
                  onClick={handleNativeShare}
                  className="flex flex-col items-center gap-1 rounded-lg bg-white/5 py-2 text-xs text-white/80 hover:bg-white/10"
                >
                  <Share2 className="h-4 w-4" /> Partager
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
