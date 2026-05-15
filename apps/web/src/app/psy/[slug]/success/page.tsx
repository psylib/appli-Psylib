import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, CalendarPlus, ArrowLeft, CreditCard, Home } from 'lucide-react';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

const DEFAULT_TIPS = [
  'Votre praticien peut vous contacter avant la séance si nécessaire.',
  "N'hésitez pas à noter vos questions ou sujets à aborder.",
  "En cas d'empêchement, prévenez votre praticien le plus tôt possible.",
  'Vous pouvez poser toutes vos questions lors du rendez-vous.',
];

export const metadata: Metadata = {
  title: 'Rendez-vous confirmé — PsyLib',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; appointment?: string; id?: string }>;
}

async function fetchConfirmationMessage(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/psy/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const profile = await res.json() as { bookingConfirmationMessage?: string | null };
    return profile.bookingConfirmationMessage ?? null;
  } catch {
    return null;
  }
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { type, appointment, id } = await searchParams;
  const isPayment = type === 'payment';
  const appointmentRef = appointment ?? id;

  const customMessage = await fetchConfirmationMessage(slug);

  const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Rendez-vous psychologue')}&details=${encodeURIComponent(`Rendez-vous pris via PsyLib. Profil : https://psylib.eu/psy/${slug}`)}`;

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
              {isPayment ? (
                <>Votre rendez-vous est<br />confirmé et payé.</>
              ) : (
                <>Votre rendez-vous<br />est confirmé.</>
              )}
            </h1>
            <p className="mt-3 text-base text-gray-500">
              Un email de confirmation vous a été envoyé.
            </p>
          </div>

          {/* Payment confirmation block */}
          {isPayment && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 mb-6 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 mb-1">
                  Paiement confirmé
                </p>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  Un reçu vous a été envoyé par email. Aucune autre action n&apos;est requise de votre part.
                </p>
              </div>
            </div>
          )}

          {/* Next step card */}
          <div className="bg-white rounded-2xl border-l-4 border-l-[#3D52A0] border border-[#E5E7EB] p-6 mb-6 shadow-sm">
            <p className="text-sm font-semibold text-[#1E1B4B] mb-1">
              Prochaine étape
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {isPayment
                ? 'Vous recevrez un email de confirmation avec les informations pratiques pour votre rendez-vous.'
                : (
                  <>
                    Le praticien va confirmer votre rendez-vous dans les{' '}
                    <strong>24 à 48 heures</strong>. Vous recevrez un email de
                    confirmation avec toutes les informations pratiques.
                  </>
                )}
            </p>
            {appointmentRef && (
              <p className="text-xs text-gray-400 mt-3">
                Référence :{' '}
                <span className="font-mono">
                  {appointmentRef.slice(0, 8).toUpperCase()}
                </span>
              </p>
            )}
          </div>

          {/* Informations avant la séance */}
          <div className="bg-[#F8F7FF] rounded-2xl border border-[#E5E7EB] p-6 mb-6">
            <p className="text-sm font-semibold text-[#1E1B4B] mb-3">
              Quelques repères avant votre séance
            </p>
            {customMessage ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{customMessage}</p>
            ) : (
              <div className="space-y-3">
                {DEFAULT_TIPS.map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="mt-1 h-4 w-4 rounded-full bg-[#0D9488]/10 flex items-center justify-center flex-shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488]" />
                    </span>
                    <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border-2 border-[#3D52A0] text-[#3D52A0] text-sm font-semibold hover:bg-[#3D52A0] hover:text-white transition-colors"
            >
              <CalendarPlus size={16} aria-hidden />
              Ajouter à mon agenda
            </a>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#F1F0F9] text-[#1E1B4B] text-sm font-semibold hover:bg-[#E8E6F8] transition-colors"
            >
              <Home size={16} aria-hidden />
              Retour à l&apos;accueil
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Données confidentielles · Hébergées en France (HDS) ·{' '}
            <Link
              href={`/psy/${slug}`}
              className="text-[#3D52A0] hover:underline"
            >
              Voir le profil
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
