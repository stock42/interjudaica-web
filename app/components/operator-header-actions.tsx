"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HeaderOperator = {
  uuid: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  level: number;
};

type HeaderUser = {
  uuid: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

function personName(person: HeaderOperator | HeaderUser) {
  const name = [person.firstName, person.lastName].filter(Boolean).join(" ");
  return name || person.email;
}

export function OperatorHeaderActions() {
  const [operator, setOperator] = useState<HeaderOperator | null>(null);
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSessions() {
      const [operatorResponse, userResponse] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }).catch(() => null),
        fetch("/api/user-auth/me", { cache: "no-store" }).catch(() => null),
      ]);

      if (!active) {
        return;
      }

      if (operatorResponse?.ok) {
        const data = await operatorResponse.json().catch(() => ({}));
        setOperator(data.operator ?? null);
      }

      if (userResponse?.ok) {
        const data = await userResponse.json().catch(() => ({}));
        setUser(data.user ?? null);
      }

      setLoaded(true);
    }

    loadSessions();

    return () => {
      active = false;
    };
  }, []);

  if (operator) {
    return (
      <>
        <div className="hidden min-w-0 max-w-48 text-right sm:block">
          <p className="truncate text-xs font-bold uppercase text-[var(--muted)]">
            Operator
          </p>
          <p className="truncate text-sm font-semibold text-[var(--ink)]">
            {personName(operator)}
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[var(--sapphire)] hover:bg-[var(--sapphire)]"
        >
          Backoffice
        </Link>
      </>
    );
  }

  if (user) {
    return (
      <>
        <div className="hidden min-w-0 max-w-48 text-right sm:block">
          <p className="truncate text-xs font-bold uppercase text-[var(--muted)]">
            Student
          </p>
          <p className="truncate text-sm font-semibold text-[var(--ink)]">
            {personName(user)}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[var(--sapphire)] hover:bg-[var(--sapphire)]"
        >
          Dashboard
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className={`hidden min-h-11 items-center justify-center rounded-full border border-transparent bg-transparent px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-white sm:inline-flex ${
          loaded ? "" : "opacity-70"
        }`}
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--ink)] bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[var(--sapphire)] hover:bg-[var(--sapphire)]"
      >
        Join
      </Link>
    </>
  );
}
