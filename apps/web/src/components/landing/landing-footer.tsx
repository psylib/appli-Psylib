import Link from 'next/link';
import { Shield } from 'lucide-react';
import { NewsletterForm } from './newsletter-form';

const footerLinks = {
  Produit: [
    { label: 'Fonctionnalités', href: '/fonctionnalites' },
    { label: 'Visio-consultation', href: '/#visio' },
    { label: 'Espace patient', href: '/#espace-patient' },
    { label: 'Tarifs', href: '/tarifs' },
    { label: 'Comparaison', href: '/comparaison' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'Guides', href: '/guides' },
  ],
  Légal: [
    { label: 'Mentions légales', href: '/legal' },
    { label: 'CGU', href: '/terms' },
    { label: 'Politique RGPD', href: '/privacy' },
  ],
  Contact: [
    { label: 'Nous contacter', href: '/contact' },
    { label: 'Support', href: 'mailto:support@psylib.eu' },
    { label: 'Partenariats', href: 'mailto:partnerships@psylib.eu' },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-charcoal text-charcoal-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-playfair text-xl font-bold text-white">PsyLib</span>
            </Link>
            <p className="text-sm text-charcoal-300 leading-relaxed">
              L'atelier numérique du psy libéral. Conforme HDS, conçu pour la pratique clinique.
            </p>
            <div className="flex items-center gap-2 text-xs text-sage-400">
              <Shield size={12} />
              <span>Hébergement HDS certifié</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-white text-sm font-medium mb-4">{section}</h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-sm text-charcoal-300 hover:text-white transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mb-12 pt-8 border-t border-charcoal-600">
          <div className="max-w-md">
            <h3 className="text-white text-sm font-medium mb-3">Newsletter</h3>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-charcoal-600 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-charcoal-400">
            © 2026 PsyLib — Conforme HDS · SIRET en cours de création
          </p>
          <div className="flex items-center gap-4 text-xs text-charcoal-400">
            <span className="font-dm-mono">OVH HDS</span>
            <span>·</span>
            <span>France 🇫🇷</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
