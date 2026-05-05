"use client"

import Link from "next/link"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export default function StudentUserMenu({
  firstName,
  lastName,
  email,
}: {
  firstName: string
  lastName: string
  email: string
}) {
  const initials = `${(firstName || "U")[0] ?? "U"}${(lastName || "")[0] ?? ""}`
    .toUpperCase()
    .trim()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-full border border-[var(--gold)] bg-black/40 px-4 py-2 text-sm font-semibold text-[var(--gold)] transition hover:bg-[rgba(244,189,51,0.12)]"
        >
          <Avatar size="sm" className="border border-[rgba(244,189,51,0.55)]">
            <AvatarFallback className="bg-[#050608] text-[var(--gold)]">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[12rem] truncate sm:block">
            {firstName || email}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{firstName ? `${firstName} ${lastName}` : email}</PopoverTitle>
          <p className="text-xs text-muted-foreground">Student account</p>
        </PopoverHeader>

        <Separator />

        <Link
          href="/dashboard"
          className="rounded-md px-2.5 py-2 text-sm font-medium transition hover:bg-muted"
        >
          Dashboard
        </Link>

        <form action="/api/user-auth/logout" method="post">
          <button
            type="submit"
            className="w-full rounded-md px-2.5 py-2 text-left text-sm font-medium transition hover:bg-muted"
          >
            Logout
          </button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
