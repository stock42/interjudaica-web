"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import OperatorUserMenu from "@/components/share/operator-user-menu";
import StudentUserMenu from "@/components/share/student-user-menu";

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
      <OperatorUserMenu
        firstName={operator.firstName ?? ""}
        lastName={operator.lastName ?? ""}
        email={operator.email}
      />
    );
  }

  if (user) {
    return (
      <StudentUserMenu
        firstName={user.firstName ?? ""}
        lastName={user.lastName ?? ""}
        email={user.email}
      />
    );
  }

  return (
    <>
      <Link
        href="/login"
        className={`hidden min-h-11 items-center justify-center rounded-md border border-transparent bg-transparent px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--line)] hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)] sm:inline-flex ${
          loaded ? "" : "opacity-70"
        }`}
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--gold)] bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[#07090c] transition hover:bg-[#ffd66b]"
      >
        Join
      </Link>
    </>
  );
}
