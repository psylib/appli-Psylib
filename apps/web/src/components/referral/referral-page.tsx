'use client';

import { useState } from 'react';
import { Gift, Copy, Check, Users, Trophy, Clock, MessageCircle, Mail, Share2 } from 'lucide-react';
import { useReferralCode, useReferralStats } from '@/hooks/use-referral';

const SHARE_URL_BASE = 'https://psylib.eu/login?ref=';

export function ReferralPage() {
  const { data: codeData, isLoading: codeLoading } = useReferralCode();
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const [copied, setCopied] = useState(false);

  const code = codeData?.code ?? '';
  const shareUrl = code ? `${SHARE_URL_BASE}${code}` : '';

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappText = encodeURIComponent(
    `Bonjour ! Je te recommande PsyLib, une plateforme pour gérer ton cabinet psy. Utilise mon lien pour obtenir 1 mois gratuit : ${shareUrl}`,
  );
  const emailSubject = encodeURIComponent('Je te recommande PsyLib — 1 mois gratuit');
  const emailBody = encodeURIComponent(
    `Bonjour,\n\nJe te recommande PsyLib, une plateforme SaaS pour psychologues libéraux (gestion agenda, notes, facturation, conformité HDS).\n\nUtilise mon lien de parrainage pour obtenir 1 mois gratuit :\n${shareUrl}\n\nBonne découverte !`,
  );

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Gift size={20} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Parrainage</h1>
        </div>
        <p className="text-muted-foreground">
          Invitez vos collègues psychologues — vous gagnez chacun <strong>1 mois gratuit</strong> quand ils souscrivent.
        </p>
      </div>

      {/* Code + partage */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-foreground">Votre code de parrainage</h2>

        {codeLoading ? (
          <div className="h-14 rounded-lg bg-surface animate-pulse" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 font-mono text-xl font-bold text-primary tracking-widest">
                {code}
              </div>
              <button
                onClick={() => void handleCopy(shareUrl)}
                className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium text-foreground hover:bg-surface transition-colors min-h-[44px]"
                title="Copier le lien"
              >
                {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
                {copied ? 'Copié !' : 'Copier le lien'}
              </button>
            </div>

            <p className="text-xs text-muted-foreground break-all">{shareUrl}</p>

            {/* Partage rapide */}
            <div className="flex gap-3 pt-1">
              <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors min-h-[44px]"
              >
                <MessageCircle size={16} className="text-green-600" />
                WhatsApp
              </a>
              <a
                href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors min-h-[44px]"
              >
                <Mail size={16} className="text-primary" />
                Email
              </a>
              <button
                onClick={() => void handleCopy(shareUrl)}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors min-h-[44px]"
              >
                <Share2 size={16} />
                Copier
              </button>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Collègues invités',
            value: stats?.sent ?? 0,
            icon: Users,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
          {
            label: 'Inscrits',
            value: stats?.converted ?? 0,
            icon: Trophy,
            color: 'text-accent',
            bg: 'bg-accent/10',
          },
          {
            label: 'Mois offerts',
            value: stats?.rewardsPending ?? 0,
            icon: Clock,
            color: 'text-warm',
            bg: 'bg-warm/10',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white p-4 shadow-sm text-center">
            <div className={`mx-auto mb-2 h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon size={18} className={s.color} />
            </div>
            {statsLoading ? (
              <div className="h-7 w-12 mx-auto rounded bg-surface animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Comment ça marche */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-foreground">Comment ça marche ?</h2>
        <ol className="space-y-4">
          {[
            {
              n: 1,
              title: 'Partagez votre lien',
              desc: 'Envoyez votre lien de parrainage à vos collègues psychologues par email, WhatsApp ou tout autre canal.',
            },
            {
              n: 2,
              title: "Votre collègue s'inscrit",
              desc: 'Il crée son compte PsyLib via votre lien et saisit votre code lors de son onboarding.',
            },
            {
              n: 3,
              title: 'Vous obtenez chacun 1 mois gratuit',
              desc: 'Dès que votre collègue souscrit à un plan payant, 30 jours gratuits sont ajoutés à vos deux abonnements.',
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 mt-0.5">
                {step.n}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
