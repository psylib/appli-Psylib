'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Key, Smartphone, Clock, CheckCircle2 } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings"
          className="p-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sécurité</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez la sécurité de votre compte.
          </p>
        </div>
      </div>

      {/* Authentification */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-primary" aria-hidden />
          <h2 className="text-base font-semibold text-foreground">Authentification</h2>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Mot de passe</p>
            <p className="text-xs text-muted-foreground">
              Géré par Keycloak — modifiable via le portail d&apos;authentification
            </p>
          </div>
          <a
            href={`${process.env['NEXT_PUBLIC_KEYCLOAK_URL'] ?? 'https://auth.psylib.eu'}/realms/${process.env['NEXT_PUBLIC_KEYCLOAK_REALM'] ?? 'psyscale'}/account/#/security/signingin`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
          >
            Modifier
          </a>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Smartphone size={16} className="text-accent flex-shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">
                Authentification à deux facteurs (MFA)
              </p>
              <p className="text-xs text-muted-foreground">
                TOTP obligatoire pour les psychologues — Google Authenticator, Authy
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-accent">
            <CheckCircle2 size={14} aria-hidden />
            Actif
          </span>
        </div>
      </div>

      {/* Chiffrement */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" aria-hidden />
          <h2 className="text-base font-semibold text-foreground">Chiffrement des données</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-accent mt-0.5 flex-shrink-0" aria-hidden />
            <div>
              <p className="font-medium text-foreground">Chiffrement en transit</p>
              <p className="text-xs text-muted-foreground">TLS 1.3 sur toutes les connexions</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-accent mt-0.5 flex-shrink-0" aria-hidden />
            <div>
              <p className="font-medium text-foreground">Chiffrement au repos</p>
              <p className="text-xs text-muted-foreground">AWS KMS (AES-256) sur la base de données et les fichiers</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-accent mt-0.5 flex-shrink-0" aria-hidden />
            <div>
              <p className="font-medium text-foreground">Chiffrement applicatif</p>
              <p className="text-xs text-muted-foreground">
                AES-256-GCM sur les notes de séance, journaux patients et messages
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-primary" aria-hidden />
          <h2 className="text-base font-semibold text-foreground">Sessions</h2>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Token d&apos;accès</span>
            <span className="text-foreground font-medium">15 minutes</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Token de rafraîchissement</span>
            <span className="text-foreground font-medium">8 heures</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Déconnexion automatique</span>
            <span className="text-foreground font-medium">Après 8h d&apos;inactivité</span>
          </div>
        </div>
      </div>

      {/* Conformité */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
        <p className="text-sm text-foreground font-medium">Infrastructure certifiée HDS</p>
        <p className="text-xs text-muted-foreground mt-1">
          Toutes les données de santé sont hébergées sur AWS eu-west-3 (Paris) et OVH,
          tous deux certifiés HDS conformément à l&apos;article L.1111-8 du Code de la santé publique.
        </p>
      </div>
    </div>
  );
}
