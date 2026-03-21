import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7FF] px-6 py-16">
      <div className="text-center max-w-md space-y-6">
        <p className="text-6xl font-bold text-[#3D52A0] font-playfair">404</p>
        <h1 className="text-2xl font-semibold text-[#1E1B4B] font-playfair">
          Page introuvable
        </h1>
        <p className="text-[#1E1B4B]/70 font-dm-sans leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-3 pt-2 font-dm-sans">
          <Link
            href="/"
            className="rounded-lg bg-[#3D52A0] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3D52A0]/90"
          >
            Accueil
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[#3D52A0]/20 px-5 py-2.5 text-sm font-medium text-[#3D52A0] transition-colors hover:bg-[#3D52A0]/5"
          >
            Dashboard
          </Link>
          <Link
            href="/faq"
            className="rounded-lg border border-[#3D52A0]/20 px-5 py-2.5 text-sm font-medium text-[#3D52A0] transition-colors hover:bg-[#3D52A0]/5"
          >
            FAQ
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-[#3D52A0]/20 px-5 py-2.5 text-sm font-medium text-[#3D52A0] transition-colors hover:bg-[#3D52A0]/5"
          >
            Contact
          </Link>
        </nav>
      </div>
    </main>
  );
}
