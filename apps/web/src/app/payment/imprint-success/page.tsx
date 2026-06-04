import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Carte enregistrée — PsyLib',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ appointmentId?: string }>;
}

export default async function ImprintSuccessPage({ searchParams }: Props) {
  const { appointmentId } = await searchParams;

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="text-[#3D52A0] font-bold text-lg">
            PsyLib
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full">
          {/* Success icon & title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3D52A0]/10 mb-4">
              <CheckCircle2 size={36} className="text-[#3D52A0]" aria-hidden />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1E1B4B] leading-snug">
              Votre carte a bien été enregistrée.
            </h1>
            <p className="mt-3 text-base text-gray-500">
              Aucun montant n&apos;a été débité.
            </p>
          </div>

          {/* Reassurance block */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 mb-6 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 mb-1">
                Empreinte enregistrée
              </p>
              <p className="text-sm text-emerald-700 leading-relaxed">
                Vous ne serez débité qu&apos;en cas d&apos;absence ou selon la politique
                d&apos;annulation de votre praticien. Votre rendez-vous est garanti.
              </p>
            </div>
          </div>

          {/* Info card */}
          <div className="bg-white rounded-2xl border-l-4 border-l-[#3D52A0] border border-[#E5E7EB] p-6 mb-6 shadow-sm">
            <p className="text-sm font-semibold text-[#1E1B4B] mb-1">
              Votre rendez-vous
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Votre praticien a été notifié. Si vous avez des questions, n&apos;hésitez
              pas à le contacter directement.
            </p>
            {appointmentId && (
              <p className="text-xs text-gray-400 mt-3">
                Référence :{' '}
                <span className="font-mono">
                  {appointmentId.slice(0, 8).toUpperCase()}
                </span>
              </p>
            )}
          </div>

          {/* Action */}
          <div className="flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#F1F0F9] text-[#1E1B4B] text-sm font-semibold hover:bg-[#E8E6F8] transition-colors"
            >
              <Home size={16} aria-hidden />
              Retour à l&apos;accueil
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Données confidentielles · Hébergées en France (HDS) · Carte sécurisée par Stripe
          </p>
        </div>
      </main>
    </div>
  );
}
