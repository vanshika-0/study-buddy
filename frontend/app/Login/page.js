"use client";
import React, { useState } from "react";
import { Brain, Eye, EyeOff, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

const Page = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await fetch(apiUrl("/Login"), {
        method: "POST",
        
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        throw new Error("error while login");
      }
      const data = await response.json();
      console.log(data.message);

      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);
      window.dispatchEvent(new Event("auth-changed"));
    
      const storedusername = localStorage.getItem("username");
     
      console.log(storedusername);
      router.push("/Dashboard");
    } catch (e) {
      console.log("Error while logging in on Login pg", e);
    }
  }

  function handleSignin() {}

  return (
    <div className="min-h-screen w-full bg-pink-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-pink-100 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-100 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 bg-gradient-to-br from-pink-50 to-pink-100 p-8 sm:p-10 rounded-3xl shadow-2xl shadow-pink-900/40 border border-pink-200/50"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-pink-700 text-sm font-medium ml-1">
              Email
            </label>
            <input
              className="p-4 w-full bg-white/70 border border-pink-200 rounded-2xl text-pink-700 placeholder-pink-300 outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-pink-700 text-sm font-medium ml-1">
              Password
            </label>
            <div className="relative">
              <input
                className="p-4 w-full bg-white/70 border border-pink-200 rounded-2xl text-pink-700 placeholder-pink-300 outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition pr-12"
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end -mt-2">
            <button
              type="button"
              className="text-pink-500 text-sm hover:text-pink-700 transition"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="mt-2 p-4 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Login
          </button>

          <p className="text-center text-pink-400 text-sm mt-1">
            New here?{" "}
            <button
              type="button"
              className="text-pink-600 font-medium hover:underline"
              onClick={handleSignin}
            >
              Create an account
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Page;
