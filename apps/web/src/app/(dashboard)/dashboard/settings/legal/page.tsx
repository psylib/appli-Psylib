import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
};

export default async function LegalPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

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
          <h1 className="text-2xl font-semibold text-foreground">Mentions légales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Informations légales relatives à la plateforme PsyLib.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 space-y-6 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="text-base font-semibold mb-2">Éditeur</h2>
          <p>
            PsyLib est édité par PsyScale SAS, société par actions simplifiée
            au capital de 1 000€, immatriculée au RCS de Nancy.
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>Siège social : Nancy, France</li>
            <li>Email : contact@psylib.eu</li>
            <li>Directeur de la publication : le représentant légal de PsyScale SAS</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Hébergement</h2>
          <p>
            Les données de santé sont hébergées conformément à la certification HDS
            (Hébergeur de Données de Santé) au sens de l&apos;article L.1111-8 du Code
            de la santé publique.
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>Infrastructure principale : AWS eu-west-3 (Paris) — certifié HDS</li>
            <li>Authentification : OVH HDS (Keycloak)</li>
            <li>Sauvegardes : OVH HDS Object Storage</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Protection des données</h2>
          <p>
            PsyLib traite des données de santé soumises au RGPD et à la réglementation
            HDS. Les données personnelles sont chiffrées au repos (AES-256-GCM) et en
            transit (TLS 1.3).
          </p>
          <p className="mt-2">
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
            rectification, d&apos;effacement et de portabilité de vos données.
            Contactez-nous à{' '}
            <a href="mailto:privacy@psylib.eu" className="text-primary hover:underline">
              privacy@psylib.eu
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus, interfaces et fonctionnalités de PsyLib sont
            protégés par le droit de la propriété intellectuelle. Toute reproduction
            non autorisée est interdite.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">Cookies</h2>
          <p>
            PsyLib utilise uniquement des cookies essentiels au fonctionnement du
            service (authentification, session). Aucun cookie publicitaire ou de
            tracking tiers n&apos;est utilisé.
          </p>
        </section>
      </div>
    </div>
  );
}
