"use client";
import { useEffect, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";

const THOUGHTS = [
  "I have so much to study",
  "What if I fail?",
  "I'm running out of time",
  "I'll do it later",
  "I'm getting distracted",
  "This is too much",
];
const MESSAGES = [
  "One step at a time 🌱",
  "You can handle this ✨",
  "That thought can float away 💨",
  "Breathe and begin 🌿",
];
const INITIAL_BUBBLES = THOUGHTS.map((text, i) => ({
  id: `initial-${i}`,
  text,
  left: 8 + ((i * 16) % 74),
  top: 10 + ((i * 23) % 62),
  size: 100,
}));

export default function PopThought({ onResume }) {
  const [bubbles, setBubbles] = useState(INITIAL_BUBBLES),
    [message, setMessage] = useState(""),
    [messageIndex, setMessageIndex] = useState(0),
    [done, setDone] = useState(false),
    [seconds, setSeconds] = useState(60);
  const start = () => {
    setBubbles(
      THOUGHTS.map((text, i) => ({
        id: `${Date.now()}-${i}`,
        text,
        left: 8 + Math.random() * 78,
        top: 8 + Math.random() * 70,
        size: 86 + Math.random() * 48,
      })),
    );
    setMessage("");
    setDone(false);
    setSeconds(60);
  };
  useEffect(() => {
    if (done || !bubbles.length || seconds <= 0) return undefined;
    const id = setInterval(
      () =>
        setSeconds((v) => {
          if (v <= 1) {
            setDone(true);
            return 0;
          }
          return v - 1;
        }),
      1000,
    );
    return () => clearInterval(id);
  }, [done, bubbles.length, seconds]);
  const pop = (id) => {
    setBubbles((items) => {
      const next = items.filter((item) => item.id !== id);
      if (!next.length) setDone(true);
      return next;
    });
    setMessageIndex((value) => {
      setMessage(MESSAGES[value % MESSAGES.length]);
      return value + 1;
    });
  };
  const progress = (bubbles.length / THOUGHTS.length) * 100;
  return (
    <section className="rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 to-pink-50 p-5 shadow-lg shadow-pink-100">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-3xl">🫧</span>
          <h2 className="mt-2 text-xl font-bold text-gray-800">
            Pop the Thought
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Pop distracting thoughts and make room to breathe.
          </p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-pink-600">
          {seconds}s
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-pink-100">
        <div
          className="h-full bg-gradient-to-r from-pink-400 to-pink-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="relative mt-4 h-64 overflow-hidden rounded-2xl bg-white/50">
        {!done &&
          bubbles.map((bubble) => (
            <button
              key={bubble.id}
              onClick={() => pop(bubble.id)}
              className="thought-bubble absolute rounded-full bg-white/90 px-3 text-center text-xs font-semibold text-pink-700 shadow-lg shadow-pink-200 transition hover:scale-110 active:scale-75"
              style={{
                left: `${bubble.left}%`,
                top: `${bubble.top}%`,
                width: bubble.size,
                height: bubble.size,
              }}
            >
              {bubble.text}
            </button>
          ))}
        {done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl">🌿</span>
            <p className="mt-2 font-bold text-gray-800">Mind Cleared!</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={start}
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-pink-600"
              >
                <RotateCcw size={13} className="mr-1 inline" />
                Play Again
              </button>
              <button
                onClick={onResume}
                className="rounded-xl bg-pink-600 px-3 py-2 text-xs font-semibold text-white"
              >
                Resume Studying
              </button>
            </div>
          </div>
        )}
      </div>
      {message && !done && (
        <p className="mt-3 text-center text-sm font-medium text-pink-600 animate-pulse">
          {message}
        </p>
      )}
    </section>
  );
}
