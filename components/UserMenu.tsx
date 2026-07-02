"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, User as UserIcon, UserCog } from "lucide-react";

import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/types";

// Mask the middle of a phone number, keeping the country code + last 3
// digits: "+919876543210" → "+9198765•••210". Falls back gracefully for
// short/odd values.
function maskPhone(p: string) {
  const digits = p.replace(/\D/g, "");
  if (digits.length < 6) return p;
  const prefix = p.startsWith("+") ? "+" : "";
  return `${prefix}${digits.slice(0, digits.length - 6)}•••${digits.slice(-3)}`;
}

/** Signed-in chip + dropdown shown in the navbar in place of "Sign in". */
export default function UserMenu({
  user,
  onSignOut,
}: {
  user: AuthUser;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-brand/40 hover:text-brand">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-r from-brand to-violet text-white">
            <UserIcon className="h-3.5 w-3.5" />
          </span>
          {user.phone ? maskPhone(user.phone) : user.email ?? "Account"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-3 py-2">
          <p className="text-xs font-bold text-ink-soft">Signed in as</p>
          <p className="text-sm font-semibold text-ink">{user.phone ?? user.email ?? "—"}</p>
        </div>
        <div className="my-1 h-px bg-line" />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <UserCog className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <div className="my-1 h-px bg-line" />
        <DropdownMenuItem onSelect={onSignOut} className="text-coral hover:bg-coral/5 focus:bg-coral/5">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
