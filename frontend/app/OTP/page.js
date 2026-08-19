"use client";
import React, { useState } from "react";
import { Brain, Eye, EyeOff, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

const Page = () => {
  const [EnteredOTP, setEnteredOTP] = useState("");
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const password = searchParams.get("password");
  const username = searchParams.get("username");

  //resend
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [showResend, setShowResend] = useState(false);

  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("pss", password);
    console.log({
      email,
      otp: EnteredOTP,
      password,
    });

    try {
      console.log("before calling");
      const response = await fetch(apiUrl("/verifyOTP"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: EnteredOTP, password,username }),
      });
      console.log("after calling");
      const data = await response.json();
      console.log(data);
      if (!response.ok) {
        console.log(data.message);
        throw new Error("Failed to verify OTP");
      }
      

      router.push("/Login");

      console.log("12");
    } catch (e) {
      console.log("Error while verifying otp on OTP pg", e);
      return;
    }
    // add your login logic here
  }
  

  
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
              type="number"
              placeholder="Enter OTP"
              value={EnteredOTP}
              onChange={(e) => setEnteredOTP(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="mt-2 p-4 w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Verify
          </button>
        </form>
      </div>
    </div>
  );
};

export default Page;
