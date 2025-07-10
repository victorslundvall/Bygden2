"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/supabaseClient";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/videos", label: "Videos" },
  { href: "/preview", label: "Preview" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide navbar on /tv/[restaurantId] routes
  if (pathname.startsWith("/tv/")) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm mb-8 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex gap-4">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-medium px-3 py-2 rounded hover:bg-blue-50 transition ${pathname === link.href ? "bg-blue-100 text-blue-700" : "text-gray-700"}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
} 