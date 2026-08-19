'use client'
import React, { useState } from 'react'
import { Brain, Eye, EyeOff, Sparkles } from 'lucide-react'
import {useRouter} from "next/navigation";
import { apiUrl } from "@/lib/api";



//agr next js mai ek pg se dusre pg pe jana hai toh ---useRouter and we also have to send data like email which constain special charac we encode it and thtn send it 

const Page = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("passii",password);
    try{
    const response = await fetch(apiUrl("/sendOTP"),{

        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({email:email}),
    })
    if(!response.ok){

        throw new Error(response.detail);
    }
    
  router.push(
  `/OTP?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&username=${encodeURIComponent(username)}`
);

}
catch(e){
    alert("error while sigining up",e);
    
    return;
}
    
    

    // add your login logic here
  };

 

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
            <label className="text-pink-700 text-sm font-medium ml-1">Username</label>
            <input
              className="p-4 w-full bg-white/70 border border-pink-200 rounded-2xl text-pink-700 placeholder-pink-300 outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>


          <div className="flex flex-col gap-1.5">
            <label className="text-pink-700 text-sm font-medium ml-1">Email</label>
            <input
              className="p-4 w-full bg-white/70 border border-pink-200 rounded-2xl text-pink-700 placeholder-pink-300 outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-pink-700 text-sm font-medium ml-1">Password</label>
            <div className="relative">
              <input
                className="p-4 w-full bg-white/70 border border-pink-200 rounded-2xl text-pink-700 placeholder-pink-300 outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition pr-12"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
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
  )
}

export default Page
