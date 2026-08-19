"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const PUBLIC_PATHS = ["/Login", "/Signup", "/OTP"];

export default function AuthGate({ children }) {
  const pathname = usePathname();
  const [email, setEmail] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      setEmail(window.localStorage.getItem("email"));
      setReady(true);
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  const isPublic = PUBLIC_PATHS.some((path) => pathname?.startsWith(path));
  if (!ready) return null;
  if (isPublic || email) return children;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-pink-50 p-6">
      <section className="w-full max-w-md rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-xl shadow-pink-200">
        <h1 className="text-2xl font-bold text-gray-800">Login required</h1>
        <p className="mt-3 text-sm text-pink-500">Please login first to access this page.</p>
        <Link href="/Login" className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-3 font-semibold text-white transition hover:scale-[1.02]">Login</Link>
      </section>
    </main>
  );
}
