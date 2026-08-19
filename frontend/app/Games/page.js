'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PopThought from '@/Component/Games/PopThought'
import ConstellationCalm from '@/Component/Games/ConstellationCalm'
import MemoryCards from '@/Component/Games/MemoryCards'

export default function GamesPage() {
  const router = useRouter()
  const [activeGame, setActiveGame] = useState(null)
  const resume = () => router.push('/promodro')
  if (activeGame === 'memory') return <MemoryCards onBack={() => setActiveGame(null)} />
  return <main className="min-h-screen bg-gradient-to-b from-pink-50 to-pink-50 p-5 sm:p-10"><div className="mx-auto max-w-5xl"><div className="mb-8 text-center"><h1 className="text-3xl font-bold text-gray-800">🎮 Take a Little Break</h1><p className="mt-2 text-sm text-pink-500">Relax your mind, have some fun, and come back refreshed.</p></div><div className="grid gap-5 lg:grid-cols-2"><PopThought onResume={resume} /><ConstellationCalm onResume={resume} /><button onClick={() => setActiveGame('memory')} className="group rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 to-pink-50 p-5 text-left shadow-lg shadow-pink-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="flex h-64 items-center justify-center rounded-2xl bg-white/60 text-7xl transition-transform duration-300 group-hover:scale-105">🌙 ⭐ 🌸</div><h2 className="mt-4 text-xl font-bold text-gray-800">Memory Cards 🧠</h2><p className="mt-1 text-sm text-gray-500">Relax your mind with a simple memory game.</p></button></div><p className="mt-8 text-center text-sm text-pink-500">🌿 Feeling refreshed? <button onClick={resume} className="font-bold underline">Resume Focus Session</button></p></div></main>
}
