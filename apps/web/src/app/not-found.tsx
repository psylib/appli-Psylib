import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Page introuvable</h2>
        <p className="text-muted-foreground">Cette page n&apos;existe pas.</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors min-h-touch"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
