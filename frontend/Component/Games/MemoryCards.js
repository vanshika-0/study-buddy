"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";

const SYMBOLS = ["🌙", "⭐", "🌸", "🍃", "☁️", "🌼", "🌿", "✨", "🌻", "🪷", "🌱", "🌺"];
const LEVELS = { Easy: 6, Medium: 8, Hard: 12 };
const makeCards = (difficulty) => [...SYMBOLS.slice(0, LEVELS[difficulty]).flatMap((symbol, pair) => [{ id: `${pair}-a`, symbol }, { id: `${pair}-b`, symbol }])].sort(() => Math.random() - 0.5);

export default function MemoryCards({ onBack }) {
  const [difficulty, setDifficulty] = useState("Easy");
  const [cards, setCards] = useState(() => makeCards("Easy"));
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [busy, setBusy] = useState(false);

  const playTone = useCallback((frequency = 440, duration = 0.08) => {
    if (typeof window !== "undefined" && localStorage.getItem("study-sound") === "false") return;
    try {
      const context = new window.AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + duration);
    } catch { /* Audio is optional when the browser blocks it. */ }
  }, []);

  const reset = () => {
    setCards(makeCards(difficulty)); setFlipped([]); setMatched([]); setBusy(false);
  };
  const changeDifficulty = (level) => {
    setDifficulty(level); setCards(makeCards(level)); setFlipped([]); setMatched([]); setBusy(false);
  };
  const complete = cards.length > 0 && matched.length === cards.length;
  const gridClass = useMemo(() => difficulty === "Hard" ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4", [difficulty]);

  const flip = (card) => {
    if (busy || flipped.includes(card.id) || matched.includes(card.id)) return;
    playTone(390);
    const next = [...flipped, card.id]; setFlipped(next);
    if (next.length !== 2) return;
    setBusy(true);
    const first = cards.find((item) => item.id === next[0]);
    const isMatch = first.symbol === card.symbol;
    window.setTimeout(() => {
      if (isMatch) { playTone(620, 0.14); setMatched((items) => [...items, first.id, card.id]); }
      setFlipped([]); setBusy(false);
    }, isMatch ? 420 : 700);
  };

  return <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 p-5 sm:p-10"><div className="mx-auto max-w-3xl"><button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-pink-600"><ArrowLeft size={17} /> Back to Games</button><section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-xl shadow-pink-100 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-3xl">🌙 ⭐ 🍃</p><h1 className="mt-2 text-2xl font-bold text-gray-800">Memory Cards 🧠</h1><p className="mt-1 text-sm text-gray-500">Take your time and find the matching pairs.</p></div><div className="flex rounded-2xl bg-purple-50 p-1">{Object.keys(LEVELS).map((level) => <button key={level} onClick={() => changeDifficulty(level)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${difficulty === level ? "bg-purple-600 text-white" : "text-purple-500 hover:bg-white"}`}>{level}</button>)}</div></div>{complete ? <div className="mt-8 rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 p-10 text-center"><p className="text-4xl">🌸 ✨ 🌿</p><h2 className="mt-4 text-xl font-bold text-gray-800">A peaceful little win.</h2><p className="mt-2 text-sm text-purple-500">You found every pair. Well done.</p><button onClick={reset} className="mt-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white"><RotateCcw size={15} className="mr-2 inline" />Play Again</button></div> : <div className={`mt-8 grid ${gridClass} gap-3 sm:gap-4`}>{cards.map((card) => { const showing = flipped.includes(card.id) || matched.includes(card.id); return <button key={card.id} onClick={() => flip(card)} aria-label={showing ? `Card ${card.symbol}` : "Hidden memory card"} className="aspect-square [perspective:700px]"><span className={`relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${showing ? "[transform:rotateY(180deg)]" : ""}`}><span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 text-2xl text-white shadow-md [backface-visibility:hidden]">✦</span><span className="absolute inset-0 flex items-center justify-center rounded-2xl border border-pink-100 bg-pink-50 text-3xl shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">{card.symbol}</span></span></button>; })}</div>}</section></div></main>;
}
