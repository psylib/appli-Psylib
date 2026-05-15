import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, CalendarPlus, ArrowLeft, CreditCard } from 'lucide-react';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

const DEFAULT_TIPS = [
  'Votre praticien peut vous contacter avant la séance si nécessaire.',
  "N'hésitez pas à noter vos questions ou sujets à aborder.",
  'En cas d\'empêchement, prévenez votre praticien le plus tôt possible.',
  'Vous pouvez poser toutes vos questions lors du rendez-vous.',
];

export const metadata: Metadata = {
  title: 'Rendez-vous confirmé — PsyLib',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string; paid?: string; ct?: string }>;
}

async function fetchConfirmationMessage(slug: string, consultationTypeId?: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/psy/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const profile = await res.json() as {
      bookingConfirmationMessage?: string | null;
      consultationTypes?: Array<{ id: string; instructions?: string | null }>;
    };

    // Priority: per-type instructions > global message > null (fallback to defaults)
    if (consultationTypeId && profile.consultationTypes) {
      const ct = profile.consultationTypes.find((t) => t.id === consultationTypeId);
      if (ct?.instructions) return ct.instructions;
    }
    if (profile.bookingConfirmationMessage) return profile.bookingConfirmationMessage;
    return null;
  } catch {
    return null;
  }
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { id, paid, ct } = await searchParams;
  const isPaid = paid === 'true';

  const customMessage = await fetchConfirmationMessage(slug, ct);

  const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Rendez-vous psychologue')}&details=${encodeURIComponent(`Rendez-vous pris via PsyLib. Profil : https://psylib.eu/psy/${slug}`)}`;

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="text-[#3D52A0] font-bold text-lg font-playfair">PsyLib</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full">

          {/* Titre émotionnel */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3D52A0]/10 mb-4">
              <CheckCircle2 size={36} className="text-[#3D52A0]" aria-hidden />
            </div>
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-[#1E1B4B] leading-snug">
              {isPaid ? (
                <>Rendez-vous<br />confirmé et payé.</>
              ) : (
                <>Votre rendez-vous<br />est confirmé !</>
              )}
            </h1>
            <p className="mt-3 text-base text-gray-500">
              {isPaid
                ? 'Votre paiement a été accepté et votre rendez-vous est confirmé.'
                : 'Votre rendez-vous est confirmé. Vous recevrez un rappel avant la séance.'}
            </p>
          </div>

          {/* Payment confirmation */}
          {isPaid && (
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 mb-6 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 mb-1">Paiement confirmé</p>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  Un reçu vous a été envoyé par email. Aucune autre action n&apos;est requise de votre part.
                </p>
              </div>
            </div>
          )}

          {/* Card prochaine étape */}
          <div className="bg-white rounded-2xl border-l-4 border-l-[#3D52A0] border border-[#E5E7EB] p-6 mb-6 shadow-sm">
            <p className="text-sm font-semibold text-[#1E1B4B] mb-1">Prochaine étape</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {isPaid
                ? 'Vous recevrez un email de confirmation avec les informations pratiques pour votre rendez-vous.'
                : <>Vous recevrez un rappel par email avant votre séance. En cas d&apos;empêchement, vous pouvez annuler via le lien dans votre email de confirmation.</>}
            </p>
            {id && (
              <p className="text-xs text-gray-400 mt-3">
                Référence : <span className="font-mono">{id.slice(0, 8).toUpperCase()}</span>
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
              href={`/psy/${slug}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#F1F0F9] text-[#1E1B4B] text-sm font-semibold hover:bg-[#E8E6F8] transition-colors"
            >
              <ArrowLeft size={16} aria-hidden />
              Voir le profil
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Données confidentielles · Hébergées en France (HDS) ·{' '}
            <Link href="/trouver-mon-psy" className="text-[#3D52A0] hover:underline">
              Trouver un autre psy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
