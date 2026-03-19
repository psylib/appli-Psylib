import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Outils gratuits pour psychologues libéraux | PsyLib',
  description:
    'Calculateurs, modèles et ressources gratuites pour psychologues libéraux : revenus, facturation, notes cliniques.',
  alternates: { canonical: 'https://psylib.eu/outils' },
  robots: { index: true, follow: true },
};

const TOOLS = [
  {
    href: '/outils/calculateur-revenus',
    icon: Calculator,
    title: 'Calculateur de revenus',
    description: 'Simulez votre chiffre d\'affaires, vos charges URSSAF, votre impôt et votre revenu net mensuel.',
    badge: 'Gratuit',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    href: '/guides/notes-seance-structurees',
    icon: FileText,
    title: 'Guide : Notes cliniques structurées',
    description: 'Tout savoir sur les différents formats de notes (SOAP, DAP, narratif) et les templates PsyLib.',
    badge: 'Guide',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
];

export default function OutilsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-800">Accueil</Link> ›{' '}
        <span className="text-gray-800 font-medium">Outils</span>
      </nav>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Outils gratuits pour psychologues</h1>
      <p className="text-gray-600 mb-10">Ressources pratiques pour mieux gérer votre cabinet libéral.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <tool.icon size={20} className="text-blue-600" />
              </div>
              <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${tool.badgeColor}`}>{tool.badge}</span>
            </div>
            <h2 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{tool.title}</h2>
            <p className="text-sm text-gray-500">{tool.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
