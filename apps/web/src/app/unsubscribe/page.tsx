"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  const processUnsubscribe = useCallback(async (emailAddr: string) => {
    try {
      const res = await fetch("/api/cold-email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddr }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!email) {
      setStatus("error");
      return;
    }
    processUnsubscribe(email);
  }, [email, processUnsubscribe]);

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#3D52A0] border-t-transparent" />
        <p className="mt-4 text-gray-600">Traitement en cours...</p>
      </div>
    );
  }

  if (status === "error" && !email) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="mt-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
          Lien invalide
        </h2>
        <p className="mt-2 text-gray-600">
          Ce lien de desinscription semble incomplet. Contactez-nous a{" "}
          <a
            href="mailto:Psylib.eu@gmail.com"
            className="font-medium text-[#3D52A0] underline"
          >
            Psylib.eu@gmail.com
          </a>{" "}
          pour etre retire de notre liste.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-8 w-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="mt-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
        Desinscription confirmee
      </h2>
      <p className="mt-2 text-gray-600">
        Vous ne recevrez plus d&apos;emails de notre part.
      </p>
      {status === "error" && (
        <p className="mt-2 text-sm text-amber-600">
          Nous avons note votre demande. Si vous continuez a recevoir des
          emails, contactez{" "}
          <a
            href="mailto:Psylib.eu@gmail.com"
            className="font-medium underline"
          >
            Psylib.eu@gmail.com
          </a>
          .
        </p>
      )}
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F7FF] px-4 font-dm-sans">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="font-playfair text-2xl font-bold text-[#3D52A0]">
              PsyLib
            </span>
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#3D52A0] border-t-transparent" />
            </div>
          }
        >
          <UnsubscribeContent />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-xs text-gray-400">
        PsyLib &mdash; La plateforme des psychologues liberaux
      </p>
    </main>
  );
}
