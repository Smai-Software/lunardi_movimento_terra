import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutForm from "@/components/logout-form";

export default async function NotFound() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h1 className="text-4xl font-bold">404</h1>
          <h2 className="text-xl font-semibold">Pagina non trovata</h2>
          <p className="text-base-content/80">
            La pagina richiesta non esiste o non è più disponibile.
          </p>
          <div className="card-actions mt-4 flex flex-col gap-3">
            <Link href="/" className="btn btn-primary">
              Torna alla pagina principale
            </Link>
          </div>
          {session && (
              <div className="flex flex-col items-center gap-2 pt-6">
                <p className="text-sm text-base-content/70">
                  Se il problema persiste, effettuare il logout e riprovare.
                </p>
                <LogoutForm />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
