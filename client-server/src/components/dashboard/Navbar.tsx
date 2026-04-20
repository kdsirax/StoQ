"use client";

import Link from "next/link";
import { Search, UserCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

type NavbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

export default function Navbar({
  searchQuery,
  onSearchChange,
}: NavbarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <nav className="w-full rounded-xl bg-white/80 backdrop-blur-xl shadow-md border border-slate-200 px-4 md:px-6 py-4">
      
      {/*top */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        {/* TOP ROW */}
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logoonly-removebg-preview.png"
              alt="StoQ Icon"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <Image
              src="/symbolonly.png"
              alt="StoQ"
              width={80}
              height={32}
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* User */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "User"}
                    width={36}
                    height={36}
                    className="rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCircle2 size={26} className="text-slate-600" />
                )}

                <Button
                  variant="outline"
                  className="rounded-lg border-slate-200 text-xs px-3 py-1"
                  onClick={() => signOut({ callbackUrl: "/dashboard" })}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  className="rounded-lg border-slate-200 text-xs px-3 py-1"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* NAV LINKS */}
        <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
          <Link href="/dashboard" className="hover:text-blue-600 transition">
            News
          </Link>
          <Link href="/portfolio" className="hover:text-blue-600 transition">
            Portfolio
          </Link>
          <Link href="/demo" className="hover:text-blue-600 transition">
            Analyze News
          </Link>
        </div>

        {/* SEARCH */}
        <div className="flex items-center relative w-full lg:w-[340px]">
          <Search size={18} className="absolute left-3 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search stocks, sectors, news..."
            className="pl-10 rounded-lg bg-slate-50 border-slate-200 w-full"
          />
        </div>

      </div>
    </nav>
  );
}
