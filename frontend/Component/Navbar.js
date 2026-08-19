
'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState,useEffect } from 'react'
import {
  CalendarDays,
  Timer,
  BookOpen,
  ClipboardList,
  Settings,
  Brain,
  UserCircle,
  LogOut,
  Gamepad2,
} from 'lucide-react'

// next.js mai routing with the help of link hoti hai
const Navbar = () => {

   const pathname = usePathname();
   const [username, setusername] = useState('');
   const [email, setEmail] = useState('');
   const [logout, setlogout] = useState(false);
   const [blockedMessage, setBlockedMessage] = useState('');

   
   

   useEffect(() => {
     const syncAuth = () => { setusername(localStorage.getItem('username') || ''); setEmail(localStorage.getItem('email') || '') }
     syncAuth(); window.addEventListener('storage', syncAuth); window.addEventListener('auth-changed', syncAuth)
     return () => { window.removeEventListener('storage', syncAuth); window.removeEventListener('auth-changed', syncAuth) }
   }, [])

   function handleLogout(){
    const storedemail=localStorage.getItem("email");
    const storedusername=localStorage.getItem("username");
    if(storedusername && storedemail){
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    window.dispatchEvent(new Event('auth-changed'));
    setlogout(false);
    }
    else{
      alert("Please Login first!");
      return;
    }
    return;

   }

   function handleProtectedClick(event) {
    if (!email) {
      event.preventDefault();
      setBlockedMessage('Please login first to access this page.');
    }
   }

   function navClass(href, settings = false) {
    const active = settings ? pathname === '/' : pathname === href;
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl ${active ? 'bg-white/25 text-white font-semibold' : 'text-white/80 hover:bg-white/10 font-medium'} text-sm transition-colors`;
   }
   

  return (
    <aside className="relative z-30 w-full min-w-0 shrink-0 overflow-visible bg-gradient-to-b from-pink-600 via-fuchsia-600 to-purple-600 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-row flex-wrap items-center gap-4 px-6 py-4 sm:px-10">
      <div className="flex shrink-0 items-center gap-2 px-2">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
          <Brain size={16} />
        </div>
         <Link
            href="/Dashboard" 
            className='font-bold text-[15px]'
          >
           AI Study Planner
          </Link>
        
         
      </div>

      <ul className="flex min-w-0 flex-1 flex-row flex-wrap items-center justify-end gap-1">
        <li>
          <Link
            href="/planner" onClick={handleProtectedClick}
            className={navClass('/planner')}
          >
            <CalendarDays size={17} />
            Study Plan
          </Link>
        </li>
        <li>
          <Link
            href="/promodro" onClick={handleProtectedClick}
            className={navClass('/promodro')}
          >
            <Timer size={17} />
            Pomodoro
          </Link>
        </li>
       
        <li>
          <Link href="/Test" onClick={handleProtectedClick} className={navClass('/Test')}>
            <ClipboardList size={17} />
            Test
          </Link>
        </li>
        <li>
          <Link
            href="/" onClick={handleProtectedClick}
            className={navClass('/', true)}
          >
            <Settings size={17} />
            Settings
          </Link>
        </li>
         {!email && <li>
          <Link
            href="/Login"
            className={navClass('/Login')}
          >
            <Timer size={17} />
            Login
          </Link>
        </li>}
         {!email && <li>
          <Link
            href="/Signup"
            className={navClass('/Signup')}
          >
            <Timer size={17} />
            Signup
          </Link>

        </li>}
        <li><Link href="/Notes" onClick={handleProtectedClick} className={navClass('/Notes')}><Timer size={17} />Notes</Link></li>
        <li><Link href="/Games" onClick={handleProtectedClick} className={navClass('/Games')}><Gamepad2 size={17} />Games</Link></li>
        {blockedMessage && !email && <div className="rounded-2xl border border-white/25 bg-white/15 p-3"><p className="text-xs text-white">{blockedMessage}</p><Link href="/Login" onClick={() => setBlockedMessage('')} className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-purple-700">Login</Link></div>}
        {email && <li className="relative">
          <button type="button" onClick={() => setlogout((value) => !value)} className={navClass('profile')}>
            <UserCircle size={17} /> Profile
          </button>
          {logout && <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-white/20 bg-slate-950/90 p-3 shadow-lg">
            <p className="truncate text-sm font-semibold text-white">{username || 'Student'}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={handleLogout} className="flex-1 rounded-lg bg-white px-2 py-1.5 text-xs font-bold text-purple-700"><LogOut size={13} className="mr-1 inline" />Logout</button>
              <button onClick={() => setlogout(false)} className="flex-1 rounded-lg bg-white/15 px-2 py-1.5 text-xs text-white">Cancel</button>
            </div>
          </div>}
        </li>}
       </ul>
      </div>

     
    </aside>
  )
}

export default Navbar
