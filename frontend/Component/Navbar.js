
'use client'
import React from 'react'
import Link from 'next/link'
import { useState,useEffect } from 'react'
import {
  LayoutGrid,
  CalendarDays,
  Timer,
  BookOpen,
  ClipboardList,
  BarChart3,
  Settings,
  Brain,
} from 'lucide-react'

// next.js mai routing with the help of link hoti hai
const Navbar = () => {

 
   const [username, setusername] = useState('');
   const [logout, setlogout] = useState(false);

   
   

   useEffect(() => {
     const storedemail=localStorage.getItem("email");
    const storedusername=localStorage.getItem("username");
     if(storedusername){
      console.log("username",storedusername);
      setusername(storedusername);
     }
   }, [])

   function handleLogout(){
    if(storedusername && storedemail){
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    setlogout(false);
    }
    else{
      alert("Please Login first!");
      return;
    }
    return;

   }
   

  return (
    <div className="bg-gradient-to-b from-pink-600 to-purple-600 w-[220px] min-w-[220px] h-screen p-4 flex flex-col text-white">
      <div className="flex items-center gap-2 px-2 mb-7">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Brain size={16} />
        </div>
        <h1 className="font-bold text-[15px]">AI Study Planner</h1>
        
      </div>

      <ul className="flex flex-col gap-1">
        <p>{username}</p>
        <li>
          <Link
            href="/Dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/25 text-white font-semibold text-sm"
          >
            <LayoutGrid size={17} />
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="/planner"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 font-medium text-sm transition-colors"
          >
            <CalendarDays size={17} />
            Study Plan
          </Link>
        </li>
        <li>
          <Link
            href="/promodro"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 font-medium text-sm transition-colors"
          >
            <Timer size={17} />
            Pomodoro
          </Link>
        </li>
        <li>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 font-medium text-sm transition-colors"
          >
            <BookOpen size={17} />
            Topics
          </Link>
        </li>
        <li>
          <Link
            href="/Test"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 font-medium text-sm transition-colors"
          >
            <ClipboardList size={17} />
            Test
          </Link>
        </li>
        <li>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 font-medium text-sm transition-colors"
          >
            <BarChart3 size={17} />
            Analytics
          </Link>
        </li>
        <li>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            <Settings size={17} />
            Settings
          </Link>
        </li>
         <li>
          <Link
            href="/Login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 font-medium text-sm transition-colors"
          >
            <Timer size={17} />
            Login
          </Link>
        </li>
         <li>
          <Link
            href="/Signup"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 font-medium text-sm transition-colors"
          >
            <Timer size={17} />
            Signup
          </Link>

          <Link
            href="/Notes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 font-medium text-sm transition-colors"
          >
            <Timer size={17} />
            Notes
          </Link>
        </li>
        
          <p onClick={(e)=>{
            console.log("logout",logout);
            setlogout(true);
            console.log("logout",logout);
          }} className='flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 font-medium text-sm transition-colors'>Logout</p>
        
           {logout && (
            <div className='w-[100%] p-3  rounded-2xl bg-amber-800'>
              <p className='text-[82%]'>Are you sure you want to Logout?</p>
              <div className='flex gap-1'>
              <button onClick={handleLogout} className="w-50 p-1 bg-amber-400 border rounded-2xl mt-2 text-[82%]">Yes</button>
              <button onClick={(e)=>{setlogout(false)}} className="w-50 p-1 bg-amber-400 border rounded-2xl mt-2 text-[82%]">No</button>
              </div>
            </div>
           )}
      </ul>

      <div className="mt-auto bg-white/15 rounded-xl px-3 py-3 text-center">
        <div className="text-[11px] tracking-wide font-semibold opacity-85">
          OVERALL SCORE
        </div>
      </div>
    </div>
  )
}

export default Navbar
