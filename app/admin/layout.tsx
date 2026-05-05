import Image from "next/image";
import Link from "next/link";

import OperatorUserMenu from "@/components/share/operator-user-menu";
import { requireOperator } from "@/services/auth";

export const runtime = "nodejs";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const operator = await requireOperator();

  return (
    <div>
      <header className="sticky top-0 z-50 border-b border-[var(--gold)] bg-black/80 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="mx-auto flex w-full items-center justify-between gap-5 px-6 py-4 sm:px-10 lg:px-16 xl:px-20 2xl:px-24">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="InterJudaica home"
          >
            <Image
              src="/logo-interjudaica-transparente.png"
              alt="InterJudaica logo"
              width={1500}
              height={1500}
              className="h-12 w-12 shrink-0 rounded-full"
              priority
            />
            <span className="grid min-w-0 leading-none">
              <span className="font-display text-xl font-semibold uppercase tracking-[0.18em] text-[var(--gold)] sm:text-2xl">
                InterJudaica
              </span>
              <span className="mt-1 hidden text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[var(--gold)] sm:block">
                Backoffice
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <OperatorUserMenu
              firstName={operator.firstName ?? ""}
              lastName={operator.lastName ?? ""}
              email={operator.email}
            />
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
